import React from 'react';
import { Clock } from 'lucide-react';
import type { CommercialActivityStats, SalesCommissionSettings } from '../../../types/sales';
import { formatCurrency } from '../../../types/sales';

interface ObjectivesTabProps {
  stats: CommercialActivityStats | null;
  settings: SalesCommissionSettings | null;
  isLoading: boolean;
}

export const ObjectivesTab: React.FC<ObjectivesTabProps> = ({ stats, settings, isLoading }) => {
  if (isLoading || !stats || !settings) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement des objectifs...</p>
        </div>
      </div>
    );
  }

  const chrPercentage = stats.percentObjectiveChr;
  const depotPercentage = stats.percentObjectiveDepots;
  const globalPercentage = stats.objectiveChr + stats.objectiveDepots > 0
    ? Math.round(((stats.chrActivated + stats.depotActivated) / (stats.objectiveChr + stats.objectiveDepots)) * 100)
    : 0;

  const getChrMessage = () => {
    if (chrPercentage >= 100) {
      return {
        emoji: '🎉',
        text: 'Objectif atteint ! Bravo !',
        color: 'text-green-600'
      };
    } else if (chrPercentage >= 80) {
      return {
        emoji: '✅',
        text: `Objectif atteignable ! Il te reste ${stats.chrRemaining} CHR à activer`,
        detail: stats.daysLeftInMonth > 0 ? `Soit ~${(stats.chrRemaining / stats.daysLeftInMonth).toFixed(1)} par jour` : '',
        color: 'text-blue-600'
      };
    } else {
      return {
        emoji: '💪',
        text: `Il te reste ${stats.chrRemaining} CHR à activer`,
        detail: stats.daysLeftInMonth > 0 ? `Soit ~${(stats.chrRemaining / stats.daysLeftInMonth).toFixed(1)} par jour` : '',
        color: 'text-orange-600'
      };
    }
  };

  const getDepotMessage = () => {
    if (depotPercentage >= 100) {
      return {
        emoji: '🎉',
        text: 'Objectif dépassé ! Bonus dépassement en vue !',
        color: 'text-green-600'
      };
    } else if (depotPercentage >= 80) {
      return {
        emoji: '✅',
        text: `Plus que ${stats.depotRemaining} dépôt${stats.depotRemaining > 1 ? 's' : ''} !`,
        detail: `Un dépôt s'active après ${settings.depotActivationDeliveries} livraisons`,
        color: 'text-blue-600'
      };
    } else {
      return {
        emoji: '💪',
        text: `Il te reste ${stats.depotRemaining} dépôt${stats.depotRemaining > 1 ? 's' : ''} à activer`,
        detail: `Un dépôt s'active après ${settings.depotActivationDeliveries} livraisons`,
        color: 'text-orange-600'
      };
    }
  };

  const chrMessage = getChrMessage();
  const depotMessage = getDepotMessage();

  return (
    <div className="space-y-6">
      {/* Month info */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            🎯 MES OBJECTIFS
          </h2>
          <div className="flex items-center space-x-2 text-gray-600">
            <Clock className="w-5 h-5" />
            <span className="font-medium">
              {stats.daysLeftInMonth} jour{stats.daysLeftInMonth > 1 ? 's' : ''} restant{stats.daysLeftInMonth > 1 ? 's' : ''} ce mois
            </span>
          </div>
        </div>
      </div>

      {/* CHR Objective */}
      {stats.objectiveChr > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">CLIENTS CHR</h3>
          
          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Progression</span>
              <span className="text-lg font-bold text-gray-900">
                {stats.chrActivated}/{stats.objectiveChr} ({chrPercentage}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  chrPercentage >= 100 ? 'bg-green-600' :
                  chrPercentage >= 80 ? 'bg-blue-600' : 'bg-orange-600'
                }`}
                style={{ width: `${Math.min(100, chrPercentage)}%` }}
              />
            </div>
          </div>

          {/* Message */}
          <div className={`flex items-start space-x-3 p-4 rounded-lg ${
            chrPercentage >= 100 ? 'bg-green-50' :
            chrPercentage >= 80 ? 'bg-blue-50' : 'bg-orange-50'
          }`}>
            <span className="text-2xl">{chrMessage.emoji}</span>
            <div className="flex-1">
              <p className={`font-medium ${chrMessage.color}`}>
                {chrMessage.text}
              </p>
              {chrMessage.detail && (
                <p className="text-sm text-gray-600 mt-1">
                  {chrMessage.detail}
                </p>
              )}
            </div>
          </div>

          {/* Activation info */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Critère d'activation CHR:</span>{' '}
              CA cumulé ≥ {formatCurrency(settings.chrActivationThreshold)}
            </p>
          </div>
        </div>
      )}

      {/* Depot Objective */}
      {stats.objectiveDepots > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">DÉPÔTS</h3>
          
          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Progression</span>
              <span className="text-lg font-bold text-gray-900">
                {stats.depotActivated}/{stats.objectiveDepots} ({depotPercentage}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  depotPercentage >= 100 ? 'bg-green-600' :
                  depotPercentage >= 80 ? 'bg-blue-600' : 'bg-orange-600'
                }`}
                style={{ width: `${Math.min(100, depotPercentage)}%` }}
              />
            </div>
          </div>

          {/* Message */}
          <div className={`flex items-start space-x-3 p-4 rounded-lg ${
            depotPercentage >= 100 ? 'bg-green-50' :
            depotPercentage >= 80 ? 'bg-blue-50' : 'bg-orange-50'
          }`}>
            <span className="text-2xl">{depotMessage.emoji}</span>
            <div className="flex-1">
              <p className={`font-medium ${depotMessage.color}`}>
                {depotMessage.text}
              </p>
              {depotMessage.detail && (
                <p className="text-sm text-gray-600 mt-1">
                  {depotMessage.detail}
                </p>
              )}
            </div>
          </div>

          {/* Activation info */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Critère d'activation Dépôt:</span>{' '}
              {settings.depotActivationDeliveries} livraisons effectuées minimum
            </p>
          </div>
        </div>
      )}

      {/* Global progress */}
      {stats.objectiveChr > 0 && stats.objectiveDepots > 0 && (
        <div className="bg-gradient-to-r from-orange-50 to-green-50 rounded-lg border border-orange-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">📊 Progression globale</h3>
              <p className="text-gray-600 mt-1">
                {globalPercentage >= 100 ? (
                  <span className="text-green-600 font-medium">Objectifs combinés atteints ! 🎉</span>
                ) : globalPercentage >= 80 ? (
                  <span className="text-blue-600 font-medium">Objectif combiné possible !</span>
                ) : (
                  <span className="text-gray-700">Continue tes efforts !</span>
                )}
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-gray-900">{globalPercentage}%</div>
              <div className="text-sm text-gray-600">
                {stats.chrActivated + stats.depotActivated}/{stats.objectiveChr + stats.objectiveDepots}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No objectives message */}
      {stats.objectiveChr === 0 && stats.objectiveDepots === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <div className="text-5xl mb-4">🎯</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Aucun objectif défini
          </h3>
          <p className="text-gray-600">
            Ton administrateur n'a pas encore défini d'objectifs pour cette période.
          </p>
        </div>
      )}
    </div>
  );
};
