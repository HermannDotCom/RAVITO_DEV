import React from 'react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { TrendingUp, PieChart as PieChartIcon, BarChart3, DollarSign } from 'lucide-react';
import { MonthlyAnnualData, ExpenseByCategory } from '../../../../types/activity';
import { EXPENSE_CATEGORIES } from '../../../../types/activity';
import { formatCurrency, formatMonthShort, getCategoryLabel } from '../../../../utils/activityUtils';
import { COLORS } from '../PDFExport/pdfStyles';
import { MobileAccordion } from '../../../ui/MobileAccordion';

interface AnnualChartsProps {
  monthlyData: MonthlyAnnualData[];
  expensesByCategory: ExpenseByCategory[];
}

const CHART_COLORS = {
  primary: COLORS.primary,
  green: COLORS.success,
  red: COLORS.danger,
  blue: '#2563EB',
  purple: '#9333EA',
  categories: [COLORS.primary, '#2563EB', COLORS.success, '#EAB308', '#9333EA', '#EC4899'],
};

export const AnnualCharts: React.FC<AnnualChartsProps> = ({
  monthlyData,
  expensesByCategory,
}) => {
  const formatCurrencyShort = (value: number) => {
    return `${formatCurrency(value / 1000)}k`;
  };

  // Prepare expenses data with labels
  const expensesChartData = expensesByCategory.map(exp => ({
    name: getCategoryLabel(exp.category, EXPENSE_CATEGORIES),
    value: exp.total,
  }));

  // Prepare monthly revenue data
  const revenueChartData = monthlyData.map(m => ({
    month: formatMonthShort(m.monthName),
    revenue: m.revenue,
  }));

  // Prepare cash difference data
  const cashDifferenceData = monthlyData.map(m => ({
    month: formatMonthShort(m.monthName),
    difference: m.cashDifference,
  }));

  // Prepare margin data
  const marginData = monthlyData.map(m => ({
    month: formatMonthShort(m.monthName),
    revenue: m.revenue,
    expenses: m.expenses,
    margin: m.margin,
  }));

  return (
    <div className="space-y-4 sm:space-y-6">
      <h2 className="text-lg sm:text-xl font-bold text-slate-900">Graphiques Annuels</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Monthly Revenue Bar Chart */}
        <MobileAccordion
          title="CA Mensuel"
          icon={<BarChart3 className="w-5 h-5" />}
          defaultOpen={false}
        >
          <div className="bg-white rounded-lg p-3 sm:p-4">
            {revenueChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={revenueChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="month"
                    stroke="#64748b"
                    style={{ fontSize: '10px' }}
                  />
                  <YAxis 
                    stroke="#64748b"
                    style={{ fontSize: '10px' }}
                    tickFormatter={formatCurrencyShort}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`${formatCurrency(value)} F`, 'CA']}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar 
                    dataKey="revenue" 
                    name="Chiffre d'affaires"
                    fill={CHART_COLORS.green}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-slate-400 text-sm">
                Aucune donnée disponible
              </div>
            )}
          </div>
        </MobileAccordion>

        {/* Expenses by Category Pie Chart */}
        <MobileAccordion
          title="Dépenses par Catégorie"
          icon={<PieChartIcon className="w-5 h-5" />}
          defaultOpen={false}
        >
          <div className="bg-white rounded-lg p-3 sm:p-4">
            {expensesChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={expensesChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={70}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {expensesChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS.categories[index % CHART_COLORS.categories.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => `${formatCurrency(value)} F`}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-slate-400 text-sm">
                Aucune dépense enregistrée
              </div>
            )}
          </div>
        </MobileAccordion>

        {/* Cash Difference Line Chart */}
        <MobileAccordion
          title="Évolution Écarts de Caisse"
          icon={<TrendingUp className="w-5 h-5" />}
          defaultOpen={false}
        >
          <div className="bg-white rounded-lg p-3 sm:p-4">
            {cashDifferenceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={cashDifferenceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="month"
                    stroke="#64748b"
                    style={{ fontSize: '10px' }}
                  />
                  <YAxis 
                    stroke="#64748b"
                    style={{ fontSize: '10px' }}
                    tickFormatter={formatCurrencyShort}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`${formatCurrency(value)} F`, 'Écart']}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line 
                    type="monotone" 
                    dataKey="difference" 
                    name="Écart de caisse"
                    stroke={CHART_COLORS.blue}
                    strokeWidth={2}
                    dot={{ fill: CHART_COLORS.blue, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-slate-400 text-sm">
                Aucune donnée disponible
              </div>
            )}
          </div>
        </MobileAccordion>

        {/* Revenue vs Expenses Comparison */}
        <MobileAccordion
          title="CA vs Dépenses"
          icon={<DollarSign className="w-5 h-5" />}
          defaultOpen={false}
        >
          <div className="bg-white rounded-lg p-3 sm:p-4">
            {marginData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={marginData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="month"
                    stroke="#64748b"
                    style={{ fontSize: '10px' }}
                  />
                  <YAxis 
                    stroke="#64748b"
                    style={{ fontSize: '10px' }}
                    tickFormatter={formatCurrencyShort}
                  />
                  <Tooltip 
                    formatter={(value: number) => `${formatCurrency(value)} F`}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar 
                    dataKey="revenue" 
                    name="CA"
                    fill={CHART_COLORS.green}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="expenses" 
                    name="Dépenses"
                    fill={CHART_COLORS.red}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-slate-400 text-sm">
                Aucune donnée disponible
              </div>
            )}
          </div>
        </MobileAccordion>
      </div>
    </div>
  );
};
