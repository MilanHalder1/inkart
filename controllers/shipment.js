 'use strict';

const Order = require('../models/Order');

const {
  trackShipment,
} = require('../config/shiprocket');

const catchAsync = require('../utilities/CatchAsync');

const AppError = require('../utilities/AppError');


// ✅ TRACK ORDER
const trackMyOrder = catchAsync(async (req, res, next) => {

  const order = await Order.findOne({
    _id: req.params.id,
    user: req.user.id,
  });

  if (!order) {
    return next(
      new AppError('Order not found', 404)
    );
  }

  if (!order.shipment?.awb) {
    return next(
      new AppError(
        'Shipment tracking not available yet',
        400
      )
    );
  }

  const tracking = await trackShipment(
    order.shipment.awb
  );

  res.status(200).json({
    success: true,

    data: {
      shipment: order.shipment,

      tracking,
    },
  });
});


module.exports = {
  trackMyOrder,
};