const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { authenticate, checkRole } = require('../middleware/auth');
const { generateProductCode } = require('../utils/numberGenerator');

// GET /api/products - List products
router.get('/', authenticate, async (req, res) => {
  try {
    const { type, search, isActive } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const products = await Product.find(filter).sort({ createdAt: -1 });
    return res.json({ success: true, count: products.length, products });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch products' });
  }
});

// GET /api/products/:id - Single product
router.get('/:id', authenticate, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    return res.json({ success: true, product });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch product' });
  }
});

// POST /api/products - Create product (Admin / Staff)
router.post('/', authenticate, checkRole('admin', 'staff'), async (req, res) => {
  try {
    const { name, code, type, description, salesPrice, costPrice, category, unit, variants, notes } = req.body;

    if (!name || salesPrice === undefined) {
      return res.status(400).json({ success: false, message: 'Product name and sales price are required' });
    }

    const productCode = code || generateProductCode();

    const product = new Product({
      name,
      code: productCode,
      type: type || 'software',
      description,
      salesPrice: Number(salesPrice),
      costPrice: Number(costPrice || 0),
      category: category || 'General',
      unit: unit || 'license',
      variants: Array.isArray(variants) ? variants : [],
      notes: notes || ''
    });

    await product.save();
    return res.status(201).json({ success: true, message: 'Product created successfully', product });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Failed to create product' });
  }
});

// PUT /api/products/:id - Update product (Admin / Staff)
router.put('/:id', authenticate, checkRole('admin', 'staff'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const { name, code, type, description, salesPrice, costPrice, category, unit, variants, notes, isActive } = req.body;

    if (name) product.name = name;
    if (code) product.code = code;
    if (type) product.type = type;
    if (description !== undefined) product.description = description;
    if (salesPrice !== undefined) product.salesPrice = Number(salesPrice);
    if (costPrice !== undefined) product.costPrice = Number(costPrice);
    if (category) product.category = category;
    if (unit) product.unit = unit;
    if (variants !== undefined) product.variants = variants;
    if (notes !== undefined) product.notes = notes;
    if (isActive !== undefined) product.isActive = isActive;

    await product.save();
    return res.json({ success: true, message: 'Product updated successfully', product });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update product' });
  }
});

// DELETE /api/products/:id - Deactivate product (Admin only)
router.delete('/:id', authenticate, checkRole('admin'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    product.isActive = false;
    await product.save();
    return res.json({ success: true, message: 'Product deactivated successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to deactivate product' });
  }
});

module.exports = router;

