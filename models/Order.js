'use strict';

const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  variantId: { type: mongoose.Schema.Types.ObjectId, default: null },
  name: { type: String, required: true },        // snapshot
  image: String,
  price: { type: Number, required: true },       // snapshot
  quantity: { type: Number, required: true, min: 1 },
  customizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customization', default: null },
}, { _id: true });

const shippingAddressSchema = new mongoose.Schema({
  fullName: String,
  phone: String,
  line1: String,
  line2: String,
  city: String,
  state: String,
  pincode: String,
  country: { type: String, default: 'India' },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  items: [orderItemSchema],
  shippingAddress: shippingAddressSchema,

  subtotal: { type: Number, required: true },
  shippingCharge: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  couponDiscount: { type: Number, default: 0 },
  total: { type: Number, required: true },

  coupon: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', default: null },
  couponCode: String,

  // Payment
  paymentMethod: { type: String, enum: ['razorpay', 'cod'], default: 'razorpay' },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending',
    index: true,
  },
  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String,

  // Order lifecycle
  orderStatus: {
    type: String,
    enum: ['placed', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'return_requested', 'returned'],
    default: 'placed',
    index: true,
  },
  statusHistory: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    note: String,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  }],

  trackingNumber: String,
  deliveredAt: Date,
  cancelReason: String,
  notes: String,
}, {
  timestamps: true,
});

orderSchema.index({ createdAt: -1 });
orderSchema.index({ user: 1, orderStatus: 1 });

// Auto-generate order number
orderSchema.pre('save', async function (next) {
  if (this.isNew) {
    const date = new Date();
    const prefix = `ORD-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `${prefix}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);