const express = require('express');
const router = express.Router();
const QuotationTemplate = require('../models/QuotationTemplate');
const { authenticate, checkRole } = require('../middleware/auth');

// GET /api/quotation-templates - List templates
router.get('/', authenticate, async (req, res) => {
  try {
    const templates = await QuotationTemplate.find({ isActive: true })
      .populate('plan')
      .populate('items.product')
      .sort({ createdAt: -1 });

    return res.json({ success: true, count: templates.length, templates });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch templates' });
  }
});

// POST /api/quotation-templates - Create template (Admin/Staff)
router.post('/', authenticate, checkRole('admin', 'staff'), async (req, res) => {
  try {
    const { name, description, plan, items, paymentTerms, defaultValidityDays, notes } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Template name is required' });
    }

    const template = new QuotationTemplate({
      name,
      description,
      plan: plan || null,
      items: Array.isArray(items) ? items : [],
      paymentTerms: paymentTerms || 'Net 30',
      defaultValidityDays: Number(defaultValidityDays || 30),
      notes: notes || ''
    });

    await template.save();
    return res.status(201).json({ success: true, message: 'Quotation template created', template });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Failed to create template' });
  }
});

// PUT /api/quotation-templates/:id - Update template
router.put('/:id', authenticate, checkRole('admin', 'staff'), async (req, res) => {
  try {
    const template = await QuotationTemplate.findById(req.params.id);
    if (!template) return res.status(404).json({ success: false, message: 'Template not found' });

    Object.assign(template, req.body);
    await template.save();

    return res.json({ success: true, message: 'Template updated successfully', template });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update template' });
  }
});

// DELETE /api/quotation-templates/:id - Delete template
router.delete('/:id', authenticate, checkRole('admin', 'staff'), async (req, res) => {
  try {
    const template = await QuotationTemplate.findById(req.params.id);
    if (!template) return res.status(404).json({ success: false, message: 'Template not found' });

    template.isActive = false;
    await template.save();

    return res.json({ success: true, message: 'Template archived successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to archive template' });
  }
});

module.exports = router;

