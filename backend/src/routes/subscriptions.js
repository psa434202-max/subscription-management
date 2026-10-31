const express = require('express');
const router = express.Router();
const Subscription = require('../models/Subscription');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const Customer = require('../models/Customer');
const Invoice = require('../models/Invoice');
const SubscriptionChangeHistory = require('../models/SubscriptionChangeHistory');
const Tax = require('../models/Tax');
const Discount = require('../models/Discount');
const { authenticate, checkRole } = require('../middleware/auth');
const { generateSubscriptionNumber, generateInvoiceNumber } = require('../utils/numberGenerator');

// GET /api/subscriptions - List subscriptions
router.get('/', authenticate, async (req, res) => {
  try {
    const filter = {};

    if (req.user.role === 'customer') {
      const customer = await Customer.findOne({
        $or: [{ user: req.user._id }, { email: req.user.email }]
      });
      if (!customer) return res.json({ success: true, subscriptions: [] });
      filter.customer = customer._id;
    } else {
      if (req.query.customer) filter.customer = req.query.customer;
      if (req.query.status) filter.status = req.query.status;
      if (req.query.plan) filter.plan = req.query.plan;
    }

    const subscriptions = await Subscription.find(filter)
      .populate('customer')
      .populate('plan')
      .populate('scheduledPlanChange.targetPlan')
      .sort({ createdAt: -1 });

    return res.json({ success: true, count: subscriptions.length, subscriptions });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch subscriptions' });
  }
});

// GET /api/subscriptions/:id - Single subscription with invoices and change history
router.get('/:id', authenticate, async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id)
      .populate('customer')
      .populate('plan')
      .populate('scheduledPlanChange.targetPlan')
      .populate('items.product');

    if (!subscription) return res.status(404).json({ success: false, message: 'Subscription not found' });

    if (req.user.role === 'customer') {
      const isOwner = subscription.customer?._id?.toString() === req.customer?._id?.toString() ||
                      subscription.customer?.email === req.user.email;
      if (!isOwner) return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const [invoices, changeHistory] = await Promise.all([
      Invoice.find({ subscription: subscription._id }).sort({ issueDate: -1 }),
      SubscriptionChangeHistory.find({ subscription: subscription._id })
        .populate('previousPlan')
        .populate('newPlan')
        .populate('changedBy', 'name email')
        .sort({ createdAt: -1 })
    ]);

    return res.json({
      success: true,
      subscription,
      invoices,
      changeHistory
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch subscription' });
  }
});

