import React from 'react';
import { AlertCircle, AlertTriangle, Phone, DollarSign, Snowflake } from 'lucide-react';
import { CreditAlert } from '../../../../types/activity';

interface CreditAlertsProps {
  alerts: CreditAlert[];
  onCollect: (alert: CreditAlert) => void;
  onFreeze: (alert: CreditAlert) => void;
  isReadOnly: boolean;
}

export const CreditAlerts: React.FC<CreditAlertsProps> = ({
  alerts,
  onCollect,
  onFreeze,
  isReadOnly,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-red-600" />
        <h3 className="text-lg font-bold text-red-900">
          ALERTES ({alerts.length})
        </h3>
      </div>

      <div className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="bg-white rounded-lg p-4 border-2 border-red-200"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2 flex-1">
                {alert.alertLevel === 'critical' ? (
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <h4 className="font-bold text-slate-900">{alert.name}</h4>
                  <p className="text-sm text-slate-600">
                    {formatCurrency(alert.currentBalance)} FCFA
                  </p>
                </div>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                alert.alertLevel === 'critical'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-orange-100 text-orange-700'
              }`}>
                {alert.daysSincePayment} jours
              </div>
            </div>

            <p className="text-sm text-slate-700 mb-3">
              {alert.lastPaymentDate
                ? `Aucun règlement depuis ${alert.daysSincePayment} jours`
                : `Aucun règlement depuis la création (${alert.daysSincePayment} jours)`}
            </p>

            <div className="flex gap-2 flex-wrap">
              {alert.phone && (
                <a
                  href={`tel:${alert.phone}`}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  <span>Appeler</span>
                </a>
              )}
              <button
                onClick={() => onCollect(alert)}
                disabled={isReadOnly}
                className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <DollarSign className="w-4 h-4" />
                <span>Encaisser</span>
              </button>
              {alert.status === 'active' && (
                <button
                  onClick={() => onFreeze(alert)}
                  disabled={isReadOnly}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Snowflake className="w-4 h-4" />
                  <span>Geler crédit</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
