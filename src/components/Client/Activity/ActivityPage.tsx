import React, { useState } from 'react';
import { ClipboardList, Calendar, CheckCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useOrganization } from '../../../hooks/useOrganization';
import { useActivityManagement } from './hooks/useActivityManagement';
import { StocksTab } from './StocksTab';
import { PackagingTab } from './PackagingTab';
import { CashTab } from './CashTab';
import { SummaryTab } from './SummaryTab';
import { ActivityTab } from '../../../types/activity';
import { KenteLoader } from '../../ui/KenteLoader';
import { supabase } from '../../../lib/supabase';

export const ActivityPage: React. FC = () => {
  const { user } = useAuth();
  // ✅ CORRECTION ICI - utiliser organizationId et isLoading
  const { organizationId, isLoading: orgLoading } = useOrganization();
  const [activeTab, setActiveTab] = useState<ActivityTab>('stocks');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // organizationId est déjà une string, pas besoin de organization?. id
  
  const {
    sheet,
    stockLines,
    packaging,
    expenses,
    loading,
    error,
    syncing,
    calculations,
    handleUpdateStockLine,
    handleUpdatePackaging,
    handleAddExpense,
    handleDeleteExpense,
    handleCloseSheet,
    handleSyncDeliveries,
    handleChangeDate,
    reload,
  } = useActivityManagement({
    organizationId: organizationId || '',
    userId: user?.id || '',
    initialDate: selectedDate,
  });

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    handleChangeDate(newDate);
  };

  const navigateDate = (days: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    const newDate = current.toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    
    // Don't navigate beyond today's date
    if (newDate <= today) {
      setSelectedDate(newDate);
      handleChangeDate(newDate);
    }
  };

  const handleUpdateOpeningCash = async (amount: number): Promise<boolean> => {
    if (!sheet) return false;
    
    const { error } = await supabase
      .from('daily_sheets')
      .update({ opening_cash: amount })
      .eq('id', sheet.id);
      
    if (error) {
      console.error('Error updating opening cash:', error);
      return false;
    }
    
    await reload();
    return true;
  };

  if (loading || orgLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <KenteLoader />
      </div>
    );
  }

  if (!organizationId) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6 text-center">
          <XCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-amber-900 mb-2">Organisation requise</h3>
          <p className="text-amber-800">
            Vous devez appartenir à une organisation pour utiliser le module Gestion Activité.
          </p>
        </div>
      </div>
    );
  }

  if (error && !sheet) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-red-900 mb-2">Erreur</h3>
          <p className="text-red-800">{error}</p>
          <button
            onClick={reload}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  const tabs: { id: ActivityTab; label: string; badge?: number }[] = [
    { id: 'stocks', label: 'Ventes' },
    { id: 'packaging', label: 'Gestion Emballages', badge: calculations.packagingAlerts.length },
    { id: 'cash', label: 'Caisse' },
    { id: 'summary', label: 'Synthèse' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-20 lg:pb-6">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                <ClipboardList className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                  Gestion Activité
                </h1>
                <p className="text-sm text-slate-600">Cahier de suivi quotidien</p>
              </div>
            </div>
          </div>

          {/* Date selector and status */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* Date picker with navigation arrows */}
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-slate-400" />
                <button
                  onClick={() => navigateDate(-1)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Jour précédent"
                >
                  <ChevronLeft className="w-5 h-5 text-slate-600" />
                </button>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  max={new Date().toISOString().split('T')[0]}
                  className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
                <button
                  onClick={() => navigateDate(1)}
                  disabled={selectedDate >= new Date().toISOString().split('T')[0]}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                  title="Jour suivant"
                >
                  <ChevronRight className="w-5 h-5 text-slate-600" />
                </button>
              </div>

              {/* Status badge */}
              <div className="flex items-center gap-2">
                {sheet?.status === 'closed' ? (
                  <div className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-800 rounded-lg">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Journée clôturée</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-2 bg-amber-100 text-amber-800 rounded-lg">
                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                    <span className="text-sm font-medium">Journée en cours</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-2">
            <div className="grid grid-cols-4 gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    relative px-3 py-2 sm:px-4 sm:py-3 rounded-lg font-medium text-sm sm:text-base transition-colors
                    ${
                      activeTab === tab.id
                        ? 'bg-orange-500 text-white shadow-md'
                        : 'text-slate-600 hover:bg-slate-100'
                    }
                  `}
                >
                  {tab.label}
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Tab content */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
          {activeTab === 'stocks' && sheet && (
            <StocksTab
              stockLines={stockLines}
              dailySheetId={sheet.id}
              organizationId={organizationId || ''}
              isReadOnly={sheet?.status === 'closed'}
              syncing={syncing}
              onUpdateStockLine={handleUpdateStockLine}
              onSyncDeliveries={handleSyncDeliveries}
              onProductAdded={reload}
              onProductRemoved={reload}
            />
          )}

          {activeTab === 'packaging' && (
            <PackagingTab
              packaging={packaging}
              dailySheetId={sheet.id}
              isReadOnly={sheet?.status === 'closed'}
              onUpdatePackaging={handleUpdatePackaging}
              onPackagingSynced={reload}
            />
          )}

          {activeTab === 'cash' && (
            <CashTab
              sheet={sheet}
              expenses={expenses}
              calculations={calculations}
              isReadOnly={sheet?.status === 'closed'}
              onAddExpense={handleAddExpense}
              onDeleteExpense={handleDeleteExpense}
              onUpdateOpeningCash={handleUpdateOpeningCash}
            />
          )}

          {activeTab === 'summary' && (
            <SummaryTab
              sheet={sheet}
              stockLines={stockLines}
              packaging={packaging}
              expenses={expenses}
              calculations={calculations}
              isReadOnly={sheet?.status === 'closed'}
              onCloseSheet={handleCloseSheet}
              onReload={reload}
            />
          )}
        </div>
      </div>
    </div>
  );
};
