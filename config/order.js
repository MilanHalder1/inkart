const { sendEmail } = require('../utilities/email');

exports.sendOrderPlacedEmail = async (user, order) => {
  const html = `
    <h2>Order Confirmed</h2>
    <p>Hi ${user.name},</p>
    <p>Your order <b>${order.orderNumber}</b> has been placed successfully.</p>
    <p>Total: ₹${order.total}</p>
  `;

  await sendEmail({
    to: user.email,
    subject: 'Order Placed Successfully',
    html,
  });
};
exports.sendInvoiceEmail = async (user, order, invoiceUrl) => {
  const html = `
    <h2>Invoice</h2>
    <p>Hi ${user.name},</p>
    <p>Here is your invoice for order <b>${order.orderNumber}</b>.</p>
  `;

  await sendEmail({
    to: user.email,
    subject: 'Your Invoice',
    html,
    attachments: [
      {
        filename: `invoice-${order.orderNumber}.pdf`,
        path: invoiceUrl, // ✅ Cloudinary URL
      },
    ],
  });
};