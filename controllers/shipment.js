'use strict';

const Order = require('../models/Order');

const {
  trackShipment, getDeliveryEstimate, getShipmentDetails, generateLabel, cancelShipment, schedulePickup, generateManifest,
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

const trackOrder = catchAsync(async (req, res, next) => {

  const order = await Order.findById(req.params.id);

  if (!order)
    return next(new AppError('Order not found', 404));

  if (!order.shipment?.awb)
    return next(new AppError('Shipment not created', 400));

  const tracking = await trackShipment(
    order.shipment.awb
  );

  res.status(200).json({
    success: true,
    data: tracking
  });

});
const getLabel = catchAsync(async (req, res, next) => {

  const order = await Order.findById(req.params.id);

  if (!order)
    return next(new AppError('Order not found', 404));

  const data = await generateLabel(
    order.shipment.shipmentId
  );

  if (data.label_url) {

    order.shipment.labelUrl = data.label_url;
    await order.save();

  }

  res.json({
    success: true,
    data
  });

});

const getManifest = catchAsync(async (req, res, next) => {

  const order = await Order.findById(req.params.id);

  if (!order)
    return next(new AppError('Order not found', 404));

  const data = await generateManifest(
    order.shipment.shipmentId
  );

  if (data.manifest_url) {

    order.shipment.manifestUrl = data.manifest_url;
    await order.save();

  }

  res.json({
    success: true,
    data
  });

});

const pickupShipment = catchAsync(async (req, res, next) => {

  const order = await Order.findById(req.params.id);

  if (!order)
    return next(new AppError('Order not found', 404));

  const data = await schedulePickup(
    order.shipment.shipmentId
  );

  if (data.pickup_token) {

    order.shipment.pickupToken =
      data.pickup_token;

    await order.save();

  }

  res.json({
    success: true,
    message: 'Pickup Scheduled',
    data
  });

});
const cancelOrderShipment = catchAsync(async (req, res, next) => {

  const order = await Order.findById(req.params.id);

  if (!order)
    return next(new AppError('Order not found', 404));

  const data = await cancelShipment(
    order.shipment.shipmentId
  );

  order.shipment.status = 'cancelled';

  order.shipmentStatus = 'cancelled';

  await order.save();

  res.json({
    success: true,
    message: 'Shipment Cancelled',
    data
  });

});

const shipmentDetails = catchAsync(async (req, res, next) => {

  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  if (!order.shipment?.shipmentId) {
    return next(new AppError('Shipment not created yet', 400));
  }


   const details = await getShipmentDetails(
      order.shipment.shipmentId
    );
  // Optional: Update latest values in DB
 

 

    order.shipment.awb = details.awb || order.shipment.awb;

    order.shipment.courier =
      details.courier || order.shipment.courier;

    order.shipment.status =
      details.status || order.shipment.status;

    order.shipment.trackingUrl =
      details.trackingUrl || order.shipment.trackingUrl;

    order.shipment.labelUrl =
      details.labelUrl || order.shipment.labelUrl;

    order.shipment.manifestUrl =
      details.manifestUrl || order.shipment.manifestUrl;

    order.shipment.pickupToken =
      details.pickupToken || order.shipment.pickupToken;

    order.shipment.estimatedDeliveryDate =
      details.estimatedDeliveryDate
        ? new Date(details.estimatedDeliveryDate)
        : order.shipment.estimatedDeliveryDate;

    order.shipment.lastTrackingUpdate = new Date();

    await order.save();
  

  res.status(200).json({
    success: true,
    data: shipment
  });

});
module.exports = {
  trackMyOrder, checkDelivery, shipmentDetails, cancelOrderShipment, pickupShipment, getManifest, getLabel, trackOrder
};