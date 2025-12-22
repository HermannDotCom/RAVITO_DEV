/**
 * BulkImportExport - Composant pour import/export en masse Excel
 * Permet d'importer et exporter des grilles tarifaires
 */

import React, { useState } from 'react';
import { X, Upload, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { Card } from '../../ui/Card';
import { useSupplierPriceGridManagement } from '../../../hooks/usePricing';
import { usePricing } from '../../../context/PricingContext';
import { getProducts } from '../../../services/productService';

interface BulkImportExportProps {
  onClose: () => void;
  onImportComplete: () => void;
}

export const BulkImportExport: React.FC<BulkImportExportProps> = ({ onClose, onImportComplete }) => {
  const { bulkCreate, isLoading } = useSupplierPriceGridManagement();
  const { supplierPriceGrids } = usePricing();
  const [importResult, setImportResult] = useState<{
    success: number;
    errors: number;
    errorDetails: any[];
  } | null>(null);

  const handleExport = async () => {
    try {
      const products = await getProducts({ isActive: true });
      
      // Créer les données CSV
      const headers = [
        'ID Produit',
        'Nom Produit',
        'Prix Unitaire',
        'Prix Casier',
        'Prix Consigne',
        'Remise (%)',
        'Quantité Min',
        'Notes',
      ];

      const rows = supplierPriceGrids.map((grid) => {
        const product = products.find((p) => p.id === grid.productId);
        return [
          grid.productId,
          product?.name || '',
          grid.unitPrice,
          grid.cratePrice,
          grid.consignPrice,
          grid.discountPercentage,
          grid.minimumOrderQuantity,
          grid.notes || '',
        ];
      });

      // Convertir en CSV
      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
      ].join('\n');

      // Télécharger le fichier
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `grilles_tarifaires_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    } catch (error) {
      console.error('Error exporting grids:', error);
      alert('Erreur lors de l\'export');
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const lines = text.split('\n').filter((line) => line.trim());

      if (lines.length < 2) {
        alert('Le fichier est vide ou invalide');
        return;
      }

      // Parser les lignes (skip header)
      const grids = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        // Simple CSV parsing (assumes no commas in values or proper escaping)
        const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));

        if (values.length >= 7) {
          grids.push({
            productId: values[0],
            unitPrice: Number(values[2]) || 0,
            cratePrice: Number(values[3]) || 0,
            consignPrice: Number(values[4]) || 0,
            discountPercentage: Number(values[5]) || 0,
            minimumOrderQuantity: Number(values[6]) || 1,
            notes: values[7] || '',
          });
        }
      }

      if (grids.length === 0) {
        alert('Aucune donnée valide trouvée dans le fichier');
        return;
      }

      // Import en masse
      const result = await bulkCreate(grids);
      setImportResult(result);

      if (result.success > 0) {
        onImportComplete();
      }
    } catch (error) {
      console.error('Error importing grids:', error);
      alert('Erreur lors de l\'import');
    }
  };

  const handleDownloadTemplate = () => {
    const headers = [
      'ID Produit',
      'Nom Produit (info)',
      'Prix Unitaire',
      'Prix Casier',
      'Prix Consigne',
      'Remise (%)',
      'Quantité Min',
      'Notes',
    ];

    const exampleRow = [
      'PRODUCT_ID_HERE',
      'Exemple Produit',
      '300',
      '7200',
      '3000',
      '0',
      '1',
      'Notes optionnelles',
    ];

    const csvContent = [
      headers.join(','),
      exampleRow.map((cell) => `"${cell}"`).join(','),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'template_grilles_tarifaires.csv';
    link.click();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Import / Export en Masse
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
          {/* Export Section */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
              Exporter vos grilles
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Téléchargez toutes vos grilles tarifaires au format CSV
            </p>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              Exporter (CSV)
            </button>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700" />

          {/* Import Section */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
              Importer des grilles
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Importez vos grilles tarifaires depuis un fichier CSV
            </p>

            <div className="space-y-3">
              <button
                onClick={handleDownloadTemplate}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <Download className="h-4 w-4" />
                Télécharger le Template
              </button>

              <label className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors cursor-pointer">
                <Upload className="h-4 w-4" />
                <span>Importer CSV</span>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleImport}
                  disabled={isLoading}
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
                      <p className="font-medium">{importResult.success} grille(s) importée(s) avec succès</p>
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
                          {importResult.errorDetails.slice(0, 3).map((error, index) => (
                            <li key={index}>{error.error}</li>
                          ))}
                          {importResult.errorDetails.length > 3 && (
                            <li>... et {importResult.errorDetails.length - 3} autre(s)</li>
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
              <p className="font-medium mb-1">Format du fichier CSV</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Encodage: UTF-8</li>
                <li>Séparateur: virgule (,)</li>
                <li>La première ligne doit contenir les en-têtes</li>
                <li>L'ID Produit doit correspondre à un produit existant</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
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
