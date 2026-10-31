import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Settings,
  Shield,
  KeyRound,
  RotateCcw,
  UserPlus,
  Building,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export const SettingsPage = () => {
  const { role, user, refreshUser } = useAuth();

  // Password reset state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetMsg, setResetMsg] = useState(null);
  const [resetLoading, setResetLoading] = useState(false);

  // Staff creation (Admin only)
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('Staff@2026!');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffMsg, setStaffMsg] = useState(null);

  // Reset demo state
  const [resettingDemo, setResettingDemo] = useState(false);

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    try {
      setResetLoading(true);
      setResetMsg(null);
      const res = await api.post('/auth/reset-password', {
        currentPassword,
        newPassword
      });
      setResetMsg({ success: true, text: res.message });
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setResetMsg({ success: false, text: err.message });
    } finally {
      setResetLoading(false);
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    try {
      setStaffMsg(null);
      const res = await api.post('/users/staff', {
        name: staffName,
        email: staffEmail,
        password: staffPassword,
        phone: staffPhone
      });
      setStaffMsg({ success: true, text: res.message });
      setStaffName('');
      setStaffEmail('');
    } catch (err) {
      setStaffMsg({ success: false, text: err.message });
    }
  };

  const handleResetDemoData = async () => {
    const ok = window.confirm('Are you sure you want to restore the initial demo state? All collections will be reset to default sample data.');
    if (!ok) return;

    try {
      setResettingDemo(true);
      const res = await api.post('/reset-demo');
      alert(res.message);
      window.location.reload();
    } catch (err) {
      alert('Reset failed: ' + err.message);
    } finally {
      setResettingDemo(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-brand-600" />
          System & Account Settings
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your credentials, business configurations, staff accounts, and demo environment reset.
        </p>
      </div>

      {/* Account Profile Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Building className="w-4 h-4 text-brand-600" />
          Account Profile Information
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block font-bold uppercase text-[10px]">User Name</span>
            <span className="font-bold text-slate-900 text-sm mt-0.5 block">{user?.name}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block font-bold uppercase text-[10px]">Email Address</span>
            <span className="font-bold text-slate-900 text-sm mt-0.5 block">{user?.email}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block font-bold uppercase text-[10px]">System Role</span>
            <span className="font-bold text-brand-600 capitalize text-sm mt-0.5 block">{role}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block font-bold uppercase text-[10px]">Associated Organization</span>
            <span className="font-bold text-slate-900 text-sm mt-0.5 block">{user?.customer?.companyName || 'Brightloop Internal'}</span>
          </div>
        </div>
      </div>

      {/* Password Reset Section */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-indigo-600" />
          Update Password
        </h3>
        <p className="text-xs text-slate-500">
          Passwords must contain at least 8 characters, with uppercase, lowercase, and special character.
        </p>

        {resetMsg && (
          <div className={`p-3 rounded-xl text-xs font-semibold ${resetMsg.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
            {resetMsg.text}
          </div>
        )}

        <form onSubmit={handlePasswordReset} className="space-y-3 max-w-md">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">New Password</label>
            <input
              type="password"
              placeholder="e.g. BrightLoop@2026!"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50"
              required
            />
          </div>

          <button
            type="submit"
            disabled={resetLoading}
            className="px-5 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow"
          >
            {resetLoading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Admin Section: Create Staff Accounts */}
      {role === 'admin' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-brand-600" />
            Provision Operations Staff Account
          </h3>
          <p className="text-xs text-slate-500">
            Admins can create dedicated staff credentials for managing customers, quotations, subscriptions, and invoices.
          </p>

          {staffMsg && (
            <div className={`p-3 rounded-xl text-xs font-semibold ${staffMsg.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
              {staffMsg.text}
            </div>
          )}

          <form onSubmit={handleCreateStaff} className="space-y-3 max-w-md">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Staff Name</label>
                <input
                  type="text"
                  placeholder="e.g. Alex Morgan"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Phone</label>
                <input
                  type="text"
                  placeholder="+91 98765 00000"
                  value={staffPhone}
                  onChange={(e) => setStaffPhone(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Staff Email</label>
                <input
                  type="email"
                  placeholder="alex@brightloop.com"
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Temporary Password</label>
                <input
                  type="text"
                  value={staffPassword}
                  onChange={(e) => setStaffPassword(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white rounded-xl shadow"
            >
              Create Staff Account
            </button>
          </form>
        </div>
      )}

      {/* Admin Section: One-Click Demo Reset */}
      {role === 'admin' && (
        <div className="bg-rose-50 border border-rose-200 p-6 rounded-3xl space-y-3">
          <h3 className="text-sm font-bold text-rose-900 flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-rose-600" />
            Restore Initial Hackathon Demo Data
          </h3>
          <p className="text-xs text-rose-700 leading-relaxed">
            Quickly reset the entire database to the clean initial demo state with sample accounts (Admin, Staff, Acme Corp, Techflow, Cloudscale), active subscriptions, invoices, and coupons.
          </p>
          <button
            onClick={handleResetDemoData}
            disabled={resettingDemo}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/25 transition-all"
          >
            {resettingDemo ? 'Resetting Database...' : 'Restore Initial Demo Data'}
          </button>
        </div>
      )}
    </div>
  );
};

