import React, { useState, useEffect } from 'react';
import { Settings, Calculator, CheckCircle, FileText, RefreshCw } from 'lucide-react';
import { useSalesCommissions } from '../../../hooks/useSalesCommissions';
import { formatCurrency, formatPeriod, PAYMENT_STATUS_LABELS } from '../../../types/sales';
import type { SalesCommissionSettings } from '../../../types/sales';

type TabView = 'configuration' | 'calculation' | 'history';

export const SalesCommissionsTab: React.FC = () => {
  const {
    salesReps,
    settings,
    payments,
    commissionCalculation,
    paymentHistory,
    selectedPeriod,
    updateSettings,
    calculateCommissionsForPeriod,
    saveCommissions,
    validatePayments,
    isLoading,
    error
  } = useSalesCommissions();

  const [activeView, setActiveView] = useState<TabView>('configuration');
  const [editedSettings, setEditedSettings] = useState<Partial<SalesCommissionSettings>>({});
  const [hasCalculated, setHasCalculated] = useState(false);

  useEffect(() => {
    if (settings) {
      setEditedSettings(settings);
    }
  }, [settings]);

  const handleSettingsChange = (field: keyof SalesCommissionSettings, value: string | number | boolean) => {
    setEditedSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveSettings = async () => {
    const success = await updateSettings(editedSettings);
    if (success) {
      alert('Configuration sauvegardée avec succès');
    }
  };

  const handleCalculate = async () => {
    const success = await calculateCommissionsForPeriod(selectedPeriod);
    setHasCalculated(success);
  };

  const handleSaveCalculation = async () => {
    const success = await saveCommissions(selectedPeriod);
    if (success) {
      alert('Primes sauvegardées avec succès');
      setHasCalculated(false);
    }
  };

  const handleValidate = async () => {
    if (confirm('Êtes-vous sûr de vouloir valider les primes de cette période ?')) {
      const success = await validatePayments(selectedPeriod);
      if (success) {
        alert('Primes validées avec succès');
      }
    }
  };

  if (isLoading || !settings) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with tabs */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">💰 Primes</h2>
        
        <div className="flex space-x-1 border-b border-gray-200">
          <button
            onClick={() => setActiveView('configuration')}
            className={`px-4 py-2 font-medium text-sm ${
              activeView === 'configuration'
                ? 'text-orange-600 border-b-2 border-orange-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Settings className="w-4 h-4 inline mr-2" />
            Configuration
          </button>
          <button
            onClick={() => setActiveView('calculation')}
            className={`px-4 py-2 font-medium text-sm ${
              activeView === 'calculation'
                ? 'text-orange-600 border-b-2 border-orange-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Calculator className="w-4 h-4 inline mr-2" />
            Calcul
          </button>
          <button
            onClick={() => setActiveView('history')}
            className={`px-4 py-2 font-medium text-sm ${
              activeView === 'history'
                ? 'text-orange-600 border-b-2 border-orange-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Historique
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Configuration View */}
      {activeView === 'configuration' && (
        <div className="space-y-6">
          {/* Primes à l'inscription */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              PRIMES À L'INSCRIPTION (versées M+1, conditionnées)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prime par CHR activé (CA ≥ {formatCurrency(editedSettings.chrActivationThreshold || 50000)})
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={editedSettings.primePerChrActivated || 0}
                    onChange={(e) => handleSettingsChange('primePerChrActivated', parseInt(e.target.value) || 0)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-500">FCFA</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prime par Dépôt activé (≥ {editedSettings.depotActivationDeliveries || 3} livraisons)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={editedSettings.primePerDepotActivated || 0}
                    onChange={(e) => handleSettingsChange('primePerDepotActivated', parseInt(e.target.value) || 0)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-500">FCFA</span>
                </div>
              </div>
            </div>
          </div>

          {/* Commission sur CA */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                COMMISSION SUR CA (post-MEP)
              </h3>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={editedSettings.caCommissionEnabled || false}
                  onChange={(e) => handleSettingsChange('caCommissionEnabled', e.target.checked)}
                  className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                />
                <span className="text-sm text-gray-700">Activer les commissions sur CA</span>
              </label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CA 0 - 500 000 F
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    step="0.1"
                    value={editedSettings.caTier1Rate || 0}
                    onChange={(e) => handleSettingsChange('caTier1Rate', parseFloat(e.target.value) || 0)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-500">%</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CA 500 001 - 1 500 000 F
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    step="0.1"
                    value={editedSettings.caTier2Rate || 0}
                    onChange={(e) => handleSettingsChange('caTier2Rate', parseFloat(e.target.value) || 0)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-500">%</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CA 1 500 001 - 3 000 000 F
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    step="0.1"
                    value={editedSettings.caTier3Rate || 0}
                    onChange={(e) => handleSettingsChange('caTier3Rate', parseFloat(e.target.value) || 0)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-500">%</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CA &gt; 3 000 000 F
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    step="0.1"
                    value={editedSettings.caTier4Rate || 0}
                    onChange={(e) => handleSettingsChange('caTier4Rate', parseFloat(e.target.value) || 0)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-500">%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bonus objectifs */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              BONUS OBJECTIFS MENSUELS
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Objectif CHR atteint
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={editedSettings.bonusChrObjective || 0}
                    onChange={(e) => handleSettingsChange('bonusChrObjective', parseInt(e.target.value) || 0)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-500">FCFA</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Objectif Dépôts atteint
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={editedSettings.bonusDepotObjective || 0}
                    onChange={(e) => handleSettingsChange('bonusDepotObjective', parseInt(e.target.value) || 0)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-500">FCFA</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bonus combiné (les 2)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={editedSettings.bonusCombined || 0}
                    onChange={(e) => handleSettingsChange('bonusCombined', parseInt(e.target.value) || 0)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-500">FCFA</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bonus dépassement */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              BONUS DÉPASSEMENT
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seuil niveau 1 (%)
                </label>
                <input
                  type="number"
                  value={editedSettings.overshootTier1Threshold || 0}
                  onChange={(e) => handleSettingsChange('overshootTier1Threshold', parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bonus niveau 1 (FCFA)
                </label>
                <input
                  type="number"
                  value={editedSettings.overshootTier1Bonus || 0}
                  onChange={(e) => handleSettingsChange('overshootTier1Bonus', parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seuil niveau 2 (%)
                </label>
                <input
                  type="number"
                  value={editedSettings.overshootTier2Threshold || 0}
                  onChange={(e) => handleSettingsChange('overshootTier2Threshold', parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bonus niveau 2 (FCFA)
                </label>
                <input
                  type="number"
                  value={editedSettings.overshootTier2Bonus || 0}
                  onChange={(e) => handleSettingsChange('overshootTier2Bonus', parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Bonus spéciaux */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              BONUS SPÉCIAUX
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meilleur commercial du mois
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={editedSettings.bonusBestOfMonth || 0}
                  onChange={(e) => handleSettingsChange('bonusBestOfMonth', parseInt(e.target.value) || 0)}
                  className="flex-1 max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
                <span className="text-sm text-gray-500">FCFA</span>
              </div>
            </div>
          </div>

          {/* Save button */}
          <div className="flex justify-end">
            <button
              onClick={handleSaveSettings}
              className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
            >
              Enregistrer les modifications
            </button>
          </div>
        </div>
      )}

      {/* Calculation View */}
      {activeView === 'calculation' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              📋 Calcul des Primes - {formatPeriod(selectedPeriod)}
            </h3>
            <button
              onClick={handleCalculate}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Recalculer</span>
            </button>
          </div>

          {commissionCalculation && hasCalculated ? (
            <>
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commercial</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">CHR activ</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Dépôts activ</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Prime Inscr.</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Bonus Obj.</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Bonus Dépas.</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">TOTAL</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {commissionCalculation.calculations.map(calc => (
                        <tr key={calc.salesRepId} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className="text-sm font-medium text-gray-900">{calc.salesRepName}</span>
                              {calc.bonusSpecial > 0 && (
                                <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                  🏆 Meilleur
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                            {calc.chrActivated}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                            {calc.depotActivated}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                            {formatCurrency(calc.primeInscriptions)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                            {formatCurrency(calc.bonusObjectives)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                            {formatCurrency(calc.bonusOvershoot + calc.bonusSpecial)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                            {formatCurrency(calc.totalAmount)}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50 font-semibold">
                        <td colSpan={6} className="px-6 py-4 text-right text-sm text-gray-900">TOTAL</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                          {formatCurrency(commissionCalculation.totalAmount)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <span className="text-sm font-medium text-yellow-900">
                  Statut : 🟡 En attente de sauvegarde
                </span>
                <button
                  onClick={handleSaveCalculation}
                  className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
                >
                  💾 Enregistrer les primes
                </button>
              </div>
            </>
          ) : payments.length > 0 ? (
            <>
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commercial</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">CHR activ</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Dépôts activ</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Prime Inscr.</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Bonus Obj.</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">TOTAL</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {payments.map(payment => {
                        const salesRep = salesReps.find(r => r.id === payment.salesRepId);
                        return (
                          <tr key={payment.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {salesRep?.name || 'Commercial inconnu'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                              {payment.chrActivated}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                              {payment.depotActivated}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                              {formatCurrency(payment.primeInscriptions)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                              {formatCurrency(payment.bonusObjectives)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                              {formatCurrency(payment.totalAmount)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {payments[0]?.status === 'pending' && (
                <div className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <span className="text-sm font-medium text-yellow-900">
                    Statut : 🟡 En attente de validation
                  </span>
                  <button
                    onClick={handleValidate}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center space-x-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Valider les primes</span>
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <Calculator className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Aucune prime calculée pour cette période</p>
              <button
                onClick={handleCalculate}
                className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                Calculer les primes
              </button>
            </div>
          )}
        </div>
      )}

      {/* History View */}
      {activeView === 'history' && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">
            📜 Historique des Primes Validées
          </h3>

          {paymentHistory.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucun historique de primes</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Période</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Commerciaux</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total primes</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paymentHistory.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatPeriod(item.period)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                          {item.salesRepsCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                          {formatCurrency(item.totalAmount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            item.status === 'paid' ? 'bg-green-100 text-green-800' :
                            item.status === 'validated' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {item.status === 'paid' && item.paidAt 
                              ? `✅ Payé le ${new Date(item.paidAt).toLocaleDateString('fr-FR')}`
                              : PAYMENT_STATUS_LABELS[item.status]
                            }
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
