const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

exports.generateInvoice = async (order) => {
  const fileName = `invoice-${order.orderNumber}.pdf`;
  const filePath = path.join(__dirname, `../invoices/${fileName}`);

  const doc = new PDFDocument();
  doc.pipe(fs.createWriteStream(filePath));

  doc.fontSize(18).text(`Invoice - ${order.orderNumber}`);
  doc.text(`Customer: ${order.shippingAddress.fullName}`);
  doc.text(`Total: ₹${order.total}`);

  order.items.forEach(item => {
    doc.text(`${item.name} x ${item.quantity}`);
  });

  doc.end();

  order.invoiceUrl = filePath;
  await order.save();

  return filePath;
};