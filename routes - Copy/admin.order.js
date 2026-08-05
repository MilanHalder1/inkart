'use strict';

const router = require('express').Router();
const { protect, restrictTo } = require('../middleware/Auth');
const {
  getAllOrders,
  getOrder,
  updateOrderStatus,
  cancelOrder, markCODAsPaid, getCustomizedOrders, setDeliveryEstimate,
  approveOrder,
  resendOrderConfirmation,
  // confirmOrder,
  getAdminOrderStatus
} = require('../controllers/admin.order');

router.use(protect, restrictTo('admin', 'superadmin'));
router.get('/customized', getCustomizedOrders);
router.get('/', getAllOrders);
router.get('/:id', getOrder);
router.patch('/:id/status', updateOrderStatus);
router.patch('/:id/cancel', cancelOrder);
router.patch('/:id/mark-paid', protect, restrictTo('admin'), markCODAsPaid);
router.patch('/:id/delivery-estimate', protect, restrictTo('admin', 'super-admin'), setDeliveryEstimate);
router.patch('/:id/approve', protect, restrictTo('admin', 'super-admin'), approveOrder)
router.post('/:id/resend-confirmation', protect, restrictTo('admin', 'super-admin'), resendOrderConfirmation)
// router.patch('/:id/confirm', protect, restrictTo('admin'), confirmOrder);
router.get(
  '/:orderId/status',
  protect,
  restrictTo('admin'),
  getAdminOrderStatus
);
module.exports = router; 