'use strict';

const router = require('express').Router();
const { protect } = require('../middleware/Auth');
const { applyCoupon, removeCoupon, createRazorpayOrder, verifyPayment, getOrderDetails } = require('../controllers/checkout');

router.use(protect);

router.post('/coupon/apply', applyCoupon);
router.delete('/coupon', removeCoupon);
router.post('/create-order', createRazorpayOrder);
router.post('/verify-payment', verifyPayment);
router.get('/orders/:orderId', getOrderDetails);

module.exports = router;