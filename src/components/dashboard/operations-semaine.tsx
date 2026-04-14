"use client";

import { useEffect, useState } from "react";
import { Sparkles, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";

interface OpSemaine {
  id: string;
  date: string;
  titre: string;
  type: string;
  statut: string;
  canal: { nom: string; couleur: string | null } | null;
}

const TYPE_LABELS: Record<string, string> = {
  POST_FACEBOOK: "Post FB",
  POST_INSTAGRAM: "Post IG",
  CAMPAGNE_META_ADS: "Meta Ads",
  CAMPAGNE_GOOGLE_ADS: "Google Ads",
  NEWSLETTER: "Newsletter",
  SMS: "SMS",
  CATALOGUE: "Catalogue",
  PLV: "PLV",
  EVENEMENT: "Événement",
  ARTICLE_BLOG: "Blog",
  AUTRE: "Autre",
};

const TYPE_COLORS: Record<string, string> = {
  POST_FACEBOOK: "#4267B2",
  POST_INSTAGRAM: "#E1306C",
  CAMPAGNE_META_ADS: "#1877F2",
  CAMPAGNE_GOOGLE_ADS: "#34A853",
  NEWSLETTER: "#0B996E",
  SMS: "#8B5CF6",
  CATALOGUE: "#0EA5E9",
  PLV: "#C2410C",
  EVENEMENT: "#F59E0B",
  ARTICLE_BLOG: "#6366F1",
  AUTRE: "#6B7280",
};

const STATUT_COLORS: Record<string, string> = {
  BROUILLON: "bg-cockpit-dark text-cockpit-secondary",
  PLANIFIE: "bg-blue-500/10 text-blue-400",
  EN_COURS: "bg-amber-500/10 text-amber-400",
  TERMINE: "bg-emerald-500/10 text-emerald-400",
};

const STATUT_LABELS: Record<string, string> = {
  BROUILLON: "Brouillon",
  PLANIFIE: "Planifié",
  EN_COURS: "En cours",
  TERMINE: "Terminé",
};

export function OperationsSemaineWidget() {
  const [operations, setOperations] = useState<OpSemaine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/marketing/operations/semaine")
      .then((r) => r.json())
      .then((json) => setOperations(json.operations || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-cockpit-heading flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[var(--color-active)]" />
          Opérations de la semaine
        </h3>
        <Link
          href="/marketing/operations"
          className="text-xs text-[var(--color-active)] hover:underline flex items-center gap-1"
        >
          Tout voir <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-cockpit-secondary" />
        </div>
      ) : operations.length === 0 ? (
        <p className="text-xs text-cockpit-secondary text-center py-4">
          Aucune opération cette semaine
        </p>
      ) : (
        <div className="space-y-2">
          {operations.slice(0, 6).map((op) => (
            <div
              key={op.id}
              className="flex items-center gap-2.5 p-2.5 bg-cockpit-dark rounded-lg"
            >
              {/* Color dot */}
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: TYPE_COLORS[op.type] || "#6B7280" }}
              />

              {/* Date */}
              <span className="text-[10px] text-cockpit-secondary font-medium w-12 flex-shrink-0">
                {new Date(op.date).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "short",
                })}
              </span>

              {/* Titre */}
              <span className="text-xs text-cockpit-primary truncate flex-1 font-medium">
                {op.titre}
              </span>

              {/* Badge type */}
              <span
                className="text-[9px] px-1.5 py-0.5 rounded-full text-white font-medium flex-shrink-0 hidden sm:inline"
                style={{ backgroundColor: TYPE_COLORS[op.type] || "#6B7280" }}
              >
                {TYPE_LABELS[op.type] || op.type}
              </span>

              {/* Statut */}
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${STATUT_COLORS[op.statut] || ""}`}
              >
                {STATUT_LABELS[op.statut] || op.statut}
              </span>
            </div>
          ))}
          {operations.length > 6 && (
            <p className="text-[10px] text-cockpit-secondary text-center pt-1">
              + {operations.length - 6} autre{operations.length - 6 > 1 ? "s" : ""}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
