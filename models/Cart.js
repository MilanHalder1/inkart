'use strict';

const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  variantId: { type: mongoose.Schema.Types.ObjectId, default: null },
  quantity: { type: Number, required: true, min: 1, default: 1 },
  price: { type: Number, required: true },      // captured at add time
  customizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customization', default: null },
}, { _id: true });

const cartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  items: [cartItemSchema],
  coupon: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', default: null },
  couponDiscount: { type: Number, default: 0 },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

cartSchema.virtual('subtotal').get(function () {
  return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
});

cartSchema.virtual('total').get(function () {
  return Math.max(0, this.subtotal - this.couponDiscount);
});

module.exports = mongoose.model('Cart', cartSchema);