'use strict';

const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const AppError = require('../utilities/AppError');
const catchAsync = require('../utilities/CatchAsync');
const { createSendToken, signToken } = require('../utilities/Jwt');


const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many login attempts. Try again in 15 minutes.' },
});

const register =  catchAsync(async (req, res, next) => {
  const { name, email, password, phone } = req.body;
console.log("name, email, password, phone",name, email, password, phone)
  const existing = await User.findOne({ email });
  console.log('existing',existing)
  if (existing) return next(new AppError('Email already registered.', 409));

  const user = await User.create({ name, email, password, phone, role: 'user' });
  console.log("user",user)
  createSendToken(user, 201, res);
});

const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) return next(new AppError('Please provide email and password.', 400));

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError('Invalid email or password.', 401));
  }

  if (!user.isActive) return next(new AppError('Account deactivated. Contact support.', 401));

  user.lastLogin = Date.now();
  await user.save({ validateBeforeSave: false });

  createSendToken(user, 200, res);
});

const logout = catchAsync(async (req, res) => {

  await User.findByIdAndUpdate(req.user.id, { refreshToken: null });
  res.status(200).json({ success: true, message: 'Logged out successfully.' });
});

const refreshToken =  catchAsync(async (req, res, next) => {
  const { refreshToken: token } = req.body;
  if (!token) return next(new AppError('Refresh token required.', 400));

  const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  const user = await User.findById(decoded.id).select('+refreshToken');
  if (!user || user.refreshToken !== token) {
    return next(new AppError('Invalid refresh token.', 401));
  }

  const newToken = signToken(user._id);
  res.status(200).json({ success: true, token: newToken });
});

const changePassword =  catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user.id).select('+password');

  if (!(await user.comparePassword(currentPassword))) {
    return next(new AppError('Current password is incorrect.', 401));
  }

  user.password = newPassword;
await user.save({ validateBeforeSave: false });
createSendToken(user, 200, res);

});

module.exports = { register, login, logout, refreshToken, changePassword, authLimiter };