// POST /api/subscriptions - Create subscription (Draft or Confirmed)
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      customerId,
      planId,
      billingFrequency,
      quantity = 1,
      paymentTerms = 'Net 30',
      discountCode,
      startDate = new Date(),
      status = 'confirmed',
      notes
    } = req.body;

    let targetCustomerId = customerId;
    if (req.user.role === 'customer') {
      const cust = await Customer.findOne({
        $or: [{ user: req.user._id }, { email: req.user.email }]
      });
      if (!cust) return res.status(400).json({ success: false, message: 'Customer record not found for user' });
      targetCustomerId = cust._id;
    }

    if (!targetCustomerId || !planId) {
      return res.status(400).json({ success: false, message: 'Customer and Plan are required' });
    }

    const plan = await SubscriptionPlan.findById(planId).populate('products.product');
    if (!plan || !plan.isActive) {
      return res.status(400).json({ success: false, message: 'Selected plan is not available' });
    }

    const freq = billingFrequency || plan.billingFrequency;
    const start = new Date(startDate);
    const end = new Date(start);

    if (freq === 'daily') end.setDate(end.getDate() + 1);
    else if (freq === 'weekly') end.setDate(end.getDate() + 7);
    else if (freq === 'yearly') end.setFullYear(end.getFullYear() + 1);
    else end.setMonth(end.getMonth() + 1);

    const subQty = Math.max(Number(quantity) || 1, plan.minimumQuantity || 1);
    const baseSubtotal = plan.price * subQty;

    let discountAmount = 0;
    let appliedCode = '';
    if (discountCode) {
      const discount = await Discount.findOne({ code: discountCode.toUpperCase(), isActive: true });
      if (discount) {
        const val = discount.isValidFor({ amount: baseSubtotal, quantity: subQty, planId: plan._id });
        if (val.valid) {
          discountAmount = discount.calculateDiscount(baseSubtotal);
          appliedCode = discount.code;
          discount.timesUsed += 1;
          await discount.save();
        }
      }
    }

    // Default 18% GST tax calculation for demo
    const taxable = Math.max(0, baseSubtotal - discountAmount);
    const defaultTaxRate = 18;
    const taxTotal = Math.round(((taxable * defaultTaxRate) / 100) * 100) / 100;
    const totalAmount = Math.round((taxable + taxTotal) * 100) / 100;

    const items = (plan.products || []).map(p => ({
      product: p.product._id,
      description: `${plan.name} - ${p.product.name}`,
      variantName: p.variantName || '',
      quantity: (p.quantity || 1) * subQty,
      unitPrice: p.unitPrice,
      discount: 0,
      taxRate: defaultTaxRate,
      lineTotal: Math.round(p.unitPrice * (p.quantity || 1) * subQty * 100) / 100
    }));

    const subscription = new Subscription({
      subscriptionNumber: generateSubscriptionNumber(),
      customer: targetCustomerId,
      plan: plan._id,
      status: req.user.role === 'customer' ? 'confirmed' : status,
      billingFrequency: freq,
      startDate: start,
      currentPeriodStart: start,
      currentPeriodEnd: end,
      nextBillingDate: start, // Due for first invoice
      items,
      subtotal: baseSubtotal,
      taxTotal,
      discountTotal: discountAmount,
      appliedDiscountCode: appliedCode,
      totalAmount,
      paymentTerms,
      autoRenewal: plan.autoRenewal,
      notes: notes || ''
    });

    await subscription.save();

    const created = await Subscription.findById(subscription._id).populate('customer').populate('plan');
    return res.status(201).json({ success: true, message: 'Subscription created successfully', subscription: created });
  } catch (err) {
    console.error('Create subscription error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to create subscription' });
  }
});

