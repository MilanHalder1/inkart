'use strict';

const router = require('express').Router();

const { protect, restrictTo } = require('../middleware/Auth');

const {
  getDashboardStats,
  getRevenueOverTime,
} = require('../controllers/admin.analytics');



router.use(protect, restrictTo('admin', 'super-admin'));
router.get('/dashboard-stats', getDashboardStats);
router.get('/revenue-over-time', getRevenueOverTime);


module.exports = router;