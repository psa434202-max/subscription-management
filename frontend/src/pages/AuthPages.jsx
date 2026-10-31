import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Repeat,
  Shield,
  User,
  Lock,
  Mail,
  Building,
  Check,
  ArrowRight
} from 'lucide-react';

export const LoginPage = ({ onSwitchToRegister }) => {
  const { login } = useAuth();
  const [selectedRole, setSelectedRole] = useState('admin');
  const [email, setEmail] = useState('admin@brightloop.com');
  const [password, setPassword] = useState('Password@123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const userPresets = [
    {
      role: 'admin',
      label: 'Admin',
      icon: '👑',
      email: 'admin@brightloop.com',
      password: 'Password@123',
      name: 'Aiden Vance',
      description: 'Full system, billing engine, and financial control'
    },
    {
      role: 'customer',
      label: 'Customer',
      icon: '👤',
      email: 'john@acme.com',
      password: 'Password@123',
      name: 'John Doe',
      description: 'Acme Corp – Active subscriber with self-service portal'
    },
    {
      role: 'staff',
      label: 'Staff',
      icon: '🛠️',
      email: 'staff@brightloop.com',
      password: 'Password@123',
      name: 'Elena Rostova',
      description: 'Operations – Customers, quotations, and invoices'
    }
  ];

  const handleSelectUser = (preset) => {
    setSelectedRole(preset.role);
    setEmail(preset.email);
    setPassword(preset.password);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      await login(email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl border border-slate-100">
        {/* Brand */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white mx-auto shadow-lg shadow-brand-500/30 mb-3">
            <Repeat className="w-6 h-6 animate-spin-slow" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Brightloop</h1>
          <p className="text-xs text-slate-500 mt-1">Smart Subscription Management System</p>
        </div>

        {/* 3 Users Selector (Admin, Customer, Staff) */}
        <div className="mb-6 space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            Select User Account:
          </label>
          <div className="grid grid-cols-3 gap-2">
            {userPresets.map((preset) => {
              const isSelected = selectedRole === preset.role && email === preset.email;
              return (
                <button
                  key={preset.role}
                  type="button"
                  onClick={() => handleSelectUser(preset)}
                  className={`p-2.5 rounded-2xl border text-center transition-all ${
                    isSelected
                      ? 'border-brand-600 bg-brand-50 text-brand-900 shadow-sm ring-2 ring-brand-500/20'
                      : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="text-base mb-0.5">{preset.icon}</div>
                  <div className="text-xs font-bold leading-tight">{preset.label}</div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">{preset.name.split(' ')[0]}</div>
                </button>
              );
            })}
          </div>

          {/* Active Preset Description */}
          {userPresets.find(p => p.role === selectedRole && p.email === email) && (
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60 text-[11px] text-slate-600 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0" />
              <span>{userPresets.find(p => p.role === selectedRole && p.email === email)?.description}</span>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setSelectedRole('');
                }}
                className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-500/25 transition-all flex items-center justify-center gap-2 mt-2"
          >
            <span>{loading ? 'Signing in...' : `Sign In as ${selectedRole ? selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1) : 'User'}`}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          Need a customer account?{' '}
          <button
            onClick={onSwitchToRegister}
            className="font-bold text-brand-600 hover:underline"
          >
            Create Customer Account
          </button>
        </div>
      </div>
    </div>
  );
};

export const RegisterPage = ({ onSwitchToLogin }) => {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      await register({
        name,
        companyName,
        email,
        phone,
        password,
        role: 'customer'
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl border border-slate-100">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-black text-slate-900">Create Customer Account</h1>
          <p className="text-xs text-slate-500 mt-1">Get immediate self-service subscription & billing access</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Your Full Name</label>
            <input
              type="text"
              placeholder="e.g. Jane Foster"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Company / Organization</label>
            <input
              type="text"
              placeholder="e.g. Acme Tech Solutions"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Email</label>
              <input
                type="email"
                placeholder="jane@acme.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Phone</label>
              <input
                type="text"
                placeholder="+91 98765 00000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Password</label>
            <input
              type="password"
              placeholder="Min 8 chars, 1 uppercase, 1 special (e.g. Pass@123)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-500/25 transition-all mt-2"
          >
            {loading ? 'Creating Account...' : 'Register Customer Account'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          Already registered?{' '}
          <button
            onClick={onSwitchToLogin}
            className="font-bold text-brand-600 hover:underline"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
};
