const express = require('express');
const router = express.Router();
const Quotation = require('../models/Quotation');
const QuotationTemplate = require('../models/QuotationTemplate');
const Subscription = require('../models/Subscription');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const Customer = require('../models/Customer');
const Tax = require('../models/Tax');
const { authenticate, checkRole } = require('../middleware/auth');
const { generateQuotationNumber, generateSubscriptionNumber } = require('../utils/numberGenerator');

// GET /api/quotations - List quotations
router.get('/', authenticate, async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === 'customer') {
      const customer = await Customer.findOne({
        $or: [{ user: req.user._id }, { email: req.user.email }]
      });
      if (!customer) return res.json({ success: true, quotations: [] });
      filter.customer = customer._id;
    } else {
      if (req.query.customer) filter.customer = req.query.customer;
      if (req.query.status) filter.status = req.query.status;
    }

    const quotations = await Quotation.find(filter)
      .populate('customer')
      .populate('plan')
      .populate('items.product')
      .sort({ createdAt: -1 });

    return res.json({ success: true, count: quotations.length, quotations });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch quotations' });
  }
});

// GET /api/quotations/:id - Single quotation
router.get('/:id', authenticate, async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id)
      .populate('customer')
      .populate('plan')
      .populate('template')
      .populate('items.product')
      .populate('convertedSubscription');

    if (!quotation) return res.status(404).json({ success: false, message: 'Quotation not found' });

    if (req.user.role === 'customer') {
      const isOwner = quotation.customer?._id?.toString() === req.customer?._id?.toString() ||
                      quotation.customer?.email === req.user.email;
      if (!isOwner) return res.status(403).json({ success: false, message: 'Access denied' });
    }

    return res.json({ success: true, quotation });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch quotation' });
  }
});

// POST /api/quotations - Create quotation (Admin/Staff)
router.post('/', authenticate, checkRole('admin', 'staff'), async (req, res) => {
  try {
    const { customerId, planId, templateId, validUntil, validityDays = 30, items, paymentTerms, notes } = req.body;

    if (!customerId) {
      return res.status(400).json({ success: false, message: 'Customer is required' });
    }

    let quoteItems = [];
    let selectedPlan = null;

    if (templateId) {
      const tpl = await QuotationTemplate.findById(templateId).populate('items.product');
      if (tpl) {
        selectedPlan = tpl.plan;
        quoteItems = tpl.items.map(it => ({
          product: it.product._id,
          description: it.product.name,
          variantName: it.variantName || '',
          quantity: it.quantity || 1,
          unitPrice: it.unitPrice || it.product.salesPrice,
          discount: it.discount || 0,
          taxRate: 18,
          total: (it.unitPrice || it.product.salesPrice) * (it.quantity || 1) - (it.discount || 0)
        }));
      }
    }

    if (planId) {
      selectedPlan = planId;
      if (quoteItems.length === 0) {
        const plan = await SubscriptionPlan.findById(planId).populate('products.product');
        if (plan) {
          quoteItems = (plan.products || []).map(p => ({
            product: p.product._id,
            description: `${plan.name} - ${p.product.name}`,
            variantName: p.variantName || '',
            quantity: p.quantity || 1,
            unitPrice: p.unitPrice,
            discount: 0,
            taxRate: 18,
            total: p.unitPrice * (p.quantity || 1)
          }));
        }
      }
    }

    if (Array.isArray(items) && items.length > 0) {
      quoteItems = items.map(it => ({
        product: it.product,
        description: it.description || '',
        variantName: it.variantName || '',
        quantity: Number(it.quantity || 1),
        unitPrice: Number(it.unitPrice || 0),
        discount: Number(it.discount || 0),
        taxRate: Number(it.taxRate || 18),
        total: Number(it.unitPrice || 0) * Number(it.quantity || 1) - Number(it.discount || 0)
      }));
    }

    // Calculate subtotal, taxes, discount, total
    let subtotal = 0;
    let taxTotal = 0;
    let discountTotal = 0;

    quoteItems.forEach(it => {
      const lineSub = it.unitPrice * it.quantity;
      const lineDisc = it.discount || 0;
      const taxable = Math.max(0, lineSub - lineDisc);
      const lineTax = (taxable * (it.taxRate || 0)) / 100;
      subtotal += lineSub;
      discountTotal += lineDisc;
      taxTotal += lineTax;
      it.total = Math.round((taxable + lineTax) * 100) / 100;
    });

    const totalAmount = Math.round((subtotal - discountTotal + taxTotal) * 100) / 100;

    const expirationDate = validUntil
      ? new Date(validUntil)
      : new Date(Date.now() + Number(validityDays) * 24 * 60 * 60 * 1000);

    const quotation = new Quotation({
      quotationNumber: generateQuotationNumber(),
      customer: customerId,
      plan: selectedPlan,
      template: templateId || null,
      validUntil: expirationDate,
      items: quoteItems,
      subtotal,
      discountTotal,
      taxTotal: Math.round(taxTotal * 100) / 100,
      totalAmount,
      paymentTerms: paymentTerms || 'Net 30',
      notes: notes || '',
      status: 'draft'
    });

    await quotation.save();

    const created = await Quotation.findById(quotation._id)
      .populate('customer')
      .populate('plan')
      .populate('items.product');

    return res.status(201).json({ success: true, message: 'Quotation created successfully', quotation: created });
  } catch (err) {
    console.error('Quotation creation error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to create quotation' });
  }
});

