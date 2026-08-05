'use strict';

const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
  description: String,
  discountType: { type: String, enum: ['percentage', 'flat'], required: true },
  discountValue: { type: Number, required: true, min: 0 },
  maxDiscountAmount: { type: Number },         // cap for percentage coupons
  minOrderAmount: { type: Number, default: 0 },
  usageLimit: { type: Number, default: null }, // null = unlimited
  usageCount: { type: Number, default: 0 },
  perUserLimit: { type: Number, default: 1 },
  usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  validFrom: { type: Date, required: true },
  validUntil: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  applicableCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

couponSchema.methods.isValid = function (userId, orderAmount) {
  const now = new Date();
  if (!this.isActive) return { valid: false, message: 'Coupon is inactive' };
  if (now < this.validFrom || now > this.validUntil) return { valid: false, message: 'Coupon has expired' };
  if (this.usageLimit !== null && this.usageCount >= this.usageLimit) return { valid: false, message: 'Coupon usage limit reached' };
  if (orderAmount < this.minOrderAmount) return { valid: false, message: `Minimum order amount is ₹${this.minOrderAmount}` };
  const userUsage = this.usedBy.filter(id => id.toString() === userId.toString()).length;
  if (userUsage >= this.perUserLimit) return { valid: false, message: 'You have already used this coupon' };
  return { valid: true };
};

couponSchema.methods.calculateDiscount = function (orderAmount) {
  let discount = this.discountType === 'percentage'
    ? (orderAmount * this.discountValue) / 100
    : this.discountValue;
  if (this.maxDiscountAmount) discount = Math.min(discount, this.maxDiscountAmount);
  return Math.min(discount, orderAmount);
};

module.exports = mongoose.model('Coupon', couponSchema);