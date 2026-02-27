'use client';

interface ConversionFunnelProps {
  data: Array<{
    stage: string;
    count: number;
    percentage: number;
  }>;
}

const stageLabels: Record<string, string> = {
  LEADS: 'Demandes',
  DEVIS: 'Devis',
  VENTES: 'Ventes',
};

export function ConversionFunnel({ data }: ConversionFunnelProps) {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Entonnoir de conversion</h3>
      <div className="space-y-4">
        {data.map((item, index) => {
          const width = ((data[0]?.count - index * 20) / data[0]?.count) * 100;
          const clampedWidth = Math.max(width, 20);
          return (
            <div key={item.stage}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900">
                  {stageLabels[item.stage] || item.stage}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-900">{item.count}</span>
                  <span className="text-sm text-gray-600">{item.percentage.toFixed(1)}%</span>
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-8 overflow-hidden">
                <div
                  className="bg-yellow-400 h-full rounded-full flex items-center justify-center transition-all duration-300"
                  style={{ width: `${clampedWidth}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
