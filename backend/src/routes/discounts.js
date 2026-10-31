const express = require('express');
const router = express.Router();
const Discount = require('../models/Discount');
const { authenticate, checkRole } = require('../middleware/auth');

// GET /api/discounts - List discounts
router.get('/', authenticate, async (req, res) => {
  try {
    const { activeOnly } = req.query;
    const filter = {};
    if (activeOnly === 'true') filter.isActive = true;

    const discounts = await Discount.find(filter)
      .populate('applicableProducts')
      .populate('applicablePlans')
      .sort({ createdAt: -1 });

    return res.json({ success: true, count: discounts.length, discounts });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch discounts' });
  }
});

// POST /api/discounts/validate - Validate a discount code for given subtotal and plan
router.post('/validate', authenticate, async (req, res) => {
  try {
    const { code, amount, quantity = 1, planId } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: 'Discount code is required' });
    }

    const discount = await Discount.findOne({ code: code.toUpperCase() });
    if (!discount) {
      return res.status(404).json({ success: false, message: 'Invalid coupon code' });
    }

    const validation = discount.isValidFor({ amount: Number(amount) || 0, quantity: Number(quantity) || 1, planId });
    if (!validation.valid) {
      return res.status(400).json({ success: false, message: validation.reason });
    }

    const discountAmount = discount.calculateDiscount(Number(amount) || 0);

    return res.json({
      success: true,
      message: 'Discount code applied successfully!',
      discount: {
        _id: discount._id,
        code: discount.code,
        name: discount.name,
        type: discount.type,
        value: discount.value,
        discountAmount: Math.round(discountAmount * 100) / 100
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to validate discount code' });
  }
});

// POST /api/discounts - Create discount (Admin only)
router.post('/', authenticate, checkRole('admin'), async (req, res) => {
  try {
    const {
      code,
      name,
      type,
      value,
      minimumPurchase,
      minimumQuantity,
      startDate,
      endDate,
      usageLimit,
      appliesTo,
      applicableProducts,
      applicablePlans
    } = req.body;

    if (!code || !name || value === undefined) {
      return res.status(400).json({ success: false, message: 'Code, name, and value are required' });
    }

    const existing = await Discount.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'A discount with this code already exists' });
    }

    const discount = new Discount({
      code: code.toUpperCase(),
      name,
      type: type || 'percentage',
      value: Number(value),
      minimumPurchase: Number(minimumPurchase || 0),
      minimumQuantity: Number(minimumQuantity || 1),
      startDate: startDate || new Date(),
      endDate,
      usageLimit: Number(usageLimit || 0),
      appliesTo: appliesTo || 'all',
      applicableProducts: Array.isArray(applicableProducts) ? applicableProducts : [],
      applicablePlans: Array.isArray(applicablePlans) ? applicablePlans : []
    });

    await discount.save();
    return res.status(201).json({ success: true, message: 'Discount created successfully', discount });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Failed to create discount' });
  }
});

// PUT /api/discounts/:id - Update discount (Admin only)
router.put('/:id', authenticate, checkRole('admin'), async (req, res) => {
  try {
    const discount = await Discount.findById(req.params.id);
    if (!discount) return res.status(404).json({ success: false, message: 'Discount not found' });

    Object.assign(discount, req.body);
    if (req.body.code) discount.code = req.body.code.toUpperCase();
    if (req.body.value !== undefined) discount.value = Number(req.body.value);

    await discount.save();
    return res.json({ success: true, message: 'Discount updated successfully', discount });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update discount' });
  }
});

// DELETE /api/discounts/:id - Deactivate discount (Admin only)
router.delete('/:id', authenticate, checkRole('admin'), async (req, res) => {
  try {
    const discount = await Discount.findById(req.params.id);
    if (!discount) return res.status(404).json({ success: false, message: 'Discount not found' });

    discount.isActive = false;
    await discount.save();
    return res.json({ success: true, message: 'Discount deactivated successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to deactivate discount' });
  }
});

module.exports = router;

