'use strict';

const Cart = require('../models/Cart');
const Product = require('../models/Product');
const AppError = require('../utilities/AppError');
const catchAsync = require('../utilities/CatchAsync');

// ✅ Get or Create Cart
const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId })
    .populate('items.product', 'name images basePrice discountedPrice productType stock variants isActive');

  if (!cart) cart = await Cart.create({ user: userId, items: [] });

  return cart;
};

// ✅ GET CART
const getCart = catchAsync(async (req, res) => {
  const cart = await getOrCreateCart(req.user.id);

  res.status(200).json({
    success: true,
    data: { cart }
  });
});

// ✅ ADD TO CART (FIXED STOCK + MERGE LOGIC)
const addToCart = catchAsync(async (req, res, next) => {
  const { productId, quantity = 1, variantId, customizationId } = req.body;

  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    return next(new AppError('Product not found or unavailable.', 404));
  }

  // 🔍 Base price
  const basePrice =
    product.discountedPrice && product.discountedPrice < product.basePrice
      ? product.discountedPrice
      : product.basePrice;

  let finalPrice = basePrice;

  // 🔍 Variant handling
  let variant = null;
  if (variantId) {
    variant = product.variants.id(variantId);
    if (!variant) return next(new AppError('Variant not found.', 404));

    finalPrice += variant.priceModifier || 0;
  }

  // 🛒 Get/Create Cart
  const cart = await Cart.findOneAndUpdate(
    { user: req.user.id },
    {},
    { upsert: true, new: true }
  );

  const existingItemIndex = cart.items.findIndex(
    (item) =>
      item.product.toString() === productId &&
      (item.variantId ? item.variantId.toString() : null) === (variantId || null)
  );

  // 🔁 EXISTING ITEM → MERGE
  if (existingItemIndex > -1) {
    const existingItem = cart.items[existingItemIndex];
    const newQuantity = existingItem.quantity + quantity;

    // ✅ STOCK VALIDATION
    if (product.productType === 'stocked') {
      if (variant) {
        if (newQuantity > variant.stock) {
          return next(new AppError(`Only ${variant.stock} units available.`, 400));
        }
      } else {
        if (newQuantity > product.stock) {
          return next(new AppError(`Only ${product.stock} units available.`, 400));
        }
      }
    }

    existingItem.quantity = newQuantity;
    existingItem.price = finalPrice;
  } 
  // ➕ NEW ITEM
  else {
    if (product.productType === 'stocked') {
      if (variant) {
        if (quantity > variant.stock) {
          return next(new AppError(`Only ${variant.stock} units available.`, 400));
        }
      } else {
        if (quantity > product.stock) {
          return next(new AppError(`Only ${product.stock} units available.`, 400));
        }
      }
    }

    cart.items.push({
      product: productId,
      variantId: variantId || null,
      quantity,
      price: finalPrice,
      customizationId: customizationId || null
    });
  }

  await cart.save();

  const populated = await cart.populate('items.product', 'name images basePrice productType stock');

  res.status(200).json({
    success: true,
    data: { cart: populated }
  });
});

// ✅ UPDATE CART ITEM (INC / DEC)
const updateCartItem = catchAsync(async (req, res, next) => {
  const { action, value = 1 } = req.body;

  const cart = await Cart.findOne({ user: req.user.id });
  if (!cart) return next(new AppError('Cart not found.', 404));

  const item = cart.items.id(req.params.itemId);
  if (!item) return next(new AppError('Cart item not found.', 404));

  if (!['inc', 'dec'].includes(action)) {
    return next(new AppError('Invalid action. Use "inc" or "dec".', 400));
  }

  const product = await Product.findById(item.product);
  if (!product || !product.isActive) {
    return next(new AppError('Product no longer available.', 400));
  }

  let newQuantity = item.quantity;

  // ➕ INCREMENT
  if (action === 'inc') {
    newQuantity += value;

    if (product.productType === 'stocked') {
      if (item.variantId) {
        const variant = product.variants.id(item.variantId);
        if (!variant) return next(new AppError('Variant not found.', 404));

        if (newQuantity > variant.stock) {
          return next(new AppError(`Only ${variant.stock} units available.`, 400));
        }
      } else {
        if (newQuantity > product.stock) {
          return next(new AppError(`Only ${product.stock} units available.`, 400));
        }
      }
    }
  }

  // ➖ DECREMENT
  if (action === 'dec') {
    newQuantity -= value;
  }

  // ❌ REMOVE IF ZERO
  if (newQuantity <= 0) {
    item.deleteOne();
    await cart.save();

    return res.status(200).json({
      success: true,
      message: 'Item removed from cart.'
    });
  }

  item.quantity = newQuantity;

  await cart.save();

  res.status(200).json({
    success: true,
    data: { cart }
  });
});

// ✅ REMOVE SINGLE ITEM
const removeFromCart = catchAsync(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user.id });
  if (!cart) return next(new AppError('Cart not found.', 404));

  const item = cart.items.id(req.params.itemId);
  if (!item) return next(new AppError('Cart item not found.', 404));

  item.deleteOne();
  await cart.save();

  res.status(200).json({
    success: true,
    message: 'Item removed from cart.'
  });
});

// ✅ CLEAR CART
const clearCart = catchAsync(async (req, res) => {
  await Cart.findOneAndUpdate(
    { user: req.user.id },
    { items: [], coupon: null, couponDiscount: 0 }
  );

  res.status(200).json({
    success: true,
    message: 'Cart cleared.'
  });
});

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
};