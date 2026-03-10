"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Users, TrendingUp, ArrowUpDown } from "lucide-react";
import clsx from "clsx";

interface PerformanceRow {
  ownerId: number | string;
  ownerName: string;
  devisCount: number;
  devisTotal: number;
  commandesCount: number;
  commandesTotal: number;
  conversionRate: number;
}

interface Totals {
  devisCount: number;
  devisTotal: number;
  commandesCount: number;
  commandesTotal: number;
  conversionRate: number;
}

interface PerformanceData {
  success: boolean;
  period: string;
  periodLabel: string;
  performance: PerformanceRow[];
  totals: Totals;
}

type Period = "week" | "month" | "year";
type SortKey = "ownerName" | "devisCount" | "devisTotal" | "commandesCount" | "commandesTotal" | "conversionRate";

const formatEuro = (val: number) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);

const periodLabels: Record<Period, string> = {
  week: "Semaine",
  month: "Mois",
  year: "Année",
};

export function PerformanceTable() {
  const [period, setPeriod] = useState<Period>("month");
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("commandesTotal");
  const [sortAsc, setSortAsc] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/sellsy/performance?period=${period}&year=${new Date().getFullYear()}`
      );
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Erreur inconnue");
      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const sortedRows = data?.performance
    ? [...data.performance].sort((a, b) => {
        const valA = a[sortKey];
        const valB = b[sortKey];
        if (typeof valA === "string" && typeof valB === "string") {
          return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return sortAsc ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
      })
    : [];

  const SortHeader = ({ label, sortKeyName }: { label: string; sortKeyName: SortKey }) => (
    <th
      className="px-3 py-3 text-left text-xs font-semibold text-cockpit-secondary uppercase tracking-wider cursor-pointer hover:text-cockpit-heading transition select-none"
      onClick={() => handleSort(sortKeyName)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <ArrowUpDown className={clsx("w-3 h-3", sortKey === sortKeyName ? "text-cockpit-yellow" : "opacity-40")} />
      </span>
    </th>
  );

  return (
    <div className="bg-cockpit-dark border border-cockpit rounded-xl p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-cockpit-yellow" />
          <h3 className="text-cockpit-heading font-semibold text-base">
            Performance commerciaux
          </h3>
          {data?.periodLabel && (
            <span className="text-cockpit-secondary text-sm ml-1">
              — {data.periodLabel}
            </span>
          )}
        </div>

        {/* Period selector */}
        <div className="flex gap-1 bg-cockpit rounded-lg p-1">
          {(["week", "month", "year"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={clsx(
                "px-3 py-1.5 text-xs font-medium rounded-md transition",
                period === p
                  ? "bg-cockpit-yellow text-black"
                  : "text-cockpit-secondary hover:text-cockpit-heading hover:bg-cockpit-border/30"
              )}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-cockpit-yellow" />
          <span className="ml-2 text-cockpit-secondary text-sm">Chargement...</span>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="text-center py-8">
          <p className="text-cockpit-error text-sm">{error}</p>
          <button
            onClick={fetchData}
            className="mt-2 text-cockpit-yellow text-sm hover:underline"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Table */}
      {!loading && !error && data && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-cockpit-border">
                <SortHeader label="Commercial" sortKeyName="ownerName" />
                <SortHeader label="Devis" sortKeyName="devisCount" />
                <SortHeader label="Montant devis HT" sortKeyName="devisTotal" />
                <SortHeader label="Commandes" sortKeyName="commandesCount" />
                <SortHeader label="CA commandes HT" sortKeyName="commandesTotal" />
                <SortHeader label="Conversion" sortKeyName="conversionRate" />
              </tr>
            </thead>
            <tbody>
              {sortedRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-cockpit-secondary text-sm">
                    Aucune donnée pour cette période
                  </td>
                </tr>
              )}
              {sortedRows.map((row) => (
                <tr
                  key={row.ownerId}
                  className="border-b border-cockpit-border/50 hover:bg-cockpit-border/10 transition"
                >
                  <td className="px-3 py-3">
                    <span className="font-medium text-cockpit-heading text-sm">
                      {row.ownerName}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-blue-400 font-semibold text-sm">{row.devisCount}</span>
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-cockpit-text text-sm">{formatEuro(row.devisTotal)}</span>
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-emerald-400 font-semibold text-sm">
                      {row.commandesCount}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-cockpit-text text-sm font-medium">
                      {formatEuro(row.commandesTotal)}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={clsx(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold",
                        row.conversionRate >= 50
                          ? "bg-emerald-500/20 text-emerald-400"
                          : row.conversionRate >= 20
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-red-500/20 text-red-400"
                      )}
                    >
                      <TrendingUp className="w-3 h-3 mr-1" />
                      {row.conversionRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            {/* Totaux */}
            {sortedRows.length > 0 && data.totals && (
              <tfoot>
                <tr className="border-t-2 border-cockpit-border bg-cockpit-border/10">
                  <td className="px-3 py-3">
                    <span className="font-bold text-cockpit-heading text-sm">TOTAL</span>
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-blue-400 font-bold text-sm">
                      {data.totals.devisCount}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-cockpit-heading font-bold text-sm">
                      {formatEuro(data.totals.devisTotal)}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-emerald-400 font-bold text-sm">
                      {data.totals.commandesCount}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-cockpit-heading font-bold text-sm">
                      {formatEuro(data.totals.commandesTotal)}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={clsx(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold",
                        data.totals.conversionRate >= 50
                          ? "bg-emerald-500/20 text-emerald-400"
                          : data.totals.conversionRate >= 20
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-red-500/20 text-red-400"
                      )}
                    >
                      {data.totals.conversionRate}%
                    </span>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </div>
  );
}
