import React, { useEffect, useState } from 'react';
import { Award, Share2, Lock } from 'lucide-react';
import { gamificationService } from '../../services/gamificationService';
import { viralMetricsService } from '../../services/viralMetricsService';
import type { Achievement, UserAchievement, UserRole } from '../../types';

interface BadgeDisplayProps {
  userId: string;
  userRole: UserRole;
}

export const BadgeDisplay: React.FC<BadgeDisplayProps> = ({ userId, userRole }) => {
  const [userAchievements, setUserAchievements] = useState<Array<UserAchievement & { achievement: Achievement }>>([]);
  const [availableAchievements, setAvailableAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);

  useEffect(() => {
    loadAchievements();
  }, [userId, userRole]);

  const loadAchievements = async () => {
    setLoading(true);
    try {
      const unlocked = await gamificationService.getUserAchievements(userId);
      setUserAchievements(unlocked);

      const all = await gamificationService.getAchievements(userRole);
      setAvailableAchievements(all);
    } catch (error) {
      console.error('Error loading achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const isUnlocked = (achievementId: string): boolean => {
    return userAchievements.some(ua => ua.achievement.id === achievementId);
  };

  const shareAchievement = async (achievement: Achievement) => {
    setSelectedAchievement(achievement);
    setShareModalOpen(true);
  };

  const shareViaWhatsApp = async (achievement: Achievement) => {
    if (!achievement.shareMessage) return;

    const message = encodeURIComponent(achievement.shareMessage.replace('{name}', 'Moi'));
    window.open(`https://wa.me/?text=${message}`, '_blank');

    // Record share
    await viralMetricsService.recordSocialShare(
      userId,
      'achievement',
      'whatsapp',
      achievement.achievementKey,
      achievement.id
    );

    // Update share count
    const userAchievement = userAchievements.find(ua => ua.achievement.id === achievement.id);
    if (userAchievement) {
      await gamificationService.recordAchievementShare(userId, achievement.id);
    }

    setShareModalOpen(false);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const unlockedCount = userAchievements.length;
  const totalCount = availableAchievements.length;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Award className="text-purple-600" size={24} />
          Badges & Achievements
        </h3>
        <span className="text-sm font-medium text-purple-600">
          {unlockedCount} / {totalCount}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
          ></div>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          {Math.round((unlockedCount / totalCount) * 100)}% complété
        </p>
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {availableAchievements.map((achievement) => {
          const unlocked = isUnlocked(achievement.id);
          const userAch = userAchievements.find(ua => ua.achievement.id === achievement.id);

          return (
            <div
              key={achievement.id}
              className={`relative rounded-lg p-4 text-center transition-all ${
                unlocked
                  ? 'bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 hover:shadow-lg cursor-pointer'
                  : 'bg-gray-50 border-2 border-gray-200 opacity-60'
              }`}
              onClick={() => unlocked && shareAchievement(achievement)}
            >
              {/* Badge Icon */}
              <div className="text-5xl mb-2">
                {unlocked ? achievement.badgeEmoji : '🔒'}
              </div>

              {/* Achievement Name */}
              <p className={`font-semibold text-sm mb-1 ${
                unlocked ? 'text-purple-900' : 'text-gray-500'
              }`}>
                {achievement.name}
              </p>

              {/* Description */}
              <p className={`text-xs ${
                unlocked ? 'text-purple-600' : 'text-gray-400'
              }`}>
                {achievement.description}
              </p>

              {/* Unlocked Date */}
              {unlocked && userAch && (
                <p className="text-xs text-gray-500 mt-2">
                  Débloqué {new Date(userAch.unlockedAt).toLocaleDateString('fr-FR', { 
                    day: 'numeric',
                    month: 'short'
                  })}
                </p>
              )}

              {/* Share Button */}
              {unlocked && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    shareAchievement(achievement);
                  }}
                  className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-sm hover:shadow-md transition-shadow"
                >
                  <Share2 size={14} className="text-purple-600" />
                </button>
              )}

              {/* Lock Icon for Locked */}
              {!unlocked && (
                <div className="absolute top-2 right-2 p-1 bg-gray-200 rounded-full">
                  <Lock size={14} className="text-gray-500" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Share Modal */}
      {shareModalOpen && selectedAchievement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4 text-center">
              Partager ton Achievement! 🎉
            </h3>

            <div className="text-center mb-6">
              <div className="text-6xl mb-3">{selectedAchievement.badgeEmoji}</div>
              <p className="font-semibold text-lg text-purple-900">
                {selectedAchievement.name}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                {selectedAchievement.description}
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => shareViaWhatsApp(selectedAchievement)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                <Share2 size={20} />
                Partager sur WhatsApp
              </button>

              <button
                onClick={() => setShareModalOpen(false)}
                className="w-full px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {unlockedCount === 0 && (
        <div className="mt-6 text-center py-8 text-gray-400">
          <Award size={48} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">
            Continue à utiliser DISTRI-NIGHT pour débloquer des badges!
          </p>
        </div>
      )}
    </div>
  );
};
