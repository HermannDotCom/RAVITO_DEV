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
import { MonthlyAnnualData, ExpenseByCategory } from '../../../../types/activity';
import { EXPENSE_CATEGORIES } from '../../../../types/activity';
import { formatCurrency, formatMonthShort, getCategoryLabel } from '../../../../utils/activityUtils';
import { COLORS } from '../PDFExport/pdfStyles';

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
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-900">Graphiques Annuels</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Bar Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">CA Mensuel</h3>
          {revenueChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="month"
                  stroke="#64748b"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#64748b"
                  style={{ fontSize: '12px' }}
                  tickFormatter={formatCurrencyShort}
                />
                <Tooltip 
                  formatter={(value: number) => [`${formatCurrency(value)} F`, 'CA']}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar 
                  dataKey="revenue" 
                  name="Chiffre d'affaires"
                  fill={CHART_COLORS.green}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-slate-400">
              Aucune donnée disponible
            </div>
          )}
        </div>

        {/* Expenses by Category Pie Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Dépenses par Catégorie</h3>
          {expensesChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expensesChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
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
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-slate-400">
              Aucune dépense enregistrée
            </div>
          )}
        </div>

        {/* Cash Difference Line Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Évolution Écarts de Caisse</h3>
          {cashDifferenceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={cashDifferenceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="month"
                  stroke="#64748b"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#64748b"
                  style={{ fontSize: '12px' }}
                  tickFormatter={formatCurrencyShort}
                />
                <Tooltip 
                  formatter={(value: number) => [`${formatCurrency(value)} F`, 'Écart']}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
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
            <div className="h-[300px] flex items-center justify-center text-slate-400">
              Aucune donnée disponible
            </div>
          )}
        </div>

        {/* Revenue vs Expenses Comparison */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">CA vs Dépenses</h3>
          {marginData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={marginData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="month"
                  stroke="#64748b"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#64748b"
                  style={{ fontSize: '12px' }}
                  tickFormatter={formatCurrencyShort}
                />
                <Tooltip 
                  formatter={(value: number) => `${formatCurrency(value)} F`}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
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
            <div className="h-[300px] flex items-center justify-center text-slate-400">
              Aucune donnée disponible
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
