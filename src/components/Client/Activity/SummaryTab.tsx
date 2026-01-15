import React, { useState, useMemo } from 'react';
import { CheckCircle2, AlertTriangle, TrendingUp, TrendingDown, Package, Package2, Wallet, Lock, FileText, Minus, FileDown } from 'lucide-react';
import { DailySheet, DailyStockLine, DailyPackaging, DailyExpense, CloseSheetData } from '../../../types/activity';
import { useCrateTypes } from '../../../hooks/useCrateTypes';
import { useOrganizationName } from '../../../hooks/useOrganizationName';
import { generateDailyPDF } from './PDFExport/generateDailyPDF';

interface SummaryTabProps {
  sheet: DailySheet | null;
  stockLines: DailyStockLine[];
  packaging: DailyPackaging[];
  expenses: DailyExpense[];
  calculations: {
    totalRevenue: number;
    totalExpenses: number;
    expectedCash: number;
    cashDifference: number;
    packagingAlerts: DailyPackaging[];
    stockAlerts: DailyStockLine[];
  };
  isReadOnly: boolean;
  onCloseSheet: (data: CloseSheetData) => Promise<boolean>;
  onReload: () => Promise<void>;
}

export const SummaryTab: React.FC<SummaryTabProps> = ({
  sheet,
  stockLines,
  packaging,
  expenses,
  calculations,
  isReadOnly,
  onCloseSheet,
  onReload,
}) => {
  const [closingCash, setClosingCash] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [closing, setClosing] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const { consignableTypes } = useCrateTypes();
  const { organizationName } = useOrganizationName();

  // Calculate displayed cash difference with fallback for old data
  const displayedCashDifference = sheet?.cashDifference ?? 
    (sheet?.closingCash !== null && sheet?.closingCash !== undefined 
      ? sheet.closingCash - calculations.expectedCash 
      : 0);

  // Filter packaging to only include consignable types
  const consignablePackaging = useMemo(() => {
    return packaging.filter(pkg => 
      consignableTypes.some(ct => ct.code === pkg.crateType)
    );
  }, [packaging, consignableTypes]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleCloseSheet = async () => {
    const closingCashNumber = parseInt(closingCash) || 0;

    if (closingCashNumber < 0) {
      alert('Le montant de la caisse ne peut pas être négatif');
      return;
    }

    setClosing(true);
    const success = await onCloseSheet({
      closingCash: closingCashNumber,
      notes: notes.trim() || undefined,
    });
    setClosing(false);

    if (success) {
      setShowCloseConfirm(false);
      await onReload();
    }
  };

  const handleExportPDF = async () => {
    if (!sheet) return;
    
    setExportingPDF(true);
    try {
      // Calculate total sales for summary
      const totalSales = stockLines.reduce((sum, line) => sum + (line.salesQty || 0), 0);
      
      await generateDailyPDF({
        establishment: {
          name: organizationName || 'Établissement',
        },
        sheet,
        stockLines,
        expenses,
        packaging,
        calculations: {
          ...calculations,
          totalSales,
        },
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      alert(`Erreur lors de l'export du PDF: ${errorMessage}\n\nVeuillez réessayer.`);
    } finally {
      setExportingPDF(false);
    }
  };

  // Calculate missing data
  const missingFinalStocks = stockLines.filter(
    (line) => line.finalStock === null || line.finalStock === undefined
  ).length;
  const missingConsignablePackaging = consignablePackaging.filter(
    (pkg) => pkg.qtyFullEnd === null || pkg.qtyFullEnd === undefined ||
            pkg.qtyEmptyEnd === null || pkg.qtyEmptyEnd === undefined
  ).length;

  const canClose = missingFinalStocks === 0 && missingConsignablePackaging === 0 && !isReadOnly;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <CheckCircle2 className="w-5 h-5 text-amber-600" />
        <h2 className="text-lg font-bold text-slate-900">Synthèse de la Journée</h2>
      </div>

      {/* Status banner */}
      {isReadOnly ? (
        <>
          <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Lock className="w-8 h-8 text-green-600" />
                <div>
                  <h3 className="font-bold text-green-900 text-lg">Journée clôturée</h3>
                  <p className="text-sm text-green-700">
                    Cette journée a été clôturée le{' '}
                    {sheet?.closedAt &&
                      new Date(sheet.closedAt).toLocaleString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                  </p>
                </div>
              </div>
              <button
                onClick={handleExportPDF}
                disabled={exportingPDF}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-lg hover:from-amber-700 hover:to-amber-800 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                <FileDown className="w-4 h-4" />
                {exportingPDF ? 'Export...' : 'Exporter PDF'}
              </button>
            </div>
          </div>

          {/* Display notes if they exist */}
          {sheet?.notes && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <FileText className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-bold text-blue-900 text-base mb-2">Notes de clôture</h3>
                  <p className="text-sm text-blue-800 whitespace-pre-wrap">{sheet.notes}</p>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-amber-600" />
            <div>
              <h3 className="font-bold text-amber-900 text-lg">Journée en cours</h3>
              <p className="text-sm text-amber-700">
                Complétez toutes les données avant de clôturer la journée
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className={`grid gap-4 ${isReadOnly && sheet?.closingCash !== null ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5' : 'grid-cols-1 sm:grid-cols-3'}`}>
        {/* Revenue card */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border-2 border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <p className="text-sm font-medium text-green-800">CA Théorique</p>
          </div>
          <p className="text-2xl font-bold text-green-900">
            {formatCurrency(calculations.totalRevenue)} F
          </p>
        </div>

        {/* Expenses card */}
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border-2 border-red-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-5 h-5 text-red-600" />
            <p className="text-sm font-medium text-red-800">Dépenses</p>
          </div>
          <p className="text-2xl font-bold text-red-900">
            {formatCurrency(calculations.totalExpenses)} F
          </p>
        </div>

        {/* Expected cash card */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border-2 border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-5 h-5 text-blue-600" />
            <p className="text-sm font-medium text-blue-800">{isReadOnly ? 'Caisse Finale Théorique' : 'Caisse Attendue'}</p>
          </div>
          <p className="text-2xl font-bold text-blue-900">
            {formatCurrency(calculations.expectedCash)} F
          </p>
        </div>

        {/* Caisse finale réelle (only when closed) */}
        {isReadOnly && sheet?.closingCash !== null && (
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border-2 border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-5 h-5 text-green-600" />
              <p className="text-sm font-medium text-green-800">Caisse Finale Réelle</p>
            </div>
            <p className="text-2xl font-bold text-green-900">
              {formatCurrency(sheet.closingCash)} F
            </p>
          </div>
        )}

        {/* Écart de caisse (only when closed) */}
        {isReadOnly && sheet?.closingCash !== null && (
          <div className={`bg-gradient-to-br rounded-xl p-4 border-2 ${
            displayedCashDifference < 0 
              ? 'from-red-50 to-red-100 border-red-200' 
              : displayedCashDifference > 0
              ? 'from-green-50 to-green-100 border-green-200'
              : 'from-slate-50 to-slate-100 border-slate-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {displayedCashDifference < 0 ? (
                <TrendingDown className="w-5 h-5 text-red-600" />
              ) : displayedCashDifference > 0 ? (
                <TrendingUp className="w-5 h-5 text-green-600" />
              ) : (
                <Minus className="w-5 h-5 text-slate-600" />
              )}
              <p className={`text-sm font-medium ${
                displayedCashDifference < 0 
                  ? 'text-red-800' 
                  : displayedCashDifference > 0
                  ? 'text-green-800'
                  : 'text-slate-800'
              }`}>Écart de Caisse</p>
            </div>
            <p className={`text-2xl font-bold ${
              displayedCashDifference < 0 
                ? 'text-red-900' 
                : displayedCashDifference > 0
                ? 'text-green-900'
                : 'text-slate-900'
            }`}>
              {displayedCashDifference > 0 ? '+' : ''}
              {formatCurrency(displayedCashDifference)} F
            </p>
          </div>
        )}
      </div>

      {/* Credit Statistics Section */}
      {sheet && ((sheet.creditSales || 0) > 0 || (sheet.creditPayments || 0) > 0 || (sheet.creditBalanceEod || 0) > 0) && (
        <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <h3 className="font-bold text-orange-900">💳 Crédits du Jour</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-white rounded">
              <span className="text-sm text-slate-700">Crédits accordés:</span>
              <span className="font-medium text-orange-600">
                {formatCurrency(sheet.creditSales || 0)} FCFA
              </span>
            </div>
            <div className="flex items-center justify-between p-2 bg-white rounded">
              <span className="text-sm text-slate-700">Règlements reçus:</span>
              <span className="font-medium text-green-600">
                {formatCurrency(sheet.creditPayments || 0)} FCFA
              </span>
            </div>
            <div className="flex items-center justify-between p-2 bg-white rounded border border-orange-300">
              <span className="text-sm font-medium text-slate-900">Solde crédit total:</span>
              <span className="font-bold text-orange-600">
                {formatCurrency(sheet.creditBalanceEod || 0)} FCFA
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Alerts section */}
      {(calculations.packagingAlerts.length > 0 || calculations.stockAlerts.length > 0) && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="font-bold text-red-900">Alertes</h3>
          </div>

          <div className="space-y-2">
            {/* Packaging alerts */}
            {calculations.packagingAlerts.map((pkg) => (
              <div
                key={pkg.id}
                className="flex items-center gap-2 p-2 bg-white rounded border border-red-200"
              >
                <Package2 className="w-4 h-4 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-800">
                  <strong>{pkg.crateType}</strong>: Écart de{' '}
                  <strong>
                    {pkg.difference !== undefined && pkg.difference > 0 ? '+' : ''}
                    {pkg.difference}
                  </strong>{' '}
                  casier(s)
                </p>
              </div>
            ))}

            {/* Stock alerts */}
            {calculations.stockAlerts.map((line) => (
              <div
                key={line.id}
                className="flex items-center gap-2 p-2 bg-white rounded border border-red-200"
              >
                <Package className="w-4 h-4 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-800">
                  <strong>{line.product?.name}</strong>: Stock faible ({line.finalStock} unités)
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data completion status */}
      {!isReadOnly && (
        <div className="bg-white border-2 border-slate-200 rounded-xl p-4">
          <h3 className="font-bold text-slate-900 mb-3">État de Complétude</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
              <span className="text-sm text-slate-700">Stocks finaux saisis</span>
              <span
                className={`text-sm font-medium ${
                  missingFinalStocks === 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {stockLines.length - missingFinalStocks} / {stockLines.length}
              </span>
            </div>
            <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
              <span className="text-sm text-slate-700">Casiers comptés</span>
              <span
                className={`text-sm font-medium ${
                  missingConsignablePackaging === 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {consignablePackaging.length - missingConsignablePackaging} / {consignablePackaging.length}
              </span>
            </div>
            <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
              <span className="text-sm text-slate-700">Dépenses enregistrées</span>
              <span className="text-sm font-medium text-blue-600">{expenses.length}</span>
            </div>
          </div>
        </div>
      )}

      {/* Closing section (only if not closed) */}
      {!isReadOnly && !showCloseConfirm && (
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-300 rounded-xl p-6">
          <h3 className="font-bold text-amber-900 text-lg mb-3">Clôturer la Journée</h3>
          <p className="text-sm text-amber-800 mb-4">
            Comptez votre caisse et clôturez la journée. Cette action est <strong>irréversible</strong>.
          </p>

          {!canClose && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-800 font-medium">
                ⚠️ Complétez toutes les données avant de clôturer :
              </p>
              <ul className="text-xs text-red-700 mt-2 ml-4 list-disc">
                {missingFinalStocks > 0 && <li>{missingFinalStocks} stock(s) final(finaux) manquant(s)</li>}
                {missingConsignablePackaging > 0 && <li>{missingConsignablePackaging} comptage(s) de casiers manquant(s)</li>}
              </ul>
            </div>
          )}

          <button
            onClick={() => setShowCloseConfirm(true)}
            disabled={!canClose}
            className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-green-600 disabled:hover:to-green-700"
          >
            {canClose ? '✓ Clôturer la Journée' : '🔒 Données incomplètes'}
          </button>
        </div>
      )}

      {/* Close confirmation dialog */}
      {showCloseConfirm && !isReadOnly && (
        <div className="bg-white border-2 border-green-300 rounded-xl p-6">
          <h3 className="font-bold text-slate-900 text-lg mb-4">Confirmer la Clôture</h3>

          <div className="space-y-4 mb-6">
            {/* Closing cash input */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Montant compté dans la caisse (FCFA) *
              </label>
              <input
                type="number"
                min="0"
                step="100"
                value={closingCash}
                onChange={(e) => setClosingCash(e.target.value)}
                placeholder="Ex: 150000"
                className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg text-lg font-medium focus:ring-2 focus:ring-green-500 focus:border-green-500"
                autoFocus
              />
              <p className="text-xs text-slate-600 mt-1">
                Caisse attendue: <strong>{formatCurrency(calculations.expectedCash)} FCFA</strong>
              </p>
            </div>

            {/* Notes input */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Notes (optionnel)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observations sur la journée..."
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
              />
            </div>

            {/* Warning */}
            <div className="bg-amber-50 border border-amber-300 rounded-lg p-3">
              <p className="text-sm text-amber-900 font-medium">
                ⚠️ Attention : Une fois clôturée, cette journée ne pourra plus être modifiée.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => setShowCloseConfirm(false)}
              disabled={closing}
              className="flex-1 px-4 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 font-medium"
            >
              Annuler
            </button>
            <button
              onClick={handleCloseSheet}
              disabled={closing || !closingCash}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {closing ? 'Clôture...' : '✓ Confirmer la Clôture'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
