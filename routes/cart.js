'use strict';

const router = require('express').Router();
const { protect } = require('../middleware/Auth');
const { getCart, addToCart, updateCartItem, removeFromCart, clearCart } = require('../controllers/cart');

router.use(protect);

router.get('/', getCart);
router.post('/items', addToCart);
router.patch('/items/:itemId', updateCartItem);
router.delete('/items/:itemId', removeFromCart);
router.delete('/', clearCart);

module.exports = router;