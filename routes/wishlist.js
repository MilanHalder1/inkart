'use strict';

const router = require('express').Router();
const { protect } = require('../../middleware/auth');
const { getWishlist, addToWishlist, removeFromWishlist } = require('../../controllers/user/wishlist.controller');

router.use(protect);
router.get('/', getWishlist);
router.post('/', addToWishlist);
router.delete('/:productId', removeFromWishlist);

module.exports = router;