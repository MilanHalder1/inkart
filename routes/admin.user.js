'use strict';

const router = require('express').Router();
const { protect, restrictTo } = require('../middleware/Auth');
const { deleteUser } = require('../controllers/admin.user');

router.delete('/users/:id', protect, restrictTo('admin'), deleteUser);

module.exports = router;