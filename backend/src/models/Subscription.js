const mongoose = require('mongoose');

const subscriptionItemSchema = new mongoose.Schema({
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
    min: 1,
    default: 1
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
  lineTotal: {
    type: Number,
    required: true
  }
});

const subscriptionSchema = new mongoose.Schema(
  {
    subscriptionNumber: {
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
      ref: 'SubscriptionPlan',
      required: true
    },
    status: {
      type: String,
      enum: ['draft', 'quotation', 'confirmed', 'active', 'paused', 'closed'],
      default: 'draft'
    },
    billingFrequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly'],
      required: true,
      default: 'monthly'
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    currentPeriodStart: {
      type: Date,
      required: true,
      default: Date.now
    },
    currentPeriodEnd: {
      type: Date,
      required: true
    },
    nextBillingDate: {
      type: Date,
      required: true
    },
    expiryDate: {
      type: Date
    },
    items: [subscriptionItemSchema],
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
    appliedDiscountCode: {
      type: String,
      default: ''
    },
    totalAmount: {
      type: Number,
      required: true,
      default: 0
    },
    paymentTerms: {
      type: String,
      default: 'Net 30'
    },
    autoRenewal: {
      type: Boolean,
      default: true
    },
    pausedAt: Date,
    resumedAt: Date,
    closedAt: Date,
    closureReason: String,
    // Scheduled Plan Change for "next_renewal" switching
    scheduledPlanChange: {
      targetPlan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubscriptionPlan'
      },
      effectiveDate: Date,
      scheduledAt: Date
    },
    originQuotation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quotation'
    },
    notes: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

subscriptionSchema.index({ subscriptionNumber: 1, customer: 1, status: 1, nextBillingDate: 1 });

module.exports = mongoose.model('Subscription', subscriptionSchema);

