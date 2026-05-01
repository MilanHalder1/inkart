'use strict';

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// ✅ Config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ Storage (supports images + PDF)
const createStorage = (
  folder,
  allowedFormats = ['jpg', 'jpeg', 'png', 'webp', 'pdf']
) => {
  return new CloudinaryStorage({
    cloudinary,
    params: {
      folder: `ecommerce/${folder}`,
      allowed_formats: allowedFormats,
      resource_type: 'auto', // ✅ important for pdf
      transformation: [{ quality: 'auto', fetch_format: 'auto' }],
    },
  });
};

// ✅ Multer uploader
const createUploader = (folder, allowedFormats) => {
  return multer({
    storage: createStorage(folder, allowedFormats),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
      if (
        file.mimetype.startsWith('image/') ||
        file.mimetype === 'application/pdf'
      ) {
        cb(null, true);
      } else {
        cb(new Error('Only image or PDF files are allowed'), false);
      }
    },
  });
};

// ✅ Delete
const deleteImage = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'auto' });
  } catch (err) {
    console.error('Cloudinary delete error:', err.message);
  }
};

// ✅ IMPORTANT EXPORT
module.exports = {
  cloudinary, // 👈 MUST EXPORT THIS
  createUploader,
  deleteImage,
};