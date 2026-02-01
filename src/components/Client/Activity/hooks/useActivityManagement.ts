import { useState, useEffect, useCallback } from 'react';
import {
  DailySheet,
  DailyStockLine,
  DailyPackaging,
  DailyExpense,
  EstablishmentProduct,
  UpdateStockLineData,
  UpdatePackagingData,
  AddExpenseData,
  CloseSheetData,
} from '../../../../types/activity';
import {
  getOrCreateDailySheet,
  getDailyStockLines,
  updateStockLine,
  getDailyPackaging,
  updatePackaging,
  getDailyExpenses,
  addExpense,
  deleteExpense,
  closeDailySheet,
  syncRavitoDeliveries,
  getEstablishmentProducts,
} from '../../../../services/dailySheetService';

interface UseActivityManagementProps {
  organizationId: string;
  userId: string;
  initialDate?: string;
}

export function useActivityManagement({
  organizationId,
  userId,
  initialDate,
}: UseActivityManagementProps) {
  const [currentDate, setCurrentDate] = useState<string>(
    initialDate || new Date().toISOString().split('T')[0]
  );
  const [sheet, setSheet] = useState<DailySheet | null>(null);
  const [stockLines, setStockLines] = useState<DailyStockLine[]>([]);
  const [packaging, setPackaging] = useState<DailyPackaging[]>([]);
  const [expenses, setExpenses] = useState<DailyExpense[]>([]);
  const [establishmentProducts, setEstablishmentProducts] = useState<EstablishmentProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  // Load daily sheet and all related data
  const loadDailyData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Get or create daily sheet
      const { data: sheetData, error: sheetError } = await getOrCreateDailySheet(
        organizationId,
        currentDate
      );

      if (sheetError || !sheetData) {
        setError(sheetError || 'Failed to load daily sheet');
        setLoading(false);
        return;
      }

      setSheet(sheetData);

      // Load all related data in parallel
      const [
        stockLinesResult,
        packagingResult,
        expensesResult,
        productsResult,
      ] = await Promise.all([
        getDailyStockLines(sheetData.id, organizationId),
        getDailyPackaging(sheetData.id),
        getDailyExpenses(sheetData.id),
        getEstablishmentProducts(organizationId),
      ]);

      if (stockLinesResult.data) {
        // Enrich stock lines with selling prices
        const enrichedStockLines = stockLinesResult.data.map((line) => {
          const estProduct = productsResult.data?.find(
            (ep) => ep.productId === line.productId
          );
          return {
            ...line,
            establishmentProduct: estProduct,
            totalSupply: line.ravitoSupply + line.externalSupply,
            salesQty:
              line.finalStock !== null && line.finalStock !== undefined
                ? line.initialStock + line.ravitoSupply + line.externalSupply - line.finalStock
                : undefined,
            revenue:
              line.finalStock !== null && line.finalStock !== undefined && estProduct
                ? (line.initialStock + line.ravitoSupply + line.externalSupply - line.finalStock) *
                  estProduct.sellingPrice
                : undefined,
          };
        });
        setStockLines(enrichedStockLines);
      }

      if (packagingResult.data) {
        // Enrich packaging with calculations
        const enrichedPackaging = packagingResult.data.map((pkg) => ({
          ...pkg,
          totalStart: pkg.qtyFullStart + pkg.qtyEmptyStart,
          totalEnd:
            pkg.qtyFullEnd !== null && pkg.qtyFullEnd !== undefined &&
            pkg.qtyEmptyEnd !== null && pkg.qtyEmptyEnd !== undefined
              ? pkg.qtyFullEnd + pkg.qtyEmptyEnd
              : undefined,
          difference:
            pkg.qtyFullEnd !== null && pkg.qtyFullEnd !== undefined &&
            pkg.qtyEmptyEnd !== null && pkg.qtyEmptyEnd !== undefined
              ? pkg.qtyFullEnd + pkg.qtyEmptyEnd - (pkg.qtyFullStart + pkg.qtyEmptyStart)
              : undefined,
          theoreticalFullEnd: pkg.qtyFullStart + pkg.qtyReceived - pkg.qtyReturned,
          theoreticalEmptyEnd: pkg.qtyEmptyStart,
        }));
        setPackaging(enrichedPackaging);
      }

      if (expensesResult.data) {
        setExpenses(expensesResult.data);
      }

      if (productsResult.data) {
        setEstablishmentProducts(productsResult.data);
      }
    } catch (err: any) {
      console.error('Error loading daily data:', err);
      setError(err.message || 'An error occurred while loading data');
    } finally {
      setLoading(false);
    }
  }, [organizationId, currentDate]);

  // Load data when date changes
  useEffect(() => {
    loadDailyData();
  }, [loadDailyData]);

  // Update stock line
  const handleUpdateStockLine = async (
    lineId: string,
    updates: UpdateStockLineData
  ): Promise<boolean> => {
    const { success, error } = await updateStockLine(lineId, updates);

    if (success) {
      // Reload data to get updated calculations
      await loadDailyData();
      return true;
    } else {
      setError(error || 'Failed to update stock line');
      return false;
    }
  };

  // Update packaging
  const handleUpdatePackaging = async (
    packagingId: string,
    updates: UpdatePackagingData
  ): Promise<boolean> => {
    const { success, error } = await updatePackaging(packagingId, updates);

    if (success) {
      await loadDailyData();
      return true;
    } else {
      setError(error || 'Failed to update packaging');
      return false;
    }
  };

  // Add expense
  const handleAddExpense = async (expenseData: AddExpenseData): Promise<boolean> => {
    if (!sheet) return false;

    const { data, error } = await addExpense(sheet.id, expenseData);

    if (data) {
      await loadDailyData();
      return true;
    } else {
      setError(error || 'Failed to add expense');
      return false;
    }
  };

  // Delete expense
  const handleDeleteExpense = async (expenseId: string): Promise<boolean> => {
    if (!sheet) return false;

    const { success, error } = await deleteExpense(expenseId, sheet.id);

    if (success) {
      await loadDailyData();
      return true;
    } else {
      setError(error || 'Failed to delete expense');
      return false;
    }
  };

  // Close sheet
  const handleCloseSheet = async (closeData: CloseSheetData): Promise<boolean> => {
    if (!sheet) return false;

    const { success, error } = await closeDailySheet(
      sheet.id, 
      {
        closingCash: closeData.closingCash,
        theoreticalRevenue: calculations.totalRevenue,
        expensesTotal: calculations.totalExpenses,
        openingCash: sheet.openingCash,
        notes: closeData.notes
      },
      userId
    );

    if (success) {
      await loadDailyData();
      return true;
    } else {
      setError(error || 'Failed to close sheet');
      return false;
    }
  };

  // Sync RAVITO deliveries
  const handleSyncDeliveries = async (): Promise<boolean> => {
    if (!sheet) return false;

    setSyncing(true);
    const { success, error } = await syncRavitoDeliveries(sheet.id);
    setSyncing(false);

    if (success) {
      await loadDailyData();
      return true;
    } else {
      setError(error || 'Failed to sync deliveries');
      return false;
    }
  };

  // Change date
  const handleChangeDate = (newDate: string) => {
    setCurrentDate(newDate);
  };

  // Calculate totals
  const totalRevenue = stockLines.reduce((sum, line) => sum + (line.revenue || 0), 0);
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const creditPayments = sheet?.creditPayments || 0;
  const creditSales = sheet?.creditSales || 0;
  const creditVariation = creditPayments - creditSales;

  const calculations = {
    totalRevenue,
    totalExpenses,
    creditPayments,
    creditSales,
    creditVariation,
    expectedCash: sheet
      ? sheet.openingCash + totalRevenue - totalExpenses + creditVariation
      : 0,
    cashDifference: sheet?.cashDifference || 0,
    packagingAlerts: packaging.filter(
      (pkg) => pkg.difference !== undefined && pkg.difference !== 0
    ),
    stockAlerts: stockLines.filter((line) => {
      if (line.finalStock === null || line.finalStock === undefined) return false;
      const minStock = line.establishmentProduct?.minStockAlert || 0;
      return line.finalStock < minStock && minStock > 0;
    }),
  };

  return {
    // State
    currentDate,
    sheet,
    stockLines,
    packaging,
    expenses,
    establishmentProducts,
    loading,
    error,
    syncing,
    calculations,

    // Actions
    handleUpdateStockLine,
    handleUpdatePackaging,
    handleAddExpense,
    handleDeleteExpense,
    handleCloseSheet,
    handleSyncDeliveries,
    handleChangeDate,
    reload: loadDailyData,
  };
}
