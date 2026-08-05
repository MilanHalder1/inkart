'use strict';

const jwt = require('jsonwebtoken');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const signRefreshToken = (id) =>
  jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' });

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const refreshToken = signRefreshToken(user._id);

  // Strip sensitive fields
  user.password = undefined;
  user.refreshToken = undefined;

  res.status(statusCode).json({
    success: true,
    token,
    refreshToken,
    data: { user },
  });
};

module.exports = { signToken, signRefreshToken, createSendToken };