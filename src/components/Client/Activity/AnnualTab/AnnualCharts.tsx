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

interface AnnualChartsProps {
  monthlyData: MonthlyAnnualData[];
  expensesByCategory: ExpenseByCategory[];
}

const COLORS = {
  primary: '#F97316', // Orange
  green: '#16A34A',
  red: '#DC2626',
  blue: '#2563EB',
  purple: '#9333EA',
  categories: ['#F97316', '#2563EB', '#16A34A', '#EAB308', '#9333EA', '#EC4899'],
};

export const AnnualCharts: React.FC<AnnualChartsProps> = ({
  monthlyData,
  expensesByCategory,
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatMonth = (monthName: string) => {
    return monthName.substring(0, 3).charAt(0).toUpperCase() + monthName.substring(1, 3);
  };

  // Get category labels
  const getCategoryLabel = (category: string) => {
    return EXPENSE_CATEGORIES[category as keyof typeof EXPENSE_CATEGORIES] || category;
  };

  // Prepare expenses data with labels
  const expensesChartData = expensesByCategory.map(exp => ({
    name: getCategoryLabel(exp.category),
    value: exp.total,
  }));

  // Prepare monthly revenue data
  const revenueChartData = monthlyData.map(m => ({
    month: formatMonth(m.monthName),
    revenue: m.revenue,
  }));

  // Prepare cash difference data
  const cashDifferenceData = monthlyData.map(m => ({
    month: formatMonth(m.monthName),
    difference: m.cashDifference,
  }));

  // Prepare margin data
  const marginData = monthlyData.map(m => ({
    month: formatMonth(m.monthName),
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
                  tickFormatter={(value) => `${formatCurrency(value / 1000)}k`}
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
                  fill={COLORS.green}
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
                    <Cell key={`cell-${index}`} fill={COLORS.categories[index % COLORS.categories.length]} />
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
                  tickFormatter={(value) => `${formatCurrency(value / 1000)}k`}
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
                  stroke={COLORS.blue}
                  strokeWidth={2}
                  dot={{ fill: COLORS.blue, r: 4 }}
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
                  tickFormatter={(value) => `${formatCurrency(value / 1000)}k`}
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
                  fill={COLORS.green}
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="expenses" 
                  name="Dépenses"
                  fill={COLORS.red}
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
