import React from 'react';
import { MapPin } from 'lucide-react';
import { getGreeting } from '../../../utils/greeting';

interface WelcomeHeaderProps {
  userName: string;
  zone?: string;
}

export const WelcomeHeader: React.FC<WelcomeHeaderProps> = ({ userName, zone }) => {
  const { emoji, greeting, message } = getGreeting();

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {emoji} {greeting}, {userName} !
          </h1>
          <p className="text-sm text-slate-600 mt-1">{message}</p>
        </div>
        {zone && (
          <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 rounded-lg border border-orange-100">
            <MapPin className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-medium text-orange-900">{zone}</span>
          </div>
        )}
      </div>
    </div>
  );
};
