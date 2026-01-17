import { supabase } from '../lib/supabase';
import { getOrganizationOwnerId } from '../utils/organizationUtils';

export interface TransactionFilters {
  period?: '7d' | '30d' | '90d' | '1y' | 'all';
  transferStatus?: 'pending' | 'transferred' | 'all';
  startDate?: Date;
  endDate?: Date;
}

export interface FinancialSummary {
  totalAmount: number;
  totalCommissions: number;
  totalNet: number;
  orderCount: number;
  averageOrderValue: number;
  pendingTransferAmount?: number;
}

export interface MonthlyStats {
  month: number;
  year: number;
  monthName: string;
  orderCount: number;
  totalHT: number;
  commissions: number;
  totalTTC: number;
  netAmount?: number;
}

export interface QuarterlyStats {
  quarter: number;
  year: number;
  orderCount: number;
  totalHT: number;
  commissions: number;
  totalTTC: number;
  netAmount?: number;
}

export interface YearlyStats {
  year: number;
  orderCount: number;
  totalHT: number;
  commissions: number;
  totalTTC: number;
  netAmount?: number;
}

export interface TransactionRecord {
  id: string;
  date: Date;
  orderNumber: string;
  counterpartyName: string;
  amountHT: number;
  commission: number;
  totalAmount: number;
  status: string;
  transferredAt?: Date;
}

// Client financial functions

export async function getClientFinancialSummary(
  clientId: string,
  period?: string
): Promise<FinancialSummary> {
  try {
    // Get the organization owner ID (handles both owners and members)
    const organizationOwnerId = await getOrganizationOwnerId(clientId);
    
    let query = supabase
      .from('orders')
      .select('id, total_amount, client_commission, payment_status, created_at')
      .eq('client_id', organizationOwnerId)
      .eq('payment_status', 'paid');

    // Apply period filter
    if (period && period !== 'all') {
      const now = new Date();
      let startDate: Date;
      
      switch (period) {
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '1y':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(0);
      }
      
      query = query.gte('created_at', startDate.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching client financial summary:', error);
      return {
        totalAmount: 0,
        totalCommissions: 0,
        totalNet: 0,
        orderCount: 0,
        averageOrderValue: 0
      };
    }

    const orderCount = data?.length || 0;
    const totalAmount = data?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
    const totalCommissions = data?.reduce((sum, order) => sum + (order.client_commission || 0), 0) || 0;
    const totalNet = totalAmount - totalCommissions;

    return {
      totalAmount,
      totalCommissions,
      totalNet,
      orderCount,
      averageOrderValue: orderCount > 0 ? totalAmount / orderCount : 0
    };
  } catch (error) {
    console.error('Exception fetching client financial summary:', error);
    return {
      totalAmount: 0,
      totalCommissions: 0,
      totalNet: 0,
      orderCount: 0,
      averageOrderValue: 0
    };
  }
}

export async function getClientTransactionHistory(
  clientId: string,
  filters: TransactionFilters
): Promise<TransactionRecord[]> {
  try {
    // Get the organization owner ID (handles both owners and members)
    const organizationOwnerId = await getOrganizationOwnerId(clientId);
    
    let query = supabase
      .from('orders')
      .select(`
        id,
        total_amount,
        client_commission,
        consigne_total,
        payment_status,
        status,
        supplier_id,
        created_at,
        paid_at
      `)
      .eq('client_id', organizationOwnerId)
      .eq('payment_status', 'paid')
      .order('created_at', { ascending: false });

    // Apply period filter
    if (filters.period && filters.period !== 'all') {
      const now = new Date();
      let startDate: Date;
      
      switch (filters.period) {
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '1y':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(0);
      }
      
      query = query.gte('created_at', startDate.toISOString());
    }

    const { data: orders, error } = await query;

    if (error) {
      console.error('Error fetching client transaction history:', error);
      return [];
    }

    // Fetch supplier names for paid orders
    const supplierIds = [...new Set(orders?.filter(o => o.supplier_id).map(o => o.supplier_id) || [])];
    const supplierNames: Record<string, string> = {};

    if (supplierIds.length > 0) {
      const { data: suppliers } = await supabase
        .from('profiles')
        .select('id, name, business_name')
        .in('id', supplierIds);

      suppliers?.forEach(s => {
        supplierNames[s.id] = s.business_name || s.name || 'Fournisseur inconnu';
      });
    }

    return (orders || []).map(order => {
      const amountHT = (order.total_amount || 0) - (order.client_commission || 0);
      
      return {
        id: order.id,
        date: new Date(order.paid_at || order.created_at),
        orderNumber: order.id.substring(0, 8).toUpperCase(),
        counterpartyName: order.supplier_id ? supplierNames[order.supplier_id] || 'Fournisseur' : 'En attente',
        amountHT,
        commission: order.client_commission || 0,
        totalAmount: order.total_amount || 0,
        status: getStatusLabel(order.status)
      };
    });
  } catch (error) {
    console.error('Exception fetching client transaction history:', error);
    return [];
  }
}

export async function getClientMonthlyStats(
  clientId: string,
  year: number
): Promise<MonthlyStats[]> {
  try {
    // Get the organization owner ID (handles both owners and members)
    const organizationOwnerId = await getOrganizationOwnerId(clientId);
    
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    const { data, error } = await supabase
      .from('orders')
      .select('id, total_amount, client_commission, created_at')
      .eq('client_id', organizationOwnerId)
      .eq('payment_status', 'paid')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (error) {
      console.error('Error fetching client monthly stats:', error);
      return [];
    }

    // Group by month
    const monthlyData: Record<number, MonthlyStats> = {};
    const monthNames = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];

    data?.forEach(order => {
      const orderDate = new Date(order.created_at);
      const month = orderDate.getMonth();

      if (!monthlyData[month]) {
        monthlyData[month] = {
          month: month + 1,
          year,
          monthName: monthNames[month],
          orderCount: 0,
          totalHT: 0,
          commissions: 0,
          totalTTC: 0
        };
      }

      const amountHT = (order.total_amount || 0) - (order.client_commission || 0);
      monthlyData[month].orderCount += 1;
      monthlyData[month].totalHT += amountHT;
      monthlyData[month].commissions += order.client_commission || 0;
      monthlyData[month].totalTTC += order.total_amount || 0;
    });

    // Return sorted by month
    return Object.values(monthlyData).sort((a, b) => a.month - b.month);
  } catch (error) {
    console.error('Exception fetching client monthly stats:', error);
    return [];
  }
}

