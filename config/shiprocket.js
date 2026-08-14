'use strict';

const axios = require('axios');

let token = null;
let tokenExpiry = null;


// 🔑 Generate Token
const getToken = async () => {
  try {
    // Token still valid
    if (
      token &&
      tokenExpiry &&
      Date.now() < tokenExpiry
    ) {
      return token;
    }

    const res = await axios.post(
      `${process.env.SHIPROCKET_BASE_URL}/auth/login`,
      {
        email: process.env.SHIPROCKET_EMAIL,
        password: process.env.SHIPROCKET_PASSWORD,
      }
    );

    token = res.data.token;

    // Shiprocket token expires in ~10 days.
    // Refresh automatically after 9 days.
    tokenExpiry =
      Date.now() + 9 * 24 * 60 * 60 * 1000;

    console.log("✅ Shiprocket Token Generated");

    return token;

  } catch (err) {

    token = null;
    tokenExpiry = null;

    console.error(
      "Shiprocket Login Error",
      err.response?.data || err.message
    );

    throw err;
  }
};


// 🚚 CREATE SHIPMENT
const createShipment = async (order) => {

  try {

    const authToken = await getToken();
    console.log('authToken', authToken)
    // ✅ Populate required data
    await order.populate('user', 'name email');

    await order.populate('items.product', 'name');

    const payload = {

      order_id: order.orderNumber,

      order_date: new Date(),

      pickup_location: 'Office', // MUST EXIST IN SHIPROCKET

      billing_customer_name:
        order.shippingAddress.fullName,

      billing_last_name: '',

      billing_address:
        order.shippingAddress.line1 || " Default address",

      billing_address_2:
        order.shippingAddress.line2 || '',

      billing_city:
        order.shippingAddress.city,

      billing_pincode:
        order.shippingAddress.pincode,

      billing_state:
        order.shippingAddress.state,

      billing_country:
        order.shippingAddress.country || 'India',

      billing_email:
        order.user.email,

      billing_phone:
        order.shippingAddress.phone,

      shipping_is_billing: true,

      order_items: order.items.map(item => ({

        name: item.name,

        sku: item.product?._id?.toString() || 'SKU',

        units: item.quantity,

        selling_price: item.price,
      })),

      payment_method:
        order.paymentMethod === 'cod'
          ? 'COD'
          : 'Prepaid',

      sub_total: order.total,

      length: 10,
      breadth: 10,
      height: 10,
      weight: 0.5,
    };

    console.log(
      '📦 Shiprocket Payload:',
      JSON.stringify(payload, null, 2)
    );

    const res = await axios.post(
      `${process.env.SHIPROCKET_BASE_URL}/orders/create/adhoc`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,

          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ Shipment Created');
    console.log("shipment data", res.data, res?.data?.data)
    const shipment = res.data;

    return {
      shiprocketOrderId:
        shipment.order_id,

      shipmentId:
        shipment.shipment_id,

      awb:
        shipment.awb_code,

      courier:
        shipment.courier_name,

      trackingUrl:
        shipment.tracking_url,

      status:
        shipment.status,

      manifestUrl:
        shipment.manifest_url,

      labelUrl:
        shipment.label_url,

      pickupToken:
        shipment.pickup_token,

      estimatedDeliveryDate:
        shipment.estimated_delivery_date,

      raw: shipment
    };

  } catch (err) {

    console.error(
      '❌ Shiprocket Error:',
      err.response?.data || err.message
    );

    throw err;
  }
};
// ===============================
// ASSIGN COURIER
// ===============================

const assignCourier = async (
  shipmentId
) => {

  try {

    const authToken =
      await getToken();

    const res = await axios.post(

      `${process.env.SHIPROCKET_BASE_URL}/courier/assign/awb`,

      {
        shipment_id: shipmentId
      },

      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json"
        }
      }

    );

    console.log(
      "Courier Assigned",
      res.data
    );

    return res.data;

  }
  catch (err) {

    console.log(
      "Assign Courier Error",
      err.response?.data || err.message
    );

    throw err;
  }

};

