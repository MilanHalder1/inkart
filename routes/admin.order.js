'use strict';

const router = require('express').Router();
const { protect, restrictTo } = require('../middleware/Auth');
const {
  getAllOrders,
  getOrder,
  updateOrderStatus,
  cancelOrder,markCODAsPaid,getCustomizedOrders,setDeliveryEstimate,
  approveOrder,
  resendOrderConfirmation
} = require('../controllers/admin.order');

router.use(protect, restrictTo('admin', 'superadmin'));
router.get('/customized',getCustomizedOrders);
router.get('/', getAllOrders);
router.get('/:id', getOrder);
router.patch('/:id/status', updateOrderStatus);
router.patch('/:id/cancel', cancelOrder);
router.patch('/:id/mark-paid', protect, restrictTo('admin'), markCODAsPaid);
router.patch('/:id/delivery-estimate',protect,restrictTo('admin', 'super-admin'),setDeliveryEstimate);
router.patch('/:id/approve',protect,restrictTo('admin', 'super-admin'),approveOrder)
router.post('/:id/resend-confirmation',protect,restrictTo('admin', 'super-admin'),resendOrderConfirmation)

module.exports = router; 