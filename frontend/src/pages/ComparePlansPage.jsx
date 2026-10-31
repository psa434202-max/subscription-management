import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Badge } from '../components/common/Badge';
import {
  Check,
  X,
  Sparkles,
  Calculator,
  SlidersHorizontal,
  ArrowRight,
  HelpCircle,
  TrendingDown,
  Layers,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const ComparePlansPage = ({ onSelectPlan }) => {
  const [plans, setPlans] = useState([]);
  const [selectedPlanIds, setSelectedPlanIds] = useState([]);
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [frequencyFilter, setFrequencyFilter] = useState('all');
  const [maxPriceFilter, setMaxPriceFilter] = useState(10000);

  // Smart Plan Recommendation tool state
  const [recBudget, setRecBudget] = useState(4000);
  const [recFrequency, setRecFrequency] = useState('monthly');
  const [recQuantity, setRecQuantity] = useState(1);
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [recommendations, setRecommendations] = useState(null);
  const [recLoading, setRecLoading] = useState(false);

  // Savings Calculator state
  const [calcCurrentPlanId, setCalcCurrentPlanId] = useState('');
  const [calcAltPlanId, setCalcAltPlanId] = useState('');
  const [calcQuantity, setCalcQuantity] = useState(1);
  const [savingsResult, setSavingsResult] = useState(null);
  const [calcLoading, setCalcLoading] = useState(false);

  // Load plans
  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await api.get('/plans');
      if (res.success && res.plans) {
        setPlans(res.plans);
        // Default select first 3 plans
        const defaultIds = res.plans.slice(0, 3).map(p => p._id);
        setSelectedPlanIds(defaultIds);
        if (defaultIds.length > 0) {
          fetchComparison(defaultIds);
          setCalcCurrentPlanId(defaultIds[0]);
          if (defaultIds.length > 1) setCalcAltPlanId(defaultIds[1]);
        }
      }
    } catch (err) {
      console.error('Failed to load plans:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchComparison = async (ids) => {
    if (ids.length === 0) {
      setComparisonData(null);
      return;
    }
    try {
      const res = await api.get('/plans/compare', { ids: ids.join(',') });
      if (res.success) {
        setComparisonData(res);
      }
    } catch (err) {
      console.error('Failed to fetch plan comparison:', err);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleTogglePlan = (planId) => {
    let updated;
    if (selectedPlanIds.includes(planId)) {
      if (selectedPlanIds.length <= 1) {
        alert('Please select at least 1 plan to compare.');
        return;
      }
      updated = selectedPlanIds.filter(id => id !== planId);
    } else {
      if (selectedPlanIds.length >= 4) {
        alert('You can compare a maximum of 4 plans side by side.');
        return;
      }
      updated = [...selectedPlanIds, planId];
    }
    setSelectedPlanIds(updated);
    fetchComparison(updated);
  };

  const handleGetRecommendation = async (e) => {
    if (e) e.preventDefault();
    try {
      setRecLoading(true);
      const res = await api.post('/plans/recommend', {
        budget: recBudget,
        requiredFeatures: selectedFeatures,
        billingFrequency: recFrequency,
        productQuantity: recQuantity
      });
      if (res.success) {
        setRecommendations(res.recommendations);
      }
    } catch (err) {
      alert('Recommendation error: ' + err.message);
    } finally {
      setRecLoading(false);
    }
  };

  const handleCalculateSavings = async () => {
    if (!calcCurrentPlanId || !calcAltPlanId) {
      alert('Please select both a current plan and an alternative plan.');
      return;
    }
    try {
      setCalcLoading(true);
      const res = await api.post('/plans/savings-calculator', {
        currentPlanId: calcCurrentPlanId,
        alternativePlanId: calcAltPlanId,
        quantity: calcQuantity
      });
      if (res.success) {
        setSavingsResult(res);
      }
    } catch (err) {
      alert('Savings calculator error: ' + err.message);
    } finally {
      setCalcLoading(false);
    }
  };

  const availableFeatures = [
    'Automated Recurring Invoices',
    'AI Revenue Forecasting',
    'Automated Plan Switching Engine',
    'Billing Assistant Integration',
    'Dedicated 24/7 SLA (15m response)',
    'Multi-currency Invoice Generation',
    'Custom Webhooks & Audit Logs'
  ];

  const toggleFeature = (feat) => {
    if (selectedFeatures.includes(feat)) {
      setSelectedFeatures(selectedFeatures.filter(f => f !== feat));
    } else {
      setSelectedFeatures([...selectedFeatures, feat]);
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-brand-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/20 text-brand-200 border border-brand-400/20 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Interactive Plan Comparison & Recommendation Suite</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight">Compare Brightloop Plans</h1>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            Evaluate plan features, calculate monthly and annual cost equivalents, use our deterministic recommendation engine to find your exact match, or run projected savings calculations.
          </p>
        </div>
      </div>

      {/* Plan Selection Chips */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Select Plans To Compare (Choose 1 to 4):
          </span>
          <div className="flex flex-wrap gap-2 mt-2">
            {plans.map(p => {
              const isSelected = selectedPlanIds.includes(p._id);
              return (
                <button
                  key={p._id}
                  onClick={() => handleTogglePlan(p._id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/25 ring-2 ring-brand-500/30'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {isSelected ? <Check className="w-3.5 h-3.5" /> : null}
                  <span>{p.name} (₹{p.price}/{p.billingFrequency})</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="text-xs text-slate-500 font-semibold self-end md:self-center">
          Comparing {selectedPlanIds.length} of 4 max
        </div>
      </div>

      {/* Side-by-Side Comparison Table */}
      {comparisonData && comparisonData.plans && comparisonData.plans.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-black text-slate-900">Side-by-Side Feature Matrix</h2>
            <p className="text-xs text-slate-500 mt-0.5">Direct comparison across pricing, frequencies, limits, and capabilities</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  <th className="p-5 text-xs font-bold uppercase text-slate-400 w-1/4">Plan Details</th>
                  {comparisonData.plans.map(p => (
                    <th key={p._id} className="p-5 text-left border-l border-slate-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-extrabold text-slate-900">{p.name}</span>
                        {p.code === 'PLAN-GROWTH' && (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 rounded-md">
                            Popular
                          </span>
                        )}
                      </div>
                      <div className="text-2xl font-black text-brand-600 mt-2">
                        ₹{p.price}
                        <span className="text-xs font-normal text-slate-400">/{p.billingFrequency}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        Monthly Eq: <strong>₹{Math.round(p.monthlyEquivalent)}/mo</strong>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {/* Billing Frequency */}
                <tr className="hover:bg-slate-50/50">
                  <td className="p-4 font-bold text-slate-700 bg-slate-50/30">Billing Frequency</td>
                  {comparisonData.plans.map(p => (
                    <td key={p._id} className="p-4 border-l border-slate-200 capitalize font-semibold text-slate-800">
                      {p.billingFrequency}
                    </td>
                  ))}
                </tr>

                {/* Annual Equivalent */}
                <tr className="hover:bg-slate-50/50">
                  <td className="p-4 font-bold text-slate-700 bg-slate-50/30">Annual Cost Equivalent</td>
                  {comparisonData.plans.map(p => (
                    <td key={p._id} className="p-4 border-l border-slate-200 font-semibold text-slate-800">
                      ₹{Math.round(p.annualEquivalent).toLocaleString()}/year
                    </td>
                  ))}
                </tr>

                {/* Min Quantity */}
                <tr className="hover:bg-slate-50/50">
                  <td className="p-4 font-bold text-slate-700 bg-slate-50/30">Minimum Quantity / Seats</td>
                  {comparisonData.plans.map(p => (
                    <td key={p._id} className="p-4 border-l border-slate-200 font-semibold text-slate-800">
                      {p.minimumQuantity} {p.minimumQuantity > 1 ? 'Units' : 'Unit'}
                    </td>
                  ))}
                </tr>

                {/* Pause & Early Closure */}
                <tr className="hover:bg-slate-50/50">
                  <td className="p-4 font-bold text-slate-700 bg-slate-50/30">Self-Service Pause Allowed</td>
                  {comparisonData.plans.map(p => (
                    <td key={p._id} className="p-4 border-l border-slate-200 font-semibold">
                      {p.allowPause ? (
                        <span className="text-emerald-600 flex items-center gap-1"><Check className="w-4 h-4" /> Allowed</span>
                      ) : (
                        <span className="text-slate-400 flex items-center gap-1"><X className="w-4 h-4" /> Not Permitted</span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Features Section */}
                <tr className="bg-slate-100/60">
                  <td colSpan={comparisonData.plans.length + 1} className="p-3 text-[11px] font-extrabold uppercase text-slate-600 tracking-wider">
                    Core Entitlements & Features
                  </td>
                </tr>

                {comparisonData.allFeatures.map(feat => (
                  <tr key={feat} className="hover:bg-slate-50/50">
                    <td className="p-4 text-slate-700 font-medium bg-slate-50/30">{feat}</td>
                    {comparisonData.plans.map(p => {
                      const hasFeat = p.featureMap[feat];
                      return (
                        <td key={p._id} className="p-4 border-l border-slate-200">
                          {hasFeat ? (
                            <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                              <X className="w-3.5 h-3.5" />
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TWO SMART TOOLS: Smart Recommendation + Savings Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Tool 1: "Find My Best Plan" */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">Find My Best Plan Tool</h3>
            </div>
            <p className="text-xs text-slate-500 mb-5">
              Select your requirements and our engine will score and rank plans based on affordability and feature compatibility.
            </p>

            <form onSubmit={handleGetRecommendation} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Monthly Budget (₹{recBudget.toLocaleString()})
                </label>
                <input
                  type="range"
                  min="1000"
                  max="15000"
                  step="500"
                  value={recBudget}
                  onChange={(e) => setRecBudget(Number(e.target.value))}
                  className="w-full accent-brand-600"
                />
                <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                  <span>₹1,000</span>
                  <span>₹7,500</span>
                  <span>₹15,000+</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Billing Frequency</label>
                  <select
                    value={recFrequency}
                    onChange={(e) => setRecFrequency(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                  >
                    <option value="any">Any Frequency</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Required Seats / Qty</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={recQuantity}
                    onChange={(e) => setRecQuantity(Number(e.target.value))}
                    className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">Required Features</label>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {availableFeatures.map(feat => {
                    const checked = selectedFeatures.includes(feat);
                    return (
                      <label key={feat} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleFeature(feat)}
                          className="rounded text-brand-600 focus:ring-brand-500"
                        />
                        <span>{feat}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={recLoading}
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-500/25 transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>{recLoading ? 'Evaluating Plans...' : 'Calculate Best Matches'}</span>
              </button>
            </form>
          </div>

          {/* Recommendations Result */}
          {recommendations && (
            <div className="mt-6 pt-5 border-t border-slate-100 space-y-3">
              <h4 className="text-xs font-bold uppercase text-slate-400">Top Ranked Recommendations</h4>
              {recommendations.slice(0, 2).map((rec, idx) => (
                <div key={rec.plan._id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black text-slate-900">{idx + 1}. {rec.plan.name}</span>
                      <span className="text-[11px] text-slate-500 block">₹{rec.plan.price}/{rec.plan.billingFrequency}</span>
                    </div>
                    <span className="px-2.5 py-1 text-xs font-black rounded-lg bg-emerald-100 text-emerald-800">
                      {rec.score}% Match
                    </span>
                  </div>

                  <div className="mt-2 space-y-1 text-[11px] text-slate-600">
                    {rec.reasons.map((r, i) => (
                      <div key={i} className="flex items-start gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{r}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tool 2: Savings Calculator */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Calculator className="w-4 h-4" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">Savings & Cost Difference Calculator</h3>
            </div>
            <p className="text-xs text-slate-500 mb-5">
              Select your current plan and an alternative plan to calculate projected monthly and yearly savings.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Current Plan</label>
                <select
                  value={calcCurrentPlanId}
                  onChange={(e) => setCalcCurrentPlanId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                >
                  <option value="">Select current plan...</option>
                  {plans.map(p => (
                    <option key={p._id} value={p._id}>{p.name} (₹{p.price}/{p.billingFrequency})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Alternative Plan to Compare</label>
                <select
                  value={calcAltPlanId}
                  onChange={(e) => setCalcAltPlanId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                >
                  <option value="">Select alternative plan...</option>
                  {plans.map(p => (
                    <option key={p._id} value={p._id}>{p.name} (₹{p.price}/{p.billingFrequency})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Quantity / Seat Scale</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={calcQuantity}
                  onChange={(e) => setCalcQuantity(Number(e.target.value))}
                  className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>

              <button
                type="button"
                onClick={handleCalculateSavings}
                disabled={calcLoading}
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/25 transition-all flex items-center justify-center gap-2"
              >
                <TrendingDown className="w-4 h-4" />
                <span>{calcLoading ? 'Calculating Savings...' : 'Calculate Projected Savings'}</span>
              </button>
            </div>
          </div>

          {/* Savings Result Card */}
          {savingsResult && (
            <div className="mt-6 pt-5 border-t border-slate-100">
              <div className={`p-4 rounded-2xl border ${savingsResult.analysis.isCheaper ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-brand-50 border-brand-200 text-brand-900'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wide">
                    {savingsResult.analysis.isCheaper ? '🎉 Projected Savings' : 'Cost Difference'}
                  </span>
                  {savingsResult.analysis.isCheaper && (
                    <span className="text-xs font-black px-2 py-0.5 rounded bg-emerald-200 text-emerald-900">
                      Save {savingsResult.analysis.percentageSavings}%
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div className="bg-white/80 p-2.5 rounded-xl border border-current/10">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Monthly Impact</span>
                    <span className="text-base font-black">
                      {savingsResult.analysis.monthlySavings >= 0 ? '+' : '-'}₹{Math.abs(savingsResult.analysis.monthlySavings).toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-white/80 p-2.5 rounded-xl border border-current/10">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Annual Impact</span>
                    <span className="text-base font-black">
                      {savingsResult.analysis.annualSavings >= 0 ? '+' : '-'}₹{Math.abs(savingsResult.analysis.annualSavings).toLocaleString()}
                    </span>
                  </div>
                </div>

                <p className="text-xs mt-3 leading-relaxed font-medium">
                  {savingsResult.analysis.explanation}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

