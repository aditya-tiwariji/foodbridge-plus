import React from 'react';
import Card from '../ui/Card.jsx';

const NGOStatsCard = ({ title, count, icon: Icon, color = 'primary', className = '' }) => {
  const colorSchemes = {
    primary: {
      bg: 'from-blue-500/10 to-indigo-500/10 border-blue-100',
      iconBg: 'bg-blue-100 text-blue-600',
      badgeColor: 'text-blue-700',
      hover: 'hover:shadow-blue-500/5 hover:border-blue-200'
    },
    success: {
      bg: 'from-emerald-500/10 to-teal-500/10 border-emerald-100',
      iconBg: 'bg-emerald-100 text-emerald-600',
      badgeColor: 'text-emerald-700',
      hover: 'hover:shadow-emerald-500/5 hover:border-emerald-200'
    },
    warning: {
      bg: 'from-amber-500/10 to-orange-500/10 border-amber-100',
      iconBg: 'bg-amber-100 text-amber-600',
      badgeColor: 'text-amber-700',
      hover: 'hover:shadow-amber-500/5 hover:border-amber-200'
    },
    danger: {
      bg: 'from-red-500/10 to-rose-500/10 border-red-100',
      iconBg: 'bg-red-100 text-red-600',
      badgeColor: 'text-red-700',
      hover: 'hover:shadow-red-500/5 hover:border-red-200'
    },
    purple: {
      bg: 'from-purple-500/10 to-fuchsia-500/10 border-purple-100',
      iconBg: 'bg-purple-100 text-purple-600',
      badgeColor: 'text-purple-700',
      hover: 'hover:shadow-purple-500/5 hover:border-purple-200'
    }
  };

  const scheme = colorSchemes[color] || colorSchemes.primary;

  return (
    <Card
      className={`p-6 bg-gradient-to-br ${scheme.bg} border transition-all duration-300 transform hover:-translate-y-1 rounded-2xl shadow-sm ${scheme.hover} ${className}`}
    >
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-2">
          <span className="text-slate-500 text-sm font-semibold tracking-wide uppercase">{title}</span>
          <span className="text-4xl font-extrabold text-slate-800 tracking-tight">{count}</span>
        </div>
        <div className={`p-3 rounded-xl ${scheme.iconBg} shadow-inner`}>
          {Icon && <Icon className="h-6 w-6 stroke-[2]" />}
        </div>
      </div>
    </Card>
  );
};

export default NGOStatsCard;
