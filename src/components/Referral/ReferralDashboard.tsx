import React, { useEffect, useState } from 'react';
import { Share2, Users, Gift, TrendingUp, Copy, CheckCircle } from 'lucide-react';
import { referralService } from '../../services/referralService';
import { gamificationService } from '../../services/gamificationService';
import type { ReferralCode, ReferralCredit, UserVIPStatus, VIPTier } from '../../types';

interface ReferralDashboardProps {
  userId: string;
  userName: string;
  userRole: 'client' | 'supplier';
}

export const ReferralDashboard: React.FC<ReferralDashboardProps> = ({
  userId,
  userName,
  userRole
}) => {
  const [referralCode, setReferralCode] = useState<ReferralCode | null>(null);
  const [credits, setCredits] = useState<ReferralCredit | null>(null);
  const [vipStatus, setVipStatus] = useState<{ status: UserVIPStatus | null; tier: VIPTier | null }>({ status: null, tier: null });
  const [stats, setStats] = useState({
    totalReferrals: 0,
    convertedReferrals: 0,
    pendingReferrals: 0,
    totalRewardsEarned: 0
  });
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load referral code
      let code = await referralService.getUserReferralCode(userId);
      if (!code) {
        code = await referralService.generateReferralCode(userId, userName, userRole);
      }
      setReferralCode(code);

      // Load credits
      const userCredits = await referralService.getUserCredits(userId);
      setCredits(userCredits);

      // Load VIP status
      const vip = await gamificationService.getUserVIPStatus(userId);
      setVipStatus(vip);

      // Load referral stats
      const referralStats = await referralService.getReferralStats(userId);
      setStats(referralStats);
    } catch (error) {
      console.error('Error loading referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralCode = () => {
    if (referralCode) {
      navigator.clipboard.writeText(referralCode.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareViaWhatsApp = () => {
    if (referralCode) {
      const message = referralService.generateWhatsAppMessage(userName, referralCode.code);
      window.open(`https://wa.me/?text=${message}`, '_blank');
    }
  };

  const shareViaSMS = () => {
    if (referralCode) {
      const message = referralService.generateSMSMessage(userName, referralCode.code);
      window.open(`sms:?body=${message}`, '_blank');
    }
  };

  const copyReferralLink = () => {
    if (referralCode) {
      const link = referralService.generateShareableLink(referralCode.code);
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const rewardAmount = userRole === 'client' ? '50,000' : '100,000';
  const welcomeAmount = userRole === 'client' ? '30,000' : '50,000';
  const nextVIPTier = vipStatus.tier ? vipStatus.tier.tierLevel + 1 : 2;
  const referralsToNextTier = nextVIPTier * 5 - (vipStatus.status?.successfulReferrals || 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">
              {userRole === 'client' ? '🎉 Programme "Amène Ta Squad"' : '🚀 Programme Partenariat Croissance'}
            </h2>
            <p className="text-purple-100">
              {userRole === 'client' 
                ? `Gagne ${rewardAmount} FCFA pour chaque ami qui s'inscrit et commande!`
                : `Gagne ${rewardAmount} FCFA + 3 mois -50% commission pour 2 partenaires recrutés!`
              }
            </p>
          </div>
          {vipStatus.tier && (
            <div className="text-center">
              <div className="text-4xl mb-1">{vipStatus.tier.badgeEmoji}</div>
              <div className="text-sm font-medium">{vipStatus.tier.tierName}</div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Crédit Disponible</p>
              <p className="text-2xl font-bold text-green-600">
                {(credits?.balance || 0).toLocaleString()} FCFA
              </p>
            </div>
            <Gift className="text-green-500" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Parrainages Réussis</p>
              <p className="text-2xl font-bold text-blue-600">{stats.convertedReferrals}</p>
            </div>
            <Users className="text-blue-500" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">En Attente</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pendingReferrals}</p>
            </div>
            <TrendingUp className="text-yellow-500" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Gagné</p>
              <p className="text-2xl font-bold text-purple-600">
                {stats.totalRewardsEarned.toLocaleString()} FCFA
              </p>
            </div>
            <Gift className="text-purple-500" size={32} />
          </div>
        </div>
      </div>

      {/* Referral Code Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Ton Code de Parrainage</h3>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <code className="text-xl font-mono font-bold text-purple-600">
              {referralCode?.code}
            </code>
            <button
              onClick={copyReferralCode}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              {copied ? (
                <>
                  <CheckCircle size={20} />
                  Copié!
                </>
              ) : (
                <>
                  <Copy size={20} />
                  Copier
                </>
              )}
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-gray-600 text-sm font-medium">Partager via:</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              onClick={shareViaWhatsApp}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <Share2 size={20} />
              WhatsApp
            </button>

            <button
              onClick={shareViaSMS}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Share2 size={20} />
              SMS
            </button>

            <button
              onClick={copyReferralLink}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
            >
              {copied ? <CheckCircle size={20} /> : <Share2 size={20} />}
              {copied ? 'Lien Copié!' : 'Copier le Lien'}
            </button>
          </div>
        </div>
      </div>

      {/* VIP Progress */}
      {userRole === 'client' && vipStatus.status && nextVIPTier <= 5 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Progression VIP</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                Plus que {referralsToNextTier} parrainages pour le niveau suivant
              </span>
              <span className="font-semibold text-purple-600">
                {vipStatus.status.successfulReferrals} / {nextVIPTier * 5}
              </span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-purple-500 to-indigo-500 h-3 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, (vipStatus.status.successfulReferrals / (nextVIPTier * 5)) * 100)}%`
                }}
              ></div>
            </div>

            {vipStatus.tier && (
              <div className="bg-purple-50 rounded-lg p-4 mt-4">
                <h4 className="font-semibold mb-2">Avantages Actuels:</h4>
                <ul className="space-y-1 text-sm text-gray-700">
                  {vipStatus.tier.commissionDiscountPercentage > 0 && (
                    <li>✨ {vipStatus.tier.commissionDiscountPercentage}% de réduction sur les commissions</li>
                  )}
                  {vipStatus.tier.priorityMatching && (
                    <li>⚡ Matching prioritaire avec les meilleurs fournisseurs</li>
                  )}
                  {vipStatus.tier.customPricing && (
                    <li>💎 Accès aux tarifs personnalisés</li>
                  )}
                  {vipStatus.tier.boardMembership && (
                    <li>👑 Membre du conseil consultatif</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* How it Works */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Comment ça marche?</h3>
        
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">
              1
            </div>
            <div>
              <h4 className="font-medium">Partage ton code</h4>
              <p className="text-gray-600 text-sm">
                Envoie ton code unique à tes amis via WhatsApp, SMS ou Instagram
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">
              2
            </div>
            <div>
              <h4 className="font-medium">Ils s'inscrivent</h4>
              <p className="text-gray-600 text-sm">
                Ton ami s'inscrit avec ton code et reçoit {welcomeAmount} FCFA de crédit gratuit
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">
              3
            </div>
            <div>
              <h4 className="font-medium">Tu gagnes!</h4>
              <p className="text-gray-600 text-sm">
                Dès sa première commande, tu reçois {rewardAmount} FCFA de crédit sur ton compte
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
