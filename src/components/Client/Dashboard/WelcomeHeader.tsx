import React from 'react';
import { MapPin, Sparkles } from 'lucide-react';

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

  const getTimeOfDayIcon = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '☀️';
    if (hour < 18) return '🌤️';
    return '🌙';
  };

  return (
    <div className="relative overflow-hidden bg-white border border-slate-200 rounded-3xl p-6 md:p-8">
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-orange-50 to-orange-100 rounded-full -mr-32 -mt-32 opacity-50" />
      <div className="relative">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">{getTimeOfDayIcon()}</span>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                  {getGreeting()}, {userName}
                </h1>
                <p className="text-slate-600 text-sm md:text-base mt-1">
                  Prêt à passer commande?
                </p>
              </div>
            </div>
            {zone && (
              <div className="inline-flex items-center gap-2 mt-4 px-3 py-1.5 bg-orange-50 border border-orange-100 rounded-full">
                <MapPin className="h-3.5 w-3.5 text-orange-600" />
                <span className="text-sm font-medium text-orange-900">{zone}</span>
              </div>
            )}
          </div>
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-full">
            <Sparkles className="h-4 w-4 text-emerald-600" />
            <span className="text-sm font-semibold text-emerald-900">Disponible 24/7</span>
          </div>
        </div>
      </div>
    </div>
  );
};
