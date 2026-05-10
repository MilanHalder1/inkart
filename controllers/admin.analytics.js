'use strict';

const Order = require('../models/Order');
const catchAsync = require('../utilities/CatchAsync');


// ✅ TOTAL REVENUE + TOTAL ORDERS + AVG ORDER VALUE
const getDashboardStats = catchAsync(async (req, res) => {

  const stats = await Order.aggregate([
    {
      $match: {
        paymentStatus: 'paid',
        orderStatus: {
          $ne: 'cancelled',
        },
      },
    },
    {
      $group: {
        _id: null,

        totalRevenue: {
          $sum: '$total',
        },

        totalOrders: {
          $sum: 1,
        },

        avgOrderValue: {
          $avg: '$total',
        },
      },
    },
  ]);

  const data = stats[0] || {
    totalRevenue: 0,
    totalOrders: 0,
    avgOrderValue: 0,
  };

  res.status(200).json({
    success: true,
    data,
  });
});


// ✅ WEEKLY REVENUE GRAPH DATA
const getRevenueOverTime = catchAsync(async (req, res) => {

  const revenue = await Order.aggregate([
    {
      $match: {
        paymentStatus: 'paid',
        orderStatus: {
          $ne: 'cancelled',
        },
      },
    },

    {
      $group: {
        _id: {
          year: {
            $year: '$createdAt',
          },

          week: {
            $week: '$createdAt',
          },
        },

        revenue: {
          $sum: '$total',
        },

        orders: {
          $sum: 1,
        },
      },
    },

    {
      $sort: {
        '_id.year': 1,
        '_id.week': 1,
      },
    },
  ]);

  res.status(200).json({
    success: true,
    results: revenue.length,
    data: {
      revenue,
    },
  });
});


module.exports = {
  getDashboardStats,
  getRevenueOverTime,
};