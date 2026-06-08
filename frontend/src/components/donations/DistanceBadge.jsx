import React from 'react';
import { MapPin } from 'lucide-react';

const DistanceBadge = ({ distance, className = '' }) => {
  if (distance === undefined || distance === null || isNaN(distance)) {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200 ${className}`}>
        <MapPin className="h-3.5 w-3.5" />
        Distance unavailable
      </span>
    );
  }
  
  // Format distance to 1 decimal place
  const formattedDistance = parseFloat(distance).toFixed(1);

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 ${className}`}>
      <MapPin className="h-3.5 w-3.5" />
      {formattedDistance} km away
    </span>
  );
};

export default DistanceBadge;
