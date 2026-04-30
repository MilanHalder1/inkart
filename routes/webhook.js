'use strict';

const router = require('express').Router();
const { shiprocketWebhook } = require('../controllers/webhook');


router.post('/shiprocket', shiprocketWebhook);

module.exports = router;