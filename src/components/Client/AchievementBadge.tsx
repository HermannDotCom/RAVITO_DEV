import React from 'react';
import { motion } from 'framer-motion';
import { Award, Lock } from 'lucide-react';
import { Achievement } from '../../services/achievementService';

interface AchievementBadgeProps {
  achievement: Achievement;
  isUnlocked: boolean;
  progress?: number;
}

export const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  achievement,
  isUnlocked,
  progress = 0
}) => {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`relative p-4 rounded-xl border-2 transition-all ${
        isUnlocked
          ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-400 shadow-lg'
          : 'bg-gray-50 border-gray-300 opacity-60'
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`h-12 w-12 rounded-full flex items-center justify-center text-2xl ${
            isUnlocked
              ? 'bg-gradient-to-br from-yellow-400 to-orange-500'
              : 'bg-gray-300'
          }`}
        >
          {isUnlocked ? achievement.icon : <Lock className="h-6 w-6 text-gray-600" />}
        </div>
        <div className="flex-1">
          <h3 className={`font-bold ${isUnlocked ? 'text-gray-900' : 'text-gray-600'}`}>
            {achievement.name}
          </h3>
          <p className={`text-sm ${isUnlocked ? 'text-gray-700' : 'text-gray-500'}`}>
            {achievement.description}
          </p>
          {isUnlocked && achievement.unlockedAt && (
            <p className="text-xs text-orange-600 mt-1">
              Débloqué le {achievement.unlockedAt.toLocaleDateString()}
            </p>
          )}
        </div>
        {isUnlocked && (
          <Award className="h-6 w-6 text-yellow-500" />
        )}
      </div>

      {!isUnlocked && progress > 0 && (
        <div className="mt-3">
          <div className="bg-gray-300 rounded-full h-2 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.5 }}
              className="bg-gradient-to-r from-orange-400 to-orange-600 h-full"
            />
          </div>
          <p className="text-xs text-gray-600 mt-1 text-center">
            {Math.round(progress * 100)}% complété
          </p>
        </div>
      )}
    </motion.div>
  );
};

interface AchievementListProps {
  achievements: Achievement[];
  unlockedAchievements: Achievement[];
}

export const AchievementList: React.FC<AchievementListProps> = ({
  achievements,
  unlockedAchievements
}) => {
  const unlockedIds = new Set(unlockedAchievements.map(a => a.id));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Vos Badges
        </h2>
        <div className="bg-orange-100 px-4 py-2 rounded-full">
          <span className="font-bold text-orange-900">
            {unlockedAchievements.length}/{achievements.length}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {achievements.map((achievement) => {
          const unlocked = unlockedAchievements.find(a => a.id === achievement.id);
          return (
            <AchievementBadge
              key={achievement.id}
              achievement={unlocked || achievement}
              isUnlocked={unlockedIds.has(achievement.id)}
            />
          );
        })}
      </div>
    </div>
  );
};
