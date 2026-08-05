'use strict';

const router = require('express').Router();
const { trackMyOrder } = require('../controllers/shipment');
const { shiprocketWebhook } = require('../controllers/webhook');


router.post('/shiprocket', shiprocketWebhook);

module.exports = router;