'use strict';

const router = require('express').Router();
const { protect } = require('../../middleware/auth');
const Order = require('../../models/Order');
const AppError = require('../../utils/AppError');
const catchAsync = require('../../utils/catchAsync');

router.use(protect);

router.get('/', catchAsync(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, parseInt(req.query.limit, 10) || 10);
  const skip = (page - 1) * limit;
  const filter = { user: req.user.id };
  if (req.query.status) filter.orderStatus = req.query.status;

  const [orders, total] = await Promise.all([
    Order.find(filter).sort('-createdAt').skip(skip).limit(limit).populate('items.product', 'name images slug'),
    Order.countDocuments(filter),
  ]);
  res.status(200).json({ success: true, pagination: { page, limit, total, pages: Math.ceil(total / limit) }, data: { orders } });
}));

router.get('/:id', catchAsync(async (req, res, next) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user.id })
    .populate('items.product', 'name images slug');
  if (!order) return next(new AppError('Order not found.', 404));
  res.status(200).json({ success: true, data: { order } });
}));

module.exports = router;