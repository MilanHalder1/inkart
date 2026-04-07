'use strict';

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const connectDB = require('./config/db');
const logger = require('./config/logger');
const { errorHandler, notFound } = require('./middleware/ErrorHandler');

const userAuthRoutes = require('./routes/auth');
const userProfileRoutes = require('./routes/profile');
const userProductRoutes = require('./routes/product');
const userCartRoutes = require('./routes/cart');
const userWishlistRoutes = require('./routes/wishlist');
const userOrderRoutes = require('./routes/order');
const userCheckoutRoutes = require('./routes/checkout');
const adminCouponRoutes=require('./routes/coupon') 
const userCustomizationRoutes = require('./routes/customization');

const adminAuthRoutes = require('./routes/admin.auth');
const adminProductRoutes = require('./routes/admin.product');
// const adminCategoryRoutes = require('./routes/admin.category');
// const adminOrderRoutes = require('./routes/admin.order');
// const adminUploadRoutes = require('./routes/admin.upload');

// const superAdminRoutes = require('./routes/superadmin/');

const app = express();

connectDB();

app.use(helmet());
app.use(hpp());

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);

    // allow all origins
    return callback(null, origin);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 300,
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', globalLimiter);

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: { write: (msg) => logger.http(msg.trim()) },
  }));
}



const API = '/api/v1';

// User routes
app.use(`${API}/auth`, userAuthRoutes);
app.use(`${API}/users`, userProfileRoutes);
app.use(`${API}/products`, userProductRoutes);
app.use(`${API}/cart`, userCartRoutes);
app.use(`${API}/wishlist`, userWishlistRoutes);
app.use(`${API}/orders`, userOrderRoutes);
app.use(`${API}/admin/coupons`,adminCouponRoutes)
app.use(`${API}/checkout`, userCheckoutRoutes);

app.use(`${API}/customization`, userCustomizationRoutes);

// Admin routes
app.use(`${API}/admin/auth`, adminAuthRoutes);
app.use(`${API}/admin/products`, adminProductRoutes);
// app.use(`${API}/admin/categories`, adminCategoryRoutes);
// app.use(`${API}/admin/orders`, adminOrderRoutes);
// app.use(`${API}/admin/uploads`, adminUploadRoutes);
 
// // Super Admin routes
// app.use(`${API}/superadmin`, superAdminRoutes);

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'InkArt API is running 🚀',
    environment: process.env.NODE_ENV,
  });
});
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log('hi')
  logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});


process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received. Shutting down gracefully...');
  server.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });
});

process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

module.exports = app;