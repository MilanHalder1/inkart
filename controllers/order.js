const Order = require('../models/Order');
const AppError = require('../utilities/AppError');
const catchAsync = require('../utilities/CatchAsync');

const getMyOrders = catchAsync(async (req, res) => {
    console.log("req.user.id====>",req.user.id)
  const orders = await Order.find({
    user: req.user.id,
  })
    .sort('-createdAt')
    .populate('items.product', 'name images slug');

  res.status(200).json({
    success: true,
    results: orders.length,
    data: { orders },
  });
});

const cancelMyOrder = catchAsync(async (req, res, next) => {

  const { reason } = req.body;

  if (!reason) {
    return next(
      new AppError(
        'Cancellation reason is required',
        400
      )
    );
  }

  const order = await Order.findOne({
    _id: req.params.id,
    user: req.user.id,
  });
console.log('order',order)
  if (!order) {
    return next(
      new AppError('Order not found', 404)
    );
  }

  // ❌ Already cancelled
  if (order.orderStatus === 'cancelled') {
    return next(
      new AppError('Order already cancelled', 400)
    );
  }

  // ❌ Delivered
  if (order.orderStatus === 'delivered') {
    return next(
      new AppError(
        'Delivered orders cannot be cancelled',
        400
      )
    );
  }

  // ❌ Shipped
  if (
    ['shipped'].includes(order.orderStatus)
  ) {
    return next(
      new AppError(
        'Order already shipped and cannot be cancelled',
        400
      )
    );
  }
  if (
    order.shipmentCutoffTime &&
    new Date() > order.shipmentCutoffTime
  ) {
    return next(
      new AppError(
        'Cancellation window expired',
        400
      )
    );
  }

  // ✅ UPDATE ORDER
  order.orderStatus = 'cancelled';

  order.cancelReason = reason;

  order.cancelledAt = new Date();

  order.isCancellable = false;

  order.statusHistory.push({
    status: 'cancelled',

    note: `Cancelled by user: ${reason}`,

    updatedBy: order.user,
  });

  // ✅ COD
  if (order.paymentMethod === 'cod') {

    order.paymentStatus = 'failed';
  }

  // ✅ ONLINE PAYMENT
  // later: auto refund integration
  if (
    order.paymentMethod === 'razorpay' &&
    order.paymentStatus === 'paid'
  ) {

    order.paymentStatus = 'refunded';
  }

  await order.save();

  res.status(200).json({
    success: true,

    message: 'Order cancelled successfully',

    data: { order },
  });
});
module.exports={getMyOrders,cancelMyOrder}