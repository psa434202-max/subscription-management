const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Customer = require('../models/Customer');
const { authenticate, JWT_SECRET } = require('../middleware/auth');

// Helper to sign JWT
const signToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role = 'customer', phone, companyName } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    // Validate password complexity
    const complexityError = User.validatePasswordComplexity(password);
    if (complexityError) {
      return res.status(400).json({ success: false, message: complexityError });
    }

    // Check existing
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    // Only allow registering customer or staff if permitted (default is customer)
    const assignedRole = role === 'admin' ? 'customer' : role; // Admin accounts must be created internally

    const user = new User({
      name,
      email: email.toLowerCase(),
      password,
      role: assignedRole,
      phone
    });

    // If customer role, create customer record
    if (assignedRole === 'customer') {
      const customer = new Customer({
        name,
        email: email.toLowerCase(),
        phone,
        companyName: companyName || `${name}'s Organization`,
        user: user._id
      });
      await customer.save();
      user.customer = customer._id;
    }

    await user.save();

    const token = signToken(user);
    const populatedUser = await User.findById(user._id).select('-password').populate('customer');

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: populatedUser
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = signToken(user);
    const populatedUser = await User.findById(user._id).select('-password').populate('customer');

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: populatedUser
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Login failed' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password').populate('customer');
    return res.json({ success: true, user });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve profile' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ success: false, message: 'New password is required.' });
    }

    const complexityError = User.validatePasswordComplexity(newPassword);
    if (complexityError) {
      return res.status(400).json({ success: false, message: complexityError });
    }

    const user = await User.findById(req.user._id);
    if (currentPassword) {
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Current password does not match.' });
      }
    }

    user.password = newPassword;
    await user.save();

    return res.json({ success: true, message: 'Password reset successfully.' });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ success: false, message: 'Failed to reset password.' });
  }
});

// POST /api/auth/demo-switch (Allows instant login for testing Admin, Staff, or Customer)
router.post('/demo-switch', async (req, res) => {
  try {
    const { role } = req.body;
    let user;

    if (role === 'admin') {
      user = await User.findOne({ email: 'admin@brightloop.com' });
    } else if (role === 'staff') {
      user = await User.findOne({ email: 'staff@brightloop.com' });
    } else {
      user = await User.findOne({ email: 'john@acme.com' }) || await User.findOne({ role: 'customer' });
    }

    if (!user) {
      return res.status(404).json({ success: false, message: `Demo user for role ${role} not found. Please run seed.` });
    }

    const token = signToken(user);
    const populatedUser = await User.findById(user._id).select('-password').populate('customer');

    return res.json({
      success: true,
      message: `Switched to ${user.name} (${user.role})`,
      token,
      user: populatedUser
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Demo switch failed' });
  }
});

module.exports = router;

