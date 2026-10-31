const mongoose = require('mongoose');

const subscriptionChangeHistorySchema = new mongoose.Schema(
  {
    subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription',
      required: true
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true
    },
    previousPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubscriptionPlan',
      required: true
    },
    newPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubscriptionPlan',
      required: true
    },
    changeType: {
      type: String,
      enum: ['upgrade', 'downgrade', 'tier_change', 'frequency_change'],
      required: true
    },
    switchTiming: {
      type: String,
      enum: ['immediate', 'next_renewal'],
      required: true
    },
    effectiveDate: {
      type: Date,
      required: true
    },
    previousPrice: {
      type: Number,
      required: true
    },
    newPrice: {
      type: Number,
      required: true
    },
    proratedAmount: {
      type: Number, // Positive = additional charge, negative = credit
      default: 0
    },
    proratedCredit: {
      type: Number,
      default: 0
    },
    remainingDays: {
      type: Number,
      default: 0
    },
    totalDaysInCycle: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['applied', 'scheduled', 'cancelled'],
      default: 'applied'
    },
    reason: {
      type: String,
      default: ''
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { timestamps: true }
);

subscriptionChangeHistorySchema.index({ subscription: 1, customer: 1, createdAt: -1 });

module.exports = mongoose.model('SubscriptionChangeHistory', subscriptionChangeHistorySchema);

