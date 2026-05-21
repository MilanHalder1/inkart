'use strict';

const crypto = require('crypto');
const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const User = require('../models/User');
const razorpay = require('../config/razorpay');
const AppError = require('../utilities/AppError');
const catchAsync = require('../utilities/CatchAsync');
const { createShipment } = require('../config/shiprocket');
const { generateInvoice } = require('../utilities/invoice');

const { sendOrderPlacedEmail, sendInvoiceEmail } = require('../config/order');
const { uploadInvoiceToCloudinary } = require('../utilities/cloudinaryUploadfFunction');

const applyCoupon = catchAsync(async (req, res, next) => {
  const { code } = req.body;
  const cart = await Cart.findOne({ user: req.user.id }).populate('items.product');
  if (!cart || cart.items.length === 0) return next(new AppError('Cart is empty.', 400));

  const coupon = await Coupon.findOne({ code: code.toUpperCase() });
  if (!coupon) return next(new AppError('Invalid coupon code.', 404));

  const subtotal = cart.items.reduce((s, i) => s + i.price * i.quantity, 0);

  const validity = coupon.isValid(req.user.id, subtotal);
  if (!validity.valid) return next(new AppError(validity.message, 400));

  const discount = coupon.calculateDiscount(subtotal);
  cart.coupon = coupon._id;
  cart.couponDiscount = discount;
  await cart.save();

  res.status(200).json({
    success: true,
    message: `Coupon applied! You save ₹${discount.toFixed(2)}`,
    data: { couponCode: coupon.code, discountAmount: discount, subtotal, total: subtotal - discount },
  });
});

const removeCoupon = catchAsync(async (req, res) => {
  await Cart.findOneAndUpdate({ user: req.user.id }, { coupon: null, couponDiscount: 0 });
  res.status(200).json({ success: true, message: 'Coupon removed.' });
});

// ─── Create Razorpay Order ──────────────────────────────────────────────────
const createRazorpayOrder = catchAsync(async (req, res, next) => {
  const { addressId, notes } = req.body;

  const [user, cart] = await Promise.all([
    User.findById(req.user.id),
    Cart.findOne({ user: req.user.id }).populate('items.product').populate('coupon'),
  ]);

  if (!cart || cart.items.length === 0) return next(new AppError('Cart is empty.', 400));

  const address = user.addresses.id(addressId);
  if (!address) return next(new AppError('Address not found.', 404));

  // Validate stock for all items
  for (const item of cart.items) {
    const product = item.product;
    if (!product || !product.isActive) {
      return next(new AppError(`Product ${product?.name || item.product} is no longer available.`, 400));
    }
    if (product.productType === 'stocked') {
      if (item.variantId) {
        const variant = product.variants.id(item.variantId);
        if (!variant || variant.stock < item.quantity) {
          return next(new AppError(`Insufficient stock for ${product.name} - ${variant?.value || 'selected variant'}.`, 400));
        }
      } else if (product.stock < item.quantity) {
        return next(new AppError(`Insufficient stock for ${product.name}. Available: ${product.stock}`, 400));
      }
    }
  }

  const subtotal = cart.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const couponDiscount = cart.couponDiscount || 0;
  const total = Math.max(0, subtotal - couponDiscount);
  const totalInPaise = Math.round(total * 100);
  const maxDeliveryDays = Math.max(
    ...cart.items.map(
      i => i.product.category?.estimatedDeliveryDays || 3
    )
  );
  const shipmentCutoffTime = new Date(
    Date.now() + 2 * 60 * 60 * 1000
  );

  // Create Razorpay order
  const rzpOrder = await razorpay.orders.create({
    amount: totalInPaise,
    currency: 'INR',
    receipt: `rcpt_${Date.now()}`,
    notes: { userId: req.user.id.toString() },
  });
 const isCustomizedOrder = cart.items.some(
  item => item.customizationId
);

  // Persist a pending order
  const order = await Order.create({
    user: req.user.id,
    items: cart.items.map((i) => ({
      product: i.product._id,
      variantId: i.variantId,
      name: i.product.name,
      image: i.product.images?.[0]?.url,
      price: i.price,
      quantity: i.quantity,
      customizationId: i.customizationId,
      
    })),
    shippingAddress: address.toObject(),
    subtotal,
    shipmentCutoffTime,
    couponDiscount,
    total,
    isCustomizedOrder,
    coupon: cart.coupon?._id || null,
    couponCode: cart.coupon?.code || null,
    paymentMethod: 'razorpay',
    paymentStatus: 'pending',
    orderStatus: 'placed',
    razorpayOrderId: rzpOrder.id,
    notes,
    statusHistory: [{ status: 'placed', note: 'Order created, awaiting payment.' }],
  });

  res.status(201).json({
    success: true,
    data: {
      orderId: order._id,
      orderNumber: order.orderNumber,
      razorpayOrderId: rzpOrder.id,
      amount: totalInPaise,
      
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID,
      estimatedDeliveryDays: maxDeliveryDays,
    },
  });
});

// ─── Verify Payment & Confirm Order ────────────────────────────────────────


