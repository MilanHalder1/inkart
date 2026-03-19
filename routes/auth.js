'use strict';

const express = require('express');
const router=express.Router();
const { body } = require('express-validator');
const { register, login, logout, refreshToken, changePassword, authLimiter } = require('../controllers/auth');
const { protect } = require('../middleware/Auth');
const validate = require('../middleware/Validate'); 

router.post('/register', validate([
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
]), register);

router.post('/login', authLimiter, validate([
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
]), login);

router.post('/logout', protect, logout);
router.post('/refresh-token', refreshToken);

router.patch('/change-password', protect, validate([
  body('currentPassword').notEmpty().withMessage('Current password required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
]), changePassword);

module.exports = router;