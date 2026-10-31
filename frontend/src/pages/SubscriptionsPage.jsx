import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import {
  Repeat,
  Play,
  Pause,
  RotateCcw,
  XCircle,
  CheckCircle,
  Plus,
  Search,
  Filter,
  Eye,
  Calendar,
  DollarSign,
  History,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Receipt
} from 'lucide-react';

export const SubscriptionsPage = ({ switchTargetSub, clearSwitchTarget }) => {
  const { role, user } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [plans, setPlans] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Modals state
  const [selectedSub, setSelectedSub] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [subDetails, setSubDetails] = useState(null);

  // Smart Plan Switch Modal
  const [switchModalOpen, setSwitchModalOpen] = useState(false);
  const [switchingSub, setSwitchingSub] = useState(null);
  const [targetPlanId, setTargetPlanId] = useState('');
  const [switchTiming, setSwitchTiming] = useState('immediate');
  const [switchReason, setSwitchReason] = useState('');
  const [switchPreview, setSwitchPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [submittingSwitch, setSubmittingSwitch] = useState(false);

  // New Subscription Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newSubCustomer, setNewSubCustomer] = useState('');
  const [newSubPlan, setNewSubPlan] = useState('');
  const [newSubFrequency, setNewSubFrequency] = useState('monthly');
  const [newSubDiscountCode, setNewSubDiscountCode] = useState('');

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      const res = await api.get('/subscriptions', params);
      if (res.success) {
        setSubscriptions(res.subscriptions);
      }
    } catch (err) {
      console.error('Failed to fetch subscriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuxiliary = async () => {
    try {
      const [plansRes, custRes] = await Promise.all([
        api.get('/plans'),
        role !== 'customer' ? api.get('/customers') : Promise.resolve({ customers: [] })
      ]);
      if (plansRes.success) setPlans(plansRes.plans);
      if (custRes.success) setCustomers(custRes.customers);
    } catch (e) {
      console.error('Failed to load auxiliary data', e);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
    fetchAuxiliary();
  }, [statusFilter]);

  // Handle external trigger to open switch modal (e.g. from Dashboard)
  useEffect(() => {
    if (switchTargetSub) {
      openSwitchModal(switchTargetSub);
      clearSwitchTarget();
    }
  }, [switchTargetSub]);

  // Lifecycle status actions (Confirm, Activate, Pause, Resume, Close, Renew)
  const handleStatusAction = async (subId, action, reason = '') => {
    try {
      const res = await api.patch(`/subscriptions/${subId}/status`, { action, reason });
      if (res.success) {
        fetchSubscriptions();
        if (selectedSub && selectedSub._id === subId) {
          viewDetails(subId);
        }
      }
    } catch (err) {
      alert('Status change error: ' + err.message);
    }
  };

  // View Subscription Details
  const viewDetails = async (subId) => {
    try {
      const res = await api.get(`/subscriptions/${subId}`);
      if (res.success) {
        setSubDetails(res);
        setDetailsModalOpen(true);
      }
    } catch (err) {
      alert('Failed to load details: ' + err.message);
    }
  };

  // Open Smart Plan Switch Modal
  const openSwitchModal = (sub) => {
    setSwitchingSub(sub);
    setSwitchTiming('immediate');
    setSwitchReason('');
    setSwitchPreview(null);

    // Pick first different plan as default target
    const differentPlans = plans.filter(p => p._id !== sub.plan?._id && p.isActive);
    if (differentPlans.length > 0) {
      const defaultTarget = differentPlans[0]._id;
      setTargetPlanId(defaultTarget);
      fetchSwitchPreview(sub._id, defaultTarget, 'immediate');
    }
    setSwitchModalOpen(true);
  };

  // Calculate Switch Preview
  const fetchSwitchPreview = async (subId, planId, timing) => {
    if (!subId || !planId) return;
    try {
      setPreviewLoading(true);
      const res = await api.get(`/subscriptions/${subId}/switch-preview`, {
        targetPlanId: planId,
        switchTiming: timing
      });
      if (res.success) {
        setSwitchPreview(res.preview);
      }
    } catch (err) {
      console.error('Switch preview error:', err);
      setSwitchPreview(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleTargetPlanChange = (newTargetPlanId) => {
    setTargetPlanId(newTargetPlanId);
    if (switchingSub) {
      fetchSwitchPreview(switchingSub._id, newTargetPlanId, switchTiming);
    }
  };

  const handleSwitchTimingChange = (newTiming) => {
    setSwitchTiming(newTiming);
    if (switchingSub && targetPlanId) {
      fetchSwitchPreview(switchingSub._id, targetPlanId, newTiming);
    }
  };

  // Confirm and Execute Smart Plan Switch
  const handleExecuteSwitch = async () => {
    if (!targetPlanId) {
      alert('Please select a target plan');
      return;
    }
    try {
      setSubmittingSwitch(true);
      const res = await api.post(`/subscriptions/${switchingSub._id}/switch-plan`, {
        targetPlanId,
        switchTiming,
        reason: switchReason || 'Self-service customer plan switch'
      });
      if (res.success) {
        alert(res.message);
        setSwitchModalOpen(false);
        fetchSubscriptions();
        if (detailsModalOpen) viewDetails(switchingSub._id);
      }
    } catch (err) {
      alert('Plan switch failed: ' + err.message);
    } finally {
      setSubmittingSwitch(false);
    }
  };

  // Create Subscription
  const handleCreateSubscription = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/subscriptions', {
        customerId: newSubCustomer || undefined,
        planId: newSubPlan,
        billingFrequency: newSubFrequency,
        discountCode: newSubDiscountCode || undefined,
        status: role === 'customer' ? 'confirmed' : 'confirmed'
      });
      if (res.success) {
        setCreateModalOpen(false);
        fetchSubscriptions();
      }
    } catch (err) {
      alert('Create subscription failed: ' + err.message);
    }
  };

  const filteredSubs = subscriptions.filter(sub => {
    const matchSearch =
      sub.subscriptionNumber.toLowerCase().includes(search.toLowerCase()) ||
      (sub.customer?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (sub.plan?.name || '').toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Repeat className="w-6 h-6 text-brand-600" />
            Subscription Lifecycle Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage lifecycle progression (Draft → Quotation → Confirmed → Active → Closed) and self-service plan switching with prorated billing calculations.
          </p>
        </div>

        <button
          onClick={() => {
            if (plans.length > 0) setNewSubPlan(plans[0]._id);
            if (customers.length > 0) setNewSubCustomer(customers[0]._id);
            setCreateModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-500/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Subscription</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search subscriptions, customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        {/* Status Pills Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {['all', 'active', 'confirmed', 'draft', 'paused', 'closed'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-all ${
                statusFilter === st
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="p-4">Subscription</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Plan & Tier</th>
                <th className="p-4">Billing Cycle</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400">Loading subscriptions...</td>
                </tr>
              ) : filteredSubs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400">No subscriptions found.</td>
                </tr>
              ) : (
                filteredSubs.map(sub => (
                  <tr key={sub._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-4 font-mono font-bold text-slate-900">
                      {sub.subscriptionNumber}
                      {sub.scheduledPlanChange?.targetPlan && (
                        <span className="block text-[10px] text-amber-600 font-sans font-semibold mt-0.5">
                          ⏳ Switch to {sub.scheduledPlanChange.targetPlan.name} at renewal
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-800">{sub.customer?.name}</div>
                      <div className="text-[11px] text-slate-400">{sub.customer?.companyName || sub.customer?.email}</div>
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-100">
                        {sub.plan?.name || 'Custom Plan'}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600">
                      <span className="capitalize font-semibold">{sub.billingFrequency}</span>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Renews {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="p-4 font-black text-slate-900">
                      ₹{sub.totalAmount}
                      <span className="text-[10px] text-slate-400 block font-normal">incl. ₹{sub.taxTotal} GST</span>
                    </td>
                    <td className="p-4">
                      <Badge status={sub.status} />
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Change Plan Button */}
                        {['active', 'confirmed'].includes(sub.status) && (
                          <button
                            onClick={() => openSwitchModal(sub)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-brand-50 text-brand-700 hover:bg-brand-100 border border-brand-200 transition-colors flex items-center gap-1"
                            title="Change Plan (Upgrade/Downgrade)"
                          >
                            <Repeat className="w-3.5 h-3.5" />
                            <span>Change Plan</span>
                          </button>
                        )}

                        {/* Lifecycle actions */}
                        {sub.status === 'draft' && role !== 'customer' && (
                          <button
                            onClick={() => handleStatusAction(sub._id, 'confirm')}
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50"
                            title="Confirm Subscription"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}

                        {sub.status === 'confirmed' && role !== 'customer' && (
                          <button
                            onClick={() => handleStatusAction(sub._id, 'activate')}
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50"
                            title="Activate Subscription"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                        )}

                        {sub.status === 'active' && sub.plan?.allowPause && (
                          <button
                            onClick={() => handleStatusAction(sub._id, 'pause')}
                            className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50"
                            title="Pause Subscription"
                          >
                            <Pause className="w-4 h-4" />
                          </button>
                        )}

                        {sub.status === 'paused' && (
                          <button
                            onClick={() => handleStatusAction(sub._id, 'resume')}
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50"
                            title="Resume Subscription"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                        )}

                        {/* View Details */}
                        <button
                          onClick={() => viewDetails(sub._id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100"
                          title="View Subscription Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= SMART PLAN SWITCHING MODAL ================= */}
      <Modal
        isOpen={switchModalOpen}
        onClose={() => setSwitchModalOpen(false)}
        title="Smart Plan Switching"
        subtitle={`Self-service plan change for subscription ${switchingSub?.subscriptionNumber}`}
        maxWidth="max-w-3xl"
      >
        <div className="space-y-6">
          {/* Step 1: Select Target Plan */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
              1. Select New Target Plan:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {plans
                .filter(p => p.isActive && p._id !== switchingSub?.plan?._id)
                .map(plan => {
                  const isSelected = plan._id === targetPlanId;
                  const isUpgrade = plan.price > (switchingSub?.plan?.price || 0);
                  return (
                    <div
                      key={plan._id}
                      onClick={() => handleTargetPlanChange(plan._id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-brand-600 bg-brand-50/50 ring-2 ring-brand-500/20 shadow-md'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{plan.name}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isUpgrade ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                          {isUpgrade ? 'Upgrade' : 'Downgrade'}
                        </span>
                      </div>
                      <div className="text-lg font-black text-brand-600 mt-2">
                        ₹{plan.price}
                        <span className="text-[10px] text-slate-400 font-normal">/{plan.billingFrequency}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-2 line-clamp-2">
                        {plan.features?.slice(0, 2).join(' • ')}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Step 2: Switch Timing (Immediate vs Next Renewal) */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
              2. Choose Switch Timing:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`p-4 rounded-2xl border cursor-pointer flex items-start gap-3 transition-all ${
                  switchTiming === 'immediate'
                    ? 'border-brand-600 bg-brand-50/40 ring-1 ring-brand-500/20'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="timing"
                  value="immediate"
                  checked={switchTiming === 'immediate'}
                  onChange={() => handleSwitchTimingChange('immediate')}
                  className="mt-1 text-brand-600 focus:ring-brand-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Immediate Switch (Prorated)</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Switch plan today. Prorated charges or credits will be calculated for remaining cycle days.
                  </p>
                </div>
              </label>

              <label
                className={`p-4 rounded-2xl border cursor-pointer flex items-start gap-3 transition-all ${
                  switchTiming === 'next_renewal'
                    ? 'border-brand-600 bg-brand-50/40 ring-1 ring-brand-500/20'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="timing"
                  value="next_renewal"
                  checked={switchTiming === 'next_renewal'}
                  onChange={() => handleSwitchTimingChange('next_renewal')}
                  className="mt-1 text-brand-600 focus:ring-brand-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Switch on Next Renewal</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Keep current plan until renewal date. No additional charges today; next invoice will use new plan.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Step 3: Real-Time Prorated Calculation Preview */}
          {previewLoading ? (
            <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl">
              Calculating deterministic prorated billing difference...
            </div>
          ) : switchPreview ? (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white shadow-inner">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-300">
                  Billing Impact & Proration Breakdown
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 font-mono">
                  {switchPreview.cycleInfo.remainingDaysInCycle} of {switchPreview.cycleInfo.totalDaysInCycle} days remaining
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Current Plan</span>
                  <span className="text-sm font-bold">{switchPreview.currentPlan.name}</span>
                  <span className="text-[11px] text-slate-300 block">₹{switchPreview.financials.currentCyclePrice}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">New Target Plan</span>
                  <span className="text-sm font-bold text-emerald-400">{switchPreview.targetPlan.name}</span>
                  <span className="text-[11px] text-slate-300 block">₹{switchPreview.financials.newCyclePrice}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Switch Mode</span>
                  <span className="text-sm font-bold capitalize">{switchPreview.switchTiming.replace('_', ' ')}</span>
                  <span className="text-[11px] text-slate-300 block">{switchPreview.changeType}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Prorated Charge Due</span>
                  <span className={`text-base font-black ${switchPreview.financials.proratedAmount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {switchPreview.financials.proratedAmount > 0
                      ? `+₹${switchPreview.financials.proratedAmount}`
                      : switchPreview.financials.proratedCredit > 0
                      ? `-₹${switchPreview.financials.proratedCredit} (Credit)`
                      : '₹0'}
                  </span>
                </div>
              </div>

              <div className="mt-4 p-3 rounded-xl bg-white/10 text-xs text-slate-200 border border-white/10 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                <span>{switchPreview.financials.summaryText}</span>
              </div>
            </div>
          ) : null}

          {/* Confirm Switch Action */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={() => setSwitchModalOpen(false)}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              onClick={handleExecuteSwitch}
              disabled={submittingSwitch || !targetPlanId}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-500/25 transition-all"
            >
              {submittingSwitch ? 'Processing Switch...' : 'Confirm & Apply Plan Switch'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ================= SUBSCRIPTION DETAILS & AUDIT MODAL ================= */}
      <Modal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        title={`Subscription Details: ${subDetails?.subscription?.subscriptionNumber}`}
        subtitle={`Customer: ${subDetails?.subscription?.customer?.name} (${subDetails?.subscription?.customer?.companyName})`}
        maxWidth="max-w-4xl"
      >
        {subDetails && (
          <div className="space-y-6">
            {/* Overview Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Plan</span>
                <div className="text-sm font-black text-slate-900">{subDetails.subscription.plan?.name}</div>
                <div className="text-[11px] text-slate-500">₹{subDetails.subscription.totalAmount}/{subDetails.subscription.billingFrequency}</div>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Status</span>
                <div className="mt-1"><Badge status={subDetails.subscription.status} /></div>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Current Period</span>
                <div className="text-xs font-bold text-slate-800">
                  {new Date(subDetails.subscription.currentPeriodStart).toLocaleDateString()}
                </div>
                <div className="text-[11px] text-slate-500">to {new Date(subDetails.subscription.currentPeriodEnd).toLocaleDateString()}</div>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Payment Terms</span>
                <div className="text-xs font-bold text-slate-800">{subDetails.subscription.paymentTerms}</div>
                <div className="text-[11px] text-emerald-600">Auto-renewal: {subDetails.subscription.autoRenewal ? 'Yes' : 'No'}</div>
              </div>
            </div>

            {/* Line items table */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Entitled Line Items</h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                    <tr>
                      <th className="p-3">Product / Service</th>
                      <th className="p-3">Variant</th>
                      <th className="p-3">Qty</th>
                      <th className="p-3">Unit Price</th>
                      <th className="p-3 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(subDetails.subscription.items || []).map((it, i) => (
                      <tr key={i}>
                        <td className="p-3 font-medium text-slate-800">{it.description}</td>
                        <td className="p-3 text-slate-500">{it.variantName || '—'}</td>
                        <td className="p-3 font-semibold">{it.quantity}</td>
                        <td className="p-3">₹{it.unitPrice}</td>
                        <td className="p-3 font-bold text-slate-900 text-right">₹{it.lineTotal}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Change History Audit Log (Smart Plan Switching history) */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <History className="w-4 h-4 text-brand-600" />
                Subscription Plan Change Audit Log
              </h4>

              {(subDetails.changeHistory || []).length === 0 ? (
                <p className="text-xs text-slate-400 py-3 bg-slate-50 rounded-xl text-center">
                  No historical plan switches recorded for this subscription yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {subDetails.changeHistory.map(hist => (
                    <div key={hist._id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">
                            {hist.previousPlan?.name} → <span className="text-brand-600">{hist.newPlan?.name}</span>
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-200 text-slate-700">
                            {hist.changeType} ({hist.switchTiming})
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Effective: {new Date(hist.effectiveDate).toLocaleDateString()} • By: {hist.changedBy?.name || 'Customer'} • Reason: {hist.reason || 'Self-service switch'}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-slate-900">
                          {hist.proratedAmount > 0 ? `+₹${hist.proratedAmount} charge` : (hist.proratedCredit > 0 ? `-₹${hist.proratedCredit} credit` : '₹0 adjustment')}
                        </span>
                        <span className="block text-[10px] text-slate-400">{hist.remainingDays} days prorated</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Associated Invoices */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-brand-600" />
                Generated Billing Invoices
              </h4>
              <div className="space-y-2">
                {(subDetails.invoices || []).map(inv => (
                  <div key={inv._id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-800">Invoice #{inv.invoiceNumber}</span>
                      <span className="text-slate-400 text-[11px] ml-2">Period: {new Date(inv.billingPeriodStart).toLocaleDateString()} to {new Date(inv.billingPeriodEnd).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold">₹{inv.totalAmount}</span>
                      <Badge status={inv.status} size="xs" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ================= CREATE SUBSCRIPTION MODAL ================= */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create Subscription"
        subtitle="Provision a new subscription for customer"
      >
        <form onSubmit={handleCreateSubscription} className="space-y-4">
          {role !== 'customer' && (
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Customer</label>
              <select
                value={newSubCustomer}
                onChange={(e) => setNewSubCustomer(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                required
              >
                <option value="">Select customer...</option>
                {customers.map(c => (
                  <option key={c._id} value={c._id}>{c.name} ({c.companyName})</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Plan</label>
            <select
              value={newSubPlan}
              onChange={(e) => setNewSubPlan(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50"
              required
            >
              <option value="">Select plan...</option>
              {plans.map(p => (
                <option key={p._id} value={p._id}>{p.name} (₹{p.price}/{p.billingFrequency})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Billing Frequency</label>
            <select
              value={newSubFrequency}
              onChange={(e) => setNewSubFrequency(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Coupon / Discount Code (Optional)</label>
            <input
              type="text"
              placeholder="e.g. WELCOME20"
              value={newSubDiscountCode}
              onChange={(e) => setNewSubDiscountCode(e.target.value.toUpperCase())}
              className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold bg-brand-600 text-white rounded-xl shadow-md hover:bg-brand-500"
            >
              Create Subscription
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

