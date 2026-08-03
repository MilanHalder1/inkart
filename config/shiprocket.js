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

const getDeliveryEstimate = async ({
  deliveryPincode,
  weight = 0.5,
  cod = false,
}) => {
  const authToken = await getToken();

  const res = await axios.get(
    `${process.env.SHIPROCKET_BASE_URL}/courier/serviceability/`,
    {
      params: {
        pickup_postcode: '700006', // Your warehouse pincode
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

  const authToken = await getToken();

  const res = await axios.get(
    `${process.env.SHIPROCKET_BASE_URL}/shipments/${shipmentId}`,
    {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    }
  );

  return res.data;
};

module.exports = {
  createShipment,
  trackShipment,
  getDeliveryEstimate, cancelShipment, generateLabel, generateManifest, schedulePickup, getShipmentDetails
};