'use strict';

const router = require('express').Router();

const { protect, restrictTo } = require('../middleware/Auth');
const {
  trackMyOrder,shipmentDetails,getLabel,getManifest,pickupShipment,cancelOrderShipment,
  syncShipment,getAllNDR,getOrderNDR,rtoNDR,reattemptNDR,
  checkPincode
} = require('../controllers/shipment');


router.get(
  '/:id/track',
  protect,
  trackMyOrder
);

router.post('/check-delivery',protect,checkPincode  );
router.get(
    '/:id/shipmentDetails',
    protect,
    shipmentDetails
);


router.get(
    '/:id/label',
    protect,
    getLabel
);

router.get(
    '/:id/manifest',
    protect,
    getManifest
);

router.post(
    '/:id/pickup',
    protect,
    pickupShipment
);

router.post(
    '/:id/cancel-shipment',
    protect,
    cancelOrderShipment
);
router.post(
    '/:id/sync-shipment',
    protect,
    syncShipment
);

router.get(
  '/ndr',
   protect,
  restrictTo('admin',"superadmin"),
  getAllNDR
);


// Get NDR of particular order
router.get(
  '/:orderId/ndr',
   protect,
  restrictTo('admin',"superadmin"),
  getOrderNDR
);


// Reattempt
router.post(
  '/:orderId/ndr/reattempt',
  protect,
  restrictTo('admin',"superadmin"),
  reattemptNDR
);


// RTO
router.post(
  '/:orderId/ndr/rto',
  protect,
  restrictTo('admin',"superadmin"),
  rtoNDR
);



module.exports = router;