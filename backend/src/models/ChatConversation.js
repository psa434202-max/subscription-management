const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  sender: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  text: {
    type: String,
    required: true
  },
  metadata: {
    intent: String,
    relatedInvoiceId: String,
    relatedSubscriptionId: String,
    relatedPlanId: String,
    financialBreakdown: mongoose.Schema.Types.Mixed,
    quickActions: [
      {
        label: String,
        actionType: String,
        payload: mongoose.Schema.Types.Mixed
      }
    ]
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const chatConversationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true
    },
    messages: [chatMessageSchema],
    lastActivity: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

chatConversationSchema.index({ user: 1, customer: 1 });

module.exports = mongoose.model('ChatConversation', chatConversationSchema);

