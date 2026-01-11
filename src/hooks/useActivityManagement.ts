import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getOrCreateDailySheet,
  getDailyStockLines,
  getDailyPackaging,
  getDailyExpenses,
  updateStockLine,
  updatePackaging,
  updateDailySheet,
  addExpense,
  deleteExpense,
  closeDailySheet,
  syncRavitoDeliveries,
  getEstablishmentProducts
} from '../services/dailySheetService';
import { DailySheet, DailyStockLine, DailyPackaging, DailyExpense, ActivityTab } from '../types/activity';

export const useActivityManagement = () => {
  const { user } = useAuth();
  
  // State
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [activeTab, setActiveTab] = useState<ActivityTab>('stocks');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Data
  const [dailySheet, setDailySheet] = useState<DailySheet | null>(null);
  const [stockLines, setStockLines] = useState<DailyStockLine[]>([]);
  const [packaging, setPackaging] = useState<DailyPackaging[]>([]);
  const [expenses, setExpenses] = useState<DailyExpense[]>([]);
  const [establishmentProducts, setEstablishmentProducts] = useState<any[]>([]);

  // Calculated values
  const [theoreticalRevenue, setTheoreticalRevenue] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);

  // Load daily sheet and related data
  const loadDailyData = useCallback(async () => {
    if (!user?. id) return;

    setIsLoading(true);
    setError(null);

    try {
      // Get or create daily sheet
      const sheet = await getOrCreateDailySheet(user.id, selectedDate);
      
      if (! sheet) {
        setError('Impossible de charger la feuille du jour');
        return;
      }

      setDailySheet(sheet);

      // Load related data in parallel
      const [stockData, packagingData, expensesData, productsData] = await Promise.all([
        getDailyStockLines(sheet.id),
        getDailyPackaging(sheet. id),
        getDailyExpenses(sheet.id),
        getEstablishmentProducts(user.id)
      ]);

      setStockLines(stockData);
      setPackaging(packagingData);
      setExpenses(expensesData);
      setEstablishmentProducts(productsData);

      // Calculate totals
      calculateTotals(stockData, expensesData, productsData);

    } catch (err:  any) {
      console.error('Error loading daily data:', err);
      setError(err.message || 'Erreur lors du chargement des données');
    } finally {
      setIsLoading(false);
    }
  }, [user?. id, selectedDate]);

  // Calculate theoretical revenue and total expenses
  const calculateTotals = useCallback((
    stocks: DailyStockLine[],
    exps: DailyExpense[],
    products: any[]
  ) => {
    // Create a map of product selling prices
    const priceMap = new Map<string, number>();
    products.forEach(ep => {
      priceMap. set(ep.product_id, ep.selling_price);
    });

    // Calculate theoretical revenue from sales
    let revenue = 0;
    stocks. forEach(line => {
      if (line.finalStock !== null && line.finalStock !== undefined) {
        const salesQty = line.initialStock + line.ravitoSupply + line.externalSupply - line.finalStock;
        const sellingPrice = priceMap.get(line.productId) || 0;
        revenue += Math.max(0, salesQty) * sellingPrice;
      }
    });
    setTheoreticalRevenue(revenue);

    // Calculate total expenses
    const expTotal = exps.reduce((sum, exp) => sum + exp.amount, 0);
    setTotalExpenses(expTotal);
  }, []);

  // Update stock line
  const handleUpdateStockLine = useCallback(async (
    lineId: string,
    updates: Partial<Pick<DailyStockLine, 'externalSupply' | 'finalStock'>>
  ) => {
    try {
      await updateStockLine(lineId, updates);
      
      // Update local state
      setStockLines(prev => prev.map(line => 
        line.id === lineId 
          ? { ...line, ...updates }
          : line
      ));

      // Recalculate totals
      const updatedLines = stockLines.map(line => 
        line.id === lineId ?  { ...line, ...updates } :  line
      );
      calculateTotals(updatedLines, expenses, establishmentProducts);

    } catch (err: any) {
      console.error('Error updating stock line:', err);
      throw err;
    }
  }, [stockLines, expenses, establishmentProducts, calculateTotals]);

  // Update packaging
  const handleUpdatePackaging = useCallback(async (
    packagingId: string,
    updates: Partial<Pick<DailyPackaging, 'qtyReturned' | 'qtyFullEnd' | 'qtyEmptyEnd'>>
  ) => {
    try {
      await updatePackaging(packagingId, updates);
      
      // Update local state
      setPackaging(prev => prev.map(p => 
        p.id === packagingId 
          ? { ...p, ...updates }
          : p
      ));
    } catch (err: any) {
      console.error('Error updating packaging:', err);
      throw err;
    }
  }, []);

  // Add expense
  const handleAddExpense = useCallback(async (
    label: string,
    amount: number,
    category: string = 'other'
  ) => {
    if (!dailySheet) return;

    try {
      const newExpense = await addExpense(dailySheet.id, label, amount, category);
      
      setExpenses(prev => [newExpense, ...prev]);
      setTotalExpenses(prev => prev + amount);

    } catch (err: any) {
      console.error('Error adding expense:', err);
      throw err;
    }
  }, [dailySheet]);

  // Delete expense
  const handleDeleteExpense = useCallback(async (expenseId: string) => {
    try {
      const expense = expenses.find(e => e.id === expenseId);
      
      await deleteExpense(expenseId);
      
      setExpenses(prev => prev.filter(e => e.id !== expenseId));
      if (expense) {
        setTotalExpenses(prev => prev - expense.amount);
      }

    } catch (err: any) {
      console.error('Error deleting expense:', err);
      throw err;
    }
  }, [expenses]);

  // Update opening/closing cash
  const handleUpdateCash = useCallback(async (
    updates: Partial<Pick<DailySheet, 'openingCash' | 'closingCash'>>
  ) => {
    if (!dailySheet) return;

    try {
      await updateDailySheet(dailySheet. id, updates);
      
      setDailySheet(prev => prev ? { ...prev, ...updates } : null);

    } catch (err: any) {
      console.error('Error updating cash:', err);
      throw err;
    }
  }, [dailySheet]);

  // Close daily sheet
  const handleCloseDailySheet = useCallback(async (closingCash: number) => {
    if (!dailySheet || !user?.id) return;

    try {
      await closeDailySheet(
        dailySheet.id,
        closingCash,
        theoreticalRevenue,
        totalExpenses,
        user. id
      );

      // Reload data
      await loadDailyData();

    } catch (err: any) {
      console.error('Error closing daily sheet:', err);
      throw err;
    }
  }, [dailySheet, user?.id, theoreticalRevenue, totalExpenses, loadDailyData]);

  // Sync RAVITO deliveries
  const handleSyncDeliveries = useCallback(async () => {
    if (!dailySheet) return;

    try {
      await syncRavitoDeliveries(dailySheet. id);
      await loadDailyData();
    } catch (err: any) {
      console.error('Error syncing deliveries:', err);
      throw err;
    }
  }, [dailySheet, loadDailyData]);

  // Calculate cash difference
  const cashDifference = dailySheet?.closingCash !== undefined && dailySheet?.closingCash !== null
    ? (dailySheet.closingCash - dailySheet.openingCash) - theoreticalRevenue + totalExpenses
    : null;

  // Calculate packaging alerts
  const packagingAlerts = packaging.filter(p => {
    if (p.qtyFullEnd === null || p.qtyEmptyEnd === null) return false;
    
    const totalStart = p.qtyFullStart + p.qtyEmptyStart;
    const totalEnd = p. qtyFullEnd + p.qtyEmptyEnd;
    const expected = totalStart + p.qtyReceived - p.qtyReturned;
    
    return totalEnd < expected;
  });

  // Load data when date changes
  useEffect(() => {
    loadDailyData();
  }, [loadDailyData]);

  return {
    // State
    selectedDate,
    setSelectedDate,
    activeTab,
    setActiveTab,
    isLoading,
    error,
    
    // Data
    dailySheet,
    stockLines,
    packaging,
    expenses,
    establishmentProducts,
    
    // Calculated
    theoreticalRevenue,
    totalExpenses,
    cashDifference,
    packagingAlerts,
    
    // Actions
    handleUpdateStockLine,
    handleUpdatePackaging,
    handleAddExpense,
    handleDeleteExpense,
    handleUpdateCash,
    handleCloseDailySheet,
    handleSyncDeliveries,
    refreshData: loadDailyData
  };
};