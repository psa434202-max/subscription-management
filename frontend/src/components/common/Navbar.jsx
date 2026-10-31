import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from './Badge';
import {
  Menu,
  LogOut,
  Bot
} from 'lucide-react';

export const Navbar = ({ onToggleSidebar, activeTab, setActiveTab }) => {
  const { user, role, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between no-print">
      {/* Left side */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden sm:flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Environment</span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Production
          </span>
        </div>
      </div>

      {/* Right side: Assistant quick pill + User profile & logout */}
      <div className="flex items-center gap-3">
        {role === 'customer' && (
          <button
            onClick={() => setActiveTab('assistant')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-sm hover:shadow hover:brightness-105 transition-all"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Billing Assistant</span>
          </button>
        )}

        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 text-white font-bold flex items-center justify-center text-xs shadow-sm">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-bold text-slate-800 leading-tight flex items-center gap-1.5">
              {user?.name}
              <Badge status={role} size="xs" />
            </div>
            <div className="text-[11px] text-slate-400 leading-tight truncate max-w-[150px]">
              {user?.customer?.companyName || user?.email}
            </div>
          </div>
          <button
            onClick={logout}
            title="Log Out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors ml-1"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
