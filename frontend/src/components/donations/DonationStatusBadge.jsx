import React from 'react';
import Badge from '../ui/Badge.jsx';

const DonationStatusBadge = ({ status, className = '' }) => {
  const formatStatus = (statusString) => {
    if (!statusString) return 'Unknown';
    return statusString.charAt(0).toUpperCase() + statusString.slice(1);
  };

  return (
    <Badge status={status} className={className}>
      {formatStatus(status)}
    </Badge>
  );
};

export default DonationStatusBadge;
