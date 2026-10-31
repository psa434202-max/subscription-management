import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Badge } from '../components/common/Badge';
import {
  Users,
  Repeat,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Calendar,
  Sparkles,
  ArrowRight,
  Bot,
  Play,
  CheckCircle2,
  Receipt,
  Layers,
  Clock
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export const DashboardPage = ({ setActiveTab, onOpenSwitchPlan, onOpenPayInvoice }) => {
  const { role, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [runningBilling, setRunningBilling] = useState(false);
  const [billingResult, setBillingResult] = useState(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const endpoint = role === 'admin' ? '/analytics/admin' : (role === 'staff' ? '/analytics/staff' : '/analytics/customer');
      const res = await api.get(endpoint);
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [role]);

  const handleRunBilling = async () => {
    try {
      setRunningBilling(true);
      setBillingResult(null);
      const res = await api.post('/billing/run');
      setBillingResult(res);
      await fetchDashboard();
    } catch (err) {
      alert('Billing run failed: ' + err.message);
    } finally {
      setRunningBilling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500">Loading your subscription dashboard...</p>
        </div>
      </div>
    );
  }

  // ---------------- ADMIN DASHBOARD ----------------
  if (role === 'admin') {
    const stats = data?.stats || {};
    const charts = data?.charts || {};

    return (
      <div className="space-y-6">
        {/* Welcome banner + Quick action */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-brand-900 via-indigo-900 to-slate-900 text-white p-6 rounded-2xl shadow-xl">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-500/30 text-brand-200 border border-brand-400/20">
                System Overview
              </span>
              <span className="text-xs text-slate-300">Updated Real-Time</span>
            </div>
            <h1 className="text-2xl font-black mt-1">Welcome back, {user?.name}</h1>
            <p className="text-sm text-slate-300 max-w-xl mt-1">
              Brightloop has recorded ₹{stats.mrr?.toLocaleString()} in Monthly Recurring Revenue with {stats.activeSubscriptionsCount} active subscriptions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleRunBilling}
              disabled={runningBilling}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/25 transition-all transform hover:-translate-y-0.5"
            >
              <Play className={`w-4 h-4 ${runningBilling ? 'animate-spin' : ''}`} />
              <span>{runningBilling ? 'Running Billing Engine...' : 'Run Recurring Billing'}</span>
            </button>
            <button
              onClick={() => setActiveTab('plans')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm transition-all"
            >
              <Layers className="w-4 h-4" />
              <span>Manage Plans</span>
            </button>
          </div>
        </div>

        {/* Billing Run Notification Banner if just triggered */}
        {billingResult && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold">{billingResult.message}</span>
              <p className="text-emerald-700 mt-0.5">
                Processed {billingResult.processedCount} due subscriptions. Generated {billingResult.generatedInvoicesCount} new invoices.
              </p>
            </div>
          </div>
        )}

        {/* 6 Key Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">MRR</span>
            <div className="text-xl font-extrabold text-slate-900 mt-1">₹{stats.mrr?.toLocaleString()}</div>
            <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-0.5 mt-1">
              <TrendingUp className="w-3 h-3" /> Monthly Recurring
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">ARR</span>
            <div className="text-xl font-extrabold text-slate-900 mt-1">₹{stats.arr?.toLocaleString()}</div>
            <span className="text-[11px] text-indigo-600 font-semibold flex items-center gap-0.5 mt-1">
              Annual Run Rate
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Revenue Collected</span>
            <div className="text-xl font-extrabold text-emerald-600 mt-1">₹{stats.totalRevenueCollected?.toLocaleString()}</div>
            <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-0.5 mt-1">
              Total Settled
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Outstanding</span>
            <div className="text-xl font-extrabold text-amber-600 mt-1">₹{stats.outstandingAmount?.toLocaleString()}</div>
            <span className="text-[11px] text-amber-700 font-semibold flex items-center gap-0.5 mt-1">
              Pending Invoices
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Active Subs</span>
            <div className="text-xl font-extrabold text-brand-600 mt-1">{stats.activeSubscriptionsCount}</div>
            <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-0.5 mt-1">
              Of {stats.totalSubscriptionsCount} Total
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Customers</span>
            <div className="text-xl font-extrabold text-slate-900 mt-1">{stats.totalCustomers}</div>
            <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-0.5 mt-1">
              Registered Accounts
            </span>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Trend Area Chart */}
          <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Revenue Growth Trend</h3>
                <p className="text-xs text-slate-500">Monthly revenue collection projection</p>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                Last 6 Months
              </span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts.revenueChartData || []}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Revenue']} />
                  <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Subscription Status Breakdown Pie */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-900">Subscription Status</h3>
              <p className="text-xs text-slate-500">Lifecycle distribution</p>
            </div>
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.statusChartData || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {(charts.statusChartData || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Bottom Split: Upcoming Renewals + Recent Invoices */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Renewals */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-500" />
                Upcoming Renewals (Next 14 Days)
              </h3>
              <button onClick={() => setActiveTab('subscriptions')} className="text-xs text-brand-600 font-semibold hover:underline">
                View All
              </button>
            </div>

            <div className="space-y-3">
              {(data?.upcomingRenewals || []).length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">No subscriptions renewing in the next 14 days.</p>
              ) : (
                data.upcomingRenewals.map(sub => (
                  <div key={sub._id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div>
                      <div className="text-xs font-bold text-slate-800">{sub.plan?.name || 'Custom Plan'}</div>
                      <div className="text-[11px] text-slate-500">{sub.subscriptionNumber} • Renews {new Date(sub.currentPeriodEnd).toLocaleDateString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-900">₹{sub.totalAmount}</div>
                      <Badge status={sub.status} size="xs" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Invoices */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-brand-500" />
                Recent Invoices
              </h3>
              <button onClick={() => setActiveTab('invoices')} className="text-xs text-brand-600 font-semibold hover:underline">
                View All
              </button>
            </div>

            <div className="space-y-3">
              {(data?.recentInvoices || []).map(inv => (
                <div key={inv._id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div>
                    <div className="text-xs font-bold text-slate-800">Invoice #{inv.invoiceNumber}</div>
                    <div className="text-[11px] text-slate-500">{new Date(inv.issueDate).toLocaleDateString()} • Due: {new Date(inv.dueDate).toLocaleDateString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-900">₹{inv.totalAmount}</div>
                    <Badge status={inv.status} size="xs" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------------- STAFF DASHBOARD ----------------
  if (role === 'staff') {
    const stats = data?.stats || {};
    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Staff Operations Hub</h1>
            <p className="text-sm text-slate-500 mt-1">
              Track customer accounts, pending quotations, and unpaid invoices.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('quotations')}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-500/20"
          >
            Create Quotation
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <span className="text-xs font-bold text-slate-400 uppercase">Customers</span>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">{stats.customersCount}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <span className="text-xs font-bold text-slate-400 uppercase">Active Subscriptions</span>
            <div className="text-2xl font-extrabold text-brand-600 mt-1">{stats.activeSubscriptionsCount}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <span className="text-xs font-bold text-slate-400 uppercase">Pending Quotes</span>
            <div className="text-2xl font-extrabold text-purple-600 mt-1">{stats.pendingQuotesCount}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <span className="text-xs font-bold text-slate-400 uppercase">Unpaid Invoices</span>
            <div className="text-2xl font-extrabold text-amber-600 mt-1">{stats.unpaidInvoicesCount}</div>
          </div>
        </div>

        {/* Pending Quotes & Unpaid Invoices */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Pending Quotations Requiring Follow-up</h3>
            <div className="space-y-2">
              {(data?.pendingQuotes || []).length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No pending quotations.</p>
              ) : (
                data.pendingQuotes.map(q => (
                  <div key={q._id} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900">{q.quotationNumber}</span>
                      <p className="text-slate-500 text-[11px]">{q.customer?.name} ({q.customer?.companyName})</p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">₹{q.totalAmount}</div>
                      <Badge status={q.status} size="xs" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Unpaid Invoices</h3>
            <div className="space-y-2">
              {(data?.unpaidInvoices || []).length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No outstanding unpaid invoices.</p>
              ) : (
                data.unpaidInvoices.map(inv => (
                  <div key={inv._id} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900">Invoice #{inv.invoiceNumber}</span>
                      <p className="text-slate-500 text-[11px]">Due on {new Date(inv.dueDate).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-rose-600">Due: ₹{inv.outstandingBalance}</div>
                      <Badge status={inv.status} size="xs" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------------- CUSTOMER DASHBOARD ----------------
  const custStats = data?.stats || {};
  const activeSubs = data?.activeSubscriptions || [];
  const recentInvoices = data?.recentInvoices || [];
  const primarySub = activeSubs[0];

  return (
    <div className="space-y-6">
      {/* Customer Header Banner */}
      <div className="bg-gradient-to-r from-brand-700 via-indigo-700 to-purple-800 text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/20">
            Customer Portal
          </span>
          <h1 className="text-2xl font-black mt-2">Welcome back, {user?.name}!</h1>
          <p className="text-xs text-indigo-100 mt-1">
            Organization: <strong>{data?.customer?.companyName || user?.name}</strong> • Customer ID: {data?.customer?._id?.slice(-6)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setActiveTab('assistant')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-white text-brand-900 shadow-md hover:bg-slate-50 transition-all"
          >
            <Bot className="w-4 h-4 text-brand-600" />
            <span>Ask Billing Assistant</span>
          </button>
          <button
            onClick={() => setActiveTab('compare-plans')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Compare Plans & Savings</span>
          </button>
        </div>
      </div>

      {/* Customer Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Active Subscriptions</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{custStats.activeCount || 0}</div>
          <span className="text-xs text-emerald-600 font-semibold mt-1 block">Live Services</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Upcoming Renewals</span>
          <div className="text-2xl font-black text-indigo-600 mt-1">{custStats.upcomingRenewalsCount || 0}</div>
          <span className="text-xs text-slate-500 font-semibold mt-1 block">Next 30 Days</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Outstanding Balance</span>
          <div className={`text-2xl font-black mt-1 ${custStats.outstandingBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            ₹{custStats.outstandingBalance?.toLocaleString() || 0}
          </div>
          <span className="text-xs text-slate-500 font-semibold mt-1 block">
            {custStats.outstandingBalance > 0 ? 'Payment Required' : 'All Settled 🎉'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Total Paid</span>
          <div className="text-2xl font-black text-slate-900 mt-1">₹{custStats.totalPaid?.toLocaleString() || 0}</div>
          <span className="text-xs text-slate-500 font-semibold mt-1 block">Lifetime Billing</span>
        </div>
      </div>

      {/* Primary Active Subscription Spotlight Card */}
      {primarySub ? (
        <div className="bg-white p-6 rounded-2xl border border-brand-200 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-50 rounded-bl-full -z-0 pointer-events-none opacity-60" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-2">
                <Badge status={primarySub.status} />
                <span className="text-xs text-slate-400 font-mono font-medium">{primarySub.subscriptionNumber}</span>
              </div>
              <h2 className="text-xl font-black text-slate-900 mt-2">
                {primarySub.plan?.name}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Billed {primarySub.billingFrequency} at <strong>₹{primarySub.totalAmount}</strong> (includes taxes).
              </p>

              <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-brand-500" />
                  <span>Current Period: <strong>{new Date(primarySub.currentPeriodStart).toLocaleDateString()} – {new Date(primarySub.currentPeriodEnd).toLocaleDateString()}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-indigo-500" />
                  <span>Next Renewal: <strong>{new Date(primarySub.currentPeriodEnd).toLocaleDateString()}</strong></span>
                </div>
              </div>
            </div>

            {/* Smart Plan Switch CTA */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                onClick={() => onOpenSwitchPlan(primarySub)}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-500/25 transition-all transform hover:-translate-y-0.5"
              >
                <Repeat className="w-4 h-4" />
                <span>Change / Upgrade Plan</span>
              </button>
              <button
                onClick={() => setActiveTab('subscriptions')}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
              >
                <span>View Details</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-2xl border border-dashed border-slate-300 text-center">
          <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No active subscription</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
            You don't have an active subscription yet. Explore our packages and start a subscription today!
          </p>
          <button
            onClick={() => setActiveTab('compare-plans')}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-brand-600 text-white shadow-md hover:bg-brand-500"
          >
            Explore Plans Catalog
          </button>
        </div>
      )}

      {/* Recent Invoices & Assistant Quick Launcher */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Invoices */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Your Recent Invoices</h3>
            <button onClick={() => setActiveTab('invoices')} className="text-xs text-brand-600 font-semibold hover:underline">
              View All Invoices
            </button>
          </div>

          <div className="space-y-3">
            {recentInvoices.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No invoices generated yet.</p>
            ) : (
              recentInvoices.map(inv => (
                <div key={inv._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100 gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">Invoice #{inv.invoiceNumber}</span>
                      <Badge status={inv.status} size="xs" />
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Issued: {new Date(inv.issueDate).toLocaleDateString()} • Due: {new Date(inv.dueDate).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    <div className="text-right">
                      <div className="text-xs font-black text-slate-900">₹{inv.totalAmount}</div>
                      {inv.outstandingBalance > 0 && (
                        <span className="text-[10px] text-rose-600 font-bold block">Balance: ₹{inv.outstandingBalance}</span>
                      )}
                    </div>
                    {inv.outstandingBalance > 0 && (
                      <button
                        onClick={() => onOpenPayInvoice(inv)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
                      >
                        Pay Now
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Billing Assistant Card */}
        <div className="bg-gradient-to-br from-indigo-900 via-brand-900 to-slate-900 text-white p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-brand-500/30 border border-brand-400/30 flex items-center justify-center text-brand-300 mb-3">
              <Bot className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold">Have billing questions?</h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Ask Brightloop Billing Assistant about charges, next renewals, savings, and plan comparisons using your real account data.
            </p>

            <div className="space-y-2 mt-4">
              <button
                onClick={() => setActiveTab('assistant')}
                className="w-full text-left text-xs bg-white/10 hover:bg-white/20 p-2.5 rounded-lg border border-white/10 transition-colors flex items-center justify-between"
              >
                <span>"Why is my invoice higher this month?"</span>
                <ArrowRight className="w-3.5 h-3.5 text-brand-300" />
              </button>
              <button
                onClick={() => setActiveTab('assistant')}
                className="w-full text-left text-xs bg-white/10 hover:bg-white/20 p-2.5 rounded-lg border border-white/10 transition-colors flex items-center justify-between"
              >
                <span>"Can I switch to a cheaper plan?"</span>
                <ArrowRight className="w-3.5 h-3.5 text-brand-300" />
              </button>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('assistant')}
            className="w-full mt-6 py-2.5 rounded-xl text-xs font-bold bg-white text-slate-900 hover:bg-slate-100 transition-colors text-center"
          >
            Open Assistant Chat
          </button>
        </div>
      </div>
    </div>
  );
};

