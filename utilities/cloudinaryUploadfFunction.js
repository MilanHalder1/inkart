const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

const uploadInvoiceToCloudinary = (buffer, orderNumber) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw',
        folder: 'invoices',
        public_id: `invoice-${orderNumber}`,
        format: 'pdf',
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    streamifier.createReadStream(buffer).pipe(stream);
  });
};

module.exports = { uploadInvoiceToCloudinary };