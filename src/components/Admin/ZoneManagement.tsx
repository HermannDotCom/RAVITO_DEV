import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Users, 
  Package, 
  TrendingUp, 
  Clock, 
  Search,
  Filter,
  Eye,
  ToggleLeft,
  ToggleRight,
  Building,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Edit3,
  Save,
  X,
  Star,
  Truck
} from 'lucide-react';
import { Supplier, SupplierCommune } from '../../types';
import { mockSuppliers } from '../../data/mockSuppliers';
import { getAllDemoAccounts } from '../../data/demoAccounts';

interface SupplierZoneData {
  supplier: Supplier;
  commune: SupplierCommune;
}

export const ZoneManagement: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [communeFilter, setCommuneFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [supplierFilter, setSupplierFilter] = useState<string>('all');
  const [selectedZone, setSelectedZone] = useState<SupplierZoneData | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [editFormData, setEditFormData] = useState({
    maxDeliveryRadius: 10,
    minimumOrderAmount: 5000,
    deliveryFee: 0,
    deactivationReason: ''
  });

  // Load suppliers from mock data and demo accounts
  useEffect(() => {
    const allDemoAccounts = getAllDemoAccounts();
    const supplierAccounts = allDemoAccounts
      .filter(account => account.role === 'supplier')
      .map(account => account.userData as Supplier);
    
    const allSuppliers = [...mockSuppliers, ...supplierAccounts];
    setSuppliers(allSuppliers);
  }, []);

  // Get all supplier-commune combinations
  const getAllSupplierZones = (): SupplierZoneData[] => {
    const zones: SupplierZoneData[] = [];
    
    suppliers.forEach(supplier => {
      supplier.coverageCommunes.forEach(commune => {
        zones.push({ supplier, commune });
      });
    });
    
    return zones;
  };

  const supplierZones = getAllSupplierZones();

  // Get unique communes
  const uniqueCommunes = Array.from(
    new Set(supplierZones.map(zone => zone.commune.communeName))
  ).sort();

  // Get unique suppliers
  const uniqueSuppliers = Array.from(
    new Set(suppliers.map(supplier => supplier.businessName))
  ).sort();

  // Filter zones
  const filteredZones = supplierZones.filter(zone => {
    const matchesSearch = zone.supplier.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         zone.commune.communeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCommune = communeFilter === 'all' || zone.commune.communeName === communeFilter;
    const matchesStatus = statusFilter === 'all' || 
                        (statusFilter === 'active' && zone.commune.isActive) ||
                        (statusFilter === 'inactive' && !zone.commune.isActive);
    const matchesSupplier = supplierFilter === 'all' || zone.supplier.businessName === supplierFilter;
    
    return matchesSearch && matchesCommune && matchesStatus && matchesSupplier;
  });

  const handleToggleZoneStatus = async (supplierId: string, communeId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    const commune = supplier?.coverageCommunes.find(c => c.communeId === communeId);
    
    if (!supplier || !commune) return;

    const action = commune.isActive ? 'désactiver' : 'activer';
    const confirmMessage = commune.isActive 
      ? `Êtes-vous sûr de vouloir désactiver la zone "${commune.communeName}" pour "${supplier.businessName}"?\n\nCela empêchera ce fournisseur d'accepter de nouvelles commandes dans cette commune.`
      : `Êtes-vous sûr de vouloir activer la zone "${commune.communeName}" pour "${supplier.businessName}"?\n\nCela permettra à ce fournisseur d'accepter des commandes dans cette commune.`;

    if (!confirm(confirmMessage)) return;

    setIsProcessing(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    setSuppliers(prev => prev.map(s => 
      s.id === supplierId 
        ? {
            ...s,
            coverageCommunes: s.coverageCommunes.map(c =>
              c.communeId === communeId
                ? {
                    ...c,
                    isActive: !c.isActive,
                    ...(c.isActive ? {
                      deactivatedAt: new Date(),
                      deactivationReason: 'Désactivation manuelle par l\'administrateur'
                    } : {
                      deactivatedAt: undefined,
                      deactivationReason: undefined
                    })
                  }
                : c
            )
          }
        : s
    ));

    setIsProcessing(false);

    const statusText = commune.isActive ? 'désactivée' : 'activée';
    alert(`✅ Zone "${commune.communeName}" ${statusText} pour "${supplier.businessName}"!`);
  };

  const handleViewDetails = (zone: SupplierZoneData) => {
    setSelectedZone(zone);
    setShowDetailsModal(true);
  };

  const handleEditZone = (zone: SupplierZoneData) => {
    setSelectedZone(zone);
    setEditFormData({
      maxDeliveryRadius: zone.commune.maxDeliveryRadius,
      minimumOrderAmount: zone.commune.minimumOrderAmount,
      deliveryFee: zone.commune.deliveryFee,
      deactivationReason: zone.commune.deactivationReason || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateZone = async () => {
    if (!selectedZone) return;

    setIsProcessing(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    setSuppliers(prev => prev.map(s => 
      s.id === selectedZone.supplier.id 
        ? {
            ...s,
            coverageCommunes: s.coverageCommunes.map(c =>
              c.communeId === selectedZone.commune.communeId
                ? {
                    ...c,
                    maxDeliveryRadius: editFormData.maxDeliveryRadius,
                    minimumOrderAmount: editFormData.minimumOrderAmount,
                    deliveryFee: editFormData.deliveryFee,
                    deactivationReason: editFormData.deactivationReason || c.deactivationReason
                  }
                : c
            )
          }
        : s
    ));

    setIsProcessing(false);
    setShowEditModal(false);
    setSelectedZone(null);

    alert(`✅ Zone "${selectedZone.commune.communeName}" mise à jour pour "${selectedZone.supplier.businessName}"!`);
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

  // Calculate summary stats
  const totalActiveZones = filteredZones.filter(z => z.commune.isActive).length;
  const totalInactiveZones = filteredZones.filter(z => !z.commune.isActive).length;
  const totalOrders = filteredZones.reduce((sum, zone) => sum + zone.commune.totalOrders, 0);
  const averageSuccessRate = filteredZones.length > 0 
    ? Math.round(filteredZones.reduce((sum, zone) => sum + zone.commune.successRate, 0) / filteredZones.length)
    : 0;

  const ZoneDetailsModal = ({ zone, onClose }: { zone: SupplierZoneData; onClose: () => void }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center">
                <MapPin className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{zone.commune.communeName}</h2>
                <p className="text-gray-600">Fournisseur: {zone.supplier.businessName}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    zone.commune.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {zone.commune.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span className="text-xs text-gray-500">
                    Activée le {formatDate(zone.commune.activatedAt)}
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
                    <span className="font-medium text-gray-900">{zone.commune.maxDeliveryRadius} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Commande minimum:</span>
                    <span className="font-medium text-gray-900">{formatPrice(zone.commune.minimumOrderAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Frais de livraison:</span>
                    <span className="font-medium text-gray-900">
                      {zone.commune.deliveryFee === 0 ? 'Gratuit' : formatPrice(zone.commune.deliveryFee)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Temps moyen:</span>
                    <span className="font-medium text-gray-900">{zone.commune.averageDeliveryTime} min</span>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <Users className="h-5 w-5 mr-2 text-green-600" />
                  Informations fournisseur
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nom du dépôt:</span>
                    <span className="font-medium text-gray-900">{zone.supplier.businessName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Responsable:</span>
                    <span className="font-medium text-gray-900">{zone.supplier.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Téléphone:</span>
                    <span className="font-medium text-gray-900">{zone.supplier.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Capacité:</span>
                    <span className="font-medium text-gray-900 capitalize">{zone.supplier.deliveryCapacity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Note globale:</span>
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="font-medium text-gray-900">{zone.supplier.rating}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Stats */}
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Statistiques de performance</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-white rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 mb-1">{zone.commune.totalOrders}</div>
                    <div className="text-sm text-gray-600">Commandes totales</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg">
                    <div className="text-2xl font-bold text-green-600 mb-1">{zone.commune.successRate}%</div>
                    <div className="text-sm text-gray-600">Taux de réussite</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg">
                    <div className="text-2xl font-bold text-orange-600 mb-1">{zone.commune.averageDeliveryTime}</div>
                    <div className="text-sm text-gray-600">Temps moyen (min)</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 mb-1">
                      {zone.commune.lastDelivery ? 
                        Math.floor((Date.now() - zone.commune.lastDelivery.getTime()) / (1000 * 60 * 60 * 24)) : 'N/A'}
                    </div>
                    <div className="text-sm text-gray-600">Jours depuis dernière</div>
                  </div>
                </div>
              </div>

              {!zone.commune.isActive && zone.commune.deactivationReason && (
                <div className="bg-red-50 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
                    Raison de désactivation
                  </h3>
                  <div className="space-y-2">
                    <p className="text-red-800 font-medium">{zone.commune.deactivationReason}</p>
                    {zone.commune.deactivatedAt && (
                      <p className="text-sm text-red-600">
                        Désactivée le {formatDate(zone.commune.deactivatedAt)}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="bg-yellow-50 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Informations opérationnelles</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className={`h-3 w-3 rounded-full ${zone.commune.isActive ? 'bg-green-400' : 'bg-red-400'}`}></div>
                    <span className="text-gray-700">
                      Zone {zone.commune.isActive ? 'active' : 'inactive'} pour les nouvelles commandes
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Truck className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">
                      Capacité de livraison: {zone.supplier.deliveryCapacity}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">
                      Horaires: {zone.supplier.businessHours}
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
              className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transition-all flex items-center justify-center space-x-2"
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
            <div className="text-center mb-8">
              <div className="h-16 w-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Edit3 className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Modifier la zone</h2>
              <p className="text-gray-600">
                {selectedZone.commune.communeName} - {selectedZone.supplier.businessName}
              </p>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rayon de livraison max (km)
                  </label>
                  <input
                    type="number"
                    value={editFormData.maxDeliveryRadius}
                    onChange={(e) => setEditFormData(prev => ({ 
                      ...prev, 
                      maxDeliveryRadius: parseInt(e.target.value) || 10 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    min="1"
                    max="50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Commande minimum (FCFA)
                  </label>
                  <input
                    type="number"
                    value={editFormData.minimumOrderAmount}
                    onChange={(e) => setEditFormData(prev => ({ 
                      ...prev, 
                      minimumOrderAmount: parseInt(e.target.value) || 5000 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    step="1000"
                  />
                  <p className="text-xs text-gray-500 mt-1">{formatPrice(editFormData.minimumOrderAmount)}</p>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Frais de livraison (FCFA)
                  </label>
                  <input
                    type="number"
                    value={editFormData.deliveryFee}
                    onChange={(e) => setEditFormData(prev => ({ 
                      ...prev, 
                      deliveryFee: parseInt(e.target.value) || 0 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    step="500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {editFormData.deliveryFee === 0 ? 'Livraison gratuite' : formatPrice(editFormData.deliveryFee)}
                  </p>
                </div>
              </div>

              {!selectedZone.commune.isActive && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Raison de désactivation
                  </label>
                  <textarea
                    value={editFormData.deactivationReason}
                    onChange={(e) => setEditFormData(prev => ({ 
                      ...prev, 
                      deactivationReason: e.target.value 
                    }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                    placeholder="Expliquez pourquoi cette zone a été désactivée..."
                  />
                </div>
              )}

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-2">Impact des modifications :</p>
                    <ul className="space-y-1 list-disc list-inside">
                      <li>Les nouveaux paramètres s'appliquent immédiatement</li>
                      <li>Les commandes en cours ne sont pas affectées</li>
                      <li>Le fournisseur sera notifié des changements</li>
                    </ul>
                  </div>
                </div>
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
                className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
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
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Commandes totales</p>
                <p className="text-2xl font-bold text-orange-600">{totalOrders}</p>
              </div>
              <Package className="h-8 w-8 text-orange-600" />
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

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                <option key={supplier} value={supplier}>{supplier}</option>
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

        {/* Zones List */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {filteredZones.length === 0 ? (
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Configuration</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredZones.map((zone) => (
                    <tr key={`${zone.supplier.id}-${zone.commune.communeId}`} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-bold">
                              {zone.supplier.businessName.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{zone.supplier.businessName}</div>
                            <div className="text-sm text-gray-500">{zone.supplier.name}</div>
                            <div className="flex items-center space-x-1 mt-1">
                              <Star className="h-3 w-3 text-yellow-400 fill-current" />
                              <span className="text-xs text-gray-600">{zone.supplier.rating}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{zone.commune.communeName}</div>
                        <div className="text-sm text-gray-500">
                          Activée le {formatDate(zone.commune.activatedAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-gray-600">Commandes:</span>
                            <span className="font-medium text-gray-900">{zone.commune.totalOrders}</span>
                          </div>
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-gray-600">Réussite:</span>
                            <span className={`font-medium ${
                              zone.commune.successRate >= 90 ? 'text-green-600' : 
                              zone.commune.successRate >= 75 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {zone.commune.successRate}%
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-600">Temps:</span>
                            <span className="font-medium text-gray-900">{zone.commune.averageDeliveryTime} min</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="mb-1">
                            <span className="text-gray-600">Rayon:</span>
                            <span className="font-medium text-gray-900 ml-2">{zone.commune.maxDeliveryRadius} km</span>
                          </div>
                          <div className="mb-1">
                            <span className="text-gray-600">Min:</span>
                            <span className="font-medium text-gray-900 ml-2">{formatPrice(zone.commune.minimumOrderAmount)}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Frais:</span>
                            <span className="font-medium text-gray-900 ml-2">
                              {zone.commune.deliveryFee === 0 ? 'Gratuit' : formatPrice(zone.commune.deliveryFee)}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col space-y-2">
                          <button
                            onClick={() => handleToggleZoneStatus(zone.supplier.id, zone.commune.communeId)}
                            disabled={isProcessing}
                            className="flex items-center space-x-2"
                          >
                            {zone.commune.isActive ? (
                              <>
                                <ToggleRight className="h-5 w-5 text-green-600" />
                                <span className="text-sm text-green-600 font-medium">Active</span>
                              </>
                            ) : (
                              <>
                                <ToggleLeft className="h-5 w-5 text-red-600" />
                                <span className="text-sm text-red-600 font-medium">Inactive</span>
                              </>
                            )}
                          </button>
                          {!zone.commune.isActive && zone.commune.deactivationReason && (
                            <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                              {zone.commune.deactivationReason}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewDetails(zone)}
                            className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEditZone(zone)}
                            className="p-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-full transition-colors"
                          >
                            <Edit3 className="h-4 w-4" />
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

        {/* Performance Overview by Commune */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Vue d'ensemble par commune</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {uniqueCommunes.map(communeName => {
              const communeZones = supplierZones.filter(zone => zone.commune.communeName === communeName);
              const activeZones = communeZones.filter(zone => zone.commune.isActive);
              const totalOrders = communeZones.reduce((sum, zone) => sum + zone.commune.totalOrders, 0);
              const avgSuccessRate = communeZones.length > 0 
                ? Math.round(communeZones.reduce((sum, zone) => sum + zone.commune.successRate, 0) / communeZones.length)
                : 0;

              return (
                <div key={communeName} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900">{communeName}</h4>
                    <div className={`h-3 w-3 rounded-full ${
                      activeZones.length > 0 ? 'bg-green-400' : 'bg-red-400'
                    }`}></div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fournisseurs actifs:</span>
                      <span className="font-medium text-gray-900">{activeZones.length}/{communeZones.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Commandes totales:</span>
                      <span className="font-medium text-gray-900">{totalOrders}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Taux de réussite:</span>
                      <span className={`font-medium ${
                        avgSuccessRate >= 90 ? 'text-green-600' : 
                        avgSuccessRate >= 75 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {avgSuccessRate}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
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
    </>
  );
};