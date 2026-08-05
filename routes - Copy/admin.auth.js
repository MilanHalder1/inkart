'use strict';

const router = require('express').Router();
const { adminLogin } = require('../controllers/admin.auth');

router.post('/login', adminLogin);

module.exports = router;