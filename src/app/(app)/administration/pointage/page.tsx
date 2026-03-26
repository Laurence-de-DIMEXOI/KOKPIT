"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
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
  Users,
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

interface DelegueInfo {
  id: string;
  nom: string;
  prenom: string;
  pointage: PointageAujourdhui | null;
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
      "text-white hover:opacity-90 shadow-lg [background:linear-gradient(135deg,var(--color-active),#FEEB9C)]",
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
  const [cafeMessage, setCafeMessage] = useState<string | null>(null);
  const [historique, setHistorique] = useState<PointageHistorique[]>([]);
  const [totalMois, setTotalMois] = useState<{
    heuresTravaillees: number;
    heuresSupp: number;
  } | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [delegues, setDelegues] = useState<DelegueInfo[]>([]);
  const [soldeHeures, setSoldeHeures] = useState(0);
  const [recupDispo, setRecupDispo] = useState(false);
  const [meteo, setMeteo] = useState<{ temp: number; icon: string } | null>(null);

  // ----------------------------------
  // Real-time clock
  // ----------------------------------
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // ----------------------------------
  // Météo La Réunion (Open-Meteo, gratuit)
  // ----------------------------------
  useEffect(() => {
    fetch("https://api.open-meteo.com/v1/forecast?latitude=-21.34&longitude=55.48&current=temperature_2m,weather_code&timezone=Indian%2FReunion")
      .then((r) => r.json())
      .then((data) => {
        const temp = Math.round(data.current?.temperature_2m ?? 0);
        const code = data.current?.weather_code ?? 0;
        const icon = code <= 1 ? "☀️" : code <= 3 ? "⛅" : code <= 48 ? "🌫️" : code <= 67 ? "🌧️" : code <= 77 ? "❄️" : "⛈️";
        setMeteo({ temp, icon });
      })
      .catch(() => {});
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
      setPointage(data.pointage || data);
      setEtat(getPointageEtat(data.pointage || data));
      setDelegues(data.delegues || []);
      setSoldeHeures(data.soldeHeures ?? 0);
      setRecupDispo(data.recupDispo ?? false);
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
  // Action pour un délégué (ex: Michelle pointe pour Georget)
  const handleDelegueAction = async (delegueId: string, deleguePointage: PointageAujourdhui | null) => {
    const delegueEtat = getPointageEtat(deleguePointage);
    const config = POINTAGE_ETATS[delegueEtat];
    if (config.disabled || !config.action) return;

    try {
      setActionLoading(true);
      const res = await fetch("/api/pointage/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: config.action, pourUserId: delegueId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Erreur");
      }
      addToast("Pointage délégué enregistré", "success");
      fetchAujourdhui();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur";
      addToast(message, "error");
    } finally {
      setActionLoading(false);
    }
  };

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

      // Popup café si c'est la semaine de l'utilisateur
      if (updated.cafe?.message) {
        setCafeMessage(updated.cafe.message);
      }

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
            <Clock className="w-7 h-7 text-[var(--color-active)]" />
            Mon Pointage
          </h1>
          <p className="text-cockpit-secondary text-sm mt-1">
            {formatDateLongue(currentTime)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {meteo && (
            <div className="flex items-center gap-1.5 bg-cockpit-card border border-cockpit rounded-card px-3 py-2 shadow-cockpit-lg">
              <span className="text-lg">{meteo.icon}</span>
              <span className="text-sm font-semibold text-cockpit-heading">{meteo.temp}°C</span>
            </div>
          )}
          <div className="flex items-center gap-2 bg-cockpit-card border border-cockpit rounded-card px-4 py-2 shadow-cockpit-lg">
            <Timer className="w-5 h-5 text-[var(--color-active)]" />
            <span className="text-xl font-mono font-bold text-cockpit-heading tabular-nums">
              {heureFormatee}
            </span>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* SOLDE HEURES */}
      {/* ================================================================ */}
      <div className="flex items-center gap-3">
        <div className={clsx(
          "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border",
          soldeHeures >= 0 ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"
        )}>
          <span>Solde heures :</span>
          <span className="font-bold">{formatDuree(soldeHeures)}</span>
        </div>
        {recupDispo && (
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-amber-50 border border-amber-200 text-amber-700">
            <span>🎉</span>
            <span>Récup dispo !</span>
          </div>
        )}
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
              <CalendarDays className="w-4 h-4 text-[var(--color-active)]" />
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
      {/* DELEGUES — Pointer pour quelqu'un d'autre */}
      {/* ================================================================ */}
      {delegues.length > 0 && (
        <div className="bg-cockpit-card border border-cockpit rounded-card p-5 shadow-cockpit-lg">
          <h2 className="text-sm font-semibold text-cockpit-heading mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-[var(--color-active)]" />
            Pointer pour un collaborateur
          </h2>
          <div className="space-y-3">
            {delegues.map((d) => {
              const dEtat = getPointageEtat(d.pointage);
              const dConfig = POINTAGE_ETATS[dEtat];
              return (
                <div key={d.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-cockpit-dark rounded-xl border border-cockpit/50">
                  <div className="flex-1">
                    <p className="text-cockpit-heading font-medium text-sm">{d.prenom} {d.nom}</p>
                    <p className="text-cockpit-secondary text-xs">
                      {d.pointage?.arrivee ? `Arrivée ${formatHeure(d.pointage.arrivee)}` : "Pas encore arrivé"}
                      {d.pointage?.depart && ` · Départ ${formatHeure(d.pointage.depart)}`}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelegueAction(d.id, d.pointage)}
                    disabled={dConfig.disabled || actionLoading}
                    className={clsx(
                      "px-4 py-2.5 rounded-lg text-sm font-semibold transition-all min-h-[44px]",
                      dConfig.disabled
                        ? "bg-green-500/20 text-green-600 cursor-default"
                        : dEtat === "NON_ARRIVE"
                          ? "bg-amber-500 text-white hover:bg-amber-600"
                          : dEtat === "EN_PAUSE"
                            ? "bg-[var(--color-active)] text-white hover:bg-[var(--color-active)]"
                            : "border-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : dConfig.label}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* HISTORY */}
      {/* ================================================================ */}
      <div className="bg-cockpit-card border border-cockpit rounded-card p-5 shadow-cockpit-lg">
        <h2 className="text-sm font-semibold text-cockpit-heading mb-4 flex items-center gap-2">
          <History className="w-4 h-4 text-[var(--color-active)]" />
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

      {/* ================================================================ */}
      {/* POPUP CAFÉ */}
      {/* ================================================================ */}
      {cafeMessage && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setCafeMessage(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-amber-600 to-amber-800 p-6 text-center">
              <span className="text-5xl block mb-2">☕</span>
              <h3 className="text-white text-xl font-bold">Semaine Café !</h3>
            </div>
            <div className="p-6 text-center">
              <p className="text-gray-700 text-sm leading-relaxed">{cafeMessage}</p>
              <button
                onClick={() => setCafeMessage(null)}
                className="mt-5 px-6 py-2.5 bg-amber-600 text-white rounded-lg font-semibold text-sm hover:bg-amber-700 transition min-h-[44px]"
              >
                Compris, chef ! ☕
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
