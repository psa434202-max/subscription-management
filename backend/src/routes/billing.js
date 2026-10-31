const express = require('express');
const router = express.Router();
const Subscription = require('../models/Subscription');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const Invoice = require('../models/Invoice');
const SubscriptionChangeHistory = require('../models/SubscriptionChangeHistory');
const { authenticate, checkRole } = require('../middleware/auth');
const { generateInvoiceNumber } = require('../utils/numberGenerator');

// POST /api/billing/run - Execute recurring billing cycle run (Admin / Staff demo trigger)
router.post('/run', authenticate, checkRole('admin', 'staff'), async (req, res) => {
  try {
    const now = new Date();

    // Find active subscriptions where nextBillingDate <= now or currentPeriodEnd <= now
    const dueSubscriptions = await Subscription.find({
      status: 'active',
      nextBillingDate: { $lte: new Date(now.getTime() + 24 * 60 * 60 * 1000) } // due now or within 24h
    }).populate('customer').populate('plan').populate('scheduledPlanChange.targetPlan');

    const generatedInvoices = [];
    const skippedSubscriptions = [];
    const appliedScheduledSwitches = [];

    for (const sub of dueSubscriptions) {
      // Prevent duplicate invoice for the same subscription and period start
      const existingInvoice = await Invoice.findOne({
        subscription: sub._id,
        billingPeriodStart: {
          $gte: new Date(sub.currentPeriodStart.getTime() - 24 * 60 * 60 * 1000),
          $lte: new Date(sub.currentPeriodStart.getTime() + 24 * 60 * 60 * 1000)
        }
      });

      if (existingInvoice) {
        skippedSubscriptions.push({
          subscriptionNumber: sub.subscriptionNumber,
          reason: `Invoice ${existingInvoice.invoiceNumber} already exists for current period.`
        });
        continue;
      }

      // Check if there is a scheduled plan change for this renewal!
      if (sub.scheduledPlanChange && sub.scheduledPlanChange.targetPlan) {
        const targetPlan = sub.scheduledPlanChange.targetPlan;
        const prevPlanId = sub.plan._id;
        const prevPrice = sub.plan.price;

        sub.plan = targetPlan._id;
        sub.billingFrequency = targetPlan.billingFrequency;
        sub.subtotal = targetPlan.price;
        const taxRate = 18;
        sub.taxTotal = Math.round(((targetPlan.price * taxRate) / 100) * 100) / 100;
        sub.totalAmount = Math.round((targetPlan.price + sub.taxTotal) * 100) / 100;

        // Update items to new plan products
        const populatedTargetPlan = await SubscriptionPlan.findById(targetPlan._id).populate('products.product');
        sub.items = (populatedTargetPlan.products || []).map(p => ({
          product: p.product._id,
          description: `${populatedTargetPlan.name} - ${p.product.name}`,
          variantName: p.variantName || '',
          quantity: p.quantity || 1,
          unitPrice: p.unitPrice,
          discount: 0,
          taxRate,
          lineTotal: Math.round(p.unitPrice * (p.quantity || 1) * 100) / 100
        }));

        // Log completion in change history
        await SubscriptionChangeHistory.findOneAndUpdate(
          { subscription: sub._id, status: 'scheduled' },
          { status: 'applied', effectiveDate: now }
        );

        appliedScheduledSwitches.push({
          subscriptionNumber: sub.subscriptionNumber,
          previousPlan: sub.plan.name,
          newPlan: targetPlan.name
        });

        sub.scheduledPlanChange = undefined;
      }

      // Calculate invoice due date based on payment terms
      let netDays = 30;
      if (sub.paymentTerms === 'Net 15') netDays = 15;
      else if (sub.paymentTerms === 'Net 60') netDays = 60;
      else if (sub.paymentTerms === 'Immediate') netDays = 3;

      const dueDate = new Date(now.getTime() + netDays * 24 * 60 * 60 * 1000);

      // Create invoice
      const invoice = new Invoice({
        invoiceNumber: generateInvoiceNumber(),
        subscription: sub._id,
        customer: sub.customer._id,
        issueDate: now,
        dueDate,
        billingPeriodStart: sub.currentPeriodStart,
        billingPeriodEnd: sub.currentPeriodEnd,
        items: sub.items.map(it => ({
          product: it.product,
          description: it.description,
          variantName: it.variantName,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          discount: it.discount || 0,
          taxRate: it.taxRate || 18,
          total: it.lineTotal
        })),
        subtotal: sub.subtotal,
        taxTotal: sub.taxTotal,
        discountTotal: sub.discountTotal || 0,
        totalAmount: sub.totalAmount,
        amountPaid: 0,
        outstandingBalance: sub.totalAmount,
        status: 'confirmed',
        paymentTerms: sub.paymentTerms,
        notes: `Recurring billing for ${sub.plan.name} (${sub.billingFrequency})`
      });

      await invoice.save();
      generatedInvoices.push(invoice);

      // Advance subscription billing dates for next cycle if auto-renewal is active
      if (sub.autoRenewal) {
        const nextStart = new Date(sub.currentPeriodEnd);
        const nextEnd = new Date(nextStart);

        if (sub.billingFrequency === 'daily') nextEnd.setDate(nextEnd.getDate() + 1);
        else if (sub.billingFrequency === 'weekly') nextEnd.setDate(nextEnd.getDate() + 7);
        else if (sub.billingFrequency === 'yearly') nextEnd.setFullYear(nextEnd.getFullYear() + 1);
        else nextEnd.setMonth(nextEnd.getMonth() + 1);

        sub.currentPeriodStart = nextStart;
        sub.currentPeriodEnd = nextEnd;
        sub.nextBillingDate = nextStart;
      }

      await sub.save();
    }

    return res.json({
      success: true,
      message: `Recurring billing completed. Generated ${generatedInvoices.length} invoices.`,
      processedCount: dueSubscriptions.length,
      generatedInvoicesCount: generatedInvoices.length,
      skippedCount: skippedSubscriptions.length,
      generatedInvoices,
      skippedSubscriptions,
      appliedScheduledSwitches
    });
  } catch (err) {
    console.error('Run billing error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to execute billing run' });
  }
});

// GET /api/billing/due - Preview subscriptions that are currently due for billing
router.get('/due', authenticate, checkRole('admin', 'staff'), async (req, res) => {
  try {
    const now = new Date();
    const dueSubscriptions = await Subscription.find({
      status: 'active',
      nextBillingDate: { $lte: new Date(now.getTime() + 24 * 60 * 60 * 1000) }
    }).populate('customer').populate('plan');

    return res.json({
      success: true,
      count: dueSubscriptions.length,
      dueSubscriptions
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch due subscriptions' });
  }
});

module.exports = router;

