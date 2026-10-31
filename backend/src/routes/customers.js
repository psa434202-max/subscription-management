const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const Subscription = require('../models/Subscription');
const Invoice = require('../models/Invoice');
const { authenticate, checkRole } = require('../middleware/auth');

// GET /api/customers - List all customers (Admin / Staff) or own customer (Customer)
router.get('/', authenticate, async (req, res) => {
  try {
    if (req.user.role === 'customer') {
      const customer = await Customer.findOne({
        $or: [{ user: req.user._id }, { email: req.user.email }]
      });
      return res.json({ success: true, customers: customer ? [customer] : [] });
    }

    const { search, status } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } }
      ];
    }

    const customers = await Customer.find(filter).sort({ createdAt: -1 });
    return res.json({ success: true, count: customers.length, customers });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch customers' });
  }
});

// GET /api/customers/:id - Get customer details with summary stats
router.get('/:id', authenticate, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

    // Customer can only view own profile
    if (req.user.role === 'customer') {
      const isOwner = customer.user?.toString() === req.user._id.toString() || customer.email === req.user.email;
      if (!isOwner) return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const [activeSubscriptions, invoices] = await Promise.all([
      Subscription.find({ customer: customer._id, status: 'active' }).populate('plan'),
      Invoice.find({ customer: customer._id }).sort({ issueDate: -1 })
    ]);

    const totalInvoiced = invoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
    const totalPaid = invoices.reduce((acc, inv) => acc + (inv.amountPaid || 0), 0);
    const outstandingBalance = invoices.reduce((acc, inv) => acc + (inv.outstandingBalance || 0), 0);

    return res.json({
      success: true,
      customer,
      stats: {
        activeSubscriptionsCount: activeSubscriptions.length,
        totalInvoiced,
        totalPaid,
        outstandingBalance
      },
      activeSubscriptions,
      recentInvoices: invoices.slice(0, 5)
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch customer details' });
  }
});

// POST /api/customers - Create customer (Admin / Staff)
router.post('/', authenticate, checkRole('admin', 'staff'), async (req, res) => {
  try {
    const { name, companyName, email, phone, billingAddress, taxId, paymentTerms, notes } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required' });
    }

    const existing = await Customer.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'A customer with this email already exists' });
    }

    const customer = new Customer({
      name,
      companyName,
      email: email.toLowerCase(),
      phone,
      billingAddress,
      taxId,
      paymentTerms: paymentTerms || 'Net 30',
      notes
    });

    await customer.save();
    return res.status(201).json({ success: true, message: 'Customer created successfully', customer });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Failed to create customer' });
  }
});

// PUT /api/customers/:id - Update customer
router.put('/:id', authenticate, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

    if (req.user.role === 'customer') {
      const isOwner = customer.user?.toString() === req.user._id.toString() || customer.email === req.user.email;
      if (!isOwner) return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { name, companyName, phone, billingAddress, taxId, paymentTerms, notes, status } = req.body;

    if (name) customer.name = name;
    if (companyName !== undefined) customer.companyName = companyName;
    if (phone !== undefined) customer.phone = phone;
    if (billingAddress) customer.billingAddress = { ...customer.billingAddress, ...billingAddress };
    if (taxId !== undefined) customer.taxId = taxId;
    if (notes !== undefined) customer.notes = notes;

    // Only Admin/Staff can change paymentTerms or status
    if (['admin', 'staff'].includes(req.user.role)) {
      if (paymentTerms) customer.paymentTerms = paymentTerms;
      if (status) customer.status = status;
    }

    await customer.save();
    return res.json({ success: true, message: 'Customer updated successfully', customer });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update customer' });
  }
});

// DELETE /api/customers/:id - Archive customer (Admin only)
router.delete('/:id', authenticate, checkRole('admin'), async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

    customer.status = 'archived';
    await customer.save();

    return res.json({ success: true, message: 'Customer archived successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to archive customer' });
  }
});

module.exports = router;

