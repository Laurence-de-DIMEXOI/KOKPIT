'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface LeadsChartProps {
  data?: Array<{
    source: string;
    count: number;
  }>;
}

const sourceColors: Record<string, string> = {
  META: '#1f2937',
  GOOGLE: '#3b82f6',
  DIRECT: '#f4b400',
  REFERRAL: '#8b5cf6',
  ORGANIC: '#10b981',
};

const sourceLabels: Record<string, string> = {
  META: 'Meta',
  GOOGLE: 'Google',
  DIRECT: 'Direct',
  REFERRAL: 'Référence',
  ORGANIC: 'Organique',
};

export function LeadsChart({ data = [] }: LeadsChartProps) {
  const chartData = (data ?? []).map((item) => ({
    ...item,
    name: sourceLabels[item.source] || item.source,
  }));

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Demandes par source</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="name" stroke="#6b7280" />
          <YAxis stroke="#6b7280" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#fff',
            }}
            cursor={{ fill: 'rgba(244, 180, 0, 0.1)' }}
          />
          <Bar
            dataKey="count"
            fill="#f4b400"
            radius={[8, 8, 0, 0]}
            name="Nombre de demandes"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
