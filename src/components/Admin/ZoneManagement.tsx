import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Users, 
  Package, 
  TrendingUp, 
  Clock, 
  X, 
  Save, 
  AlertTriangle, 
  CheckCircle,
  Search,
  Filter,
  Eye,
  ToggleLeft,
  ToggleRight,
  Building,
  Calendar,
  Edit3,
  Truck,
  Star,
  Navigation
} from 'lucide-react';
import { mockSuppliers } from '../../data/mockSuppliers';
import { SupplierCommune } from '../../types';

export const ZoneManagement: React.FC = () => {
  const [suppliers, setSuppliers] = useState(mockSuppliers);
  const [searchTerm, setSearchTerm] = useState('');
  const [communeFilter, setCommuneFilter] = useState<string>('all');
  const [supplierFilter, setSupplierFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedZone, setSelectedZone] = useState<SupplierCommune | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivationReason, setDeactivationReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const [editFormData, setEditFormData] = useState({
    maxDeliveryRadius: 10,
    minimumOrderAmount: 5000,
    deliveryFee: 0
  });

  // Flatten all supplier communes for easier management
  const getAllSupplierCommunes = () => {
    const allCommunes: (SupplierCommune & { supplierName: string; supplierBusinessName: string })[] = [];
    
    suppliers.forEach(supplier => {
      supplier.communes.forEach(commune => {
        allCommunes.push({
          ...commune,
          supplierName: supplier.name,
          supplierBusinessName: supplier.businessName
        });
      });
    });
    
    return allCommunes;
  };

  const allSupplierCommunes = getAllSupplierCommunes();

  // Get unique communes and suppliers for filters
  const uniqueCommunes = Array.from(new Set(allSupplierCommunes.map(sc => sc.communeName))).sort();
  const uniqueSuppliers = suppliers.map(s => ({ id: s.id, name: s.businessName }));

  // Filter supplier communes
  const filteredSupplierCommunes = allSupplierCommunes.filter(sc => {
    const matchesSearch = sc.supplierBusinessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sc.communeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCommune = communeFilter === 'all' || sc.communeName === communeFilter;
    const matchesSupplier = supplierFilter === 'all' || sc.supplierId === supplierFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && sc.isActive) ||
                         (statusFilter === 'inactive' && !sc.isActive);
    
    return matchesSearch && matchesCommune && matchesSupplier && matchesStatus;
  });

  const toggleZoneStatus = async (supplierCommune: SupplierCommune & { supplierName: string; supplierBusinessName: string }) => {
    if (supplierCommune.isActive) {
      // Show deactivation modal
      setSelectedZone(supplierCommune);
      setShowDeactivateModal(true);
    } else {
      // Reactivate directly
      await reactivateZone(supplierCommune);
    }
  };

  const deactivateZone = async () => {
    if (!selectedZone || !deactivationReason.trim()) return;

    setIsProcessing(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    setSuppliers(prev => prev.map(supplier => ({
      ...supplier,
      communes: supplier.communes.map(commune => 
        commune.id === selectedZone.id
          ? {
              ...commune,
              isActive: false,
              deactivatedAt: new Date(),
              deactivationReason: deactivationReason.trim(),
              updatedAt: new Date()
            }
          : commune
      )
    })));

    setIsProcessing(false);
    setShowDeactivateModal(false);
    setSelectedZone(null);
    setDeactivationReason('');

    alert(`✅ Zone désactivée avec succès!\n\n${selectedZone.supplierBusinessName} ne peut plus livrer dans ${selectedZone.communeName}.\n\nRaison: ${deactivationReason}`);
  };

  const reactivateZone = async (supplierCommune: SupplierCommune & { supplierName: string; supplierBusinessName: string }) => {
    const confirmMessage = `Êtes-vous sûr de vouloir réactiver la zone "${supplierCommune.communeName}" pour ${supplierCommune.supplierBusinessName} ?`;
    
    if (!confirm(confirmMessage)) return;

    setIsProcessing(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    setSuppliers(prev => prev.map(supplier => ({
      ...supplier,
      communes: supplier.communes.map(commune => 
        commune.id === supplierCommune.id
          ? {
              ...commune,
              isActive: true,
              reactivatedAt: new Date(),
              updatedAt: new Date()
            }
          : commune
      )
    })));

    setIsProcessing(false);

    alert(`✅ Zone réactivée avec succès!\n\n${supplierCommune.supplierBusinessName} peut maintenant livrer dans ${supplierCommune.communeName}.`);
  };

  const handleEditZone = (supplierCommune: SupplierCommune & { supplierName: string; supplierBusinessName: string }) => {
    setSelectedZone(supplierCommune);
    setEditFormData({
      maxDeliveryRadius: supplierCommune.maxDeliveryRadius,
      minimumOrderAmount: supplierCommune.minimumOrderAmount,
      deliveryFee: supplierCommune.deliveryFee
    });
    setShowEditModal(true);
  };

  const handleUpdateZone = async () => {
    if (!selectedZone) return;

    setIsProcessing(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    setSuppliers(prev => prev.map(supplier => ({
      ...supplier,
      communes: supplier.communes.map(commune => 
        commune.id === selectedZone.id
          ? {
              ...commune,
              maxDeliveryRadius: editFormData.maxDeliveryRadius,
              minimumOrderAmount: editFormData.minimumOrderAmount,
              deliveryFee: editFormData.deliveryFee,
              updatedAt: new Date()
            }
          : commune
      )
    })));

    setIsProcessing(false);
    setShowEditModal(false);
    setSelectedZone(null);

    alert(`✅ Zone mise à jour avec succès!\n\nParamètres de livraison mis à jour pour ${selectedZone.supplierBusinessName} dans ${selectedZone.communeName}.`);
  };

  const handleViewDetails = (supplierCommune: SupplierCommune & { supplierName: string; supplierBusinessName: string }) => {
    setSelectedZone(supplierCommune);
    setShowDetailsModal(true);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getPerformanceColor = (successRate: number) => {
    if (successRate >= 90) return 'text-green-600';
    if (successRate >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceBadge = (successRate: number) => {
    if (successRate >= 90) return 'bg-green-100 text-green-700';
    if (successRate >= 80) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  // Calculate summary stats
  const totalActiveZones = allSupplierCommunes.filter(sc => sc.isActive).length;
  const totalInactiveZones = allSupplierCommunes.filter(sc => !sc.isActive).length;
  const totalOrders = allSupplierCommunes.reduce((sum, sc) => sum + sc.totalOrders, 0);
  const averageSuccessRate = allSupplierCommunes.length > 0 
    ? Math.round(allSupplierCommunes.reduce((sum, sc) => sum + sc.successRate, 0) / allSupplierCommunes.length)
    : 0;

  // Get commune coverage summary
  const getCommuneCoverage = () => {
    const communeCoverage: { [key: string]: { active: number; total: number } } = {};
    
    allSupplierCommunes.forEach(sc => {
      if (!communeCoverage[sc.communeName]) {
        communeCoverage[sc.communeName] = { active: 0, total: 0 };
      }
      communeCoverage[sc.communeName].total++;
      if (sc.isActive) {
        communeCoverage[sc.communeName].active++;
      }
    });
    
    return Object.entries(communeCoverage).map(([commune, data]) => ({
      commune,
      activeSuppliers: data.active,
      totalSuppliers: data.total,
      coverage: Math.round((data.active / data.total) * 100)
    }));
  };

  const communeCoverage = getCommuneCoverage();

  const ZoneDetailsModal = ({ zone, onClose }: { 
    zone: SupplierCommune & { supplierName: string; supplierBusinessName: string }; 
    onClose: () => void 
  }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <div className={`h-16 w-16 rounded-full flex items-center justify-center ${
                zone.isActive ? 'bg-gradient-to-br from-green-400 to-green-500' : 'bg-gradient-to-br from-red-400 to-red-500'
              }`}>
                <MapPin className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{zone.supplierBusinessName}</h2>
                <p className="text-gray-600">Zone de livraison : {zone.communeName}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    zone.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {zone.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span className="text-xs text-gray-500">
                    Créée le {formatDate(zone.createdAt)}
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
            {/* Zone Configuration */}
            <div className="space-y-6">
              <div className="bg-blue-50 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <Building className="h-5 w-5 mr-2 text-blue-600" />
                  Configuration de la zone
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rayon de livraison max:</span>
                    <span className="font-medium text-gray-900">{zone.maxDeliveryRadius} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Commande minimum:</span>
                    <span className="font-medium text-gray-900">{formatPrice(zone.minimumOrderAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Frais de livraison:</span>
                    <span className="font-medium text-gray-900">
                      {zone.deliveryFee === 0 ? 'Gratuit' : formatPrice(zone.deliveryFee)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Dernière mise à jour:</span>
                    <span className="font-medium text-gray-900">{formatDate(zone.updatedAt)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <Truck className="h-5 w-5 mr-2 text-green-600" />
                  Informations fournisseur
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Responsable:</span>
                    <span className="font-medium text-gray-900">{zone.supplierName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Dépôt:</span>
                    <span className="font-medium text-gray-900">{zone.supplierBusinessName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Capacité:</span>
                    <span className="font-medium text-gray-900">
                      {suppliers.find(s => s.id === zone.supplierId)?.deliveryCapacity === 'truck' ? 'Camion' :
                       suppliers.find(s => s.id === zone.supplierId)?.deliveryCapacity === 'tricycle' ? 'Tricycle' : 'Moto'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Deactivation Info */}
              {!zone.isActive && zone.deactivatedAt && (
                <div className="bg-red-50 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
                    Informations de désactivation
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-gray-600 block mb-1">Date de désactivation:</span>
                      <span className="font-medium text-gray-900">{formatDate(zone.deactivatedAt)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 block mb-1">Raison:</span>
                      <span className="font-medium text-red-700">{zone.deactivationReason}</span>
                    </div>
                    {zone.reactivatedAt && (
                      <div>
                        <span className="text-gray-600 block mb-1">Dernière réactivation:</span>
                        <span className="font-medium text-green-700">{formatDate(zone.reactivatedAt)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Performance Stats */}
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Statistiques de performance</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-white rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 mb-1">{zone.totalOrders}</div>
                    <div className="text-sm text-gray-600">Commandes totales</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg">
                    <div className={`text-2xl font-bold mb-1 ${getPerformanceColor(zone.successRate)}`}>
                      {zone.successRate}%
                    </div>
                    <div className="text-sm text-gray-600">Taux de réussite</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg">
                    <div className="text-2xl font-bold text-orange-600 mb-1">{zone.averageDeliveryTime}</div>
                    <div className="text-sm text-gray-600">Temps moyen (min)</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 mb-1">
                      {zone.lastOrderDate ? Math.floor((Date.now() - zone.lastOrderDate.getTime()) / (1000 * 60 * 60 * 24)) : 'N/A'}
                    </div>
                    <div className="text-sm text-gray-600">Jours depuis dernière</div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Indicateurs de qualité</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Performance globale:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPerformanceBadge(zone.successRate)}`}>
                      {zone.successRate >= 90 ? 'Excellente' : 
                       zone.successRate >= 80 ? 'Correcte' : 'À améliorer'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Délai de livraison:</span>
                    <span className={`font-medium ${
                      zone.averageDeliveryTime <= 25 ? 'text-green-600' :
                      zone.averageDeliveryTime <= 35 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {zone.averageDeliveryTime <= 25 ? 'Rapide' :
                       zone.averageDeliveryTime <= 35 ? 'Correct' : 'Lent'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Activité récente:</span>
                    <span className={`font-medium ${
                      zone.lastOrderDate && (Date.now() - zone.lastOrderDate.getTime()) < 7 * 24 * 60 * 60 * 1000
                        ? 'text-green-600' : 'text-orange-600'
                    }`}>
                      {zone.lastOrderDate && (Date.now() - zone.lastOrderDate.getTime()) < 7 * 24 * 60 * 60 * 1000
                        ? 'Active' : 'Peu active'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Fermer
            </button>
            <button
              onClick={() => {
                onClose();
                handleEditZone(zone);
              }}
              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all flex items-center justify-center space-x-2"
            >
              <Edit3 className="h-4 w-4" />
              <span>Modifier les paramètres</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const EditZoneModal = () => {
    if (!selectedZone) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
          <div className="p-8">
            <div className="text-center mb-6">
              <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Edit3 className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Modifier les paramètres</h2>
              <p className="text-gray-600">{selectedZone.supplierBusinessName} - {selectedZone.communeName}</p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rayon de livraison max (km)</label>
                <input
                  type="number"
                  value={editFormData.maxDeliveryRadius}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, maxDeliveryRadius: parseInt(e.target.value) || 10 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="1"
                  max="50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Commande minimum (FCFA)</label>
                <input
                  type="number"
                  value={editFormData.minimumOrderAmount}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, minimumOrderAmount: parseInt(e.target.value) || 5000 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  step="1000"
                />
                <p className="text-xs text-gray-500 mt-1">{formatPrice(editFormData.minimumOrderAmount)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Frais de livraison (FCFA)</label>
                <input
                  type="number"
                  value={editFormData.deliveryFee}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, deliveryFee: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  step="500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {editFormData.deliveryFee === 0 ? 'Livraison gratuite' : formatPrice(editFormData.deliveryFee)}
                </p>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => setShowEditModal(false)}
                disabled={isProcessing}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleUpdateZone}
                disabled={isProcessing}
                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Mise à jour...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Sauvegarder</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const DeactivateZoneModal = () => {
    if (!selectedZone) return null;

    const deactivationReasons = [
      'Délais de livraison trop longs (>30 minutes)',
      'Taux de réussite insuffisant (<80%)',
      'Trop de commandes annulées',
      'Plaintes clients répétées',
      'Non-respect des horaires annoncés',
      'Problèmes de qualité de service',
      'Zone temporairement non couverte',
      'Maintenance ou réorganisation'
    ];

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
          <div className="p-8">
            <div className="text-center mb-6">
              <div className="h-16 w-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Désactiver la zone de livraison</h2>
              <p className="text-gray-600">{selectedZone.supplierBusinessName} - {selectedZone.communeName}</p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                <div className="text-sm text-red-800">
                  <p className="font-medium mb-2">Cette action va :</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Empêcher ce fournisseur de recevoir de nouvelles commandes dans cette commune</li>
                    <li>Rediriger les futures commandes vers d'autres fournisseurs disponibles</li>
                    <li>Conserver l'historique des performances pour référence</li>
                    <li>Permettre une réactivation ultérieure si les performances s'améliorent</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Sélectionnez la raison de désactivation :
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {deactivationReasons.map((reason) => (
                  <label key={reason} className="flex items-start space-x-3 cursor-pointer p-2 hover:bg-red-50 rounded-lg transition-colors">
                    <input
                      type="radio"
                      name="deactivationReason"
                      value={reason}
                      checked={deactivationReason === reason}
                      onChange={(e) => setDeactivationReason(e.target.value)}
                      className="h-4 w-4 text-red-600 mt-0.5"
                    />
                    <span className="text-sm text-gray-700 flex-1">{reason}</span>
                  </label>
                ))}
                <label className="flex items-start space-x-3 cursor-pointer p-2 hover:bg-red-50 rounded-lg transition-colors">
                  <input
                    type="radio"
                    name="deactivationReason"
                    value="custom"
                    checked={deactivationReason === 'custom'}
                    onChange={(e) => setDeactivationReason(e.target.value)}
                    className="h-4 w-4 text-red-600 mt-0.5"
                  />
                  <span className="text-sm text-gray-700 flex-1">Autre raison (préciser ci-dessous)</span>
                </label>
              </div>
            </div>

            {deactivationReason === 'custom' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Raison personnalisée
                </label>
                <textarea
                  rows={3}
                  value={deactivationReason === 'custom' ? '' : deactivationReason}
                  onChange={(e) => setDeactivationReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                  placeholder="Décrivez la raison de la désactivation..."
                />
              </div>
            )}

            <div className="flex space-x-4">
              <button
                onClick={() => {
                  setShowDeactivateModal(false);
                  setDeactivationReason('');
                }}
                disabled={isProcessing}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={deactivateZone}
                disabled={!deactivationReason.trim() || isProcessing}
                className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-3 rounded-lg font-semibold hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Désactivation...</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className="h-4 w-4" />
                    <span>Confirmer la désactivation</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion des Zones de Livraison</h1>
              <p className="text-gray-600">Administrez les zones de couverture par fournisseur</p>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Zones actives</p>
                <p className="text-2xl font-bold text-green-600">{totalActiveZones}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Zones inactives</p>
                <p className="text-2xl font-bold text-red-600">{totalInactiveZones}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Commandes totales</p>
                <p className="text-2xl font-bold text-blue-600">{totalOrders}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Taux de réussite moyen</p>
                <p className="text-2xl font-bold text-purple-600">{averageSuccessRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Commune Coverage Overview */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Vue d'ensemble par commune</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {communeCoverage.map((commune) => (
              <div key={commune.commune} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">{commune.commune}</h4>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    commune.coverage >= 80 ? 'bg-green-100 text-green-700' :
                    commune.coverage >= 50 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {commune.coverage}%
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  <span>{commune.activeSuppliers}/{commune.totalSuppliers} fournisseur(s) actif(s)</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher fournisseur ou commune..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            
            <select
              value={communeFilter}
              onChange={(e) => setCommuneFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="all">Toutes les communes</option>
              {uniqueCommunes.map(commune => (
                <option key={commune} value={commune}>{commune}</option>
              ))}
            </select>

            <select
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="all">Tous les fournisseurs</option>
              {uniqueSuppliers.map(supplier => (
                <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Zones actives</option>
              <option value="inactive">Zones inactives</option>
            </select>
          </div>
        </div>

        {/* Supplier Zones List */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {filteredSupplierCommunes.length === 0 ? (
            <div className="p-12 text-center">
              <MapPin className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">Aucune zone trouvée</h3>
              <p className="text-gray-500">Essayez de modifier vos critères de recherche</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fournisseur</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commune</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paramètres</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSupplierCommunes.map((sc) => (
                    <tr key={sc.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                              {sc.supplierBusinessName.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{sc.supplierBusinessName}</div>
                            <div className="text-sm text-gray-500">{sc.supplierName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">{sc.communeName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPerformanceBadge(sc.successRate)}`}>
                              {sc.successRate}% réussite
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {sc.totalOrders} commandes • {sc.averageDeliveryTime} min moy.
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>Rayon: {sc.maxDeliveryRadius} km</div>
                          <div>Min: {formatPrice(sc.minimumOrderAmount)}</div>
                          <div>Frais: {sc.deliveryFee === 0 ? 'Gratuit' : formatPrice(sc.deliveryFee)}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            sc.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {sc.isActive ? 'Active' : 'Inactive'}
                          </span>
                          {!sc.isActive && sc.deactivatedAt && (
                            <span className="text-xs text-gray-500">
                              depuis {formatDate(sc.deactivatedAt).split(' ')[0]}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewDetails(sc)}
                            className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-colors"
                            title="Voir détails"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEditZone(sc)}
                            className="p-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-full transition-colors"
                            title="Modifier paramètres"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => toggleZoneStatus(sc)}
                            disabled={isProcessing}
                            className={`p-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                              sc.isActive
                                ? 'text-red-600 hover:text-red-700 hover:bg-red-50'
                                : 'text-green-600 hover:text-green-700 hover:bg-green-50'
                            }`}
                            title={sc.isActive ? 'Désactiver zone' : 'Réactiver zone'}
                          >
                            {sc.isActive ? (
                              <ToggleLeft className="h-4 w-4" />
                            ) : (
                              <ToggleRight className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Performance Analysis */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Analyse des performances par zone</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSupplierCommunes
              .filter(sc => sc.isActive)
              .sort((a, b) => b.successRate - a.successRate)
              .slice(0, 6)
              .map((sc, index) => (
                <div key={sc.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="h-6 w-6 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">{index + 1}</span>
                      </div>
                      <h4 className="font-semibold text-gray-900">{sc.communeName}</h4>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPerformanceBadge(sc.successRate)}`}>
                      {sc.successRate}%
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fournisseur:</span>
                      <span className="font-medium text-gray-900">{sc.supplierBusinessName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Commandes:</span>
                      <span className="font-medium text-gray-900">{sc.totalOrders}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Temps moyen:</span>
                      <span className={`font-medium ${
                        sc.averageDeliveryTime <= 25 ? 'text-green-600' :
                        sc.averageDeliveryTime <= 35 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {sc.averageDeliveryTime} min
                      </span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Zone Details Modal */}
      {showDetailsModal && selectedZone && (
        <ZoneDetailsModal
          zone={selectedZone}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedZone(null);
          }}
        />
      )}

      {/* Edit Zone Modal */}
      {showEditModal && <EditZoneModal />}

      {/* Deactivate Zone Modal */}
      {showDeactivateModal && <DeactivateZoneModal />}
    </>
  );
};