import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import {
  Users,
  Plus,
  Search,
  Building2,
  Mail,
  Phone,
  MapPin,
  Eye,
  CheckCircle,
  FileText
} from 'lucide-react';

export const CustomersPage = () => {
  const { role } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Customer Details Modal
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerStats, setCustomerStats] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  // Create Customer Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newTaxId, setNewTaxId] = useState('');
  const [newPaymentTerms, setNewPaymentTerms] = useState('Net 30');

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/customers');
      if (res.success) {
        setCustomers(res.customers);
      }
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const viewCustomerDetails = async (custId) => {
    try {
      const res = await api.get(`/customers/${custId}`);
      if (res.success) {
        setSelectedCustomer(res.customer);
        setCustomerStats(res);
        setDetailsModalOpen(true);
      }
    } catch (err) {
      alert('Failed to load customer profile: ' + err.message);
    }
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/customers', {
        name: newName,
        companyName: newCompany,
        email: newEmail,
        phone: newPhone,
        billingAddress: { city: newCity, country: 'India' },
        taxId: newTaxId,
        paymentTerms: newPaymentTerms
      });
      if (res.success) {
        setCreateModalOpen(false);
        setNewName('');
        setNewCompany('');
        setNewEmail('');
        fetchCustomers();
      }
    } catch (err) {
      alert('Failed to create customer: ' + err.message);
    }
  };

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.companyName || '').toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-brand-600" />
            Customer Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Maintain customer records, organization details, billing addresses, and payment terms.
          </p>
        </div>

        {role !== 'customer' && (
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-500/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
        )}
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="relative max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search customers by name, company, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="p-4">Customer</th>
              <th className="p-4">Company</th>
              <th className="p-4">Contact</th>
              <th className="p-4">Payment Terms</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {loading ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-slate-400">Loading customers...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-slate-400">No customers found.</td>
              </tr>
            ) : (
              filtered.map(c => (
                <tr key={c._id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="p-4 font-bold text-slate-900">{c.name}</td>
                  <td className="p-4 font-semibold text-slate-700">{c.companyName || '—'}</td>
                  <td className="p-4 text-slate-500">
                    <div>{c.email}</div>
                    <div className="text-[11px] text-slate-400">{c.phone || ''}</div>
                  </td>
                  <td className="p-4 font-semibold text-slate-800">{c.paymentTerms || 'Net 30'}</td>
                  <td className="p-4"><Badge status={c.status} /></td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => viewCustomerDetails(c._id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-slate-100"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Customer Details Modal */}
      <Modal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        title={selectedCustomer?.name}
        subtitle={selectedCustomer?.companyName}
      >
        {selectedCustomer && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl">
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px] block">Active Subscriptions</span>
                <span className="text-base font-black text-brand-600">{customerStats?.stats?.activeSubscriptionsCount || 0}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px] block">Total Invoiced</span>
                <span className="text-base font-black text-slate-900">₹{customerStats?.stats?.totalInvoiced?.toLocaleString() || 0}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px] block">Outstanding Due</span>
                <span className="text-base font-black text-rose-600">₹{customerStats?.stats?.outstandingBalance?.toLocaleString() || 0}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-bold text-slate-700 block">Email:</span>
                <span className="text-slate-500">{selectedCustomer.email}</span>
              </div>
              <div>
                <span className="font-bold text-slate-700 block">Phone:</span>
                <span className="text-slate-500">{selectedCustomer.phone || 'Not provided'}</span>
              </div>
              <div>
                <span className="font-bold text-slate-700 block">Tax ID / GSTIN:</span>
                <span className="text-slate-500">{selectedCustomer.taxId || 'N/A'}</span>
              </div>
              <div>
                <span className="font-bold text-slate-700 block">Payment Terms:</span>
                <span className="text-slate-500">{selectedCustomer.paymentTerms}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Customer Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Add New Customer"
        subtitle="Create a customer account with billing defaults"
      >
        <form onSubmit={handleCreateCustomer} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Full Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Company / Organization</label>
              <input
                type="text"
                value={newCompany}
                onChange={(e) => setNewCompany(e.target.value)}
                className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Email</label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Phone</label>
              <input
                type="text"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">City</label>
              <input
                type="text"
                value={newCity}
                onChange={(e) => setNewCity(e.target.value)}
                className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Payment Terms</label>
              <select
                value={newPaymentTerms}
                onChange={(e) => setNewPaymentTerms(e.target.value)}
                className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50"
              >
                <option value="Immediate">Immediate</option>
                <option value="Net 15">Net 15</option>
                <option value="Net 30">Net 30</option>
                <option value="Net 60">Net 60</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Tax ID / GSTIN (Optional)</label>
            <input
              type="text"
              value={newTaxId}
              onChange={(e) => setNewTaxId(e.target.value)}
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
              Save Customer
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

