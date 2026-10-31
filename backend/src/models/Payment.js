const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    paymentNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
      required: true
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true
    },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: 0.01
    },
    paymentMethod: {
      type: String,
      enum: ['upi', 'card', 'cash', 'bank_transfer'],
      required: true,
      default: 'upi'
    },
    transactionReference: {
      type: String,
      required: true,
      trim: true
    },
    paymentDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['completed', 'failed', 'refunded'],
      default: 'completed'
    },
    notes: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

paymentSchema.index({ paymentNumber: 1, invoice: 1, customer: 1, paymentDate: -1 });

module.exports = mongoose.model('Payment', paymentSchema);

