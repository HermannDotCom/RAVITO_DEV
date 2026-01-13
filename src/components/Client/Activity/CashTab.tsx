import React, { useState, useEffect } from 'react';
import { Wallet, Plus, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { DailySheet, DailyExpense, AddExpenseData, EXPENSE_CATEGORIES } from '../../../types/activity';
import { ExpenseModal } from './ExpenseModal';

interface CashTabProps {
  sheet: DailySheet | null;
  expenses: DailyExpense[];
  calculations: {
    totalRevenue: number;
    totalExpenses: number;
    expectedCash: number;
    cashDifference: number;
  };
  isReadOnly: boolean;
  onAddExpense: (data: AddExpenseData) => Promise<boolean>;
  onDeleteExpense: (expenseId: string) => Promise<boolean>;
  onUpdateOpeningCash?: (amount: number) => Promise<boolean>;
}

export const CashTab: React.FC<CashTabProps> = ({
  sheet,
  expenses,
  calculations,
  isReadOnly,
  onAddExpense,
  onDeleteExpense,
  onUpdateOpeningCash,
}) => {
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [openingCash, setOpeningCash] = useState<number>(sheet?.openingCash || 0);

  // Sync with sheet when it changes
  useEffect(() => {
    setOpeningCash(sheet?.openingCash || 0);
  }, [sheet?.openingCash]);

  const handleOpeningCashChange = async (value: number) => {
    setOpeningCash(value);
    if (onUpdateOpeningCash) {
      await onUpdateOpeningCash(value);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleAddExpense = async (data: AddExpenseData) => {
    const success = await onAddExpense(data);
    if (success) {
      setShowExpenseModal(false);
    }
    return success;
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette dépense ?')) {
      setDeletingId(expenseId);
      await onDeleteExpense(expenseId);
      setDeletingId(null);
    }
  };

  const getCategoryLabel = (category: string): string => {
    return EXPENSE_CATEGORIES[category as keyof typeof EXPENSE_CATEGORIES] || category;
  };

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      food: 'bg-orange-100 text-orange-800',
      transport: 'bg-blue-100 text-blue-800',
      utilities: 'bg-purple-100 text-purple-800',
      other: 'bg-slate-100 text-slate-800',
    };
    return colors[category] || colors.other;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Wallet className="w-5 h-5 text-amber-600" />
        <h2 className="text-lg font-bold text-slate-900">Gestion de Caisse</h2>
      </div>

      {/* Revenue Section */}
      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border-2 border-green-200">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-5 h-5 text-green-600" />
          <h3 className="font-bold text-green-900">Chiffre d'Affaires Théorique</h3>
        </div>
        <p className="text-3xl font-bold text-green-900">
          {formatCurrency(calculations.totalRevenue)} FCFA
        </p>
        <p className="text-sm text-green-700 mt-1">
          Calculé depuis les ventes de boissons
        </p>
      </div>

      {/* Expenses Section */}
      <div className="bg-white rounded-xl border-2 border-slate-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-900">Dépenses du Jour</h3>
            <p className="text-sm text-slate-600">
              Total: <span className="font-medium text-red-600">{formatCurrency(calculations.totalExpenses)} FCFA</span>
            </p>
          </div>
          {!isReadOnly && (
            <button
              onClick={() => setShowExpenseModal(true)}
              className="flex items-center gap-2 px-3 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Ajouter</span>
            </button>
          )}
        </div>

        {/* Expenses list */}
        <div className="space-y-2">
          {expenses.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p className="text-sm">Aucune dépense enregistrée</p>
            </div>
          ) : (
            expenses.map((expense) => (
              <div
                key={expense.id}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-slate-900">{expense.label}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${getCategoryColor(
                        expense.category
                      )}`}
                    >
                      {getCategoryLabel(expense.category)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    {new Date(expense.createdAt).toLocaleString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-red-600">
                    {formatCurrency(expense.amount)} F
                  </span>
                  {!isReadOnly && (
                    <button
                      onClick={() => handleDeleteExpense(expense.id)}
                      disabled={deletingId === expense.id}
                      className="text-red-500 hover:text-red-700 disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Cash Summary */}
      <div className="bg-slate-50 rounded-xl border-2 border-slate-200 p-4">
        <h3 className="font-bold text-slate-900 mb-4">Résumé de Caisse</h3>

        <div className="space-y-3">
          {/* Opening cash */}
          <div className="flex items-center justify-between py-2 border-b border-slate-200">
            <span className="text-slate-700">Caisse initiale</span>
            {isReadOnly ? (
              <span className="font-medium text-slate-900">
                {formatCurrency(sheet?.openingCash || 0)} FCFA
              </span>
            ) : (
              <input
                type="number"
                min="0"
                step="100"
                value={openingCash}
                onChange={(e) => handleOpeningCashChange(parseInt(e.target.value) || 0)}
                className="w-32 px-2 py-1 text-right border border-slate-300 rounded font-medium"
                placeholder="0"
              />
            )}
          </div>

          {/* Revenue */}
          <div className="flex items-center justify-between py-2 border-b border-slate-200">
            <span className="text-slate-700">+ Chiffre d'affaires</span>
            <span className="font-medium text-green-600">
              + {formatCurrency(calculations.totalRevenue)} FCFA
            </span>
          </div>

          {/* Expenses */}
          <div className="flex items-center justify-between py-2 border-b border-slate-200">
            <span className="text-slate-700">- Dépenses</span>
            <span className="font-medium text-red-600">
              - {formatCurrency(calculations.totalExpenses)} FCFA
            </span>
          </div>

          {/* Expected cash */}
          <div className="flex items-center justify-between py-3 bg-blue-50 rounded-lg px-3 border border-blue-200">
            <span className="font-bold text-blue-900">Caisse finale théorique</span>
            <span className="font-bold text-blue-900 text-lg">
              {formatCurrency(calculations.expectedCash)} FCFA
            </span>
          </div>

          {/* Actual closing cash (if closed) */}
          {sheet?.status === 'closed' && sheet.closingCash !== null && (
            <>
              <div className="flex items-center justify-between py-2 border-b border-slate-200">
                <span className="text-slate-700">Caisse comptée (soir)</span>
                <span className="font-medium text-slate-900">
                  {formatCurrency(sheet.closingCash)} FCFA
                </span>
              </div>

              {/* Cash difference */}
              <div
                className={`flex items-center justify-between py-3 rounded-lg px-3 border-2 ${
                  sheet.cashDifference && sheet.cashDifference < 0
                    ? 'bg-red-50 border-red-300'
                    : sheet.cashDifference && sheet.cashDifference > 0
                    ? 'bg-green-50 border-green-300'
                    : 'bg-slate-50 border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  {sheet.cashDifference && sheet.cashDifference < 0 ? (
                    <TrendingDown className="w-5 h-5 text-red-600" />
                  ) : (
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  )}
                  <span className="font-bold text-slate-900">Écart de caisse</span>
                </div>
                <span
                  className={`font-bold text-lg ${
                    sheet.cashDifference && sheet.cashDifference < 0
                      ? 'text-red-700'
                      : sheet.cashDifference && sheet.cashDifference > 0
                      ? 'text-green-700'
                      : 'text-slate-700'
                  }`}
                >
                  {sheet.cashDifference && sheet.cashDifference > 0 ? '+' : ''}
                  {formatCurrency(sheet.cashDifference || 0)} FCFA
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Instructions */}
      {sheet?.status === 'open' && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
          <p className="font-medium mb-1">📝 Instructions</p>
          <p className="text-xs">
            Enregistrez toutes vos dépenses au fur et à mesure. En fin de journée, rendez-vous dans l'onglet
            <strong> Synthèse</strong> pour compter votre caisse et clôturer la journée.
          </p>
        </div>
      )}

      {/* Expense Modal */}
      {showExpenseModal && (
        <ExpenseModal
          onClose={() => setShowExpenseModal(false)}
          onSubmit={handleAddExpense}
        />
      )}
    </div>
  );
};
