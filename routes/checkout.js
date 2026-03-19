'use strict';

const router = require('express').Router();
const { protect } = require('../../middleware/auth');
const { applyCoupon, removeCoupon, createRazorpayOrder, verifyPayment, getOrderDetails } = require('../../controllers/user/checkout.controller');

router.use(protect);

router.post('/coupon/apply', applyCoupon);
router.delete('/coupon', removeCoupon);
router.post('/create-order', createRazorpayOrder);
router.post('/verify-payment', verifyPayment);
router.get('/orders/:orderId', getOrderDetails);

module.exports = router;