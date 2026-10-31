const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  description: {
    type: String,
    required: true
  },
  variantName: {
    type: String,
    default: ''
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  unitPrice: {
    type: Number,
    required: true
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

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription'
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true
    },
    issueDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    dueDate: {
      type: Date,
      required: true
    },
    billingPeriodStart: {
      type: Date,
      required: true
    },
    billingPeriodEnd: {
      type: Date,
      required: true
    },
    items: [invoiceItemSchema],
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
    amountPaid: {
      type: Number,
      default: 0
    },
    outstandingBalance: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['draft', 'confirmed', 'paid', 'partially_paid', 'overdue', 'cancelled'],
      default: 'draft'
    },
    paymentTerms: {
      type: String,
      default: 'Net 30'
    },
    sentAt: Date,
    confirmedAt: Date,
    paidAt: Date,
    cancelledAt: Date,
    notes: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

invoiceSchema.index({ invoiceNumber: 1, customer: 1, subscription: 1, status: 1, dueDate: 1 });

module.exports = mongoose.model('Invoice', invoiceSchema);

