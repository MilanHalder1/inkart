
'use strict';

const router = require('express').Router();
const { getAllProducts, getProduct, getProductVariants, getCategories } = require('../controllers/product');

router.get('/', getAllProducts);
router.get('/categories', getCategories);
router.get('/:id', getProduct);
router.get('/:id/variants', getProductVariants);

module.exports = router;