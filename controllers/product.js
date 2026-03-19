'use strict';

const Product = require('../models/Product');
const Category = require('../models/Category');
const AppError = require('../utilities/AppError');
const catchAsync = require('../utilities/CatchAsync');
const APIFeatures = require('../utilities/apiFeatures');

const getAllProducts = catchAsync(async (req, res) => {
  const queryObj = { isActive: true };

  // Category filter
  if (req.query.category) queryObj.category = req.query.category;

  // Product type filter
  if (req.query.productType) queryObj.productType = req.query.productType;

  // In-stock filter (only relevant for stocked products)
  if (req.query.inStock === 'true') {
    queryObj.$or = [
      { productType: 'on_demand' },
      { productType: 'stocked', stock: { $gt: 0 } },
    ];
  }

  // Price range
  if (req.query.minPrice || req.query.maxPrice) {
    queryObj.basePrice = {};
    if (req.query.minPrice) queryObj.basePrice.$gte = Number(req.query.minPrice);
    if (req.query.maxPrice) queryObj.basePrice.$lte = Number(req.query.maxPrice);
  }

  // Tags filter
  if (req.query.tags) {
    queryObj.tags = { $in: req.query.tags.split(',').map((t) => t.trim().toLowerCase()) };
  }

  // Full-text search
  let baseQuery = Product.find(queryObj).populate('category', 'name slug');
  if (req.query.search) {
    baseQuery = Product.find({ ...queryObj, $text: { $search: req.query.search } })
      .populate('category', 'name slug');
  }

  // Sort
  const sortOptions = {
    price_asc: 'basePrice',
    price_desc: '-basePrice',
    rating: '-ratingsAverage',
    newest: '-createdAt',
    popular: '-soldCount',
  };
  const sort = sortOptions[req.query.sort] || '-createdAt';
  baseQuery = baseQuery.sort(sort);

  // Pagination
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, parseInt(req.query.limit, 10) || 20);
  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    baseQuery.skip(skip).limit(limit).select('-__v'),
    Product.countDocuments(queryObj),
  ]);

  res.status(200).json({
    success: true,
    results: products.length,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    data: { products },
  });
});

const getProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findOne({
    $or: [{ _id: req.params.id }, { slug: req.params.id }],
    isActive: true,
  }).populate('category', 'name slug').select('-__v');

  if (!product) return next(new AppError('Product not found.', 404));

  res.status(200).json({ success: true, data: { product } });
});

const getProductVariants = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id).select('variants productType stock');
  if (!product) return next(new AppError('Product not found.', 404));
  res.status(200).json({ success: true, data: { variants: product.variants, productType: product.productType } });
});

const getCategories = catchAsync(async (req, res) => {
  const categories = await Category.find({ isActive: true, parent: null })
    .populate('children')
    .select('-__v')
    .sort('sortOrder');
  res.status(200).json({ success: true, data: { categories } });
});

module.exports = { getAllProducts, getProduct, getProductVariants, getCategories };