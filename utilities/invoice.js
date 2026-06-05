'use strict';

const PDFDocument = require('pdfkit');

const generateInvoice = async (order) => {
  return new Promise((resolve, reject) => {

    const doc = new PDFDocument({
      size: 'A4',
      margin: 0,
    });

    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    // =====================================================
    // COLORS & CONSTANTS
    // =====================================================
    const primary   = '#3B3DC1';   // indigo/blue from reference
    const grayText  = '#6B7280';
    const lightLine = '#E5E7EB';
    const pagePad   = 40;
    const pageW     = 595;         // A4 width in points
    const contentW  = pageW - pagePad * 2;  // 515

    // =====================================================
    // HELPER – horizontal rule
    // =====================================================
    const hRule = (y, color = lightLine) => {
      doc.moveTo(pagePad, y).lineTo(pageW - pagePad, y).strokeColor(color).lineWidth(0.5).stroke();
    };

    // =====================================================
    // HEADER  (logo area + company info  |  TAX INVOICE box)
    // =====================================================
    const headerTop = 35;

    // — Company logo placeholder (small square) —
    doc.rect(pagePad, headerTop, 28, 28).fillColor('#E5E7EB').fill();
    doc.fontSize(9).fillColor('#9CA3AF')
       .text('BC', pagePad + 7, headerTop + 9);

    // — Company name & details —
    doc.fontSize(13).font('Helvetica-Bold').fillColor('#111827')
       .text(order.companyName || 'BlueCart Commerce Pvt. Ltd.', pagePad + 36, headerTop);

    doc.fontSize(8).font('Helvetica').fillColor(grayText)
       .text(`GSTIN: ${order.companyGSTIN || '19AAECB4521L1ZP'}`, pagePad + 36, headerTop + 17);

    const addr = order.companyAddress || '4th Floor, Meridian Tower · Salt Lake Sector V · Kolkata West Bengal 700091 · India';
    doc.fontSize(7.5).fillColor(grayText)
       .text(addr, pagePad + 36, headerTop + 30, { width: 310 });

    const contact = order.companyContact || 'support@bluecart.in  ·  +91 90025 80968  ·  www.bluecart.in';
    doc.fontSize(7.5).fillColor(grayText)
       .text(contact, pagePad + 36, headerTop + 42, { width: 310 });

    // — TAX INVOICE box (right side) —
    const boxX = pageW - pagePad - 175;
    const boxY = headerTop - 5;
    const boxW = 175;
    const boxH = 90;

    doc.rect(boxX, boxY, boxW, boxH).fillColor('#F9FAFB').fill();
    doc.rect(boxX, boxY, boxW, boxH).strokeColor(lightLine).lineWidth(0.6).stroke();

    // "TAX INVOICE" header row inside box
    doc.rect(boxX, boxY, boxW, 20).fillColor(primary).fill();
    doc.fontSize(9).font('Helvetica-Bold').fillColor('white')
       .text('TAX INVOICE', boxX, boxY + 6, { width: boxW, align: 'center' });

    // rows: label left, value right
    const invoiceRows = [
      ['Invoice #',     order.invoiceNumber  || 'INV-2026-1048'],
      ['Invoice Date',  order.invoiceDate    || '08 May 2026'],
      ['Order #',       order.orderNumber    || 'ORD-2026-77621'],
      ['Order Date',    order.orderDate      || '07 May 2026'],
      ['Due Date',      order.dueDate        || '08 May 2026'],
    ];

    invoiceRows.forEach(([label, value], i) => {
      const ry = boxY + 24 + i * 13;
      doc.fontSize(7.5).font('Helvetica').fillColor(grayText)
         .text(label, boxX + 8, ry);
      doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#111827')
         .text(value, boxX + 80, ry, { width: 88, align: 'right' });
    });

    // =====================================================
    // DIVIDER below header
    // =====================================================
    const divY = headerTop + 82;
    hRule(divY);

    // =====================================================
    // BILL TO / SHIP TO
    // =====================================================
    const addrTop  = divY + 14;
    const colW     = (contentW - 10) / 2;

    // Bill To box
    doc.rect(pagePad, addrTop, colW, 105).fillColor('#F9FAFB').fill();
    doc.rect(pagePad, addrTop, colW, 105).strokeColor(lightLine).lineWidth(0.6).stroke();

    doc.fontSize(8).font('Helvetica-Bold').fillColor(primary)
       .text('BILL TO', pagePad + 10, addrTop + 10);

    const bAddr = order.shippingAddress || {};
    doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#111827')
       .text(bAddr.name || 'Riya Sen', pagePad + 10, addrTop + 25);
    doc.fontSize(8).font('Helvetica').fillColor('#374151')
       .text(bAddr.address || '28 Lake View Road', pagePad + 10, addrTop + 38)
       .text(bAddr.address2 || 'Flat 6B', pagePad + 10, addrTop + 50)
       .text(`${bAddr.city || 'Kolkata'}, ${bAddr.state || 'West Bengal'} ${bAddr.pincode || '700029'}`, pagePad + 10, addrTop + 62)
       .text(bAddr.country || 'India', pagePad + 10, addrTop + 74)
       .text(bAddr.email || 'riya.sen@example.com', pagePad + 10, addrTop + 86)
       .text(bAddr.phone || '+91 90025 80968', pagePad + 10, addrTop + 98 < addrTop + 105 ? addrTop + 98 : addrTop + 98);

    // Ship To box
    const shipX = pagePad + colW + 10;
    doc.rect(shipX, addrTop, colW, 105).fillColor('#F9FAFB').fill();
    doc.rect(shipX, addrTop, colW, 105).strokeColor(lightLine).lineWidth(0.6).stroke();

    doc.fontSize(8).font('Helvetica-Bold').fillColor(primary)
       .text('SHIP TO', shipX + 10, addrTop + 10);

    doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#111827')
       .text(bAddr.name || 'Riya Sen', shipX + 10, addrTop + 25);
    doc.fontSize(8).font('Helvetica').fillColor('#374151')
       .text(bAddr.address || '28 Lake View Road', shipX + 10, addrTop + 38)
       .text(bAddr.address2 || 'Flat 6B', shipX + 10, addrTop + 50)
       .text(`${bAddr.city || 'Kolkata'}, ${bAddr.state || 'West Bengal'} ${bAddr.pincode || '700029'}`, shipX + 10, addrTop + 62)
       .text(bAddr.country || 'India', shipX + 10, addrTop + 74)
       .text(bAddr.phone || '+91 90025 80968', shipX + 10, addrTop + 86);

    // =====================================================
    // ITEMS TABLE
    // =====================================================
    let tableTop = addrTop + 120;

    // "ITEMS" heading with item count
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#111827')
       .text('ITEMS', pagePad, tableTop);

    const itemCount = (order.items || []).length;
    doc.fontSize(8).font('Helvetica').fillColor(grayText)
       .text(`${itemCount} product${itemCount !== 1 ? 's' : ''}`, pagePad, tableTop, { width: contentW, align: 'right' });

    tableTop += 16;

    // Table header row
    const th = 22;
    doc.rect(pagePad, tableTop, contentW, th).fillColor('#F3F4F6').fill();
    doc.rect(pagePad, tableTop, contentW, th).strokeColor(lightLine).lineWidth(0.5).stroke();

    const cols = {
      num:       pagePad + 8,
      product:   pagePad + 30,
      qty:       pagePad + 290,
      unitPrice: pagePad + 340,
      discount:  pagePad + 395,
      tax:       pagePad + 445,
      lineTotal: pagePad + 480,
    };

    doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#374151');
    doc.text('#',              cols.num,       tableTop + 7);
    doc.text('Product + SKU',  cols.product,   tableTop + 7);
    doc.text('Qty',            cols.qty,       tableTop + 7);
    doc.text('Unit Price',     cols.unitPrice, tableTop + 7);
    doc.text('Discount',       cols.discount,  tableTop + 7);
    doc.text('Tax %',          cols.tax,       tableTop + 7);
    doc.text('Line Total',     cols.lineTotal, tableTop + 7);

    tableTop += th;

    // Table rows
    let grandTotal = 0;
    let subtotal   = 0;
    let totalDisc  = 0;

    const items = order.items || [
      { name: 'Noise Cancellation Headphones', sku: 'ELEC-NCH-531', quantity: 1, price: 4939, discount: 500, tax: 18 },
      { name: 'Smart Fitness Watch',            sku: 'ELEC-SFW-294', quantity: 1, price: 3299, discount: 300, tax: 18 },
      { name: 'Cotton Oversized Hoodie',         sku: 'FSHN-HOD-13',  quantity: 2, price: 1499, discount: 200, tax: 12 },
    ];

    items.forEach((item, idx) => {
      const rowH   = 30;
      const base   = item.price * item.quantity;
      const disc   = (item.discount || 0);
      const taxAmt = ((base - disc) * (item.tax || 0)) / 100;
      const total  = base - disc + taxAmt;

      subtotal  += base;
      totalDisc += disc;
      grandTotal += total;

      const bg = idx % 2 === 0 ? 'white' : '#FAFAFA';
      doc.rect(pagePad, tableTop, contentW, rowH).fillColor(bg).fill();

      doc.fontSize(8).font('Helvetica-Bold').fillColor('#111827')
         .text(String(idx + 1), cols.num, tableTop + 6);

      doc.fontSize(8).font('Helvetica-Bold').fillColor('#111827')
         .text(item.name || 'Product', cols.product, tableTop + 5, { width: 240 });
      doc.fontSize(7).font('Helvetica').fillColor(grayText)
         .text(`SKU: ${item.sku || ''}`, cols.product, tableTop + 17, { width: 240 });

      doc.fontSize(8).font('Helvetica').fillColor('#374151')
         .text(String(item.quantity), cols.qty, tableTop + 11);

      doc.fontSize(8).font('Helvetica').fillColor('#374151')
         .text(`\u20B9${item.price.toLocaleString('en-IN')}.00`, cols.unitPrice, tableTop + 11);

      doc.fontSize(8).font('Helvetica').fillColor('#DC2626')
         .text(`\u20B9${disc.toLocaleString('en-IN')}.00`, cols.discount, tableTop + 11);

      doc.fontSize(8).font('Helvetica').fillColor('#374151')
         .text(`${item.tax || 0}%`, cols.tax, tableTop + 11);

      doc.fontSize(8).font('Helvetica-Bold').fillColor('#111827')
         .text(`\u20B9${total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, cols.lineTotal, tableTop + 11);

      tableTop += rowH;
      hRule(tableTop);
    });

    // =====================================================
    // PAYMENT / SHIPPING / PRICING SUMMARY  (3 columns)
    // =====================================================
    tableTop += 18;

    const boxTop  = tableTop;
    const boxH2   = 110;
    const bw      = (contentW - 20) / 3;

    // — PAYMENT DETAILS —
    const px = pagePad;
    doc.rect(px, boxTop, bw, boxH2).fillColor('#F9FAFB').fill();
    doc.rect(px, boxTop, bw, boxH2).strokeColor(lightLine).lineWidth(0.6).stroke();

    doc.fontSize(8).font('Helvetica-Bold').fillColor(primary)
       .text('PAYMENT DETAILS', px + 10, boxTop + 10);

    const payRows = [
      ['Payment Method', (order.paymentMethod || 'UPI').toUpperCase()],
      ['Payment Status',  order.paymentStatus || 'PAID'],
      ['Transaction ID',  order.transactionId || 'UPI2026A5B8RC778Z1'],
      ['Payment Date',    order.paymentDate   || '08 May 2026'],
    ];
    payRows.forEach(([label, value], i) => {
      const ry = boxTop + 27 + i * 16;
      doc.fontSize(7.5).font('Helvetica').fillColor(grayText).text(label, px + 10, ry);
      const isGreen = value === 'PAID';
      if (isGreen) {
        doc.roundedRect(px + bw - 50, ry - 2, 38, 12, 3).fillColor('#D1FAE5').fill();
        doc.fontSize(7).font('Helvetica-Bold').fillColor('#065F46').text(value, px + bw - 50, ry + 1, { width: 38, align: 'center' });
      } else {
        doc.fontSize(7.5).font('Helvetica').fillColor('#111827').text(value, px + 10 + 70, ry, { width: bw - 80 });
      }
    });

    // — SHIPPING DETAILS —
    const sx = pagePad + bw + 10;
    doc.rect(sx, boxTop, bw, boxH2).fillColor('#F9FAFB').fill();
    doc.rect(sx, boxTop, bw, boxH2).strokeColor(lightLine).lineWidth(0.6).stroke();

    doc.fontSize(8).font('Helvetica-Bold').fillColor(primary)
       .text('SHIPPING DETAILS', sx + 10, boxTop + 10);

    const shipRows = [
      ['Courier',       order.shipment?.courier  || 'BlueDart'],
      ['Tracking #',    order.shipment?.awb       || 'BDXT556712349IN'],
      ['Method',        order.shipment?.method    || 'Express Delivery'],
      ['Est. Delivery', order.shipment?.eta        || '10 May 2026'],
    ];
    shipRows.forEach(([label, value], i) => {
      const ry = boxTop + 27 + i * 16;
      doc.fontSize(7.5).font('Helvetica').fillColor(grayText).text(label, sx + 10, ry);
      doc.fontSize(7.5).font('Helvetica').fillColor('#111827').text(value, sx + 10 + 65, ry, { width: bw - 75 });
    });

    // — PRICING SUMMARY —
    const prX = pagePad + (bw + 10) * 2;
    doc.rect(prX, boxTop, bw, boxH2).fillColor('#F9FAFB').fill();
    doc.rect(prX, boxTop, bw, boxH2).strokeColor(lightLine).lineWidth(0.6).stroke();

    doc.fontSize(8).font('Helvetica-Bold').fillColor(primary)
       .text('PRICING SUMMARY', prX + 10, boxTop + 10);

    const shipping = order.shippingCharge || 149;
    const cgst     = order.cgst  || ((grandTotal - shipping) * 0.09);
    const sgst     = order.sgst  || ((grandTotal - shipping) * 0.09);

    const summaryRows = [
      ['Subtotal',   `\u20B9${subtotal.toLocaleString('en-IN')}.00`,          false],
      ['Discount',   `- \u20B9${totalDisc.toLocaleString('en-IN')}.00`,        true],
      ['Shipping',   `\u20B9${shipping}`,                                      false],
      ['CGST (9%)',  `\u20B9${cgst.toFixed(2)}`,                               false],
      ['SGST (9%)',  `\u20B9${sgst.toFixed(2)}`,                               false],
    ];

    summaryRows.forEach(([label, value, isRed], i) => {
      const ry = boxTop + 27 + i * 13;
      doc.fontSize(7.5).font('Helvetica').fillColor(grayText).text(label, prX + 10, ry);
      doc.fontSize(7.5).font('Helvetica').fillColor(isRed ? '#DC2626' : '#374151')
         .text(value, prX + 10, ry, { width: bw - 20, align: 'right' });
    });

    hRule(boxTop + boxH2 - 18, lightLine);

    doc.fontSize(8).font('Helvetica-Bold').fillColor(primary)
       .text('Grand Total', prX + 10, boxTop + boxH2 - 14);
    doc.fontSize(8).font('Helvetica-Bold').fillColor(primary)
       .text(`\u20B9${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, prX + 10, boxTop + boxH2 - 14, { width: bw - 20, align: 'right' });

    // Amount in words
    doc.fontSize(7.5).font('Helvetica').fillColor(grayText)
       .text('\u20B9 Indian Rupee', prX + 10, boxTop + boxH2);

    // =====================================================
    // FOOTER
    // =====================================================
    const footerY = boxTop + boxH2 + 30;

    hRule(footerY - 5);

    doc.fontSize(8).font('Helvetica').fillColor(grayText)
       .text('This is a system-generated invoice and does not require a signature.', pagePad, footerY, { width: contentW, align: 'left' });

    doc.fontSize(8).font('Helvetica').fillColor(grayText)
       .text('Return & Refund Policy: ', pagePad, footerY + 13, { continued: true })
       .fillColor(primary).text('View policy', { continued: true })
       .fillColor(grayText).text('   Terms & Conditions: ', { continued: true })
       .fillColor(primary).text('Read terms', { continued: false });

    doc.fontSize(9).font('Helvetica-Bold').fillColor('#111827')
       .text('Thank you for shopping with us!', pagePad, footerY + 28, { width: contentW, align: 'left' });

    doc.end();
  });
};

module.exports = { generateInvoice };