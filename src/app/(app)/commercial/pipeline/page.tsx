"use client";

import { useEffect, useState } from "react";
import {
  FileText,
  RefreshCw,
  Loader2,
  ChevronRight,
  Euro,
} from "lucide-react";

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

  const fetchEstimates = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/sellsy/estimates?limit=500");
      const data = await res.json();
      setEstimates(data.estimates || []);
    } catch (error) {
      console.error("Erreur chargement devis:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEstimates();
  }, []);

  // Exclure les annulés du pipeline
  const activeEstimates = estimates.filter(
    (e) => classifyStatus(e.status) !== "cancelled"
  );

  const groupedEstimates = PIPELINE_COLUMNS.reduce(
    (acc, col) => {
      acc[col.key] = activeEstimates.filter(
        (e) => classifyStatus(e.status) === col.key
      );
      return acc;
    },
    {} as Record<string, Estimate[]>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-cockpit-info" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
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
          onClick={fetchEstimates}
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
                      className="bg-cockpit-card rounded-lg border border-cockpit p-3 hover:border-cockpit-info/40 transition-colors cursor-pointer"
                      onClick={() => est.pdf_link && window.open(est.pdf_link, '_blank')}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-sm font-medium text-cockpit-primary truncate flex-1">
                          {est.subject || est.number || `Devis #${est.id}`}
                        </p>
                        <ChevronRight className="w-4 h-4 text-cockpit-secondary flex-shrink-0 ml-1" />
                      </div>
                      {(est.company_name || est.company?.name) && (
                        <p className="text-xs text-cockpit-secondary truncate mb-2">
                          {est.company_name || est.company?.name}
                        </p>
                      )}
                      <div className="flex items-center gap-1 text-cockpit-heading">
                        <Euro className="w-3 h-3" />
                        <span className="text-xs font-semibold">
                          {(Number(est.amounts?.total ?? "0")).toLocaleString(
                            "fr-FR",
                            { minimumFractionDigits: 2 }
                          )}
                        </span>
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
