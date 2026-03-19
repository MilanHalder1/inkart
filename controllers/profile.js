'use strict';

const User = require('../models/User');
const Order = require('../models/Order');
const AppError = require('../utilities/AppError');
const catchAsync = require('../utilities/CatchAsync');

const getProfile = catchAsync(async (req, res) => {
  const user = await User.findById(req.user.id).select('-__v');
  res.status(200).json({ success: true, data: { user } });
});

const updateProfile = catchAsync(async (req, res, next) => {
  const { name, phone } = req.body;
  const updates = {};
  if (name) updates.name = name;
  if (phone) updates.phone = phone;
  if (req.file) {
    updates.avatar = { url: req.file.path, publicId: req.file.filename };
  }

  const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true });
  res.status(200).json({ success: true, data: { user } });
});

const addAddress = catchAsync(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (req.body.isDefault) {
    user.addresses.forEach((a) => { a.isDefault = false; });
  }
  user.addresses.push(req.body);
  await user.save({ validateBeforeSave: false });
  res.status(201).json({ success: true, data: { addresses: user.addresses } });
});

const updateAddress = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  const addr = user.addresses.id(req.params.addressId);
  if (!addr) return next(new AppError('Address not found.', 404));

  if (req.body.isDefault) {
    user.addresses.forEach((a) => { a.isDefault = false; });
  }
  Object.assign(addr, req.body);
  await user.save({ validateBeforeSave: false });
  res.status(200).json({ success: true, data: { addresses: user.addresses } });
});

const deleteAddress = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  const addr = user.addresses.id(req.params.addressId);
  if (!addr) return next(new AppError('Address not found.', 404));
  addr.deleteOne();
  await user.save({ validateBeforeSave: false });
  res.status(200).json({ success: true, data: { addresses: user.addresses } });
});

const getOrderHistory = catchAsync(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, parseInt(req.query.limit, 10) || 10);
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    Order.find({ user: req.user.id })
      .sort('-createdAt')
      .skip(skip)
      .limit(limit)
      .populate('items.product', 'name images slug'),
    Order.countDocuments({ user: req.user.id }),
  ]);

  res.status(200).json({
    success: true,
    results: orders.length,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    data: { orders },
  });
});

module.exports = { getProfile, updateProfile, addAddress, updateAddress, deleteAddress, getOrderHistory };