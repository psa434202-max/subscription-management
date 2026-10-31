const mongoose = require('mongoose');

const planProductSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  variantName: {
    type: String,
    default: ''
  },
  quantity: {
    type: Number,
    default: 1,
    min: 1
  },
  unitPrice: {
    type: Number,
    required: true
  }
});

const subscriptionPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Plan name is required'],
      trim: true
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    category: {
      type: String,
      default: 'Standard'
    },
    billingFrequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly'],
      required: true,
      default: 'monthly'
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0
    },
    minimumQuantity: {
      type: Number,
      default: 1,
      min: 1
    },
    products: [planProductSchema],
    features: [
      {
        type: String,
        trim: true
      }
    ],
    availabilityStartDate: {
      type: Date,
      default: Date.now
    },
    availabilityEndDate: {
      type: Date
    },
    autoRenewal: {
      type: Boolean,
      default: true
    },
    allowPause: {
      type: Boolean,
      default: true
    },
    allowEarlyClosure: {
      type: Boolean,
      default: true
    },
    autoClosureAfterDays: {
      type: Number,
      default: 0 // 0 means never auto-close
    },
    isPopular: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

// Virtual for monthly equivalent price to help side-by-side comparison
subscriptionPlanSchema.virtual('monthlyEquivalentPrice').get(function () {
  switch (this.billingFrequency) {
    case 'daily':
      return this.price * 30;
    case 'weekly':
      return (this.price / 7) * 30;
    case 'monthly':
      return this.price;
    case 'yearly':
      return this.price / 12;
    default:
      return this.price;
  }
});

// Virtual for annual equivalent price
subscriptionPlanSchema.virtual('annualEquivalentPrice').get(function () {
  switch (this.billingFrequency) {
    case 'daily':
      return this.price * 365;
    case 'weekly':
      return this.price * 52;
    case 'monthly':
      return this.price * 12;
    case 'yearly':
      return this.price;
    default:
      return this.price * 12;
  }
});

subscriptionPlanSchema.set('toJSON', { virtuals: true });
subscriptionPlanSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);

