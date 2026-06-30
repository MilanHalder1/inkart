'use strict';

const Order = require('../models/Order');
const AppError = require('../utilities/AppError');
const catchAsync = require('../utilities/CatchAsync');
const User = require('../models/User');
const { sendOrderApprovedEmail } = require('../config/order');
const { attachShipmentToOrder } = require('./checkout');



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
      .populate('user', 'name email phone')
      .populate({
        path: "items.product",
        select: "name image description price category brand"
      }),
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

const markCODAsPaid = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.id);
  const user = await User.findById(order.user);

  order.paymentStatus = 'paid';

  await order.save();

  const invoicePath = await generateInvoice(order);

  await sendInvoiceEmail(user, order, invoicePath);

  res.status(200).json({
    success: true,
    message: 'COD marked as paid',
  });
}); //code 

const getCustomizedOrders = catchAsync(async (req, res) => {

  const orders = await Order.find({
    isCustomizedOrder: true,
  })

    .populate('user', 'name email')

    .populate('items.product', 'name images')

    .populate('items.customization');

  res.status(200).json({
    success: true,

    results: orders.length,

    data: {
      orders,
    },
  });
});

const setDeliveryEstimate = catchAsync(async (req, res, next) => {
  const { estimatedDeliveryDate, deliveryNote } = req.body;

  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  order.estimatedDeliveryDate = estimatedDeliveryDate;
  order.deliveryNote = deliveryNote;

  await order.save();

  res.status(200).json({
    success: true,
    message: 'Delivery estimate updated',
    data: { order }
  });
});

const approveOrder = catchAsync(async (req, res, next) => {

  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  if (order.approvedByAdmin) {
    return next(new AppError('Already approved', 400));
  }

  order.approvedByAdmin = true;
  order.approvedAt = new Date();

  order.isCancellable = false;

  await order.save();

  const user = await User.findById(order.user);

  await sendOrderApprovedEmail(user, order);

  // await attachShipmentToOrder(order);

  res.status(200).json({
    success: true,
    message: 'Order approved'
  });
});

const resendOrderConfirmation = catchAsync(async (req, res, next) => {

  const order = await Order.findById(req.params.id);

  const user = await User.findById(order.user);

  await sendOrderApprovedEmail(user, order);

  res.status(200).json({
    success: true,
    message: 'Email resent'
  });

});



// const confirmOrder = catchAsync(async (req, res, next) => {

//   const order = await Order.findById(req.params.id);

//   if (!order) {
//     return next(
//       new AppError('Order not found.', 404)
//     );
//   }

//   if (order.orderStatus !== 'pending') {
//     return next(
//       new AppError(
//         'Order already processed.',
//         400
//       )
//     );
//   }

//   order.orderStatus = 'confirmed';

//   order.isCancellable = false;

//   order.statusHistory.push({
//     status: 'confirmed',
//     note: 'Order approved by admin',
//     updatedAt: new Date()
//   });

//   await order.save();

//   // send approval mail

//   await sendOrderApprovedEmail(order);

//   // create shipment

//   await attachShipmentToOrder(order);

//   res.status(200).json({
//     success: true,
//     message: 'Order confirmed successfully'
//   });


// });



const getAdminOrderStatus = catchAsync(async (req, res, next) => {

  const order = await Order.findById(req.params.orderId)
    .populate('user', 'name email phone');

  if (!order) {
    return next(new AppError('Order not found.', 404));
  }

  res.status(200).json({
    success: true,
    data: {
      orderId: order._id,
      orderNumber: order.orderNumber,

      customer: {
        id: order.user?._id,
        name: order.user?.name,
        email: order.user?.email,
        phone: order.user?.phone,
      },

      paymentStatus: order.paymentStatus,

      orderStatus: order.orderStatus,

      shipmentStatus: order.shipmentStatus || 'not_created',

      courierName: order.courierName || null,

      awbCode: order.awbCode || null,

      estimatedDeliveryDate:
        order.estimatedDeliveryDate || null,

      isCancellable: order.isCancellable,

      createdAt: order.createdAt,

      updatedAt: order.updatedAt,

      statusHistory: order.statusHistory || [],
    },
  });

});


module.exports = { getAllOrders, getOrder, updateOrderStatus, setDeliveryEstimate, cancelOrder, markCODAsPaid, getCustomizedOrders, approveOrder, resendOrderConfirmation, getAdminOrderStatus };