// 📦 TRACK SHIPMENT
const trackShipment = async (awb) => {

  try {
    console.log('track shipment')
    const authToken = await getToken();

    const res = await axios.get(
      `${process.env.SHIPROCKET_BASE_URL}/courier/track/awb/${awb}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );
    console.log('res.data', res.data)

    return res.data;

  } catch (err) {

    console.error(
      '❌ Track Shipment Error:',
      err.response?.data || err.message
    );

    throw err;
  }
};

const schedulePickup = async (
  shipmentId
) => {

  const authToken = await getToken();

  const res = await axios.post(
    `${process.env.SHIPROCKET_BASE_URL}/courier/generate/pickup`,
    {
      shipment_id: [shipmentId]
    },
    {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    }
  );

  return res.data;
};

const checkPincodeServiceability = async ({
  deliveryPincode,
  weight = 0.5,
  cod = false,
}) => {

  try {

    const authToken = await getToken();

    const pickupPincode =
      process.env.SHIPROCKET_PICKUP_PINCODE;

    if (!pickupPincode) {
      throw new Error(
        'SHIPROCKET_PICKUP_PINCODE is not configured'
      );
    }

    const res = await axios.get(
      `${process.env.SHIPROCKET_BASE_URL}/courier/serviceability/`,
      {
        params: {
          pickup_postcode: pickupPincode,
          delivery_postcode: deliveryPincode,
          weight,
          cod: cod ? 1 : 0,
        },

        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    return res.data;

  } catch (err) {

    console.error(
      '❌ Pincode Serviceability Error:',
      err.response?.data || err.message
    );

    throw err;
  }
};

const cancelShipment = async (
  shipmentId
) => {

  const authToken = await getToken();

  const res = await axios.post(
    `${process.env.SHIPROCKET_BASE_URL}/orders/cancel`,
    {
      ids: [shipmentId]
    },
    {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    }
  );

  return res.data;
};

const generateManifest = async (
  shipmentId
) => {

  const authToken = await getToken();

  const res = await axios.post(
    `${process.env.SHIPROCKET_BASE_URL}/manifests/generate`,
    {
      shipment_id: [shipmentId]
    },
    {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    }
  );

  return res.data;
};
const generateLabel = async (
  shipmentId
) => {

  const authToken = await getToken();

  const res = await axios.post(
    `${process.env.SHIPROCKET_BASE_URL}/courier/generate/label`,
    {
      shipment_id: [shipmentId]
    },
    {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    }
  );

  return res.data;
};
const getShipmentDetails = async (shipmentId) => {
  try {
    const authToken = await getToken();

    const res = await axios.get(
      `${process.env.SHIPROCKET_BASE_URL}/shipments/${shipmentId}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    const shipment = res.data.data || res.data;

    return {
      shipmentId: shipment.id,
      shiprocketOrderId: shipment.order_id,
      awb: shipment.awb,
      courier: shipment.courier,
      status: shipment.status,
      trackingUrl: shipment.tracking_url,
      manifestUrl: shipment.manifest_url,
      labelUrl: shipment.label_url,
      pickupToken: shipment.pickup_token_number,
      estimatedDeliveryDate: shipment.estimated_delivery_date,
      raw: shipment,
    };
  } catch (err) {
    console.error(
      "❌ Get Shipment Details Error",
      err.response?.data || err.message
    );

    throw err;
  }
};


//NDR 

const   getNDRShipments = async ({
  page = 1,
  perPage = 20,
  search = '',
  from = '',
  to = '',
} = {}) => {

  const authToken = await getToken();

  const params = {
    page,
    per_page: perPage,
  };

  if (search) params.search = search;
  if (from) params.from = from;
  if (to) params.to = to;

  try {

    const res = await axios.get(
      `${process.env.SHIPROCKET_BASE_URL}/ndr/all`,
      {
        params,
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return res.data;

  } catch (err) {

    console.error(
      '❌ Get NDR Shipments Error:',
      err.response?.data || err.message
    );

    throw err;
  }
};  
const getNDRDetails = async (awb) => {

  const authToken = await getToken();

  try {

    const res = await axios.get(
      `${process.env.SHIPROCKET_BASE_URL}/ndr/${awb}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return res.data;

  } catch (err) {

    console.error(
      '❌ Get NDR Details Error:',
      err.response?.data || err.message
    );

    throw err;
  }
};
const takeNDRAction = async ({
  awb,
  action,
  comments,
  phone,
  address1,
  address2,
  deferredDate,
}) => {

  const authToken = await getToken();

  const payload = {
    action,
    comments,
  };

  if (phone) {
    payload.phone = phone;
  }

  if (address1) {
    payload.address1 = address1;
  }

  if (address2) {
    payload.address2 = address2;
  }

  if (deferredDate) {
    payload.deferred_date = deferredDate;
  }

  try {

    console.log(
      '📦 Shiprocket NDR Action:',
      JSON.stringify(payload, null, 2)
    );

    const res = await axios.post(
      `${process.env.SHIPROCKET_BASE_URL}/ndr/${awb}/action`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log(
      '✅ NDR Action Successful:',
      res.data
    );

    return res.data;

  } catch (err) {

    console.error(
      '❌ NDR Action Error:',
      err.response?.data || err.message
    );

    throw err;
  }
};
module.exports = {
  createShipment,
  trackShipment,
  checkPincodeServiceability, cancelShipment, generateLabel, generateManifest, schedulePickup, getShipmentDetails, assignCourier,getNDRDetails,getNDRShipments
  ,takeNDRAction
};