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
  Navigation,
  Shield,
  Settings,
  Plus,
  Trash2,
  UserPlus,
  UserMinus
} from 'lucide-react';
import { mockSuppliers, deliveryZones } from '../../data/mockSuppliers';
import { SupplierCommune, DeliveryZone } from '../../types';

export const ZoneManagement: React.FC = () => {
  const [zones, setZones] = useState(deliveryZones);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedZone, setSelectedZone] = useState<DeliveryZone | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierCommune | null>(null);
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [showAddZoneModal, setShowAddZoneModal] = useState(false);
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deactivationReason, setDeactivationReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);

  const [newZoneData, setNewZoneData] = useState({
    communeName: '',
    maxSuppliers: 5,
    minimumCoverage: 2,
    operatingHours: '18h00 - 06h00'
  });

  const [editFormData, setEditFormData] = useState({
    maxDeliveryRadius: 10,
    minimumOrderAmount: 5000,
    deliveryFee: 0
  });

  // Filtrer les zones
  const filteredZones = zones.filter(zone => {
    const matchesSearch = zone.communeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && zone.isActive) ||
                         (statusFilter === 'inactive' && !zone.isActive);
    
    return matchesSearch && matchesStatus;
  });

  const toggleZoneStatus = async (zone: DeliveryZone) => {
    const confirmMessage = `Êtes-vous sûr de vouloir ${zone.isActive ? 'désactiver' : 'activer'} la zone "${zone.communeName}" ?`;
    
    if (!confirm(confirmMessage)) return;

    setIsProcessing(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    setZones(prev => prev.map(z => 
      z.id === zone.id
        ? { ...z, isActive: !z.isActive, updatedAt: new Date() }
        : z
    ));

    setIsProcessing(false);

    const action = zone.isActive ? 'désactivée' : 'activée';
    alert(`✅ Zone ${action} avec succès!\n\nLa zone "${zone.communeName}" est maintenant ${action}.`);
  };

  const handleAddZone = async () => {
    if (!newZoneData.communeName.trim()) return;

    setIsProcessing(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    const newZone: DeliveryZone = {
      id: `zone-${Date.now()}`,
      communeName: newZoneData.communeName,
      isActive: true,
      suppliers: [],
      zoneSettings: {
        maxSuppliers: newZoneData.maxSuppliers,
        minimumCoverage: newZoneData.minimumCoverage,
        operatingHours: newZoneData.operatingHours
      },
      statistics: {
        totalSuppliers: 0,
        activeSuppliers: 0,
        totalOrders: 0,
        averageDeliveryTime: 0,
        successRate: 0
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setZones(prev => [...prev, newZone]);
    setNewZoneData({
      communeName: '',
      maxSuppliers: 5,
      minimumCoverage: 2,
      operatingHours: '18h00 - 06h00'
    });
    setShowAddZoneModal(false);
    setIsProcessing(false);

    alert(`✅ Zone "${newZone.communeName}" créée avec succès!`);
  };

  const handleEditZone = async () => {
    if (!editingZone) return;

    setIsProcessing(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    setZones(prev => prev.map(z => 
      z.id === editingZone.id
        ? { 
            ...z, 
            communeName: newZoneData.communeName,
            zoneSettings: {
              maxSuppliers: newZoneData.maxSuppliers,
              minimumCoverage: newZoneData.minimumCoverage,
              operatingHours: newZoneData.operatingHours
            },
            updatedAt: new Date()
          }
        : z
    ));

    setEditingZone(null);
    setShowAddZoneModal(false);
    setIsProcessing(false);

    alert(`✅ Zone "${newZoneData.communeName}" modifiée avec succès!`);
  };

  const handleDeleteZone = async (zone: DeliveryZone) => {
    const confirmMessage = `Êtes-vous sûr de vouloir supprimer définitivement la zone "${zone.communeName}" ?\n\nCette action supprimera aussi toutes les inscriptions de fournisseurs dans cette zone.`;
    
    if (!confirm(confirmMessage)) return;

    setIsProcessing(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    setZones(prev => prev.filter(z => z.id !== zone.id));
    setIsProcessing(false);

    alert(`✅ Zone "${zone.communeName}" supprimée avec succès!`);
  };

  const handleAddSupplierToZone = async (supplierId: string, supplierName: string) => {
    if (!selectedZone) return;

    setIsProcessing(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    const newSupplierCommune: SupplierCommune = {
      id: `sc-${Date.now()}`,
      supplierId,
      supplierName,
      supplierBusinessName: supplierName,
      isActive: true,
      registeredAt: new Date(),
      approvedAt: new Date(),
      performanceMetrics: {
        totalOrders: 0,
        successRate: 100,
        averageDeliveryTime: 25,
        lastOrderDate: undefined
      },
      deliverySettings: {
        maxDeliveryRadius: 10,
        minimumOrderAmount: 5000,
        deliveryFee: 0
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setZones(prev => prev.map(z => 
      z.id === selectedZone.id
        ? { 
            ...z, 
            suppliers: [...z.suppliers, newSupplierCommune],
            statistics: {
              ...z.statistics,
              totalSuppliers: z.statistics.totalSuppliers + 1,
              activeSuppliers: z.statistics.activeSuppliers + 1
            },
            updatedAt: new Date()
          }
        : z
    ));

    setShowAddSupplierModal(false);
    setIsProcessing(false);

    alert(`✅ Fournisseur "${supplierName}" ajouté à la zone "${selectedZone.communeName}" avec succès!`);
  };

  const handleRemoveSupplierFromZone = async (supplierId: string, supplierName: string) => {
    if (!selectedZone) return;

    const confirmMessage = `Êtes-vous sûr de vouloir retirer "${supplierName}" de la zone "${selectedZone.communeName}" ?`;
    
    if (!confirm(confirmMessage)) return;

    setIsProcessing(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    setZones(prev => prev.map(z => 
      z.id === selectedZone.id
        ? { 
            ...z, 
            suppliers: z.suppliers.filter(s => s.supplierId !== supplierId),
            statistics: {
              ...z.statistics,
              totalSuppliers: z.statistics.totalSuppliers - 1,
              activeSuppliers: z.statistics.activeSuppliers - (z.suppliers.find(s => s.supplierId === supplierId)?.isActive ? 1 : 0)
            },
            updatedAt: new Date()
          }
        : z
    ));

    setIsProcessing(false);

    alert(`✅ Fournisseur "${supplierName}" retiré de la zone "${selectedZone.communeName}" avec succès!`);
  };

  const toggleSupplierInZone = async (supplier: SupplierCommune) => {
    if (supplier.isActive) {
      // Show deactivation modal
      setSelectedSupplier(supplier);
      setShowDeactivateModal(true);
    } else {
      // Reactivate directly
      await reactivateSupplierInZone(supplier);
    }
  };

  const deactivateSupplierInZone = async () => {
    if (!selectedSupplier || !deactivationReason.trim() || !selectedZone) return;

    setIsProcessing(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    setZones(prev => prev.map(z => 
      z.id === selectedZone.id
        ? {
            ...z,
            suppliers: z.suppliers.map(s => 
              s.id === selectedSupplier.id
                ? {
                    ...s,
                    isActive: false,
                    deactivatedAt: new Date(),
                    deactivationReason: deactivationReason,
                    updatedAt: new Date()
                  }
                : s
            ),
            statistics: {
              ...z.statistics,
              activeSuppliers: z.statistics.activeSuppliers - 1
            },
            updatedAt: new Date()
          }
        : z
    ));

    setIsProcessing(false);
    setShowDeactivateModal(false);
    setSelectedSupplier(null);
    setDeactivationReason('');

    alert(`✅ Fournisseur désactivé dans la zone!\n\n${selectedSupplier.supplierBusinessName} ne peut plus livrer dans ${selectedZone.communeName}.\n\nRaison: ${deactivationReason}`);
  };

  const reactivateSupplierInZone = async (supplier: SupplierCommune) => {
    if (!selectedZone) return;

    const confirmMessage = `Êtes-vous sûr de vouloir réactiver "${supplier.supplierBusinessName}" dans la zone "${selectedZone.communeName}" ?`;
    
    if (!confirm(confirmMessage)) return;

    setIsProcessing(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    setZones(prev => prev.map(z => 
      z.id === selectedZone.id
        ? {
            ...z,
            suppliers: z.suppliers.map(s => 
              s.id === supplier.id
                ? {
                    ...s,
                    isActive: true,
                    reactivatedAt: new Date(),
                    deactivationReason: undefined,
                    updatedAt: new Date()
                  }
                : s
            ),
            statistics: {
              ...z.statistics,
              activeSuppliers: z.statistics.activeSuppliers + 1
            },
            updatedAt: new Date()
          }
        : z
    ));

    setIsProcessing(false);

    alert(`✅ Fournisseur réactivé dans la zone!\n\n${supplier.supplierBusinessName} peut maintenant livrer dans ${selectedZone.communeName}.`);
  };

  const handleEditSupplierSettings = (supplier: SupplierCommune) => {
    setSelectedSupplier(supplier);
    setEditFormData({
      maxDeliveryRadius: supplier.deliverySettings.maxDeliveryRadius,
      minimumOrderAmount: supplier.deliverySettings.minimumOrderAmount,
      deliveryFee: supplier.deliverySettings.deliveryFee
    });
    setShowEditModal(true);
  };

  const handleUpdateSupplierSettings = async () => {
    if (!selectedSupplier || !selectedZone) return;

    setIsProcessing(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    setZones(prev => prev.map(z => 
      z.id === selectedZone.id
        ? {
            ...z,
            suppliers: z.suppliers.map(s => 
              s.id === selectedSupplier.id
                ? {
                    ...s,
                    deliverySettings: editFormData,
                    updatedAt: new Date()
                  }
                : s
            ),
            updatedAt: new Date()
          }
        : z
    ));

    setIsProcessing(false);
    setShowEditModal(false);
    setSelectedSupplier(null);

    alert(`✅ Paramètres mis à jour avec succès!\n\nParamètres de livraison mis à jour pour ${selectedSupplier.supplierBusinessName} dans ${selectedZone.communeName}.`);
  };

  const handleViewZoneDetails = (zone: DeliveryZone) => {
    setSelectedZone(zone);
    setShowZoneModal(true);
  };

  const handleEditZoneClick = (zone: DeliveryZone) => {
    setEditingZone(zone);
    setNewZoneData({
      communeName: zone.communeName,
      maxSuppliers: zone.zoneSettings.maxSuppliers,
      minimumCoverage: zone.zoneSettings.minimumCoverage,
      operatingHours: zone.zoneSettings.operatingHours
    });
    setShowAddZoneModal(true);
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
  const totalActiveZones = zones.filter(z => z.isActive).length;
  const totalInactiveZones = zones.filter(z => !z.isActive).length;
  const totalActiveSuppliers = zones.reduce((sum, zone) => sum + zone.statistics.activeSuppliers, 0);
  const totalInactiveSuppliers = zones.reduce((sum, zone) => sum + (zone.statistics.totalSuppliers - zone.statistics.activeSuppliers), 0);

  // Get available suppliers not in current zone
  const getAvailableSuppliers = () => {
    if (!selectedZone) return [];
    
    const suppliersInZone = selectedZone.suppliers.map(s => s.supplierId);
    return mockSuppliers.filter(supplier => 
      !suppliersInZone.includes(supplier.id) && supplier.isActive
    );
  };

  const ZoneModal = ({ zone, onClose }: { 
    zone: DeliveryZone; 
    onClose: () => void 
  }) => {
    const availableSuppliers = getAvailableSuppliers();
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
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
              {/* Zone Configuration */}
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

              {/* Suppliers in Zone */}
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Fournisseurs inscrits</h3>
                    <button
                      onClick={() => setShowAddSupplierModal(true)}
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
                              onClick={() => handleEditSupplierSettings(supplier)}
                              className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                            >
                              <Edit3 className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => toggleSupplierInZone(supplier)}
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
                              onClick={() => handleRemoveSupplierFromZone(supplier.supplierId, supplier.supplierBusinessName)}
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

            {/* Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Fermer
              </button>
              <button
                onClick={() => handleEditZoneClick(zone)}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Edit3 className="h-4 w-4" />
                <span>Modifier la zone</span>
              </button>
              <button
                onClick={() => toggleZoneStatus(zone)}
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

  const AddZoneModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
        <div className="p-8">
          <div className="text-center mb-6">
            <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {editingZone ? 'Modifier la zone' : 'Nouvelle zone de livraison'}
            </h2>
            <p className="text-gray-600">
              {editingZone ? 'Modifiez les paramètres de la zone' : 'Créez une nouvelle zone de livraison'}
            </p>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nom de la commune *</label>
              <input
                type="text"
                value={newZoneData.communeName}
                onChange={(e) => setNewZoneData(prev => ({ ...prev, communeName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ex: Plateau, Cocody, Marcory..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fournisseurs maximum</label>
                <input
                  type="number"
                  value={newZoneData.maxSuppliers}
                  onChange={(e) => setNewZoneData(prev => ({ ...prev, maxSuppliers: parseInt(e.target.value) || 5 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="1"
                  max="20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Couverture minimum</label>
                <input
                  type="number"
                  value={newZoneData.minimumCoverage}
                  onChange={(e) => setNewZoneData(prev => ({ ...prev, minimumCoverage: parseInt(e.target.value) || 1 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="1"
                  max="10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Horaires d'activité</label>
              <input
                type="text"
                value={newZoneData.operatingHours}
                onChange={(e) => setNewZoneData(prev => ({ ...prev, operatingHours: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ex: 18h00 - 06h00"
              />
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={() => {
                setShowAddZoneModal(false);
                setEditingZone(null);
                setNewZoneData({
                  communeName: '',
                  maxSuppliers: 5,
                  minimumCoverage: 2,
                  operatingHours: '18h00 - 06h00'
                });
              }}
              disabled={isProcessing}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={editingZone ? handleEditZone : handleAddZone}
              disabled={!newZoneData.communeName.trim() || isProcessing}
              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>{editingZone ? 'Modification...' : 'Création...'}</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>{editingZone ? 'Modifier' : 'Créer la zone'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const AddSupplierModal = () => {
    const availableSuppliers = getAvailableSuppliers();
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
          <div className="p-8">
            <div className="text-center mb-6">
              <div className="h-16 w-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserPlus className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Ajouter un fournisseur</h2>
              <p className="text-gray-600">Sélectionnez un fournisseur à inscrire dans la zone "{selectedZone?.communeName}"</p>
            </div>

            {availableSuppliers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Aucun fournisseur disponible</p>
                <p className="text-gray-400 text-sm">Tous les fournisseurs actifs sont déjà inscrits dans cette zone</p>
              </div>
            ) : (
              <div className="space-y-3 mb-6">
                {availableSuppliers.map((supplier) => (
                  <button
                    key={supplier.id}
                    onClick={() => handleAddSupplierToZone(supplier.id, supplier.businessName)}
                    className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-all text-left"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold">
                          {supplier.businessName.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{supplier.businessName}</h4>
                        <p className="text-sm text-gray-600">{supplier.name}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                          <span>📍 {supplier.address}</span>
                          <span>⭐ {supplier.rating}</span>
                          <span>📦 {supplier.totalOrders} livraisons</span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div className="flex space-x-4">
              <button
                onClick={() => setShowAddSupplierModal(false)}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const EditSupplierModal = () => {
    if (!selectedSupplier) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
          <div className="p-8">
            <div className="text-center mb-6">
              <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Edit3 className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Modifier les paramètres</h2>
              <p className="text-gray-600">{selectedSupplier.supplierBusinessName} - {selectedZone?.communeName}</p>
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
                onClick={handleUpdateSupplierSettings}
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

  const DeactivateSupplierModal = () => {
    if (!selectedSupplier) return null;

    const deactivationReasons = [
      'Délais de livraison trop longs (>30 minutes)',
      'Taux de réussite insuffisant (<80%)',
      'Trop de commandes annulées',
      'Plaintes clients répétées',
      'Non-respect des horaires annoncés',
      'Problèmes de qualité de service',
      'Zone temporairement non couverte par ce fournisseur',
      'Maintenance ou réorganisation du fournisseur'
    ];

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
          <div className="p-8">
            <div className="text-center mb-6">
              <div className="h-16 w-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Désactiver le fournisseur dans cette zone</h2>
              <p className="text-gray-600">{selectedSupplier.supplierBusinessName} - Zone {selectedZone?.communeName}</p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                <div className="text-sm text-red-800">
                  <p className="font-medium mb-2">Cette action va :</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Empêcher ce fournisseur de recevoir de nouvelles commandes dans cette zone</li>
                    <li>Rediriger les futures commandes vers d'autres fournisseurs de la zone</li>
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
                onClick={deactivateSupplierInZone}
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
              <p className="text-gray-600">Administrez les zones par commune et gérez les fournisseurs inscrits</p>
            </div>
            <button
              onClick={() => setShowAddZoneModal(true)}
              className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Nouvelle zone</span>
            </button>
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
                <p className="text-sm font-medium text-gray-600 mb-1">Fournisseurs actifs</p>
                <p className="text-2xl font-bold text-blue-600">{totalActiveSuppliers}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Fournisseurs inactifs</p>
                <p className="text-2xl font-bold text-orange-600">{totalInactiveSuppliers}</p>
              </div>
              <Package className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher une zone..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="all">Toutes les zones</option>
              <option value="active">Zones actives</option>
              <option value="inactive">Zones inactives</option>
            </select>
          </div>
        </div>

        {/* Zones Overview */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Vue d'ensemble des zones</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredZones.map((zone) => (
              <div 
                key={zone.id} 
                className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-orange-300 hover:shadow-md transition-all"
                onClick={() => handleViewZoneDetails(zone)}
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">{zone.communeName}</h4>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      zone.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {zone.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <div className="flex space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditZoneClick(zone);
                        }}
                        className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                      >
                        <Edit3 className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteZone(zone);
                        }}
                        className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fournisseurs:</span>
                    <span className="font-medium text-gray-900">
                      {zone.statistics.activeSuppliers}/{zone.statistics.totalSuppliers}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Commandes:</span>
                    <span className="font-medium text-gray-900">{zone.statistics.totalOrders}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Performance:</span>
                    <span className={`font-medium ${getPerformanceColor(zone.statistics.successRate)}`}>
                      {zone.statistics.successRate}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Temps moyen:</span>
                    <span className={`font-medium ${
                      zone.statistics.averageDeliveryTime <= 25 ? 'text-green-600' :
                      zone.statistics.averageDeliveryTime <= 35 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {zone.statistics.averageDeliveryTime} min
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Zone Details Modal */}
      {showZoneModal && selectedZone && (
        <ZoneModal
          zone={selectedZone}
          onClose={() => {
            setShowZoneModal(false);
            setSelectedZone(null);
          }}
        />
      )}

      {/* Add/Edit Zone Modal */}
      {showAddZoneModal && <AddZoneModal />}

      {/* Add Supplier Modal */}
      {showAddSupplierModal && <AddSupplierModal />}

      {/* Edit Supplier Modal */}
      {showEditModal && <EditSupplierModal />}

      {/* Deactivate Supplier Modal */}
      {showDeactivateModal && <DeactivateSupplierModal />}
    </>
  );
};