'use strict';

const mongoose = require('mongoose');

const pricingTierSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  description: String,
  markupPercent: { type: Number, default: 0 },  // % added on top of base price
  flatMarkup: { type: Number, default: 0 },     // flat amount added
  isDefault: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('PricingTier', pricingTierSchema);