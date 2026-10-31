import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import {
  Percent,
  Plus,
  Tag,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  Search
} from 'lucide-react';

export const TaxesDiscountsPage = () => {
  const [taxes, setTaxes] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [taxModalOpen, setTaxModalOpen] = useState(false);
  const [taxName, setTaxName] = useState('');
  const [taxRate, setTaxRate] = useState(18);
  const [taxIsDefault, setTaxIsDefault] = useState(false);

  const [discModalOpen, setDiscModalOpen] = useState(false);
  const [discCode, setDiscCode] = useState('');
  const [discName, setDiscName] = useState('');
  const [discType, setDiscType] = useState('percentage');
  const [discValue, setDiscValue] = useState(10);
  const [discMinPurchase, setDiscMinPurchase] = useState(1000);
  const [discLimit, setDiscLimit] = useState(100);

  // Coupon test tool
  const [testCode, setTestCode] = useState('WELCOME20');
  const [testAmount, setTestAmount] = useState(2000);
  const [testResult, setTestResult] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [taxRes, discRes] = await Promise.all([
        api.get('/taxes'),
        api.get('/discounts')
      ]);
      if (taxRes.success) setTaxes(taxRes.taxes);
      if (discRes.success) setDiscounts(discRes.discounts);
    } catch (e) {
      console.error('Failed to load taxes/discounts', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateTax = async (e) => {
    e.preventDefault();
    try {
      await api.post('/taxes', {
        name: taxName,
        rate: Number(taxRate),
        isDefault: taxIsDefault
      });
      setTaxModalOpen(false);
      fetchData();
    } catch (err) {
      alert('Failed to create tax: ' + err.message);
    }
  };

  const handleCreateDiscount = async (e) => {
    e.preventDefault();
    try {
      await api.post('/discounts', {
        code: discCode.toUpperCase(),
        name: discName,
        type: discType,
        value: Number(discValue),
        minimumPurchase: Number(discMinPurchase),
        usageLimit: Number(discLimit)
      });
      setDiscModalOpen(false);
      fetchData();
    } catch (err) {
      alert('Failed to create discount: ' + err.message);
    }
  };

  const handleTestCoupon = async () => {
    try {
      const res = await api.post('/discounts/validate', {
        code: testCode,
        amount: Number(testAmount)
      });
      setTestResult(res);
    } catch (err) {
      setTestResult({ success: false, message: err.message });
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Percent className="w-6 h-6 text-brand-600" />
            Taxation & Promotion Rules
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure jurisdiction tax percentages (e.g. GST 18%) and promotional coupons with automated validity bounds and usage constraints.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setTaxModalOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800"
          >
            + Add Tax Rule
          </button>
          <button
            onClick={() => setDiscModalOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-600 text-white hover:bg-brand-500 shadow-md shadow-brand-500/20"
          >
            + Create Discount
          </button>
        </div>
      </div>

      {/* Two columns: Taxes & Discounts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Taxes Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Percent className="w-4 h-4 text-brand-600" />
              Tax Rates
            </h3>
            <span className="text-xs text-slate-400">{taxes.length} Configured</span>
          </div>

          <div className="space-y-3">
            {taxes.map(t => (
              <div key={t._id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900 text-sm">{t.name}</span>
                    {t.isDefault && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-brand-100 text-brand-800 font-bold">
                        Default
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-500 mt-0.5 block">Applied to standard invoices</span>
                </div>
                <div className="text-xl font-black text-brand-600">
                  {t.rate}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Discounts Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Tag className="w-4 h-4 text-emerald-600" />
              Promotional Coupons & Discounts
            </h3>
            <span className="text-xs text-slate-400">{discounts.length} Active</span>
          </div>

          <div className="space-y-3">
            {discounts.map(d => (
              <div key={d._id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-slate-900 text-sm px-2 py-0.5 bg-white border border-slate-200 rounded-lg">
                      {d.code}
                    </span>
                    <span className="text-xs font-bold text-slate-700">{d.name}</span>
                  </div>
                  <span className="text-xs text-slate-500 mt-1 block">
                    Min Purchase: ₹{d.minimumPurchase} • Used {d.timesUsed || 0}/{d.usageLimit || '∞'} times
                  </span>
                </div>
                <div className="text-lg font-black text-emerald-600">
                  {d.type === 'percentage' ? `${d.value}% Off` : `₹${d.value} Off`}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Coupon Validator Sandbox Tool */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-6 rounded-3xl shadow-md">
        <h3 className="text-sm font-bold uppercase tracking-wider text-brand-300 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-300" />
          Test Discount Code Eligibility
        </h3>
        <p className="text-xs text-slate-300 mt-1">
          Verify how discounts evaluate against purchase thresholds and usage counts before customers apply them.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <input
            type="text"
            placeholder="Coupon Code"
            value={testCode}
            onChange={(e) => setTestCode(e.target.value.toUpperCase())}
            className="text-xs p-2.5 rounded-xl border border-white/20 bg-white/10 text-white font-mono focus:outline-none"
          />
          <input
            type="number"
            placeholder="Purchase Amount (₹)"
            value={testAmount}
            onChange={(e) => setTestAmount(e.target.value)}
            className="text-xs p-2.5 rounded-xl border border-white/20 bg-white/10 text-white font-bold focus:outline-none"
          />
          <button
            onClick={handleTestCoupon}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-brand-500 hover:bg-brand-400 text-white shadow"
          >
            Validate Code
          </button>
        </div>

        {testResult && (
          <div className="mt-4 p-3 rounded-xl bg-white/10 border border-white/10 text-xs">
            {testResult.success ? (
              <span className="text-emerald-300 font-bold">
                ✓ {testResult.message}: Deducts ₹{testResult.discount?.discountAmount} from subtotal.
              </span>
            ) : (
              <span className="text-rose-300 font-bold">
                ✗ Validation Failed: {testResult.message}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Modals for Tax & Discount */}
      <Modal isOpen={taxModalOpen} onClose={() => setTaxModalOpen(false)} title="Add Tax Rate">
        <form onSubmit={handleCreateTax} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Tax Name</label>
            <input
              type="text"
              placeholder="e.g. GST 18%"
              value={taxName}
              onChange={(e) => setTaxName(e.target.value)}
              className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50"
              required
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Rate (%)</label>
            <input
              type="number"
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
              className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50"
              required
            />
          </div>
          <label className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <input
              type="checkbox"
              checked={taxIsDefault}
              onChange={(e) => setTaxIsDefault(e.target.checked)}
              className="rounded text-brand-600"
            />
            <span>Set as system default tax</span>
          </label>
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button type="button" onClick={() => setTaxModalOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-600 rounded-xl">Cancel</button>
            <button type="submit" className="px-5 py-2 text-xs font-bold bg-brand-600 text-white rounded-xl shadow">Save Tax</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={discModalOpen} onClose={() => setDiscModalOpen(false)} title="Create Discount Coupon">
        <form onSubmit={handleCreateDiscount} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Coupon Code</label>
              <input
                type="text"
                placeholder="e.g. SPRING50"
                value={discCode}
                onChange={(e) => setDiscCode(e.target.value.toUpperCase())}
                className="w-full text-xs font-mono p-2 rounded-xl border border-slate-200 bg-slate-50"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Campaign Name</label>
              <input
                type="text"
                value={discName}
                onChange={(e) => setDiscName(e.target.value)}
                className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Discount Type</label>
              <select
                value={discType}
                onChange={(e) => setDiscType(e.target.value)}
                className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₹)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Discount Value</label>
              <input
                type="number"
                value={discValue}
                onChange={(e) => setDiscValue(e.target.value)}
                className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Minimum Purchase (₹)</label>
              <input
                type="number"
                value={discMinPurchase}
                onChange={(e) => setDiscMinPurchase(e.target.value)}
                className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Total Usage Limit</label>
              <input
                type="number"
                value={discLimit}
                onChange={(e) => setDiscLimit(e.target.value)}
                className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button type="button" onClick={() => setDiscModalOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-600 rounded-xl">Cancel</button>
            <button type="submit" className="px-5 py-2 text-xs font-bold bg-brand-600 text-white rounded-xl shadow">Save Discount</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

