const mongoose = require('mongoose');

const quotationItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  variantName: {
    type: String,
    default: ''
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  taxRate: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true
  }
});

const quotationSchema = new mongoose.Schema(
  {
    quotationNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubscriptionPlan'
    },
    template: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'QuotationTemplate'
    },
    validUntil: {
      type: Date,
      required: true
    },
    items: [quotationItemSchema],
    subtotal: {
      type: Number,
      required: true,
      default: 0
    },
    taxTotal: {
      type: Number,
      default: 0
    },
    discountTotal: {
      type: Number,
      default: 0
    },
    totalAmount: {
      type: Number,
      required: true,
      default: 0
    },
    status: {
      type: String,
      enum: ['draft', 'sent', 'accepted', 'declined', 'expired', 'converted'],
      default: 'draft'
    },
    paymentTerms: {
      type: String,
      default: 'Net 30'
    },
    notes: {
      type: String,
      default: ''
    },
    convertedSubscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription'
    },
    sentAt: Date,
    acceptedAt: Date,
    declinedAt: Date
  },
  { timestamps: true }
);

quotationSchema.index({ quotationNumber: 1, customer: 1, status: 1 });

module.exports = mongoose.model('Quotation', quotationSchema);

