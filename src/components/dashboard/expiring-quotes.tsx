"use client";

import { AlertTriangle, CheckCircle, ExternalLink } from "lucide-react";
import clsx from "clsx";
import { getSellsyUrl } from "@/lib/sellsy-urls";

interface EstimateRow {
  id: number;
  number?: string;
  subject?: string;
  status?: string;
  date?: string;
  created?: string;
  company_name?: string;
  expiry_date?: string;
  amounts?: {
    total?: string;
    total_excl_tax?: string;
    total_raw_excl_tax?: string;
  };
  pdf_link?: string;
  owner?: { id: number; type: string };
  assigned_staff_id?: number;
}

function formatCurrency(amount: number): string {
  return amount.toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function getAmount(row: EstimateRow): number {
  if (!row.amounts) return 0;
  const a = row.amounts as Record<string, any>;
  const val =
    a.total ?? a.total_incl_tax ?? a.total_excl_tax ?? a.total_raw_excl_tax ?? "0";
  return isNaN(Number(val)) ? 0 : Number(val);
}

function getDaysUntilExpiry(expiryDate: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function ExpiringQuotes({ estimates, staffMap = new Map() }: { estimates: EstimateRow[]; staffMap?: Map<number, string> }) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // Filtrer : expiry_date dans les 7 prochains jours, pas annulé/expiré/accepté
  const excludedStatuses = ["cancelled", "annulé", "annule", "expired", "accepted", "invoiced", "refused", "refusé", "refuse"];
  const expiring = estimates
    .filter((e) => {
      if (!e.expiry_date) return false;
      const status = (e.status || "").toLowerCase();
      if (excludedStatuses.some((s) => status.includes(s))) return false;
      const days = getDaysUntilExpiry(e.expiry_date);
      return days >= 0 && days <= 7;
    })
    .sort((a, b) => getDaysUntilExpiry(a.expiry_date!) - getDaysUntilExpiry(b.expiry_date!));

  return (
    <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={clsx(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              expiring.length > 0
                ? "bg-cockpit-warning/10"
                : "bg-cockpit-success/10"
            )}
          >
            {expiring.length > 0 ? (
              <AlertTriangle className="w-5 h-5 text-cockpit-warning" />
            ) : (
              <CheckCircle className="w-5 h-5 text-cockpit-success" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-cockpit-heading">
              Devis à relancer
            </h3>
            <p className="text-xs text-cockpit-secondary">
              Expirent dans les 7 prochains jours
            </p>
          </div>
        </div>
        {expiring.length > 0 && (
          <span className="text-xs bg-cockpit-warning/10 text-cockpit-warning px-2 py-1 rounded-full font-semibold">
            {expiring.length} devis
          </span>
        )}
      </div>

      {expiring.length === 0 ? (
        <p className="text-sm text-cockpit-success font-medium text-center py-3">
          Aucun devis à relancer
        </p>
      ) : (
        <div className="space-y-2">
          {expiring.slice(0, 8).map((est) => {
            const days = getDaysUntilExpiry(est.expiry_date!);
            return (
              <a
                key={est.id}
                href={getSellsyUrl('estimate', est.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-lg bg-cockpit-dark/50 border border-cockpit hover:border-cockpit-warning/40 transition-colors block"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-cockpit-primary truncate">
                    {est.number || `Devis #${est.id}`}
                  </p>
                  <p className="text-xs text-cockpit-secondary truncate">
                    {est.company_name || "—"}
                  </p>
                  {(() => {
                    const ownerId = est.owner?.id || est.assigned_staff_id;
                    const ownerName = ownerId ? staffMap.get(ownerId) : undefined;
                    return ownerName ? (
                      <p className="text-[10px] text-cockpit-info mt-0.5">
                        À relancer par {ownerName}
                      </p>
                    ) : null;
                  })()}
                </div>
                <div className="flex items-center gap-3 ml-3">
                  <span className="text-sm font-semibold text-cockpit-heading whitespace-nowrap">
                    {formatCurrency(getAmount(est))}
                  </span>
                  <span
                    className={clsx(
                      "text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap",
                      days <= 1 && "bg-red-100 text-red-600",
                      days >= 2 && days <= 4 && "bg-orange-100 text-orange-600",
                      days >= 5 && "bg-emerald-100 text-emerald-600"
                    )}
                  >
                    {days === 0
                      ? "Aujourd'hui"
                      : days === 1
                        ? "Demain"
                        : `${days}j`}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-cockpit-secondary" />
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
