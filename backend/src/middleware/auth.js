const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Customer = require('../models/Customer');

const JWT_SECRET = process.env.JWT_SECRET || 'brightloop_super_secret_jwt_key_2026';

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(decoded.id).select('-password');
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User not found or account is deactivated.' });
    }

    req.user = user;

    // If customer, attach customer document if exists
    if (user.role === 'customer') {
      let customer = null;
      if (user.customer) {
        customer = await Customer.findById(user.customer);
      }
      if (!customer) {
        customer = await Customer.findOne({ user: user._id });
      }
      if (!customer) {
        customer = await Customer.findOne({ email: user.email });
      }
      req.customer = customer;
    }

    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role '${req.user.role}' is not authorized to access this resource.`
      });
    }
    next();
  };
};

module.exports = { authenticate, checkRole, JWT_SECRET };

