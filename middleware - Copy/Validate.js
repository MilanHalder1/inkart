'use strict';

const { validationResult } = require('express-validator');
const AppError = require('../utilities/AppError');

const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map((validation) => validation.run(req)));
    const errors = validationResult(req);
    if (errors.isEmpty()) return next();
    const message = errors.array().map((err) => err.msg).join('. ');
    return next(new AppError(message, 400));
  };
};

module.exports = validate;