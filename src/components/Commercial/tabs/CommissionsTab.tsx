import React from 'react';
import { Calendar, Check } from 'lucide-react';
import type { CommissionEstimation, Period } from '../../../types/sales';
import { formatCurrency, formatPeriod, PAYMENT_STATUS_LABELS, PAYMENT_STATUS_COLORS } from '../../../types/sales';

interface CommissionsTabProps {
  commissionEstimation: CommissionEstimation | null;
  paymentHistory: any[];
  selectedPeriod: Period;
  isLoading: boolean;
}

export const CommissionsTab: React.FC<CommissionsTabProps> = ({
  commissionEstimation,
  paymentHistory,
  selectedPeriod,
  isLoading
}) => {
  if (isLoading || !commissionEstimation) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement des primes...</p>
        </div>
      </div>
    );
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">💰 MES PRIMES</h2>

      {/* Current estimation */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Calendar className="w-5 h-5 text-orange-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            📅 ESTIMATION {formatPeriod(selectedPeriod).toUpperCase()} (en cours)
          </h3>
        </div>

        <div className="space-y-4">
          {/* Prime inscriptions */}
          <div className="space-y-2">
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-gray-700">
                Prime CHR activés ({commissionEstimation.chrActivated} × {formatCurrency(commissionEstimation.primePerChr)})
              </span>
              <span className="font-semibold text-gray-900">
                {formatCurrency(commissionEstimation.primeChrTotal)}
              </span>
            </div>
            
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-gray-700">
                Prime Dépôts activés ({commissionEstimation.depotActivated} × {formatCurrency(commissionEstimation.primePerDepot)})
              </span>
              <span className="font-semibold text-gray-900">
                {formatCurrency(commissionEstimation.primeDepotTotal)}
              </span>
            </div>

            <div className="flex justify-between items-center py-2 bg-gray-50 px-3 rounded">
              <span className="font-medium text-gray-800">Sous-total primes inscription</span>
              <span className="font-bold text-gray-900">
                {formatCurrency(commissionEstimation.primeInscriptionsTotal)}
              </span>
            </div>
          </div>

          {/* Bonus objectives */}
          <div className="space-y-2 pt-2">
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-gray-700">
                Bonus objectif CHR {commissionEstimation.bonusChrObjective > 0 ? '✅' : '(pas encore)'}
              </span>
              <span className={`font-semibold ${commissionEstimation.bonusChrObjective > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                {formatCurrency(commissionEstimation.bonusChrObjective)}
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-gray-700">
                Bonus objectif Dépôts {commissionEstimation.bonusDepotObjective > 0 ? '✅' : '(pas encore)'}
              </span>
              <span className={`font-semibold ${commissionEstimation.bonusDepotObjective > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                {formatCurrency(commissionEstimation.bonusDepotObjective)}
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-gray-700">
                Bonus combiné {commissionEstimation.bonusCombined > 0 ? '✅' : '(pas encore)'}
              </span>
              <span className={`font-semibold ${commissionEstimation.bonusCombined > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                {formatCurrency(commissionEstimation.bonusCombined)}
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-gray-700">
                Bonus dépassement {commissionEstimation.bonusOvershoot > 0 ? '✅' : '(pas encore)'}
              </span>
              <span className={`font-semibold ${commissionEstimation.bonusOvershoot > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                {formatCurrency(commissionEstimation.bonusOvershoot)}
              </span>
            </div>

            <div className="flex justify-between items-center py-2 bg-gray-50 px-3 rounded">
              <span className="font-medium text-gray-800">Sous-total bonus</span>
              <span className="font-bold text-gray-900">
                {formatCurrency(commissionEstimation.bonusObjectivesTotal + commissionEstimation.bonusOvershoot)}
              </span>
            </div>
          </div>

          {/* Commission CA */}
          {commissionEstimation.commissionCa > 0 && (
            <div className="pt-2">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-700">Commission CA</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(commissionEstimation.commissionCa)}
                </span>
              </div>
            </div>
          )}

          {/* Total */}
          <div className="pt-4">
            <div className="flex justify-between items-center py-4 bg-gradient-to-r from-orange-100 to-green-100 px-4 rounded-lg border-2 border-orange-300">
              <span className="text-lg font-bold text-gray-900">💵 TOTAL ESTIMÉ</span>
              <span className="text-2xl font-bold text-gray-900">
                {formatCurrency(commissionEstimation.totalEstimated)}
              </span>
            </div>
          </div>

          {/* Payment info */}
          <div className="flex items-center space-x-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <span className="text-blue-600">ℹ️</span>
            <span className="text-sm text-blue-800">
              Versement prévu: <span className="font-semibold">{formatDate(commissionEstimation.estimatedPaymentDate)}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Payment History */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📜 HISTORIQUE DES PRIMES</h3>
        
        {paymentHistory.length > 0 ? (
          <div className="space-y-2">
            {paymentHistory.map((payment) => {
              const period = { year: payment.period_year, month: payment.period_month };
              const statusColor = PAYMENT_STATUS_COLORS[payment.status as keyof typeof PAYMENT_STATUS_COLORS];
              const statusLabel = PAYMENT_STATUS_LABELS[payment.status as keyof typeof PAYMENT_STATUS_LABELS];
              
              return (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {formatPeriod(period)}
                    </div>
                    {payment.paid_at && (
                      <div className="text-sm text-gray-600 mt-1">
                        Payé le {formatDate(new Date(payment.paid_at))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">
                        {formatCurrency(payment.total_amount)}
                      </div>
                    </div>
                    <div>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColor}`}>
                        {payment.status === 'paid' && <Check className="w-4 h-4 mr-1" />}
                        {statusLabel}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📭</div>
            <p>Aucun historique de paiement disponible</p>
          </div>
        )}
      </div>

      {/* Info box */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
        <h4 className="font-semibold text-blue-900 mb-2">💡 Comment sont calculées les primes ?</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Prime par CHR/Dépôt activé selon critères</li>
          <li>• Bonus si objectifs atteints (bonus combiné si les 2)</li>
          <li>• Bonus dépassement si &gt; 110% des objectifs</li>
          <li>• Bonus spécial pour le meilleur commercial du mois</li>
        </ul>
      </div>
    </div>
  );
};