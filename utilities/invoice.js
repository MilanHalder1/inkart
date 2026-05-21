'use strict';

const PDFDocument = require('pdfkit');

const generateInvoice = async (order) => {
  return new Promise((resolve, reject) => {

    const doc = new PDFDocument({
      size: 'A4',
      margin: 40,
    });

    const buffers = [];

    doc.on('data', buffers.push.bind(buffers));

    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      resolve(pdfData);
    });

    doc.on('error', reject);

    // =====================================================
    // COLORS
    // =====================================================

    const primary = '#1E40AF';
    const gray = '#6B7280';
    const lightGray = '#E5E7EB';

    // =====================================================
    // HEADER
    // =====================================================

    doc
      .fontSize(18)
      .fillColor(primary)
      .text('COLOURSTREAK INDIA PRIVATE LIMITED', 40, 40);

    doc
      .fontSize(10)
      .fillColor('black')
      .text('140 AUROBINDO SARANI', 40, 65)
      .text('Kolkata, West Bengal 700006', 40, 80)
      .text('India', 40, 95)
      .text('GSTIN: 19AAKCC9289J1ZR', 40, 110);

    // =====================================================
    // INVOICE BOX
    // =====================================================

    doc
      .roundedRect(380, 40, 170, 100, 5)
      .stroke(lightGray);

    doc
      .fontSize(14)
      .fillColor(primary)
      .text('TAX INVOICE', 400, 55);

    doc
      .fontSize(10)
      .fillColor('black')
      .text(`Invoice #:`, 395, 85)
      .text(`Order #:`, 395, 105)
      .text(`Invoice Date:`, 395, 125);

    doc
      .font('Helvetica-Bold')
      .text(`${order.orderNumber}`, 470, 85)
      .text(`${order.orderNumber}`, 470, 105)
      .text(
        new Date().toLocaleDateString('en-IN'),
        470,
        125
      );

    doc.font('Helvetica');

    // =====================================================
    // DIVIDER
    // =====================================================

    doc
      .moveTo(40, 160)
      .lineTo(550, 160)
      .stroke(lightGray);

    // =====================================================
    // BILL TO / SHIP TO
    // =====================================================

    doc
      .roundedRect(40, 180, 240, 120, 5)
      .stroke(lightGray);

    doc
      .roundedRect(310, 180, 240, 120, 5)
      .stroke(lightGray);

    // BILL TO

    doc
      .fontSize(11)
      .fillColor(primary)
      .text('BILL TO', 55, 195);

    doc
      .fontSize(10)
      .fillColor('black')
      .text(order.shippingAddress?.name || '', 55, 220)
      .text(order.shippingAddress?.address || '', 55, 235)
      .text(
        `${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''} ${order.shippingAddress?.pincode || ''}`,
        55,
        250
      )
      .text(order.shippingAddress?.country || 'India', 55, 265)
      .text(order.shippingAddress?.phone || '', 55, 280);

    // SHIP TO

    doc
      .fontSize(11)
      .fillColor(primary)
      .text('SHIP TO', 325, 195);

    doc
      .fontSize(10)
      .fillColor('black')
      .text(order.shippingAddress?.name || '', 325, 220)
      .text(order.shippingAddress?.address || '', 325, 235)
      .text(
        `${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''} ${order.shippingAddress?.pincode || ''}`,
        325,
        250
      )
      .text(order.shippingAddress?.country || 'India', 325, 265)
      .text(order.shippingAddress?.phone || '', 325, 280);

    // =====================================================
    // ITEMS TABLE
    // =====================================================

    let tableTop = 340;

    doc
      .fontSize(12)
      .fillColor(primary)
      .text('ITEMS', 40, tableTop);

    tableTop += 25;

    // HEADER

    doc
      .rect(40, tableTop, 510, 25)
      .fillAndStroke('#F9FAFB', lightGray);

    doc.fillColor('black');

    doc.text('#', 50, tableTop + 7);
    doc.text('Product', 80, tableTop + 7);
    doc.text('Qty', 300, tableTop + 7);
    doc.text('Price', 350, tableTop + 7);
    doc.text('Total', 470, tableTop + 7);

    tableTop += 30;

    // ITEMS

    let grandTotal = 0;

   order.items.forEach((item, index) => {

  const total = item.price * item.quantity;

  grandTotal += total;

  doc
    .fontSize(10)
    .fillColor('black')

    .text(index + 1, 50, tableTop)

    .text(
      item.name || 'Product',
      80,
      tableTop,
      {
        width: 180,
      }
    )

    .text(item.quantity, 305, tableTop)

    .text(`₹${item.price}`, 350, tableTop)

    .text(`₹${total}`, 470, tableTop);

  tableTop += 28;

  doc
    .moveTo(40, tableTop - 5)
    .lineTo(550, tableTop - 5)
    .stroke(lightGray);
});

    // =====================================================
    // PAYMENT + SHIPPING + SUMMARY
    // =====================================================

    tableTop += 20;

    // PAYMENT BOX

    doc
      .roundedRect(40, tableTop, 160, 120, 5)
      .stroke(lightGray);

    doc
      .fontSize(11)
      .fillColor(primary)
      .text('PAYMENT DETAILS', 55, tableTop + 15);

    doc
      .fontSize(10)
      .fillColor('black')
      .text(
        `Method: ${order.paymentMethod?.toUpperCase()}`,
        55,
        tableTop + 45
      )
      .text(
        `Status: ${order.paymentStatus?.toUpperCase()}`,
        55,
        tableTop + 65
      );

    // SHIPPING BOX

    doc
      .roundedRect(215, tableTop, 160, 120, 5)
      .stroke(lightGray);

    doc
      .fontSize(11)
      .fillColor(primary)
      .text('SHIPPING DETAILS', 230, tableTop + 15);

    doc
      .fontSize(10)
      .fillColor('black')
      .text(
        `Courier: ${order.shipment?.courier || 'Shiprocket'}`,
        230,
        tableTop + 45
      )
      .text(
        `AWB: ${order.shipment?.awb || 'Pending'}`,
        230,
        tableTop + 65
      )
      .text(
        `Status: ${order.orderStatus}`,
        230,
        tableTop + 85
      );

    // SUMMARY BOX

    doc
      .roundedRect(390, tableTop, 160, 120, 5)
      .stroke(lightGray);

    doc
      .fontSize(11)
      .fillColor(primary)
      .text('PRICING SUMMARY', 405, tableTop + 15);

    const shipping = order.shippingCharge || 0;

    const discount = order.discount || 0;

    const finalTotal =
      grandTotal + shipping - discount;

    doc
      .fontSize(10)
      .fillColor('black')
      .text(`Subtotal`, 405, tableTop + 45)
      .text(`₹${grandTotal}`, 500, tableTop + 45)

      .text(`Shipping`, 405, tableTop + 65)
      .text(`₹${shipping}`, 500, tableTop + 65)

      .text(`Discount`, 405, tableTop + 85)
      .text(`- ₹${discount}`, 500, tableTop + 85);

    doc
      .moveTo(405, tableTop + 103)
      .lineTo(540, tableTop + 103)
      .stroke(lightGray);

    doc
      .font('Helvetica-Bold')
      .fontSize(12)
      .fillColor(primary)
      .text(`₹${finalTotal}`, 480, tableTop + 110);

   
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor(gray)
      .text(
        'This is a system-generated invoice and does not require signature.',
        40,
        760,
        {
          align: 'center',
          width: 520,
        }
      );

    doc
      .fontSize(10)
      .fillColor('black')
      .text(
        'Thank you for shopping with us!',
        40,
        780,
        {
          align: 'center',
          width: 520,
        }
      );

   
    doc.end();
  });
};

module.exports = { generateInvoice }; 