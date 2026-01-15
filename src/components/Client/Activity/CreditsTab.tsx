import React, { useState, useMemo } from 'react';
import { CreditCard, Plus, AlertCircle } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { CreditCustomer } from '../../../types/activity';
import { useCreditCustomers } from './hooks/useCreditCustomers';
import { useCreditTransactions } from './hooks/useCreditTransactions';
import { CreditKPIs } from './CreditsTab/CreditKPIs';
import { CustomerSearch } from './CreditsTab/CustomerSearch';
import { CustomerCard } from './CreditsTab/CustomerCard';
import { NewCustomerModal } from './CreditsTab/NewCustomerModal';
import { AddConsumptionModal } from './CreditsTab/AddConsumptionModal';
import { PaymentModal } from './CreditsTab/PaymentModal';
import { CustomerDetailsModal } from './CreditsTab/CustomerDetailsModal';

interface CreditsTabProps {
  organizationId: string;
  dailySheetId?: string;
  isReadOnly: boolean;
  onReload?: () => void;
}

export const CreditsTab: React.FC<CreditsTabProps> = ({
  organizationId,
  dailySheetId,
  isReadOnly,
  onReload,
}) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [showConsumptionModal, setShowConsumptionModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CreditCustomer | null>(null);

  const {
    customers,
    statistics,
    loading,
    error,
    reload,
    addCustomer,
  } = useCreditCustomers({ organizationId });

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-orange-600" />
          <h2 className="text-lg font-bold text-slate-900">Carnet de Crédit</h2>
        </div>
        <button
          onClick={() => setShowNewCustomerModal(true)}
          disabled={isReadOnly}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((customer) => (
            <CustomerCard
              key={customer.id}
              customer={customer}
              onAddConsumption={handleAddConsumption}
              onAddPayment={handleAddPayment}
              onViewDetails={handleViewDetails}
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
        />
      )}
    </div>
  );
};
