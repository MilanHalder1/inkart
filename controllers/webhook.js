'use strict';
const Order = require('../models/Order');
const User = require('../models/User');
const { generateInvoice } = require('../utilities/invoice');
const { sendInvoiceEmail } = require('../config/order');
const { uploadInvoiceToCloudinary } = require('../utilities/cloudinaryUploadfFunction');


const shiprocketWebhook = async (req, res) => {
  try {
    const payload = req.body;

    console.log('📦 Shiprocket Webhook:', JSON.stringify(payload, null, 2));

    const awb = payload.awb || payload.awb_code;
    const status = payload.current_status;

    if (!awb) {
      return res.status(400).send('AWB missing');
    }

    const order = await Order.findOne({ 'shipment.awb': awb });

    if (!order) {
      return res.status(404).send('Order not found');
    }

    // 🔄 Map Shiprocket → Your Order Status
    let orderStatus = order.orderStatus;

    switch (status) {
      case 'NEW':
        orderStatus = 'placed';
        break;

      case 'PICKED UP':
        orderStatus = 'processing';
        break;

      case 'IN TRANSIT':
      case 'OUT FOR DELIVERY':
        orderStatus = 'shipped';
        break;

      case 'DELIVERED':
        orderStatus = 'delivered';
        order.deliveredAt = new Date();
        break;

      case 'CANCELLED':
        orderStatus = 'cancelled';
        break;

      default:
        break;
    }

    // ✅ Update order
    order.shipment.status = status;
    order.orderStatus = orderStatus;

    order.statusHistory.push({
      status: orderStatus,
      note: `Updated via Shiprocket webhook: ${status}`,
    });

    await order.save();

    // 🚨 IMPORTANT: HANDLE COD INVOICE AFTER DELIVERY
    if (
      orderStatus === 'delivered' &&
      order.paymentMethod === 'cod' &&
      !order.invoiceUrl // prevent duplicate invoice
    ) {
      try {
        const user = await User.findById(order.user);

        // 🧾 Generate invoice
        const buffer = await generateInvoice(order);

        // ☁️ Upload to Cloudinary
        const upload = await uploadInvoiceToCloudinary(
          buffer,
          order.orderNumber
        );
        //

        // 💾 Save invoice URL
        order.invoiceUrl = upload.secure_url;
        await order.save();

        // 📧 Send email with URL
        await sendInvoiceEmail(user, order, upload.secure_url);

        console.log('✅ COD Invoice sent');
      } catch (err) {
        console.error('❌ Invoice/Email Error:', err.message);
      }
    }

    return res.status(200).send('Webhook processed');

  } catch (err) {
    console.error('❌ Webhook Error:', err);
    return res.status(500).send('Server Error');
  }
};

module.exports = {
  shiprocketWebhook,
};
