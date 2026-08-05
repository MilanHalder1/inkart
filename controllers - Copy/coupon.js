'use strict';

const Coupon = require('../models/Coupon');
const AppError = require('../utilities/AppError');
const catchAsync = require('../utilities/CatchAsync');


exports.createCoupon = catchAsync(async (req, res, next) => {
  const {
    code,
    description,
    discountType,
    discountValue,
    maxDiscountAmount,
    minOrderAmount,
    usageLimit,
    perUserLimit,
    validFrom,
    validUntil,
    isActive,
    applicableCategories
  } = req.body;

  const existing = await Coupon.findOne({ code: code.toUpperCase() });
  if (existing) return next(new AppError('Coupon already exists.', 400));

  const coupon = await Coupon.create({
    code: code.toUpperCase(),
    description,
    discountType,
    discountValue,
    maxDiscountAmount,
    minOrderAmount,
    usageLimit,
    perUserLimit,
    validFrom,
    validUntil,
    isActive,
    applicableCategories,
    createdBy: req.user.id
  });

  res.status(201).json({
    success: true,
    data: { coupon }
  });
});



exports.getAllCoupons = catchAsync(async (req, res) => {
  const coupons = await Coupon.find().sort('-createdAt');

  res.status(200).json({
    success: true,
    results: coupons.length,
    data: { coupons }
  });
});



exports.getCoupon = catchAsync(async (req, res, next) => {
  const coupon = await Coupon.findById(req.params.id);

  if (!coupon) return next(new AppError('Coupon not found.', 404));

  res.status(200).json({
    success: true,
    data: { coupon }
  });
});



exports.updateCoupon = catchAsync(async (req, res, next) => {
  const coupon = await Coupon.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  if (!coupon) return next(new AppError('Coupon not found.', 404));

  res.status(200).json({
    success: true,
    data: { coupon }
  });
});


exports.deleteCoupon = catchAsync(async (req, res, next) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);

  if (!coupon) return next(new AppError('Coupon not found.', 404));

  res.status(200).json({
    success: true,
    message: 'Coupon deleted successfully'
  });
});



exports.toggleCoupon = catchAsync(async (req, res, next) => {
  const coupon = await Coupon.findById(req.params.id);

  if (!coupon) return next(new AppError('Coupon not found.', 404));

  coupon.isActive = !coupon.isActive;
  await coupon.save();

  res.status(200).json({
    success: true,
    data: { coupon }
  });
});