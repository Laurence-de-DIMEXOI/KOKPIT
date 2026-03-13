"use client";

import { useEffect, useState, useMemo } from "react";
import {
  FileText,
  RefreshCw,
  Loader2,
  Euro,
  AlertCircle,
  ArrowUpDown,
  ExternalLink,
  Calendar,
} from "lucide-react";
import clsx from "clsx";
import { getSellsyUrl } from "@/lib/sellsy-urls";

type Period = "week" | "month" | "year" | "all";

const PERIOD_LABELS: Record<Period, string> = {
  week: "Semaine",
  month: "Mois",
  year: "Année",
  all: "Tout",
};

function getPeriodStart(period: Period): Date | null {
  if (period === "all") return null;
  const now = new Date();
  if (period === "week") {
    const day = now.getDay();
    const diff = day === 0 ? 6 : day - 1;
    const start = new Date(now);
    start.setDate(start.getDate() - diff);
    start.setHours(0, 0, 0, 0);
    return start;
  }
  if (period === "month") return new Date(now.getFullYear(), now.getMonth(), 1);
  return new Date(now.getFullYear(), 0, 1);
}

interface Estimate {
  id: number;
  number?: string;
  reference?: string;
  subject?: string;
  status?: string;
  date?: string;
  created?: string;
  company_name?: string;
  contact?: { id: number; name?: string };
  company?: { id: number; name?: string };
  amounts?: { total?: string; total_excl_tax?: string };
  pdf_link?: string;
}

const PIPELINE_COLUMNS = [
  { key: "draft", label: "Brouillon", color: "border-gray-500" },
  { key: "sent", label: "Envoyé", color: "border-cockpit-info" },
  { key: "read", label: "Lu", color: "border-cockpit-warning" },
  { key: "accepted", label: "Accepté", color: "border-cockpit-success" },
  { key: "advanced", label: "Acompte", color: "border-blue-500" },
  { key: "refused", label: "Refusé", color: "border-red-500" },
  { key: "invoiced", label: "Facturé", color: "border-purple-500" },
  { key: "partialinvoiced", label: "Fact. partielle", color: "border-purple-400" },
  { key: "expired", label: "Expiré", color: "border-orange-500" },
];

// Sellsy API v2 status values exactes pour estimates :
// draft, sent, read, accepted, advanced, refused, cancelled, invoiced, partialinvoiced, expired
function classifyStatus(status: string | undefined): string {
  if (!status) return "draft";
  const s = status.toLowerCase().trim();
  // Match exact Sellsy statuses first
  const exactMap: Record<string, string> = {
    draft: "draft",
    sent: "sent",
    read: "read",
    accepted: "accepted",
    advanced: "advanced",
    refused: "refused",
    cancelled: "cancelled",
    invoiced: "invoiced",
    partialinvoiced: "partialinvoiced",
    expired: "expired",
  };
  if (exactMap[s]) return exactMap[s];
  // Fallback fuzzy match for edge cases
  if (s.includes("draft") || s.includes("brouillon")) return "draft";
  if (s.includes("sent") || s.includes("envoy")) return "sent";
  if (s.includes("read") || s.includes("lu")) return "read";
  if (s.includes("accept") || s.includes("won") || s.includes("valid")) return "accepted";
  if (s.includes("advanced") || s.includes("avanc")) return "advanced";
  if (s.includes("cancel") || s.includes("annul")) return "cancelled";
  if (s.includes("refus") || s.includes("lost") || s.includes("perdu")) return "refused";
  if (s.includes("partial")) return "partialinvoiced";
  if (s.includes("invoic") || s.includes("factur")) return "invoiced";
  if (s.includes("expir")) return "expired";
  return "draft";
}

