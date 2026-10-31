const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const Subscription = require('../models/Subscription');
const Invoice = require('../models/Invoice');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const ChatConversation = require('../models/ChatConversation');
const { authenticate } = require('../middleware/auth');

// GET /api/assistant/history - Get customer's chat conversation history
router.get('/history', authenticate, async (req, res) => {
  try {
    const customer = await Customer.findOne({
      $or: [{ user: req.user._id }, { email: req.user.email }]
    });

    if (!customer) {
      return res.json({ success: true, messages: [] });
    }

    let conversation = await ChatConversation.findOne({ customer: customer._id });
    if (!conversation) {
      // Create initial greeting message
      conversation = new ChatConversation({
        user: req.user._id,
        customer: customer._id,
        messages: [
          {
            sender: 'assistant',
            text: `👋 Hello ${req.user.name}! I am your **Brightloop Billing Assistant**.\n\nI can answer questions regarding your subscriptions, explain your invoice charges, track upcoming renewal dates, check outstanding balances, and help you find or switch plans.\n\nHow can I help you today?`,
            metadata: {
              intent: 'greeting',
              quickActions: [
                { label: 'How much do I owe?', actionType: 'query_due' },
                { label: 'When is my next renewal?', actionType: 'query_renewal' },
                { label: 'What subscriptions do I have?', actionType: 'query_subscriptions' },
                { label: 'Can I switch to a cheaper plan?', actionType: 'query_cheaper_plans' }
              ]
            }
          }
        ]
      });
      await conversation.save();
    }

    return res.json({ success: true, conversationId: conversation._id, messages: conversation.messages });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch conversation history' });
  }
});

