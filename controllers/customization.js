
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
        printableAreas: product.printableAreas,
        canvasWidth: 800,   // standard canvas
        canvasHeight: 600,
      },
    });
  }),
];

const saveDesign = catchAsync(async (req, res, next) => {
  const {
    productId,
    designs
  } = req.body;


  const product = await Product.findById(productId);
  if (!product || !product.isCustomizable) return next(new AppError('Product not found or not customizable.', 404));


  const customization = await Customization.findOneAndUpdate(
    {
      user: req.user.id,
      product: productId,
      status: {
        $ne: "ordered",
      },
    },
    {
      user: req.user.id,

      product: productId,

      designs,

      status: "saved",
    },
    {
      upsert: true,
      returnDocument: "after",
      setDefaultsOnInsert: true,
    }
  );

  res.status(200).json({ success: true, data: { customization } });
});

// Upload preview image rendered by client canvas
const uploadPreviewImage = [
  createUploader("customizations/previews").single("preview"),

  catchAsync(async (req, res, next) => {

    if (!req.file) {
      return next(new AppError("No preview image uploaded.", 400));
    }

    const { side } = req.body;

    const customization = await Customization.findOne({
      _id: req.params.customizationId,
      user: req.user.id,
    });

    if (!customization) {
      return next(new AppError("Customization not found.", 404));
    }

    const design = customization.designs.find(
      (item) => item.side === side
    );

    if (!design) {
      return next(new AppError("Invalid design side.", 400));
    }

    design.previewImage = {
      url: req.file.path,
      publicId: req.file.filename,
    };

    await customization.save();

    res.status(200).json({
      success: true,
      data: {
        design,
      },
    });

  }),
];

const getDesign = catchAsync(async (req, res, next) => {
  const customization = await Customization.findOne({
    _id: req.params.customizationId,
    user: req.user.id,
  }).populate("product", "name images printableAreas");

  if (!customization) {
    return next(new AppError("Design not found.", 404));
  }

  res.status(200).json({
    success: true,
    data: {
      customization,
    },
  });
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