"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/toast";
import {
  CalendarDays,
  Plus,
  Clock,
  Check,
  X,
  Users,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import clsx from "clsx";
import {
  TYPES_CONGE,
  STATUTS_CONGE,
  PERIODES_NON_AUTORISEES_2026,
  JOURS_FERIES_2026,
  calculerJoursOuvres,
  SOLDE_CP_ANNUEL,
} from "@/data/conges-config";

// ============================================================================
// TYPES
// ============================================================================

interface CongeUser {
  nom: string;
  prenom: string;
  couleur: string | null;
  titre: string | null;
}

interface Conge {
  id: string;
  userId: string;
  type: string;
  dateDebut: string;
  dateFin: string;
  nbJours: number;
  statut: string;
  notes: string | null;
  commentaire: string | null;
  createdAt: string;
  user: CongeUser;
  approuvePar: { nom: string; prenom: string } | null;
}

interface CongeStats {
  total: number;
  parStatut: Record<string, number>;
  joursApprouvesCeMois: number;
  soldes: {
    userId: string;
    nom: string;
    prenom: string;
    couleur: string | null;
    joursTotal: number;
    joursPris: number;
    soldeRestant: number;
  }[];
}

interface Periode {
  dateDebut: string;
  dateFin: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const ADMIN_GRADIENT = {
  from: "var(--color-active)",
  to: "#FEEB9C",
  shadow: "var(--color-active-border)",
};

const CURRENT_YEAR = 2026;

const MONTH_NAMES = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

const DAY_HEADERS = ["L", "M", "M", "J", "V", "S", "D"];

const TABS = [
  { id: "tous", label: "Tous" },
  { id: "en_attente", label: "En attente" },
  { id: "approuve", label: "Approuvés" },
  { id: "refuse", label: "Refusés" },
] as const;

const CONSTRAINT_LABELS = [
  "Aucune demande pendant les périodes non recommandées",
  "Jamais deux commerciaux en congés simultanément",
  "Roulement annuel pour la période des fêtes",
  "Durée maximale : 3 semaines consécutives",
  "Une semaine non planifiée conservée",
];

// ============================================================================
// HELPERS
// ============================================================================

function formatDateFR(d: string): string {
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getStatutConfig(statut: string) {
  const map: Record<string, { label: string; classes: string }> = {
    en_attente: { label: "En attente", classes: "bg-amber-500/15 text-amber-400" },
    approuve: { label: "Approuvé", classes: "bg-green-500/15 text-green-400" },
    modifie: { label: "Modifié", classes: "bg-blue-500/15 text-blue-400" },
    refuse: { label: "Refusé", classes: "bg-red-500/15 text-red-400" },
  };
  return map[statut] || { label: statut, classes: "bg-gray-500/15 text-gray-400" };
}

function getTypeLabel(type: string): string {
  const found = TYPES_CONGE.find((t) => t.value === type);
  return found ? found.label : type;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Monday = 0
}

function isWeekend(year: number, month: number, day: number): boolean {
  const d = new Date(year, month, day).getDay();
  // DIMEXOI : repos dimanche (0) + lundi (1)
  return d === 0 || d === 1;
}

function isJourFerie(year: number, month: number, day: number): boolean {
  const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return JOURS_FERIES_2026.includes(dateStr);
}

function isInPeriodeNonRecommandee(year: number, month: number, day: number): boolean {
  const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return PERIODES_NON_AUTORISEES_2026.some(
    (p) => dateStr >= p.debut && dateStr <= p.fin
  );
}

function isDateInRange(dateStr: string, debut: string, fin: string): boolean {
  return dateStr >= debut.split("T")[0] && dateStr <= fin.split("T")[0];
}

// ============================================================================
// SKELETON COMPONENTS
// ============================================================================

function SkeletonKPI() {
  return (
    <div
      className="rounded-xl p-4 animate-pulse"
      style={{
        background: `linear-gradient(135deg, ${ADMIN_GRADIENT.from}40 0%, ${ADMIN_GRADIENT.to}40 100%)`,
      }}
    >
      <div className="h-3 w-20 bg-white/10 rounded mb-3" />
      <div className="h-7 w-12 bg-white/15 rounded" />
    </div>
  );
}

function SkeletonTable() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-14 bg-cockpit/30 rounded-lg animate-pulse" />
      ))}
    </div>
  );
}

