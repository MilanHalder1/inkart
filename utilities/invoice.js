const PDFDocument = require('pdfkit');

const generateInvoice = async (order) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const buffers = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      resolve(pdfData);
    });

    doc.on('error', reject);

    // 🧾 Your invoice content
    doc.fontSize(18).text(`Invoice - ${order.orderNumber}`);
    doc.text(`Total: ₹${order.total}`);
    doc.text(`Payment: ${order.paymentMethod}`);
    doc.text(`Status: ${order.paymentStatus}`);

    doc.end();
  });
};

module.exports = { generateInvoice };