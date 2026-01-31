import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface SalesChartData {
  date: string;
  amount: number;
  liters: number;
}

interface SalesChartProps {
  data: SalesChartData[];
  loading?: boolean;
}

export function SalesChart({ data, loading = false }: SalesChartProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-secondary-200 p-6">
        <div className="h-4 bg-secondary-200 rounded w-48 mb-6 animate-pulse" />
        <div className="h-80 bg-secondary-100 rounded animate-pulse" />
      </div>
    );
  }

  // Format date for display
  const formattedData = data.map((item) => ({
    ...item,
    displayDate: new Date(item.date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
    }),
  }));

  const formatAmount = (value: number) => {
    return `${value.toLocaleString('fr-FR')} MAD`;
  };

  const formatLiters = (value: number) => {
    return `${value.toLocaleString('fr-FR')} L`;
  };

  return (
    <div className="bg-white rounded-xl border border-secondary-200 p-6">
      <h3 className="text-lg font-semibold text-secondary-900 mb-6">
        Evolution des ventes
      </h3>

      {data.length === 0 ? (
        <div className="h-80 flex items-center justify-center bg-secondary-50 rounded-lg">
          <p className="text-secondary-500">Aucune donnee disponible</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <LineChart
            data={formattedData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="displayDate"
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
            />
            <YAxis
              yAxisId="left"
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              tickFormatter={(value) => `${value}L`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '12px',
              }}
              formatter={(value, name) => {
                const numValue = typeof value === 'number' ? value : 0;
                if (name === 'CA') return [formatAmount(numValue), 'Chiffre d\'affaires'];
                return [formatLiters(numValue), 'Litres vendus'];
              }}
              labelStyle={{ fontWeight: 600, marginBottom: '4px' }}
            />
            <Legend
              verticalAlign="top"
              height={36}
              formatter={(value) => {
                if (value === 'amount') return 'Chiffre d\'affaires';
                return 'Litres vendus';
              }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="amount"
              name="CA"
              stroke="#0EA5E9"
              strokeWidth={2}
              dot={{ fill: '#0EA5E9', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="liters"
              name="Litres"
              stroke="#10B981"
              strokeWidth={2}
              dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