// Supplier financial functions

export async function getSupplierFinancialSummary(
  supplierId: string,
  period?: string
): Promise<FinancialSummary> {
  try {
    // Get the organization owner ID (handles both owners and members)
    const organizationOwnerId = await getOrganizationOwnerId(supplierId);
    
    let query = supabase
      .from('orders')
      .select('id, total_amount, supplier_commission, net_supplier_amount, payment_status, transferred_at, status, created_at')
      .eq('supplier_id', organizationOwnerId)
      .eq('status', 'delivered');

    // Apply period filter
    if (period && period !== 'all') {
      const now = new Date();
      let startDate: Date;
      
      switch (period) {
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '1y':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(0);
      }
      
      query = query.gte('created_at', startDate.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching supplier financial summary:', error);
      return {
        totalAmount: 0,
        totalCommissions: 0,
        totalNet: 0,
        orderCount: 0,
        averageOrderValue: 0,
        pendingTransferAmount: 0
      };
    }

    const orderCount = data?.length || 0;
    const totalAmount = data?.reduce((sum, order) => sum + (order.base_amount || order.total_amount || 0), 0) || 0;
    const totalCommissions = data?.reduce((sum, order) => sum + (order.supplier_commission || 0), 0) || 0;
    const totalNet = data?.reduce((sum, order) => sum + (order.net_supplier_amount || 0), 0) || 0;
    
    // Calculate pending transfers (delivered but not transferred)
    const pendingTransferAmount = data
      ?.filter(order => order.payment_status === 'paid' && !order.transferred_at)
      .reduce((sum, order) => sum + (order.net_supplier_amount || 0), 0) || 0;

    return {
      totalAmount,
      totalCommissions,
      totalNet,
      orderCount,
      averageOrderValue: orderCount > 0 ? totalAmount / orderCount : 0,
      pendingTransferAmount
    };
  } catch (error) {
    console.error('Exception fetching supplier financial summary:', error);
    return {
      totalAmount: 0,
      totalCommissions: 0,
      totalNet: 0,
      orderCount: 0,
      averageOrderValue: 0,
      pendingTransferAmount: 0
    };
  }
}

export async function getSupplierTransactionHistory(
  supplierId: string,
  filters: TransactionFilters
): Promise<TransactionRecord[]> {
  try {
    // Get the organization owner ID (handles both owners and members)
    const organizationOwnerId = await getOrganizationOwnerId(supplierId);
    
    let query = supabase
      .from('orders')
      .select(`
        id,
        total_amount,
        supplier_commission,
        net_supplier_amount,
        payment_status,
        status,
        client_id,
        created_at,
        delivered_at,
        transferred_at
      `)
      .eq('supplier_id', organizationOwnerId)
      .eq('status', 'delivered')
      .order('delivered_at', { ascending: false });

    // Apply period filter
    if (filters.period && filters.period !== 'all') {
      const now = new Date();
      let startDate: Date;
      
      switch (filters.period) {
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '1y':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(0);
      }
      
      query = query.gte('delivered_at', startDate.toISOString());
    }

    // Apply transfer status filter
    if (filters.transferStatus === 'pending') {
      query = query.is('transferred_at', null);
    } else if (filters.transferStatus === 'transferred') {
      query = query.not('transferred_at', 'is', null);
    }

    const { data: orders, error } = await query;

    if (error) {
      console.error('Error fetching supplier transaction history:', error);
      return [];
    }

    // Fetch client names for paid orders only
    const paidOrders = orders?.filter(o => o.payment_status === 'paid' && o.client_id) || [];
    const clientIds = [...new Set(paidOrders.map(o => o.client_id))];
    const clientNames: Record<string, string> = {};

    if (clientIds.length > 0) {
      const { data: clients } = await supabase
        .from('profiles')
        .select('id, name, business_name')
        .in('id', clientIds);

      clients?.forEach(c => {
        clientNames[c.id] = c.business_name || c.name || 'Client';
      });
    }

    return (orders || []).map(order => {
      // Only show client name for paid orders (privacy)
      const showClientName = order.payment_status === 'paid';
      const clientName = showClientName && order.client_id 
        ? clientNames[order.client_id] || 'Client' 
        : 'Client (en attente paiement)';
      
      const transferStatus = order.transferred_at 
        ? `Viré le ${formatDateShort(new Date(order.transferred_at))}`
        : 'En attente';

      return {
        id: order.id,
        date: new Date(order.delivered_at || order.created_at),
        orderNumber: order.id.substring(0, 8).toUpperCase(),
        counterpartyName: clientName,
        amountHT: order.base_amount || order.total_amount || 0,
        commission: order.supplier_commission || 0,
        totalAmount: order.net_supplier_amount || 0,
        status: transferStatus,
        transferredAt: order.transferred_at ? new Date(order.transferred_at) : undefined
      };
    });
  } catch (error) {
    console.error('Exception fetching supplier transaction history:', error);
    return [];
  }
}

export async function getSupplierMonthlyStats(
  supplierId: string,
  year: number
): Promise<MonthlyStats[]> {
  try {
    // Get the organization owner ID (handles both owners and members)
    const organizationOwnerId = await getOrganizationOwnerId(supplierId);
    
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    const { data, error } = await supabase
      .from('orders')
      .select('id, total_amount, supplier_commission, net_supplier_amount, delivered_at')
      .eq('supplier_id', organizationOwnerId)
      .eq('status', 'delivered')
      .gte('delivered_at', startDate.toISOString())
      .lte('delivered_at', endDate.toISOString());

    if (error) {
      console.error('Error fetching supplier monthly stats:', error);
      return [];
    }

    // Group by month
    const monthlyData: Record<number, MonthlyStats> = {};
    const monthNames = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];

    data?.forEach(order => {
      const orderDate = new Date(order.delivered_at);
      const month = orderDate.getMonth();

      if (!monthlyData[month]) {
        monthlyData[month] = {
          month: month + 1,
          year,
          monthName: monthNames[month],
          orderCount: 0,
          totalHT: 0,
          commissions: 0,
          totalTTC: 0,
          netAmount: 0
        };
      }

      monthlyData[month].orderCount += 1;
      monthlyData[month].totalHT += order.base_amount || order.total_amount || 0;
      monthlyData[month].commissions += order.supplier_commission || 0;
      monthlyData[month].netAmount = (monthlyData[month].netAmount || 0) + (order.net_supplier_amount || 0);
      monthlyData[month].totalTTC += order.base_amount || order.total_amount || 0;
    });

    // Return sorted by month
    return Object.values(monthlyData).sort((a, b) => a.month - b.month);
  } catch (error) {
    console.error('Exception fetching supplier monthly stats:', error);
    return [];
  }
}

