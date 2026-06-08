import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

const TimeRemainingBadge = ({ expiryDate, className = '' }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(expiryDate) - new Date();
      
      if (difference <= 0) {
        setTimeLeft('Expired');
        setIsExpired(true);
        return;
      }

      setIsExpired(false);
      
      const mins = Math.floor(difference / 1000 / 60);
      const hours = Math.floor(mins / 60);
      const days = Math.floor(hours / 24);

      if (days > 0) {
        setTimeLeft(`${days} day${days > 1 ? 's' : ''} left`);
      } else if (hours > 0) {
        setTimeLeft(`${hours} hr${hours > 1 ? 's' : ''} left`);
      } else {
        setTimeLeft(`${mins} min${mins > 1 ? 's' : ''} left`);
      }
    };

    calculateTimeLeft();
    
    // Refresh countdown every minute
    const timer = setInterval(calculateTimeLeft, 60000);
    return () => clearInterval(timer);
  }, [expiryDate]);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border shadow-sm ${
        isExpired
          ? 'bg-red-50 text-red-700 border-red-150'
          : 'bg-emerald-50 text-emerald-700 border-emerald-150'
      } ${className}`}
    >
      <Clock className="h-3.5 w-3.5" />
      {timeLeft}
    </span>
  );
};

export default TimeRemainingBadge;
