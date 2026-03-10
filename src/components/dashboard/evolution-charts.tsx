"use client";

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { FileText, ShoppingCart } from "lucide-react";

interface MonthData {
  month: string;
  label: string;
  devis: number;
  commandes: number;
  devisAmount: number;
  commandesAmount: number;
}

interface EvolutionChartsProps {
  data: MonthData[];
  loading?: boolean;
}

const formatEuro = (val: number) => {
  if (val >= 1000) return `${(val / 1000).toFixed(0)}k€`;
  return `${val.toFixed(0)}€`;
};

const shortMonth = (label: string) => {
  const parts = label.split(" ");
  return parts[0]?.substring(0, 3) || label;
};

const tooltipStyle = {
  backgroundColor: "#1a1d23",
  border: "1px solid #2a2d35",
  borderRadius: "8px",
  color: "#e5e7eb",
  fontSize: "13px",
};

function DevisTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={tooltipStyle} className="p-3">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: {p.name.includes("Montant") ? formatEuro(p.value) : p.value}
        </p>
      ))}
    </div>
  );
}

function CommandesTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={tooltipStyle} className="p-3">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: {p.name.includes("Montant") ? formatEuro(p.value) : p.value}
        </p>
      ))}
    </div>
  );
}

export function EvolutionCharts({ data, loading }: EvolutionChartsProps) {
  const chartData = data.map((d) => ({
    ...d,
    shortLabel: shortMonth(d.label),
  }));

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="bg-cockpit-dark border border-cockpit rounded-xl p-4 h-[380px] animate-pulse"
          >
            <div className="h-5 bg-cockpit-border/30 rounded w-40 mb-6" />
            <div className="h-[300px] bg-cockpit-border/10 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Graphique Devis */}
      <div className="bg-cockpit-dark border border-cockpit rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-blue-400" />
          <h3 className="text-cockpit-heading font-semibold text-base">
            Devis — Évolution annuelle
          </h3>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2d35" />
            <XAxis
              dataKey="shortLabel"
              stroke="#6b7280"
              tick={{ fontSize: 12 }}
            />
            <YAxis
              yAxisId="count"
              stroke="#6b7280"
              tick={{ fontSize: 12 }}
              allowDecimals={false}
            />
            <YAxis
              yAxisId="amount"
              orientation="right"
              stroke="#6b7280"
              tick={{ fontSize: 11 }}
              tickFormatter={formatEuro}
            />
            <Tooltip content={<DevisTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: "12px", color: "#9ca3af" }}
            />
            <Bar
              yAxisId="count"
              dataKey="devis"
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
              name="Nombre de devis"
              barSize={24}
            />
            <Line
              yAxisId="amount"
              type="monotone"
              dataKey="devisAmount"
              stroke="#60a5fa"
              strokeWidth={2}
              dot={{ r: 3, fill: "#60a5fa" }}
              name="Montant HT (€)"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Graphique Commandes */}
      <div className="bg-cockpit-dark border border-cockpit rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <ShoppingCart className="w-5 h-5 text-emerald-400" />
          <h3 className="text-cockpit-heading font-semibold text-base">
            Commandes — Évolution annuelle
          </h3>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2d35" />
            <XAxis
              dataKey="shortLabel"
              stroke="#6b7280"
              tick={{ fontSize: 12 }}
            />
            <YAxis
              yAxisId="count"
              stroke="#6b7280"
              tick={{ fontSize: 12 }}
              allowDecimals={false}
            />
            <YAxis
              yAxisId="amount"
              orientation="right"
              stroke="#6b7280"
              tick={{ fontSize: 11 }}
              tickFormatter={formatEuro}
            />
            <Tooltip content={<CommandesTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: "12px", color: "#9ca3af" }}
            />
            <Bar
              yAxisId="count"
              dataKey="commandes"
              fill="#10b981"
              radius={[4, 4, 0, 0]}
              name="Nombre de commandes"
              barSize={24}
            />
            <Line
              yAxisId="amount"
              type="monotone"
              dataKey="commandesAmount"
              stroke="#34d399"
              strokeWidth={2}
              dot={{ r: 3, fill: "#34d399" }}
              name="Montant HT (€)"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
