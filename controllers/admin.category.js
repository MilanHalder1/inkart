'use strict';

const Category = require('../models/Category');
const AppError = require('../utilities/AppError');
const catchAsync = require('../utilities/CatchAsync');

const getAllCategories = catchAsync(async (req, res) => {
  const categories = await Category.find()
    .populate('children')
    .populate('parent', 'name slug')
    .sort('sortOrder');
  res.status(200).json({ success: true, results: categories.length, data: { categories } });
});

const createCategory = catchAsync(async (req, res) => {
  const image = req.file ? { url: req.file.path, publicId: req.file.filename } : undefined;
  const category = await Category.create({ ...req.body, ...(image && { image }) });
  res.status(201).json({ success: true, data: { category } });
});

const updateCategory = catchAsync(async (req, res, next) => {
  const image = req.file ? { url: req.file.path, publicId: req.file.filename } : undefined;
  const category = await Category.findByIdAndUpdate(
    req.params.id,
    { ...req.body, ...(image && { image }) },
    { new: true, runValidators: true }
  );
  if (!category) return next(new AppError('Category not found.', 404));
  res.status(200).json({ success: true, data: { category } });
});

const deleteCategory = catchAsync(async (req, res, next) => {
  const category = await Category.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!category) return next(new AppError('Category not found.', 404));
  res.status(200).json({ success: true, message: 'Category deactivated.' });
});

module.exports = { getAllCategories, createCategory, updateCategory, deleteCategory };