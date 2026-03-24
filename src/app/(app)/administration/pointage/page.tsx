"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/toast";
import {
  Clock,
  Loader2,
  CalendarDays,
  Timer,
  LogIn,
  LogOut,
  Coffee,
  Play,
  CheckCircle,
  Pencil,
  History,
} from "lucide-react";
import clsx from "clsx";
import {
  getPointageEtat,
  POINTAGE_ETATS,
  formatHeure,
  formatDuree,
  type PointageEtat,
} from "@/data/pointage-config";

// ============================================================================
// TYPES
// ============================================================================

interface PointageAujourdhui {
  id?: string;
  arrivee: string | null;
  debutPause: string | null;
  finPause: string | null;
  depart: string | null;
  heuresTravaillees?: number;
  heuresSupp?: number;
  correction?: boolean;
}

interface PointageHistorique {
  id: string;
  date: string;
  arrivee: string | null;
  debutPause: string | null;
  finPause: string | null;
  depart: string | null;
  heuresTravaillees: number | null;
  heuresSupp: number | null;
  correction: boolean;
}

interface HistoriqueResponse {
  pointages: PointageHistorique[];
  totalMois: {
    heuresTravaillees: number;
    heuresSupp: number;
  };
}

// ============================================================================
// CONSTANTS
// ============================================================================

const JOURS_SEMAINE = [
  "Dimanche",
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
];

const MOIS = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

// ============================================================================
// HELPERS
// ============================================================================

function formatDateLongue(date: Date): string {
  const jour = JOURS_SEMAINE[date.getDay()];
  const numero = date.getDate();
  const mois = MOIS[date.getMonth()];
  const annee = date.getFullYear();
  return `${jour} ${numero} ${mois} ${annee}`;
}

function formatDateCourte(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatHeuresDecimales(heures: number | null): string {
  if (heures === null || heures === undefined) return "\u2014";
  const h = Math.floor(heures);
  const m = Math.round((heures - h) * 60);
  return `${h}h${String(m).padStart(2, "0")}`;
}

// ============================================================================
// BUTTON CONFIG
// ============================================================================

const BUTTON_STYLES: Record<
  PointageEtat,
  { className: string; icon: React.ElementType }
> = {
  NON_ARRIVE: {
    className: "bg-amber-500 hover:bg-amber-600 text-white shadow-lg",
    icon: LogIn,
  },
  ARRIVE: {
    className:
      "border-2 border-gray-300 text-gray-700 hover:bg-gray-50 bg-white",
    icon: Coffee,
  },
  EN_PAUSE: {
    className:
      "bg-gradient-to-r from-[#D15F12] to-[#A04A0E] hover:from-[#C05510] hover:to-[#8F400C] text-white shadow-lg",
    icon: Play,
  },
  RETOUR_PAUSE: {
    className:
      "border-2 border-gray-300 text-gray-700 hover:bg-gray-50 bg-white",
    icon: LogOut,
  },
  JOURNEE_FINIE: {
    className: "bg-green-500 text-white cursor-default",
    icon: CheckCircle,
  },
};

// ============================================================================
// SKELETON COMPONENTS
// ============================================================================

function SkeletonButton() {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="h-[56px] rounded-xl bg-cockpit-card border border-cockpit animate-pulse" />
    </div>
  );
}

function SkeletonSummary() {
  return (
    <div className="bg-cockpit-card border border-cockpit rounded-card p-4 space-y-3 animate-pulse">
      <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
      <div className="flex gap-6">
        <div className="h-5 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-5 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-5 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    </div>
  );
}

