const express = require('express');
const router = express.Router();
const Tax = require('../models/Tax');
const { authenticate, checkRole } = require('../middleware/auth');

// GET /api/taxes - List taxes
router.get('/', authenticate, async (req, res) => {
  try {
    const { activeOnly } = req.query;
    const filter = {};
    if (activeOnly === 'true') filter.isActive = true;

    const taxes = await Tax.find(filter).populate('applicableProducts').sort({ rate: 1 });
    return res.json({ success: true, count: taxes.length, taxes });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch taxes' });
  }
});

// POST /api/taxes - Create tax (Admin only)
router.post('/', authenticate, checkRole('admin'), async (req, res) => {
  try {
    const { name, rate, type, applicableProducts, isDefault, effectiveFrom, effectiveTo } = req.body;

    if (!name || rate === undefined) {
      return res.status(400).json({ success: false, message: 'Name and rate are required' });
    }

    if (isDefault) {
      // Unset other defaults if this is set as default
      await Tax.updateMany({ isDefault: true }, { isDefault: false });
    }

    const tax = new Tax({
      name,
      rate: Number(rate),
      type: type || 'percentage',
      applicableProducts: Array.isArray(applicableProducts) ? applicableProducts : [],
      isDefault: !!isDefault,
      effectiveFrom: effectiveFrom || new Date(),
      effectiveTo
    });

    await tax.save();
    return res.status(201).json({ success: true, message: 'Tax created successfully', tax });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Failed to create tax' });
  }
});

// PUT /api/taxes/:id - Update tax (Admin only)
router.put('/:id', authenticate, checkRole('admin'), async (req, res) => {
  try {
    const tax = await Tax.findById(req.params.id);
    if (!tax) return res.status(404).json({ success: false, message: 'Tax not found' });

    if (req.body.isDefault) {
      await Tax.updateMany({ _id: { $ne: tax._id }, isDefault: true }, { isDefault: false });
    }

    Object.assign(tax, req.body);
    if (req.body.rate !== undefined) tax.rate = Number(req.body.rate);

    await tax.save();
    return res.json({ success: true, message: 'Tax updated successfully', tax });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update tax' });
  }
});

// DELETE /api/taxes/:id - Toggle tax active (Admin only)
router.delete('/:id', authenticate, checkRole('admin'), async (req, res) => {
  try {
    const tax = await Tax.findById(req.params.id);
    if (!tax) return res.status(404).json({ success: false, message: 'Tax not found' });

    tax.isActive = false;
    await tax.save();
    return res.json({ success: true, message: 'Tax deactivated successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to deactivate tax' });
  }
});

module.exports = router;

