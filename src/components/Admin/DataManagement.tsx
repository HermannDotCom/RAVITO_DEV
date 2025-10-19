import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Download, 
  Upload, 
  Trash2, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Shield,
  FileText,
  RotateCcw,
  Save,
  X
} from 'lucide-react';
import { 
  createDataBackup, 
  purgeAllOrders, 
  restoreFromBackup, 
  getAvailableBackups,
  verifyDataIntegrity,
  DataBackup 
} from '../../utils/dataManager';

export const DataManagement: React.FC = () => {
  const [backups, setBackups] = useState<any[]>([]);
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dataIntegrity, setDataIntegrity] = useState<{ isValid: boolean; errors: string[] } | null>(null);

  useEffect(() => {
    // Charger la liste des sauvegardes
    setBackups(getAvailableBackups());
    
    // Vérifier l'intégrité des données
    setDataIntegrity(verifyDataIntegrity());
  }, []);

  const handleCreateBackup = async () => {
    setIsProcessing(true);
    
    try {
      const backup = createDataBackup('Sauvegarde manuelle Admin');
      setBackups(getAvailableBackups());
      
      alert(`✅ Sauvegarde créée avec succès!\n\nTimestamp: ${backup.timestamp.toLocaleString()}\nCommandes: ${backup.metadata.totalOrders}\nChiffre d'affaires: ${new Intl.NumberFormat('fr-FR').format(backup.metadata.totalRevenue)} FCFA`);
    } catch (error) {
      alert('❌ Erreur lors de la création de la sauvegarde');
    }
    
    setIsProcessing(false);
  };

  const handlePurgeOrders = async () => {
    setIsProcessing(true);
    
    try {
      const success = purgeAllOrders(true);
      if (success) {
        setShowPurgeModal(false);
        
        // Recharger les données
        setBackups(getAvailableBackups());
        setDataIntegrity(verifyDataIntegrity());
        
        // Déclencher un événement pour rafraîchir l'interface
        window.location.reload();
        
        alert('✅ Purge effectuée avec succès!\n\n• Toutes les commandes ont été supprimées\n• Une sauvegarde automatique a été créée\n• Les données utilisateurs sont préservées\n• L\'interface va se rafraîchir');
      } else {
        alert('❌ Erreur lors de la purge des données');
      }
    } catch (error) {
      alert('❌ Erreur lors de la purge des données');
    }
    
    setIsProcessing(false);
  };

  const handleRestoreBackup = async () => {
    if (!selectedBackup) return;
    
    setIsProcessing(true);
    
    try {
      const success = restoreFromBackup(selectedBackup);
      if (success) {
        setShowRestoreModal(false);
        setSelectedBackup(null);
        
        // Recharger les données
        setDataIntegrity(verifyDataIntegrity());
        
        alert('✅ Restauration effectuée avec succès!\n\nLes données ont été restaurées depuis la sauvegarde sélectionnée.\nL\'interface va se rafraîchir.');
        
        // Rafraîchir l'interface
        window.location.reload();
      } else {
        alert('❌ Erreur lors de la restauration');
      }
    } catch (error) {
      alert('❌ Erreur lors de la restauration');
    }
    
    setIsProcessing(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
  };

  return (
    <>
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion des Données</h1>
          <p className="text-gray-600">Administration sécurisée des données système</p>
        </div>

        {/* Data Integrity Status */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <Shield className="h-5 w-5 mr-2 text-blue-600" />
            État d'intégrité des données
          </h3>
          
          {dataIntegrity && (
            <div className={`p-4 rounded-lg border ${
              dataIntegrity.isValid 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center space-x-3 mb-2">
                {dataIntegrity.isValid ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                )}
                <span className={`font-medium ${
                  dataIntegrity.isValid ? 'text-green-900' : 'text-red-900'
                }`}>
                  {dataIntegrity.isValid ? 'Données intègres' : 'Problèmes détectés'}
                </span>
              </div>
              
              {dataIntegrity.errors.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-red-800 mb-2">Erreurs détectées :</p>
                  <ul className="text-sm text-red-700 space-y-1">
                    {dataIntegrity.errors.map((error, index) => (
                      <li key={index} className="list-disc list-inside">{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="text-center">
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Save className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Créer une sauvegarde</h3>
              <p className="text-sm text-gray-600 mb-4">Sauvegarder l'état actuel des données</p>
              <button
                onClick={handleCreateBackup}
                disabled={isProcessing}
                className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isProcessing ? 'Création...' : 'Créer sauvegarde'}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="text-center">
              <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Purger les commandes</h3>
              <p className="text-sm text-gray-600 mb-4">Supprimer toutes les commandes existantes</p>
              <button
                onClick={() => setShowPurgeModal(true)}
                className="w-full bg-red-600 text-white py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                Purger les données
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="text-center">
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <RotateCcw className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Restaurer</h3>
              <p className="text-sm text-gray-600 mb-4">Restaurer depuis une sauvegarde</p>
              <button
                onClick={() => setShowRestoreModal(true)}
                disabled={backups.length === 0}
                className="w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Restaurer données
              </button>
            </div>
          </div>
        </div>

        {/* Backups List */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <Database className="h-5 w-5 mr-2 text-orange-600" />
            Sauvegardes disponibles
          </h3>
          
          {backups.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Aucune sauvegarde disponible</p>
              <p className="text-gray-400 text-sm">Créez une sauvegarde pour sécuriser vos données</p>
            </div>
          ) : (
            <div className="space-y-3">
              {backups.map((backup, index) => (
                <div key={backup.key} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="font-medium text-gray-900">
                          Sauvegarde #{backups.length - index}
                        </span>
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                          {backup.reason}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>
                          <span>Date: {formatDate(backup.timestamp)}</span>
                        </div>
                        <div>
                          <span>Commandes: {backup.orderCount}</span>
                        </div>
                        <div>
                          <span>CA: {formatPrice(backup.revenue)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedBackup(backup.key);
                          setShowRestoreModal(true);
                        }}
                        className="px-3 py-2 border border-green-300 text-green-700 rounded-lg font-medium hover:bg-green-50 transition-colors text-sm"
                      >
                        Restaurer
                      </button>
                      <button
                        onClick={() => {
                          const backupData = localStorage.getItem(backup.key);
                          if (backupData) {
                            const blob = new Blob([backupData], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `distri-night-backup-${new Date(backup.timestamp).toISOString().split('T')[0]}.json`;
                            a.click();
                            URL.revokeObjectURL(url);
                          }
                        }}
                        className="px-3 py-2 border border-blue-300 text-blue-700 rounded-lg font-medium hover:bg-blue-50 transition-colors text-sm"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Purge Confirmation Modal */}
      {showPurgeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
            <div className="p-8">
              <div className="text-center mb-6">
                <div className="h-16 w-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Purger toutes les commandes</h2>
                <p className="text-gray-600">Cette action supprimera définitivement toutes les commandes</p>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div className="text-sm text-red-800">
                    <p className="font-medium mb-2">Cette action va :</p>
                    <ul className="space-y-1 list-disc list-inside">
                      <li>Supprimer toutes les commandes existantes</li>
                      <li>Supprimer toutes les évaluations</li>
                      <li>Supprimer l'historique des virements</li>
                      <li>Réinitialiser les compteurs utilisateurs</li>
                      <li>Créer automatiquement une sauvegarde avant suppression</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-2">Données préservées :</p>
                    <ul className="space-y-1 list-disc list-inside">
                      <li>Comptes utilisateurs (clients, fournisseurs, admins)</li>
                      <li>Catalogue produits</li>
                      <li>Paramètres système</li>
                      <li>Zones de livraison</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => setShowPurgeModal(false)}
                  disabled={isProcessing}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handlePurgeOrders}
                  disabled={isProcessing}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-3 rounded-lg font-semibold hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Purge en cours...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      <span>Confirmer la purge</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Restore Modal */}
      {showRestoreModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-8">
              <div className="text-center mb-6">
                <div className="h-16 w-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <RotateCcw className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Restaurer les données</h2>
                <p className="text-gray-600">Sélectionnez une sauvegarde à restaurer</p>
              </div>

              <div className="space-y-3 mb-6">
                {backups.map((backup, index) => (
                  <label
                    key={backup.key}
                    className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedBackup === backup.key
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="backup"
                      value={backup.key}
                      checked={selectedBackup === backup.key}
                      onChange={(e) => setSelectedBackup(e.target.value)}
                      className="sr-only"
                    />
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900 mb-1">
                          Sauvegarde #{backups.length - index}
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatDate(backup.timestamp)} • {backup.orderCount} commandes • {formatPrice(backup.revenue)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Raison: {backup.reason}
                        </div>
                      </div>
                      {selectedBackup === backup.key && (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                  </label>
                ))}
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-2">Attention :</p>
                    <ul className="space-y-1 list-disc list-inside">
                      <li>Cette action remplacera toutes les données actuelles</li>
                      <li>Une sauvegarde automatique sera créée avant restauration</li>
                      <li>L'interface sera rafraîchie après restauration</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    setShowRestoreModal(false);
                    setSelectedBackup(null);
                  }}
                  disabled={isProcessing}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleRestoreBackup}
                  disabled={!selectedBackup || isProcessing}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Restauration...</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="h-4 w-4" />
                      <span>Restaurer</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};