// ============================================================================
// MINI CALENDAR (per month)
// ============================================================================

function MiniCalendar({
  year,
  month,
  conges,
}: {
  year: number;
  month: number;
  conges: Conge[];
}) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);

  // Build map: dateStr -> user couleurs
  const dayUserColors = useMemo(() => {
    const map: Record<string, string[]> = {};
    const approvedConges = conges.filter((c) => c.statut === "approuve" || c.statut === "modifie");
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const colors: string[] = [];
      for (const c of approvedConges) {
        if (isDateInRange(dateStr, c.dateDebut, c.dateFin) && c.user.couleur) {
          if (!colors.includes(c.user.couleur)) {
            colors.push(c.user.couleur);
          }
        }
      }
      if (colors.length > 0) {
        map[d] = colors;
      }
    }
    return map;
  }, [year, month, conges, daysInMonth]);

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  // Pad to complete weeks
  const remainder = cells.length % 7;
  if (remainder !== 0) {
    cells.push(...Array(7 - remainder).fill(null));
  }

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  return (
    <div className="bg-white rounded-xl p-4 border border-cockpit/50">
      <p className="text-sm font-semibold text-cockpit-heading mb-2">
        {MONTH_NAMES[month]}
      </p>
      <div className="grid grid-cols-7 gap-px">
        {DAY_HEADERS.map((d, i) => (
          <div
            key={i}
            className="text-[10px] font-medium text-cockpit-secondary uppercase text-center mb-1"
          >
            {d}
          </div>
        ))}
        {cells.map((day, idx) => {
          if (day === null) {
            return <div key={idx} className="w-7 h-7" />;
          }

          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const weekend = isWeekend(year, month, day);
          const ferie = isJourFerie(year, month, day);
          const periodeRouge = isInPeriodeNonRecommandee(year, month, day);
          const userColors = dayUserColors[day] || [];
          const isToday = dateStr === todayStr;

          return (
            <div
              key={idx}
              className={clsx(
                "w-7 h-7 flex items-center justify-center text-xs rounded-md relative",
                isToday && "ring-2 ring-orange-400 font-bold",
                periodeRouge && !weekend && !ferie && userColors.length === 0 && "bg-red-50 text-red-400",
                (weekend || ferie) && userColors.length === 0 && !periodeRouge && "text-cockpit-secondary/30",
                !weekend && !ferie && !periodeRouge && userColors.length === 0 && "text-cockpit-primary"
              )}
              style={
                userColors.length > 0 && !weekend && !ferie
                  ? { backgroundColor: userColors[0] + "40" }
                  : undefined
              }
            >
              <span className={clsx(ferie && "line-through")}>
                {day}
              </span>
              {userColors.length > 0 && !weekend && !ferie && (
                <div
                  className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                  style={{ backgroundColor: userColors[0] }}
                />
              )}
              {userColors.length > 1 && !weekend && !ferie && (
                <div
                  className="absolute bottom-0.5 left-1/2 translate-x-0.5 w-1 h-1 rounded-full"
                  style={{ backgroundColor: userColors[1] }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// MODAL: NOUVELLE DEMANDE
// ============================================================================

function ModalNouvelleDemande({
  open,
  onClose,
  users,
  onSubmit,
  submitting,
}: {
  open: boolean;
  onClose: () => void;
  users: { userId: string; nom: string; prenom: string; couleur: string | null }[];
  onSubmit: (data: { userId: string; type: string; periodes: Periode[]; notes: string }) => void;
  submitting: boolean;
}) {
  const [selectedUserId, setSelectedUserId] = useState("");
  const [typeConge, setTypeConge] = useState("conge_paye");
  const [periodes, setPeriodes] = useState<Periode[]>([
    { dateDebut: "", dateFin: "" },
    { dateDebut: "", dateFin: "" },
    { dateDebut: "", dateFin: "" },
    { dateDebut: "", dateFin: "" },
  ]);
  const [notes, setNotes] = useState("");
  const [maladieFile, setMaladieFile] = useState<File | null>(null);
  const [checks, setChecks] = useState<boolean[]>([false, false, false, false, false]);

  // Find selected user's titre
  const selectedUser = users.find((u) => u.userId === selectedUserId);

  // Calculate jours ouvres for each period
  const joursPerPeriode = periodes.map((p) => {
    if (!p.dateDebut || !p.dateFin) return 0;
    const d = new Date(p.dateDebut);
    const f = new Date(p.dateFin);
    if (f < d) return 0;
    return calculerJoursOuvres(d, f);
  });

  const totalJours = joursPerPeriode.reduce((a, b) => a + b, 0);

  const handlePeriodeChange = (index: number, field: "dateDebut" | "dateFin", value: string) => {
    const updated = [...periodes];
    updated[index] = { ...updated[index], [field]: value };
    setPeriodes(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validPeriodes = periodes.filter((p) => p.dateDebut && p.dateFin);
    if (!selectedUserId || validPeriodes.length === 0) return;
    onSubmit({ userId: selectedUserId, type: typeConge, periodes: validPeriodes, notes });
  };

  const resetForm = () => {
    setSelectedUserId("");
    setTypeConge("conge_paye");
    setPeriodes([
      { dateDebut: "", dateFin: "" },
      { dateDebut: "", dateFin: "" },
      { dateDebut: "", dateFin: "" },
      { dateDebut: "", dateFin: "" },
    ]);
    setNotes("");
    setMaladieFile(null);
    setChecks([false, false, false, false, false]);
  };

  useEffect(() => {
    if (!open) resetForm();
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white border border-cockpit rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-cockpit">
          <h2 className="text-xl font-bold text-cockpit-heading">Nouvelle demande de congé</h2>
          <button onClick={onClose} className="p-2 hover:bg-cockpit rounded-lg transition">
            <X size={20} className="text-cockpit-secondary" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Collaborateur */}
          <div>
            <label className="block text-sm font-medium text-cockpit-secondary mb-1.5">
              Collaborateur
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full rounded-lg border border-cockpit bg-cockpit-darker p-2.5 text-cockpit-primary focus:border-[var(--color-active)] focus:outline-none focus:ring-1 focus:ring-[var(--color-active)]/30"
              required
            >
              <option value="">Sélectionner...</option>
              {users.map((u) => (
                <option key={u.userId} value={u.userId}>
                  {u.prenom} {u.nom}
                </option>
              ))}
            </select>
          </div>

          {/* Service/Fonction (readonly) */}
          {selectedUser && (
            <div>
              <label className="block text-sm font-medium text-cockpit-secondary mb-1.5">
                Service / Fonction
              </label>
              <input
                type="text"
                value={selectedUser.nom || "—"}
                readOnly
                className="w-full rounded-lg border border-cockpit bg-cockpit/50 p-2.5 text-cockpit-secondary cursor-not-allowed"
              />
            </div>
          )}

          {/* Type de congé */}
          <div>
            <label className="block text-sm font-medium text-cockpit-secondary mb-1.5">
              Type de congé
            </label>
            <select
              value={typeConge}
              onChange={(e) => setTypeConge(e.target.value)}
              className="w-full rounded-lg border border-cockpit bg-cockpit-darker p-2.5 text-cockpit-primary focus:border-[var(--color-active)] focus:outline-none focus:ring-1 focus:ring-[var(--color-active)]/30"
            >
              {TYPES_CONGE.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {typeConge === "maladie" && (
            <div>
              <label className="text-sm font-medium text-cockpit-primary mb-1 block">
                Arrêt maladie (justificatif)
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setMaladieFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-cockpit-secondary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-cockpit-dark file:text-cockpit-primary hover:file:bg-cockpit-input"
              />
              <p className="text-[11px] text-cockpit-secondary mt-1">PDF, JPG ou PNG acceptés</p>
            </div>
          )}

          {/* Périodes (up to 4) */}
          <div>
            <label className="block text-sm font-medium text-cockpit-secondary mb-2">
              Périodes (jusqu&apos;à 4)
            </label>
            <div className="space-y-3">
              {periodes.map((p, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <span className="text-xs text-cockpit-secondary w-4">{i + 1}.</span>
                  <input
                    type="date"
                    value={p.dateDebut}
                    onChange={(e) => handlePeriodeChange(i, "dateDebut", e.target.value)}
                    className="flex-1 rounded-lg border border-cockpit bg-cockpit-darker p-2 text-sm text-cockpit-primary focus:border-[var(--color-active)] focus:outline-none"
                  />
                  <span className="text-cockpit-secondary text-xs">au</span>
                  <input
                    type="date"
                    value={p.dateFin}
                    onChange={(e) => handlePeriodeChange(i, "dateFin", e.target.value)}
                    className="flex-1 rounded-lg border border-cockpit bg-cockpit-darker p-2 text-sm text-cockpit-primary focus:border-[var(--color-active)] focus:outline-none"
                  />
                  <span className="text-xs text-cockpit-secondary w-16 text-right">
                    {joursPerPeriode[i] > 0 ? `${joursPerPeriode[i]} j.` : ""}
                  </span>
                </div>
              ))}
            </div>
            {totalJours > 0 && (
              <p className="text-sm font-medium mt-2" style={{ color: ADMIN_GRADIENT.from }}>
                Total : {totalJours} jour{totalJours > 1 ? "s" : ""} ouvré{totalJours > 1 ? "s" : ""}
              </p>
            )}
          </div>

          {/* Observations */}
          <div>
            <label className="block text-sm font-medium text-cockpit-secondary mb-1.5">
              Observations
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-cockpit bg-cockpit-darker p-2.5 text-cockpit-primary placeholder-cockpit-secondary focus:border-[var(--color-active)] focus:outline-none focus:ring-1 focus:ring-[var(--color-active)]/30 resize-none"
              placeholder="Notes complémentaires..."
            />
          </div>

          {/* Constraint checkboxes (display only) */}
          <div className="bg-cockpit rounded-lg p-4 space-y-2.5">
            <p className="text-xs font-semibold text-cockpit-heading mb-2">
              Règles de gestion (pour info)
            </p>
            {CONSTRAINT_LABELS.map((label, i) => (
              <label key={i} className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checks[i]}
                  onChange={(e) => {
                    const updated = [...checks];
                    updated[i] = e.target.checked;
                    setChecks(updated);
                  }}
                  className="mt-0.5 accent-[var(--color-active)]"
                />
                <span className="text-xs text-cockpit-secondary">{label}</span>
              </label>
            ))}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || !selectedUserId || totalJours === 0}
            className="w-full py-3 rounded-lg font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{
              background: `linear-gradient(135deg, ${ADMIN_GRADIENT.from} 0%, ${ADMIN_GRADIENT.to} 100%)`,
            }}
          >
            {submitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Envoi en cours...
              </>
            ) : (
              <>
                <Plus size={18} />
                Soumettre la demande
              </>
            )}
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
}

// ============================================================================
// MODAL: VALIDATION (Approve/Reject)
// ============================================================================

function ModalValidation({
  open,
  onClose,
  conge,
  onSubmit,
  submitting,
}: {
  open: boolean;
  onClose: () => void;
  conge: Conge | null;
  onSubmit: (id: string, statut: string, commentaire: string) => void;
  submitting: boolean;
}) {
  const [statut, setStatut] = useState("approuve");
  const [commentaire, setCommentaire] = useState("");

  useEffect(() => {
    if (open) {
      setStatut("approuve");
      setCommentaire("");
    }
  }, [open]);

  if (!open || !conge) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(conge.id, statut, commentaire);
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white border border-cockpit rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-cockpit">
          <h2 className="text-xl font-bold text-cockpit-heading">Validation de la demande</h2>
          <button onClick={onClose} className="p-2 hover:bg-cockpit rounded-lg transition">
            <X size={20} className="text-cockpit-secondary" />
          </button>
        </div>

        {/* Request details */}
        <div className="p-6 border-b border-cockpit space-y-2">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: conge.user.couleur || "#888" }}
            />
            <span className="text-cockpit-heading font-medium">
              {conge.user.prenom} {conge.user.nom}
            </span>
          </div>
          <p className="text-sm text-cockpit-secondary">
            {getTypeLabel(conge.type)} — {conge.nbJours} jour{conge.nbJours > 1 ? "s" : ""}
          </p>
          <p className="text-sm text-cockpit-primary">
            {formatDateFR(conge.dateDebut)} — {formatDateFR(conge.dateFin)}
          </p>
          {conge.notes && (
            <p className="text-xs text-cockpit-secondary italic mt-1">
              &quot;{conge.notes}&quot;
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Decision radio */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-cockpit-secondary mb-2">
              Décision
            </label>
            {[
              { value: "approuve", label: "Accepté", color: "text-green-400" },
              { value: "modifie", label: "Modifié", color: "text-blue-400" },
              { value: "refuse", label: "Refusé", color: "text-red-400" },
            ].map((opt) => (
              <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="decision"
                  value={opt.value}
                  checked={statut === opt.value}
                  onChange={() => setStatut(opt.value)}
                  className="accent-[var(--color-active)]"
                />
                <span className={clsx("text-sm font-medium", opt.color)}>
                  {opt.label}
                </span>
              </label>
            ))}
          </div>

          {/* Commentaire */}
          <div>
            <label className="block text-sm font-medium text-cockpit-secondary mb-1.5">
              Commentaire
            </label>
            <textarea
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-cockpit bg-cockpit-darker p-2.5 text-cockpit-primary placeholder-cockpit-secondary focus:border-[var(--color-active)] focus:outline-none resize-none"
              placeholder="Commentaire optionnel..."
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-lg font-semibold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            style={{
              background: `linear-gradient(135deg, ${ADMIN_GRADIENT.from} 0%, ${ADMIN_GRADIENT.to} 100%)`,
            }}
          >
            {submitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Validation...
              </>
            ) : (
              <>
                <Check size={18} />
                Valider
              </>
            )}
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function CongesPage() {
  const { data: session } = useSession();
  const { addToast } = useToast();

  const userRole = (session?.user as { role?: string } | undefined)?.role;
  const isAdmin = userRole === "ADMIN" || userRole === "DIRECTION";

  // --- State ---
  const [stats, setStats] = useState<CongeStats | null>(null);
  const [conges, setConges] = useState<Conge[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("tous");

  // Modals
  const [showNewModal, setShowNewModal] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationTarget, setValidationTarget] = useState<Conge | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // --- Data loading ---
  const loadStats = useCallback(async () => {
    try {
      const res = await fetch("/api/conges/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Erreur chargement stats congés:", err);
    }
  }, []);

  const loadConges = useCallback(async () => {
    try {
      const params = new URLSearchParams({ annee: String(CURRENT_YEAR) });
      if (activeTab !== "tous") {
        params.set("statut", activeTab);
      }
      const res = await fetch(`/api/conges?${params}`);
      if (res.ok) {
        const data = await res.json();
        setConges(data.conges || []);
      }
    } catch (err) {
      console.error("Erreur chargement congés:", err);
    }
  }, [activeTab]);

  useEffect(() => {
    Promise.all([loadStats(), loadConges()]).finally(() => setLoading(false));
  }, [loadStats, loadConges]);

  // --- Effectif en conge aujourd'hui ---
  const effectifEnCongeAujourdhui = useMemo(() => {
    if (!conges.length) return 0;
    const today = new Date().toISOString().split("T")[0];
    const usersOnLeave = new Set<string>();
    for (const c of conges) {
      if (
        (c.statut === "approuve" || c.statut === "modifie") &&
        isDateInRange(today, c.dateDebut, c.dateFin)
      ) {
        usersOnLeave.add(c.userId);
      }
    }
    return usersOnLeave.size;
  }, [conges]);

  // --- All conges for calendar (unfiltered by tab) ---
  const [allConges, setAllConges] = useState<Conge[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/conges?annee=${CURRENT_YEAR}`);
        if (res.ok) {
          const data = await res.json();
          setAllConges(data.conges || []);
        }
      } catch (err) {
        console.error("Erreur chargement all congés:", err);
      }
    })();
  }, []);

  // Refresh allConges when conges change
  useEffect(() => {
    if (activeTab === "tous") {
      setAllConges(conges);
    }
  }, [conges, activeTab]);

  // --- Calendar legend: unique users with approved conges ---
  const calendarLegend = useMemo(() => {
    const userMap = new Map<string, { nom: string; prenom: string; couleur: string }>();
    for (const c of allConges) {
      if ((c.statut === "approuve" || c.statut === "modifie") && c.user.couleur) {
        if (!userMap.has(c.userId)) {
          userMap.set(c.userId, {
            nom: c.user.nom,
            prenom: c.user.prenom,
            couleur: c.user.couleur,
          });
        }
      }
    }
    return Array.from(userMap.values());
  }, [allConges]);

  // --- Handlers ---
  const handleCreateConge = async (data: {
    userId: string;
    type: string;
    periodes: Periode[];
    notes: string;
  }) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/conges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        addToast("Demande de congé créée avec succès", "success");
        setShowNewModal(false);
        await Promise.all([loadStats(), loadConges()]);
      } else {
        const err = await res.json();
        addToast(err.error || "Erreur lors de la création", "error");
      }
    } catch {
      addToast("Erreur réseau", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleValidation = async (id: string, statut: string, commentaire: string) => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/conges/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut, commentaire }),
      });
      if (res.ok) {
        const statutLabel = STATUTS_CONGE.find((s) => s.value === statut)?.label || statut;
        addToast(`Demande ${statutLabel.toLowerCase()}`, "success");
        setShowValidationModal(false);
        setValidationTarget(null);
        await Promise.all([loadStats(), loadConges()]);
      } else {
        const err = await res.json();
        addToast(err.error || "Erreur lors de la validation", "error");
      }
    } catch {
      addToast("Erreur réseau", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const openValidation = (conge: Conge) => {
    setValidationTarget(conge);
    setShowValidationModal(true);
  };

  // --- Render ---
  return (
    <div className="min-h-screen bg-cockpit-darker p-4 sm:p-6 lg:p-8">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* ================================================================
            HEADER
            ================================================================ */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-cockpit-heading">
              Congés & Absences
            </h1>
            <p className="text-cockpit-secondary mt-1">
              Année {CURRENT_YEAR}
            </p>
          </div>
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-lg font-semibold text-white transition-all hover:-translate-y-0.5 w-full sm:w-auto min-h-[48px]"
            style={{
              background: `linear-gradient(135deg, ${ADMIN_GRADIENT.from} 0%, ${ADMIN_GRADIENT.to} 100%)`,
              boxShadow: `0 4px 14px ${ADMIN_GRADIENT.shadow}`,
            }}
          >
            <Plus size={20} />
            Nouvelle demande
          </button>
        </div>

        {/* ================================================================
            KPI CARDS
            ================================================================ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            <>
              <SkeletonKPI />
              <SkeletonKPI />
              <SkeletonKPI />
              <SkeletonKPI />
            </>
          ) : (
            <>
              {/* Total demandes */}
              <div
                className="rounded-xl p-3 sm:p-4 flex items-center gap-3 transition-transform duration-200 hover:-translate-y-0.5"
                style={{
                  background: `linear-gradient(135deg, ${ADMIN_GRADIENT.from} 0%, ${ADMIN_GRADIENT.to} 100%)`,
                  boxShadow: `0 4px 14px ${ADMIN_GRADIENT.shadow}`,
                }}
              >
                <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                  <CalendarDays size={20} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white/75 text-xs font-medium">Total demandes</p>
                  <p className="text-xl font-bold text-white">{stats?.total ?? 0}</p>
                </div>
              </div>

              {/* En attente */}
              <div
                className="rounded-xl p-3 sm:p-4 flex items-center gap-3 transition-transform duration-200 hover:-translate-y-0.5"
                style={{
                  background: `linear-gradient(135deg, ${ADMIN_GRADIENT.from} 0%, ${ADMIN_GRADIENT.to} 100%)`,
                  boxShadow: `0 4px 14px ${ADMIN_GRADIENT.shadow}`,
                }}
              >
                <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                  <Clock size={20} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white/75 text-xs font-medium">En attente</p>
                  <p className="text-xl font-bold text-white">
                    {stats?.parStatut?.en_attente ?? 0}
                  </p>
                </div>
              </div>

              {/* Jours approuves ce mois */}
              <div
                className="rounded-xl p-3 sm:p-4 flex items-center gap-3 transition-transform duration-200 hover:-translate-y-0.5"
                style={{
                  background: `linear-gradient(135deg, ${ADMIN_GRADIENT.from} 0%, ${ADMIN_GRADIENT.to} 100%)`,
                  boxShadow: `0 4px 14px ${ADMIN_GRADIENT.shadow}`,
                }}
              >
                <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                  <Check size={20} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white/75 text-xs font-medium">Jours approuves ce mois</p>
                  <p className="text-xl font-bold text-white">
                    {stats?.joursApprouvesCeMois ?? 0}
                  </p>
                </div>
              </div>

              {/* Effectif en conge aujourd'hui */}
              <div
                className="rounded-xl p-3 sm:p-4 flex items-center gap-3 transition-transform duration-200 hover:-translate-y-0.5"
                style={{
                  background: `linear-gradient(135deg, ${ADMIN_GRADIENT.from} 0%, ${ADMIN_GRADIENT.to} 100%)`,
                  boxShadow: `0 4px 14px ${ADMIN_GRADIENT.shadow}`,
                }}
              >
                <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                  <Users size={20} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white/75 text-xs font-medium">En congé aujourd&apos;hui</p>
                  <p className="text-xl font-bold text-white">{effectifEnCongeAujourdhui}</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ================================================================
            ANNUAL CALENDAR (12 months, 4 cols x 3 rows)
            ================================================================ */}
        <div className="bg-cockpit-dark border border-cockpit rounded-xl p-4 sm:p-6">
          <h2 className="text-lg font-bold text-cockpit-heading mb-4 flex items-center gap-2">
            <CalendarDays size={20} style={{ color: ADMIN_GRADIENT.from }} />
            Calendrier {CURRENT_YEAR}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 12 }, (_, month) => (
              <MiniCalendar
                key={month}
                year={CURRENT_YEAR}
                month={month}
                conges={allConges}
              />
            ))}
          </div>

          {/* Legend */}
          <div className="mt-4 pt-4 border-t border-cockpit">
            <div className="flex flex-wrap items-center gap-4">
              {calendarLegend.map((u, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: u.couleur }}
                  />
                  <span className="text-xs text-cockpit-secondary">
                    {u.prenom} {u.nom}
                  </span>
                </div>
              ))}
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <span className="text-xs text-cockpit-secondary">Période non recommandée</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
                <span className="text-xs text-cockpit-secondary">Weekend / Férié</span>
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================
            TABS
            ================================================================ */}
        <div className="flex gap-1 border-b border-cockpit overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                "px-3 sm:px-4 py-3 font-medium text-sm transition whitespace-nowrap border-b-2 min-h-[44px]",
                activeTab === tab.id
                  ? "border-[var(--color-active)] text-[var(--color-active)]"
                  : "text-cockpit-secondary border-transparent hover:text-cockpit-primary"
              )}
            >
              {tab.label}
              {tab.id === "en_attente" && stats && stats.parStatut.en_attente > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-semibold">
                  {stats.parStatut.en_attente}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ================================================================
            TABLE
            ================================================================ */}
        <div className="bg-cockpit-dark border border-cockpit rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-6">
              <SkeletonTable />
            </div>
          ) : conges.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-cockpit-secondary">
              <CalendarDays size={48} className="mb-4 opacity-30" />
              <p>Aucune demande trouvée</p>
            </div>
          ) : (
            <>
            {/* Mobile cards */}
            <div className="md:hidden space-y-3 p-3">
              {conges.map((c) => {
                const statutCfg = getStatutConfig(c.statut);
                return (
                  <div key={c.id} className="bg-cockpit-card rounded-xl p-4 border border-cockpit/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: c.user.couleur || "#888" }} />
                        <span className="text-cockpit-heading font-medium text-sm">{c.user.prenom} {c.user.nom}</span>
                      </div>
                      <span className={clsx("px-2.5 py-1 rounded-full text-xs font-medium", statutCfg.classes)}>{statutCfg.label}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-cockpit-primary">{getTypeLabel(c.type)}</span>
                      <span className="text-cockpit-heading font-semibold">{c.nbJours}j</span>
                    </div>
                    <p className="text-cockpit-secondary text-xs">{formatDateFR(c.dateDebut)} — {formatDateFR(c.dateFin)}</p>
                    {isAdmin && c.statut === "en_attente" && (
                      <div className="flex gap-2 pt-1">
                        <button onClick={() => openValidation(c)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-green-500/10 hover:bg-green-500/20 rounded-lg text-green-500 text-xs font-medium transition min-h-[44px]">
                          <Check size={14} /> Approuver
                        </button>
                        <button onClick={() => { setValidationTarget(c); setShowValidationModal(true); }} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-500 text-xs font-medium transition min-h-[44px]">
                          <X size={14} /> Refuser
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-cockpit border-b border-cockpit">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-cockpit-heading uppercase tracking-wider">Collaborateur</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-cockpit-heading uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-cockpit-heading uppercase tracking-wider">Dates</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-cockpit-heading uppercase tracking-wider">Jours</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-cockpit-heading uppercase tracking-wider">Statut</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-cockpit-heading uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cockpit">
                  {conges.map((c) => {
                    const statutCfg = getStatutConfig(c.statut);
                    return (
                      <tr key={c.id} className="hover:bg-cockpit/30 transition">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: c.user.couleur || "#888" }} />
                            <span className="text-cockpit-heading font-medium text-sm">{c.user.prenom} {c.user.nom}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3"><span className="text-cockpit-primary text-sm">{getTypeLabel(c.type)}</span></td>
                        <td className="px-4 py-3"><span className="text-cockpit-primary text-sm">{formatDateFR(c.dateDebut)} — {formatDateFR(c.dateFin)}</span></td>
                        <td className="px-4 py-3 text-center"><span className="text-cockpit-heading font-semibold text-sm">{c.nbJours}</span></td>
                        <td className="px-4 py-3">
                          <div className="flex justify-center">
                            <span className={clsx("px-2.5 py-1 rounded-full text-xs font-medium", statutCfg.classes)}>{statutCfg.label}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-center gap-1.5">
                            {isAdmin && c.statut === "en_attente" ? (
                              <>
                                <button onClick={() => openValidation(c)} className="p-1.5 bg-green-500/10 hover:bg-green-500/20 rounded-lg text-green-400 transition" title="Approuver"><Check size={15} /></button>
                                <button onClick={() => { setValidationTarget(c); setShowValidationModal(true); }} className="p-1.5 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-400 transition" title="Refuser"><X size={15} /></button>
                              </>
                            ) : (
                              <span className="text-cockpit-secondary text-sm">—</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            </>
          )}
        </div>

        {/* ================================================================
            SOLDES CP
            ================================================================ */}
        {stats?.soldes && stats.soldes.length > 0 && (
          <div className="bg-cockpit-dark border border-cockpit rounded-xl p-4 sm:p-6">
            <h2 className="text-lg font-bold text-cockpit-heading mb-4 flex items-center gap-2">
              <Users size={20} style={{ color: ADMIN_GRADIENT.from }} />
              Soldes CP — {CURRENT_YEAR}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.soldes.map((s) => {
                const pct = Math.min((s.joursPris / s.joursTotal) * 100, 100);
                return (
                  <div
                    key={s.userId}
                    className="bg-cockpit rounded-lg p-4 border border-cockpit/50"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: s.couleur || "#888" }}
                      />
                      <span className="text-sm font-medium text-cockpit-heading truncate">
                        {s.prenom} {s.nom}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-cockpit-secondary mb-1.5">
                      <span>{s.joursPris} / {s.joursTotal} jours pris</span>
                      <span className="font-semibold text-cockpit-primary">
                        {s.soldeRestant} restant{s.soldeRestant > 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="h-2 bg-cockpit-darker rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: s.couleur || ADMIN_GRADIENT.from,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ================================================================
          MODALS
          ================================================================ */}
      <ModalNouvelleDemande
        open={showNewModal}
        onClose={() => setShowNewModal(false)}
        users={stats?.soldes?.map((s) => ({
          userId: s.userId,
          nom: s.nom,
          prenom: s.prenom,
          couleur: s.couleur,
        })) || []}
        onSubmit={handleCreateConge}
        submitting={submitting}
      />

      <ModalValidation
        open={showValidationModal}
        onClose={() => {
          setShowValidationModal(false);
          setValidationTarget(null);
        }}
        conge={validationTarget}
        onSubmit={handleValidation}
        submitting={submitting}
      />
    </div>
  );
}
