const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticate, checkRole } = require('../middleware/auth');

// GET /api/users - List users (Admin only)
router.get('/', authenticate, checkRole('admin'), async (req, res) => {
  try {
    const { role, search } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter).select('-password').populate('customer').sort({ createdAt: -1 });
    return res.json({ success: true, count: users.length, users });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
});

// GET /api/users/staff - List staff accounts (Admin only)
router.get('/staff', authenticate, checkRole('admin'), async (req, res) => {
  try {
    const staff = await User.find({ role: 'staff' }).select('-password').sort({ createdAt: -1 });
    return res.json({ success: true, staff });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch staff' });
  }
});

// POST /api/users/staff - Create staff account (Admin only)
router.post('/staff', authenticate, checkRole('admin'), async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    const complexityError = User.validatePasswordComplexity(password);
    if (complexityError) {
      return res.status(400).json({ success: false, message: complexityError });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email is already in use' });
    }

    const staffUser = new User({
      name,
      email: email.toLowerCase(),
      password,
      role: 'staff',
      phone
    });

    await staffUser.save();

    const created = await User.findById(staffUser._id).select('-password');
    return res.status(201).json({
      success: true,
      message: 'Staff member account created successfully',
      user: created
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Failed to create staff' });
  }
});

// PATCH /api/users/:id/toggle-status - Activate/Deactivate user (Admin only)
router.patch('/:id/toggle-status', authenticate, checkRole('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.isActive = !user.isActive;
    await user.save();

    return res.json({
      success: true,
      message: `User ${user.name} is now ${user.isActive ? 'active' : 'inactive'}`,
      user: { _id: user._id, isActive: user.isActive }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update user status' });
  }
});

module.exports = router;

