'use strict';

const mongoose = require('mongoose');
const User = require('../../models/User');
const Order = require('../../models/Order');
const Product = require('../../models/Product');
const Coupon = require('../../models/Coupon');
const PricingTier = require('../../models/PricingTier');
const AppError = require('../../utils/AppError');
const catchAsync = require('../../utils/catchAsync');

// ─── Admin Management ────────────────────────────────────────────────────────
const createAdmin = catchAsync(async (req, res, next) => {
  const { name, email, password, phone } = req.body;

  const existing = await User.findOne({ email });
  if (existing) return next(new AppError('Email already registered.', 409));

  const admin = await User.create({ name, email, password, phone, role: 'admin' });
  admin.password = undefined;

  res.status(201).json({ success: true, data: { admin } });
});

const getAllAdmins = catchAsync(async (req, res) => {
  const admins = await User.find({ role: 'admin' }).select('-__v').sort('-createdAt');
  res.status(200).json({ success: true, results: admins.length, data: { admins } });
});

const toggleAdminStatus = catchAsync(async (req, res, next) => {
  const admin = await User.findOne({ _id: req.params.id, role: 'admin' });
  if (!admin) return next(new AppError('Admin not found.', 404));
  admin.isActive = !admin.isActive;
  await admin.save({ validateBeforeSave: false });
  res.status(200).json({ success: true, message: `Admin ${admin.isActive ? 'activated' : 'deactivated'}.` });
});

// ─── Pricing Tiers ───────────────────────────────────────────────────────────
const createPricingTier = catchAsync(async (req, res) => {
  const tier = await PricingTier.create({ ...req.body, createdBy: req.user.id });
  res.status(201).json({ success: true, data: { tier } });
});

const getAllPricingTiers = catchAsync(async (req, res) => {
  const tiers = await PricingTier.find().sort('name');
  res.status(200).json({ success: true, data: { tiers } });
});

const updatePricingTier = catchAsync(async (req, res, next) => {
  const tier = await PricingTier.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!tier) return next(new AppError('Pricing tier not found.', 404));
  res.status(200).json({ success: true, data: { tier } });
});

// ─── Coupon Management ───────────────────────────────────────────────────────
const createCoupon = catchAsync(async (req, res) => {
  const coupon = await Coupon.create({ ...req.body, createdBy: req.user.id });
  res.status(201).json({ success: true, data: { coupon } });
});

const getAllCoupons = catchAsync(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, parseInt(req.query.limit, 10) || 20);
  const coupons = await Coupon.find()
    .sort('-createdAt')
    .skip((page - 1) * limit)
    .limit(limit)
    .select('-usedBy');
  res.status(200).json({ success: true, data: { coupons } });
});

const updateCoupon = catchAsync(async (req, res, next) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!coupon) return next(new AppError('Coupon not found.', 404));
  res.status(200).json({ success: true, data: { coupon } });
});

const deleteCoupon = catchAsync(async (req, res, next) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) return next(new AppError('Coupon not found.', 404));
  res.status(200).json({ success: true, message: 'Coupon deleted.' });
});

// ─── Dashboard Analytics ─────────────────────────────────────────────────────
const getDashboard = catchAsync(async (req, res) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const [
    totalUsers,
    totalOrders,
    revenueAgg,
    thisMonthOrders,
    lastMonthOrders,
    thisMonthRevenue,
    lastMonthRevenue,
    orderStatusDist,
    topProducts,
    revenueChart,
  ] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    Order.countDocuments({ paymentStatus: 'paid' }),

    Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),

    Order.countDocuments({ createdAt: { $gte: startOfMonth }, paymentStatus: 'paid' }),

    Order.countDocuments({
      createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
      paymentStatus: 'paid',
    }),

    Order.aggregate([
      { $match: { createdAt: { $gte: startOfMonth }, paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),

    Order.aggregate([
      { $match: { createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth }, paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),

    Order.aggregate([
      { $group: { _id: '$orderStatus', count: { $sum: 1 } } },
    ]),

    Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $unwind: '$items' },
      { $group: { _id: '$items.product', name: { $first: '$items.name' }, totalSold: { $sum: '$items.quantity' }, revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
      { $sort: { totalSold: -1 } },
      { $limit: 10 },
    ]),

    // Monthly revenue for last 12 months
    Order.aggregate([
      { $match: { paymentStatus: 'paid', createdAt: { $gte: new Date(new Date().setMonth(now.getMonth() - 11)) } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
  ]);

  const totalRevenue = revenueAgg[0]?.total || 0;
  const thisMonthRev = thisMonthRevenue[0]?.total || 0;
  const lastMonthRev = lastMonthRevenue[0]?.total || 0;

  res.status(200).json({
    success: true,
    data: {
      summary: {
        totalUsers,
        totalOrders,
        totalRevenue,
        thisMonthOrders,
        lastMonthOrders,
        thisMonthRevenue: thisMonthRev,
        lastMonthRevenue: lastMonthRev,
        revenueGrowth: lastMonthRev > 0
          ? (((thisMonthRev - lastMonthRev) / lastMonthRev) * 100).toFixed(2)
          : null,
      },
      orderStatusDistribution: orderStatusDist,
      topProducts,
      revenueChart,
    },
  });
});

// All users list
const getAllUsers = catchAsync(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, parseInt(req.query.limit, 10) || 20);
  const filter = { role: 'user' };
  if (req.query.search) {
    const re = new RegExp(req.query.search, 'i');
    filter.$or = [{ name: re }, { email: re }];
  }
  const [users, total] = await Promise.all([
    User.find(filter).sort('-createdAt').skip((page - 1) * limit).limit(limit).select('-__v'),
    User.countDocuments(filter),
  ]);
  res.status(200).json({
    success: true,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    data: { users },
  });
});

module.exports = {
  createAdmin, getAllAdmins, toggleAdminStatus,
  createPricingTier, getAllPricingTiers, updatePricingTier,
  createCoupon, getAllCoupons, updateCoupon, deleteCoupon,
  getDashboard, getAllUsers,
};