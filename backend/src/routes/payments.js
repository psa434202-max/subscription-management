const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');
const { authenticate, checkRole } = require('../middleware/auth');
const { generatePaymentNumber } = require('../utils/numberGenerator');

// GET /api/payments - List payments
router.get('/', authenticate, async (req, res) => {
  try {
    const filter = {};

    if (req.user.role === 'customer') {
      const customer = await Customer.findOne({
        $or: [{ user: req.user._id }, { email: req.user.email }]
      });
      if (!customer) return res.json({ success: true, payments: [] });
      filter.customer = customer._id;
    } else {
      if (req.query.customer) filter.customer = req.query.customer;
      if (req.query.invoice) filter.invoice = req.query.invoice;
      if (req.query.paymentMethod) filter.paymentMethod = req.query.paymentMethod;
    }

    const payments = await Payment.find(filter)
      .populate('customer')
      .populate('invoice')
      .sort({ paymentDate: -1 });

    return res.json({ success: true, count: payments.length, payments });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch payments' });
  }
});

// POST /api/payments - Record a payment
router.post('/', authenticate, async (req, res) => {
  try {
    const { invoiceId, amount, paymentMethod = 'upi', transactionReference, notes } = req.body;

    if (!invoiceId || !amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Invoice and valid positive amount are required' });
    }

    const invoice = await Invoice.findById(invoiceId).populate('customer');
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

    if (req.user.role === 'customer') {
      const isOwner = invoice.customer?._id?.toString() === req.customer?._id?.toString() ||
                      invoice.customer?.email === req.user.email;
      if (!isOwner) return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (invoice.status === 'paid' && invoice.outstandingBalance <= 0) {
      return res.status(400).json({ success: false, message: 'Invoice is already fully paid' });
    }

    const payAmount = Number(amount);
    if (payAmount > invoice.outstandingBalance) {
      return res.status(400).json({
        success: false,
        message: `Payment amount ₹${payAmount} exceeds outstanding balance ₹${invoice.outstandingBalance}`
      });
    }

    const txnRef = transactionReference || `${paymentMethod.toUpperCase()}-TXN-${Math.floor(100000 + Math.random() * 900000)}`;

    const payment = new Payment({
      paymentNumber: generatePaymentNumber(),
      invoice: invoice._id,
      customer: invoice.customer._id,
      amount: payAmount,
      paymentMethod,
      transactionReference: txnRef,
      paymentDate: new Date(),
      status: 'completed',
      notes: notes || 'Simulated payment transaction'
    });

    await payment.save();

    // Update invoice
    invoice.amountPaid = Math.round(((invoice.amountPaid || 0) + payAmount) * 100) / 100;
    invoice.outstandingBalance = Math.max(0, Math.round((invoice.totalAmount - invoice.amountPaid) * 100) / 100);

    if (invoice.outstandingBalance <= 0) {
      invoice.status = 'paid';
      invoice.paidAt = new Date();
    } else {
      invoice.status = 'partially_paid';
    }

    await invoice.save();

    const createdPayment = await Payment.findById(payment._id).populate('invoice').populate('customer');

    return res.status(201).json({
      success: true,
      message: `Payment of ₹${payAmount} recorded successfully!`,
      payment: createdPayment,
      updatedInvoice: {
        _id: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status,
        amountPaid: invoice.amountPaid,
        outstandingBalance: invoice.outstandingBalance
      }
    });
  } catch (err) {
    console.error('Payment record error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to record payment' });
  }
});

module.exports = router;

