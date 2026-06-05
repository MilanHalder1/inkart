'use strict';

const PDFDocument = require('pdfkit');

const generateInvoice = async (order) => {
  return new Promise((resolve, reject) => {

    const doc = new PDFDocument({ size: 'A4', margin: 0 });

    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    // =====================================================
    // COLORS
    // =====================================================
    const primary   = '#1E40AF';
    const gray      = '#6B7280';
    const lightGray = '#E5E7EB';
    const PAD       = 40;
    const PAGE_W    = 595;
    const CONTENT_W = PAGE_W - PAD * 2; // 515

    // Helper: horizontal rule
    const hRule = (y, color = lightGray, lw = 0.5) => {
      doc.moveTo(PAD, y).lineTo(PAGE_W - PAD, y)
         .strokeColor(color).lineWidth(lw).stroke();
    };

    // Helper: right-aligned text in a column
    const rText = (text, x, y, width, opts = {}) => {
      doc.text(text, x, y, { width, align: 'right', ...opts });
    };

    // =====================================================
    // HEADER  — logo + company info  |  TAX INVOICE box
    // =====================================================
    const hTop = 36;

    // Logo placeholder
    doc.rect(PAD, hTop, 30, 30).fillColor('#E5E7EB').fill();
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#9CA3AF')
       .text('CS', PAD + 7, hTop + 10);

    // Company name
    doc.fontSize(13).font('Helvetica-Bold').fillColor(primary)
       .text('COLOURSTREAK INDIA PRIVATE LIMITED', PAD + 38, hTop + 2);

    // Address lines
    doc.fontSize(8).font('Helvetica').fillColor('#374151')
       .text('140 AUROBINDO SARANI', PAD + 38, hTop + 18)
       .text('Kolkata, West Bengal 700006', PAD + 38, hTop + 28)
       .text('India', PAD + 38, hTop + 38)
       .text('GSTIN: 19AAKCC9289J1ZR', PAD + 38, hTop + 48);

    // TAX INVOICE box (right)
    const bx = PAGE_W - PAD - 175;
    const by = hTop - 5;
    const bw = 175;
    const bh = 90;

    doc.rect(bx, by, bw, bh).fillColor('#F9FAFB').fill();
    doc.rect(bx, by, bw, bh).strokeColor(lightGray).lineWidth(0.6).stroke();

    // Box header bar
    doc.rect(bx, by, bw, 20).fillColor(primary).fill();
    doc.fontSize(9).font('Helvetica-Bold').fillColor('white')
       .text('TAX INVOICE', bx, by + 6, { width: bw, align: 'center' });

    // Invoice rows
    const invRows = [
      ['Invoice #:',    order.orderNumber],
      ['Order #:',      order.orderNumber],
      ['Invoice Date:', new Date().toLocaleDateString('en-IN')],
    ];
    invRows.forEach(([label, value], i) => {
      const ry = by + 26 + i * 17;
      doc.fontSize(8).font('Helvetica').fillColor(gray).text(label, bx + 10, ry);
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#111827')
         .text(value, bx + 10, ry, { width: bw - 20, align: 'right' });
    });

    // =====================================================
    // DIVIDER
    // =====================================================
    hRule(hTop + 72);

    // =====================================================
    // BILL TO / SHIP TO
    // =====================================================
    const addrTop = hTop + 82;
    const colW    = (CONTENT_W - 10) / 2;

    // BILL TO box
    doc.rect(PAD, addrTop, colW, 110).fillColor('#F9FAFB').fill();
    doc.rect(PAD, addrTop, colW, 110).strokeColor(lightGray).lineWidth(0.6).stroke();

    doc.fontSize(8.5).font('Helvetica-Bold').fillColor(primary)
       .text('BILL TO', PAD + 10, addrTop + 10);

    doc.fontSize(9).font('Helvetica-Bold').fillColor('#111827')
       .text(order.shippingAddress?.name || '', PAD + 10, addrTop + 26);
    doc.fontSize(8).font('Helvetica').fillColor('#374151')
       .text(order.shippingAddress?.address || '', PAD + 10, addrTop + 40)
       .text(
         `${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''} ${order.shippingAddress?.pincode || ''}`,
         PAD + 10, addrTop + 54
       )
       .text(order.shippingAddress?.country || 'India', PAD + 10, addrTop + 68)
       .text(order.shippingAddress?.phone || '', PAD + 10, addrTop + 82);

    // SHIP TO box
    const sx = PAD + colW + 10;
    doc.rect(sx, addrTop, colW, 110).fillColor('#F9FAFB').fill();
    doc.rect(sx, addrTop, colW, 110).strokeColor(lightGray).lineWidth(0.6).stroke();

    doc.fontSize(8.5).font('Helvetica-Bold').fillColor(primary)
       .text('SHIP TO', sx + 10, addrTop + 10);

    doc.fontSize(9).font('Helvetica-Bold').fillColor('#111827')
       .text(order.shippingAddress?.name || '', sx + 10, addrTop + 26);
    doc.fontSize(8).font('Helvetica').fillColor('#374151')
       .text(order.shippingAddress?.address || '', sx + 10, addrTop + 40)
       .text(
         `${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''} ${order.shippingAddress?.pincode || ''}`,
         sx + 10, addrTop + 54
       )
       .text(order.shippingAddress?.country || 'India', sx + 10, addrTop + 68)
       .text(order.shippingAddress?.phone || '', sx + 10, addrTop + 82);

    // =====================================================
    // ITEMS TABLE
    // =====================================================
    let tableTop = addrTop + 126;

    // Section label
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#111827')
       .text('ITEMS', PAD, tableTop);

    tableTop += 16;

    // Table header row
    doc.rect(PAD, tableTop, CONTENT_W, 24).fillColor('#F3F4F6').fill();
    doc.rect(PAD, tableTop, CONTENT_W, 24).strokeColor(lightGray).lineWidth(0.5).stroke();

    doc.fontSize(8).font('Helvetica-Bold').fillColor('#374151');
    doc.text('#',       PAD + 8,   tableTop + 8);
    doc.text('Product', PAD + 30,  tableTop + 8);
    doc.text('Qty',     PAD + 295, tableTop + 8);
    doc.text('Price',   PAD + 345, tableTop + 8);
    doc.text('Total',   PAD + 460, tableTop + 8);

    tableTop += 24;

    // Item rows
    let grandTotal = 0;

    order.items.forEach((item, index) => {
      const total = item.price * item.quantity;
      grandTotal += total;

      const rowH = 28;
      const bg   = index % 2 === 0 ? 'white' : '#F9FAFB';
      doc.rect(PAD, tableTop, CONTENT_W, rowH).fillColor(bg).fill();

      doc.fontSize(8.5).font('Helvetica').fillColor('#374151')
         .text(index + 1,       PAD + 8,   tableTop + 9)
         .text(item.name || 'Product', PAD + 30, tableTop + 9, { width: 240 })
         .text(item.quantity,   PAD + 295, tableTop + 9)
         .text(`\u20B9${item.price}`, PAD + 345, tableTop + 9);

      doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#111827')
         .text(`\u20B9${total}`, PAD + 460, tableTop + 9);

      tableTop += rowH;
      hRule(tableTop);
    });

    // =====================================================
    // PAYMENT + SHIPPING + SUMMARY  (3 equal columns)
    // =====================================================
    tableTop += 20;

    const boxTop = tableTop;
    const boxH   = 120;
    const boxW3  = (CONTENT_W - 20) / 3;

    // — PAYMENT DETAILS —
    const px = PAD;
    doc.rect(px, boxTop, boxW3, boxH).fillColor('#F9FAFB').fill();
    doc.rect(px, boxTop, boxW3, boxH).strokeColor(lightGray).lineWidth(0.6).stroke();

    doc.fontSize(8.5).font('Helvetica-Bold').fillColor(primary)
       .text('PAYMENT DETAILS', px + 10, boxTop + 12);

    // Status pill
    const statusVal = (order.paymentStatus || '').toUpperCase();
    const pillColor = statusVal === 'PAID' ? '#D1FAE5' : '#FEF3C7';
    const pillText  = statusVal === 'PAID' ? '#065F46' : '#92400E';
    doc.roundedRect(px + boxW3 - 55, boxTop + 36, 42, 13, 3).fillColor(pillColor).fill();
    doc.fontSize(7).font('Helvetica-Bold').fillColor(pillText)
       .text(statusVal, px + boxW3 - 55, boxTop + 39, { width: 42, align: 'center' });

    doc.fontSize(8).font('Helvetica').fillColor(gray)
       .text(`Method: ${(order.paymentMethod || '').toUpperCase()}`, px + 10, boxTop + 37)
       .text(`Status:`, px + 10, boxTop + 57);

    // — SHIPPING DETAILS —
    const shx = PAD + boxW3 + 10;
    doc.rect(shx, boxTop, boxW3, boxH).fillColor('#F9FAFB').fill();
    doc.rect(shx, boxTop, boxW3, boxH).strokeColor(lightGray).lineWidth(0.6).stroke();

    doc.fontSize(8.5).font('Helvetica-Bold').fillColor(primary)
       .text('SHIPPING DETAILS', shx + 10, boxTop + 12);

    doc.fontSize(8).font('Helvetica').fillColor(gray)
       .text(`Courier: ${order.shipment?.courier || 'Shiprocket'}`, shx + 10, boxTop + 37)
       .text(`AWB: ${order.shipment?.awb || 'Pending'}`,            shx + 10, boxTop + 54)
       .text(`Status: ${order.orderStatus}`,                         shx + 10, boxTop + 71);

    // — PRICING SUMMARY —
    const prx = PAD + (boxW3 + 10) * 2;
    doc.rect(prx, boxTop, boxW3, boxH).fillColor('#F9FAFB').fill();
    doc.rect(prx, boxTop, boxW3, boxH).strokeColor(lightGray).lineWidth(0.6).stroke();

    doc.fontSize(8.5).font('Helvetica-Bold').fillColor(primary)
       .text('PRICING SUMMARY', prx + 10, boxTop + 12);

    const shipping   = order.shippingCharge || 0;
    const discount   = order.discount || 0;
    const finalTotal = grandTotal + shipping - discount;

    const summaryRows = [
      ['Subtotal',  `\u20B9${grandTotal}`],
      ['Shipping',  `\u20B9${shipping}`],
      ['Discount',  `- \u20B9${discount}`],
    ];
    summaryRows.forEach(([label, value], i) => {
      const ry = boxTop + 37 + i * 16;
      doc.fontSize(8).font('Helvetica').fillColor(gray).text(label, prx + 10, ry);
      doc.fontSize(8).font('Helvetica').fillColor('#374151')
         .text(value, prx + 10, ry, { width: boxW3 - 20, align: 'right' });
    });

    hRule(boxTop + 99, lightGray);

    doc.fontSize(9).font('Helvetica-Bold').fillColor(primary)
       .text('Total', prx + 10, boxTop + 104)
       .text(`\u20B9${finalTotal}`, prx + 10, boxTop + 104, { width: boxW3 - 20, align: 'right' });

    // =====================================================
    // FOOTER
    // =====================================================
    const footerY = 750;
    hRule(footerY - 6);

    doc.fontSize(8).font('Helvetica').fillColor(gray)
       .text(
         'This is a system-generated invoice and does not require signature.',
         PAD, footerY, { width: CONTENT_W, align: 'center' }
       );

    doc.fontSize(9).font('Helvetica-Bold').fillColor('#111827')
       .text(
         'Thank you for shopping with us!',
         PAD, footerY + 18, { width: CONTENT_W, align: 'center' }
       );

    doc.end();
  });
};

module.exports = { generateInvoice };