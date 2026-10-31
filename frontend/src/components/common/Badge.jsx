import React from 'react';

const colorStyles = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/20',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-500/20',
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/20',
  partially_paid: 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/20',
  overdue: 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/20',
  draft: 'bg-slate-100 text-slate-700 border-slate-200 ring-slate-500/20',
  quotation: 'bg-purple-50 text-purple-700 border-purple-200 ring-purple-500/20',
  paused: 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/20',
  closed: 'bg-slate-100 text-slate-600 border-slate-200 ring-slate-400/20',
  cancelled: 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/20',
  sent: 'bg-sky-50 text-sky-700 border-sky-200 ring-sky-500/20',
  accepted: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/20',
  converted: 'bg-indigo-50 text-indigo-700 border-indigo-200 ring-indigo-500/20',
  admin: 'bg-purple-50 text-purple-700 border-purple-200 ring-purple-500/20',
  staff: 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-500/20',
  customer: 'bg-teal-50 text-teal-700 border-teal-200 ring-teal-500/20',
};

export const Badge = ({ status = 'draft', label, size = 'sm' }) => {
  const normStatus = (status || '').toLowerCase().replace(' ', '_');
  const style = colorStyles[normStatus] || 'bg-slate-100 text-slate-700 border-slate-200';
  const displayLabel = label || status?.charAt(0).toUpperCase() + status?.slice(1).replace('_', ' ');

  const sizeClasses = size === 'xs' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border shadow-sm ${sizeClasses} ${style}`}
    >
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-current opacity-70"></span>
      {displayLabel}
    </span>
  );
};

