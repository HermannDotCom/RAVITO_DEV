import React from 'react';
import { Snowflake, XCircle } from 'lucide-react';
import { CustomerStatus } from '../../../../types/activity';

interface CustomerStatusBadgeProps {
  status: CustomerStatus;
  className?: string;
}

export const CustomerStatusBadge: React.FC<CustomerStatusBadgeProps> = ({
  status,
  className = '',
}) => {
  if (status === 'active') {
    return null; // Don't show badge for active customers
  }

  if (status === 'frozen') {
    return (
      <div className={`flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full ${className}`}>
        <Snowflake className="w-3 h-3" />
        <span>GELÉ</span>
      </div>
    );
  }

  if (status === 'disabled') {
    return (
      <div className={`flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full ${className}`}>
        <XCircle className="w-3 h-3" />
        <span>DÉSACTIVÉ</span>
      </div>
    );
  }

  return null;
};
