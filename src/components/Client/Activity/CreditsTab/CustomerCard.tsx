import React from 'react';
import { User, Phone, MapPin, Calendar, AlertTriangle, Plus, DollarSign, Eye, Unlock } from 'lucide-react';
import { CreditCustomer } from '../../../../types/activity';
import { CustomerStatusBadge } from './CustomerStatusBadge';

interface CustomerCardProps {
  customer: CreditCustomer;
  onAddConsumption: (customer: CreditCustomer) => void;
  onAddPayment: (customer: CreditCustomer) => void;
  onViewDetails: (customer: CreditCustomer) => void;
  onUnfreeze?: (customer: CreditCustomer) => void;
  isReadOnly: boolean;
}

export const CustomerCard: React.FC<CustomerCardProps> = ({
  customer,
  onAddConsumption,
  onAddPayment,
  onViewDetails,
  onUnfreeze,
  isReadOnly,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const isOverLimit = customer.creditLimit > 0 && customer.currentBalance > customer.creditLimit;
  const isFrozenOrDisabled = customer.status === 'frozen' || customer.status === 'disabled';

  return (
    <div className={`bg-white rounded-xl border-2 p-4 shadow-sm hover:shadow-md transition-shadow ${
      isOverLimit ? 'border-red-300 bg-red-50' : 
      isFrozenOrDisabled ? 'border-blue-300 bg-blue-50' :
      'border-slate-200'
    }`}>
      {/* Header with Alert Badge and Status Badge */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-1">
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-orange-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-slate-900">{customer.name}</h3>
            {customer.phone && (
              <div className="flex items-center gap-1 text-sm text-slate-600">
                <Phone className="w-3 h-3" />
                <span>{customer.phone}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-1 items-end">
          <CustomerStatusBadge status={customer.status} />
          {isOverLimit && (
            <div className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
              <AlertTriangle className="w-3 h-3" />
              <span>Plafond dépassé</span>
            </div>
          )}
        </div>
      </div>

      {/* Customer Info */}
      {customer.address && (
        <div className="flex items-center gap-1 text-sm text-slate-600 mb-2">
          <MapPin className="w-3 h-3" />
          <span className="truncate">{customer.address}</span>
        </div>
      )}

      {/* Balance Section */}
      <div className="bg-slate-50 rounded-lg p-3 mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-slate-600">Solde Dû:</span>
          <span className={`text-lg font-bold ${
            customer.currentBalance > 0 ? 'text-orange-600' : 'text-green-600'
          }`}>
            {formatCurrency(customer.currentBalance)} FCFA
          </span>
        </div>
        {customer.creditLimit > 0 && (
          <div className="text-xs text-slate-500">
            Plafond: {formatCurrency(customer.creditLimit)} FCFA
          </div>
        )}
        <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
          <Calendar className="w-3 h-3" />
          <span>Client depuis le {formatDate(customer.createdAt)}</span>
        </div>
      </div>

      {/* Frozen/Disabled Message */}
      {isFrozenOrDisabled && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mb-3">
          <p className="text-xs text-blue-800 text-center">
            {customer.status === 'frozen' 
              ? 'Crédit gelé - Doit régler avant nouvelle conso'
              : 'Crédit désactivé - Cash only'}
          </p>
          {customer.freezeReason && (
            <p className="text-xs text-blue-600 text-center mt-1">
              Motif: {customer.freezeReason}
            </p>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        {isFrozenOrDisabled ? (
          <>
            <button
              onClick={() => onAddPayment(customer)}
              disabled={isReadOnly}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <DollarSign className="w-4 h-4" />
              <span>Encaisser</span>
            </button>
            {onUnfreeze && customer.status !== 'disabled' && (
              <button
                onClick={() => onUnfreeze(customer)}
                disabled={isReadOnly}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Unlock className="w-4 h-4" />
                <span>Débloquer</span>
              </button>
            )}
            <button
              onClick={() => onViewDetails(customer)}
              className="flex items-center justify-center gap-1 px-3 py-2 bg-slate-500 text-white text-sm font-medium rounded-lg hover:bg-slate-600 transition-colors"
            >
              <Eye className="w-4 h-4" />
              <span>Détails</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => onAddConsumption(customer)}
              disabled={isReadOnly}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Conso</span>
            </button>
            <button
              onClick={() => onAddPayment(customer)}
              disabled={isReadOnly}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <DollarSign className="w-4 h-4" />
              <span>Encaisser</span>
            </button>
            <button
              onClick={() => onViewDetails(customer)}
              className="flex items-center justify-center gap-1 px-3 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Eye className="w-4 h-4" />
              <span>Détails</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};
