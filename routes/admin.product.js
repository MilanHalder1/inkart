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
        name: 'colorFront_0',
        maxCount: 5,
    },

    {
        name: 'colorBack_0',
        maxCount: 5,
    },

    {
        name: 'colorFront_1',
        maxCount: 5,
    },

    {
        name: 'colorBack_1',
        maxCount: 5,
    },

    {
        name: 'colorFront_2',
        maxCount: 5,
    },

    {
        name: 'colorBack_2',
        maxCount: 5,
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