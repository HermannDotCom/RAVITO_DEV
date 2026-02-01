import React, { useState, useMemo, useEffect } from 'react';
import { CreditCard, Plus, AlertCircle } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { CreditCustomer, CreditAlert, FreezeCustomerData, UpdateCustomerData } from '../../../types/activity';
import { useCreditCustomers } from './hooks/useCreditCustomers';
import { useCreditTransactions } from './hooks/useCreditTransactions';
import { useCreditAlerts } from './hooks/useCreditAlerts';
import { freezeCustomer, unfreezeCustomer, updateCustomerInfo, deleteCustomer } from '../../../services/creditService';
import { CreditKPIs } from './CreditsTab/CreditKPIs';
import { CustomerSearch } from './CreditsTab/CustomerSearch';
import { CustomerCard } from './CreditsTab/CustomerCard';
import { NewCustomerModal } from './CreditsTab/NewCustomerModal';
import { AddConsumptionModal } from './CreditsTab/AddConsumptionModal';
import { PaymentModal } from './CreditsTab/PaymentModal';
import { CustomerDetailsModal } from './CreditsTab/CustomerDetailsModal';
import { CreditAlerts } from './CreditsTab/CreditAlerts';
import { FreezeCustomerModal } from './CreditsTab/FreezeCustomerModal';
import { UnfreezeCustomerModal } from './CreditsTab/UnfreezeCustomerModal';
import { EditCustomerModal } from './CreditsTab/EditCustomerModal';

interface CreditsTabProps {
  organizationId: string;
  dailySheetId?: string;
  isReadOnly: boolean;
  onReload?: () => void;
  onAlertCountChange?: (count: number) => void;
  sheet?: {
    creditSales?: number;
    creditPayments?: number;
  };
}

