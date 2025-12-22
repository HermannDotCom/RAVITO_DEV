/**
 * excelExport - Utilitaires pour l'export de données au format XLSX
 * Génère des fichiers Excel professionnels pour l'export d'inventaire
 */

import * as XLSX from 'xlsx';

interface ProductData {
  id: string;
  reference: string;
  name: string;
  supplierPrice: number;
  referencePrice?: number;
  initialStock: number;
  soldQuantity: number;
  stockFinal: number;
}

interface ExportInventoryOptions {
  supplierName: string;
  products: ProductData[];
  exportDate?: Date;
}

/**
 * Formate un nombre en FCFA
 */
const formatFCFA = (amount: number): string => {
  return `${amount.toLocaleString('fr-FR')} FCFA`;
};

/**
 * Calcule l'écart en pourcentage entre deux prix
 */
const calculateVariance = (supplierPrice: number, referencePrice?: number): string => {
  if (!referencePrice || referencePrice === 0) return 'N/A';
  const variance = ((supplierPrice - referencePrice) / referencePrice) * 100;
  return `${variance >= 0 ? '+' : ''}${variance.toFixed(1)}%`;
};

/**
 * Exporte l'inventaire complet au format XLSX
 */
export const exportInventoryToXLSX = (options: ExportInventoryOptions): void => {
  const { supplierName, products, exportDate = new Date() } = options;

  // Créer un nouveau classeur
  const workbook = XLSX.utils.book_new();

  // ============================================================================
  // FEUILLE 1: INVENTAIRE
  // ============================================================================
  
  const inventoryData: any[][] = [
    // En-tête personnalisé
    ['INVENTAIRE - ' + supplierName.toUpperCase()],
    ['Date d\'export: ' + exportDate.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })],
    [],
    // En-têtes de colonnes
    [
      'Référence',
      'Produit',
      `Prix ${supplierName}`,
      'Prix Référence RAVITO',
      'Écart %',
      'Stock Initial',
      'Qté Vendue',
      'Stock Final',
      'Variation'
    ],
  ];

  // Données des produits
  let totalInitialValue = 0;
  let totalCurrentValue = 0;
  let totalSold = 0;

  products.forEach(product => {
    const variance = calculateVariance(product.supplierPrice, product.referencePrice);
    const variation = product.initialStock - product.stockFinal;
    
    totalInitialValue += product.initialStock * product.supplierPrice;
    totalCurrentValue += product.stockFinal * product.supplierPrice;
    totalSold += product.soldQuantity;

    inventoryData.push([
      product.reference,
      product.name,
      product.supplierPrice,
      product.referencePrice || 'N/A',
      variance,
      product.initialStock,
      product.soldQuantity,
      product.stockFinal,
      variation
    ]);
  });

  // Synthèse financière
  inventoryData.push([]);
  inventoryData.push(['SYNTHÈSE FINANCIÈRE']);
  inventoryData.push(['Valeur stock initial:', '', formatFCFA(totalInitialValue)]);
  inventoryData.push(['Valeur stock final:', '', formatFCFA(totalCurrentValue)]);
  inventoryData.push(['Valeur vendue:', '', formatFCFA(totalInitialValue - totalCurrentValue)]);
  inventoryData.push(['Nombre total de produits:', '', products.length]);
  inventoryData.push(['Quantité totale vendue:', '', totalSold]);

  const inventorySheet = XLSX.utils.aoa_to_sheet(inventoryData);

  // Définir les largeurs de colonnes
  inventorySheet['!cols'] = [
    { wch: 12 },  // Référence
    { wch: 30 },  // Produit
    { wch: 15 },  // Prix Fournisseur
    { wch: 20 },  // Prix Référence
    { wch: 10 },  // Écart %
    { wch: 12 },  // Stock Initial
    { wch: 12 },  // Qté Vendue
    { wch: 12 },  // Stock Final
    { wch: 10 },  // Variation
  ];

  XLSX.utils.book_append_sheet(workbook, inventorySheet, 'Inventaire');

  // ============================================================================
  // FEUILLE 2: MOUVEMENTS DÉTAILLÉS
  // ============================================================================
  
  const movementsData: any[][] = [
    ['MOUVEMENTS DE STOCK'],
    [],
    ['Référence', 'Produit', 'Stock Initial', 'Entrées', 'Sorties', 'Stock Final', 'Taux de rotation'],
  ];

  products.forEach(product => {
    const rotationRate = product.initialStock > 0 
      ? ((product.soldQuantity / product.initialStock) * 100).toFixed(1) + '%'
      : 'N/A';

    movementsData.push([
      product.reference,
      product.name,
      product.initialStock,
      0, // Entrées (pour future extension)
      product.soldQuantity,
      product.stockFinal,
      rotationRate
    ]);
  });

  const movementsSheet = XLSX.utils.aoa_to_sheet(movementsData);
  movementsSheet['!cols'] = [
    { wch: 12 },
    { wch: 30 },
    { wch: 12 },
    { wch: 10 },
    { wch: 10 },
    { wch: 12 },
    { wch: 15 },
  ];

  XLSX.utils.book_append_sheet(workbook, movementsSheet, 'Mouvements');

  // ============================================================================
  // Générer le fichier
  // ============================================================================
  
  const dateStr = exportDate.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).replace(/\//g, '');

  const fileName = `Inventaire_${supplierName.replace(/\s+/g, '_')}_${dateStr}.xlsx`;
  
  XLSX.writeFile(workbook, fileName);
};

