'use strict';

const Order = require('../../models/Order');
const AppError = require('../../utils/AppError');
const catchAsync = require('../../utils/catchAsync');

const VALID_TRANSITIONS = {
  placed: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: ['return_requested'],
  return_requested: ['returned', 'delivered'],
};

const getAllOrders = catchAsync(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, parseInt(req.query.limit, 10) || 20);
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.status) filter.orderStatus = req.query.status;
  if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus;
  if (req.query.search) filter.orderNumber = new RegExp(req.query.search, 'i');

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort('-createdAt')
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email phone'),
    Order.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    results: orders.length,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    data: { orders },
  });
});

const getOrder = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'name email phone')
    .populate('items.product', 'name images sku');
  if (!order) return next(new AppError('Order not found.', 404));
  res.status(200).json({ success: true, data: { order } });
});

const updateOrderStatus = catchAsync(async (req, res, next) => {
  const { status, note, trackingNumber } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) return next(new AppError('Order not found.', 404));

  const allowed = VALID_TRANSITIONS[order.orderStatus];
  if (!allowed || !allowed.includes(status)) {
    return next(new AppError(`Cannot transition from '${order.orderStatus}' to '${status}'.`, 400));
  }

  order.orderStatus = status;
  order.statusHistory.push({ status, note: note || `Status updated to ${status}`, updatedBy: req.user.id });
  if (trackingNumber) order.trackingNumber = trackingNumber;
  if (status === 'delivered') order.deliveredAt = Date.now();

  await order.save();
  res.status(200).json({ success: true, data: { order } });
});

const cancelOrder = catchAsync(async (req, res, next) => {
  const { reason } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) return next(new AppError('Order not found.', 404));

  const cancellable = ['placed', 'confirmed', 'processing'];
  if (!cancellable.includes(order.orderStatus)) {
    return next(new AppError('Order cannot be cancelled at this stage.', 400));
  }

  order.orderStatus = 'cancelled';
  order.cancelReason = reason;
  order.statusHistory.push({ status: 'cancelled', note: reason, updatedBy: req.user.id });

  // Restore stock
  const Product = require('../../models/Product');
  for (const item of order.items) {
    const product = await Product.findById(item.product);
    if (product?.productType === 'stocked') {
      if (item.variantId) {
        const variant = product.variants.id(item.variantId);
        if (variant) variant.stock += item.quantity;
      } else {
        product.stock += item.quantity;
      }
      await product.save();
    }
  }

  await order.save();
  res.status(200).json({ success: true, message: 'Order cancelled and stock restored.', data: { order } });
});

module.exports = { getAllOrders, getOrder, updateOrderStatus, cancelOrder };