'use strict';

const User = require('../models/User');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const AppError = require('../utilities/AppError');
const catchAsync = require('../utilities/CatchAsync');

exports.deleteUser = catchAsync(async (req, res, next) => {
  const userId = req.params.id;

  // ❌ Prevent admin deleting themselves (optional but recommended)
  if (req.user.id === userId) {
    return next(new AppError('You cannot delete your own account.', 400));
  }

  const user = await User.findById(userId);
  if (!user) return next(new AppError('User not found.', 404));

  // 🔥 OPTION 1 (SAFE): Soft delete
  user.isActive = false;
  await user.save();

  // 🔥 OPTION 2 (HARD DELETE) → Uncomment if you want permanent delete
 await Promise.all([
  Order.deleteMany({ user: userId }),
  Cart.deleteMany({ user: userId }),
  User.findByIdAndDelete(userId),
]);


  res.status(200).json({
    success: true,
    message: 'User deleted successfully.',
  });
});