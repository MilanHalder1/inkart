
'use strict';

const Customization = require('../models/Customization');
const Product = require('../models/Product');
const { createUploader } = require('../config/cloudinary');
const AppError = require('../utilities/AppError');
const catchAsync = require('../utilities/CatchAsync');

// Upload background image for a customizable product
const uploadBackgroundImage = [
  createUploader('customizations/backgrounds').single('background'),
  catchAsync(async (req, res, next) => {
    if (!req.file) return next(new AppError('No image uploaded.', 400));
    const product = await Product.findById(req.params.productId);
    if (!product || !product.isCustomizable) return next(new AppError('Product not found or not customizable.', 404));

    // Return the uploaded URL; client maps it to fit the printable area
    res.status(200).json({
      success: true,
      data: {
        imageUrl: req.file.path,
        publicId: req.file.filename,
        printableArea: product.printableArea,
        canvasWidth: 800,   // standard canvas
        canvasHeight: 600,
      },
    });
  }),
];

// Save or update a design (layers as JSON + preview image)
const saveDesign = catchAsync(async (req, res, next) => {
  const { productId, layers, backgroundImage, canvasWidth, canvasHeight } = req.body;

  const product = await Product.findById(productId);
  if (!product || !product.isCustomizable) return next(new AppError('Product not found or not customizable.', 404));

  // Preview image (base64 or URL from client render)
  let previewImage = {};
  if (req.body.previewImageUrl) {
    previewImage = { url: req.body.previewImageUrl };
  }

  const customization = await Customization.findOneAndUpdate(
    { user: req.user.id, product: productId, status: { $ne: 'ordered' } },
    {
      user: req.user.id,
      product: productId,
      layers: layers || [],
      backgroundImage: backgroundImage || {},
      previewImage,
      canvasWidth,
      canvasHeight,
      status: 'saved',
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  res.status(200).json({ success: true, data: { customization } });
});

// Upload preview image rendered by client canvas
const uploadPreviewImage = [
  createUploader('customizations/previews').single('preview'),
  catchAsync(async (req, res, next) => {
    if (!req.file) return next(new AppError('No preview image uploaded.', 400));
    const customization = await Customization.findOneAndUpdate(
      { _id: req.params.customizationId, user: req.user.id },
      { previewImage: { url: req.file.path, publicId: req.file.filename } },
      { new: true }
    );
    if (!customization) return next(new AppError('Customization not found.', 404));
    res.status(200).json({ success: true, data: { previewImage: customization.previewImage } });
  }),
];

const getDesign = catchAsync(async (req, res, next) => {
  const customization = await Customization.findOne({
    _id: req.params.customizationId,
    user: req.user.id,
  }).populate('product', 'name images printableArea');
  if (!customization) return next(new AppError('Design not found.', 404));
  res.status(200).json({ success: true, data: { customization } });
});

const getUserDesigns = catchAsync(async (req, res) => {
  const designs = await Customization.find({ user: req.user.id })
    .populate('product', 'name images slug')
    .sort('-updatedAt');
  res.status(200).json({ success: true, results: designs.length, data: { designs } });
});

const deleteDesign = catchAsync(async (req, res, next) => {
  const design = await Customization.findOneAndDelete({ _id: req.params.customizationId, user: req.user.id });
  if (!design) return next(new AppError('Design not found.', 404));
  res.status(200).json({ success: true, message: 'Design deleted.' });
});

module.exports = { uploadBackgroundImage, saveDesign, uploadPreviewImage, getDesign, getUserDesigns, deleteDesign };