import React from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DailyRevenueData, ExpenseByCategory } from '../../../../types/activity';
import { EXPENSE_CATEGORIES } from '../../../../types/activity';

interface MonthlyChartsProps {
  dailyRevenue: DailyRevenueData[];
  expensesByCategory: ExpenseByCategory[];
  cashDifferenceData: { date: string; difference: number }[];
}

const COLORS = {
  primary: '#F97316', // Orange
  green: '#16A34A',
  red: '#DC2626',
  blue: '#2563EB',
  categories: ['#F97316', '#2563EB', '#16A34A', '#EAB308'],
};

export const MonthlyCharts: React.FC<MonthlyChartsProps> = ({
  dailyRevenue,
  expensesByCategory,
  cashDifferenceData,
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getDate()}/${date.getMonth() + 1}`;
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

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-900">Graphiques</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Revenue Line Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">CA Journalier</h3>
          {dailyRevenue.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
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
                  labelFormatter={(label) => formatDate(label)}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  name="Chiffre d'affaires"
                  stroke={COLORS.green} 
                  strokeWidth={2}
                  dot={{ fill: COLORS.green, r: 4 }}
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

        {/* Cash Difference Bar Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 lg:col-span-2">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Écarts de Caisse par Jour</h3>
          {cashDifferenceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={cashDifferenceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
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
                  labelFormatter={(label) => formatDate(label)}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar 
                  dataKey="difference" 
                  name="Écart de caisse"
                  fill={COLORS.blue}
                  radius={[4, 4, 0, 0]}
                >
                  {cashDifferenceData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.difference >= 0 ? COLORS.green : COLORS.red} 
                    />
                  ))}
                </Bar>
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
