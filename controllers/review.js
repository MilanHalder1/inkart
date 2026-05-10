'use strict';

const Review = require('../models/review');
const Product = require('../models/Product');

const AppError = require('../utilities/AppError');
const catchAsync = require('../utilities/CatchAsync');

const createReview = catchAsync(async (req, res, next) => {
  const { productId, rating, comment } = req.body;

  const product = await Product.findById(productId);

  if (!product) {
    return next(new AppError('Product not found.', 404));
  }

  const review = await Review.create({
    user: req.user.id,
    product: productId,
    rating,
    comment,
  });

  res.status(201).json({
    success: true,
    data: { review },
  });
});

const  getProductReviews = catchAsync(async (req, res) => {
  const reviews = await Review.find({
    product: req.params.productId,
  }).populate('user', 'name');

  res.status(200).json({
    success: true,
    results: reviews.length,
    data: { reviews },
  });
});

const deleteReview = catchAsync(async (req, res, next) => {
  const review = await Review.findOneAndDelete({
    _id: req.params.reviewId,
    user: req.user.id,
  });

  if (!review) {
    return next(new AppError('Review not found.', 404));
  }

  res.status(200).json({
    success: true,
    message: 'Review deleted.',
  });
});
module.exports={createReview,deleteReview,getProductReviews}