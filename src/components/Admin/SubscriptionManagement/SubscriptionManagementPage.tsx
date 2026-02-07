import React, { useState, useEffect } from 'react';
import { CreditCard, Users, FileText, Settings, TrendingUp, Banknote } from 'lucide-react';
import { PlansTab } from './PlansTab';
import { SubscribersTab } from './SubscribersTab';
import { InvoicesTab } from './InvoicesTab';
import { PaymentsTab } from './PaymentsTab';
import { SettingsTab } from './SettingsTab';
import { getSubscriptionStats } from '../../../services/admin/subscriptionAdminService';
import type { SubscriptionStats } from '../../../types/subscription';
import { formatCurrency } from '../../../types/subscription';

type TabType = 'plans' | 'subscribers' | 'payments' | 'invoices' | 'settings';

export const SubscriptionManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('subscribers');
  const [stats, setStats] = useState<SubscriptionStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoadingStats(true);
      const data = await getSubscriptionStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const tabs = [
    { id: 'subscribers', name: 'Abonnes', icon: Users },
    { id: 'payments', name: 'Paiements', icon: Banknote },
    { id: 'invoices', name: 'Factures', icon: FileText },
    { id: 'plans', name: 'Plans', icon: CreditCard },
    { id: 'settings', name: 'Parametres', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestion des Abonnements</h1>
              <p className="text-sm text-gray-600 mt-1">Ravito Gestion</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          {!loadingStats && stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">{stats.totalSubscriptions}</div>
                    <div className="text-sm text-blue-100">Total Abonnés</div>
                  </div>
                  <Users className="w-8 h-8 text-blue-200" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
                    <div className="text-sm text-green-100">Actifs</div>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-200" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xl font-bold">{formatCurrency(stats.monthlyRecurringRevenue)}</div>
                    <div className="text-sm text-orange-100">MRR</div>
                  </div>
                  <CreditCard className="w-8 h-8 text-orange-200" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xl font-bold">{formatCurrency(stats.averageRevenuePerUser)}</div>
                    <div className="text-sm text-purple-100">ARPU</div>
                  </div>
                  <FileText className="w-8 h-8 text-purple-200" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 -mb-px">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`
                    flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${isActive
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'subscribers' && <SubscribersTab />}
        {activeTab === 'payments' && <PaymentsTab />}
        {activeTab === 'invoices' && <InvoicesTab />}
        {activeTab === 'plans' && <PlansTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </div>
    </div>
  );
};
