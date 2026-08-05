'use strict';

const User = require('../models/User');
const AppError = require('../utilities/AppError');
const catchAsync = require('../utilities/CatchAsync');
const { createSendToken } = require('../utilities/Jwt');

const adminLogin = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) return next(new AppError('Email and password required.', 400));

  const user = await User.findOne({ email, role: { $in: ['admin', 'superadmin'] } }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError('Invalid credentials.', 401));
  }

  if (!user.isActive) return next(new AppError('Account deactivated.', 401));

  user.lastLogin = Date.now();
  await user.save({ validateBeforeSave: false });

  createSendToken(user, 200, res);
});

module.exports = { adminLogin };