'use strict';

const router = require('express').Router();

const { protect } = require('../middleware/Auth');

const {
  trackMyOrder,
} = require('../controllers/shipment');

router.get(
  '/:id/track',
  protect,
  trackMyOrder
);

module.exports = router;