export async function getPendingTransfers(supplierId: string): Promise<{
  count: number;
  totalAmount: number;
  orders: { id: string; amount: number; deliveredAt: Date }[];
}> {
  try {
    // Get the organization owner ID (handles both owners and members)
    const organizationOwnerId = await getOrganizationOwnerId(supplierId);
    
    const { data, error } = await supabase
      .from('orders')
      .select('id, net_supplier_amount, delivered_at')
      .eq('supplier_id', organizationOwnerId)
      .eq('status', 'delivered')
      .eq('payment_status', 'paid')
      .is('transferred_at', null)
      .order('delivered_at', { ascending: false });

    if (error) {
      console.error('Error fetching pending transfers:', error);
      return { count: 0, totalAmount: 0, orders: [] };
    }

    return {
      count: data?.length || 0,
      totalAmount: data?.reduce((sum, order) => sum + (order.net_supplier_amount || 0), 0) || 0,
      orders: (data || []).map(order => ({
        id: order.id,
        amount: order.net_supplier_amount || 0,
        deliveredAt: new Date(order.delivered_at)
      }))
    };
  } catch (error) {
    console.error('Exception fetching pending transfers:', error);
    return { count: 0, totalAmount: 0, orders: [] };
  }
}

// Helper functions

function getStatusLabel(status: string): string {
  const statusLabels: Record<string, string> = {
    'pending': 'En attente',
    'pending-offers': 'En attente d\'offres',
    'offers-received': 'Offres reçues',
    'awaiting-payment': 'En attente de paiement',
    'paid': 'Payée',
    'awaiting-client-validation': 'En attente de validation',
    'accepted': 'Acceptée',
    'preparing': 'En préparation',
    'delivering': 'En livraison',
    'delivered': 'Livrée',
    'awaiting-rating': 'En attente d\'évaluation',
    'cancelled': 'Annulée'
  };
  return statusLabels[status] || status;
}