function SkeletonHistory() {
  return (
    <div className="bg-cockpit-card border border-cockpit rounded-card p-4 space-y-3 animate-pulse">
      <div className="h-5 w-40 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
      ))}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function PointagePage() {
  const { addToast } = useToast();

  // State
  const [currentTime, setCurrentTime] = useState(new Date());
  const [pointage, setPointage] = useState<PointageAujourdhui | null>(null);
  const [etat, setEtat] = useState<PointageEtat>("NON_ARRIVE");
  const [loadingToday, setLoadingToday] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [historique, setHistorique] = useState<PointageHistorique[]>([]);
  const [totalMois, setTotalMois] = useState<{
    heuresTravaillees: number;
    heuresSupp: number;
  } | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // ----------------------------------
  // Real-time clock
  // ----------------------------------
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // ----------------------------------
  // Fetch today's pointage
  // ----------------------------------
  const fetchAujourdhui = useCallback(async () => {
    try {
      setLoadingToday(true);
      const res = await fetch("/api/pointage/aujourd-hui");
      if (!res.ok) throw new Error("Erreur chargement");
      const data = await res.json();
      setPointage(data);
      setEtat(getPointageEtat(data));
    } catch {
      addToast("Impossible de charger le pointage", "error");
    } finally {
      setLoadingToday(false);
    }
  }, [addToast]);

  // ----------------------------------
  // Fetch history
  // ----------------------------------
  const fetchHistorique = useCallback(async () => {
    try {
      setLoadingHistory(true);
      const res = await fetch("/api/pointage/historique?jours=10");
      if (!res.ok) throw new Error("Erreur chargement");
      const data: HistoriqueResponse = await res.json();
      setHistorique(data.pointages || []);
      setTotalMois(data.totalMois || null);
    } catch {
      addToast("Impossible de charger l'historique", "error");
    } finally {
      setLoadingHistory(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchAujourdhui();
    fetchHistorique();
  }, [fetchAujourdhui, fetchHistorique]);

  // ----------------------------------
  // Action handler
  // ----------------------------------
  const handleAction = async () => {
    const config = POINTAGE_ETATS[etat];
    if (config.disabled || !config.action) return;

    try {
      setActionLoading(true);
      const res = await fetch("/api/pointage/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: config.action }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Erreur lors du pointage");
      }

      const updated = await res.json();
      setPointage(updated);
      setEtat(getPointageEtat(updated));
      addToast("Pointage enregistré", "success");

      // Refresh history if day is complete
      if (getPointageEtat(updated) === "JOURNEE_FINIE") {
        fetchHistorique();
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Erreur lors du pointage";
      addToast(message, "error");
    } finally {
      setActionLoading(false);
    }
  };

  // ----------------------------------
  // Computed
  // ----------------------------------
  const buttonConfig = POINTAGE_ETATS[etat];
  const buttonStyle = BUTTON_STYLES[etat];
  const ButtonIcon = buttonStyle.icon;

  const heureFormatee = currentTime.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "Indian/Reunion",
  });

  return (
    <div className="space-y-6 pb-8">
      {/* ================================================================ */}
      {/* HEADER */}
      {/* ================================================================ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-cockpit-heading flex items-center gap-2">
            <Clock className="w-7 h-7 text-[#D15F12]" />
            Mon Pointage
          </h1>
          <p className="text-cockpit-secondary text-sm mt-1">
            {formatDateLongue(currentTime)}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-cockpit-card border border-cockpit rounded-card px-4 py-2 shadow-cockpit-lg">
          <Timer className="w-5 h-5 text-[#D15F12]" />
          <span className="text-xl font-mono font-bold text-cockpit-heading tabular-nums">
            {heureFormatee}
          </span>
        </div>
      </div>

      {/* ================================================================ */}
      {/* MAIN ACTION BUTTON */}
      {/* ================================================================ */}
      <div className="bg-cockpit-card border border-cockpit rounded-card p-6 shadow-cockpit-lg">
        <div className="text-center mb-4">
          <p className="text-cockpit-secondary text-sm">
            {etat === "JOURNEE_FINIE"
              ? "Bonne fin de journée !"
              : "Cliquez pour enregistrer votre pointage"}
          </p>
        </div>

        {loadingToday ? (
          <SkeletonButton />
        ) : (
          <button
            onClick={handleAction}
            disabled={buttonConfig.disabled || actionLoading}
            className={clsx(
              "w-full max-w-md mx-auto flex items-center justify-center gap-3",
              "min-h-[56px] rounded-xl text-lg font-bold",
              "transition-all duration-200",
              "disabled:opacity-80",
              buttonStyle.className
            )}
          >
            {actionLoading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <ButtonIcon className="w-6 h-6" />
            )}
            <span>{actionLoading ? "En cours..." : buttonConfig.label}</span>
          </button>
        )}
      </div>

      {/* ================================================================ */}
      {/* TODAY'S SUMMARY */}
      {/* ================================================================ */}
      {loadingToday ? (
        <SkeletonSummary />
      ) : (
        pointage && (
          <div className="bg-cockpit-card border border-cockpit rounded-card p-5 shadow-cockpit-lg">
            <h2 className="text-sm font-semibold text-cockpit-heading mb-3 flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-[#D15F12]" />
              Résumé du jour
            </h2>

            {/* Timestamps */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <div className="flex items-center gap-1.5">
                <LogIn className="w-4 h-4 text-green-500" />
                <span className="text-cockpit-secondary">Arrivée</span>
                <span className="font-semibold text-cockpit-primary">
                  {formatHeure(pointage.arrivee)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Coffee className="w-4 h-4 text-amber-500" />
                <span className="text-cockpit-secondary">Pause</span>
                <span className="font-semibold text-cockpit-primary">
                  {pointage.debutPause
                    ? `${formatHeure(pointage.debutPause)} - ${formatHeure(pointage.finPause)}`
                    : "\u2014"}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <LogOut className="w-4 h-4 text-red-500" />
                <span className="text-cockpit-secondary">Départ</span>
                <span className="font-semibold text-cockpit-primary">
                  {formatHeure(pointage.depart)}
                </span>
              </div>
            </div>

            {/* Worked hours (shown when day is complete) */}
            {etat === "JOURNEE_FINIE" &&
              pointage.heuresTravaillees !== undefined && (
                <div className="mt-3 pt-3 border-t border-cockpit flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  <span className="text-cockpit-primary font-semibold">
                    Travaillé :{" "}
                    {formatHeuresDecimales(pointage.heuresTravaillees)}
                  </span>
                  {pointage.heuresSupp !== undefined &&
                    pointage.heuresSupp !== 0 && (
                      <span
                        className={clsx(
                          "font-semibold",
                          pointage.heuresSupp > 0
                            ? "text-green-600"
                            : "text-red-500"
                        )}
                      >
                        Supp : {formatDuree(pointage.heuresSupp)}
                      </span>
                    )}
                </div>
              )}
          </div>
        )
      )}

      {/* ================================================================ */}
      {/* HISTORY */}
      {/* ================================================================ */}
      <div className="bg-cockpit-card border border-cockpit rounded-card p-5 shadow-cockpit-lg">
        <h2 className="text-sm font-semibold text-cockpit-heading mb-4 flex items-center gap-2">
          <History className="w-4 h-4 text-[#D15F12]" />
          Historique (10 derniers jours)
        </h2>

        {loadingHistory ? (
          <SkeletonHistory />
        ) : historique.length === 0 ? (
          <p className="text-cockpit-secondary text-sm text-center py-6">
            Aucun pointage récent
          </p>
        ) : (
          <>
            {/* ---- DESKTOP TABLE ---- */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-cockpit text-cockpit-secondary">
                    <th className="text-left py-2 px-3 font-medium">Date</th>
                    <th className="text-left py-2 px-3 font-medium">Arrivée</th>
                    <th className="text-left py-2 px-3 font-medium">Départ</th>
                    <th className="text-left py-2 px-3 font-medium">Heures</th>
                    <th className="text-left py-2 px-3 font-medium">Supp</th>
                  </tr>
                </thead>
                <tbody>
                  {historique.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-cockpit/50 hover:bg-cockpit-dark/30 transition-colors"
                    >
                      <td className="py-2.5 px-3 text-cockpit-primary font-medium whitespace-nowrap">
                        {formatDateCourte(p.date)}
                        {p.correction && (
                          <Pencil className="inline w-3 h-3 ml-1.5 text-amber-500" />
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-cockpit-primary">
                        {formatHeure(p.arrivee)}
                      </td>
                      <td className="py-2.5 px-3 text-cockpit-primary">
                        {formatHeure(p.depart)}
                      </td>
                      <td className="py-2.5 px-3 text-cockpit-primary font-medium">
                        {formatHeuresDecimales(p.heuresTravaillees)}
                      </td>
                      <td
                        className={clsx(
                          "py-2.5 px-3 font-medium",
                          p.heuresSupp !== null && p.heuresSupp > 0
                            ? "text-green-600"
                            : p.heuresSupp !== null && p.heuresSupp < 0
                              ? "text-red-500"
                              : "text-cockpit-secondary"
                        )}
                      >
                        {p.heuresSupp !== null ? formatDuree(p.heuresSupp) : "\u2014"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ---- MOBILE CARDS ---- */}
            <div className="md:hidden space-y-3">
              {historique.map((p) => (
                <div
                  key={p.id}
                  className="bg-cockpit-dark/30 border border-cockpit/50 rounded-lg p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-cockpit-heading font-semibold text-sm">
                      {formatDateCourte(p.date)}
                      {p.correction && (
                        <Pencil className="inline w-3 h-3 ml-1.5 text-amber-500" />
                      )}
                    </span>
                    <span
                      className={clsx(
                        "text-sm font-bold",
                        p.heuresSupp !== null && p.heuresSupp > 0
                          ? "text-green-600"
                          : p.heuresSupp !== null && p.heuresSupp < 0
                            ? "text-red-500"
                            : "text-cockpit-secondary"
                      )}
                    >
                      {p.heuresSupp !== null ? formatDuree(p.heuresSupp) : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-cockpit-secondary">
                    <span>
                      <LogIn className="inline w-3 h-3 mr-1 text-green-500" />
                      {formatHeure(p.arrivee)}
                    </span>
                    <span>
                      <LogOut className="inline w-3 h-3 mr-1 text-red-500" />
                      {formatHeure(p.depart)}
                    </span>
                    <span className="ml-auto font-semibold text-cockpit-primary">
                      {formatHeuresDecimales(p.heuresTravaillees)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* ---- MONTH TOTALS ---- */}
            {totalMois && (
              <div className="mt-4 pt-3 border-t border-cockpit flex flex-wrap gap-x-6 gap-y-1 text-sm">
                <span className="text-cockpit-secondary">Total du mois :</span>
                <span className="text-cockpit-heading font-bold">
                  {formatHeuresDecimales(totalMois.heuresTravaillees)}
                </span>
                {totalMois.heuresSupp != null && totalMois.heuresSupp !== 0 && (
                  <span
                    className={clsx(
                      "font-bold",
                      totalMois.heuresSupp > 0
                        ? "text-green-600"
                        : "text-red-500"
                    )}
                  >
                    Supp : {formatDuree(totalMois.heuresSupp)}
                  </span>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
