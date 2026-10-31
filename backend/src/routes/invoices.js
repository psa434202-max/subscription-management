const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');
const Payment = require('../models/Payment');
const { authenticate, checkRole } = require('../middleware/auth');
const { generateInvoiceNumber } = require('../utils/numberGenerator');

// GET /api/invoices - List invoices
router.get('/', authenticate, async (req, res) => {
  try {
    const filter = {};

    if (req.user.role === 'customer') {
      const customer = await Customer.findOne({
        $or: [{ user: req.user._id }, { email: req.user.email }]
      });
      if (!customer) return res.json({ success: true, invoices: [] });
      filter.customer = customer._id;
    } else {
      if (req.query.customer) filter.customer = req.query.customer;
      if (req.query.subscription) filter.subscription = req.query.subscription;
      if (req.query.status) filter.status = req.query.status;
    }

    const invoices = await Invoice.find(filter)
      .populate('customer')
      .populate({
        path: 'subscription',
        populate: { path: 'plan' }
      })
      .sort({ issueDate: -1 });

    return res.json({ success: true, count: invoices.length, invoices });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch invoices' });
  }
});

// GET /api/invoices/:id - Single invoice with payment history
router.get('/:id', authenticate, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('customer')
      .populate({
        path: 'subscription',
        populate: { path: 'plan' }
      })
      .populate('items.product');

    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

    if (req.user.role === 'customer') {
      const isOwner = invoice.customer?._id?.toString() === req.customer?._id?.toString() ||
                      invoice.customer?.email === req.user.email;
      if (!isOwner) return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const payments = await Payment.find({ invoice: invoice._id }).sort({ paymentDate: -1 });

    return res.json({ success: true, invoice, payments });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch invoice' });
  }
});

// POST /api/invoices - Create manual invoice (Admin / Staff)
router.post('/', authenticate, checkRole('admin', 'staff'), async (req, res) => {
  try {
    const {
      customerId,
      subscriptionId,
      issueDate = new Date(),
      dueDate,
      billingPeriodStart,
      billingPeriodEnd,
      items,
      notes,
      paymentTerms = 'Net 30'
    } = req.body;

    if (!customerId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Customer and items are required' });
    }

    let subtotal = 0;
    let taxTotal = 0;
    let discountTotal = 0;

    const formattedItems = items.map(it => {
      const qty = Number(it.quantity || 1);
      const price = Number(it.unitPrice || 0);
      const disc = Number(it.discount || 0);
      const taxRate = Number(it.taxRate || 18);
      const lineSub = qty * price;
      const taxable = Math.max(0, lineSub - disc);
      const lineTax = (taxable * taxRate) / 100;
      const total = Math.round((taxable + lineTax) * 100) / 100;

      subtotal += lineSub;
      discountTotal += disc;
      taxTotal += lineTax;

      return {
        product: it.product || null,
        description: it.description || 'Service/Product',
        variantName: it.variantName || '',
        quantity: qty,
        unitPrice: price,
        discount: disc,
        taxRate,
        total
      };
    });

    const totalAmount = Math.round((subtotal - discountTotal + taxTotal) * 100) / 100;

    const invoice = new Invoice({
      invoiceNumber: generateInvoiceNumber(),
      customer: customerId,
      subscription: subscriptionId || null,
      issueDate: new Date(issueDate),
      dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      billingPeriodStart: billingPeriodStart ? new Date(billingPeriodStart) : new Date(issueDate),
      billingPeriodEnd: billingPeriodEnd ? new Date(billingPeriodEnd) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      items: formattedItems,
      subtotal: Math.round(subtotal * 100) / 100,
      taxTotal: Math.round(taxTotal * 100) / 100,
      discountTotal: Math.round(discountTotal * 100) / 100,
      totalAmount,
      amountPaid: 0,
      outstandingBalance: totalAmount,
      status: 'confirmed',
      paymentTerms,
      notes: notes || ''
    });

    await invoice.save();

    const created = await Invoice.findById(invoice._id).populate('customer');
    return res.status(201).json({ success: true, message: 'Invoice created successfully', invoice: created });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Failed to create invoice' });
  }
});

// PATCH /api/invoices/:id/status - Update invoice status (confirm, send, cancel)
router.patch('/:id/status', authenticate, checkRole('admin', 'staff'), async (req, res) => {
  try {
    const { action } = req.body;
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

    if (action === 'confirm') {
      invoice.status = invoice.amountPaid >= invoice.totalAmount ? 'paid' : (invoice.amountPaid > 0 ? 'partially_paid' : 'confirmed');
      invoice.confirmedAt = new Date();
    } else if (action === 'send') {
      invoice.sentAt = new Date();
      if (invoice.status === 'draft') invoice.status = 'confirmed';
    } else if (action === 'cancel') {
      if (invoice.status === 'paid') {
        return res.status(400).json({ success: false, message: 'Cannot cancel a fully paid invoice' });
      }
      invoice.status = 'cancelled';
      invoice.cancelledAt = new Date();
    } else {
      return res.status(400).json({ success: false, message: `Invalid action: ${action}` });
    }

    await invoice.save();
    return res.json({ success: true, message: `Invoice updated (${action})`, invoice });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update invoice' });
  }
});

module.exports = router;

