'use strict';

const router = require('express').Router();
const { protect } = require('../middleware/Auth');
const { getWishlist, addToWishlist, removeFromWishlist } = require('../controllers/wishlist');

router.use(protect);
router.get('/', getWishlist);
router.post('/', addToWishlist);
router.delete('/:productId', removeFromWishlist);

module.exports = router;