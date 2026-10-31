const mongoose = require('mongoose');

const taxSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tax name is required'],
      trim: true
    },
    rate: {
      type: Number,
      required: [true, 'Tax rate is required'],
      min: 0,
      max: 100
    },
    type: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage'
    },
    applicableProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
      }
    ], // Empty array implies applicable to all products
    isDefault: {
      type: Boolean,
      default: false
    },
    effectiveFrom: {
      type: Date,
      default: Date.now
    },
    effectiveTo: {
      type: Date
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Tax', taxSchema);

