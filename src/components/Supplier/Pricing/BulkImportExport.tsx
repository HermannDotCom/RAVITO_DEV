/**
 * BulkImportExport - Composant pour import/export en masse Excel (XLSX)
 * Permet d'importer et exporter des prix et inventaires au format professionnel
 */

import React, { useState } from 'react';
import { X, Upload, Download, AlertCircle, CheckCircle, FileSpreadsheet } from 'lucide-react';
import { Card } from '../../ui/Card';
import { useSupplierPriceGridManagement } from '../../../hooks/usePricing';
import { usePricing } from '../../../context/PricingContext';
import { getProducts } from '../../../services/productService';
import { useAuth } from '../../../context/AuthContext';
import { exportInventoryToXLSX, exportPriceImportTemplate } from '../../../utils/excelExport';
import { importPricesFromXLSX, isValidXLSXFile } from '../../../utils/excelImport';
import { supabase } from '../../../lib/supabase';

interface BulkImportExportProps {
  onClose: () => void;
  onImportComplete: () => void;
}

export const BulkImportExport: React.FC<BulkImportExportProps> = ({ onClose, onImportComplete }) => {
  const { user } = useAuth();
  const { supplierPriceGrids, getReferencePrice } = usePricing();
  const [importResult, setImportResult] = useState<{
    success: number;
    errors: number;
    errorDetails: any[];
  } | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleExportInventory = async () => {
    try {
      setIsExporting(true);
      
      // Récupérer tous les produits
      const products = await getProducts({ isActive: true });
      
      // Construire les données d'export avec les prix et stocks
      const exportData = await Promise.all(
        products.map(async (product) => {
          const grid = supplierPriceGrids.find(g => g.productId === product.id && g.isActive);
          const refPrice = await getReferencePrice(product.id);

          return {
            id: product.id,
            reference: product.reference,
            name: `${product.name} - ${product.brand}`,
            supplierPrice: grid?.cratePrice || 0,
            referencePrice: refPrice?.referenceCratePrice,
            initialStock: grid?.initialStock || 0,
            soldQuantity: grid?.soldQuantity || 0,
            stockFinal: (grid?.initialStock || 0) - (grid?.soldQuantity || 0),
          };
        })
      );

      // Exporter via notre utilitaire
      const supplierName = user?.businessName || user?.name || 'Fournisseur';
      exportInventoryToXLSX({
        supplierName,
        products: exportData,
        exportDate: new Date(),
      });

      setSuccessMessage('Inventaire exporté avec succès !');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error) {
      console.error('Error exporting inventory:', error);
      alert('Erreur lors de l\'export de l\'inventaire');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      // Récupérer tous les produits pour le template
      const products = await getProducts({ isActive: true });
      
      const productList = products.map(p => ({
        reference: p.reference,
        name: `${p.name} - ${p.brand} (${p.crateType})`,
      }));

      const supplierName = user?.businessName || user?.name || 'Fournisseur';
      exportPriceImportTemplate(supplierName, productList);

      setSuccessMessage('Template téléchargé avec succès !');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error) {
      console.error('Error downloading template:', error);
      alert('Erreur lors du téléchargement du template');
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Réinitialiser l'input
    event.target.value = '';

    // Valider le type de fichier
    if (!isValidXLSXFile(file)) {
      alert('Veuillez sélectionner un fichier XLSX valide');
      return;
    }

    try {
      setIsImporting(true);
      setImportResult(null);

      // Importer le fichier
      const importData = await importPricesFromXLSX(file);

      if (importData.data.length === 0) {
        alert('Aucune donnée valide trouvée dans le fichier');
        return;
      }

      // Récupérer tous les produits pour valider les références
      const products = await getProducts({ isActive: true });
      const productMap = new Map(products.map(p => [p.reference, p.id]));

      // Traiter chaque ligne importée
      let successCount = 0;
      let errorCount = 0;
      const errors: any[] = [];

      for (const row of importData.data) {
        try {
          const productId = productMap.get(row.reference);
          
          if (!productId) {
            errorCount++;
            errors.push({
              reference: row.reference,
              error: `Référence produit inconnue: ${row.reference}`,
            });
            continue;
          }

          // Vérifier si une grille existe déjà
          const existingGrid = supplierPriceGrids.find(
            g => g.productId === productId && g.isActive
          );

          if (existingGrid) {
            // Mettre à jour la grille existante
            const { error: updateError } = await supabase
              .from('supplier_price_grids')
              .update({
                crate_price: row.supplierPrice,
                initial_stock: row.initialStock || 0,
                updated_at: new Date().toISOString(),
              })
              .eq('id', existingGrid.id);

            if (updateError) throw updateError;
          } else {
            // Créer une nouvelle grille
            const { error: insertError } = await supabase
              .from('supplier_price_grids')
              .insert({
                supplier_id: user?.id,
                product_id: productId,
                unit_price: 0,
                crate_price: row.supplierPrice,
                consign_price: 0,
                initial_stock: row.initialStock || 0,
                sold_quantity: 0,
                is_active: true,
              });

            if (insertError) throw insertError;
          }

          successCount++;
        } catch (error) {
          errorCount++;
          errors.push({
            reference: row.reference,
            error: `Erreur lors de l'import: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
          });
        }
      }

      setImportResult({
        success: successCount,
        errors: errorCount,
        errorDetails: errors,
      });

      if (successCount > 0) {
        onImportComplete();
      }
    } catch (error) {
      console.error('Error importing prices:', error);
      alert(`Erreur lors de l'import: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Import / Export (Excel)
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Success Message */}
          {successMessage && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              <p className="text-green-800 dark:text-green-300">{successMessage}</p>
            </div>
          )}

          {/* Export Inventory Section */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-blue-600" />
              Exporter l'inventaire (XLSX)
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Téléchargez un export complet de votre inventaire avec prix, stocks et mouvements
            </p>
            <button
              onClick={handleExportInventory}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              {isExporting ? 'Export en cours...' : 'Exporter l\'inventaire (XLSX)'}
            </button>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700" />

          {/* Import Prices Section */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Upload className="h-5 w-5 text-orange-600" />
              Importer les prix (XLSX)
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Mettez à jour vos prix et stocks en masse depuis un fichier Excel
            </p>

            <div className="space-y-3">
              <button
                onClick={handleDownloadTemplate}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <Download className="h-4 w-4" />
                Télécharger le Template (XLSX)
              </button>

              <label className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors cursor-pointer">
                <Upload className="h-4 w-4" />
                <span>{isImporting ? 'Import en cours...' : 'Importer les prix (XLSX)'}</span>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleImport}
                  disabled={isImporting}
                  className="hidden"
                />
              </label>
            </div>

            {/* Import Result */}
            {importResult && (
              <div className="mt-4 space-y-2">
                {importResult.success > 0 && (
                  <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-green-800 dark:text-green-300">
                      <p className="font-medium">{importResult.success} produit(s) importé(s) avec succès</p>
                    </div>
                  </div>
                )}

                {importResult.errors > 0 && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-red-800 dark:text-red-300">
                      <p className="font-medium">{importResult.errors} erreur(s) lors de l'import</p>
                      {importResult.errorDetails.length > 0 && (
                        <ul className="mt-2 space-y-1 list-disc list-inside">
                          {importResult.errorDetails.slice(0, 5).map((error, index) => (
                            <li key={index}>{error.error}</li>
                          ))}
                          {importResult.errorDetails.length > 5 && (
                            <li>... et {importResult.errorDetails.length - 5} autre(s)</li>
                          )}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-300">
              <p className="font-medium mb-1">Format du fichier Excel (XLSX)</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Format: XLSX exclusivement</li>
                <li>Encodage: UTF-8</li>
                <li>Utilisez le template fourni pour éviter les erreurs</li>
                <li>Les références produits doivent correspondre exactement</li>
                <li>Les prix doivent être en FCFA (entiers ou 2 décimales max)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700 sticky bottom-0 bg-white dark:bg-gray-900">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Fermer
          </button>
        </div>
      </Card>
    </div>
  );
};
