import React, { useEffect, useState } from 'react';
import { Trophy, Medal, Crown, Star } from 'lucide-react';
import { gamificationService } from '../../services/gamificationService';

export const LeaderboardView: React.FC = () => {
  const [topReferrers, setTopReferrers] = useState<Array<{
    userId: string;
    name: string;
    totalReferrals: number;
    convertedReferrals: number;
    rank: number;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const leaders = await gamificationService.getTopReferrersLeaderboard(10);
      setTopReferrers(leaders);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="text-yellow-500" size={24} />;
      case 2:
        return <Medal className="text-gray-400" size={24} />;
      case 3:
        return <Medal className="text-orange-400" size={24} />;
      default:
        return <Star className="text-purple-400" size={20} />;
    }
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white';
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-400 text-white';
      case 3:
        return 'bg-gradient-to-r from-orange-300 to-orange-400 text-white';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Trophy className="text-yellow-500" size={24} />
          Top Parraineurs du Mois
        </h3>
      </div>

      {topReferrers.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <Trophy size={48} className="mx-auto mb-2 opacity-50" />
          <p>Sois le premier sur le leaderboard!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {topReferrers.map((leader) => (
            <div
              key={leader.userId}
              className={`flex items-center gap-4 p-4 rounded-lg transition-all ${
                leader.rank <= 3 
                  ? `${getRankBadge(leader.rank)} shadow-md`
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              {/* Rank */}
              <div className="flex-shrink-0 w-12 flex items-center justify-center">
                {leader.rank <= 3 ? (
                  getRankIcon(leader.rank)
                ) : (
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <span className="text-sm font-bold text-purple-600">#{leader.rank}</span>
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <p className={`font-semibold truncate ${
                  leader.rank <= 3 ? 'text-white' : 'text-gray-900'
                }`}>
                  {leader.name}
                </p>
                <p className={`text-sm ${
                  leader.rank <= 3 ? 'text-white/90' : 'text-gray-500'
                }`}>
                  {leader.convertedReferrals} parrainages réussis
                </p>
              </div>

              {/* Score Badge */}
              <div className={`flex-shrink-0 px-3 py-1 rounded-full ${
                leader.rank <= 3 
                  ? 'bg-white/20 backdrop-blur-sm'
                  : 'bg-purple-100'
              }`}>
                <span className={`text-sm font-bold ${
                  leader.rank <= 3 ? 'text-white' : 'text-purple-600'
                }`}>
                  {leader.totalReferrals}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-gray-200 text-center">
        <p className="text-sm text-gray-600">
          🎯 Parraine des amis pour grimper dans le classement!
        </p>
      </div>
    </div>
  );
};
