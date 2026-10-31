import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import {
  FileText,
  Plus,
  Send,
  CheckCircle,
  Repeat,
  Calendar,
  DollarSign,
  Search,
  Eye,
  Check,
  X
} from 'lucide-react';

export const QuotationsPage = () => {
  const { role } = useAuth();
  const [quotations, setQuotations] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [plans, setPlans] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [planId, setPlanId] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [validityDays, setValidityDays] = useState(30);

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const res = await api.get('/quotations');
      if (res.success) {
        setQuotations(res.quotations);
      }
    } catch (err) {
      console.error('Failed to load quotations:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuxiliary = async () => {
    try {
      const [tplRes, plansRes, custRes] = await Promise.all([
        api.get('/quotation-templates'),
        api.get('/plans'),
        role !== 'customer' ? api.get('/customers') : Promise.resolve({ customers: [] })
      ]);
      if (tplRes.success) setTemplates(tplRes.templates);
      if (plansRes.success) setPlans(plansRes.plans);
      if (custRes.success) setCustomers(custRes.customers);
    } catch (e) {
      console.error('Failed to load aux', e);
    }
  };

  useEffect(() => {
    fetchQuotations();
    fetchAuxiliary();
  }, []);

  const handleCreateQuotation = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/quotations', {
        customerId,
        planId: planId || undefined,
        templateId: templateId || undefined,
        validityDays
      });
      if (res.success) {
        setCreateModalOpen(false);
        fetchQuotations();
      }
    } catch (err) {
      alert('Failed to create quotation: ' + err.message);
    }
  };

  const handleSend = async (qId) => {
    try {
      await api.patch(`/quotations/${qId}/send`);
      fetchQuotations();
    } catch (err) {
      alert('Send error: ' + err.message);
    }
  };

  const handleAccept = async (qId) => {
    try {
      await api.post(`/quotations/${qId}/accept`);
      fetchQuotations();
    } catch (err) {
      alert('Accept error: ' + err.message);
    }
  };

  const handleConvert = async (qId) => {
    try {
      const res = await api.post(`/quotations/${qId}/convert`);
      if (res.success) {
        alert(res.message);
        fetchQuotations();
      }
    } catch (err) {
      alert('Convert error: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-brand-600" />
            Quotations & Templates
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Build proposals from reusable templates, track validity periods, and seamlessly convert accepted quotes into active subscriptions.
          </p>
        </div>

        {role !== 'customer' && (
          <button
            onClick={() => {
              if (customers.length > 0) setCustomerId(customers[0]._id);
              if (plans.length > 0) setPlanId(plans[0]._id);
              setCreateModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-500/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Quotation</span>
          </button>
        )}
      </div>

      {/* Quotations Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="p-4">Quotation #</th>
              <th className="p-4">Customer</th>
              <th className="p-4">Associated Plan</th>
              <th className="p-4">Validity</th>
              <th className="p-4">Total Amount</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {loading ? (
              <tr>
                <td colSpan="7" className="p-8 text-center text-slate-400">Loading quotations...</td>
              </tr>
            ) : quotations.length === 0 ? (
              <tr>
                <td colSpan="7" className="p-8 text-center text-slate-400">No quotations found.</td>
              </tr>
            ) : (
              quotations.map(q => (
                <tr key={q._id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="p-4 font-mono font-bold text-slate-900">{q.quotationNumber}</td>
                  <td className="p-4 font-semibold text-slate-800">{q.customer?.name} ({q.customer?.companyName})</td>
                  <td className="p-4 font-bold text-brand-700">{q.plan?.name || 'Custom Bundle'}</td>
                  <td className="p-4 text-slate-600">
                    Expires {new Date(q.validUntil).toLocaleDateString()}
                  </td>
                  <td className="p-4 font-black text-slate-900">₹{q.totalAmount}</td>
                  <td className="p-4"><Badge status={q.status} /></td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {role !== 'customer' && q.status === 'draft' && (
                        <button
                          onClick={() => handleSend(q._id)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
                        >
                          Send Quote
                        </button>
                      )}

                      {['sent', 'draft'].includes(q.status) && (
                        <button
                          onClick={() => handleAccept(q._id)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                        >
                          Accept
                        </button>
                      )}

                      {role !== 'customer' && q.status === 'accepted' && (
                        <button
                          onClick={() => handleConvert(q._id)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-sm hover:brightness-105 flex items-center gap-1"
                        >
                          <Repeat className="w-3.5 h-3.5" />
                          <span>Convert to Subscription</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Quotation Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Generate New Quotation"
        subtitle="Create quote from an existing template or plan"
      >
        <form onSubmit={handleCreateQuotation} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Target Customer</label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50"
              required
            >
              <option value="">Select customer...</option>
              {customers.map(c => (
                <option key={c._id} value={c._id}>{c.name} ({c.companyName})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Use Predefined Template (Optional)</label>
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50"
            >
              <option value="">None / Custom</option>
              {templates.map(t => (
                <option key={t._id} value={t._id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Select Base Plan</label>
            <select
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
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
            <label className="text-xs font-bold text-slate-700 block mb-1">Quotation Validity Period (Days)</label>
            <input
              type="number"
              value={validityDays}
              onChange={(e) => setValidityDays(Number(e.target.value))}
              className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50"
              required
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
              Create Quotation
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

