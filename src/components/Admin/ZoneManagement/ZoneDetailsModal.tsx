import React from 'react';
import {
  MapPin,
  Users,
  TrendingUp,
  Clock,
  X,
  Settings,
  Edit3,
  ToggleLeft,
  ToggleRight,
  UserPlus,
  UserMinus
} from 'lucide-react';
import { DeliveryZone, SupplierCommune } from '../../../types';

interface ZoneDetailsModalProps {
  zone: DeliveryZone;
  onClose: () => void;
  onEdit: (zone: DeliveryZone) => void;
  onToggleStatus: (zone: DeliveryZone) => void;
  onAddSupplier: () => void;
  onEditSupplier: (supplier: SupplierCommune) => void;
  onToggleSupplier: (supplier: SupplierCommune) => void;
  onRemoveSupplier: (supplierId: string, supplierBusinessName: string) => void;
  isProcessing: boolean;
  formatDate: (date: Date) => string;
  getPerformanceColor: (successRate: number) => string;
}

export const ZoneDetailsModal: React.FC<ZoneDetailsModalProps> = ({
  zone,
  onClose,
  onEdit,
  onToggleStatus,
  onAddSupplier,
  onEditSupplier,
  onToggleSupplier,
  onRemoveSupplier,
  isProcessing,
  formatDate,
  getPerformanceColor
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <div className={`h-16 w-16 rounded-full flex items-center justify-center ${
                zone.isActive ? 'bg-gradient-to-br from-green-400 to-green-500' : 'bg-gradient-to-br from-red-400 to-red-500'
              }`}>
                <MapPin className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Zone {zone.communeName}</h2>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    zone.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {zone.isActive ? 'Zone Active' : 'Zone Inactive'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {zone.statistics.activeSuppliers}/{zone.statistics.totalSuppliers} fournisseurs actifs
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-blue-50 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <Settings className="h-5 w-5 mr-2 text-blue-600" />
                  Configuration de la zone
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fournisseurs max:</span>
                    <span className="font-medium text-gray-900">{zone.zoneSettings.maxSuppliers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Couverture minimum:</span>
                    <span className="font-medium text-gray-900">{zone.zoneSettings.minimumCoverage} fournisseur(s)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Horaires d'activité:</span>
                    <span className="font-medium text-gray-900">{zone.zoneSettings.operatingHours}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Dernière mise à jour:</span>
                    <span className="font-medium text-gray-900">{formatDate(zone.updatedAt)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                  Statistiques de la zone
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-white rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 mb-1">{zone.statistics.totalOrders}</div>
                    <div className="text-sm text-gray-600">Commandes totales</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg">
                    <div className={`text-2xl font-bold mb-1 ${getPerformanceColor(zone.statistics.successRate)}`}>
                      {zone.statistics.successRate}%
                    </div>
                    <div className="text-sm text-gray-600">Taux de réussite</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg">
                    <div className="text-2xl font-bold text-orange-600 mb-1">{zone.statistics.averageDeliveryTime}</div>
                    <div className="text-sm text-gray-600">Temps moyen (min)</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 mb-1">{zone.statistics.activeSuppliers}</div>
                    <div className="text-sm text-gray-600">Fournisseurs actifs</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Fournisseurs inscrits</h3>
                  <button
                    onClick={onAddSupplier}
                    className="flex items-center space-x-2 bg-green-600 text-white px-3 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>Ajouter</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {zone.suppliers.map((supplier) => (
                    <div key={supplier.id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                              {supplier.supplierBusinessName.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{supplier.supplierBusinessName}</h4>
                            <p className="text-sm text-gray-600">{supplier.supplierName}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            supplier.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {supplier.isActive ? 'Actif' : 'Inactif'}
                          </span>
                          <button
                            onClick={() => onEditSupplier(supplier)}
                            className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                          >
                            <Edit3 className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => onToggleSupplier(supplier)}
                            className={`p-1 rounded transition-colors ${
                              supplier.isActive
                                ? 'text-red-600 hover:text-red-700 hover:bg-red-50'
                                : 'text-green-600 hover:text-green-700 hover:bg-green-50'
                            }`}
                          >
                            {supplier.isActive ? (
                              <ToggleLeft className="h-3 w-3" />
                            ) : (
                              <ToggleRight className="h-3 w-3" />
                            )}
                          </button>
                          <button
                            onClick={() => onRemoveSupplier(supplier.supplierId, supplier.supplierBusinessName)}
                            className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                          >
                            <UserMinus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Commandes:</span>
                          <span className="font-medium text-gray-900 ml-2">{supplier.performanceMetrics.totalOrders}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Réussite:</span>
                          <span className={`font-medium ml-2 ${getPerformanceColor(supplier.performanceMetrics.successRate)}`}>
                            {supplier.performanceMetrics.successRate}%
                          </span>
                        </div>
                      </div>
                      {!supplier.isActive && supplier.deactivationReason && (
                        <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                          <strong>Raison:</strong> {supplier.deactivationReason}
                        </div>
                      )}
                    </div>
                  ))}

                  {zone.suppliers.length === 0 && (
                    <div className="text-center py-6">
                      <Users className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500">Aucun fournisseur inscrit dans cette zone</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Fermer
            </button>
            <button
              onClick={() => onEdit(zone)}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <Edit3 className="h-4 w-4" />
              <span>Modifier la zone</span>
            </button>
            <button
              onClick={() => onToggleStatus(zone)}
              disabled={isProcessing}
              className={`flex-1 py-3 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                zone.isActive
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {zone.isActive ? (
                <>
                  <ToggleLeft className="h-4 w-4" />
                  <span>Désactiver la zone</span>
                </>
              ) : (
                <>
                  <ToggleRight className="h-4 w-4" />
                  <span>Activer la zone</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
