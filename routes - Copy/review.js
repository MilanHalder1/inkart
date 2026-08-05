'use strict';

const router = require('express').Router();

const { protect } = require('../middleware/Auth');

const {
  createReview,
  getProductReviews,
  deleteReview,
} = require('../controllers/review');

router.get('/product/:productId', getProductReviews);

router.use(protect);

router.post('/', createReview);
router.delete('/:reviewId', deleteReview);

module.exports = router;