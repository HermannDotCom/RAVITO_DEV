import React, { useEffect, useState } from 'react';
import { Trophy, Star, TrendingUp, Award } from 'lucide-react';
import { gamificationService } from '../../services/gamificationService';
import type { UserProgression, UserLevel, UserRole } from '../../types';

interface ProgressionTrackerProps {
  userId: string;
  userRole: UserRole;
}

export const ProgressionTracker: React.FC<ProgressionTrackerProps> = ({
  userId,
  userRole
}) => {
  const [progression, setProgression] = useState<UserProgression | null>(null);
  const [currentLevel, setCurrentLevel] = useState<UserLevel | null>(null);
  const [nextLevel, setNextLevel] = useState<UserLevel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgression();
  }, [userId, userRole]);

  const loadProgression = async () => {
    setLoading(true);
    try {
      const prog = await gamificationService.getUserProgression(userId);
      setProgression(prog);

      if (prog) {
        const current = await gamificationService.getLevel(userRole, prog.currentLevel);
        setCurrentLevel(current);

        if (prog.currentLevel < 5) {
          const next = await gamificationService.getLevel(userRole, prog.currentLevel + 1);
          setNextLevel(next);
        }
      }
    } catch (error) {
      console.error('Error loading progression:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!progression || !currentLevel) {
    return null;
  }

  const isClient = userRole === 'client';
  const currentProgress = isClient ? progression.totalOrders : progression.totalCompletedOffers;
  const nextLevelRequirement = nextLevel ? (isClient ? nextLevel.minOrders : nextLevel.minCompletedOffers) : 0;
  const progressPercentage = nextLevel 
    ? Math.min(100, (currentProgress / nextLevelRequirement) * 100)
    : 100;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Trophy className="text-yellow-500" size={24} />
          Progression
        </h3>
        <div className="text-3xl">{currentLevel.badgeEmoji}</div>
      </div>

      {/* Current Level */}
      <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-sm text-gray-600">Niveau Actuel</p>
            <p className="text-2xl font-bold text-orange-600">{currentLevel.levelName}</p>
          </div>
          <div className="text-4xl">{currentLevel.badgeEmoji}</div>
        </div>
        <p className="text-sm text-gray-700">{currentLevel.description}</p>
      </div>

      {/* Progress Bar */}
      {nextLevel && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600">
              Progression vers {nextLevel.levelName}
            </span>
            <span className="font-semibold text-purple-600">
              {currentProgress} / {nextLevelRequirement}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-4 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
              style={{ width: `${progressPercentage}%` }}
            >
              {progressPercentage > 10 && (
                <span className="text-white text-xs font-bold">
                  {Math.round(progressPercentage)}%
                </span>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Plus que {nextLevelRequirement - currentProgress} {isClient ? 'commandes' : 'offres complétées'} pour débloquer le niveau suivant!
          </p>
        </div>
      )}

      {/* Current Perks */}
      <div className="bg-purple-50 rounded-lg p-4">
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <Award className="text-purple-600" size={20} />
          Avantages Actuels
        </h4>
        <ul className="space-y-2">
          {currentLevel.perks.map((perk, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
              <Star className="text-yellow-500 flex-shrink-0 mt-0.5" size={16} />
              <span>{perk}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Next Level Preview */}
      {nextLevel && (
        <div className="mt-4 border-t border-gray-200 pt-4">
          <h4 className="font-semibold mb-3 flex items-center gap-2 text-gray-700">
            <TrendingUp className="text-green-600" size={20} />
            Débloque au Niveau {nextLevel.levelNumber}
          </h4>
          <ul className="space-y-2">
            {nextLevel.perks.slice(0, 3).map((perk, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                <Star className="text-gray-400 flex-shrink-0 mt-0.5" size={16} />
                <span>{perk}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {progression.currentLevel === 5 && (
        <div className="mt-4 bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-lg p-4 text-center">
          <p className="font-bold">🏆 NIVEAU MAXIMUM ATTEINT!</p>
          <p className="text-sm mt-1">Tu es une légende de DISTRI-NIGHT!</p>
        </div>
      )}
    </div>
  );
};
