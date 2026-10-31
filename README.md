# Brightloop – Smart Subscription Management System

[![Node.js](https://img.shields.io/badge/Node.js-v26+-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)

**Brightloop** is a modern, responsive, enterprise-grade full-stack subscription management platform designed to orchestrate the complete recurring billing lifecycle—from catalog and plan authoring, quotations, lifecycle transitions, prorated self-service plan switching, and automated recurring invoice generation, to simulated multi-channel payments, analytics, and an interactive billing assistant chatbot.

---

## 🌟 Key Features

### 1. Authentication & Role-Based Access Control (RBAC)
- **Role Isolation**:
  - **Admin**: Full system control—product catalog, plans, discounts, tax rates, all customer subscriptions, staff creation, automated billing engine, and analytical reporting.
  - **Staff**: Operational access—customer management, quotations lifecycle, subscription activation, invoice verification, and report viewing.
  - **Customer**: Restricted self-service portal—view and manage only own subscriptions, quotations, invoices, payments, side-by-side plan comparisons, self-service plan switching, and AI billing assistant.
- **Security**: JWT authentication, bcrypt password hashing, and strict password complexity validation (>8 characters with uppercase, lowercase, and special characters).
- **1-Click Demo Switcher**: Instant role toggle pills in the navigation bar to easily evaluate Admin, Staff, and Customer experiences without repeatedly logging in and out.

### 2. Product & Plan Catalog
- **Products**: Support for multiple types (`software`, `service`, `physical`, `addon`), base pricing, cost price tracking, unit metrics (`license`, `seat`, `instance`), and variants with price adjustments.
- **Subscription Plans**: Configurable billing frequency (`daily`, `weekly`, `monthly`, `yearly`), minimum seat quantity, availability dates, auto-renewal settings, pause allowances, and early closure policies.

### 3. Subscription Lifecycle Management
- **Full Lifecycle Flow**:
  $$\text{Draft} \longrightarrow \text{Quotation} \longrightarrow \text{Confirmed} \longrightarrow \text{Active} \longrightarrow \text{Closed}$$
  *(With interim support for `Paused` and `Resumed` states)*
- **Data Model**: Unique sequential subscription IDs (e.g., `SUB-2026-1001`), line items with quantity, pricing, applied taxes, discounts, period start/end dates, and next billing schedules.

### 4. Quotation Engine
- **Reusable Templates**: Predefined bundles (e.g. *Fast-Track SaaS Starter Bundle*) with preset products, pricing, and validity periods.
- **One-Click Conversion**: Accept customer quotations and automatically convert them into confirmed subscriptions with calculated billing cycles.

### 5. Automated Recurring Billing Engine
- **Invoice Generation**: Scans active subscriptions due for billing, aggregates line items, applies active tax rates and discounts, and prevents duplicate invoices for the same cycle period.
- **Admin Demonstration Trigger**: A "Run Recurring Billing" action in the admin dashboard and invoices view to immediately simulate recurring billing cycles and view newly generated invoices.

### 6. Invoice & Payment Management
- **Invoice Lifecycle**: `Draft` → `Confirmed` → `Paid` (with support for `Partially Paid` and `Overdue`).
- **Simulated Multi-Channel Payments**: Record payments via **UPI (Google Pay / PhonePe)**, **Credit/Debit Card**, **Bank Transfer**, or **Cash**, with automated invoice balance reduction.
- **Printable / PDF Invoice**: Clean formatted invoice view designed for browser printing and PDF export.

### 7. Tax & Discount Engine
- **Taxation**: Jurisdictional tax configuration (e.g., GST 18%, GST 5%) with default tax rate application on invoices.
- **Discounts & Coupons**: Fixed (e.g., ₹500 off) and percentage discounts (e.g., 20% off) with minimum purchase rules, expiration dates, and usage caps.
- **Coupon Validator Tool**: Built-in interactive test utility to verify coupon discounts against purchase amounts.

### 8. Subscription Plan Comparison & Recommendation
- **Compare Plans**: Side-by-side matrix comparing up to 4 plans simultaneously, including monthly and annual cost equivalents, seat minimums, and feature checkmarks.
- **"Find My Best Plan" Tool**: Deterministic recommendation algorithm that takes monthly budget, billing frequency, seat quantity, and required features to rank the best plans with transparent explanations.
- **Savings Calculator**: Calculate exact monthly and annual savings when moving between current and alternative plans.

### 9. 🚀 Smart Plan Switching (Self-Service)
Customers can upgrade, downgrade, or switch plans on active subscriptions:
- **Immediate Switch (Prorated)**:
  - Deterministically calculates remaining days in the current billing cycle:
    $$\text{Remaining Ratio} = \frac{\text{Period End} - \text{Now}}{\text{Period End} - \text{Period Start}}$$
  - Computes prorated difference between the target plan price and current plan price.
  - Automatically issues a prorated invoice for upgrades or registers a billing credit for downgrades.
  - Generates an audit record in `SubscriptionChangeHistory`.
- **Switch on Next Renewal**:
  - Keeps the existing plan active until the renewal date with ₹0 charge today.
  - Schedules target plan activation automatically upon the next recurring billing cycle.

### 10. 🤖 Brightloop Billing Assistant Chatbot
Interactive assistant embedded directly into the customer portal:
- **Data Isolation**: Strictly scoped to the authenticated customer's database records.
- **Accurate Financial Explanations**:
  - *"Why is my invoice higher this month?"* — Explains line item changes, tax adjustments, and applied discounts compared to previous cycles.
  - *"When is my next renewal?"* — Retrieves active subscription expiration and renewal dates.
  - *"How much do I owe?"* — Summarizes unpaid and overdue invoice balances with direct settlement buttons.
  - *"What is included in my plan?"* — Lists entitled features and seat allocations.
  - *"Can I switch to a cheaper plan?"* — Suggests cost-effective plan alternatives and guides the customer through switching.
- **Persistent History**: Chat history is persisted in MongoDB across sessions.

### 11. Dashboards & Analytics
- **Admin Dashboard**: Real-time Monthly Recurring Revenue (MRR), Annual Recurring Revenue (ARR), Total Collected Revenue, Outstanding Dues, Active Subscribers, Recharts visualizations (Monthly Revenue Growth Area Chart, Status Pie Chart, Plan Popularity Bar Chart, Settlement Methods Distribution).
- **Staff Dashboard**: Pending quotations needing follow-up, unpaid invoices, and customer accounts.
- **Customer Dashboard**: Current active plan spotlight, renewal countdown, recent invoices, and 1-click shortcuts to Plan Switching and the Billing Assistant.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite 6, Tailwind CSS, Lucide React, Recharts |
| **Backend** | Node.js (v26 LTS), Express.js, JWT, bcryptjs |
| **Database** | MongoDB with Mongoose (with embedded MongoMemoryServer for 100% zero-config execution) |
| **Architecture**| Clean modular client-server architecture with RESTful API |

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js installed (v18 or higher; v26 LTS recommended).
- *Note: External MongoDB is optional!* The backend includes an embedded MongoDB memory server that automatically launches if no local MongoDB instance is running.

### 1. Clone & Install Dependencies

Open a PowerShell or Command Prompt terminal in the project directory:

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Seed Demo Data

Populate the database with realistic products, plans, customers, subscriptions, invoices, and payment records:

```bash
cd backend
node src/seed.js
```

### 3. Launch the Application

You can launch both servers simultaneously using the provided batch file or by running them in separate terminals:

#### Option A: Quick Launch (Windows)
Double-click `start.bat` in the project root directory, or run:
```cmd
.\start.bat
```

#### Option B: Manual Launch (Two Terminals)

**Terminal 1 — Backend API Server:**
```bash
cd backend
node src/server.js
# Runs on http://localhost:5000
```

**Terminal 2 — Frontend Client:**
```bash
cd frontend
npm run dev
# Runs on http://localhost:5173
```

Open your browser and navigate to **[http://localhost:5173](http://localhost:5173)**.

---

## 🔑 Demo Accounts & Evaluator Credentials

The platform includes pre-configured demo accounts for all three user roles:

| Role | Email | Password | Organization / Notes |
|---|---|---|---|
| **Admin** | `admin@brightloop.com` | `Password@123` | Full system access, billing engine, catalogs |
| **Staff** | `staff@brightloop.com` | `Password@123` | Quotations, customer operations, reports |
| **Customer 1** | `john@acme.com` | `Password@123` | Acme Corp (Active subscriber on Starter Tier) |
| **Customer 2** | `sarah@techflow.io` | `Password@123` | Techflow Innovations (Growth Tier) |
| **Customer 3** | `robert@cloudscale.net` | `Password@123` | Cloudscale Systems |

> 💡 **Tip:** Use the **1-Click Demo Switcher** pills located in the top navigation bar to instantaneously alternate between Admin, Staff, and Customer views without re-typing credentials!

---

## 🧪 Demonstration Walkthrough

To verify all requirements from the hackathon problem statement:

1. **Compare Plans & Recommendations**:
   - Log in as Customer (`john@acme.com`).
   - Navigate to **Compare Plans** to review the side-by-side matrix.
   - Use the **"Find My Best Plan"** tool with a budget of ₹4,000 to see scored recommendations.
   - Use the **Savings Calculator** to compare *Starter Tier* vs *Growth Annual*.

2. **Smart Plan Switching**:
   - In the Customer Dashboard or **Subscriptions** tab, click **"Change Plan"** on subscription `SUB-2026-1001`.
   - Select the target plan (e.g. *Growth Business*).
   - Toggle between **"Immediate Switch (Prorated)"** and **"Switch on Next Renewal"**.
   - Notice the deterministic prorated difference displayed based on remaining days.
   - Click **"Confirm & Apply Plan Switch"** to execute.
   - Click the eye icon on the subscription to view the updated details and the entry in the **Change Audit Log**.

3. **Billing Assistant Chatbot**:
   - Navigate to the **Billing Assistant** tab.
   - Click the chip: *"Why is my invoice higher this month?"* or *"When is my next renewal?"*.
   - Ask: *"How much do I owe?"* to see line item breakdowns and click the action button to settle.

4. **Recurring Billing & Invoicing**:
   - Switch to **Admin** using the top demo bar.
   - Click **"Run Recurring Billing Engine"** in the Dashboard or Invoices tab.
   - Verify newly generated invoices and preview or print them using the **Printer** button.

---

## 📁 Repository Structure

```
subscription-management/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                 # MongoDB connection & embedded server fallback
│   │   ├── middleware/
│   │   │   └── auth.js               # JWT verification & RBAC checkRole
│   │   ├── models/                   # 14 Mongoose Schema Models
│   │   │   ├── User.js
│   │   │   ├── Customer.js
│   │   │   ├── Product.js
│   │   │   ├── SubscriptionPlan.js
│   │   │   ├── Tax.js
│   │   │   ├── Discount.js
│   │   │   ├── QuotationTemplate.js
│   │   │   ├── Quotation.js
│   │   │   ├── Subscription.js
│   │   │   ├── Invoice.js
│   │   │   ├── Payment.js
│   │   │   ├── SubscriptionChangeHistory.js
│   │   │   └── ChatConversation.js
│   │   ├── routes/                   # RESTful API route controllers
│   │   │   ├── auth.js
│   │   │   ├── users.js
│   │   │   ├── customers.js
│   │   │   ├── products.js
│   │   │   ├── plans.js              # Compare, recommend & savings calculation
│   │   │   ├── quotationTemplates.js
│   │   │   ├── quotations.js
│   │   │   ├── subscriptions.js      # Lifecycle & Smart Plan Switching
│   │   │   ├── invoices.js
│   │   │   ├── billing.js            # Automated recurring billing engine
│   │   │   ├── payments.js           # Multi-method simulated payments
│   │   │   ├── taxes.js
│   │   │   ├── discounts.js
│   │   │   ├── assistant.js          # Billing Assistant Chatbot engine
│   │   │   └── analytics.js          # Admin, Staff, Customer dashboards
│   │   ├── utils/
│   │   │   └── numberGenerator.js
│   │   ├── seed.js                   # Realistic database seeder
│   │   └── server.js                 # Express server & API root
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/common/
│   │   │   ├── Badge.jsx             # Status badge pills
│   │   │   ├── Modal.jsx             # Accessible modal dialog
│   │   │   ├── Navbar.jsx            # Top bar with 1-click demo switcher
│   │   │   └── Sidebar.jsx           # Role-tailored navigation
│   │   ├── context/
│   │   │   └── AuthContext.jsx       # Global auth and user session state
│   │   ├── pages/
│   │   │   ├── AuthPages.jsx         # Sign in & customer registration
│   │   │   ├── DashboardPage.jsx     # Role-specific analytics & charts
│   │   │   ├── CustomersPage.jsx     # Customer profiles
│   │   │   ├── ProductsPage.jsx      # Product catalog & variants
│   │   │   ├── PlansPage.jsx         # Plan management & pricing
│   │   │   ├── ComparePlansPage.jsx  # Matrix, Best Plan finder, Savings calculator
│   │   │   ├── QuotationsPage.jsx    # Quotations & subscription conversion
│   │   │   ├── SubscriptionsPage.jsx # Lifecycle & Smart Plan Switching modal
│   │   │   ├── InvoicesPage.jsx      # Invoicing, Run Billing, Printable view
│   │   │   ├── PaymentsPage.jsx      # Payment ledger & receipts
│   │   │   ├── TaxesDiscountsPage.jsx# Taxes, promotional discounts & validator
│   │   │   ├── ReportsPage.jsx       # Recharts analytics
│   │   │   ├── BillingAssistantPage.jsx # AI Billing Chatbot
│   │   │   └── SettingsPage.jsx      # Settings, staff creation & demo reset
│   │   ├── services/
│   │   │   └── api.js                # API client with token injection
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
│
├── start.bat                         # Quick launcher for Windows
├── package.json
└── README.md
```

---

## 🛡️ License
Built for the Hackathon Prototype Demonstration. Free for evaluation and testing.
