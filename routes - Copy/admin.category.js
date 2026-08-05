'use strict';

const router = require('express').Router();
const { protect, restrictTo } = require('../middleware/Auth');
const { createUploader } = require('../config/cloudinary');
const {
  getAllCategories,
  createCategory,

  updateCategory,
  deleteCategory,
 
} = require('../controllers/admin.category');

const categoryImageUpload = createUploader('categories').single('image');

// Public
// router.get('/active', getActiveCategories);

// Admin only
router.use(protect, restrictTo('admin', 'superadmin'));

router.route('/')
  .get(getAllCategories)
  .post(categoryImageUpload, createCategory);

router.route('/:id')

  .patch(categoryImageUpload, updateCategory)
  .delete(deleteCategory);

module.exports = router;