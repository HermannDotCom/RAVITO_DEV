/**
 * Subscription Tier Selection Component
 * 
 * Allows suppliers to view and upgrade their subscription tier
 */

import React, { useState, useEffect } from 'react';
import { Check, Crown, Award, Target, Zap, X } from 'lucide-react';
import { SubscriptionService } from '../../services/subscriptionService';
import type { SubscriptionTier } from '../../types/intelligence';
import { KenteLoader } from '../ui/KenteLoader';

interface SubscriptionManagementProps {
  supplierId: string;
  onClose?: () => void;
}

export const SubscriptionManagement: React.FC<SubscriptionManagementProps> = ({
  supplierId,
  onClose
}) => {
  const [loading, setLoading] = useState(true);
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load all tiers
      const tiersData = await SubscriptionService.getAllTiers();
      setTiers(tiersData);

      // Load current subscription
      const subData = await SubscriptionService.getSupplierSubscriptionWithTier(supplierId);
      if (subData) {
        setCurrentSubscription(subData);
      }
    } catch (error) {
      console.error('Error loading subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (tierName: string) => {
    try {
      setUpgrading(true);
      
      await SubscriptionService.upgradeSubscription(supplierId, {
        tierName: tierName as any,
        paymentMethod: 'orange', // In production, this would come from a payment form
        autoRenew: true
      });

      alert('Subscription upgraded successfully!');
      loadData(); // Reload data
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      alert('Failed to upgrade subscription. Please try again.');
    } finally {
      setUpgrading(false);
      setSelectedTier(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <KenteLoader size="md" text="Chargement..." />
      </div>
    );
  }

  const currentTierName = currentSubscription?.tier?.tierName || 'FREE';

  const tierIcons = {
    FREE: Target,
    SILVER: Award,
    GOLD: Crown,
    PLATINUM: Zap
  };

  const tierColors = {
    FREE: 'gray',
    SILVER: 'slate',
    GOLD: 'yellow',
    PLATINUM: 'purple'
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Subscription Plans</h1>
          <p className="text-gray-600 mt-1">Choose the plan that's right for your business</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-6 w-6 text-gray-600" />
          </button>
        )}
      </div>

      {/* Current Subscription Banner */}
      {currentSubscription?.subscription && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                {React.createElement(tierIcons[currentTierName as keyof typeof tierIcons], {
                  className: 'h-5 w-5 text-white'
                })}
              </div>
              <div>
                <div className="font-semibold text-gray-900">
                  Current Plan: {currentTierName}
                </div>
                <div className="text-sm text-gray-600">
                  {currentSubscription.subscription.expiresAt && (
                    <>Renews on {new Date(currentSubscription.subscription.expiresAt).toLocaleDateString()}</>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {currentSubscription.tier.monthlyPrice.toLocaleString()} FCFA
              </div>
              <div className="text-sm text-gray-600">per month</div>
            </div>
          </div>
        </div>
      )}

      {/* Tier Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {tiers.map((tier) => {
          const TierIcon = tierIcons[tier.tierName as keyof typeof tierIcons];
          const colorScheme = tierColors[tier.tierName as keyof typeof tierColors];
          const isCurrent = tier.tierName === currentTierName;
          const isPopular = tier.tierName === 'GOLD';

          return (
            <div
              key={tier.id}
              className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all ${
                isCurrent
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : isPopular
                  ? 'border-orange-500'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Popular Badge */}
              {isPopular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </div>
                </div>
              )}

              {/* Current Badge */}
              {isCurrent && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Current Plan
                  </div>
                </div>
              )}

              <div className="p-6">
                {/* Tier Header */}
                <div className="text-center mb-6">
                  <div className={`inline-flex items-center justify-center w-16 h-16 bg-${colorScheme}-100 rounded-full mb-4`}>
                    <TierIcon className={`h-8 w-8 text-${colorScheme}-600`} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{tier.tierName}</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-900">
                      {tier.monthlyPrice === 0 ? 'Free' : `${tier.monthlyPrice.toLocaleString()}`}
                    </span>
                    {tier.monthlyPrice > 0 && (
                      <span className="text-gray-600 text-sm ml-2">FCFA/month</span>
                    )}
                  </div>
                </div>

                {/* Features List */}
                <ul className="space-y-3 mb-6">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Limits Info */}
                {tier.limits && Object.keys(tier.limits).length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-6">
                    <div className="text-xs text-gray-600 space-y-1">
                      {tier.limits.reports && (
                        <div>Reports: {tier.limits.reports}</div>
                      )}
                      {tier.limits.api_calls && (
                        <div>API Calls: {tier.limits.api_calls}</div>
                      )}
                      {tier.limits.data_retention_days && (
                        <div>Data Retention: {tier.limits.data_retention_days} days</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Button */}
                {isCurrent ? (
                  <button
                    disabled
                    className="w-full py-3 px-4 bg-gray-100 text-gray-500 rounded-lg font-semibold cursor-not-allowed"
                  >
                    Current Plan
                  </button>
                ) : tier.monthlyPrice === 0 ? (
                  <button
                    disabled
                    className="w-full py-3 px-4 bg-gray-100 text-gray-500 rounded-lg font-semibold cursor-not-allowed"
                  >
                    Free Forever
                  </button>
                ) : (
                  <button
                    onClick={() => setSelectedTier(tier.tierName)}
                    disabled={upgrading}
                    className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                      isPopular
                        ? 'bg-orange-600 text-white hover:bg-orange-700'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                  >
                    {upgrading ? 'Processing...' : 'Upgrade Now'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirmation Modal */}
      {selectedTier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Confirm Upgrade</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to upgrade to the <strong>{selectedTier}</strong> tier?
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="text-sm text-gray-700 mb-2">
                <strong>Note:</strong> In production, this would:
              </div>
              <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li>Process payment via Orange Money/MTN Mobile Money</li>
                <li>Activate premium features immediately</li>
                <li>Send confirmation email</li>
                <li>Set up auto-renewal</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedTier(null)}
                disabled={upgrading}
                className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpgrade(selectedTier)}
                disabled={upgrading}
                className="flex-1 py-2 px-4 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors disabled:opacity-50"
              >
                {upgrading ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAQ Section */}
      <div className="mt-12 bg-gray-50 rounded-xl p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Can I cancel anytime?</h3>
            <p className="text-gray-600">
              Yes, you can cancel your subscription at any time. You'll retain access until the end of your billing period.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">What payment methods do you accept?</h3>
            <p className="text-gray-600">
              We accept Orange Money, MTN Mobile Money, Moov Money, and Wave.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Is my data secure?</h3>
            <p className="text-gray-600">
              Absolutely. All analytics data is encrypted and stored securely. We never share your data with competitors.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Can I upgrade or downgrade later?</h3>
            <p className="text-gray-600">
              Yes, you can change your plan at any time. Upgrades take effect immediately, while downgrades take effect at the end of your billing period.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
