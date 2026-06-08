import React from 'react';

const Badge = ({ children, status = 'default', className = '' }) => {
  const statusStyles = {
    pending: 'bg-amber-100 text-amber-800 border-amber-200',
    accepted: 'bg-blue-100 text-blue-800 border-blue-200',
    claimed: 'bg-blue-100 text-blue-800 border-blue-200',
    'picked up': 'bg-purple-100 text-purple-800 border-purple-200',
    delivered: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    expired: 'bg-red-100 text-red-800 border-red-200',
    default: 'bg-slate-100 text-slate-800 border-slate-200',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
        statusStyles[status.toLowerCase()] || statusStyles.default
      } ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;
