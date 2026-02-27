'use client';

import { AlertCircle, Clock } from 'lucide-react';
import { useState } from 'react';

interface Alert {
  id: string;
  contactName: string;
  commercialName: string;
  timeRemaining: string;
  status: 'URGENT' | 'ATTENTION';
}

interface AlertsPanelProps {
  alerts: Alert[];
  onAlertClick?: (alertId: string) => void;
}

export function AlertsPanel({ alerts, onAlertClick }: AlertsPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (alerts.length === 0) {
    return (
      <div className="bg-white rounded-lg p-8 shadow-sm text-center">
        <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-600">Aucune alerte SLA</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900">Alertes SLA</h3>
      </div>
      <div className="divide-y divide-gray-100">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
            onClick={() => {
              setExpandedId(expandedId === alert.id ? null : alert.id);
              onAlertClick?.(alert.id);
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={`px-2.5 py-1 rounded text-xs font-semibold ${
                      alert.status === 'URGENT'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {alert.status === 'URGENT' ? 'URGENT' : 'ATTENTION'}
                  </div>
                  <span className="font-medium text-gray-900">{alert.contactName}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 ml-0">
                  <Clock className="w-4 h-4" />
                  <span>{alert.timeRemaining}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Assigné à: <span className="font-medium">{alert.commercialName}</span>
                </p>
              </div>
              <div className="ml-4">
                <div
                  className={`w-3 h-3 rounded-full ${
                    alert.status === 'URGENT' ? 'bg-red-500' : 'bg-yellow-400'
                  }`}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
