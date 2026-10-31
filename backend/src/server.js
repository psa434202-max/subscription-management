require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const customerRoutes = require('./routes/customers');
const productRoutes = require('./routes/products');
const planRoutes = require('./routes/plans');
const quotationTemplateRoutes = require('./routes/quotationTemplates');
const quotationRoutes = require('./routes/quotations');
const subscriptionRoutes = require('./routes/subscriptions');
const invoiceRoutes = require('./routes/invoices');
const billingRoutes = require('./routes/billing');
const paymentRoutes = require('./routes/payments');
const taxRoutes = require('./routes/taxes');
const discountRoutes = require('./routes/discounts');
const assistantRoutes = require('./routes/assistant');
const analyticsRoutes = require('./routes/analytics');

const User = require('./models/User');
const { seedData } = require('./seed');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Request logging in development
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'test') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  }
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Brightloop Subscription Management API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Reset Demo Data endpoint
app.post('/api/reset-demo', async (req, res) => {
  try {
    await seedData();
    res.json({ success: true, message: 'Database reset to initial demo state successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to reset demo data', error: err.message });
  }
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/quotation-templates', quotationTemplateRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/taxes', taxRoutes);
app.use('/api/discounts', discountRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/analytics', analyticsRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Cannot ${req.method} ${req.url}` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Start Server
const startServer = async () => {
  try {
    await connectDB();

    // Auto-seed if database is empty
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('Empty database detected. Running initial seed...');
      await seedData();
      console.log('Initial seed complete.');
    }

    const server = app.listen(PORT, () => {
      console.log(`=================================================`);
      console.log(` Brightloop Subscription Management Backend API `);
      console.log(` Server running on http://localhost:${PORT}      `);
      console.log(`=================================================`);
    });
    return server;
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
