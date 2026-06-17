'use strict';

const router = require('express').Router();

const { protect } = require('../middleware/Auth');

const {
  trackMyOrder,
  checkDelivery,
} = require('../controllers/shipment');

router.get(
  '/:id/track',
  protect,
  trackMyOrder
);

router.post('/check-delivery',checkDelivery)
module.exports = router;