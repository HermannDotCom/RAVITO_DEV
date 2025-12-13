import React from 'react';
import { MapPin } from 'lucide-react';

interface WelcomeHeaderProps {
  userName: string;
  zone?: string;
}

export const WelcomeHeader: React.FC<WelcomeHeaderProps> = ({ userName, zone }) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  return (
    <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            {getGreeting()}, {userName}! 👋
          </h1>
          <p className="text-orange-100 text-sm md:text-base">
            Bienvenue sur votre tableau de bord
          </p>
          {zone && (
            <div className="flex items-center gap-2 mt-3 text-orange-100">
              <MapPin className="h-4 w-4" />
              <span className="text-sm">{zone}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
