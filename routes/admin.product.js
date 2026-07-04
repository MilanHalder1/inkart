'use strict';

const router = require('express').Router();
const { protect, restrictTo } = require('../middleware/Auth');
const { createUploader } = require('../config/cloudinary');
const {
  getAllProducts, createProduct, getProduct,
  updateProduct, deleteProduct, deleteProductImage, updateStock,
} = require('../controllers/admin.product');

const productImagesUpload = createUploader('products').fields([
  {
    name: 'productImages',
    maxCount: 10,
  },
  {
    name: 'colorImages_0',
    maxCount: 10,
  },
  {
    name: 'colorImages_1',
    maxCount: 10,
  },
  {
    name: 'colorImages_2',
    maxCount: 10,
  },
  {
    name: 'colorImages_3',
    maxCount: 10,
  },
  {
    name: 'colorImages_4',
    maxCount: 10,
  },
]);
router.use(protect, restrictTo('admin', 'superadmin'));



router.route('/')
  .get(getAllProducts)
  .post(productImagesUpload, createProduct);

router.route('/:id')
  .get(getProduct)
  .patch(productImagesUpload, updateProduct)
  .delete(deleteProduct);

router.delete('/:id/images/:publicId', deleteProductImage);
router.patch('/:id/stock', updateStock);

module.exports = router;