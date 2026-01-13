import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  AnnualData, 
  AnnualKPIs, 
  MonthlyAnnualData,
  ExpenseByCategory, 
  TopProduct 
} from '../types/activity';

interface UseAnnualDataProps {
  organizationId: string;
  year: number;
}

interface UseAnnualDataResult {
  data: AnnualData | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook to fetch and compute annual closure data
 */
export function useAnnualData({ organizationId, year }: UseAnnualDataProps): UseAnnualDataResult {
  const [data, setData] = useState<AnnualData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnnualData = async () => {
      if (!organizationId || !year) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Fetch KPIs for current year
        const kpis = await fetchAnnualKPIs(organizationId, year);
        
        // Fetch KPIs for previous year (for comparison)
        const previousYearKPIs = await fetchAnnualKPIs(organizationId, year - 1);

        // Fetch monthly data for the year
        const monthlyData = await fetchMonthlyData(organizationId, year);

        // Fetch expenses by category
        const expensesByCategory = await fetchExpensesByCategory(organizationId, year);

        // Fetch top products
        const topProducts = await fetchTopProducts(organizationId, year);

        setData({
          kpis,
          monthlyData,
          expensesByCategory,
          topProducts,
          previousYearKPIs: previousYearKPIs.monthsWithData > 0 ? previousYearKPIs : undefined,
        });
      } catch (err) {
        console.error('Error fetching annual data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch annual data');
      } finally {
        setLoading(false);
      }
    };

    fetchAnnualData();
  }, [organizationId, year]);

  return { data, loading, error };
}

/**
 * Fetch annual KPIs
 */
async function fetchAnnualKPIs(
  organizationId: string,
  year: number
): Promise<AnnualKPIs> {
  const startDate = `${year}-01-01`;
  const endDate = `${year + 1}-01-01`;
  
  const { data, error } = await supabase
    .from('daily_sheets')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('status', 'closed')
    .gte('sheet_date', startDate)
    .lt('sheet_date', endDate);

  if (error) throw error;

  const sheets = data || [];
  const totalDaysInYear = isLeapYear(year) ? 366 : 365;
  const totalDaysWorked = sheets.length;

  // Calculate monthly aggregates to find best/worst months
  const monthlyRevenues = new Map<number, number>();
  
  sheets.forEach(sheet => {
    const month = new Date(sheet.sheet_date).getMonth() + 1;
    const currentRevenue = monthlyRevenues.get(month) || 0;
    monthlyRevenues.set(month, currentRevenue + (sheet.theoretical_revenue || 0));
  });

  const monthsWithData = monthlyRevenues.size;
  const totalRevenue = sheets.reduce((sum, s) => sum + (s.theoretical_revenue || 0), 0);
  const totalExpenses = sheets.reduce((sum, s) => sum + (s.expenses_total || 0), 0);
  const totalCashDifference = sheets.reduce((sum, s) => sum + (s.cash_difference || 0), 0);
  const negativeMonths = Array.from(monthlyRevenues.keys()).filter(month => {
    const monthSheets = sheets.filter(s => new Date(s.sheet_date).getMonth() + 1 === month);
    const monthCashDiff = monthSheets.reduce((sum, s) => sum + (s.cash_difference || 0), 0);
    return monthCashDiff < 0;
  }).length;
  const positiveMonths = monthsWithData - negativeMonths;

  // Find best and worst months
  let bestMonth: AnnualKPIs['bestMonth'] = null;
  let worstMonth: AnnualKPIs['worstMonth'] = null;

  if (monthlyRevenues.size > 0) {
    const monthEntries = Array.from(monthlyRevenues.entries());
    const sortedByRevenue = monthEntries.sort((a, b) => b[1] - a[1]);
    
    const best = sortedByRevenue[0];
    const worst = sortedByRevenue[sortedByRevenue.length - 1];
    
    bestMonth = {
      month: best[0],
      monthName: getMonthName(best[0]),
      revenue: best[1],
    };
    
    worstMonth = {
      month: worst[0],
      monthName: getMonthName(worst[0]),
      revenue: worst[1],
    };
  }

  const grossMargin = totalRevenue - totalExpenses;

  return {
    totalRevenue,
    avgMonthlyRevenue: monthsWithData > 0 ? totalRevenue / monthsWithData : 0,
    bestMonth,
    worstMonth,
    totalExpenses,
    avgMonthlyExpenses: monthsWithData > 0 ? totalExpenses / monthsWithData : 0,
    expensesRatio: totalRevenue > 0 ? (totalExpenses / totalRevenue) * 100 : 0,
    totalCashDifference,
    avgMonthlyCashDifference: monthsWithData > 0 ? totalCashDifference / monthsWithData : 0,
    negativeMonths,
    positiveMonths,
    grossMargin,
    marginRate: totalRevenue > 0 ? (grossMargin / totalRevenue) * 100 : 0,
    totalDaysWorked,
    completionRate: totalDaysInYear > 0 ? (totalDaysWorked / totalDaysInYear) * 100 : 0,
    monthsWithData,
  };
}

/**
 * Fetch monthly aggregated data for the year
 */
