import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Badge } from '../components/common/Badge';
import {
  CreditCard,
  Search,
  Calendar,
  CheckCircle2,
  DollarSign,
  Smartphone,
  Banknote,
  Building
} from 'lucide-react';

export const PaymentsPage = () => {
  const { role } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/payments');
      if (res.success) {
        setPayments(res.payments);
      }
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const getMethodIcon = (method) => {
    switch (method) {
      case 'upi': return <Smartphone className="w-4 h-4 text-emerald-600" />;
      case 'card': return <CreditCard className="w-4 h-4 text-brand-600" />;
      case 'bank_transfer': return <Building className="w-4 h-4 text-blue-600" />;
      default: return <Banknote className="w-4 h-4 text-slate-600" />;
    }
  };

  const filtered = payments.filter(p =>
    p.paymentNumber.toLowerCase().includes(search.toLowerCase()) ||
    p.transactionReference.toLowerCase().includes(search.toLowerCase()) ||
    (p.customer?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-brand-600" />
            Payment History & Receipts
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time ledger of recorded payments across UPI, corporate card, net banking, and cash settlements.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="relative max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search payments by reference, customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="p-4">Payment #</th>
              <th className="p-4">Customer</th>
              <th className="p-4">Invoice Ref</th>
              <th className="p-4">Payment Method</th>
              <th className="p-4">Transaction Ref</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {loading ? (
              <tr>
                <td colSpan="7" className="p-8 text-center text-slate-400">Loading payment ledger...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="7" className="p-8 text-center text-slate-400">No payment records found.</td>
              </tr>
            ) : (
              filtered.map(p => (
                <tr key={p._id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="p-4 font-mono font-bold text-slate-900">{p.paymentNumber}</td>
                  <td className="p-4 font-bold text-slate-800">{p.customer?.name}</td>
                  <td className="p-4 font-mono text-slate-600">{p.invoice?.invoiceNumber || '—'}</td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-semibold uppercase text-[11px]">
                      {getMethodIcon(p.paymentMethod)}
                      <span>{p.paymentMethod.replace('_', ' ')}</span>
                    </span>
                  </td>
                  <td className="p-4 font-mono text-slate-600">{p.transactionReference}</td>
                  <td className="p-4 font-black text-emerald-600 text-sm">₹{p.amount?.toLocaleString()}</td>
                  <td className="p-4 text-slate-500">{new Date(p.paymentDate).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