const verifyPayment = catchAsync(async (req, res, next) => {
  const {
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    orderId,
  } = req.body;

  // 🔐 Verify Razorpay Signature
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  if (expectedSignature !== razorpaySignature) {
    return next(new AppError('Payment verification failed. Invalid signature.', 400));
  }

  const session = await mongoose.startSession();
  let order;

  try {
    session.startTransaction();

    // 🔍 Get Order
    order = await Order.findById(orderId).session(session);
    if (!order) throw new AppError('Order not found.', 404);

    if (order.paymentStatus === 'paid') {
      throw new AppError('Order already paid.', 400);
    }

    // 📦 STOCK VALIDATION + DEDUCTION
    for (const item of order.items) {
      const product = await Product.findById(item.product).session(session);

      if (product?.productType === 'stocked') {
        if (item.variantId) {
          const variant = product.variants.id(item.variantId);
          if (!variant || variant.stock < item.quantity) {
            throw new AppError(`Stock depleted for ${product.name}.`, 400);
          }
          variant.stock -= item.quantity;
        } else {
          if (product.stock < item.quantity) {
            throw new AppError(`Stock depleted for ${product.name}.`, 400);
          }
          product.stock -= item.quantity;
        }

        product.soldCount += item.quantity;
        await product.save({ session });
      }
    }

    // 🎟️ COUPON USAGE
    if (order.coupon) {
      await Coupon.findByIdAndUpdate(
        order.coupon,
        {
          $inc: { usageCount: 1 },
          $push: { usedBy: order.user },
        },
        { session }
      );
    }

    // 🧾 UPDATE ORDER
    order.paymentStatus = 'paid';
    order.orderStatus = 'confirmed';
    order.razorpayPaymentId = razorpayPaymentId;
    order.razorpaySignature = razorpaySignature;

    order.statusHistory.push({
      status: 'confirmed',
      note: 'Payment verified successfully.',
      updatedBy: order.user,
    });

    await order.save({ session });

    // 🛒 CLEAR CART
    await Cart.findOneAndUpdate(
      { user: order.user },
      { items: [], coupon: null, couponDiscount: 0 },
      { session }
    );

    // ✅ COMMIT TRANSACTION
    await session.commitTransaction();
    session.endSession();

  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return next(err);
  }

  // 🚀 POST-TRANSACTION (NO DB LOCKS HERE)

  try {
    const updatedOrder = await Order.findById(order._id);
    const user = await User.findById(order.user);

    console.log('➡️ Generating invoice');

    // 🧾 Generate buffer
    const buffer = await generateInvoice(updatedOrder);

    console.log('➡️ Uploading invoice');

    // ☁️ Upload
    const upload = await uploadInvoiceToCloudinary(
      buffer,
      updatedOrder.orderNumber
    );

    console.log('➡️ Saving invoice URL');

    updatedOrder.invoiceUrl = upload.secure_url;
    await updatedOrder.save();

    console.log('➡️ Sending emails');

    console.log("updated  order ====>", updatedOrder)
    await sendOrderPlacedEmail(user, updatedOrder);
    await sendInvoiceEmail(
      user,
      updatedOrder,
      buffer
    );
    console.log('➡️ Creating shipment');

    await attachShipmentToOrder(updatedOrder);

    console.log('✅ All done');

  } catch (err) {
    console.error('❌ Post-payment error:', err);
  }

  return res.status(200).json({
    success: true,
    message: 'Payment verified. Order confirmed!',
  });
});

const createCODOrder = catchAsync(async (req, res, next) => {
  const { addressId } = req.body;

  const user = await User.findById(req.user.id);
  const cart = await Cart.findOne({ user: req.user.id }).populate('items.product');

  const address = user.addresses.id(addressId);

  const subtotal = cart.items.reduce((s, i) => s + i.price * i.quantity, 0);

  const order = await Order.create({
    user: req.user.id,
    items: cart.items,
    shippingAddress: address.toObject(),
    subtotal,
    total: subtotal,
    paymentMethod: 'cod',
    paymentStatus: 'pending',
    orderStatus: 'confirmed',
  });

  // Send order email
  await sendOrderPlacedEmail(user, order);

  // Create shipment
  await attachShipmentToOrder(order);

  res.status(201).json({
    success: true,
    message: 'COD order placed',
    data: { order },
  });
});

// ─── Get Order Details ──────────────────────────────────────────────────────
const getOrderDetails = catchAsync(async (req, res, next) => {
  const order = await Order.findOne({ _id: req.params.orderId, user: req.user.id })
    .populate('items.product', 'name images slug');
  if (!order) return next(new AppError('Order not found.', 404));
  const isCancellable =
    order.shipmentCutoffTime &&
    new Date() < order.shipmentCutoffTime &&
    !['shipped', 'delivered', 'cancelled']
      .includes(order.orderStatus);
  res.status(200).json({ success: true, data: { order,isCancellable } });
});

//shipments



const attachShipmentToOrder = async (order) => {
  try {
    console.log("shipment order function")
    if (order.shipment?.awb) return order; // ✅ already exists

    const shipment = await createShipment(order);
    console.log("shipment  checkoout data", shipment)
    order.shipment = {
      awb: shipment.awb_code,
      courier: shipment.courier_name,
      status: shipment.status,
      trackingUrl: shipment.tracking_url,
      shiprocketOrderId: shipment.order_id,
      shipmentId: shipment.shipment_id,
    };

    order.trackingNumber = shipment.awb_code;

    await order.save();

    return order;

  } catch (err) {
    console.error('❌ Shiprocket Error:', err.message);
    return order;
  }
};

exports.createCODOrder = catchAsync(async (req, res, next) => {
  const order = await Order.create({
    user: req.user.id,
    items: cart.items,
    shippingAddress: address,
    total,

    paymentMethod: 'cod',
    paymentStatus: 'pending',   // 👈 important
    orderStatus: 'confirmed',   // 👈 directly confirmed
  });

  res.status(201).json({
    success: true,
    message: 'COD order placed successfully',
    data: { order },
  });
});
module.exports = { applyCoupon, removeCoupon, createRazorpayOrder, verifyPayment, createCODOrder, getOrderDetails, attachShipmentToOrder };