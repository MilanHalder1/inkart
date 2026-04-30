'use strict';

const axios = require('axios');

let token = null;

// 🔑 Get Token
const getToken = async () => {
  if (token) return token;

  const res = await axios.post(
    `${process.env.SHIPROCKET_BASE_URL}/auth/login`,
    {
      email: process.env.SHIPROCKET_EMAIL,
      password: process.env.SHIPROCKET_PASSWORD,
    }
  );

  token = res.data.token;
  return token;
};


// 🚚 Create Shipment
const createShipment = async (order) => {
  const authToken = await getToken();

  const res = await axios.post(
    `${process.env.SHIPROCKET_BASE_URL}/orders/create/adhoc`,
    {
      order_id: order._id.toString(),
      order_date: new Date(),
      pickup_location: "Primary",
      billing_customer_name: order.shippingAddress.name,
      billing_address: order.shippingAddress.address,
      billing_city: order.shippingAddress.city,
      billing_pincode: order.shippingAddress.pincode,
      billing_state: order.shippingAddress.state,
      billing_country: "India",
      billing_email: order.user.email,
      billing_phone: order.shippingAddress.phone,
      order_items: order.items.map(item => ({
        name: item.product.name,
        sku: item.product._id.toString(),
        units: item.quantity,
        selling_price: item.price,
      })),
      payment_method: order.paymentMethod === 'cod' ? "COD" : "Prepaid",
      sub_total: order.totalPrice,
      length: 10,
      breadth: 10,
      height: 10,
      weight: 0.5,
    },
    {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    }
  );

  return res.data;
};


// 📦 Track Shipment
const trackShipment = async (awb) => {
  const authToken = await getToken();

  const res = await axios.get(
    `${process.env.SHIPROCKET_BASE_URL}/courier/track/awb/${awb}`,
    {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    }
  );

  return res.data;
};

module.exports = { createShipment, trackShipment };