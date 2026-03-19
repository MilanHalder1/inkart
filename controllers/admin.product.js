'use strict';

const Product = require('../models/Product');
const { deleteImage } = require('../config/cloudinary');
const AppError = require('../utilities/AppError');
const catchAsync = require('../utilities/CatchAsync');
const APIFeatures = require('../utilities/apiFeatures');

const getAllProducts = catchAsync(async (req, res) => {
  const features = new APIFeatures(
    Product.find().populate('category', 'name slug'),
    req.query
  ).filter().sort().limitFields().paginate();

  const [products, total] = await Promise.all([
    features.query,
    Product.countDocuments(),
  ]);

  res.status(200).json({
    success: true,
    results: products.length,
    total,
    data: { products },
  });
});

const createProduct = catchAsync(async (req, res, next) => {
  const images = req.files?.map((f) => ({ url: f.path, publicId: f.filename })) || [];
  const product = await Product.create({ ...req.body, images, createdBy: req.user.id });
  res.status(201).json({ success: true, data: { product } });
});

const getProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id).populate('category', 'name slug');
  if (!product) return next(new AppError('Product not found.', 404));
  res.status(200).json({ success: true, data: { product } });
});

const updateProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) return next(new AppError('Product not found.', 404));

  // Append new images if uploaded
  if (req.files?.length) {
    const newImages = req.files.map((f) => ({ url: f.path, publicId: f.filename }));
    req.body.images = [...(product.images || []), ...newImages];
  }

  const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  res.status(200).json({ success: true, data: { product: updated } });
});

const deleteProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) return next(new AppError('Product not found.', 404));

  // Soft delete preferred in production
  await Product.findByIdAndUpdate(req.params.id, { isActive: false });
  res.status(200).json({ success: true, message: 'Product deactivated successfully.' });
});

const deleteProductImage = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) return next(new AppError('Product not found.', 404));

  const imageIndex = product.images.findIndex((img) => img.publicId === req.params.publicId);
  if (imageIndex === -1) return next(new AppError('Image not found.', 404));

  await deleteImage(req.params.publicId);
  product.images.splice(imageIndex, 1);
  await product.save();

  res.status(200).json({ success: true, data: { images: product.images } });
});

// Stock management for stocked products
const updateStock = catchAsync(async (req, res, next) => {
  const { quantity, variantId, operation = 'set' } = req.body;
  const product = await Product.findById(req.params.id);
  if (!product) return next(new AppError('Product not found.', 404));
  if (product.productType !== 'stocked') return next(new AppError('Stock management only applies to stocked products.', 400));

  if (variantId) {
    const variant = product.variants.id(variantId);
    if (!variant) return next(new AppError('Variant not found.', 404));
    if (operation === 'add') variant.stock += quantity;
    else if (operation === 'subtract') variant.stock = Math.max(0, variant.stock - quantity);
    else variant.stock = quantity;
  } else {
    if (operation === 'add') product.stock += quantity;
    else if (operation === 'subtract') product.stock = Math.max(0, product.stock - quantity);
    else product.stock = quantity;
  }

  await product.save();
  res.status(200).json({
    success: true,
    message: 'Stock updated.',
    data: { stock: variantId ? product.variants.id(variantId).stock : product.stock },
  });
});

module.exports = { getAllProducts, createProduct, getProduct, updateProduct, deleteProduct, deleteProductImage, updateStock };