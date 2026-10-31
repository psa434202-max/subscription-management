const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true
    },
    companyName: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    billingAddress: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      postalCode: { type: String, default: '' },
      country: { type: String, default: 'India' }
    },
    taxId: {
      type: String, // GSTIN or Tax Reg Number
      trim: true
    },
    paymentTerms: {
      type: String,
      enum: ['Immediate', 'Net 15', 'Net 30', 'Net 60'],
      default: 'Net 30'
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'archived'],
      default: 'active'
    },
    notes: {
      type: String,
      default: ''
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { timestamps: true }
);

customerSchema.index({ name: 'text', companyName: 'text' });

module.exports = mongoose.model('Customer', customerSchema);
