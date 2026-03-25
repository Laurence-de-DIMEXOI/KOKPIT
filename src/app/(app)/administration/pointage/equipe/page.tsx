"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  Download,
  Clock,
  Users,
  CalendarDays,
  Loader2,
  X,
} from "lucide-react";
import {
  formatHeure,
  formatDuree,
  getStatutBadge,
} from "@/data/pointage-config";

// ============================================================================
// TYPES
// ============================================================================

interface PointageUser {
  nom: string;
  prenom: string;
  couleur: string | null;
}

interface PointageEquipe {
  id: string;
  userId: string;
  arrivee: string | null;
  debutPause: string | null;
  finPause: string | null;
  depart: string | null;
  heuresTravaillees: number | null;
  user: PointageUser;
}

interface RecapMensuel {
  userId: string;
  user: PointageUser;
  joursTravailles: number;
  joursOuvres: number;
  heuresTotales: number;
  heuresSupp: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const ADMIN_GRADIENT = {
  from: "var(--color-active)",
  to: "#FEEB9C",
  shadow: "var(--color-active-border)",
};

const MONTH_NAMES = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

const TABS = [
  { id: "today", label: "Aujourd'hui", icon: Clock },
  { id: "recap", label: "Récap mensuel", icon: CalendarDays },
] as const;

type TabId = (typeof TABS)[number]["id"];

// ============================================================================
// HELPERS
// ============================================================================

function formatDateFR(d: Date): string {
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toMonthStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

// ============================================================================
// SKELETON COMPONENTS
// ============================================================================

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: 8 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-white/10 rounded w-16" />
        </td>
      ))}
    </tr>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-cockpit-card border border-cockpit rounded-card p-4 animate-pulse space-y-3">
      <div className="h-5 bg-white/10 rounded w-32" />
      <div className="grid grid-cols-2 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-4 bg-white/10 rounded w-20" />
        ))}
      </div>
      <div className="h-4 bg-white/10 rounded w-24" />
    </div>
  );
}

function SkeletonRecapRow() {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-white/10 rounded w-20" />
        </td>
      ))}
    </tr>
  );
}

// ============================================================================
// CORRECTION MODAL
// ============================================================================

interface CorrectionModalProps {
  pointage: PointageEquipe;
  date: string;
  onClose: () => void;
  onSuccess: () => void;
}