function formatDateShort(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
}

// Export as CSV
export function exportTransactionsToCSV(
  transactions: TransactionRecord[],
  filename: string
): void {
  const headers = ['Date', 'N° Commande', 'Contrepartie', 'Montant HT', 'Commission', 'Total', 'Statut'];
  
  const rows = transactions.map(t => [
    formatDateShort(t.date),
    t.orderNumber,
    t.counterpartyName,
    t.amountHT.toFixed(0),
    t.commission.toFixed(0),
    t.totalAmount.toFixed(0),
    t.status
  ]);

  const csvContent = [
    headers.join(';'),
    ...rows.map(row => row.join(';'))
  ].join('\n');

  // Add BOM for Excel compatibility
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Helper to aggregate monthly stats to quarterly
export function aggregateToQuarterly(monthlyStats: MonthlyStats[]): QuarterlyStats[] {
  const quarterlyData: Record<number, QuarterlyStats> = {};

  monthlyStats.forEach(month => {
    const quarter = Math.ceil(month.month / 3);
    
    if (!quarterlyData[quarter]) {
      quarterlyData[quarter] = {
        quarter,
        year: month.year,
        orderCount: 0,
        totalHT: 0,
        commissions: 0,
        totalTTC: 0,
        netAmount: 0
      };
    }

    quarterlyData[quarter].orderCount += month.orderCount;
    quarterlyData[quarter].totalHT += month.totalHT;
    quarterlyData[quarter].commissions += month.commissions;
    quarterlyData[quarter].totalTTC += month.totalTTC;
    quarterlyData[quarter].netAmount = (quarterlyData[quarter].netAmount || 0) + (month.netAmount || 0);
  });

  return Object.values(quarterlyData).sort((a, b) => a.quarter - b.quarter);
}

// Helper to aggregate monthly stats to yearly
export function aggregateToYearly(monthlyStats: MonthlyStats[]): YearlyStats {
  const currentYear = new Date().getFullYear();
  
  if (monthlyStats.length === 0) {
    return {
      year: currentYear,
      orderCount: 0,
      totalHT: 0,
      commissions: 0,
      totalTTC: 0,
      netAmount: 0
    };
  }

  return monthlyStats.reduce(
    (acc, month) => ({
      year: month.year,
      orderCount: acc.orderCount + month.orderCount,
      totalHT: acc.totalHT + month.totalHT,
      commissions: acc.commissions + month.commissions,
      totalTTC: acc.totalTTC + month.totalTTC,
      netAmount: (acc.netAmount || 0) + (month.netAmount || 0)
    }),
    {
      year: monthlyStats[0].year,
      orderCount: 0,
      totalHT: 0,
      commissions: 0,
      totalTTC: 0,
      netAmount: 0
    }
  );
}
