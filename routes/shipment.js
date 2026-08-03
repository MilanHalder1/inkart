'use strict';

const router = require('express').Router();

const { protect } = require('../middleware/Auth');
const {
  trackMyOrder,
  checkDelivery,shipmentDetails,getLabel,getManifest,pickupShipment,cancelOrderShipment
} = require('../controllers/shipment');

router.get(
  '/:id/track',
  protect,
  trackMyOrder
);

router.post('/check-delivery',checkDelivery);
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



module.exports = router;