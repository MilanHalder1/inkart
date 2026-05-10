const Order = require('../models/Order');
const catchAsync = require('../utilities/CatchAsync');

const getMyOrders = catchAsync(async (req, res) => {
    console.log("req.user.id====>",req.user.id)
  const orders = await Order.find({
    user: req.user.id,
  })
    .sort('-createdAt')
    .populate('items.product', 'name images slug');

  res.status(200).json({
    success: true,
    results: orders.length,
    data: { orders },
  });
});


module.exports={getMyOrders}