'use strict';

const Order = require('../models/Order');

const {
  trackShipment, getDeliveryEstimate, getShipmentDetails, generateLabel, cancelShipment, schedulePickup, generateManifest,assignCourier
} = require('../config/shiprocket');

const catchAsync = require('../utilities/CatchAsync');

const AppError = require('../utilities/AppError');


// ✅ TRACK ORDER
const trackMyOrder = catchAsync(async (req, res, next) => {

   const order = await Order.findById(req.params.id);


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
    data: order.shipment
  });

});
const syncShipment = catchAsync(async (req, res, next) => {

    const order = await Order.findById(req.params.id);

    if (!order)
        return next(new AppError("Order not found", 404));

    if (!order.shipment?.shipmentId)
        return next(new AppError("Shipment not created", 400));

    // ----------------------------
    // Assign courier if AWB missing
    // ----------------------------

    if (!order.shipment.awb) {

        try {

            await assignCourier(
                order.shipment.shipmentId
            );

        } catch (err) {

            console.log(err.response?.data);

        }

    }

    // ----------------------------
    // Get Latest Shipment Details
    // ----------------------------

    const details = await getShipmentDetails(
        order.shipment.shipmentId
    );

    order.shipment.awb =
        details.awb || order.shipment.awb;

    order.shipment.courier =
        details.courier || order.shipment.courier;

    order.shipment.status =
        details.status || order.shipment.status;

    order.shipment.trackingUrl =
        details.trackingUrl || order.shipment.trackingUrl;

    order.shipment.estimatedDeliveryDate =
        details.estimatedDeliveryDate
            ? new Date(details.estimatedDeliveryDate)
            : order.shipment.estimatedDeliveryDate;

    order.shipment.lastTrackingUpdate =
        new Date();

    // ----------------------------
    // Generate Label
    // ----------------------------

    if (
        order.shipment.awb &&
        !order.shipment.labelUrl
    ) {

        try {

            const label =
                await generateLabel(
                    order.shipment.shipmentId
                );

            order.shipment.labelUrl =
                label.label_url;

        } catch (err) {

            console.log(err.response?.data);

        }

    }

    // ----------------------------
    // Generate Manifest
    // ----------------------------

    if (
        order.shipment.awb &&
        !order.shipment.manifestUrl
    ) {

        try {

            const manifest =
                await generateManifest(
                    order.shipment.shipmentId
                );

            order.shipment.manifestUrl =
                manifest.manifest_url;

        } catch (err) {

            console.log(err.response?.data);

        }

    }

    // ----------------------------
    // Schedule Pickup
    // ----------------------------

    if (
        order.shipment.awb &&
        !order.shipment.pickupToken
    ) {

        try {

            const pickup =
                await schedulePickup(
                    order.shipment.shipmentId
                );

            order.shipment.pickupToken =
                pickup.pickup_token;

        } catch (err) {

            console.log(err.response?.data);

        }

    }

    await order.save();

    res.status(200).json({
        success: true,
        shipment: order.shipment
    });

});

const getAllNDR = catchAsync(async (req, res, next) => {

  const {
    page = 1,
    limit = 20,
    search,
    from,
    to,
  } = req.query;

  const data = await getNDRShipments({
    page: Number(page),
    perPage: Number(limit),
    search,
    from,
    to,
  });

  res.status(200).json({
    success: true,
    data,
  });

});
const getOrderNDR = catchAsync(async (req, res, next) => {

  const order = await Order.findById(req.params.orderId);

  if (!order) {
    return next(
      new AppError('Order not found', 404)
    );
  }

  if (!order.shipment?.awb) {
    return next(
      new AppError('Shipment AWB not available', 400)
    );
  }

  const data = await getNDRDetails(
    order.shipment.awb
  );

  res.status(200).json({
    success: true,
    data,
  });

});
const reattemptNDR = catchAsync(async (req, res, next) => {

  const order = await Order.findById(
    req.params.orderId
  );

  if (!order) {
    return next(
      new AppError('Order not found', 404)
    );
  }

  if (!order.shipment?.awb) {
    return next(
      new AppError('Shipment AWB not available', 400)
    );
  }

  const {
    comments,
    phone,
    address1,
    address2,
    deferredDate,
  } = req.body;

  if (!comments) {
    return next(
      new AppError(
        'Comments are required for NDR reattempt',
        400
      )
    );
  }

  const result = await takeNDRAction({

    awb: order.shipment.awb,

    action: 're-attempt',

    comments,

    phone,

    address1,

    address2,

    deferredDate,
  });

  // Update our DB

  order.shipment.lastTrackingUpdate =
    new Date();

  order.shipment.lastShiprocketError = null;

  order.statusHistory.push({

    status: 'reattempt_requested',

    note:
      `NDR reattempt requested. ${comments}`,

  });

  await order.save();

  res.status(200).json({

    success: true,

    message:
      'NDR reattempt requested successfully',

    data: result,

  });

});

const rtoNDR = catchAsync(async (req, res, next) => {

  const order = await Order.findById(
    req.params.orderId
  );

  if (!order) {
    return next(
      new AppError('Order not found', 404)
    );
  }

  if (!order.shipment?.awb) {
    return next(
      new AppError('Shipment AWB not available', 400)
    );
  }

  const result = await takeNDRAction({

    awb: order.shipment.awb,

    action: 'return',

    comments:
      req.body.comments ||
      'Customer requested return after failed delivery attempt',

  });

  order.statusHistory.push({

    status: 'rto_requested',

    note:
      req.body.comments ||
      'RTO requested from NDR',

  });

  await order.save();

  res.status(200).json({

    success: true,

    message:
      'RTO requested successfully',

    data: result,

  });

});

module.exports = {
  trackMyOrder, checkDelivery, shipmentDetails, cancelOrderShipment, pickupShipment, getManifest, getLabel, trackOrder ,syncShipment,reattemptNDR,getAllNDR,getOrderNDR,rtoNDR
};