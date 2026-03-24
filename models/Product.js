'use strict';

const mongoose = require('mongoose');
const slugify = require('slugify');

const variantSchema = new mongoose.Schema({
  name: { type: String, required: true },      
  value: { type: String, required: true },     
  priceModifier: { type: Number, default: 0 }, 
  sku: { type: String },
  
  stock: { type: Number, default: 0, min: 0 },
  images: [{ url: String, publicId: String }],
}, { _id: true });

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 200 },
  slug: { type: String, unique: true, index: true },
  description: { type: String, maxlength: 5000 },
  shortDescription: { type: String, maxlength: 300 },
  sku: { type: String, unique: true, sparse: true },

  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
    index: true,
  },

  // ─── Product Type ──────────────────────────────────────────────
  // 'stocked'    → has a physical stock count; can't order when 0
  // 'on_demand'  → always orderable, no stock management
  productType: {
    type: String,
    enum: ['stocked', 'on_demand'],
    required: true,
    default: 'stocked',
    index: true,
  },

  // Only relevant for productType === 'stocked'
  stock: { type: Number, default: 0, min: 0 },
  lowStockThreshold: { type: Number, default: 5 },

  basePrice: { type: Number, required: true, min: 0 },
  discountedPrice: { type: Number, min: 0 },
  taxPercent: { type: Number, default: 0 },
  pricingTier: { type: String, default: 'standard' }, // set by super admin

  images: [{ url: String, publicId: String }],
  variants: [variantSchema],

  tags: [{ type: String, lowercase: true, trim: true }],
  isFeatured: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true, index: true },
  isCustomizable: { type: Boolean, default: false },

  // Printable area config for customization module
  printableArea: {
    x: Number, y: Number,
    width: Number, height: Number,
  },

  ratingsAverage: { type: Number, default: 0, min: 0, max: 5, set: (v) => Math.round(v * 10) / 10 },
  ratingsCount: { type: Number, default: 0 },
  soldCount: { type: Number, default: 0 },

  metaTitle: String,
  metaDescription: String,

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes for catalog queries
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ basePrice: 1 });
productSchema.index({ ratingsAverage: -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ category: 1, isActive: 1 });

productSchema.virtual('effectivePrice').get(function () {
  return this.discountedPrice && this.discountedPrice < this.basePrice
    ? this.discountedPrice
    : this.basePrice;
});

productSchema.virtual('isInStock').get(function () {
  if (this.productType === 'on_demand') return true;
  return this.stock > 0;
});

productSchema.pre('save', function () {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
});

module.exports = mongoose.model('Product', productSchema);