export default function PipelinePage() {
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [period, setPeriod] = useState<Period>("all");

  const fetchEstimates = async (fresh = false) => {
    setRefreshing(true);
    setError(null);
    try {
      const res = await fetch(`/api/sellsy/estimates?limit=100${fresh ? "&fresh=true" : ""}`);
      if (!res.ok) {
        throw new Error(`Erreur API: ${res.status}`);
      }
      const data = await res.json();
      setEstimates(data.estimates || []);
    } catch (err) {
      console.error("Erreur chargement devis:", err);
      setError(err instanceof Error ? err.message : "Erreur lors du chargement des devis");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEstimates();
  }, []);

  // Exclure les annulés + filtrer par période
  const activeEstimates = useMemo(() => {
    const periodStart = getPeriodStart(period);
    return estimates
      .filter((e) => classifyStatus(e.status) !== "cancelled")
      .filter((e) => {
        if (!periodStart) return true;
        const d = new Date(e.date || e.created || "");
        return d >= periodStart;
      });
  }, [estimates, period]);

  const groupedEstimates = useMemo(() =>
    PIPELINE_COLUMNS.reduce(
      (acc, col) => {
        const colItems = activeEstimates
          .filter((e) => classifyStatus(e.status) === col.key)
          .sort((a, b) => {
            const da = new Date(a.date || a.created || "").getTime() || 0;
            const db = new Date(b.date || b.created || "").getTime() || 0;
            return sortOrder === "newest" ? db - da : da - db;
          });
        acc[col.key] = colItems;
        return acc;
      },
      {} as Record<string, Estimate[]>
    ),
    [activeEstimates, sortOrder]);

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-4 w-32 bg-gray-200 rounded mt-2 animate-pulse" />
          </div>
          <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse" />
        </div>
        <div className="overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex gap-4 min-w-[900px]">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex-1 min-w-[200px] rounded-xl bg-[#F5F6F7] border-t-4 border-gray-300">
                <div className="p-3 border-b border-gray-200">
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-16 bg-gray-200 rounded mt-2 animate-pulse" />
                </div>
                <div className="p-2 space-y-2">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className="bg-white rounded-lg border border-gray-200 p-3 space-y-2 animate-pulse">
                      <div className="h-4 w-full bg-gray-200 rounded" />
                      <div className="h-3 w-2/3 bg-gray-200 rounded" />
                      <div className="h-3 w-1/2 bg-gray-200 rounded" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-cockpit-heading mb-1">
              Pipeline Devis
            </h1>
            <p className="text-cockpit-secondary text-sm">
              {activeEstimates.length} devis Sellsy
            </p>
          </div>
          <button
            onClick={() => fetchEstimates(true)}
            disabled={refreshing}
            className="flex items-center justify-center gap-2 bg-cockpit-card border border-cockpit px-4 py-2.5 rounded-lg font-semibold hover:bg-cockpit-dark transition-colors disabled:opacity-50 text-sm"
          >
            {refreshing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Sync Sellsy
          </button>
        </div>

        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-400 mb-1">Erreur de chargement</h3>
            <p className="text-sm text-red-300">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-cockpit-heading mb-1">
            Pipeline Devis
          </h1>
          <p className="text-cockpit-secondary text-sm">
            {activeEstimates.length} devis Sellsy
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Period filter */}
          <div className="flex items-center gap-1 bg-cockpit-card border border-cockpit rounded-lg px-1 py-1">
            {(["week", "month", "year", "all"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={clsx(
                  "px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors",
                  period === p
                    ? "bg-cockpit-yellow text-gray-900"
                    : "text-cockpit-secondary hover:bg-cockpit-dark"
                )}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
          <button
            onClick={() => setSortOrder(s => s === "newest" ? "oldest" : "newest")}
            className="flex items-center gap-2 bg-cockpit-card border border-cockpit px-3 py-2.5 rounded-lg font-semibold hover:bg-cockpit-dark transition-colors text-sm"
            title={sortOrder === "newest" ? "Plus récents d'abord" : "Plus anciens d'abord"}
          >
            <ArrowUpDown className="w-4 h-4" />
            <span className="hidden sm:inline">{sortOrder === "newest" ? "Récents" : "Anciens"}</span>
          </button>
          <button
            onClick={() => fetchEstimates(true)}
            disabled={refreshing}
            className="flex items-center justify-center gap-2 bg-cockpit-card border border-cockpit px-4 py-2.5 rounded-lg font-semibold hover:bg-cockpit-dark transition-colors disabled:opacity-50 text-sm"
          >
            {refreshing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Sync Sellsy
          </button>
        </div>
      </div>

      {/* Kanban Board - horizontal scroll on mobile */}
      <div className="overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-4 min-w-[900px]">
          {PIPELINE_COLUMNS.map((col) => {
            const colEstimates = groupedEstimates[col.key] || [];
            const totalAmount = colEstimates.reduce(
              (sum, e) => sum + (Number(e.amounts?.total ?? "0") || 0),
              0
            );

            return (
              <div
                key={col.key}
                className={`flex-1 min-w-[200px] rounded-xl bg-cockpit-dark/50 border-t-4 ${col.color}`}
              >
                {/* Column header */}
                <div className="p-3 border-b border-cockpit">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-cockpit-heading">
                      {col.label}
                    </h3>
                    <span className="bg-cockpit-card text-cockpit-secondary text-xs font-semibold px-2 py-0.5 rounded-full">
                      {colEstimates.length}
                    </span>
                  </div>
                  <p className="text-xs text-cockpit-secondary mt-1">
                    {totalAmount.toLocaleString("fr-FR", {
                      style: "currency",
                      currency: "EUR",
                    })}
                  </p>
                </div>

                {/* Cards */}
                <div className="p-2 space-y-2 max-h-[60vh] overflow-y-auto">
                  {colEstimates.map((est) => (
                    <div
                      key={est.id}
                      className="bg-cockpit-card rounded-lg border border-cockpit p-3 hover:border-cockpit-info/40 transition-colors"
                    >
                      <p className="text-sm font-medium text-cockpit-primary truncate mb-1">
                        {est.subject || est.number || `Devis #${est.id}`}
                      </p>
                      {(est.company_name || est.company?.name) && (
                        <p className="text-xs text-cockpit-secondary truncate mb-1">
                          {est.company_name || est.company?.name}
                        </p>
                      )}
                      {(est.date || est.created) && (
                        <div className="flex items-center gap-1 text-xs text-cockpit-secondary mb-2">
                          <Calendar className="w-3 h-3" />
                          {new Date(est.date || est.created || "").toLocaleDateString("fr-FR")}
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-cockpit-heading">
                          <Euro className="w-3 h-3" />
                          <span className="text-xs font-semibold">
                            {(Number(est.amounts?.total ?? "0")).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {est.pdf_link && (
                            <a
                              href={est.pdf_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded hover:bg-cockpit-dark transition-colors"
                              title="Voir le PDF"
                            >
                              <FileText className="w-3.5 h-3.5 text-cockpit-info" />
                            </a>
                          )}
                          <a
                            href={getSellsyUrl('estimate', est.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded hover:bg-cockpit-dark transition-colors"
                            title="Ouvrir dans Sellsy"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-cockpit-secondary hover:text-cockpit-info" />
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                  {colEstimates.length === 0 && (
                    <p className="text-xs text-cockpit-secondary text-center py-4">
                      Aucun devis
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
