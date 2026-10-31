import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import {
  Receipt,
  Play,
  CreditCard,
  Printer,
  Download,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Eye,
  Plus,
  Send,
  Building2,
  Calendar,
  AlertCircle
} from 'lucide-react';

export const InvoicesPage = ({ payTargetInvoice, clearPayTarget }) => {
  const { role, user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Payment recording modal
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payingInvoice, setPayingInvoice] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('upi');
  const [payTxnRef, setPayTxnRef] = useState('');
  const [recordingPayment, setRecordingPayment] = useState(false);

  // Printable Invoice Preview Modal
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState(null);

  // Run Recurring Billing state
  const [runningBilling, setRunningBilling] = useState(false);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      const res = await api.get('/invoices', params);
      if (res.success) {
        setInvoices(res.invoices);
      }
    } catch (err) {
      console.error('Failed to load invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter]);

  // Handle external trigger (from Dashboard) to open payment modal
  useEffect(() => {
    if (payTargetInvoice) {
      openPayModal(payTargetInvoice);
      clearPayTarget();
    }
  }, [payTargetInvoice]);

  const handleRunBilling = async () => {
    try {
      setRunningBilling(true);
      const res = await api.post('/billing/run');
      alert(`Recurring billing executed! ${res.message}`);
      fetchInvoices();
    } catch (err) {
      alert('Billing execution error: ' + err.message);
    } finally {
      setRunningBilling(false);
    }
  };

  const handleInvoiceStatus = async (invoiceId, action) => {
    try {
      const res = await api.patch(`/invoices/${invoiceId}/status`, { action });
      if (res.success) {
        fetchInvoices();
      }
    } catch (err) {
      alert('Status update failed: ' + err.message);
    }
  };

  const openPayModal = (inv) => {
    setPayingInvoice(inv);
    setPayAmount(inv.outstandingBalance || inv.totalAmount);
    setPayMethod('upi');
    setPayTxnRef(`UPI-TXN-${Math.floor(100000 + Math.random() * 900000)}`);
    setPayModalOpen(true);
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!payingInvoice) return;
    try {
      setRecordingPayment(true);
      const res = await api.post('/payments', {
        invoiceId: payingInvoice._id,
        amount: Number(payAmount),
        paymentMethod: payMethod,
        transactionReference: payTxnRef
      });
      if (res.success) {
        alert(res.message);
        setPayModalOpen(false);
        fetchInvoices();
      }
    } catch (err) {
      alert('Payment recording failed: ' + err.message);
    } finally {
      setRecordingPayment(false);
    }
  };

  const openPrintPreview = (inv) => {
    setPreviewInvoice(inv);
    setPreviewModalOpen(true);
  };

  const filteredInvoices = invoices.filter(inv => {
    const match =
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      (inv.customer?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (inv.customer?.companyName || '').toLowerCase().includes(search.toLowerCase());
    return match;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Receipt className="w-6 h-6 text-brand-600" />
            Invoice & Billing Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track recurring invoices across lifecycle states (Draft → Confirmed → Paid), support partial payments, print invoices, and run recurring billing.
          </p>
        </div>

        {role !== 'customer' && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleRunBilling}
              disabled={runningBilling}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/25 transition-all"
            >
              <Play className={`w-4 h-4 ${runningBilling ? 'animate-spin' : ''}`} />
              <span>{runningBilling ? 'Generating Invoices...' : 'Run Recurring Billing Engine'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search invoice number, customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {['all', 'confirmed', 'paid', 'partially_paid', 'draft', 'overdue', 'cancelled'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-all ${
                statusFilter === st
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="p-4">Invoice #</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Dates</th>
                <th className="p-4">Total Amount</th>
                <th className="p-4">Paid / Balance</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400">Loading invoices...</td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400">No invoices found.</td>
                </tr>
              ) : (
                filteredInvoices.map(inv => (
                  <tr key={inv._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-4 font-mono font-bold text-slate-900">
                      {inv.invoiceNumber}
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-800">{inv.customer?.name}</div>
                      <div className="text-[11px] text-slate-400">{inv.customer?.companyName || inv.customer?.email}</div>
                    </td>
                    <td className="p-4 text-slate-600">
                      <div>Issued: {new Date(inv.issueDate).toLocaleDateString()}</div>
                      <div className="text-[11px] text-slate-400">Due: {new Date(inv.dueDate).toLocaleDateString()}</div>
                    </td>
                    <td className="p-4 font-black text-slate-900">
                      ₹{inv.totalAmount}
                      <span className="text-[10px] text-slate-400 block font-normal">incl. ₹{inv.taxTotal} GST</span>
                    </td>
                    <td className="p-4">
                      <div className="text-emerald-600 font-bold">Paid: ₹{inv.amountPaid || 0}</div>
                      {inv.outstandingBalance > 0 ? (
                        <div className="text-rose-600 font-bold text-[11px]">Due: ₹{inv.outstandingBalance}</div>
                      ) : (
                        <div className="text-slate-400 text-[11px]">Fully Settled</div>
                      )}
                    </td>
                    <td className="p-4">
                      <Badge status={inv.status} />
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Pay Now Button */}
                        {inv.outstandingBalance > 0 && inv.status !== 'cancelled' && (
                          <button
                            onClick={() => openPayModal(inv)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors flex items-center gap-1"
                            title="Record Payment"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Pay / Settle</span>
                          </button>
                        )}

                        {/* Print / PDF view */}
                        <button
                          onClick={() => openPrintPreview(inv)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                          title="Print / View Invoice"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        {/* Send action */}
                        {role !== 'customer' && inv.status === 'draft' && (
                          <button
                            onClick={() => handleInvoiceStatus(inv._id, 'confirm')}
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50"
                            title="Confirm Invoice"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}

                        {role !== 'customer' && ['draft', 'confirmed'].includes(inv.status) && (
                          <button
                            onClick={() => handleInvoiceStatus(inv._id, 'cancel')}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50"
                            title="Cancel Invoice"
                          >
                            <XCircle className="w-4 h-4" />
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
      </div>

      {/* ================= PAYMENT RECORDING MODAL ================= */}
      <Modal
        isOpen={payModalOpen}
        onClose={() => setPayModalOpen(false)}
        title={`Record Payment for ${payingInvoice?.invoiceNumber}`}
        subtitle={`Outstanding Balance: ₹${payingInvoice?.outstandingBalance}`}
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Payment Amount (₹)</label>
            <input
              type="number"
              step="0.01"
              min="1"
              max={payingInvoice?.outstandingBalance}
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              className="w-full text-base font-bold p-2.5 rounded-xl border border-slate-200 bg-slate-50"
              required
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              Supports full or partial payment. Balance remaining: ₹{Math.max(0, (payingInvoice?.outstandingBalance || 0) - Number(payAmount || 0)).toFixed(2)}
            </span>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Payment Method</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'upi', label: 'UPI / GPay' },
                { id: 'card', label: 'Credit/Debit Card' },
                { id: 'bank_transfer', label: 'Bank Transfer' },
                { id: 'cash', label: 'Cash' }
              ].map(m => (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => setPayMethod(m.id)}
                  className={`p-2.5 rounded-xl text-xs font-bold border transition-all ${
                    payMethod === m.id
                      ? 'border-brand-600 bg-brand-50 text-brand-700 ring-1 ring-brand-500/20'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Transaction Reference</label>
            <input
              type="text"
              value={payTxnRef}
              onChange={(e) => setPayTxnRef(e.target.value)}
              className="w-full text-xs font-mono p-2.5 rounded-xl border border-slate-200 bg-slate-50"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setPayModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={recordingPayment}
              className="px-6 py-2 text-xs font-bold bg-emerald-600 text-white rounded-xl shadow-md hover:bg-emerald-500 transition-all"
            >
              {recordingPayment ? 'Recording...' : `Record Payment of ₹${payAmount}`}
            </button>
          </div>
        </form>
      </Modal>

      {/* ================= PRINTABLE INVOICE / PDF MODAL ================= */}
      <Modal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        title="Printable Invoice Preview"
        subtitle={`Invoice #${previewInvoice?.invoiceNumber}`}
        maxWidth="max-w-3xl"
      >
        {previewInvoice && (
          <div className="space-y-6">
            <div className="flex justify-end gap-2 no-print">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 shadow"
              >
                <Printer className="w-4 h-4" />
                <span>Print Invoice</span>
              </button>
            </div>

            {/* Printable Invoice Container */}
            <div className="printable-invoice p-8 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 text-slate-800">
              {/* Invoice Top Header */}
              <div className="flex items-start justify-between pb-6 border-b border-slate-200">
                <div>
                  <div className="text-2xl font-black text-brand-600 tracking-tight">Brightloop</div>
                  <div className="text-xs text-slate-500 font-medium">Smart Subscription Management System</div>
                  <div className="text-xs text-slate-400 mt-1">support@brightloop.com • Bengaluru, India</div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-black text-slate-900 uppercase tracking-wide">INVOICE</div>
                  <div className="text-xs font-mono font-bold text-slate-600 mt-1">#{previewInvoice.invoiceNumber}</div>
                  <div className="mt-2"><Badge status={previewInvoice.status} /></div>
                </div>
              </div>

              {/* Bill To & Dates */}
              <div className="grid grid-cols-2 gap-6 text-xs">
                <div>
                  <span className="font-bold uppercase text-slate-400 text-[10px] block mb-1">Billed To</span>
                  <div className="font-black text-slate-900 text-sm">{previewInvoice.customer?.name}</div>
                  <div className="font-semibold text-slate-700">{previewInvoice.customer?.companyName}</div>
                  <div className="text-slate-500 mt-1">{previewInvoice.customer?.email}</div>
                  {previewInvoice.customer?.billingAddress?.street && (
                    <div className="text-slate-500 mt-0.5">
                      {previewInvoice.customer.billingAddress.street}, {previewInvoice.customer.billingAddress.city}
                    </div>
                  )}
                  {previewInvoice.customer?.taxId && (
                    <div className="text-slate-400 font-mono mt-1">GSTIN: {previewInvoice.customer.taxId}</div>
                  )}
                </div>

                <div className="text-right space-y-1">
                  <div>
                    <span className="text-slate-400">Issue Date: </span>
                    <span className="font-bold">{new Date(previewInvoice.issueDate).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Due Date: </span>
                    <span className="font-bold text-rose-600">{new Date(previewInvoice.dueDate).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Billing Period: </span>
                    <span className="font-semibold">{new Date(previewInvoice.billingPeriodStart).toLocaleDateString()} – {new Date(previewInvoice.billingPeriodEnd).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Terms: </span>
                    <span className="font-semibold">{previewInvoice.paymentTerms || 'Net 30'}</span>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase">
                    <tr>
                      <th className="p-3">Description</th>
                      <th className="p-3">Qty</th>
                      <th className="p-3">Unit Price</th>
                      <th className="p-3">Tax (GST)</th>
                      <th className="p-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(previewInvoice.items || []).map((it, i) => (
                      <tr key={i}>
                        <td className="p-3 font-medium text-slate-800">{it.description}</td>
                        <td className="p-3">{it.quantity}</td>
                        <td className="p-3">₹{it.unitPrice}</td>
                        <td className="p-3">{it.taxRate}%</td>
                        <td className="p-3 font-bold text-slate-900 text-right">₹{it.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Summary */}
              <div className="flex justify-end text-xs">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal:</span>
                    <span className="font-semibold">₹{previewInvoice.subtotal}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>GST Taxes:</span>
                    <span className="font-semibold">₹{previewInvoice.taxTotal}</span>
                  </div>
                  {previewInvoice.discountTotal > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount:</span>
                      <span className="font-semibold">-₹{previewInvoice.discountTotal}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-black text-slate-900 text-base pt-2 border-t border-slate-200">
                    <span>Total Amount:</span>
                    <span className="text-brand-600">₹{previewInvoice.totalAmount}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-bold pt-1">
                    <span>Amount Paid:</span>
                    <span>₹{previewInvoice.amountPaid || 0}</span>
                  </div>
                  <div className="flex justify-between font-black text-rose-600 text-sm pt-1 border-t border-slate-100">
                    <span>Outstanding Balance:</span>
                    <span>₹{previewInvoice.outstandingBalance}</span>
                  </div>
                </div>
              </div>

              {/* Footer notes */}
              <div className="pt-6 border-t border-slate-200 text-[11px] text-slate-400 text-center">
                Thank you for your business with Brightloop. For inquiries, email billing@brightloop.com.
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

