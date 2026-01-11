import React, { useState } from 'react';
import { Package, TrendingUp, RefreshCw, ExternalLink } from 'lucide-react';
import { DailyStockLine, EstablishmentProduct } from '../../../types/activity';
import { UpdateStockLineData } from '../../../types/activity';

interface StocksTabProps {
  stockLines: DailyStockLine[];
  establishmentProducts: EstablishmentProduct[];
  isReadOnly: boolean;
  syncing: boolean;
  onUpdateStockLine: (lineId: string, data: UpdateStockLineData) => Promise<boolean>;
  onSyncDeliveries: () => Promise<boolean>;
  onOpenConfig?: () => void;
}

export const StocksTab: React.FC<StocksTabProps> = ({
  stockLines,
  establishmentProducts,
  isReadOnly,
  syncing,
  onUpdateStockLine,
  onSyncDeliveries,
  onOpenConfig,
}) => {
  const [editingLineId, setEditingLineId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ externalSupply?: number; finalStock?: number }>(
    {}
  );

  const handleEdit = (line: DailyStockLine) => {
    setEditingLineId(line.id);
    setEditValues({
      externalSupply: line.externalSupply,
      finalStock: line.finalStock || undefined,
    });
  };

  const handleSave = async (lineId: string) => {
    const success = await onUpdateStockLine(lineId, editValues);
    if (success) {
      setEditingLineId(null);
      setEditValues({});
    }
  };

  const handleCancel = () => {
    setEditingLineId(null);
    setEditValues({});
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const totalRevenue = stockLines.reduce((sum, line) => sum + (line.revenue || 0), 0);
  const totalSales = stockLines.reduce((sum, line) => sum + (line.salesQty || 0), 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-amber-600" />
          <h2 className="text-lg font-bold text-slate-900">Suivi des Stocks</h2>
        </div>
        <button
          onClick={onSyncDeliveries}
          disabled={syncing || isReadOnly}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-sm"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Sync Livraisons RAVITO</span>
          <span className="sm:hidden">Sync</span>
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 sm:p-4 border border-green-200">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <p className="text-xs sm:text-sm text-green-800 font-medium">CA Théorique</p>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-green-900">
            {formatCurrency(totalRevenue)} FCFA
          </p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 sm:p-4 border border-blue-200">
          <div className="flex items-center gap-2 mb-1">
            <Package className="w-4 h-4 text-blue-600" />
            <p className="text-xs sm:text-sm text-blue-800 font-medium">Total Ventes</p>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-blue-900">
            {totalSales} unités
          </p>
        </div>
      </div>

      {/* Stock table - Mobile view */}
      <div className="sm:hidden space-y-3">
        {stockLines.map((line) => {
          const isEditing = editingLineId === line.id;
          const sellingPrice = line.establishmentProduct?.sellingPrice || 0;
          const totalSupply = line.ravitoSupply + (isEditing ? (editValues.externalSupply || 0) : line.externalSupply);
          const finalStock = isEditing ? (editValues.finalStock ?? line.finalStock) : line.finalStock;
          const salesQty = finalStock !== null && finalStock !== undefined
            ? line.initialStock + totalSupply - finalStock
            : undefined;
          const revenue = salesQty && sellingPrice ? salesQty * sellingPrice : 0;

          return (
            <div
              key={line.id}
              className="bg-slate-50 rounded-lg p-3 border border-slate-200"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-medium text-slate-900 text-sm">
                    {line.product?.name || 'Produit'}
                  </h3>
                  <p className="text-xs text-slate-600">{line.product?.brand}</p>
                </div>
                {!isReadOnly && !isEditing && (
                  <button
                    onClick={() => handleEdit(line)}
                    className="text-xs text-amber-600 hover:text-amber-700 font-medium"
                  >
                    Modifier
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-slate-600">Stock Initial</p>
                  <p className="font-medium text-slate-900">{line.initialStock}</p>
                </div>
                <div>
                  <p className="text-slate-600">RAVITO</p>
                  <p className="font-medium text-blue-900">{line.ravitoSupply}</p>
                </div>
                <div>
                  <p className="text-slate-600">Achats Ext.</p>
                  {isEditing ? (
                    <input
                      type="number"
                      min="0"
                      value={editValues.externalSupply || 0}
                      onChange={(e) =>
                        setEditValues({ ...editValues, externalSupply: parseInt(e.target.value) || 0 })
                      }
                      className="w-full px-2 py-1 border border-slate-300 rounded text-sm"
                    />
                  ) : (
                    <p className="font-medium text-slate-900">{line.externalSupply}</p>
                  )}
                </div>
                <div>
                  <p className="text-slate-600">Stock Final</p>
                  {isEditing ? (
                    <input
                      type="number"
                      min="0"
                      value={editValues.finalStock ?? ''}
                      onChange={(e) =>
                        setEditValues({ ...editValues, finalStock: parseInt(e.target.value) || 0 })
                      }
                      className="w-full px-2 py-1 border border-slate-300 rounded text-sm"
                    />
                  ) : (
                    <p className="font-medium text-slate-900">{finalStock ?? '-'}</p>
                  )}
                </div>
                <div>
                  <p className="text-slate-600">Ventes</p>
                  <p className="font-medium text-green-900">{salesQty ?? '-'}</p>
                </div>
                <div>
                  <p className="text-slate-600">CA</p>
                  <p className="font-medium text-green-900">
                    {revenue > 0 ? `${formatCurrency(revenue)} F` : '-'}
                  </p>
                </div>
              </div>

              {isEditing && (
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleSave(line.id)}
                    className="flex-1 px-3 py-1.5 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700"
                  >
                    Sauvegarder
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex-1 px-3 py-1.5 bg-slate-300 text-slate-700 rounded text-sm font-medium hover:bg-slate-400"
                  >
                    Annuler
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Stock table - Desktop view */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-slate-200">
              <th className="text-left py-3 px-2 font-semibold text-slate-700">Produit</th>
              <th className="text-center py-3 px-2 font-semibold text-slate-700">Stock Init.</th>
              <th className="text-center py-3 px-2 font-semibold text-slate-700">RAVITO</th>
              <th className="text-center py-3 px-2 font-semibold text-slate-700">Achats Ext.</th>
              <th className="text-center py-3 px-2 font-semibold text-slate-700">Stock Final</th>
              <th className="text-center py-3 px-2 font-semibold text-slate-700">Ventes</th>
              <th className="text-right py-3 px-2 font-semibold text-slate-700">CA (FCFA)</th>
              {!isReadOnly && <th className="text-center py-3 px-2 font-semibold text-slate-700">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {stockLines.map((line) => {
              const isEditing = editingLineId === line.id;
              const sellingPrice = line.establishmentProduct?.sellingPrice || 0;
              const totalSupply = line.ravitoSupply + (isEditing ? (editValues.externalSupply || 0) : line.externalSupply);
              const finalStock = isEditing ? (editValues.finalStock ?? line.finalStock) : line.finalStock;
              const salesQty = finalStock !== null && finalStock !== undefined
                ? line.initialStock + totalSupply - finalStock
                : undefined;
              const revenue = salesQty && sellingPrice ? salesQty * sellingPrice : 0;

              return (
                <tr key={line.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-2">
                    <div className="font-medium text-slate-900">{line.product?.name || 'Produit'}</div>
                    <div className="text-xs text-slate-600">{line.product?.brand}</div>
                  </td>
                  <td className="py-3 px-2 text-center">{line.initialStock}</td>
                  <td className="py-3 px-2 text-center">
                    <span className="text-blue-700 font-medium">{line.ravitoSupply}</span>
                  </td>
                  <td className="py-3 px-2 text-center">
                    {isEditing ? (
                      <input
                        type="number"
                        min="0"
                        value={editValues.externalSupply || 0}
                        onChange={(e) =>
                          setEditValues({ ...editValues, externalSupply: parseInt(e.target.value) || 0 })
                        }
                        className="w-20 px-2 py-1 border border-slate-300 rounded text-center"
                      />
                    ) : (
                      line.externalSupply
                    )}
                  </td>
                  <td className="py-3 px-2 text-center">
                    {isEditing ? (
                      <input
                        type="number"
                        min="0"
                        value={editValues.finalStock ?? ''}
                        onChange={(e) =>
                          setEditValues({ ...editValues, finalStock: parseInt(e.target.value) || 0 })
                        }
                        className="w-20 px-2 py-1 border border-slate-300 rounded text-center"
                      />
                    ) : (
                      finalStock ?? '-'
                    )}
                  </td>
                  <td className="py-3 px-2 text-center">
                    <span className="text-green-700 font-medium">{salesQty ?? '-'}</span>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <span className="text-green-700 font-medium">
                      {revenue > 0 ? formatCurrency(revenue) : '-'}
                    </span>
                  </td>
                  {!isReadOnly && (
                    <td className="py-3 px-2 text-center">
                      {isEditing ? (
                        <div className="flex gap-1 justify-center">
                          <button
                            onClick={() => handleSave(line.id)}
                            className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                          >
                            ✓
                          </button>
                          <button
                            onClick={handleCancel}
                            className="px-2 py-1 bg-slate-300 text-slate-700 rounded text-xs hover:bg-slate-400"
                          >
                            ✗
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEdit(line)}
                          className="text-amber-600 hover:text-amber-700 text-xs font-medium"
                        >
                          Modifier
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-300 bg-slate-50">
              <td className="py-3 px-2 font-bold text-slate-900">TOTAL</td>
              <td className="py-3 px-2 text-center font-bold">
                {stockLines.reduce((sum, l) => sum + l.initialStock, 0)}
              </td>
              <td className="py-3 px-2 text-center font-bold text-blue-700">
                {stockLines.reduce((sum, l) => sum + l.ravitoSupply, 0)}
              </td>
              <td className="py-3 px-2 text-center font-bold">
                {stockLines.reduce((sum, l) => sum + l.externalSupply, 0)}
              </td>
              <td className="py-3 px-2 text-center">-</td>
              <td className="py-3 px-2 text-center font-bold text-green-700">{totalSales}</td>
              <td className="py-3 px-2 text-right font-bold text-green-700">
                {formatCurrency(totalRevenue)}
              </td>
              {!isReadOnly && <td></td>}
            </tr>
          </tfoot>
        </table>
      </div>

      {stockLines.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">Aucun produit configuré</p>
          <p className="text-sm mt-1 mb-4">Configurez vos prix de vente dans les paramètres</p>
          {onOpenConfig && (
            <button
              onClick={onOpenConfig}
              className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 font-medium inline-flex items-center gap-2"
            >
              <Package className="w-4 h-4" />
              Configurer mes produits
            </button>
          )}
        </div>
      )}
    </div>
  );
};