export const CreditsTab: React.FC<CreditsTabProps> = ({
  organizationId,
  dailySheetId,
  isReadOnly,
  onReload,
  onAlertCountChange,
  sheet,
}) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [showConsumptionModal, setShowConsumptionModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showFreezeModal, setShowFreezeModal] = useState(false);
  const [showUnfreezeModal, setShowUnfreezeModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CreditCustomer | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<CreditAlert | null>(null);

  const {
    customers,
    statistics,
    loading,
    error,
    reload,
    addCustomer,
  } = useCreditCustomers({ organizationId });

  const {
    alerts,
    criticalCount,
    warningCount,
    totalAtRisk,
    loading: alertsLoading,
    error: alertsError,
    reload: reloadAlerts,
  } = useCreditAlerts({ organizationId });

  const {
    addConsumption,
    addPayment,
    loading: transactionLoading,
    error: transactionError,
  } = useCreditTransactions({
    organizationId,
    dailySheetId,
    userId: user?.id || '',
  });

  // Calculate credit variation
  const creditVariation = useMemo(() => {
    return (sheet?.creditPayments || 0) - (sheet?.creditSales || 0);
  }, [sheet?.creditPayments, sheet?.creditSales]);

  // Filter customers based on search term
  const filteredCustomers = useMemo(() => {
    if (!searchTerm.trim()) return customers;
    
    const term = searchTerm.toLowerCase();
    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(term) ||
        customer.phone?.toLowerCase().includes(term)
    );
  }, [customers, searchTerm]);

  // Notify parent of alert count changes
  useEffect(() => {
    if (onAlertCountChange) {
      const totalAlerts = criticalCount + warningCount;
      onAlertCountChange(totalAlerts);
    }
  }, [criticalCount, warningCount, onAlertCountChange]);

  const handleAddConsumption = (customer: CreditCustomer) => {
    setSelectedCustomer(customer);
    setShowConsumptionModal(true);
  };

  const handleAddPayment = (customer: CreditCustomer) => {
    setSelectedCustomer(customer);
    setShowPaymentModal(true);
  };

  const handleViewDetails = (customer: CreditCustomer) => {
    setSelectedCustomer(customer);
    setShowDetailsModal(true);
  };

  const handleConsumptionSubmit = async (data: any) => {
    const result = await addConsumption(data);
    if (result) {
      setShowConsumptionModal(false);
      setSelectedCustomer(null);
      await reload();
      if (onReload) await onReload();
      return true;
    }
    return false;
  };

  const handlePaymentSubmit = async (data: any) => {
    const result = await addPayment(data);
    if (result) {
      setShowPaymentModal(false);
      setSelectedCustomer(null);
      await reload();
      if (onReload) await onReload();
      return true;
    }
    return false;
  };

  const handleNewCustomerSubmit = async (data: any) => {
    const success = await addCustomer(data);
    if (success) {
      setShowNewCustomerModal(false);
      return true;
    }
    return false;
  };

  const handleFreezeFromAlert = (alert: CreditAlert) => {
    // Find the full customer from customers list
    const fullCustomer = customers.find(c => c.id === alert.id);
    if (fullCustomer) {
      setSelectedCustomer(fullCustomer);
      setShowFreezeModal(true);
    }
  };

  const handleCollectFromAlert = (alert: CreditAlert) => {
    const fullCustomer = customers.find(c => c.id === alert.id);
    if (fullCustomer) {
      handleAddPayment(fullCustomer);
    }
  };

  const handleFreezeCustomer = async (data: FreezeCustomerData) => {
    if (!selectedCustomer) return false;
    const result = await freezeCustomer(selectedCustomer.id, data);
    if (result.success) {
      await reload();
      await reloadAlerts();
      return true;
    }
    return false;
  };

  const handleUnfreezeCustomer = async (newLimit?: number) => {
    if (!selectedCustomer) return false;
    const result = await unfreezeCustomer(selectedCustomer.id, newLimit);
    if (result.success) {
      await reload();
      await reloadAlerts();
      setShowUnfreezeModal(false);
      setSelectedCustomer(null);
      return true;
    }
    return false;
  };

  const handleEditCustomer = async (data: UpdateCustomerData) => {
    if (!selectedCustomer) return false;
    const result = await updateCustomerInfo(selectedCustomer.id, data);
    if (result.error) {
      return false;
    }
    await reload();
    await reloadAlerts();
    return true;
  };

  const handleDeleteCustomer = async () => {
    if (!selectedCustomer) return false;
    const result = await deleteCustomer(selectedCustomer.id);
    if (result.success) {
      await reload();
      await reloadAlerts();
      return true;
    }
    return false;
  };

  const handleShowEdit = (customer: CreditCustomer) => {
    setSelectedCustomer(customer);
    setShowDetailsModal(false);
    setShowEditModal(true);
  };

  const handleUnfreeze = (customer: CreditCustomer) => {
    setSelectedCustomer(customer);
    setShowUnfreezeModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-orange-600" />
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">Carnet de Crédit</h2>
        </div>
        <button
          onClick={() => setShowNewCustomerModal(true)}
          disabled={isReadOnly}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm sm:text-base"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau Client</span>
        </button>
      </div>

      {/* KPIs */}
      <CreditKPIs
        totalCredit={statistics.totalCredit}
        customersWithBalance={statistics.customersWithBalance}
      />

      {/* Daily Recap Section */}
      {sheet && (sheet.creditPayments || sheet.creditSales) && (
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h3 className="text-base font-bold text-blue-900">📊 RÉCAPITULATIF DU JOUR</h3>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 sm:p-3 bg-white rounded-lg">
              <span className="text-sm text-slate-700">Remboursements reçus</span>
              <span className="font-bold text-green-600 text-sm sm:text-base">
                +{new Intl.NumberFormat('fr-FR').format(sheet.creditPayments || 0)} FCFA
              </span>
            </div>
            
            <div className="flex items-center justify-between p-2 sm:p-3 bg-white rounded-lg">
              <span className="text-sm text-slate-700">Nouveaux crédits</span>
              <span className="font-bold text-orange-600 text-sm sm:text-base">
                -{new Intl.NumberFormat('fr-FR').format(sheet.creditSales || 0)} FCFA
              </span>
            </div>
            
            <div className="h-px bg-blue-300 my-1"></div>
            
            <div className={`flex items-center justify-between p-2 sm:p-3 rounded-lg border-2 ${
              creditVariation >= 0
                ? 'bg-green-50 border-green-300'
                : 'bg-red-50 border-red-300'
            }`}>
              <div>
                <span className="text-sm font-bold text-slate-900">Variation crédits</span>
                <p className="text-xs text-slate-600 mt-0.5">(Impact sur la caisse)</p>
              </div>
              <span className={`font-bold text-base sm:text-lg ${
                creditVariation >= 0
                  ? 'text-green-700'
                  : 'text-red-700'
              }`}>
                {creditVariation > 0 ? '+' : ''}
                {new Intl.NumberFormat('fr-FR').format(creditVariation)} FCFA
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Alerts Section */}
      {!alertsLoading && alerts.length > 0 && (
        <CreditAlerts
          alerts={alerts}
          onCollect={handleCollectFromAlert}
          onFreeze={handleFreezeFromAlert}
          isReadOnly={isReadOnly}
        />
      )}

      {/* Search */}
      <CustomerSearch searchTerm={searchTerm} onSearchChange={setSearchTerm} />

      {/* Error Messages */}
      {(error || transactionError) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error || transactionError}</p>
          </div>
        </div>
      )}

      {/* Read-only notice */}
      {isReadOnly && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-amber-800">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">
              La journée est clôturée. Vous ne pouvez plus ajouter de consommations ou encaisser de règlements.
              Seule la consultation des détails est disponible.
            </p>
          </div>
        </div>
      )}

      {/* Customer List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-600">Chargement des clients...</p>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300">
          {searchTerm ? (
            <>
              <p className="text-slate-600 mb-2">Aucun client trouvé pour "{searchTerm}"</p>
              <button
                onClick={() => setSearchTerm('')}
                className="text-orange-600 hover:text-orange-700 font-medium text-sm"
              >
                Effacer la recherche
              </button>
            </>
          ) : (
            <>
              <p className="text-slate-600 mb-4">Aucun client à crédit enregistré</p>
              <button
                onClick={() => setShowNewCustomerModal(true)}
                disabled={isReadOnly}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Créer votre premier client
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filteredCustomers.map((customer) => (
            <CustomerCard
              key={customer.id}
              customer={customer}
              onAddConsumption={handleAddConsumption}
              onAddPayment={handleAddPayment}
              onViewDetails={handleViewDetails}
              onUnfreeze={handleUnfreeze}
              isReadOnly={isReadOnly}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showNewCustomerModal && (
        <NewCustomerModal
          onClose={() => setShowNewCustomerModal(false)}
          onSubmit={handleNewCustomerSubmit}
        />
      )}

      {showConsumptionModal && selectedCustomer && (
        <AddConsumptionModal
          customer={selectedCustomer}
          organizationId={organizationId}
          onClose={() => {
            setShowConsumptionModal(false);
            setSelectedCustomer(null);
          }}
          onSubmit={handleConsumptionSubmit}
        />
      )}

      {showPaymentModal && selectedCustomer && (
        <PaymentModal
          customer={selectedCustomer}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedCustomer(null);
          }}
          onSubmit={handlePaymentSubmit}
        />
      )}

      {showDetailsModal && selectedCustomer && (
        <CustomerDetailsModal
          customer={selectedCustomer}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedCustomer(null);
          }}
          onEdit={handleShowEdit}
        />
      )}

      {showFreezeModal && selectedCustomer && (
        <FreezeCustomerModal
          customer={selectedCustomer}
          onClose={() => {
            setShowFreezeModal(false);
            setSelectedCustomer(null);
          }}
          onSubmit={handleFreezeCustomer}
        />
      )}

      {showUnfreezeModal && selectedCustomer && (
        <UnfreezeCustomerModal
          customer={selectedCustomer}
          onClose={() => {
            setShowUnfreezeModal(false);
            setSelectedCustomer(null);
          }}
          onSubmit={handleUnfreezeCustomer}
        />
      )}

      {showEditModal && selectedCustomer && (
        <EditCustomerModal
          customer={selectedCustomer}
          onClose={() => {
            setShowEditModal(false);
            setSelectedCustomer(null);
          }}
          onSubmit={handleEditCustomer}
          onDelete={handleDeleteCustomer}
        />
      )}
    </div>
  );
};
