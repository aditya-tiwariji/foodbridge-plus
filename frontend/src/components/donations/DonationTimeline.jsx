import React from 'react';
import { Calendar, CheckCircle2, Truck, PackageCheck, Archive, HelpCircle } from 'lucide-react';
import Badge from '../ui/Badge.jsx';

const DonationTimeline = ({ statusHistory = [], currentStatus }) => {
  // Helpers to fetch status metadata
  const getStatusMeta = (status) => {
    const metas = {
      pending: {
        label: 'Donation Listed',
        desc: 'Food is listed and awaiting NGO claim.',
        icon: Calendar,
        color: 'text-amber-600 bg-amber-50 border-amber-200',
        lineColor: 'bg-amber-200',
      },
      accepted: {
        label: 'Claimed by NGO',
        desc: 'An NGO has accepted the donation and will coordinate pickup.',
        icon: CheckCircle2,
        color: 'text-blue-600 bg-blue-50 border-blue-200',
        lineColor: 'bg-blue-200',
      },
      claimed: {
        label: 'Claimed by NGO',
        desc: 'An NGO has claimed the donation and will coordinate pickup.',
        icon: CheckCircle2,
        color: 'text-blue-600 bg-blue-50 border-blue-200',
        lineColor: 'bg-blue-200',
      },
      'picked up': {
        label: 'Picked Up',
        desc: 'Food has been collected and is currently in transit.',
        icon: Truck,
        color: 'text-purple-600 bg-purple-50 border-purple-200',
        lineColor: 'bg-purple-200',
      },
      delivered: {
        label: 'Delivered',
        desc: 'Food was safely delivered to the destination.',
        icon: PackageCheck,
        color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
        lineColor: 'bg-emerald-200',
      },
      expired: {
        label: 'Listing Expired',
        desc: 'The food reached its expiration threshold before claim.',
        icon: Archive,
        color: 'text-red-600 bg-red-50 border-red-200',
        lineColor: 'bg-red-200',
      },
    };
    return metas[status.toLowerCase()] || {
      label: status,
      desc: 'Status updated.',
      icon: HelpCircle,
      color: 'text-slate-600 bg-slate-50 border-slate-200',
      lineColor: 'bg-slate-200',
    };
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-md font-bold text-slate-800">Status Tracking Timeline</h3>
        <Badge status={currentStatus}>{currentStatus.toUpperCase()}</Badge>
      </div>

      <div className="relative pl-8 flex flex-col gap-8">
        {statusHistory.map((history, idx) => {
          const meta = getStatusMeta(history.status);
          const Icon = meta.icon;
          const isLast = idx === statusHistory.length - 1;

          return (
            <div key={idx} className="relative flex flex-col items-start gap-1">
              {/* Connecting line */}
              {!isLast && (
                <div className={`absolute left-[-21px] top-6 w-[2px] h-[calc(100%+32px)] bg-slate-200`} />
              )}

              {/* Status Circle Node */}
              <div className={`absolute left-[-32px] top-0 p-1.5 rounded-full border-2 flex items-center justify-center ${meta.color}`}>
                <Icon className="h-4 w-4" />
              </div>

              {/* Text Description */}
              <span className="text-sm font-bold text-slate-800 capitalize">{meta.label}</span>
              <span className="text-xs text-slate-500 leading-relaxed max-w-sm">{meta.desc}</span>
              <span className="text-[10px] font-semibold text-slate-400 mt-1">
                {new Date(history.changedAt).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DonationTimeline;
