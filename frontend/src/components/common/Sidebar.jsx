import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Package,
  Layers,
  GitCompare,
  FileText,
  Repeat,
  Receipt,
  CreditCard,
  Percent,
  BarChart3,
  Bot,
  Settings,
  Sparkles,
  X
} from 'lucide-react';

export const Sidebar = ({ isOpen, onClose, activeTab, setActiveTab }) => {
  const { role } = useAuth();

  const allNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'staff', 'customer'] },
    { id: 'customers', label: 'Customers', icon: Users, roles: ['admin', 'staff'] },
    { id: 'products', label: 'Products', icon: Package, roles: ['admin', 'staff'] },
    { id: 'plans', label: 'Plans', icon: Layers, roles: ['admin', 'staff', 'customer'] },
    { id: 'compare-plans', label: 'Compare Plans', icon: GitCompare, roles: ['admin', 'staff', 'customer'], badge: 'Smart' },
    { id: 'quotations', label: 'Quotations', icon: FileText, roles: ['admin', 'staff', 'customer'] },
    { id: 'subscriptions', label: 'Subscriptions', icon: Repeat, roles: ['admin', 'staff', 'customer'] },
    { id: 'invoices', label: 'Invoices', icon: Receipt, roles: ['admin', 'staff', 'customer'] },
    { id: 'payments', label: 'Payments', icon: CreditCard, roles: ['admin', 'staff', 'customer'] },
    { id: 'taxes-discounts', label: 'Taxes & Discounts', icon: Percent, roles: ['admin'] },
    { id: 'reports', label: 'Reports', icon: BarChart3, roles: ['admin', 'staff'] },
    { id: 'assistant', label: 'Billing Assistant', icon: Bot, roles: ['customer', 'admin', 'staff'], highlight: true },
    { id: 'settings', label: 'Settings', icon: Settings, roles: ['admin', 'staff', 'customer'] },
  ];

  const visibleItems = allNavItems.filter(item => item.roles.includes(role));

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } no-print`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-500 to-indigo-400 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <Repeat className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-white flex items-center gap-1">
                Brightloop
              </span>
              <span className="text-[10px] text-brand-300 tracking-wider font-semibold uppercase block -mt-1">
                Subscription Cloud
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            {role === 'admin' ? 'Admin Suite' : role === 'staff' ? 'Staff Operations' : 'Customer Portal'}
          </div>

          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (window.innerWidth < 1024) onClose();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  isActive
                    ? item.highlight
                      ? 'bg-gradient-to-r from-brand-600 to-purple-600 text-white shadow-md shadow-brand-500/25'
                      : 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                    : item.highlight
                    ? 'text-brand-300 hover:bg-brand-950/40 hover:text-white border border-brand-500/30'
                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : item.highlight ? 'text-brand-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-brand-500/20 text-brand-300 border border-brand-500/30">
                    {item.badge}
                  </span>
                )}
                {item.highlight && !isActive && (
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/50">
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>Role: <strong className="text-slate-200 capitalize">{role}</strong></span>
            <span className="text-emerald-400 font-mono">v1.0.0</span>
          </div>
        </div>
      </aside>
    </>
  );
};