// POST /api/assistant/chat - Send message to assistant
router.post('/chat', authenticate, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message text is required' });
    }

    // Identify authenticated customer - STRICT DATA ISOLATION
    const customer = await Customer.findOne({
      $or: [{ user: req.user._id }, { email: req.user.email }]
    });

    if (!customer) {
      return res.status(400).json({
        success: false,
        message: 'No associated customer profile found for your account.'
      });
    }

    // Load actual database records for this customer ONLY
    const [subscriptions, invoices, allAvailablePlans] = await Promise.all([
      Subscription.find({ customer: customer._id }).populate('plan').sort({ createdAt: -1 }),
      Invoice.find({ customer: customer._id }).sort({ issueDate: -1 }),
      SubscriptionPlan.find({ isActive: true }).sort({ price: 1 })
    ]);

    const activeSubs = subscriptions.filter(s => s.status === 'active');
    const unpaidInvoices = invoices.filter(i => ['confirmed', 'partially_paid', 'overdue'].includes(i.status) && i.outstandingBalance > 0);
    const totalOutstanding = unpaidInvoices.reduce((sum, inv) => sum + inv.outstandingBalance, 0);

    const query = message.toLowerCase().trim();
    let replyText = '';
    let intent = 'general';
    let metadata = {};
    let quickActions = [];

    // 1. Outstanding Balance / "How much do I owe?"
    if (
      query.includes('how much') ||
      query.includes('owe') ||
      query.includes('balance') ||
      query.includes('due') ||
      query.includes('unpaid')
    ) {
      intent = 'check_balance';
      if (unpaidInvoices.length === 0) {
        replyText = `🎉 Great news! You have **no outstanding balance**. All your invoices are completely settled.`;
      } else {
        const invoiceListStr = unpaidInvoices
          .map(inv => `• **Invoice #${inv.invoiceNumber}**: Total ₹${inv.totalAmount}, Outstanding: **₹${inv.outstandingBalance}** (Due on ${new Date(inv.dueDate).toLocaleDateString()})`)
          .join('\n');

        replyText = `You currently have **${unpaidInvoices.length} unpaid invoice(s)** with a total outstanding balance of **₹${Math.round(totalOutstanding)}**.\n\n${invoiceListStr}\n\nYou can click on any invoice below or navigate to the Invoices tab to make a payment.`;
        metadata.financialBreakdown = { totalOutstanding, unpaidInvoicesCount: unpaidInvoices.length };
        quickActions = unpaidInvoices.slice(0, 2).map(inv => ({
          label: `Pay Invoice #${inv.invoiceNumber} (₹${inv.outstandingBalance})`,
          actionType: 'view_invoice',
          payload: { invoiceId: inv._id }
        }));
      }
    }

    // 2. Upcoming Renewal / "When is my next renewal?"
    else if (
      query.includes('renewal') ||
      query.includes('renew') ||
      query.includes('expire') ||
      query.includes('period end') ||
      query.includes('next bill')
    ) {
      intent = 'check_renewal';
      if (activeSubs.length === 0) {
        replyText = `You do not have any currently active subscriptions. You can browse and activate plans from the **Compare Plans** catalog.`;
        quickActions = [{ label: 'Browse Available Plans', actionType: 'browse_plans' }];
      } else {
        const renewalList = activeSubs
          .map(s => `• **${s.plan?.name || 'Subscription'}** (${s.subscriptionNumber}): Renews on **${new Date(s.currentPeriodEnd).toLocaleDateString()}** at ₹${s.totalAmount}/${s.billingFrequency}. (Auto-renewal: ${s.autoRenewal ? 'Enabled' : 'Disabled'})`)
          .join('\n');

        replyText = `Here are your upcoming renewal dates:\n\n${renewalList}`;
        quickActions = activeSubs.map(s => ({
          label: `Manage ${s.plan?.name}`,
          actionType: 'view_subscription',
          payload: { subscriptionId: s._id }
        }));
      }
    }

    // 3. Why is my invoice higher this month? / Invoice explanation
    else if (
      query.includes('higher') ||
      query.includes('why') ||
      query.includes('explain') ||
      query.includes('breakdown') ||
      query.includes('more expensive')
    ) {
      intent = 'explain_invoice';
      const recent = invoices[0];
      const previous = invoices[1];

      if (!recent) {
        replyText = `I couldn't find any generated invoices on your account yet to explain.`;
      } else if (!previous) {
        const itemsDetail = recent.items.map(it => `• ${it.description} (Qty: ${it.quantity} × ₹${it.unitPrice}) = ₹${it.quantity * it.unitPrice}`).join('\n');
        replyText = `Your latest invoice **#${recent.invoiceNumber}** totals **₹${recent.totalAmount}**.\n\n**Here is the exact breakdown:**\n${itemsDetail}\n• Subtotal: ₹${recent.subtotal}\n• Taxes (GST): ₹${recent.taxTotal}\n• Discounts: ₹${recent.discountTotal}\n\nSince this is your first invoice, there is no previous month to compare against!`;
        metadata.relatedInvoiceId = recent._id;
      } else {
        const diff = recent.totalAmount - previous.totalAmount;
        const recentItems = recent.items.map(it => `• ${it.description}: ₹${it.total}`).join('\n');

        if (diff > 0) {
          replyText = `Your latest invoice **#${recent.invoiceNumber}** (₹${recent.totalAmount}) is **₹${Math.round(diff)} higher** than your previous invoice #${previous.invoiceNumber} (₹${previous.totalAmount}).\n\n**Key factors for the difference:**\n1. Recent line items:\n${recentItems}\n2. Tax difference: ₹${recent.taxTotal - previous.taxTotal}\n3. Discounts: ${recent.discountTotal > 0 ? `₹${recent.discountTotal} applied` : 'No discount was applied this month'}\n\nReview the full itemized invoice via the button below.`;
        } else if (diff < 0) {
          replyText = `Your latest invoice **#${recent.invoiceNumber}** (₹${recent.totalAmount}) is actually **₹${Math.abs(Math.round(diff))} lower** than your previous invoice #${previous.invoiceNumber} (₹${previous.totalAmount})!`;
        } else {
          replyText = `Your latest invoice **#${recent.invoiceNumber}** is ₹${recent.totalAmount}, which is identical to your previous month's invoice.`;
        }
        metadata.relatedInvoiceId = recent._id;
        quickActions = [{ label: `View Invoice #${recent.invoiceNumber}`, actionType: 'view_invoice', payload: { invoiceId: recent._id } }];
      }
    }

    // 4. Current Subscriptions / "What subscriptions do I currently have?"
    else if (
      query.includes('what subscription') ||
      query.includes('my subscription') ||
      query.includes('current plan') ||
      query.includes('active plan') ||
      query.includes('which plan')
    ) {
      intent = 'list_subscriptions';
      if (subscriptions.length === 0) {
        replyText = `You do not have any registered subscriptions yet. Would you like to view our available plans?`;
        quickActions = [{ label: 'View Available Plans', actionType: 'browse_plans' }];
      } else {
        const subList = subscriptions.map(s => {
          const statusEmoji = s.status === 'active' ? '🟢' : (s.status === 'paused' ? '⏸️' : '⚪');
          return `${statusEmoji} **${s.subscriptionNumber}** - **${s.plan?.name || 'Custom Plan'}**\n• Status: **${s.status.toUpperCase()}**\n• Frequency: ${s.billingFrequency}\n• Current period: ${new Date(s.currentPeriodStart).toLocaleDateString()} to ${new Date(s.currentPeriodEnd).toLocaleDateString()}\n• Price: ₹${s.totalAmount} per ${s.billingFrequency}`;
        }).join('\n\n');

        replyText = `Here is your subscription summary:\n\n${subList}`;
        quickActions = activeSubs.map(s => ({
          label: `Change Plan for ${s.subscriptionNumber}`,
          actionType: 'switch_plan',
          payload: { subscriptionId: s._id }
        }));
      }
    }

    // 5. Plan Features / "What is included in my plan?"
    else if (
      query.includes('included') ||
      query.includes('feature') ||
      query.includes('what do i get') ||
      query.includes('perks')
    ) {
      intent = 'plan_features';
      if (activeSubs.length === 0) {
        replyText = `You don't have an active plan right now. You can check all plan features on the **Compare Plans** page.`;
        quickActions = [{ label: 'Compare Plans', actionType: 'browse_plans' }];
      } else {
        const current = activeSubs[0];
        const features = (current.plan?.features || []).map(f => `✅ ${f}`).join('\n');
        replyText = `Your active plan is **${current.plan?.name}** (₹${current.plan?.price}/${current.plan?.billingFrequency}).\n\n**Included Features & Entitlements:**\n${features || 'Standard platform access and 24/7 self-service portal.'}\n\n• Minimum seat/unit quantity: ${current.plan?.minimumQuantity || 1}\n• Pausing allowed: ${current.plan?.allowPause ? 'Yes' : 'No'}\n• Early cancellation: ${current.plan?.allowEarlyClosure ? 'Yes' : 'No'}`;
        quickActions = [
          { label: 'Compare Other Plans', actionType: 'browse_plans' },
          { label: 'Switch Plan', actionType: 'switch_plan', payload: { subscriptionId: current._id } }
        ];
      }
    }

    // 6. Switch to Cheaper Plan / Downgrade / Budget
    else if (
      query.includes('cheaper') ||
      query.includes('switch') ||
      query.includes('downgrade') ||
      query.includes('upgrade') ||
      query.includes('save') ||
      query.includes('budget') ||
      query.includes('change plan')
    ) {
      intent = 'recommend_switch';
      if (activeSubs.length === 0) {
        replyText = `You don't have an active subscription yet, but we have multiple flexible tiers starting from ₹${allAvailablePlans[0]?.price || 499}/month. Check our comparison page to get started!`;
        quickActions = [{ label: 'Compare Plans', actionType: 'browse_plans' }];
      } else {
        const currentSub = activeSubs[0];
        const currentPrice = currentSub.plan?.price || 0;

        const cheaperPlans = allAvailablePlans.filter(p =>
          p._id.toString() !== currentSub.plan?._id?.toString() &&
          p.monthlyEquivalentPrice < (currentSub.plan?.monthlyEquivalentPrice || currentPrice)
        );

        if (cheaperPlans.length > 0) {
          const suggestions = cheaperPlans.map(p => {
            const savings = Math.round((currentSub.plan?.monthlyEquivalentPrice || currentPrice) - p.monthlyEquivalentPrice);
            return `• **${p.name}** at ₹${p.price}/${p.billingFrequency} (Saves you approx **₹${savings}/month**)\n  Features: ${p.features.slice(0, 3).join(', ')}`;
          }).join('\n\n');

          replyText = `Yes! You can switch to a more cost-effective tier. Here are cheaper alternatives to your current **${currentSub.plan?.name}**:\n\n${suggestions}\n\nYou can switch immediately with prorated billing adjustments or schedule it for your next renewal.`;
          quickActions = cheaperPlans.slice(0, 2).map(p => ({
            label: `Switch to ${p.name}`,
            actionType: 'switch_plan',
            payload: { subscriptionId: currentSub._id, targetPlanId: p._id }
          }));
        } else {
          replyText = `You are currently subscribed to **${currentSub.plan?.name}** (₹${currentPrice}), which is already one of our most affordable options! If you wish to adjust quantities or explore higher tiers, you can compare all plans anytime.`;
          quickActions = [{ label: 'Compare All Plans', actionType: 'browse_plans' }];
        }
      }
    }

    // 7. General fallback
    else {
      intent = 'general_help';
      replyText = `I understand you're asking about "${message}". As your Brightloop Billing Assistant, I can help you with:\n\n• **Outstanding Dues & Invoices**: "How much do I owe?" or "Explain my latest invoice"\n• **Upcoming Renewals**: "When is my next renewal?"\n• **Plan Features & Comparisons**: "What is included in my plan?"\n• **Smart Plan Switching**: "Can I switch to a cheaper plan?"\n\nFeel free to choose an option below or type your question.`;
      quickActions = [
        { label: 'Check Balance', actionType: 'query_due' },
        { label: 'Upcoming Renewal', actionType: 'query_renewal' },
        { label: 'My Subscriptions', actionType: 'query_subscriptions' },
        { label: 'Compare Plans', actionType: 'browse_plans' }
      ];
    }

    // Append to conversation history
    let conversation = await ChatConversation.findOne({ customer: customer._id });
    if (!conversation) {
      conversation = new ChatConversation({
        user: req.user._id,
        customer: customer._id,
        messages: []
      });
    }

    // User message
    conversation.messages.push({
      sender: 'user',
      text: message,
      timestamp: new Date()
    });

    // Assistant response
    const assistantMsg = {
      sender: 'assistant',
      text: replyText,
      metadata: {
        intent,
        ...metadata,
        quickActions
      },
      timestamp: new Date()
    };
    conversation.messages.push(assistantMsg);
    conversation.lastActivity = new Date();

    await conversation.save();

    return res.json({
      success: true,
      reply: assistantMsg
    });
  } catch (err) {
    console.error('Chat error:', err);
    return res.status(500).json({ success: false, message: 'Assistant failed to generate response' });
  }
});

module.exports = router;