/**
 * Exporte un template d'import de prix au format XLSX
 */
export const exportPriceImportTemplate = (
  supplierName: string,
  products: Array<{ reference: string; name: string }>
): void => {
  const workbook = XLSX.utils.book_new();

  // ============================================================================
  // FEUILLE 1: SAISIE
  // ============================================================================
  
  const saisieData: any[][] = [
    [`TEMPLATE D'IMPORT DE PRIX - ${supplierName.toUpperCase()}`],
    ['Remplissez ce fichier et importez-le dans RAVITO'],
    [],
    [
      'Référence*',
      'Produit',
      `Prix ${supplierName}*`,
      'Stock Initial'
    ],
    // Exemple de ligne
    [
      'PROD001',
      'Exemple - Guinness 33cl',
      '8500',
      '150'
    ],
  ];

  const saisieSheet = XLSX.utils.aoa_to_sheet(saisieData);
  saisieSheet['!cols'] = [
    { wch: 15 },
    { wch: 30 },
    { wch: 15 },
    { wch: 15 },
  ];

  XLSX.utils.book_append_sheet(workbook, saisieSheet, 'Saisie');

  // ============================================================================
  // FEUILLE 2: INSTRUCTIONS
  // ============================================================================
  
  const instructionsData: any[][] = [
    ['GUIDE D\'UTILISATION DU TEMPLATE D\'IMPORT'],
    [],
    ['1. FORMAT DU FICHIER'],
    ['   - Format: XLSX exclusivement'],
    ['   - Encodage: UTF-8'],
    ['   - Ne pas modifier les en-têtes de colonnes'],
    [],
    ['2. COLONNES OBLIGATOIRES (marquées par *)'],
    ['   - Référence: Code de référence du produit (doit correspondre exactement)'],
    [`   - Prix ${supplierName}: Prix de vente en FCFA (entiers ou 2 décimales max)`],
    [],
    ['3. COLONNES OPTIONNELLES'],
    ['   - Stock Initial: Quantité en stock au début du cycle (par défaut: 0)'],
    [],
    ['4. VALIDATION'],
    ['   - Vérifiez que toutes les références existent dans le catalogue RAVITO'],
    ['   - Les prix doivent être des nombres positifs'],
    ['   - Consultez la feuille "Références" pour la liste complète des produits'],
    [],
    ['5. IMPORT'],
    ['   - Sauvegardez ce fichier après avoir rempli la feuille "Saisie"'],
    ['   - Dans RAVITO, cliquez sur "Import/Export" puis "Importer les prix (XLSX)"'],
    ['   - Sélectionnez ce fichier'],
    [],
    ['6. EN CAS D\'ERREUR'],
    ['   - Vérifiez que les références correspondent exactement'],
    ['   - Assurez-vous que les prix sont des nombres valides'],
    ['   - Contactez le support si le problème persiste'],
  ];

  const instructionsSheet = XLSX.utils.aoa_to_sheet(instructionsData);
  instructionsSheet['!cols'] = [{ wch: 80 }];

  XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');

  // ============================================================================
  // FEUILLE 3: RÉFÉRENCES
  // ============================================================================
  
  const referencesData: any[][] = [
    ['LISTE DES PRODUITS DISPONIBLES'],
    ['Utilisez ces références dans la feuille "Saisie"'],
    [],
    ['Référence', 'Produit'],
  ];

  products.forEach(product => {
    referencesData.push([product.reference, product.name]);
  });

  const referencesSheet = XLSX.utils.aoa_to_sheet(referencesData);
  referencesSheet['!cols'] = [
    { wch: 15 },
    { wch: 40 },
  ];

  XLSX.utils.book_append_sheet(workbook, referencesSheet, 'Références');

  // ============================================================================
  // Générer le fichier
  // ============================================================================
  
  const dateStr = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).replace(/\//g, '');

  const fileName = `Template_Prix_Import_${dateStr}.xlsx`;
  
  XLSX.writeFile(workbook, fileName);
};