async function fetchMonthlyData(
  organizationId: string,
  year: number
): Promise<MonthlyAnnualData[]> {
  const startDate = `${year}-01-01`;
  const endDate = `${year + 1}-01-01`;
  
  const { data, error } = await supabase
    .from('daily_sheets')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('status', 'closed')
    .gte('sheet_date', startDate)
    .lt('sheet_date', endDate);

  if (error) throw error;

  const sheets = data || [];
  
  // Group by month
  const monthlyMap = new Map<number, {
    revenue: number;
    expenses: number;
    cashDifference: number;
    daysWorked: number;
  }>();

  sheets.forEach(sheet => {
    const month = new Date(sheet.sheet_date).getMonth() + 1;
    const current = monthlyMap.get(month) || {
      revenue: 0,
      expenses: 0,
      cashDifference: 0,
      daysWorked: 0,
    };
    
    monthlyMap.set(month, {
      revenue: current.revenue + (sheet.theoretical_revenue || 0),
      expenses: current.expenses + (sheet.expenses_total || 0),
      cashDifference: current.cashDifference + (sheet.cash_difference || 0),
      daysWorked: current.daysWorked + 1,
    });
  });

  // Convert to array with all 12 months
  const monthlyData: MonthlyAnnualData[] = [];
  for (let month = 1; month <= 12; month++) {
    const data = monthlyMap.get(month) || {
      revenue: 0,
      expenses: 0,
      cashDifference: 0,
      daysWorked: 0,
    };
    
    monthlyData.push({
      month,
      monthName: getMonthName(month),
      revenue: data.revenue,
      expenses: data.expenses,
      margin: data.revenue - data.expenses,
      cashDifference: data.cashDifference,
      daysWorked: data.daysWorked,
    });
  }

  return monthlyData;
}

/**
 * Fetch expenses by category for the year
 */
async function fetchExpensesByCategory(
  organizationId: string,
  year: number
): Promise<ExpenseByCategory[]> {
  const startDate = `${year}-01-01`;
  const endDate = `${year + 1}-01-01`;
  
  const { data: sheets, error: sheetError } = await supabase
    .from('daily_sheets')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('status', 'closed')
    .gte('sheet_date', startDate)
    .lt('sheet_date', endDate);

  if (sheetError) throw sheetError;
  if (!sheets || sheets.length === 0) return [];

  const sheetIds = sheets.map(s => s.id);

  const { data: expenses, error: expenseError } = await supabase
    .from('daily_expenses')
    .select('category, amount')
    .in('daily_sheet_id', sheetIds);

  if (expenseError) throw expenseError;

  // Group by category
  const categoryMap: Record<string, number> = {};
  (expenses || []).forEach(exp => {
    categoryMap[exp.category] = (categoryMap[exp.category] || 0) + exp.amount;
  });

  return Object.entries(categoryMap)
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
}

/**
 * Fetch top products sold for the year
 */
async function fetchTopProducts(
  organizationId: string,
  year: number
): Promise<TopProduct[]> {
  const startDate = `${year}-01-01`;
  const endDate = `${year + 1}-01-01`;
  
  const { data: sheets, error: sheetError } = await supabase
    .from('daily_sheets')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('status', 'closed')
    .gte('sheet_date', startDate)
    .lt('sheet_date', endDate);

  if (sheetError) throw sheetError;
  if (!sheets || sheets.length === 0) return [];

  const sheetIds = sheets.map(s => s.id);

  // Fetch stock lines with product details
  const { data: stockLines, error: stockError } = await supabase
    .from('daily_stock_lines')
    .select(`
      *,
      product:products!inner(name)
    `)
    .in('daily_sheet_id', sheetIds)
    .not('final_stock', 'is', null);

  if (stockError) throw stockError;

  // Fetch establishment products for selling prices
  const { data: estProducts, error: estError } = await supabase
    .from('establishment_products')
    .select('product_id, selling_price')
    .eq('organization_id', organizationId);

  if (estError) throw estError;

  // Create a map of product prices
  const priceMap = new Map<string, number>();
  (estProducts || []).forEach(ep => {
    priceMap.set(ep.product_id, ep.selling_price);
  });

  // Calculate quantities sold and revenue by product
  const productMap = new Map<string, { name: string; qtySold: number; revenue: number }>();

  (stockLines || []).forEach((line: any) => {
    const qtySold = line.initial_stock + line.ravito_supply + line.external_supply - (line.final_stock || 0);
    const sellingPrice = priceMap.get(line.product_id) || 0;
    const revenue = qtySold * sellingPrice;
    const productName = line.product?.name || 'Unknown';

    const existing = productMap.get(line.product_id);
    if (existing) {
      existing.qtySold += qtySold;
      existing.revenue += revenue;
    } else {
      productMap.set(line.product_id, { name: productName, qtySold, revenue });
    }
  });

  // Convert to array and sort by revenue
  return Array.from(productMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 15);
}

/**
 * Get month name in French
 */
function getMonthName(month: number): string {
  const date = new Date(2000, month - 1, 1);
  return date.toLocaleDateString('fr-FR', { month: 'long' });
}

/**
 * Check if year is leap year
 */
function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}