// PATCH /api/subscriptions/:id/status - Change lifecycle status (confirm, activate, pause, resume, close)
router.patch('/:id/status', authenticate, async (req, res) => {
  try {
    const { action, reason } = req.body;
    const subscription = await Subscription.findById(req.params.id).populate('customer').populate('plan');

    if (!subscription) return res.status(404).json({ success: false, message: 'Subscription not found' });

    if (req.user.role === 'customer') {
      const isOwner = subscription.customer?._id?.toString() === req.customer?._id?.toString() ||
                      subscription.customer?.email === req.user.email;
      if (!isOwner) return res.status(403).json({ success: false, message: 'Access denied' });
      // Customers can only pause or request closure
      if (!['pause', 'resume', 'close'].includes(action)) {
        return res.status(403).json({ success: false, message: 'Customers cannot perform this status action' });
      }
    }

    const prevStatus = subscription.status;

    switch (action) {
      case 'confirm':
        if (subscription.status !== 'draft') {
          return res.status(400).json({ success: false, message: `Cannot confirm a subscription with status ${subscription.status}` });
        }
        subscription.status = 'confirmed';
        break;

      case 'activate':
        if (!['draft', 'confirmed'].includes(subscription.status)) {
          return res.status(400).json({ success: false, message: `Cannot activate a subscription with status ${subscription.status}` });
        }
        subscription.status = 'active';
        break;

      case 'pause':
        if (subscription.status !== 'active') {
          return res.status(400).json({ success: false, message: 'Only active subscriptions can be paused' });
        }
        if (!subscription.plan.allowPause) {
          return res.status(400).json({ success: false, message: 'This plan does not permit pausing' });
        }
        subscription.status = 'paused';
        subscription.pausedAt = new Date();
        break;

      case 'resume':
        if (subscription.status !== 'paused') {
          return res.status(400).json({ success: false, message: 'Only paused subscriptions can be resumed' });
        }
        subscription.status = 'active';
        subscription.resumedAt = new Date();
        break;

      case 'renew':
        // Extend period by one cycle
        const freq = subscription.billingFrequency;
        const newStart = new Date(subscription.currentPeriodEnd);
        const newEnd = new Date(newStart);
        if (freq === 'daily') newEnd.setDate(newEnd.getDate() + 1);
        else if (freq === 'weekly') newEnd.setDate(newEnd.getDate() + 7);
        else if (freq === 'yearly') newEnd.setFullYear(newEnd.getFullYear() + 1);
        else newEnd.setMonth(newEnd.getMonth() + 1);

        subscription.currentPeriodStart = newStart;
        subscription.currentPeriodEnd = newEnd;
        subscription.nextBillingDate = newStart;
        subscription.status = 'active';
        break;

      case 'close':
        if (['closed'].includes(subscription.status)) {
          return res.status(400).json({ success: false, message: 'Subscription is already closed' });
        }
        subscription.status = 'closed';
        subscription.closedAt = new Date();
        subscription.closureReason = reason || 'Customer / Admin request';
        break;

      default:
        return res.status(400).json({ success: false, message: `Unknown action: ${action}` });
    }

    await subscription.save();
    return res.json({
      success: true,
      message: `Subscription status updated from ${prevStatus} to ${subscription.status}`,
      subscription
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update subscription status' });
  }
});

// GET /api/subscriptions/:id/switch-preview - Smart Plan Switching Preview
router.get('/:id/switch-preview', authenticate, async (req, res) => {
  try {
    const { targetPlanId, switchTiming = 'immediate' } = req.query;

    if (!targetPlanId) {
      return res.status(400).json({ success: false, message: 'targetPlanId query parameter is required' });
    }

    const subscription = await Subscription.findById(req.params.id)
      .populate('plan')
      .populate('customer');

    if (!subscription) return res.status(404).json({ success: false, message: 'Subscription not found' });

    if (req.user.role === 'customer') {
      const isOwner = subscription.customer?._id?.toString() === req.customer?._id?.toString() ||
                      subscription.customer?.email === req.user.email;
      if (!isOwner) return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const currentPlan = subscription.plan;
    const targetPlan = await SubscriptionPlan.findById(targetPlanId);

    if (!targetPlan || !targetPlan.isActive) {
      return res.status(400).json({ success: false, message: 'Target plan not found or is inactive' });
    }

    if (currentPlan._id.toString() === targetPlan._id.toString()) {
      return res.status(400).json({ success: false, message: 'Target plan must be different from current plan' });
    }

    const now = new Date();
    const periodStart = new Date(subscription.currentPeriodStart);
    const periodEnd = new Date(subscription.currentPeriodEnd);

    const totalMs = Math.max(1, periodEnd.getTime() - periodStart.getTime());
    const totalDays = Math.max(1, Math.round(totalMs / (1000 * 60 * 60 * 24)));

    const remainingMs = Math.max(0, periodEnd.getTime() - now.getTime());
    const remainingDays = Math.min(totalDays, Math.max(0, Math.round(remainingMs / (1000 * 60 * 60 * 24))));

    const currentPrice = currentPlan.price;
    const targetPrice = targetPlan.price;

    let proratedAmount = 0;
    let proratedCredit = 0;
    let changeType = 'tier_change';

    if (targetPrice > currentPrice) {
      changeType = 'upgrade';
    } else if (targetPrice < currentPrice) {
      changeType = 'downgrade';
    }

    if (switchTiming === 'immediate') {
      const priceDifference = targetPrice - currentPrice;
      const rawProrated = (priceDifference * (remainingDays / totalDays));

      if (rawProrated > 0) {
        proratedAmount = Math.round(rawProrated * 100) / 100;
        proratedCredit = 0;
      } else {
        proratedAmount = 0;
        proratedCredit = Math.round(Math.abs(rawProrated) * 100) / 100;
      }
    } else {
      // Next renewal: 0 proration now
      proratedAmount = 0;
      proratedCredit = 0;
    }

    const effectiveDate = switchTiming === 'immediate' ? now : periodEnd;

    return res.json({
      success: true,
      preview: {
        subscriptionNumber: subscription.subscriptionNumber,
        currentPlan: {
          _id: currentPlan._id,
          name: currentPlan.name,
          price: currentPlan.price,
          billingFrequency: currentPlan.billingFrequency,
          features: currentPlan.features
        },
        targetPlan: {
          _id: targetPlan._id,
          name: targetPlan.name,
          price: targetPlan.price,
          billingFrequency: targetPlan.billingFrequency,
          features: targetPlan.features
        },
        changeType,
        switchTiming,
        effectiveDate,
        cycleInfo: {
          periodStart,
          periodEnd,
          totalDaysInCycle: totalDays,
          remainingDaysInCycle: remainingDays
        },
        financials: {
          currentCyclePrice: currentPrice,
          newCyclePrice: targetPrice,
          proratedAmount, // extra charge to pay now
          proratedCredit, // credit balance back to customer
          summaryText: switchTiming === 'immediate'
            ? proratedAmount > 0
              ? `You will be charged a prorated amount of ₹${proratedAmount} for the remaining ${remainingDays} days of this cycle.`
              : proratedCredit > 0
                ? `You will receive a prorated credit of ₹${proratedCredit} applied towards your next billing.`
                : 'Plan switch is processed with no price difference.'
            : `Your plan switch to ${targetPlan.name} is scheduled for renewal on ${periodEnd.toLocaleDateString()}. No immediate charge today.`
        }
      }
    });
  } catch (err) {
    console.error('Switch preview error:', err);
    return res.status(500).json({ success: false, message: 'Failed to calculate switch preview' });
  }
});

// POST /api/subscriptions/:id/switch-plan - Execute Smart Plan Switch
router.post('/:id/switch-plan', authenticate, async (req, res) => {
  try {
    const { targetPlanId, switchTiming = 'immediate', reason } = req.body;

    if (!targetPlanId) {
      return res.status(400).json({ success: false, message: 'Target plan ID is required' });
    }

    const subscription = await Subscription.findById(req.params.id)
      .populate('plan')
      .populate('customer');

    if (!subscription) return res.status(404).json({ success: false, message: 'Subscription not found' });

    if (req.user.role === 'customer') {
      const isOwner = subscription.customer?._id?.toString() === req.customer?._id?.toString() ||
                      subscription.customer?.email === req.user.email;
      if (!isOwner) return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (!['active', 'confirmed'].includes(subscription.status)) {
      return res.status(400).json({ success: false, message: 'Only active or confirmed subscriptions can be switched' });
    }

    const currentPlan = subscription.plan;
    const targetPlan = await SubscriptionPlan.findById(targetPlanId).populate('products.product');

    if (!targetPlan || !targetPlan.isActive) {
      return res.status(400).json({ success: false, message: 'Target plan not found or inactive' });
    }

    const now = new Date();
    const periodStart = new Date(subscription.currentPeriodStart);
    const periodEnd = new Date(subscription.currentPeriodEnd);

    const totalMs = Math.max(1, periodEnd.getTime() - periodStart.getTime());
    const totalDays = Math.max(1, Math.round(totalMs / (1000 * 60 * 60 * 24)));
    const remainingMs = Math.max(0, periodEnd.getTime() - now.getTime());
    const remainingDays = Math.min(totalDays, Math.max(0, Math.round(remainingMs / (1000 * 60 * 60 * 24))));

    const currentPrice = currentPlan.price;
    const targetPrice = targetPlan.price;

    let proratedAmount = 0;
    let proratedCredit = 0;
    const changeType = targetPrice > currentPrice ? 'upgrade' : (targetPrice < currentPrice ? 'downgrade' : 'tier_change');

    let historyRecord;
    let proratedInvoice = null;

    if (switchTiming === 'immediate') {
      const priceDiff = targetPrice - currentPrice;
      const rawProrated = (priceDiff * (remainingDays / totalDays));

      if (rawProrated > 0) {
        proratedAmount = Math.round(rawProrated * 100) / 100;
      } else {
        proratedCredit = Math.round(Math.abs(rawProrated) * 100) / 100;
      }

      // Update subscription to new plan
      subscription.plan = targetPlan._id;
      subscription.billingFrequency = targetPlan.billingFrequency;
      subscription.subtotal = targetPlan.price;
      const taxRate = 18;
      const taxTotal = Math.round(((targetPlan.price * taxRate) / 100) * 100) / 100;
      subscription.taxTotal = taxTotal;
      subscription.totalAmount = Math.round((targetPlan.price + taxTotal) * 100) / 100;

      // Update line items
      subscription.items = (targetPlan.products || []).map(p => ({
        product: p.product._id,
        description: `${targetPlan.name} - ${p.product.name}`,
        variantName: p.variantName || '',
        quantity: p.quantity || 1,
        unitPrice: p.unitPrice,
        discount: 0,
        taxRate,
        lineTotal: Math.round(p.unitPrice * (p.quantity || 1) * 100) / 100
      }));

      // Clear any pending scheduled change
      subscription.scheduledPlanChange = undefined;
      await subscription.save();

      // If additional prorated amount > 0, generate a prorated invoice
      if (proratedAmount > 0) {
        const proratedTax = Math.round(((proratedAmount * taxRate) / 100) * 100) / 100;
        const invoiceTotal = Math.round((proratedAmount + proratedTax) * 100) / 100;

        proratedInvoice = new Invoice({
          invoiceNumber: generateInvoiceNumber(),
          subscription: subscription._id,
          customer: subscription.customer._id,
          issueDate: now,
          dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days
          billingPeriodStart: now,
          billingPeriodEnd: periodEnd,
          items: [
            {
              description: `Prorated Upgrade: ${currentPlan.name} to ${targetPlan.name} (${remainingDays} remaining days)`,
              quantity: 1,
              unitPrice: proratedAmount,
              discount: 0,
              taxRate,
              total: invoiceTotal
            }
          ],
          subtotal: proratedAmount,
          taxTotal: proratedTax,
          discountTotal: 0,
          totalAmount: invoiceTotal,
          amountPaid: 0,
          outstandingBalance: invoiceTotal,
          status: 'confirmed',
          paymentTerms: subscription.paymentTerms,
          notes: `Prorated adjustment invoice for plan upgrade from ${currentPlan.name} to ${targetPlan.name}`
        });

        await proratedInvoice.save();
      }

      historyRecord = new SubscriptionChangeHistory({
        subscription: subscription._id,
        customer: subscription.customer._id,
        previousPlan: currentPlan._id,
        newPlan: targetPlan._id,
        changeType,
        switchTiming: 'immediate',
        effectiveDate: now,
        previousPrice: currentPrice,
        newPrice: targetPrice,
        proratedAmount,
        proratedCredit,
        remainingDays,
        totalDaysInCycle: totalDays,
        status: 'applied',
        reason: reason || 'Customer self-service immediate switch',
        changedBy: req.user._id
      });

      await historyRecord.save();
    } else {
      // Schedule at next renewal
      subscription.scheduledPlanChange = {
        targetPlan: targetPlan._id,
        effectiveDate: periodEnd,
        scheduledAt: now
      };
      await subscription.save();

      historyRecord = new SubscriptionChangeHistory({
        subscription: subscription._id,
        customer: subscription.customer._id,
        previousPlan: currentPlan._id,
        newPlan: targetPlan._id,
        changeType,
        switchTiming: 'next_renewal',
        effectiveDate: periodEnd,
        previousPrice: currentPrice,
        newPrice: targetPrice,
        proratedAmount: 0,
        proratedCredit: 0,
        remainingDays,
        totalDaysInCycle: totalDays,
        status: 'scheduled',
        reason: reason || 'Customer scheduled switch for next renewal',
        changedBy: req.user._id
      });

      await historyRecord.save();
    }

    const updatedSubscription = await Subscription.findById(subscription._id)
      .populate('plan')
      .populate('scheduledPlanChange.targetPlan')
      .populate('customer');

    return res.json({
      success: true,
      message: switchTiming === 'immediate'
        ? `Successfully switched to ${targetPlan.name}!`
        : `Plan switch to ${targetPlan.name} has been scheduled for renewal on ${periodEnd.toLocaleDateString()}.`,
      subscription: updatedSubscription,
      history: historyRecord,
      proratedInvoice
    });
  } catch (err) {
    console.error('Plan switch error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to switch plan' });
  }
});

module.exports = router;

