'use strict';

const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  variantId: { type: mongoose.Schema.Types.ObjectId, default: null },
  name: { type: String, required: true },        // snapshot
  image: String,
  price: { type: Number, required: true },       // snapshot
  // quantity: { type: Number, required: true, min: 1 },
  hsnCode: String,

  gstPercentage: {
    type: Number,
    default: 0,
  },

  taxableAmount: {
    type: Number,
    default: 0,
  },

  gstAmount: {
    type: Number,
    default: 0,
  },

  lineTotal: {
    type: Number,
    default: 0,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },

  selectedSizes: [
    {
      size: {
        type: String,
        required: true,
      },

      quantity: {
        type: Number,
        required: true,
        min: 1,
      },
    },
  ],
  selectedColor: {
    name: String,
    hexCode: String,
  },
  customizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customization', default: null },
}, { _id: true });

const shippingAddressSchema = new mongoose.Schema({
  fullName: String,
  phone: String,
  line1: String,
  line2: String,
  city: String,
  state: String,
  pincode: String,
  country: { type: String, default: 'India' },
}, { _id: false });








const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  items: [orderItemSchema],
  shippingAddress: shippingAddressSchema,

  subtotal: Number,

  shippingCharge: {
    type: Number,
    default: 0,
  },

  taxableAmount: {
    type: Number,
    default: 0,
  },

  taxAmount: {
    type: Number,
    default: 0,
  },

  couponDiscount: {
    type: Number,
    default: 0,
  },

  total: Number,

  coupon: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', default: null },
  couponCode: String,

  // Payment
  paymentMethod: { type: String, enum: ['razorpay', 'cod'], default: 'razorpay' },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending',
    index: true,
  },
  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String,

  // Order lifecycle
  orderStatus: {
    type: String,
    enum: ['placed', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'return_requested', 'returned'],
    default: 'placed',
    index: true,
  },

  shipmentStatus: {
    type: String,
    enum: [
      'not_created',
      'shipment_created',
      'courier_assigned',
      'pickup_scheduled',
      'in_transit',
      'out_for_delivery',
      'ndr',
      'reattempt_scheduled',
      'delivered',
      'rto',
      'cancelled'
    ],
    default: 'not_created'
  },
  statusHistory: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    note: String,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  }],
  invoiceUrl: String,
  invoiceNumber: String,
  shipment: {
    shiprocketOrderId: String,
    shipmentId: String,
    awb: String,
    courier: String,

    status: String,
    currentStatusCode: Number,

    trackingUrl: String,

    pickupScheduled: {
      type: Boolean,
      default: false,
    },

    pickupToken: String,

    estimatedDeliveryDate: Date,

    lastTrackingUpdate: Date,

    lastShiprocketError: String,

    manifestUrl: String,

    labelUrl: String,

    invoiceUrl: String,
    ndr: {
      isNdr: {
        type: Boolean,
        default: false,

      },
      reason: {
        type: String,
        default: null,

      },
      remark: {
        type: String,
        default: null,

      },
      action: {
        type: String,
        enum: [
          'none',
          'reattempt',
          'change_address',
          'change_phone',
          'cancel',
          'return_to_origin'
        ],
        default: 'none',

      },
      attemptCount: {
        type: Number,
        default: 0,

      },
      lastAttemptAt: {
        type: Date,
        default: null,

      },
      nextAttemptDate: {
        type: Date,
        default: null,

      },
      resolved: {
        type: Boolean,
        default: false,

      },
      resolvedAt: {
        type: Date,
        default: null,

      },
      history: [
        {
          attemptNumber: Number,
          reason: String,
          remark: String,
          action: String,
          attemptDate: {
            type: Date,
            default: Date.now,

          },
          nextAttemptDate: Date,
          status: String,

        }
      ]
    },
    rto: {

      isRto: {
        type: Boolean,
        default: false
      },

      initiatedAt: {
        type: Date,
        default: null
      },

      deliveredAt: {
        type: Date,
        default: null
      },

      reason: {
        type: String,
        default: null
      },

      returnAwb: {
        type: String,
        default: null
      }
    }



  },


  cancelReason: String,
  cancelledAt: Date,

  shipmentCutoffTime: Date,

  isCancellable: {
    type: Boolean,
    default: true,
  },
  estimatedDeliveryDate: Date,

  deliveryNote: String,
  approvedByAdmin: {
    type: Boolean,
    default: false,
  },

  hiddenByUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  approvedAt: Date,
  deliveredAt: Date,
  cancelReason: String,
  notes: String,
  isCustomizedOrder: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});


orderSchema.index({ createdAt: -1 });
orderSchema.index({ user: 1, orderStatus: 1 });

// Auto-generate order number
// orderSchema.pre('save', async function (next) {
//   if (this.isNew) {
//     const date = new Date();
//     const prefix = `ORD-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
//     const count = await mongoose.model('Order').countDocuments();
//     this.orderNumber = `${prefix}-${String(count + 1).padStart(5, '0')}`;
//   }
//   next();
// });

orderSchema.pre('save', async function () {
  if (this.isNew) {
    const date = new Date();

    const prefix = `ORD-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;

    const count = await mongoose.model('Order').countDocuments();

    this.orderNumber = `${prefix}-${String(count + 1).padStart(5, '0')}`;
  }
});

module.exports = mongoose.model('Order', orderSchema);