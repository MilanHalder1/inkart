'use strict';

const mongoose = require('mongoose');

// Each layer in the design canvas
const layerSchema = new mongoose.Schema({
  id: { type: String, required: true },         // client-side UUID
  type: { type: String, enum: ['text', 'image', 'shape'], required: true },
  isLocked: { type: Boolean, default: false },  // true = background layer
  // Transform
  x: Number, y: Number,
  width: Number, height: Number,
  rotation: { type: Number, default: 0 },
  scaleX: { type: Number, default: 1 },
  scaleY: { type: Number, default: 1 },
  // Content per type
  text: String,
  fontFamily: String,
  fontSize: Number,
  fontColor: String,
  fontWeight: String,
  imageUrl: String,
  imagePublicId: String,
  fill: String,
  opacity: { type: Number, default: 1 },
  zIndex: { type: Number, default: 0 },
}, { _id: false });

const customizationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },

  // Background image (locked layer)
  backgroundImage: {
    url: String,
    publicId: String,
  },

  // All editable + background layers serialized as JSON
  layers: [layerSchema],

  // Rendered preview image
  previewImage: {
    url: String,
    publicId: String,
  },

  canvasWidth: Number,
  canvasHeight: Number,

  status: { type: String, enum: ['draft', 'saved', 'ordered'], default: 'draft' },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Customization', customizationSchema);