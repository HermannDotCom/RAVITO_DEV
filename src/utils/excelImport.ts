/**
 * excelImport - Utilitaires pour l'import de données depuis des fichiers XLSX
 * Permet d'importer des prix fournisseur en masse
 */

import * as XLSX from 'xlsx';

export interface ImportedPriceData {
  reference: string;
  productName?: string;
  supplierPrice: number;
  initialStock?: number;
}

export interface ImportResult {
  success: number;
  errors: number;
  data: ImportedPriceData[];
  errorDetails: Array<{
    row: number;
    reference?: string;
    error: string;
  }>;
}

/**
 * Valide une ligne de données importées
 */
const validateRow = (
  row: any,
  rowIndex: number
): { isValid: boolean; error?: string; data?: ImportedPriceData } => {
  // Vérifier que les champs obligatoires sont présents
  const reference = row['Référence*'] || row['Reference*'] || row['Référence'] || row['Reference'];
  const priceField = Object.keys(row).find(key => 
    key.includes('Prix') && (key.includes('*') || key.toLowerCase().includes('prix'))
  );
  const supplierPrice = priceField ? row[priceField] : undefined;

  if (!reference) {
    return {
      isValid: false,
      error: `Ligne ${rowIndex}: Référence produit manquante`,
    };
  }

  if (supplierPrice === undefined || supplierPrice === null || supplierPrice === '') {
    return {
      isValid: false,
      error: `Ligne ${rowIndex}: Prix fournisseur manquant pour ${reference}`,
      reference,
    };
  }

  // Convertir et valider le prix
  const parsedPrice = typeof supplierPrice === 'number' 
    ? supplierPrice 
    : parseFloat(String(supplierPrice).replace(/[^\d.-]/g, ''));

  if (isNaN(parsedPrice) || parsedPrice < 0) {
    return {
      isValid: false,
      error: `Ligne ${rowIndex}: Prix invalide pour ${reference} (${supplierPrice})`,
      reference,
    };
  }

  // Traiter le stock initial (optionnel)
  const initialStockField = row['Stock Initial'] || row['Stock initial'] || row['stock_initial'];
  let initialStock = 0;

  if (initialStockField !== undefined && initialStockField !== null && initialStockField !== '') {
    const parsedStock = typeof initialStockField === 'number'
      ? initialStockField
      : parseInt(String(initialStockField).replace(/[^\d]/g, ''));

    if (!isNaN(parsedStock) && parsedStock >= 0) {
      initialStock = parsedStock;
    }
  }

  return {
    isValid: true,
    data: {
      reference: String(reference).trim(),
      productName: row['Produit'] || undefined,
      supplierPrice: Math.round(parsedPrice * 100) / 100, // Arrondir à 2 décimales
      initialStock,
    },
  };
};

/**
 * Importe des prix depuis un fichier XLSX
 */
export const importPricesFromXLSX = async (
  file: File
): Promise<ImportResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          reject(new Error('Impossible de lire le fichier'));
          return;
        }

        // Lire le fichier Excel
        const workbook = XLSX.read(data, { type: 'binary' });

        // Récupérer la première feuille (Saisie)
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convertir en JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: undefined,
          defval: '',
          blankrows: false,
        });

        // Trouver la ligne d'en-tête (qui contient "Référence*")
        let headerRowIndex = -1;
        let headers: any = null;

        for (let i = 0; i < Math.min(10, jsonData.length); i++) {
          const row: any = jsonData[i];
          const hasReference = Object.values(row).some((val: any) => 
            String(val).includes('Référence') || String(val).includes('Reference')
          );
          
          if (hasReference) {
            headerRowIndex = i;
            headers = row;
            break;
          }
        }

        if (headerRowIndex === -1) {
          reject(new Error('En-têtes non trouvés dans le fichier. Assurez-vous d\'utiliser le template fourni.'));
          return;
        }

        // Convertir à nouveau avec les bons en-têtes
        const dataRows = XLSX.utils.sheet_to_json(worksheet, {
          range: headerRowIndex,
          defval: '',
          blankrows: false,
        });

        const result: ImportResult = {
          success: 0,
          errors: 0,
          data: [],
          errorDetails: [],
        };

        // Valider et traiter chaque ligne
        dataRows.forEach((row: any, index) => {
          // Ignorer les lignes d'exemple
          const reference = row['Référence*'] || row['Reference*'] || row['Référence'] || row['Reference'];
          if (reference && String(reference).toLowerCase().includes('exemple')) {
            return;
          }

          // Ignorer les lignes vides
          if (!reference || reference === '') {
            return;
          }

          const validation = validateRow(row, headerRowIndex + index + 2);

          if (validation.isValid && validation.data) {
            result.data.push(validation.data);
            result.success++;
          } else {
            result.errors++;
            result.errorDetails.push({
              row: headerRowIndex + index + 2,
              reference: validation.reference,
              error: validation.error || 'Erreur inconnue',
            });
          }
        });

        resolve(result);
      } catch (error) {
        reject(new Error(`Erreur lors de la lecture du fichier: ${error instanceof Error ? error.message : 'Erreur inconnue'}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Erreur lors de la lecture du fichier'));
    };

    reader.readAsBinaryString(file);
  });
};

/**
 * Vérifie si un fichier est un fichier XLSX valide
 */
export const isValidXLSXFile = (file: File): boolean => {
  const validExtensions = ['.xlsx', '.xls'];
  const fileName = file.name.toLowerCase();
  return validExtensions.some(ext => fileName.endsWith(ext));
};

/**
 * Obtient une preview des données importées (premières lignes)
 */
export const getImportPreview = async (
  file: File,
  maxRows: number = 5
): Promise<ImportedPriceData[]> => {
  const result = await importPricesFromXLSX(file);
  return result.data.slice(0, maxRows);
};
