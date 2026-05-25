'use strict';

const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const User = require('../models/User');

const { sendEmail } = require('../utilities/email');
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

    // ✅ GENERATE OTP

  const otp = Math.floor(
    100000 + Math.random() * 900000
  ).toString();

  // ✅ SAVE OTP

  user.loginOtp = otp;

  user.loginOtpExpires = Date.now() + 5 * 60 * 1000;

  await user.save({ validateBeforeSave: false });

  // ✅ SEND EMAIL

  await sendEmail({
    to: user.email,

    subject: 'Login OTP',

    html: `
      <h2>Your Login OTP</h2>

      <p>OTP: <b>${otp}</b></p>

      <p>This OTP expires in 5 minutes.</p>
    `,
  });

  res.status(200).json({
    success: true,
    message: 'OTP sent to email',
  });
});
const verifyLoginOtp = catchAsync(async (req, res, next) => {

  const { email, otp } = req.body;

  if (!email || !otp) {
    return next(
      new AppError('Email and OTP required', 400)
    );
  }

  const user = await User.findOne({ email });

  if (!user) {
    return next(
      new AppError('User not found', 404)
    );
  }

  // ✅ INVALID OTP

  if (user.loginOtp !== otp) {
    return next(
      new AppError('Invalid OTP', 400)
    );
  }

  // ✅ OTP EXPIRED

  if (user.loginOtpExpires < Date.now()) {
    return next(
      new AppError('OTP expired', 400)
    );
  }

  // ✅ CLEAR OTP

  user.loginOtp = undefined;

  user.loginOtpExpires = undefined;

  await user.save({ validateBeforeSave: false });

  // ✅ LOGIN SUCCESS

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




const forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return next(new AppError('User not found.', 404));
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  user.resetOtp = otp;
  user.resetOtpExpiry = Date.now() + 10 * 60 * 1000; // 10 mins

  await user.save({ validateBeforeSave: false });

  await sendEmail({
    to: user.email,
    subject: 'Password Reset OTP',
    html: `
      <h2>Password Reset</h2>
      <p>Your OTP is:</p>
      <h1>${otp}</h1>
      <p>Valid for 10 minutes.</p>
    `,
  });

  res.status(200).json({
    success: true,
    message: 'OTP sent to email.',
  });
});

const verifyOtp = catchAsync(async (req, res, next) => {
  const { email, otp } = req.body;

  const user = await User.findOne({
    email,
    resetOtp: otp,
    resetOtpExpiry: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError('Invalid or expired OTP.', 400));
  }

  res.status(200).json({
    success: true,
    message: 'OTP verified.',
  });
});


const resetPassword = catchAsync(async (req, res, next) => {
  const { email, otp, password } = req.body;

  const user = await User.findOne({
    email,
    resetOtp: otp,
    resetOtpExpiry: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError('Invalid or expired OTP.', 400));
  }

  user.password = password;

  user.resetOtp = undefined;
  user.resetOtpExpiry = undefined;

await user.save({ validateBeforeSave: false });
  res.status(200).json({
    success: true,
    message: 'Password reset successful.',
  });
});

module.exports = { register, login, logout, refreshToken, changePassword,verifyLoginOtp, authLimiter,forgotPassword ,verifyOtp,resetPassword};