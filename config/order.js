const { sendEmail } = require('../utilities/email');

exports.sendOrderPlacedEmail = async (user, order) => {
  await sendEmail({
    to: user.email,
    subject: 'Order Placed Successfully',
    html: `<h3>Order ${order.orderNumber} placed successfully</h3>`,
  });
};

exports.sendInvoiceEmail = async (user, order, invoicePath) => {
  await sendEmail({
    to: user.email,
    subject: 'Your Invoice',
    html: `<h3>Invoice for ${order.orderNumber}</h3>`,
    attachments: [{ filename: 'invoice.pdf', path: invoicePath }],
  });
};