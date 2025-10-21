import React, { useState, useEffect } from 'react';
import { X, MapPin, Settings, TrendingUp, Users, UserPlus, Star, Package, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface Zone {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

interface ZoneSupplier {
  id: string;
  supplier_id: string;
  is_active: boolean;
  approval_status: string;
  supplier: {
    name: string;
    business_name: string | null;
    phone: string | null;
    rating: number;
    address: string | null;
  };
  total_orders: number;
}

interface Props {
  zone: Zone;
  onClose: () => void;
  onUpdate: () => void;
}

export const ZoneDetailsModal: React.FC<Props> = ({ zone, onClose, onUpdate }) => {
  const [suppliers, setSuppliers] = useState<ZoneSupplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [availableSuppliers, setAvailableSuppliers] = useState<any[]>([]);
  const [editForm, setEditForm] = useState({
    name: zone.name,
    description: zone.description || '',
    maxSuppliers: 10,
    minCoverage: 2,
    operatingHours: '18h00 - 06h00'
  });
  const [stats, setStats] = useState({
    totalOrders: 0,
    avgDeliveryTime: 0,
    successRate: 100,
    activeSuppliers: 0
  });

  useEffect(() => {
    loadSuppliers();
    loadAvailableSuppliers();
    loadStats();
  }, [zone.id]);

  const loadSuppliers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('supplier_zones')
        .select(`
          id,
          supplier_id,
          is_active,
          approval_status,
          total_orders,
          profiles!supplier_zones_supplier_id_fkey (
            name,
            business_name,
            phone,
            rating,
            address
          )
        `)
        .eq('zone_id', zone.id)
        .eq('approval_status', 'approved');

      if (error) throw error;

      const mapped = (data || []).map((item: any) => ({
        id: item.id,
        supplier_id: item.supplier_id,
        is_active: item.is_active,
        approval_status: item.approval_status,
        total_orders: item.total_orders || 0,
        supplier: {
          name: item.profiles.name,
          business_name: item.profiles.business_name,
          phone: item.profiles.phone,
          rating: item.profiles.rating || 5.0,
          address: item.profiles.address
        }
      }));

      setSuppliers(mapped);
      setStats(prev => ({ ...prev, activeSuppliers: mapped.filter((s: ZoneSupplier) => s.is_active).length }));
    } catch (error) {
      console.error('Error loading suppliers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableSuppliers = async () => {
    try {
      const { data: allSuppliers, error } = await supabase
        .from('profiles')
        .select('id, name, business_name, phone, rating, address')
        .eq('role', 'supplier')
        .eq('is_approved', true);

      if (error) throw error;

      const currentSupplierIds = suppliers.map(s => s.supplier_id);
      const available = (allSuppliers || []).filter(s => !currentSupplierIds.includes(s.id));

      setAvailableSuppliers(available);
    } catch (error) {
      console.error('Error loading available suppliers:', error);
    }
  };

  const loadStats = async () => {
    try {
      const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('zone_id', zone.id);

      setStats(prev => ({
        ...prev,
        totalOrders: count || 0
      }));
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const updateZone = async () => {
    if (!editForm.name.trim()) {
      alert('Le nom de la zone est requis');
      return;
    }

    try {
      const { error } = await supabase
        .from('zones')
        .update({
          name: editForm.name,
          description: editForm.description || null
        })
        .eq('id', zone.id);

      if (error) throw error;

      alert('Zone mise à jour avec succès');
      setShowEditModal(false);
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating zone:', error);
      alert('Erreur lors de la mise à jour de la zone');
    }
  };

  const deleteZone = async () => {
    if (!confirm(`Êtes-vous sûr de vouloir désactiver la zone "${zone.name}" ?`)) return;

    try {
      const { error } = await supabase
        .from('zones')
        .update({ is_active: false })
        .eq('id', zone.id);

      if (error) throw error;

      alert('Zone désactivée avec succès');
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error deleting zone:', error);
      alert('Erreur lors de la désactivation de la zone');
    }
  };

  const addSupplierToZone = async (supplierId: string) => {
    try {
      const { error } = await supabase
        .from('supplier_zones')
        .insert({
          supplier_id: supplierId,
          zone_id: zone.id,
          approval_status: 'approved',
          is_active: true,
          approved_at: new Date().toISOString()
        });

      if (error) throw error;

      alert('Fournisseur ajouté avec succès');
      await loadSuppliers();
      await loadAvailableSuppliers();
      setShowAddSupplier(false);
    } catch (error) {
      console.error('Error adding supplier:', error);
      alert('Erreur lors de l\'ajout du fournisseur');
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <MapPin className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Zone {zone.name}</h2>
                <p className="text-sm text-green-600 dark:text-green-400">
                  Zone {zone.is_active ? 'Active' : 'Inactive'} • {suppliers.filter(s => s.is_active).length}/{suppliers.length} fournisseurs actifs
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="h-10 w-10 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-5 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-4">
                  <Settings className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Configuration de la zone</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Fournisseurs max:</span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">{editForm.maxSuppliers}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Couverture minimum:</span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">{editForm.minCoverage} fournisseur(s)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Horaires d'activité:</span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">{editForm.operatingHours}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Dernière mise à jour:</span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {new Date(zone.created_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 rounded-lg p-5 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Fournisseurs inscrits</h3>
                  </div>
                  <button
                    onClick={() => setShowAddSupplier(!showAddSupplier)}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                  >
                    <UserPlus className="h-4 w-4" />
                    Ajouter
                  </button>
                </div>

                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                  </div>
                ) : suppliers.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Aucun fournisseur inscrit dans cette zone</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {suppliers.map((supplier) => (
                      <div
                        key={supplier.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">
                              {(supplier.supplier.business_name || supplier.supplier.name).charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white text-sm">
                              {supplier.supplier.business_name || supplier.supplier.name}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">{supplier.supplier.address}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {supplier.supplier.rating?.toFixed(1) || '5.0'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Package className="h-4 w-4 text-gray-400" />
                            <span className="text-xs text-gray-600 dark:text-gray-400">{supplier.total_orders} livr.</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-5 border border-green-200 dark:border-green-800 mt-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Statistiques de la zone</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
                  <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">{stats.totalOrders}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Commandes totales</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
                  <p className="text-4xl font-bold text-green-600 dark:text-green-400">{stats.successRate}%</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Taux de réussite</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
                  <p className="text-4xl font-bold text-orange-600 dark:text-orange-400">{stats.avgDeliveryTime}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Temps moyen (min)</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
                  <p className="text-4xl font-bold text-purple-600 dark:text-purple-400">{stats.activeSuppliers}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Fournisseurs actifs</p>
                </div>
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
            >
              Fermer
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowEditModal(true)}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Edit2 className="h-4 w-4" />
                Modifier la zone
              </button>
              <button
                onClick={deleteZone}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Désactiver la zone
              </button>
            </div>
          </div>
        </div>
      </div>

      {showAddSupplier && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={() => setShowAddSupplier(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Ajouter un fournisseur</h3>
              <button onClick={() => setShowAddSupplier(false)} className="text-gray-500 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Sélectionnez un fournisseur à inscrire dans la zone "{zone.name}"
            </p>
            <div className="space-y-2">
              {availableSuppliers.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">Aucun fournisseur disponible</p>
              ) : (
                availableSuppliers.map((supplier) => (
                  <div
                    key={supplier.id}
                    onClick={() => addSupplierToZone(supplier.id)}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-green-400 dark:hover:border-green-500 cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                        <span className="text-green-600 dark:text-green-400 font-bold">
                          {(supplier.business_name || supplier.name).charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {supplier.business_name || supplier.name}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{supplier.address}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {supplier.rating?.toFixed(1) || '5.0'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={() => setShowEditModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-center mb-6">
              <div className="h-16 w-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <MapPin className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">Modifier la zone</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-6">Modifiez les paramètres de la zone</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nom de la commune *</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Ex: Cocody"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Fournisseurs maximum</label>
                  <input
                    type="number"
                    value={editForm.maxSuppliers}
                    onChange={(e) => setEditForm({ ...editForm, maxSuppliers: parseInt(e.target.value) || 0 })}
                    min="1"
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Couverture minimum</label>
                  <input
                    type="number"
                    value={editForm.minCoverage}
                    onChange={(e) => setEditForm({ ...editForm, minCoverage: parseInt(e.target.value) || 0 })}
                    min="1"
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Horaires d'activité</label>
                <input
                  type="text"
                  value={editForm.operatingHours}
                  onChange={(e) => setEditForm({ ...editForm, operatingHours: e.target.value })}
                  placeholder="18h00 - 06h00"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={updateZone}
                  className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Edit2 className="h-4 w-4" />
                  Modifier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
