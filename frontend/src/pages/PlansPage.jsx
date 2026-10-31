import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import {
  Layers,
  Plus,
  Search,
  Check,
  Calendar,
  DollarSign,
  Sparkles,
  Repeat,
  Shield,
  Edit2
} from 'lucide-react';

export const PlansPage = ({ onSelectPlan }) => {
  const { role } = useAuth();
  const [plans, setPlans] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Create plan modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Standard');
  const [billingFrequency, setBillingFrequency] = useState('monthly');
  const [price, setPrice] = useState('');
  const [minimumQuantity, setMinimumQuantity] = useState(1);
  const [featureInput, setFeatureInput] = useState('');
  const [features, setFeatures] = useState([]);
  const [autoRenewal, setAutoRenewal] = useState(true);
  const [allowPause, setAllowPause] = useState(true);
  const [allowEarlyClosure, setAllowEarlyClosure] = useState(true);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await api.get('/plans');
      if (res.success) {
        setPlans(res.plans);
      }
    } catch (err) {
      console.error('Failed to load plans:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      if (res.success) setProducts(res.products);
    } catch (e) {
      console.error('Failed to load products', e);
    }
  };

  useEffect(() => {
    fetchPlans();
    if (role === 'admin') fetchProducts();
  }, [role]);

  const handleAddFeature = () => {
    if (!featureInput.trim()) return;
    setFeatures([...features, featureInput.trim()]);
    setFeatureInput('');
  };

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name,
        code,
        description,
        category,
        billingFrequency,
        price: Number(price),
        minimumQuantity: Number(minimumQuantity || 1),
        features,
        autoRenewal,
        allowPause,
        allowEarlyClosure
      };

      await api.post('/plans', payload);
      setCreateModalOpen(false);
      fetchPlans();
    } catch (err) {
      alert('Failed to create plan: ' + err.message);
    }
  };

  const filtered = plans.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.code.toLowerCase().includes(search.toLowerCase()) ||
    p.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Layers className="w-6 h-6 text-brand-600" />
            Subscription Plans Catalog
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Standard, growth, and enterprise packages with daily, weekly, monthly, and yearly recurring schedules.
          </p>
        </div>

        {role === 'admin' && (
          <button
            onClick={() => {
              setName('');
              setCode(`PLAN-${Math.floor(100 + Math.random() * 900)}`);
              setDescription('');
              setPrice('');
              setFeatures([]);
              setCreateModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-500/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Plan</span>
          </button>
        )}
      </div>

      {/* Grid of Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          <div className="col-span-4 text-center py-12 text-slate-400 text-xs">Loading plans...</div>
        ) : filtered.map(plan => (
          <div
            key={plan._id}
            className={`bg-white rounded-3xl border p-6 flex flex-col justify-between shadow-sm relative transition-all hover:shadow-md ${
              plan.isPopular ? 'border-brand-500 ring-2 ring-brand-500/20' : 'border-slate-200/80'
            }`}
          >
            {plan.isPopular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-md shadow-brand-500/30">
                Most Popular
              </span>
            )}

            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-slate-400">{plan.category}</span>
                <span className="text-[10px] font-mono text-slate-400">{plan.code}</span>
              </div>

              <h3 className="text-xl font-black text-slate-900 mt-2">{plan.name}</h3>
              <p className="text-xs text-slate-500 mt-1 min-h-[32px]">{plan.description}</p>

              <div className="mt-4 pt-4 border-t border-slate-100">
                <span className="text-3xl font-black text-slate-900">₹{plan.price}</span>
                <span className="text-xs text-slate-400 font-semibold">/{plan.billingFrequency}</span>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Monthly equivalent: <strong>₹{Math.round(plan.monthlyEquivalentPrice)}/mo</strong>
                </div>
              </div>

              {/* Features List */}
              <div className="mt-5 space-y-2">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Included Features:</span>
                {(plan.features || []).map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Lifecycle Rules Footer */}
            <div className="mt-6 pt-4 border-t border-slate-100 space-y-2 text-[11px] text-slate-500">
              <div className="flex justify-between">
                <span>Self-Service Pause:</span>
                <span className="font-bold text-slate-700">{plan.allowPause ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex justify-between">
                <span>Auto-Renewal:</span>
                <span className="font-bold text-slate-700">{plan.autoRenewal ? 'Enabled' : 'Manual'}</span>
              </div>
              <div className="flex justify-between">
                <span>Min Quantity:</span>
                <span className="font-bold text-slate-700">{plan.minimumQuantity} Unit</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Plan Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create Subscription Plan"
        subtitle="Define plan pricing, frequency, features, and lifecycle policies"
      >
        <form onSubmit={handleCreatePlan} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Plan Name</label>
              <input
                type="text"
                placeholder="e.g. Starter Tier"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Plan Code</label>
              <input
                type="text"
                placeholder="e.g. PLAN-STARTER"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 font-mono"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Billing Frequency</label>
              <select
                value={billingFrequency}
                onChange={(e) => setBillingFrequency(e.target.value)}
                className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Price (₹)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50"
              >
                <option value="Basic">Basic</option>
                <option value="Standard">Standard</option>
                <option value="Enterprise">Enterprise</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Description</label>
            <textarea
              rows="2"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50"
            />
          </div>

          {/* Features Builder */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Features Included</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. 24/7 Priority Support"
                value={featureInput}
                onChange={(e) => setFeatureInput(e.target.value)}
                className="flex-1 text-xs p-2 rounded-xl border border-slate-200 bg-slate-50"
              />
              <button
                type="button"
                onClick={handleAddFeature}
                className="px-4 py-2 text-xs font-bold bg-slate-900 text-white rounded-xl"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {features.map((f, i) => (
                <span key={i} className="text-[11px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                  ✓ {f}
                </span>
              ))}
            </div>
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
              Save Plan
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

