'use strict';

const mongoose = require('mongoose');
const slugify = require('slugify');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, unique: true, maxlength: 100 },
  slug: { type: String, unique: true, index: true },
  description: { type: String, maxlength: 500 },
  image: {
    url: String,
    publicId: String,
  },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  isActive: { type: Boolean, default: true, index: true },
  sortOrder: { type: Number, default: 0 },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

categorySchema.virtual('children', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parent',
});

categorySchema.pre('findOneAndUpdate', async function () {
  let update = this.getUpdate();

  if (update.$set) {
    update = update.$set;
  }

  if (update.name) {
    update.slug = slugify(update.name, { lower: true, strict: true });
  }
});
module.exports = mongoose.model('Category', categorySchema);