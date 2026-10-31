require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('./config/db');

const User = require('./models/User');
const Customer = require('./models/Customer');
const Product = require('./models/Product');
const SubscriptionPlan = require('./models/SubscriptionPlan');
const Tax = require('./models/Tax');
const Discount = require('./models/Discount');
const QuotationTemplate = require('./models/QuotationTemplate');
const Quotation = require('./models/Quotation');
const Subscription = require('./models/Subscription');
const Invoice = require('./models/Invoice');
const Payment = require('./models/Payment');
const SubscriptionChangeHistory = require('./models/SubscriptionChangeHistory');
const ChatConversation = require('./models/ChatConversation');

const seedData = async () => {
  try {
    console.log('--- Starting Brightloop Database Seed ---');
    await connectDB();

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Customer.deleteMany({}),
      Product.deleteMany({}),
      SubscriptionPlan.deleteMany({}),
      Tax.deleteMany({}),
      Discount.deleteMany({}),
      QuotationTemplate.deleteMany({}),
      Quotation.deleteMany({}),
      Subscription.deleteMany({}),
      Invoice.deleteMany({}),
      Payment.deleteMany({}),
      SubscriptionChangeHistory.deleteMany({}),
      ChatConversation.deleteMany({})
    ]);

    console.log('Cleaned old collections.');

    const defaultPassword = 'Password@123'; // >8 chars, upper, lower, special

    // 1. Create Taxes
    const gst18 = await Tax.create({
      name: 'GST 18%',
      rate: 18,
      type: 'percentage',
      isDefault: true,
      effectiveFrom: new Date('2024-01-01')
    });

    const gst5 = await Tax.create({
      name: 'GST 5% (Reduced)',
      rate: 5,
      type: 'percentage',
      isDefault: false,
      effectiveFrom: new Date('2024-01-01')
    });

    console.log('Created Taxes.');

    // 2. Create Products
    const prodCore = await Product.create({
      name: 'Brightloop Cloud Core',
      code: 'PRD-CORE-01',
      type: 'software',
      description: 'Central subscription billing engine and webhook dispatcher',
      salesPrice: 1200,
      costPrice: 300,
      category: 'Software Platform',
      unit: 'instance',
      variants: [
        { name: 'Standard Multi-tenant', sku: 'CORE-STD', priceAdjustment: 0, isDefault: true },
        { name: 'High-availability Cluster', sku: 'CORE-HA', priceAdjustment: 800 }
      ],
      notes: 'Includes REST API access'
    });

    const prodAnalytics = await Product.create({
      name: 'AI Revenue Analytics & Insights',
      code: 'PRD-AI-02',
      type: 'addon',
      description: 'Predictive churn analytics and revenue forecasting models',
      salesPrice: 800,
      costPrice: 200,
      category: 'Addon',
      unit: 'license',
      variants: [
        { name: 'Monthly Insights', sku: 'AI-M', priceAdjustment: 0, isDefault: true }
      ]
    });

    const prodSeats = await Product.create({
      name: 'Collaborator User Seat',
      code: 'PRD-SEAT-03',
      type: 'service',
      description: 'Additional staff and operations access seat',
      salesPrice: 250,
      costPrice: 50,
      category: 'User Seats',
      unit: 'seat',
      variants: [
        { name: 'Standard Seat', sku: 'SEAT-STD', priceAdjustment: 0, isDefault: true }
      ]
    });

    const prodSupport = await Product.create({
      name: 'Dedicated 24/7 Enterprise SLA',
      code: 'PRD-SLA-04',
      type: 'service',
      description: '15-minute response time SLA with designated technical account manager',
      salesPrice: 2500,
      costPrice: 1000,
      category: 'Support',
      unit: 'month',
      variants: [
        { name: 'Priority Gold', sku: 'SLA-GOLD', priceAdjustment: 0, isDefault: true }
      ]
    });

    console.log('Created Products.');

    // 3. Create Subscription Plans
    const planStarter = await SubscriptionPlan.create({
      name: 'Starter Tier',
      code: 'PLAN-STARTER',
      description: 'Ideal for small startups launching recurring subscriptions',
      category: 'Basic',
      billingFrequency: 'monthly',
      price: 1499,
      minimumQuantity: 1,
      products: [
        { product: prodCore._id, variantName: 'Standard Multi-tenant', quantity: 1, unitPrice: 1200 },
        { product: prodSeats._id, variantName: 'Standard Seat', quantity: 1, unitPrice: 299 }
      ],
      features: [
        'Up to 1,000 Active Customers',
        'Automated Recurring Invoices',
        'Standard Email Support',
        'Basic Revenue Metrics',
        'UPI & Card Simulated Payments'
      ],
      autoRenewal: true,
      allowPause: true,
      allowEarlyClosure: true,
      isPopular: false
    });

    const planGrowth = await SubscriptionPlan.create({
      name: 'Growth Business',
      code: 'PLAN-GROWTH',
      description: 'For growing teams requiring automated workflows and AI analytics',
      category: 'Standard',
      billingFrequency: 'monthly',
      price: 3499,
      minimumQuantity: 1,
      products: [
        { product: prodCore._id, variantName: 'Standard Multi-tenant', quantity: 1, unitPrice: 1200 },
        { product: prodAnalytics._id, variantName: 'Monthly Insights', quantity: 1, unitPrice: 800 },
        { product: prodSeats._id, variantName: 'Standard Seat', quantity: 5, unitPrice: 299.8 }
      ],
      features: [
        'Up to 25,000 Active Customers',
        'AI Revenue Forecasting',
        'Automated Plan Switching Engine',
        '5 Collaborator User Seats',
        'Billing Assistant Integration',
        'Multi-currency Invoice Generation'
      ],
      autoRenewal: true,
      allowPause: true,
      allowEarlyClosure: true,
      isPopular: true
    });

    const planEnterprise = await SubscriptionPlan.create({
      name: 'Enterprise Suite',
      code: 'PLAN-ENTERPRISE',
      description: 'High-scale mission critical operations with 24/7 SLA and custom rules',
      category: 'Enterprise',
      billingFrequency: 'monthly',
      price: 7999,
      minimumQuantity: 1,
      products: [
        { product: prodCore._id, variantName: 'High-availability Cluster', quantity: 1, unitPrice: 2000 },
        { product: prodAnalytics._id, variantName: 'Monthly Insights', quantity: 1, unitPrice: 800 },
        { product: prodSupport._id, variantName: 'Priority Gold', quantity: 1, unitPrice: 2500 },
        { product: prodSeats._id, variantName: 'Standard Seat', quantity: 10, unitPrice: 269.9 }
      ],
      features: [
        'Unlimited Customers & Invoices',
        'Dedicated 24/7 SLA (15m response)',
        'Custom Webhooks & Audit Logs',
        '10 Collaborator Seats Included',
        'Full Quotation Lifecycle Engine',
        'VIP Priority Smart Recommendations'
      ],
      autoRenewal: true,
      allowPause: true,
      allowEarlyClosure: true,
      isPopular: false
    });

    const planAnnualGrowth = await SubscriptionPlan.create({
      name: 'Growth Annual (17% Off)',
      code: 'PLAN-GROWTH-ANNUAL',
      description: 'Annual commitment of Growth Business with significant yearly savings',
      category: 'Standard',
      billingFrequency: 'yearly',
      price: 34990, // Saves ~₹7,000/yr vs monthly
      minimumQuantity: 1,
      products: [
        { product: prodCore._id, variantName: 'Standard Multi-tenant', quantity: 1, unitPrice: 12000 },
        { product: prodAnalytics._id, variantName: 'Monthly Insights', quantity: 1, unitPrice: 8000 },
        { product: prodSeats._id, variantName: 'Standard Seat', quantity: 5, unitPrice: 2998 }
      ],
      features: [
        'All Growth Business Features',
        '2 Months Free (Save 17% Yearly)',
        'Priority Annual Support Channel',
        'Free Implementation Consultation'
      ],
      autoRenewal: true,
      allowPause: false,
      allowEarlyClosure: true,
      isPopular: false
    });

    console.log('Created Subscription Plans.');

    // 4. Create Discounts
    const discWelcome = await Discount.create({
      code: 'WELCOME20',
      name: 'New Subscriber 20% Discount',
      type: 'percentage',
      value: 20,
      minimumPurchase: 1000,
      usageLimit: 200,
      timesUsed: 12,
      appliesTo: 'all'
    });

    const discFlat = await Discount.create({
      code: 'FLAT500',
      name: 'Startup Growth ₹500 Off',
      type: 'fixed',
      value: 500,
      minimumPurchase: 2500,
      usageLimit: 100,
      timesUsed: 5,
      appliesTo: 'all'
    });

    console.log('Created Discounts.');

    // 5. Create Users (Admin, Staff, Customers)
    const adminUser = new User({
      name: 'Aiden Vance (System Admin)',
      email: 'admin@brightloop.com',
      password: defaultPassword,
      role: 'admin',
      phone: '+91 98765 43210'
    });
    await adminUser.save();

    const staffUser = new User({
      name: 'Elena Rostova (Operations Staff)',
      email: 'staff@brightloop.com',
      password: defaultPassword,
      role: 'staff',
      phone: '+91 98765 43211'
    });
    await staffUser.save();

    // Customer 1: Acme Corp (John Doe)
    const customerUser1 = new User({
      name: 'John Doe',
      email: 'john@acme.com',
      password: defaultPassword,
      role: 'customer',
      phone: '+91 98765 11111'
    });
    await customerUser1.save();

    const customer1 = await Customer.create({
      name: 'John Doe',
      companyName: 'Acme Corporation',
      email: 'john@acme.com',
      phone: '+91 98765 11111',
      billingAddress: {
        street: '42 Cyber City, Tech Park',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560103',
        country: 'India'
      },
      taxId: '29ABCDE1234F1Z5',
      paymentTerms: 'Net 30',
      notes: 'Key Enterprise Account',
      user: customerUser1._id
    });
    customerUser1.customer = customer1._id;
    await customerUser1.save();

    // Customer 2: Techflow Innovations (Sarah Connor)
    const customerUser2 = new User({
      name: 'Sarah Connor',
      email: 'sarah@techflow.io',
      password: defaultPassword,
      role: 'customer',
      phone: '+91 98765 22222'
    });
    await customerUser2.save();

    const customer2 = await Customer.create({
      name: 'Sarah Connor',
      companyName: 'Techflow Innovations',
      email: 'sarah@techflow.io',
      phone: '+91 98765 22222',
      billingAddress: {
        street: '88 Innovation Way',
        city: 'Hyderabad',
        state: 'Telangana',
        postalCode: '500081',
        country: 'India'
      },
      taxId: '36XYZAB9876K2P9',
      paymentTerms: 'Net 15',
      user: customerUser2._id
    });
    customerUser2.customer = customer2._id;
    await customerUser2.save();

    // Customer 3: Cloudscale Systems (Robert Bruce)
    const customerUser3 = new User({
      name: 'Robert Bruce',
      email: 'robert@cloudscale.net',
      password: defaultPassword,
      role: 'customer',
      phone: '+91 98765 33333'
    });
    await customerUser3.save();

    const customer3 = await Customer.create({
      name: 'Robert Bruce',
      companyName: 'Cloudscale Systems',
      email: 'robert@cloudscale.net',
      phone: '+91 98765 33333',
      billingAddress: {
        street: '15 Gateway Towers',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400051',
        country: 'India'
      },
      taxId: '27MNPQR5678L4W3',
      paymentTerms: 'Net 30',
      user: customerUser3._id
    });
    customerUser3.customer = customer3._id;
    await customerUser3.save();

    console.log('Created Users and Customer profiles.');

    // 6. Create Quotation Templates & Quotations
    const qTemplate = await QuotationTemplate.create({
      name: 'Fast-Track SaaS Starter Bundle',
      description: 'Standard 30-day trial converted to Starter Tier with 1 collaborator seat',
      plan: planStarter._id,
      items: [
        { product: prodCore._id, variantName: 'Standard Multi-tenant', quantity: 1, unitPrice: 1200, discount: 0 },
        { product: prodSeats._id, variantName: 'Standard Seat', quantity: 1, unitPrice: 299, discount: 0 }
      ],
      paymentTerms: 'Net 30',
      defaultValidityDays: 30
    });

    const quotation1 = await Quotation.create({
      quotationNumber: 'QT-2026-001',
      customer: customer2._id,
      plan: planGrowth._id,
      template: qTemplate._id,
      validUntil: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      items: [
        {
          product: prodCore._id,
          description: 'Brightloop Cloud Core (Standard)',
          quantity: 1,
          unitPrice: 1200,
          discount: 0,
          taxRate: 18,
          total: 1416
        },
        {
          product: prodAnalytics._id,
          description: 'AI Revenue Analytics & Insights',
          quantity: 1,
          unitPrice: 800,
          discount: 0,
          taxRate: 18,
          total: 944
        }
      ],
      subtotal: 2000,
      taxTotal: 360,
      discountTotal: 0,
      totalAmount: 2360,
      status: 'sent',
      paymentTerms: 'Net 30',
      notes: 'Special hackathon introductory quote'
    });

    console.log('Created Quotation Template & Quotations.');

    // 7. Create Subscriptions
    const now = new Date();
    const periodStartSub1 = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000); // 15 days ago
    const periodEndSub1 = new Date(periodStartSub1.getTime() + 30 * 24 * 60 * 60 * 1000); // 15 days from now

    // Sub 1: Acme Corp on Starter Tier (Ready to demonstrate Plan Switching!)
    const subAcme = await Subscription.create({
      subscriptionNumber: 'SUB-2026-1001',
      customer: customer1._id,
      plan: planStarter._id,
      status: 'active',
      billingFrequency: 'monthly',
      startDate: periodStartSub1,
      currentPeriodStart: periodStartSub1,
      currentPeriodEnd: periodEndSub1,
      nextBillingDate: periodEndSub1,
      items: [
        {
          product: prodCore._id,
          description: 'Starter Tier - Cloud Core',
          quantity: 1,
          unitPrice: 1200,
          discount: 0,
          taxRate: 18,
          lineTotal: 1416
        },
        {
          product: prodSeats._id,
          description: 'Starter Tier - 1 User Seat',
          quantity: 1,
          unitPrice: 299,
          discount: 0,
          taxRate: 18,
          lineTotal: 352.82
        }
      ],
      subtotal: 1499,
      taxTotal: 269.82,
      discountTotal: 0,
      totalAmount: 1768.82,
      paymentTerms: 'Net 30',
      autoRenewal: true,
      notes: 'Primary subscription for Acme Corp'
    });

    // Sub 2: Techflow on Growth Plan
    const periodStartSub2 = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
    const periodEndSub2 = new Date(periodStartSub2.getTime() + 30 * 24 * 60 * 60 * 1000);

    const subTechflow = await Subscription.create({
      subscriptionNumber: 'SUB-2026-1002',
      customer: customer2._id,
      plan: planGrowth._id,
      status: 'active',
      billingFrequency: 'monthly',
      startDate: periodStartSub2,
      currentPeriodStart: periodStartSub2,
      currentPeriodEnd: periodEndSub2,
      nextBillingDate: periodEndSub2,
      items: [
        {
          product: prodCore._id,
          description: 'Growth Plan - Core Platform',
          quantity: 1,
          unitPrice: 2000,
          discount: 0,
          taxRate: 18,
          lineTotal: 2360
        },
        {
          product: prodAnalytics._id,
          description: 'Growth Plan - AI Insights',
          quantity: 1,
          unitPrice: 1499,
          discount: 0,
          taxRate: 18,
          lineTotal: 1768.82
        }
      ],
      subtotal: 3499,
      taxTotal: 629.82,
      discountTotal: 0,
      totalAmount: 4128.82,
      paymentTerms: 'Net 15',
      autoRenewal: true
    });

    console.log('Created Subscriptions.');

    // 8. Create Invoices & Payments
    // Invoice 1: Acme Corp - Paid invoice from previous cycle
    const prevMonthStart = new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000);
    const prevMonthEnd = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);

    const inv1 = await Invoice.create({
      invoiceNumber: 'INV-2026-1001',
      subscription: subAcme._id,
      customer: customer1._id,
      issueDate: prevMonthStart,
      dueDate: new Date(prevMonthStart.getTime() + 15 * 24 * 60 * 60 * 1000),
      billingPeriodStart: prevMonthStart,
      billingPeriodEnd: prevMonthEnd,
      items: [
        {
          product: prodCore._id,
          description: 'Starter Tier Monthly Access',
          quantity: 1,
          unitPrice: 1499,
          discount: 0,
          taxRate: 18,
          total: 1768.82
        }
      ],
      subtotal: 1499,
      taxTotal: 269.82,
      discountTotal: 0,
      totalAmount: 1768.82,
      amountPaid: 1768.82,
      outstandingBalance: 0,
      status: 'paid',
      paymentTerms: 'Net 30',
      paidAt: new Date(prevMonthStart.getTime() + 2 * 24 * 60 * 60 * 1000),
      notes: 'Initial activation billing'
    });

    await Payment.create({
      paymentNumber: 'PAY-2026-1001',
      invoice: inv1._id,
      customer: customer1._id,
      amount: 1768.82,
      paymentMethod: 'upi',
      transactionReference: 'UPI-TXN-984210',
      paymentDate: new Date(prevMonthStart.getTime() + 2 * 24 * 60 * 60 * 1000),
      status: 'completed',
      notes: 'Paid via Google Pay UPI'
    });

    // Invoice 2: Acme Corp - Current active invoice (Confirmed, partially paid or unpaid for demonstration)
    const inv2 = await Invoice.create({
      invoiceNumber: 'INV-2026-1002',
      subscription: subAcme._id,
      customer: customer1._id,
      issueDate: periodStartSub1,
      dueDate: new Date(periodStartSub1.getTime() + 30 * 24 * 60 * 60 * 1000),
      billingPeriodStart: periodStartSub1,
      billingPeriodEnd: periodEndSub1,
      items: [
        {
          product: prodCore._id,
          description: 'Starter Tier - Cloud Core (Standard)',
          quantity: 1,
          unitPrice: 1200,
          discount: 0,
          taxRate: 18,
          total: 1416
        },
        {
          product: prodSeats._id,
          description: 'Collaborator User Seat (1 Unit)',
          quantity: 1,
          unitPrice: 299,
          discount: 0,
          taxRate: 18,
          total: 352.82
        }
      ],
      subtotal: 1499,
      taxTotal: 269.82,
      discountTotal: 0,
      totalAmount: 1768.82,
      amountPaid: 0,
      outstandingBalance: 1768.82,
      status: 'confirmed',
      paymentTerms: 'Net 30',
      notes: 'Current month subscription billing'
    });

    // Invoice 3: Techflow - Paid
    const inv3 = await Invoice.create({
      invoiceNumber: 'INV-2026-1003',
      subscription: subTechflow._id,
      customer: customer2._id,
      issueDate: periodStartSub2,
      dueDate: new Date(periodStartSub2.getTime() + 15 * 24 * 60 * 60 * 1000),
      billingPeriodStart: periodStartSub2,
      billingPeriodEnd: periodEndSub2,
      items: [
        {
          product: prodCore._id,
          description: 'Growth Plan Access',
          quantity: 1,
          unitPrice: 3499,
          discount: 0,
          taxRate: 18,
          total: 4128.82
        }
      ],
      subtotal: 3499,
      taxTotal: 629.82,
      discountTotal: 0,
      totalAmount: 4128.82,
      amountPaid: 4128.82,
      outstandingBalance: 0,
      status: 'paid',
      paymentTerms: 'Net 15',
      paidAt: new Date(periodStartSub2.getTime() + 1 * 24 * 60 * 60 * 1000)
    });

    await Payment.create({
      paymentNumber: 'PAY-2026-1002',
      invoice: inv3._id,
      customer: customer2._id,
      amount: 4128.82,
      paymentMethod: 'card',
      transactionReference: 'CARD-VISA-402219',
      paymentDate: new Date(periodStartSub2.getTime() + 1 * 24 * 60 * 60 * 1000),
      status: 'completed',
      notes: 'Paid via Corporate Visa'
    });

    console.log('Created Invoices and Payment records.');

    // 9. Create Sample Chat Conversation
    await ChatConversation.create({
      user: customerUser1._id,
      customer: customer1._id,
      messages: [
        {
          sender: 'assistant',
          text: `👋 Hello John! I am your **Brightloop Billing Assistant**.\n\nI can answer questions regarding your subscriptions, explain your invoice charges, track upcoming renewal dates, check outstanding balances, and help you find or switch plans.\n\nHow can I help you today?`,
          metadata: {
            intent: 'greeting',
            quickActions: [
              { label: 'How much do I owe?', actionType: 'query_due' },
              { label: 'When is my next renewal?', actionType: 'query_renewal' },
              { label: 'What subscriptions do I have?', actionType: 'query_subscriptions' },
              { label: 'Can I switch to a cheaper plan?', actionType: 'query_cheaper_plans' }
            ]
          }
        }
      ]
    });

    console.log('--- Database Seed Completed Successfully! ---');
    console.log('\nDemo Accounts:');
    console.log('1. Admin:    admin@brightloop.com     /  Password@123');
    console.log('2. Staff:    staff@brightloop.com     /  Password@123');
    console.log('3. Customer: john@acme.com            /  Password@123 (Acme Corp)');
    console.log('4. Customer: sarah@techflow.io        /  Password@123 (Techflow)');

    return true;
  } catch (err) {
    console.error('Seed script error:', err);
    throw err;
  }
};

if (require.main === module) {
  seedData()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { seedData };
