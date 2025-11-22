import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, Award, TrendingUp } from 'lucide-react';
import { SmartSuggestions } from './SmartSuggestions';
import { SupplyHeatmap } from './SupplyHeatmap';
import { AIChatbot } from './AIChatbot';
import { AchievementList } from './AchievementBadge';
import { PersonalizedGreeting } from './PersonalizedGreeting';
import { useAuth } from '../../context/AuthContext';
import { ACHIEVEMENTS, getUserAchievements, Achievement } from '../../services/achievementService';

interface OrderMomentumDashboardProps {
  onNavigate: (section: string) => void;
  zoneId?: string;
}

export const OrderMomentumDashboard: React.FC<OrderMomentumDashboardProps> = ({ 
  onNavigate,
  zoneId 
}) => {
  const { user } = useAuth();
  const [showGreeting, setShowGreeting] = useState(true);
  const [unlockedAchievements, setUnlockedAchievements] = useState<Achievement[]>([]);
  const [activeTab, setActiveTab] = useState<'suggestions' | 'heatmap' | 'achievements'>('suggestions');

  useEffect(() => {
    if (user) {
      loadUserAchievements();
    }
  }, [user]); // loadUserAchievements is defined below and won't change

  const loadUserAchievements = async () => {
    if (!user) return;
    const achievements = await getUserAchievements(user.id);
    setUnlockedAchievements(achievements);
  };

  const tabs = [
    { id: 'suggestions' as const, label: 'Suggestions', icon: Zap },
    { id: 'heatmap' as const, label: 'Heatmap', icon: TrendingUp },
    { id: 'achievements' as const, label: 'Badges', icon: Award }
  ];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Personalized Greeting */}
      {showGreeting && (
        <PersonalizedGreeting 
          onClose={() => setShowGreeting(false)}
          autoHide={true}
        />
      )}

      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-orange-500 via-pink-500 to-purple-600 rounded-2xl p-8 text-white shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              OrderMomentum ⚡
            </h1>
            <p className="text-lg text-white text-opacity-90">
              Votre assistant intelligent de commande
            </p>
            <div className="mt-4 flex items-center gap-4">
              <div className="bg-white bg-opacity-20 px-4 py-2 rounded-full">
                <span className="font-semibold">{unlockedAchievements.length} badges débloqués</span>
              </div>
              <button
                onClick={() => onNavigate('catalog')}
                className="bg-white text-orange-600 px-6 py-2 rounded-full font-bold hover:bg-opacity-90 transition-all transform hover:scale-105"
              >
                Voir le catalogue
              </button>
            </div>
          </div>
          <motion.div
            animate={{ 
              rotate: [0, 10, -10, 10, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 5,
              ease: "easeInOut"
            }}
            className="text-8xl"
          >
            ⚡
          </motion.div>
        </div>
      </motion.div>

      {/* Tab Navigation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white rounded-xl shadow-lg p-2"
      >
        <div className="flex gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'suggestions' && (
          <SmartSuggestions zoneId={zoneId} />
        )}

        {activeTab === 'heatmap' && (
          <SupplyHeatmap />
        )}

        {activeTab === 'achievements' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <AchievementList
              achievements={ACHIEVEMENTS}
              unlockedAchievements={unlockedAchievements}
            />
          </div>
        )}
      </motion.div>

      {/* AI Chatbot - Always visible */}
      <AIChatbot />
    </div>
  );
};
