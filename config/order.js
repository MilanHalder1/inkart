'use strict';

const { sendEmail } = require('../utilities/email');


// ✅ ORDER PLACED MAIL
exports.sendOrderPlacedEmail = async (user, order) => {

  await sendEmail({
    to: user.email,

    subject: `Order Placed - ${order.orderNumber}`,

    html: `
      <h2>Order Placed Successfully 🎉</h2>

      <p>Hello ${user.name},</p>

      <p>Your order <b>${order.orderNumber}</b> has been placed successfully.</p>

      <p>Total Amount: ₹${order.total}</p>

      <p>Thank you for shopping with us.</p>
    `,
  });
};


// ✅ INVOICE MAIL
exports.sendInvoiceEmail = async (
  user,
  order,
  invoiceBuffer
) => {

  await sendEmail({
    to: user.email,

    subject: `Invoice - ${order.orderNumber}`,

    html: `
      <h2>Invoice Generated 🧾</h2>

      <p>Hello ${user.name},</p>

      <p>Your invoice for order <b>${order.orderNumber}</b> is attached below.</p>

      <p>Thank you for shopping with us.</p>
    `,

    attachments: [
      {
        filename: `invoice-${order.orderNumber}.pdf`,

        content: invoiceBuffer,

        contentType: 'application/pdf',
      },
    ],
  });
};