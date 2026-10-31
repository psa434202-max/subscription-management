const mongoose = require('mongoose');

const templateItemSchema = new mongoose.Schema({
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
  },
  discount: {
    type: Number,
    default: 0
  }
});

const quotationTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Template name is required'],
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubscriptionPlan'
    },
    items: [templateItemSchema],
    paymentTerms: {
      type: String,
      default: 'Net 30'
    },
    defaultValidityDays: {
      type: Number,
      default: 30
    },
    notes: {
      type: String,
      default: ''
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('QuotationTemplate', quotationTemplateSchema);