function CorrectionModal({ pointage, date, onClose, onSuccess }: CorrectionModalProps) {
  const { addToast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const extractTime = (val: string | null): string => {
    if (!val) return "";
    const d = new Date(val);
    return d.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Indian/Reunion",
      hour12: false,
    });
  };

  const [arrivee, setArrivee] = useState(extractTime(pointage.arrivee));
  const [debutPause, setDebutPause] = useState(extractTime(pointage.debutPause));
  const [finPause, setFinPause] = useState(extractTime(pointage.finPause));
  const [depart, setDepart] = useState(extractTime(pointage.depart));
  const [note, setNote] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/pointage/corriger/${pointage.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          arrivee: arrivee || null,
          debutPause: debutPause || null,
          finPause: finPause || null,
          depart: depart || null,
          note: note.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Erreur lors de la correction");
      }

      addToast("Correction enregistrée avec succès", "success");
      onSuccess();
      onClose();
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : "Erreur lors de la correction",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative bg-cockpit-card border border-cockpit rounded-card shadow-cockpit-lg w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 rounded-t-card"
          style={{
            background: `linear-gradient(135deg, ${ADMIN_GRADIENT.from} 0%, ${ADMIN_GRADIENT.to} 100%)`,
          }}
        >
          <div>
            <h3 className="text-white font-semibold text-lg">
              Corriger le pointage
            </h3>
            <p className="text-white/70 text-sm">
              {pointage.user.prenom} {pointage.user.nom} — {date}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-cockpit-secondary mb-1">
                Arrivée
              </label>
              <input
                type="time"
                value={arrivee}
                onChange={(e) => setArrivee(e.target.value)}
                className="w-full bg-cockpit-dark border border-cockpit rounded-lg px-3 py-2 text-cockpit-primary text-sm focus:outline-none focus:border-[var(--color-active)] transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm text-cockpit-secondary mb-1">
                Début pause
              </label>
              <input
                type="time"
                value={debutPause}
                onChange={(e) => setDebutPause(e.target.value)}
                className="w-full bg-cockpit-dark border border-cockpit rounded-lg px-3 py-2 text-cockpit-primary text-sm focus:outline-none focus:border-[var(--color-active)] transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm text-cockpit-secondary mb-1">
                Fin pause
              </label>
              <input
                type="time"
                value={finPause}
                onChange={(e) => setFinPause(e.target.value)}
                className="w-full bg-cockpit-dark border border-cockpit rounded-lg px-3 py-2 text-cockpit-primary text-sm focus:outline-none focus:border-[var(--color-active)] transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm text-cockpit-secondary mb-1">
                Départ
              </label>
              <input
                type="time"
                value={depart}
                onChange={(e) => setDepart(e.target.value)}
                className="w-full bg-cockpit-dark border border-cockpit rounded-lg px-3 py-2 text-cockpit-primary text-sm focus:outline-none focus:border-[var(--color-active)] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-cockpit-secondary mb-1">
              Note de correction <span className="text-red-400">*</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              required
              rows={3}
              placeholder="Motif de la correction..."
              className="w-full bg-cockpit-dark border border-cockpit rounded-lg px-3 py-2 text-cockpit-primary text-sm focus:outline-none focus:border-[var(--color-active)] transition-colors resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-cockpit text-cockpit-secondary hover:bg-white/5 transition-colors text-sm font-medium"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting || !note.trim()}
              className="flex-1 px-4 py-2.5 rounded-lg text-white font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{
                background: `linear-gradient(135deg, ${ADMIN_GRADIENT.from} 0%, ${ADMIN_GRADIENT.to} 100%)`,
              }}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Envoi...
                </>
              ) : (
                "Enregistrer"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function PointageEquipePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { addToast } = useToast();

  const userRole = (session?.user as { role?: string } | undefined)?.role;
  const isAdmin = userRole === "ADMIN" || userRole === "DIRECTION";

  // --- State ---
  const [activeTab, setActiveTab] = useState<TabId>("today");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [pointages, setPointages] = useState<PointageEquipe[]>([]);
  const [recaps, setRecaps] = useState<RecapMensuel[]>([]);
  const [loadingToday, setLoadingToday] = useState(true);
  const [loadingRecap, setLoadingRecap] = useState(false);
  const [correctionTarget, setCorrectionTarget] = useState<PointageEquipe | null>(null);

  // --- Access check ---
  useEffect(() => {
    if (status === "loading") return;
    if (!isAdmin) {
      router.replace("/administration/pointage");
    }
  }, [status, isAdmin, router]);

  // --- Fetch today data ---
  const fetchEquipeToday = useCallback(async () => {
    setLoadingToday(true);
    try {
      const dateStr = toDateStr(selectedDate);
      const res = await fetch(`/api/pointage/equipe?date=${dateStr}`);
      if (!res.ok) throw new Error("Erreur chargement");
      const data = await res.json();
      // API returns { equipe: [{ user, pointage }] } — flatten to pointage records with user info
      const equipe = data.equipe || [];
      const flat = equipe.map((e: any) => ({
        ...(e.pointage || {}),
        id: e.pointage?.id || e.user.id,
        userId: e.user.id,
        user: e.user,
        arrivee: e.pointage?.arrivee || null,
        debutPause: e.pointage?.debutPause || null,
        finPause: e.pointage?.finPause || null,
        depart: e.pointage?.depart || null,
        heuresTravaillees: e.pointage?.heuresTravaillees || null,
        heuresSupp: e.pointage?.heuresSupp || null,
      }));
      setPointages(flat);
    } catch {
      addToast("Impossible de charger les pointages", "error");
      setPointages([]);
    } finally {
      setLoadingToday(false);
    }
  }, [selectedDate, addToast]);

  // --- Fetch monthly recap ---
  const fetchRecap = useCallback(async () => {
    setLoadingRecap(true);
    try {
      const moisStr = toMonthStr(selectedMonth);
      const res = await fetch(`/api/pointage/equipe?mois=${moisStr}`);
      if (!res.ok) throw new Error("Erreur chargement");
      const data = await res.json();
      setRecaps(data.recaps || data || []);
    } catch {
      addToast("Impossible de charger le récapitulatif", "error");
      setRecaps([]);
    } finally {
      setLoadingRecap(false);
    }
  }, [selectedMonth, addToast]);

  useEffect(() => {
    if (!isAdmin) return;
    if (activeTab === "today") {
      fetchEquipeToday();
    }
  }, [activeTab, isAdmin, fetchEquipeToday]);

  useEffect(() => {
    if (!isAdmin) return;
    if (activeTab === "recap") {
      fetchRecap();
    }
  }, [activeTab, isAdmin, fetchRecap]);

  // --- Date navigation ---
  const navigateDay = (direction: number) => {
    setSelectedDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + direction);
      return d;
    });
  };

  const navigateMonth = (direction: number) => {
    setSelectedMonth((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + direction);
      return d;
    });
  };

  // --- Export CSV ---
  const handleExportCSV = () => {
    const moisStr = toMonthStr(selectedMonth);
    window.open(`/api/pointage/export?mois=${moisStr}`, "_blank");
  };

  // --- Guard render ---
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-active)]" />
      </div>
    );
  }

  if (!isAdmin) return null;

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${ADMIN_GRADIENT.from} 0%, ${ADMIN_GRADIENT.to} 100%)`,
              boxShadow: `0 4px 15px ${ADMIN_GRADIENT.shadow}`,
            }}
          >
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-cockpit-heading">
              Pointage Équipe
            </h1>
            <p className="text-sm text-cockpit-secondary">
              Suivi du temps de travail de l&apos;équipe
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-cockpit-dark rounded-xl p-1 border border-cockpit w-fit">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "text-white shadow-md"
                  : "text-cockpit-secondary hover:text-cockpit-primary"
              }`}
              style={
                isActive
                  ? {
                      background: `linear-gradient(135deg, ${ADMIN_GRADIENT.from} 0%, ${ADMIN_GRADIENT.to} 100%)`,
                    }
                  : undefined
              }
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === "today" && (
        <div className="space-y-4">
          {/* Date navigation */}
          <div className="flex items-center justify-between bg-cockpit-card border border-cockpit rounded-card px-4 py-3">
            <button
              onClick={() => navigateDay(-1)}
              className="p-2 rounded-lg hover:bg-white/5 text-cockpit-secondary hover:text-cockpit-primary transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-cockpit-primary font-medium text-sm capitalize">
              {formatDateFR(selectedDate)}
            </span>
            <button
              onClick={() => navigateDay(1)}
              className="p-2 rounded-lg hover:bg-white/5 text-cockpit-secondary hover:text-cockpit-primary transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Desktop table */}
          <div className="hidden md:block bg-cockpit-card border border-cockpit rounded-card shadow-cockpit-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-cockpit">
                    <th className="text-left px-4 py-3 text-cockpit-secondary font-medium">
                      Collaborateur
                    </th>
                    <th className="text-left px-4 py-3 text-cockpit-secondary font-medium">
                      Arrivée
                    </th>
                    <th className="text-left px-4 py-3 text-cockpit-secondary font-medium">
                      Pause
                    </th>
                    <th className="text-left px-4 py-3 text-cockpit-secondary font-medium">
                      Retour
                    </th>
                    <th className="text-left px-4 py-3 text-cockpit-secondary font-medium">
                      Départ
                    </th>
                    <th className="text-left px-4 py-3 text-cockpit-secondary font-medium">
                      Heures
                    </th>
                    <th className="text-left px-4 py-3 text-cockpit-secondary font-medium">
                      Statut
                    </th>
                    <th className="text-right px-4 py-3 text-cockpit-secondary font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cockpit">
                  {loadingToday ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <SkeletonRow key={i} />
                    ))
                  ) : pointages.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-12 text-center text-cockpit-secondary"
                      >
                        Aucun pointage pour cette date
                      </td>
                    </tr>
                  ) : (
                    pointages.map((p) => {
                      const statut = getStatutBadge(p);
                      return (
                        <tr
                          key={p.id}
                          className="hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{
                                  backgroundColor: p.user.couleur || "#6B7280",
                                }}
                              />
                              <span className="text-cockpit-primary font-medium">
                                {p.user.prenom} {p.user.nom}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-cockpit-primary">
                            {formatHeure(p.arrivee)}
                          </td>
                          <td className="px-4 py-3 text-cockpit-primary">
                            {formatHeure(p.debutPause)}
                          </td>
                          <td className="px-4 py-3 text-cockpit-primary">
                            {formatHeure(p.finPause)}
                          </td>
                          <td className="px-4 py-3 text-cockpit-primary">
                            {formatHeure(p.depart)}
                          </td>
                          <td className="px-4 py-3 text-cockpit-primary font-medium">
                            {p.heuresTravaillees != null
                              ? `${p.heuresTravaillees.toFixed(1)}h`
                              : "—"}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <div
                                className={`w-2 h-2 rounded-full ${statut.couleur}`}
                              />
                              <span className="text-cockpit-secondary text-xs">
                                {statut.label}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => setCorrectionTarget(p)}
                              className="p-1.5 rounded-lg hover:bg-white/10 text-cockpit-secondary hover:text-[var(--color-active)] transition-colors"
                              title="Corriger"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {loadingToday ? (
              Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
            ) : pointages.length === 0 ? (
              <div className="bg-cockpit-card border border-cockpit rounded-card p-8 text-center text-cockpit-secondary">
                Aucun pointage pour cette date
              </div>
            ) : (
              pointages.map((p) => {
                const statut = getStatutBadge(p);
                return (
                  <div
                    key={p.id}
                    className="bg-cockpit-card border border-cockpit rounded-card p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{
                            backgroundColor: p.user.couleur || "#6B7280",
                          }}
                        />
                        <span className="text-cockpit-primary font-medium text-sm">
                          {p.user.prenom} {p.user.nom}
                        </span>
                      </div>
                      <button
                        onClick={() => setCorrectionTarget(p)}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-cockpit-secondary hover:text-[var(--color-active)] transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-cockpit-secondary">Arrivée</span>
                        <span className="text-cockpit-primary">
                          {formatHeure(p.arrivee)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-cockpit-secondary">Pause</span>
                        <span className="text-cockpit-primary">
                          {formatHeure(p.debutPause)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-cockpit-secondary">Retour</span>
                        <span className="text-cockpit-primary">
                          {formatHeure(p.finPause)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-cockpit-secondary">Départ</span>
                        <span className="text-cockpit-primary">
                          {formatHeure(p.depart)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-cockpit">
                      <div className="flex items-center gap-1.5">
                        <div
                          className={`w-2 h-2 rounded-full ${statut.couleur}`}
                        />
                        <span className="text-cockpit-secondary text-xs">
                          {statut.label}
                        </span>
                      </div>
                      <span className="text-cockpit-primary font-medium text-sm">
                        {p.heuresTravaillees != null
                          ? `${p.heuresTravaillees.toFixed(1)}h`
                          : "—"}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {activeTab === "recap" && (
        <div className="space-y-4">
          {/* Month navigation + export */}
          <div className="flex items-center justify-between bg-cockpit-card border border-cockpit rounded-card px-4 py-3">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 rounded-lg hover:bg-white/5 text-cockpit-secondary hover:text-cockpit-primary transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-cockpit-primary font-medium text-sm">
              {MONTH_NAMES[selectedMonth.getMonth()]}{" "}
              {selectedMonth.getFullYear()}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-all hover:opacity-90"
                style={{
                  background: `linear-gradient(135deg, ${ADMIN_GRADIENT.from} 0%, ${ADMIN_GRADIENT.to} 100%)`,
                }}
              >
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </button>
              <button
                onClick={() => navigateMonth(1)}
                className="p-2 rounded-lg hover:bg-white/5 text-cockpit-secondary hover:text-cockpit-primary transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Recap table */}
          <div className="bg-cockpit-card border border-cockpit rounded-card shadow-cockpit-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-cockpit">
                    <th className="text-left px-4 py-3 text-cockpit-secondary font-medium">
                      Collaborateur
                    </th>
                    <th className="text-left px-4 py-3 text-cockpit-secondary font-medium">
                      Jours travaillés
                    </th>
                    <th className="text-left px-4 py-3 text-cockpit-secondary font-medium">
                      Heures totales
                    </th>
                    <th className="text-left px-4 py-3 text-cockpit-secondary font-medium">
                      Heures supp
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cockpit">
                  {loadingRecap ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <SkeletonRecapRow key={i} />
                    ))
                  ) : recaps.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-12 text-center text-cockpit-secondary"
                      >
                        Aucune donnée pour ce mois
                      </td>
                    </tr>
                  ) : (
                    recaps.map((r) => (
                      <tr
                        key={r.userId}
                        className="hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{
                                backgroundColor: r.user.couleur || "#6B7280",
                              }}
                            />
                            <span className="text-cockpit-primary font-medium">
                              {r.user.prenom} {r.user.nom}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-cockpit-primary">
                          {r.joursTravailles}
                          <span className="text-cockpit-secondary">
                            /{r.joursOuvres}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-cockpit-primary font-medium">
                          {r.heuresTotales.toFixed(1)}h
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`font-medium ${
                              r.heuresSupp > 0
                                ? "text-amber-400"
                                : r.heuresSupp < 0
                                ? "text-red-400"
                                : "text-cockpit-secondary"
                            }`}
                          >
                            {formatDuree(r.heuresSupp)}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Correction Modal */}
      {correctionTarget && (
        <CorrectionModal
          pointage={correctionTarget}
          date={formatDateFR(selectedDate)}
          onClose={() => setCorrectionTarget(null)}
          onSuccess={fetchEquipeToday}
        />
      )}
    </div>
  );
}
