'use strict';

const Order = require('../models/Order');

const {
  trackShipment, getDeliveryEstimate
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
const checkDelivery = catchAsync(
  async (req, res, next) => {

    const {
      pincode,
      weight = 0.5,
      cod = false,
    } = req.body;

    if (!pincode) {
      return next(
        new AppError(
          'Pincode is required',
          400
        )
      );
    }

    const estimate =
      await getDeliveryEstimate({
        deliveryPincode: pincode,
        weight,
        cod,
      });

    const couriers =
      estimate.data
        ?.available_courier_companies || [];

    if (!couriers.length) {
      return next(
        new AppError(
          'Delivery not available for this pincode',
          400
        )
      );
    }

    // Fastest courier
    const fastest = couriers.sort(
      (a, b) =>
        a.estimated_delivery_days -
        b.estimated_delivery_days
    )[0];

    const packingDays = 2;

    const courierDays = Number(
      fastest.estimated_delivery_days || 0
    );

    const estimatedDays =
      courierDays + packingDays;

    const estimatedDate = new Date();

    estimatedDate.setDate(
      estimatedDate.getDate() + estimatedDays
    );

    res.status(200).json({
      success: true,
      data: {
        courier: fastest.courier_name,
        estimatedDays,
        estimatedDate,
        packingDays,
        courierDays:
          fastest.estimated_delivery_days,
        message: `Delivered in ${estimatedDays} days`,
      },
    });
  }
);


module.exports = {
  trackMyOrder, checkDelivery
};