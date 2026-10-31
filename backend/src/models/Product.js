const mongoose = require('mongoose');

const productVariantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  sku: {
    type: String,
    trim: true
  },
  priceAdjustment: {
    type: Number,
    default: 0
  },
  description: {
    type: String,
    default: ''
  },
  isDefault: {
    type: Boolean,
    default: false
  }
});

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true
    },
    code: {
      type: String,
      unique: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['software', 'service', 'physical', 'addon'],
      default: 'software'
    },
    description: {
      type: String,
      default: ''
    },
    salesPrice: {
      type: Number,
      required: [true, 'Sales price is required'],
      min: 0
    },
    costPrice: {
      type: Number,
      default: 0,
      min: 0
    },
    category: {
      type: String,
      default: 'General'
    },
    unit: {
      type: String,
      default: 'license'
    },
    variants: [productVariantSchema],
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

productSchema.index({ code: 1, name: 1 });

module.exports = mongoose.model('Product', productSchema);

