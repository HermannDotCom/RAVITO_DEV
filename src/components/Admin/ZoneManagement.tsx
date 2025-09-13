import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Plus, 
  Edit3, 
  Trash2, 
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
  Navigation,
  Building,
  Calendar
} from 'lucide-react';

interface DeliveryZone {
  id: string;
  name: string;
  description: string;
  coordinates: { lat: number; lng: number }[];
  activeSuppliers: number;
  totalOrders: number;
  averageDeliveryTime: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  maxDeliveryRadius: number;
  minimumOrderAmount: number;
  deliveryFee: number;
  communes: string[];
}

interface ZoneFormData {
  name: string;
  description: string;
  maxDeliveryRadius: number;
  minimumOrderAmount: number;
  deliveryFee: number;
  communes: string[];
  isActive: boolean;
}

export const ZoneManagement: React.FC = () => {
  const [zones, setZones] = useState<DeliveryZone[]>([
    {
      id: 'zone-1',
      name: 'Plateau',
      description: 'Centre-ville d\'Abidjan, quartier des affaires',
      coordinates: [
        { lat: 5.3267, lng: -4.0305 },
        { lat: 5.3280, lng: -4.0250 },
        { lat: 5.3200, lng: -4.0200 },
        { lat: 5.3150, lng: -4.0280 }
      ],
      activeSuppliers: 5,
      totalOrders: 145,
      averageDeliveryTime: 18,
      isActive: true,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-12-10'),
      maxDeliveryRadius: 8,
      minimumOrderAmount: 5000,
      deliveryFee: 0,
      communes: ['Plateau', 'Marcory Zone 4']
    },
    {
      id: 'zone-2',
      name: 'Cocody',
      description: 'Quartier résidentiel haut standing',
      coordinates: [
        { lat: 5.3364, lng: -4.0267 },
        { lat: 5.3400, lng: -4.0200 },
        { lat: 5.3300, lng: -4.0150 },
        { lat: 5.3250, lng: -4.0250 }
      ],
      activeSuppliers: 4,
      totalOrders: 123,
      averageDeliveryTime: 22,
      isActive: true,
      createdAt: new Date('2024-02-01'),
      updatedAt: new Date('2024-12-08'),
      maxDeliveryRadius: 12,
      minimumOrderAmount: 8000,
      deliveryFee: 1000,
      communes: ['Cocody', 'Deux Plateaux', 'Riviera']
    },
    {
      id: 'zone-3',
      name: 'Marcory',
      description: 'Zone industrielle et résidentielle',
      coordinates: [
        { lat: 5.2900, lng: -4.0100 },
        { lat: 5.2950, lng: -4.0050 },
        { lat: 5.2850, lng: -4.0000 },
        { lat: 5.2800, lng: -4.0080 }
      ],
      activeSuppliers: 3,
      totalOrders: 89,
      averageDeliveryTime: 25,
      isActive: true,
      createdAt: new Date('2024-02-15'),
      updatedAt: new Date('2024-12-05'),
      maxDeliveryRadius: 10,
      minimumOrderAmount: 6000,
      deliveryFee: 500,
      communes: ['Marcory', 'Koumassi']
    },
    {
      id: 'zone-4',
      name: 'Yopougon',
      description: 'Grande commune populaire',
      coordinates: [
        { lat: 5.3500, lng: -4.1200 },
        { lat: 5.3600, lng: -4.1100 },
        { lat: 5.3400, lng: -4.1000 },
        { lat: 5.3300, lng: -4.1150 }
      ],
      activeSuppliers: 2,
      totalOrders: 34,
      averageDeliveryTime: 30,
      isActive: false,
      createdAt: new Date('2024-03-01'),
      updatedAt: new Date('2024-11-20'),
      maxDeliveryRadius: 15,
      minimumOrderAmount: 10000,
      deliveryFee: 1500,
      communes: ['Yopougon', 'Abobo Sud']
    },
    {
      id: 'zone-5',
      name: 'Treichville',
      description: 'Zone portuaire et commerciale',
      coordinates: [
        { lat: 5.2800, lng: -4.0400 },
        { lat: 5.2850, lng: -4.0350 },
        { lat: 5.2750, lng: -4.0300 },
        { lat: 5.2700, lng: -4.0380 }
      ],
      activeSuppliers: 3,
      totalOrders: 67,
      averageDeliveryTime: 20,
      isActive: true,
      createdAt: new Date('2024-03-15'),
      updatedAt: new Date('2024-12-01'),
      maxDeliveryRadius: 9,
      minimumOrderAmount: 7000,
      deliveryFee: 800,
      communes: ['Treichville', 'Port-Bouët']
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedZone, setSelectedZone] = useState<DeliveryZone | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [formData, setFormData] = useState<ZoneFormData>({
    name: '',
    description: '',
    maxDeliveryRadius: 10,
    minimumOrderAmount: 5000,
    deliveryFee: 0,
    communes: [],
    isActive: true
  });

  const [newCommune, setNewCommune] = useState('');

  const availableCommunes = [
    'Plateau', 'Cocody', 'Marcory', 'Yopougon', 'Treichville', 'Adjamé', 
    'Abobo', 'Koumassi', 'Port-Bouët', 'Attécoubé', 'Deux Plateaux', 
    'Riviera', 'Angré', 'Bingerville', 'Anyama'
  ];

  // Load zones from localStorage on mount
  useEffect(() => {
    const storedZones = localStorage.getItem('distri-night-zones');
    if (storedZones) {
      const parsedZones = JSON.parse(storedZones).map((zone: any) => ({
        ...zone,
        createdAt: new Date(zone.createdAt),
        updatedAt: new Date(zone.updatedAt)
      }));
      setZones(parsedZones);
    }
  }, []);

  // Save zones to localStorage whenever zones change
  useEffect(() => {
    localStorage.setItem('distri-night-zones', JSON.stringify(zones));
  }, [zones]);

  const filteredZones = zones.filter(zone => {
    const matchesSearch = zone.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         zone.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         zone.communes.some(commune => commune.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && zone.isActive) ||
                         (statusFilter === 'inactive' && !zone.isActive);
    
    return matchesSearch && matchesStatus;
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      maxDeliveryRadius: 10,
      minimumOrderAmount: 5000,
      deliveryFee: 0,
      communes: [],
      isActive: true
    });
    setNewCommune('');
    setEditingZone(null);
  };

  const handleAddZone = async () => {
    if (!formData.name.trim() || !formData.description.trim() || formData.communes.length === 0) {
      alert('Veuillez remplir tous les champs obligatoires et ajouter au moins une commune.');
      return;
    }

    setIsProcessing(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    const newZone: DeliveryZone = {
      id: `zone-${Date.now()}`,
      name: formData.name.trim(),
      description: formData.description.trim(),
      coordinates: [
        { lat: 5.3364 + (Math.random() - 0.5) * 0.1, lng: -4.0267 + (Math.random() - 0.5) * 0.1 },
        { lat: 5.3364 + (Math.random() - 0.5) * 0.1, lng: -4.0267 + (Math.random() - 0.5) * 0.1 },
        { lat: 5.3364 + (Math.random() - 0.5) * 0.1, lng: -4.0267 + (Math.random() - 0.5) * 0.1 },
        { lat: 5.3364 + (Math.random() - 0.5) * 0.1, lng: -4.0267 + (Math.random() - 0.5) * 0.1 }
      ],
      activeSuppliers: 0,
      totalOrders: 0,
      averageDeliveryTime: 25,
      isActive: formData.isActive,
      createdAt: new Date(),
      updatedAt: new Date(),
      maxDeliveryRadius: formData.maxDeliveryRadius,
      minimumOrderAmount: formData.minimumOrderAmount,
      deliveryFee: formData.deliveryFee,
      communes: [...formData.communes]
    };

    setZones(prev => [...prev, newZone]);
    setShowAddForm(false);
    resetForm();
    setIsProcessing(false);

    alert(`✅ Zone "${newZone.name}" créée avec succès!\n\nLa nouvelle zone est maintenant disponible pour les livraisons.`);
  };

  const handleEditZone = (zone: DeliveryZone) => {
    setEditingZone(zone);
    setFormData({
      name: zone.name,
      description: zone.description,
      maxDeliveryRadius: zone.maxDeliveryRadius,
      minimumOrderAmount: zone.minimumOrderAmount,
      deliveryFee: zone.deliveryFee,
      communes: [...zone.communes],
      isActive: zone.isActive
    });
    setShowAddForm(true);
  };

  const handleUpdateZone = async () => {
    if (!editingZone || !formData.name.trim() || !formData.description.trim() || formData.communes.length === 0) {
      alert('Veuillez remplir tous les champs obligatoires et ajouter au moins une commune.');
      return;
    }

    setIsProcessing(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    const updatedZone: DeliveryZone = {
      ...editingZone,
      name: formData.name.trim(),
      description: formData.description.trim(),
      maxDeliveryRadius: formData.maxDeliveryRadius,
      minimumOrderAmount: formData.minimumOrderAmount,
      deliveryFee: formData.deliveryFee,
      communes: [...formData.communes],
      isActive: formData.isActive,
      updatedAt: new Date()
    };

    setZones(prev => prev.map(zone => zone.id === editingZone.id ? updatedZone : zone));
    setShowAddForm(false);
    resetForm();
    setIsProcessing(false);

    alert(`✅ Zone "${updatedZone.name}" mise à jour avec succès!`);
  };

  const toggleZoneStatus = async (zoneId: string) => {
    const zone = zones.find(z => z.id === zoneId);
    if (!zone) return;

    const action = zone.isActive ? 'désactiver' : 'activer';
    const confirmMessage = zone.isActive 
      ? `Êtes-vous sûr de vouloir désactiver la zone "${zone.name}"?\n\nCela empêchera les nouvelles commandes dans cette zone.`
      : `Êtes-vous sûr de vouloir activer la zone "${zone.name}"?\n\nCela permettra les commandes dans cette zone.`;

    if (!confirm(confirmMessage)) return;

    setIsProcessing(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    setZones(prev => prev.map(z => 
      z.id === zoneId 
        ? { ...z, isActive: !z.isActive, updatedAt: new Date() }
        : z
    ));

    setIsProcessing(false);

    const statusText = zone.isActive ? 'désactivée' : 'activée';
    alert(`✅ Zone "${zone.name}" ${statusText} avec succès!`);
  };

  const handleDeleteZone = async (zoneId: string) => {
    const zone = zones.find(z => z.id === zoneId);
    if (!zone) return;

    setIsProcessing(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    setZones(prev => prev.filter(z => z.id !== zoneId));
    setShowDeleteConfirm(null);
    setIsProcessing(false);

    alert(`✅ Zone "${zone.name}" supprimée avec succès!\n\nToutes les données associées ont été supprimées.`);
  };

  const handleViewDetails = (zone: DeliveryZone) => {
    setSelectedZone(zone);
    setShowDetailsModal(true);
  };

  const addCommune = () => {
    if (newCommune.trim() && !formData.communes.includes(newCommune.trim())) {
      setFormData(prev => ({
        ...prev,
        communes: [...prev.communes, newCommune.trim()]
      }));
      setNewCommune('');
    }
  };

  const removeCommune = (commune: string) => {
    setFormData(prev => ({
      ...prev,
      communes: prev.communes.filter(c => c !== commune)
    }));
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
  const totalActiveZones = zones.filter(z => z.isActive).length;
  const totalSuppliers = zones.reduce((sum, zone) => sum + zone.activeSuppliers, 0);
  const totalOrders = zones.reduce((sum, zone) => sum + zone.totalOrders, 0);
  const averageDeliveryTime = zones.length > 0 
    ? Math.round(zones.reduce((sum, zone) => sum + zone.averageDeliveryTime, 0) / zones.length)
    : 0;

  const ZoneDetailsModal = ({ zone, onClose }: { zone: DeliveryZone; onClose: () => void }) => (
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
                <h2 className="text-2xl font-bold text-gray-900">{zone.name}</h2>
                <p className="text-gray-600">{zone.description}</p>
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
                  <MapPin className="h-5 w-5 mr-2 text-green-600" />
                  Communes couvertes
                </h3>
                <div className="flex flex-wrap gap-2">
                  {zone.communes.map((commune) => (
                    <span
                      key={commune}
                      className="px-3 py-1 bg-white border border-green-200 text-green-700 rounded-full text-sm font-medium"
                    >
                      {commune}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Performance Stats */}
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Statistiques de performance</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-white rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 mb-1">{zone.activeSuppliers}</div>
                    <div className="text-sm text-gray-600">Fournisseurs actifs</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg">
                    <div className="text-2xl font-bold text-green-600 mb-1">{zone.totalOrders}</div>
                    <div className="text-sm text-gray-600">Commandes totales</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg">
                    <div className="text-2xl font-bold text-orange-600 mb-1">{zone.averageDeliveryTime}</div>
                    <div className="text-sm text-gray-600">Temps moyen (min)</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 mb-1">
                      {zone.totalOrders > 0 ? Math.round((zone.totalOrders / 30) * 100) / 100 : 0}
                    </div>
                    <div className="text-sm text-gray-600">Commandes/jour</div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Informations opérationnelles</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className={`h-3 w-3 rounded-full ${zone.isActive ? 'bg-green-400' : 'bg-red-400'}`}></div>
                    <span className="text-gray-700">
                      Zone {zone.isActive ? 'active' : 'inactive'} pour les nouvelles commandes
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">
                      {zone.activeSuppliers} fournisseur(s) disponible(s)
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Navigation className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">
                      Couverture: {zone.maxDeliveryRadius} km de rayon
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
              <span>Modifier cette zone</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const DeleteConfirmModal = ({ zoneId, onConfirm, onCancel }: {
    zoneId: string;
    onConfirm: () => void;
    onCancel: () => void;
  }) => {
    const zone = zones.find(z => z.id === zoneId);
    if (!zone) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
          <div className="text-center mb-6">
            <div className="h-16 w-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Supprimer la zone</h2>
            <p className="text-gray-600">Êtes-vous sûr de vouloir supprimer la zone <strong>"{zone.name}"</strong> ?</p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="text-sm text-red-800">
                <p className="font-medium mb-2">Cette action est irréversible et va :</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Supprimer définitivement la zone de livraison</li>
                  <li>Empêcher les nouvelles commandes dans cette zone</li>
                  <li>Affecter {zone.activeSuppliers} fournisseur(s) actif(s)</li>
                  <li>Supprimer l'historique de {zone.totalOrders} commande(s)</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={onCancel}
              disabled={isProcessing}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={onConfirm}
              disabled={isProcessing}
              className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-3 rounded-lg font-semibold hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Suppression...</span>
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  <span>Supprimer définitivement</span>
                </>
              )}
            </button>
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
              <p className="text-gray-600">Administrez les zones de couverture d'Abidjan et leurs paramètres</p>
            </div>
            
            <button
              onClick={() => {
                setShowAddForm(true);
                resetForm();
              }}
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
              <MapPin className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Fournisseurs totaux</p>
                <p className="text-2xl font-bold text-blue-600">{totalSuppliers}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
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
                <p className="text-sm font-medium text-gray-600 mb-1">Temps moyen</p>
                <p className="text-2xl font-bold text-purple-600">{averageDeliveryTime} min</p>
              </div>
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Add/Edit Zone Form */}
        {showAddForm && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {editingZone ? 'Modifier la zone' : 'Ajouter une nouvelle zone'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nom de la zone *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Ex: Adjamé"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Description de la zone"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rayon de livraison max (km)</label>
                <input
                  type="number"
                  value={formData.maxDeliveryRadius}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxDeliveryRadius: parseInt(e.target.value) || 10 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  min="1"
                  max="50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Commande minimum (FCFA)</label>
                <input
                  type="number"
                  value={formData.minimumOrderAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, minimumOrderAmount: parseInt(e.target.value) || 5000 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  step="1000"
                />
                <p className="text-xs text-gray-500 mt-1">{formatPrice(formData.minimumOrderAmount)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Frais de livraison (FCFA)</label>
                <input
                  type="number"
                  value={formData.deliveryFee}
                  onChange={(e) => setFormData(prev => ({ ...prev, deliveryFee: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  step="500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.deliveryFee === 0 ? 'Livraison gratuite' : formatPrice(formData.deliveryFee)}
                </p>
              </div>

              <div className="flex items-center">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Zone active</span>
                </label>
              </div>
            </div>

            {/* Communes Management */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Communes couvertes *</label>
              
              <div className="flex space-x-2 mb-3">
                <select
                  value={newCommune}
                  onChange={(e) => setNewCommune(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">Sélectionner une commune</option>
                  {availableCommunes
                    .filter(commune => !formData.communes.includes(commune))
                    .map(commune => (
                      <option key={commune} value={commune}>{commune}</option>
                    ))}
                </select>
                <button
                  type="button"
                  onClick={addCommune}
                  disabled={!newCommune}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Ajouter
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {formData.communes.map((commune) => (
                  <span
                    key={commune}
                    className="inline-flex items-center space-x-2 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium"
                  >
                    <span>{commune}</span>
                    <button
                      type="button"
                      onClick={() => removeCommune(commune)}
                      className="text-orange-500 hover:text-orange-700"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              
              {formData.communes.length === 0 && (
                <p className="text-sm text-red-600 mt-2">Au moins une commune doit être sélectionnée</p>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowAddForm(false);
                  resetForm();
                }}
                disabled={isProcessing}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={editingZone ? handleUpdateZone : handleAddZone}
                disabled={isProcessing || !formData.name.trim() || !formData.description.trim() || formData.communes.length === 0}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>{editingZone ? 'Mise à jour...' : 'Création...'}</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>{editingZone ? 'Mettre à jour' : 'Créer la zone'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher par nom, description ou commune..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            
            <div className="relative">
              <Filter className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 appearance-none"
              >
                <option value="all">Tous les statuts</option>
                <option value="active">Zones actives</option>
                <option value="inactive">Zones inactives</option>
              </select>
            </div>

            <div className="text-sm text-gray-600 flex items-center">
              <span className="font-medium">{filteredZones.length}</span>
              <span className="ml-1">zone(s) trouvée(s)</span>
            </div>
          </div>
        </div>

        {/* Zones Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredZones.length === 0 ? (
            <div className="col-span-full bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
              <MapPin className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">Aucune zone trouvée</h3>
              <p className="text-gray-500 mb-6">Essayez de modifier vos critères de recherche</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-700 transition-colors"
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            filteredZones.map((zone) => (
              <div key={zone.id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center">
                        <MapPin className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{zone.name}</h3>
                        <p className="text-sm text-gray-600">{zone.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        zone.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {zone.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  {/* Zone Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-2">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="text-lg font-bold text-gray-900">{zone.activeSuppliers}</div>
                      <div className="text-xs text-gray-600">Fournisseurs</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-2">
                        <Package className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="text-lg font-bold text-gray-900">{zone.totalOrders}</div>
                      <div className="text-xs text-gray-600">Commandes</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-2">
                        <Clock className="h-5 w-5 text-orange-600" />
                      </div>
                      <div className="text-lg font-bold text-gray-900">{zone.averageDeliveryTime} min</div>
                      <div className="text-xs text-gray-600">Temps moyen</div>
                    </div>
                  </div>

                  {/* Zone Configuration Summary */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600">Rayon max:</span>
                        <span className="font-medium text-gray-900 ml-2">{zone.maxDeliveryRadius} km</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Commande min:</span>
                        <span className="font-medium text-gray-900 ml-2">{formatPrice(zone.minimumOrderAmount)}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-600">Frais livraison:</span>
                        <span className="font-medium text-gray-900 ml-2">
                          {zone.deliveryFee === 0 ? 'Gratuit' : formatPrice(zone.deliveryFee)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Communes */}
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Communes couvertes:</p>
                    <div className="flex flex-wrap gap-1">
                      {zone.communes.map((commune) => (
                        <span
                          key={commune}
                          className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium"
                        >
                          {commune}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Zone Actions */}
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => handleViewDetails(zone)}
                      className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2 text-sm"
                    >
                      <Eye className="h-4 w-4" />
                      <span>Détails</span>
                    </button>
                    <button
                      onClick={() => handleEditZone(zone)}
                      className="px-3 py-2 border border-blue-300 text-blue-700 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center justify-center space-x-2 text-sm"
                    >
                      <Edit3 className="h-4 w-4" />
                      <span>Modifier</span>
                    </button>
                    <button
                      onClick={() => toggleZoneStatus(zone.id)}
                      disabled={isProcessing}
                      className={`px-3 py-2 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                        zone.isActive
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {zone.isActive ? (
                        <>
                          <ToggleLeft className="h-4 w-4" />
                          <span>Désactiver</span>
                        </>
                      ) : (
                        <>
                          <ToggleRight className="h-4 w-4" />
                          <span>Activer</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(zone.id)}
                      disabled={isProcessing}
                      className="px-3 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2 text-sm"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Supprimer</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Performance Overview */}
        <div className="mt-8 bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Vue d'ensemble des performances</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {zones
              .filter(zone => zone.isActive)
              .sort((a, b) => b.totalOrders - a.totalOrders)
              .slice(0, 4)
              .map((zone, index) => (
                <div key={zone.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900">{zone.name}</h4>
                    <div className="h-6 w-6 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">{index + 1}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Commandes:</span>
                      <span className="font-medium text-gray-900">{zone.totalOrders}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fournisseurs:</span>
                      <span className="font-medium text-gray-900">{zone.activeSuppliers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Temps moyen:</span>
                      <span className="font-medium text-gray-900">{zone.averageDeliveryTime} min</span>
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <DeleteConfirmModal
          zoneId={showDeleteConfirm}
          onConfirm={() => handleDeleteZone(showDeleteConfirm)}
          onCancel={() => setShowDeleteConfirm(null)}
        />
      )}
    </>
  );
};