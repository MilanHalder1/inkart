'use strict';

const Cart = require('../models/Cart');
const Product = require('../models/Product');
const AppError = require('../utilities/AppError');
const catchAsync = require('../utilities/CatchAsync');

const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId }).populate('items.product', 'name images basePrice discountedPrice productType stock variants isActive');
  if (!cart) cart = await Cart.create({ user: userId, items: [] });
  return cart;
};

const getCart = catchAsync(async (req, res) => {
  const cart = await getOrCreateCart(req.user.id);
  res.status(200).json({ success: true, data: { cart } });
});

const addToCart = catchAsync(async (req, res, next) => {
  const { productId, quantity = 1, variantId, customizationId } = req.body;

  const product = await Product.findById(productId);
  if (!product || !product.isActive) return next(new AppError('Product not found or unavailable.', 404));

  // Stock validation for stocked products
  if (product.productType === 'stocked') {
    if (product.variants.length > 0 && variantId) {
      const variant = product.variants.id(variantId);
      if (!variant) return next(new AppError('Variant not found.', 404));
      if (variant.stock < quantity) return next(new AppError(`Only ${variant.stock} units available.`, 400));
    } else {
      if (product.stock < quantity) return next(new AppError(`Only ${product.stock} units available.`, 400));
    }
  }

  const price = product.discountedPrice && product.discountedPrice < product.basePrice
    ? product.discountedPrice
    : product.basePrice;

  // Find variant price modifier
  let finalPrice = price;
  if (variantId) {
    const variant = product.variants.id(variantId);
    if (variant) finalPrice += variant.priceModifier || 0;
  }

  const cart = await Cart.findOneAndUpdate(
    { user: req.user.id },
    {},
    { upsert: true, new: true }
  );

  const existingItemIndex = cart.items.findIndex(
    (item) => item.product.toString() === productId &&
      (item.variantId ? item.variantId.toString() : null) === (variantId || null)
  );

  if (existingItemIndex > -1) {
    cart.items[existingItemIndex].quantity += quantity;
    cart.items[existingItemIndex].price = finalPrice;
  } else {
    cart.items.push({ product: productId, variantId: variantId || null, quantity, price: finalPrice, customizationId: customizationId || null });
  }

  await cart.save();
  const populated = await cart.populate('items.product', 'name images basePrice productType stock');
  res.status(200).json({ success: true, data: { cart: populated } });
});

const updateCartItem = catchAsync(async (req, res, next) => {
  const { quantity } = req.body;
  const cart = await Cart.findOne({ user: req.user.id });
  if (!cart) return next(new AppError('Cart not found.', 404));

  const item = cart.items.id(req.params.itemId);
  if (!item) return next(new AppError('Cart item not found.', 404));

  if (quantity <= 0) {
    item.deleteOne();
  } else {
    // Re-validate stock
    const product = await Product.findById(item.product);
    if (product?.productType === 'stocked' && product.stock < quantity) {
      return next(new AppError(`Only ${product.stock} units available.`, 400));
    }
    item.quantity = quantity;
  }

  await cart.save();
  res.status(200).json({ success: true, data: { cart } });
});

const removeFromCart = catchAsync(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user.id });
  if (!cart) return next(new AppError('Cart not found.', 404));

  const item = cart.items.id(req.params.itemId);
  if (!item) return next(new AppError('Cart item not found.', 404));

  item.deleteOne();
  await cart.save();
  res.status(200).json({ success: true, message: 'Item removed from cart.' });
});

const clearCart = catchAsync(async (req, res) => {
  await Cart.findOneAndUpdate({ user: req.user.id }, { items: [], coupon: null, couponDiscount: 0 });
  res.status(200).json({ success: true, message: 'Cart cleared.' });
});

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, clearCart };