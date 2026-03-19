'use strict';

const Wishlist = require('../../models/Wishlist');
const Product = require('../../models/Product');
const AppError = require('../../utils/AppError');
const catchAsync = require('../../utils/catchAsync');

const getWishlist = catchAsync(async (req, res) => {
  const wishlist = await Wishlist.findOne({ user: req.user.id })
    .populate('products.product', 'name images basePrice discountedPrice productType stock isActive slug');
  res.status(200).json({ success: true, data: { wishlist: wishlist || { products: [] } } });
});

const addToWishlist = catchAsync(async (req, res, next) => {
  const { productId } = req.body;
  const product = await Product.findById(productId);
  if (!product || !product.isActive) return next(new AppError('Product not found.', 404));

  const wishlist = await Wishlist.findOneAndUpdate(
    { user: req.user.id },
    { $addToSet: { products: { product: productId } } },
    { upsert: true, new: true }
  ).populate('products.product', 'name images basePrice slug');

  res.status(200).json({ success: true, data: { wishlist } });
});

const removeFromWishlist = catchAsync(async (req, res) => {
  const wishlist = await Wishlist.findOneAndUpdate(
    { user: req.user.id },
    { $pull: { products: { product: req.params.productId } } },
    { new: true }
  );
  res.status(200).json({ success: true, message: 'Removed from wishlist.', data: { wishlist } });
});

module.exports = { getWishlist, addToWishlist, removeFromWishlist };