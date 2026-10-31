const mongoose = require('mongoose');

const discountSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Discount code is required'],
      unique: true,
      uppercase: true,
      trim: true
    },
    name: {
      type: String,
      required: [true, 'Discount name is required'],
      trim: true
    },
    type: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage'
    },
    value: {
      type: Number,
      required: [true, 'Discount value is required'],
      min: 0
    },
    minimumPurchase: {
      type: Number,
      default: 0,
      min: 0
    },
    minimumQuantity: {
      type: Number,
      default: 1,
      min: 1
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date
    },
    usageLimit: {
      type: Number,
      default: 0 // 0 means unlimited
    },
    timesUsed: {
      type: Number,
      default: 0
    },
    appliesTo: {
      type: String,
      enum: ['all', 'specific_products', 'specific_plans'],
      default: 'all'
    },
    applicableProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
      }
    ],
    applicablePlans: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubscriptionPlan'
      }
    ],
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

// Helper method to check if discount is valid for a given amount, quantity, and date
discountSchema.methods.isValidFor = function ({ amount = 0, quantity = 1, planId = null, date = new Date() }) {
  if (!this.isActive) return { valid: false, reason: 'Discount is inactive' };
  if (this.startDate && new Date(this.startDate) > date) return { valid: false, reason: 'Discount not yet started' };
  if (this.endDate && new Date(this.endDate) < date) return { valid: false, reason: 'Discount has expired' };
  if (this.usageLimit > 0 && this.timesUsed >= this.usageLimit) return { valid: false, reason: 'Discount usage limit reached' };
  if (this.minimumPurchase > 0 && amount < this.minimumPurchase) {
    return { valid: false, reason: `Minimum purchase of ₹${this.minimumPurchase} required` };
  }
  if (this.minimumQuantity > 1 && quantity < this.minimumQuantity) {
    return { valid: false, reason: `Minimum quantity of ${this.minimumQuantity} required` };
  }
  if (this.appliesTo === 'specific_plans' && planId) {
    const isPlanIncluded = this.applicablePlans.some(p => p.toString() === planId.toString());
    if (!isPlanIncluded) return { valid: false, reason: 'Discount does not apply to this plan' };
  }
  return { valid: true };
};

// Calculate discount amount
discountSchema.methods.calculateDiscount = function (amount) {
  if (this.type === 'percentage') {
    return Math.min(amount, (amount * this.value) / 100);
  }
  return Math.min(amount, this.value);
};

module.exports = mongoose.model('Discount', discountSchema);

