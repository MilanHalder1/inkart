'use strict';

const router = require('express').Router();
const { protect, restrictTo } = require('../middleware/Auth');
const {
  getAllOrders,
  getOrder,
  updateOrderStatus,
  cancelOrder,markCODAsPaid,getCustomizedOrders
} = require('../controllers/admin.order');

router.use(protect, restrictTo('admin', 'superadmin'));
router.get('/customized',getCustomizedOrders);
router.get('/', getAllOrders);
router.get('/:id', getOrder);
router.patch('/:id/status', updateOrderStatus);
router.patch('/:id/cancel', cancelOrder);
router.patch('/:id/mark-paid', protect, restrictTo('admin'), markCODAsPaid);

module.exports = router; 