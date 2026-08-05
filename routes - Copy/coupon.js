'use strict';

const router = require('express').Router();
const { protect, restrictTo } = require('../middleware/Auth');

const {
  createCoupon,
  getAllCoupons,
  getCoupon,
  updateCoupon,
  deleteCoupon,
  toggleCoupon
} = require('../controllers/coupon');


// 🔐 Admin Protection
router.use(protect, restrictTo('admin'));


/**
 * Coupon Routes
 */
router.route('/')
  .post(createCoupon)
  .get(getAllCoupons);

router.route('/:id')
  .get(getCoupon)
  .patch(updateCoupon)
  .delete(deleteCoupon);

router.patch('/:id/toggle', toggleCoupon);


module.exports = router;