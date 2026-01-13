import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { MonthlyData, MonthlyKPIs, ExpenseByCategory, TopProduct, DailyRevenueData, DailySheet } from '../types/activity';

interface UseMonthlyDataProps {
  organizationId: string;
  month: number;
  year: number;
}

interface UseMonthlyDataResult {
  data: MonthlyData | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook to fetch and compute monthly closure data
 */
export function useMonthlyData({ organizationId, month, year }: UseMonthlyDataProps): UseMonthlyDataResult {
  const [data, setData] = useState<MonthlyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMonthlyData = async () => {
      if (!organizationId || !month || !year) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Calculate total days in the selected month
        const totalDaysInMonth = new Date(year, month, 0).getDate();

        // Fetch KPIs for current month
        const kpis = await fetchMonthlyKPIs(organizationId, month, year, totalDaysInMonth);
        
        // Fetch KPIs for previous month (for comparison)
        const prevMonth = month === 1 ? 12 : month - 1;
        const prevYear = month === 1 ? year - 1 : year;
        const totalDaysInPrevMonth = new Date(prevYear, prevMonth, 0).getDate();
        const previousMonthKPIs = await fetchMonthlyKPIs(organizationId, prevMonth, prevYear, totalDaysInPrevMonth);

        // Fetch expenses by category
        const expensesByCategory = await fetchExpensesByCategory(organizationId, month, year);

        // Fetch top products
        const topProducts = await fetchTopProducts(organizationId, month, year);

        // Fetch daily revenue data for chart
        const dailyRevenue = await fetchDailyRevenue(organizationId, month, year);

        // Fetch all daily sheets for the month
        const dailySheets = await fetchDailySheets(organizationId, month, year);

        setData({
          kpis,
          expensesByCategory,
          topProducts,
          dailyRevenue,
          dailySheets,
          previousMonthKPIs,
        });
      } catch (err) {
        console.error('Error fetching monthly data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch monthly data');
      } finally {
        setLoading(false);
      }
    };

    fetchMonthlyData();
  }, [organizationId, month, year]);

  return { data, loading, error };
}

/**
 * Fetch monthly KPIs
 */
async function fetchMonthlyKPIs(
  organizationId: string,
  month: number,
  year: number,
  totalDaysInMonth: number
): Promise<MonthlyKPIs> {
  const { data, error } = await supabase
    .from('daily_sheets')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('status', 'closed')
    .gte('sheet_date', `${year}-${String(month).padStart(2, '0')}-01`)
    .lt('sheet_date', `${year}-${String(month + 1).padStart(2, '0')}-01`);

  if (error) throw error;

  const sheets = data || [];
  const daysWorked = sheets.length;
  const daysIncomplete = totalDaysInMonth - daysWorked;

  const totalRevenue = sheets.reduce((sum, s) => sum + (s.theoretical_revenue || 0), 0);
  const totalExpenses = sheets.reduce((sum, s) => sum + (s.expenses_total || 0), 0);
  const totalCashDifference = sheets.reduce((sum, s) => sum + (s.cash_difference || 0), 0);
  const negativeDays = sheets.filter(s => (s.cash_difference || 0) < 0).length;
  const positiveDays = sheets.filter(s => (s.cash_difference || 0) > 0).length;

  return {
    daysWorked,
    totalRevenue,
    avgDailyRevenue: daysWorked > 0 ? totalRevenue / daysWorked : 0,
    totalExpenses,
    totalCashDifference,
    avgCashDifference: daysWorked > 0 ? totalCashDifference / daysWorked : 0,
    negativeDays,
    positiveDays,
    daysIncomplete,
    completionRate: totalDaysInMonth > 0 ? (daysWorked / totalDaysInMonth) * 100 : 0,
  };
}

/**
 * Fetch expenses by category
 */
async function fetchExpensesByCategory(
  organizationId: string,
  month: number,
  year: number
): Promise<ExpenseByCategory[]> {
  const { data: sheets, error: sheetError } = await supabase
    .from('daily_sheets')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('status', 'closed')
    .gte('sheet_date', `${year}-${String(month).padStart(2, '0')}-01`)
    .lt('sheet_date', `${year}-${String(month + 1).padStart(2, '0')}-01`);

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

  return Object.entries(categoryMap).map(([category, total]) => ({
    category,
    total,
  }));
}

/**
 * Fetch top products sold
 */
async function fetchTopProducts(
  organizationId: string,
  month: number,
  year: number
): Promise<TopProduct[]> {
  const { data: sheets, error: sheetError } = await supabase
    .from('daily_sheets')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('status', 'closed')
    .gte('sheet_date', `${year}-${String(month).padStart(2, '0')}-01`)
    .lt('sheet_date', `${year}-${String(month + 1).padStart(2, '0')}-01`);

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

  // Convert to array and sort by quantity sold
  return Array.from(productMap.values())
    .sort((a, b) => b.qtySold - a.qtySold)
    .slice(0, 10);
}

/**
 * Fetch daily revenue for chart
 */
async function fetchDailyRevenue(
  organizationId: string,
  month: number,
  year: number
): Promise<DailyRevenueData[]> {
  const { data, error } = await supabase
    .from('daily_sheets')
    .select('sheet_date, theoretical_revenue')
    .eq('organization_id', organizationId)
    .eq('status', 'closed')
    .gte('sheet_date', `${year}-${String(month).padStart(2, '0')}-01`)
    .lt('sheet_date', `${year}-${String(month + 1).padStart(2, '0')}-01`)
    .order('sheet_date', { ascending: true });

  if (error) throw error;

  return (data || []).map(d => ({
    date: d.sheet_date,
    revenue: d.theoretical_revenue || 0,
  }));
}

/**
 * Fetch all daily sheets for the month
 */
async function fetchDailySheets(
  organizationId: string,
  month: number,
  year: number
): Promise<DailySheet[]> {
  const { data, error } = await supabase
    .from('daily_sheets')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('status', 'closed')
    .gte('sheet_date', `${year}-${String(month).padStart(2, '0')}-01`)
    .lt('sheet_date', `${year}-${String(month + 1).padStart(2, '0')}-01`)
    .order('sheet_date', { ascending: false });

  if (error) throw error;

  return (data || []).map((d: any) => ({
    id: d.id,
    organizationId: d.organization_id,
    sheetDate: d.sheet_date,
    status: d.status,
    openingCash: d.opening_cash,
    closingCash: d.closing_cash,
    theoreticalRevenue: d.theoretical_revenue,
    cashDifference: d.cash_difference,
    expensesTotal: d.expenses_total,
    notes: d.notes,
    closedAt: d.closed_at,
    closedBy: d.closed_by,
    createdAt: d.created_at,
    updatedAt: d.updated_at,
  }));
}
