import React from 'react';
import { MapPin } from 'lucide-react';

interface WelcomeHeaderProps {
  userName: string;
  zone?: string;
}

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return { emoji: '🌅', greeting: 'Bonjour', message: 'Prêt pour les commandes du jour ?' };
  }
  if (hour >= 12 && hour < 18) {
    return { emoji: '☀️', greeting: 'Bon après-midi', message: 'Besoin de réapprovisionner ?' };
  }
  if (hour >= 18 && hour < 22) {
    return { emoji: '🌆', greeting: 'Bonsoir', message: 'La soirée commence !' };
  }
  return { emoji: '🌙', greeting: 'Bonne nuit', message: 'On est là 24h/24 !' };
};

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