// PATCH /api/quotations/:id/send - Mark quotation as Sent
router.patch('/:id/send', authenticate, checkRole('admin', 'staff'), async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) return res.status(404).json({ success: false, message: 'Quotation not found' });

    quotation.status = 'sent';
    quotation.sentAt = new Date();
    await quotation.save();

    return res.json({ success: true, message: 'Quotation sent to customer', quotation });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to send quotation' });
  }
});

// POST /api/quotations/:id/accept - Accept quotation (Customer or Staff/Admin)
router.post('/:id/accept', authenticate, async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id).populate('customer').populate('plan');
    if (!quotation) return res.status(404).json({ success: false, message: 'Quotation not found' });

    if (req.user.role === 'customer') {
      const isOwner = quotation.customer?._id?.toString() === req.customer?._id?.toString() ||
                      quotation.customer?.email === req.user.email;
      if (!isOwner) return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (['accepted', 'converted'].includes(quotation.status)) {
      return res.status(400).json({ success: false, message: 'Quotation is already accepted or converted' });
    }

    if (new Date(quotation.validUntil) < new Date()) {
      quotation.status = 'expired';
      await quotation.save();
      return res.status(400).json({ success: false, message: 'This quotation has expired' });
    }

    quotation.status = 'accepted';
    quotation.acceptedAt = new Date();
    await quotation.save();

    return res.json({ success: true, message: 'Quotation accepted successfully', quotation });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to accept quotation' });
  }
});

// POST /api/quotations/:id/convert - Convert accepted quotation into confirmed subscription
router.post('/:id/convert', authenticate, checkRole('admin', 'staff'), async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id).populate('plan').populate('customer');
    if (!quotation) return res.status(404).json({ success: false, message: 'Quotation not found' });

    if (quotation.status === 'converted') {
      return res.status(400).json({ success: false, message: 'Quotation has already been converted to a subscription' });
    }

    if (!quotation.plan) {
      return res.status(400).json({ success: false, message: 'Quotation must have an associated plan to convert into a subscription' });
    }

    const billingFrequency = quotation.plan.billingFrequency || 'monthly';
    const now = new Date();
    const periodEnd = new Date(now);

    if (billingFrequency === 'daily') periodEnd.setDate(periodEnd.getDate() + 1);
    else if (billingFrequency === 'weekly') periodEnd.setDate(periodEnd.getDate() + 7);
    else if (billingFrequency === 'yearly') periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    else periodEnd.setMonth(periodEnd.getMonth() + 1); // monthly

    const subscription = new Subscription({
      subscriptionNumber: generateSubscriptionNumber(),
      customer: quotation.customer._id,
      plan: quotation.plan._id,
      status: 'confirmed',
      billingFrequency,
      startDate: now,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      nextBillingDate: now, // Ready for first invoice
      items: quotation.items.map(it => ({
        product: it.product,
        description: it.description,
        variantName: it.variantName,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        discount: it.discount,
        taxRate: it.taxRate,
        lineTotal: it.total
      })),
      subtotal: quotation.subtotal,
      taxTotal: quotation.taxTotal,
      discountTotal: quotation.discountTotal,
      totalAmount: quotation.totalAmount,
      paymentTerms: quotation.paymentTerms,
      autoRenewal: quotation.plan.autoRenewal,
      originQuotation: quotation._id
    });

    await subscription.save();

    quotation.status = 'converted';
    quotation.convertedSubscription = subscription._id;
    await quotation.save();

    return res.json({
      success: true,
      message: 'Quotation successfully converted to Confirmed Subscription!',
      subscription
    });
  } catch (err) {
    console.error('Convert quotation error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to convert quotation' });
  }
});

module.exports = router;

