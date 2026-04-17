"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  TrendingUp,
  Euro,
  BarChart3,
  Target,
  ShoppingCart,
  Plus,
  Trash2,
  X,
  Loader2,
  ChevronDown,
  Download,
  Mail,
  Phone,
  User,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/toast";

// ============================================================================
// TYPES
// ============================================================================

interface KPIs {
  totalCA: number;
  totalDepenses: number;
  roasAnnuel: number;
  cac: number;
  nbVentes: number;
  guideDownloads: number;
}

interface MoisData {
  periode: string;
  ca: number;
  depenses: number;
  metaSpend: number;
  googleSpend: number;
  roas: number;
}

interface DepenseParType {
  type: string;
  label: string;
  montant: number;
}

interface Cout {
  id: string;
  periode: string;
  type: string;
  libelle: string;
  montant: number;
  createdBy: { nom: string; prenom: string };
}

interface TypeCout {
  value: string;
  label: string;
}

interface ROIData {
  annee: number;
  kpis: KPIs;
  mois: MoisData[];
  depensesParType: DepenseParType[];
  couts: Cout[];
  typesCout: TypeCout[];
  meta?: { available: boolean };
  google?: { available: boolean };
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MKT_GRADIENT = {
  from: "var(--color-active)",
  to: "#9C1449",
  shadow: "rgba(194,24,91,0.30)",
};

const CANAL_COLORS: Record<string, string> = {
  ads: "#E91E63",
  seo: "#AD1457",
  email: "#F06292",
  social: "#EC407A",
  print: "var(--color-active)",
  event: "#D81B60",
  other: "#880E4F",
};

const MOIS_LABELS: Record<string, string> = {
  "01": "Janvier",
  "02": "Février",
  "03": "Mars",
  "04": "Avril",
  "05": "Mai",
  "06": "Juin",
  "07": "Juillet",
  "08": "Août",
  "09": "Septembre",
  "10": "Octobre",
  "11": "Novembre",
  "12": "Décembre",
};

// ============================================================================
// HELPERS
// ============================================================================

const formatEUR = (n: number) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);

function formatPeriode(p: string): string {
  const parts = p.split("-");
  if (parts.length === 2) {
    return `${MOIS_LABELS[parts[1]] || parts[1]} ${parts[0]}`;
  }
  return p;
}

// ============================================================================
// MODAL — Ajouter une dépense
// ============================================================================

function AjouterDepenseModal({
  typesCout,
  onClose,
  onSuccess,
}: {
  typesCout: TypeCout[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { addToast } = useToast();
  const [periode, setPeriode] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [type, setType] = useState(typesCout[0]?.value || "");
  const [libelle, setLibelle] = useState("");
  const [montant, setMontant] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!libelle.trim() || !montant) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/marketing/roi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          periode,
          type,
          libelle: libelle.trim(),
          montant: Number(montant),
        }),
      });
      if (res.ok) {
        addToast("Dépense ajoutée avec succès", "success");
        onSuccess();
        onClose();
      } else {
        const data = await res.json();
        addToast(data.error || "Erreur lors de l'ajout", "error");
      }
    } catch {
      addToast("Erreur de connexion", "error");
    }
    setSubmitting(false);
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-cockpit-card border border-cockpit rounded-xl shadow-cockpit-lg overflow-hidden">
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{
            background: `linear-gradient(135deg, ${MKT_GRADIENT.from}, ${MKT_GRADIENT.to})`,
          }}
        >
          <h3 className="text-white font-semibold text-base">Ajouter une dépense</h3>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Période */}
          <div>
            <label className="block text-xs font-medium text-cockpit-secondary mb-1.5">
              Période
            </label>
            <input
              type="month"
              value={periode}
              onChange={(e) => setPeriode(e.target.value)}
              className="w-full bg-cockpit-dark border border-cockpit rounded-lg px-3 py-2.5 text-sm text-cockpit-primary focus:outline-none focus:ring-2 focus:ring-pink-500/40"
              required
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-medium text-cockpit-secondary mb-1.5">
              Type de dépense
            </label>
            <div className="relative">
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-cockpit-dark border border-cockpit rounded-lg px-3 py-2.5 text-sm text-cockpit-primary focus:outline-none focus:ring-2 focus:ring-pink-500/40 appearance-none"
                required
              >
                {typesCout.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cockpit-secondary pointer-events-none" />
            </div>
          </div>

          {/* Libellé */}
          <div>
            <label className="block text-xs font-medium text-cockpit-secondary mb-1.5">
              Libellé
            </label>
            <input
              type="text"
              value={libelle}
              onChange={(e) => setLibelle(e.target.value)}
              placeholder="Ex: Campagne Google Ads Mars"
              className="w-full bg-cockpit-dark border border-cockpit rounded-lg px-3 py-2.5 text-sm text-cockpit-primary placeholder:text-cockpit-secondary focus:outline-none focus:ring-2 focus:ring-pink-500/40"
              required
            />
          </div>

          {/* Montant */}
          <div>
            <label className="block text-xs font-medium text-cockpit-secondary mb-1.5">
              Montant (€)
            </label>
            <input
              type="number"
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
              placeholder="0"
              min="0"
              step="0.01"
              className="w-full bg-cockpit-dark border border-cockpit rounded-lg px-3 py-2.5 text-sm text-cockpit-primary placeholder:text-cockpit-secondary focus:outline-none focus:ring-2 focus:ring-pink-500/40"
              required
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border border-cockpit text-cockpit-secondary hover:text-cockpit-primary hover:border-cockpit-info/20 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting || !libelle.trim() || !montant}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              style={{
                background: `linear-gradient(135deg, ${MKT_GRADIENT.from}, ${MKT_GRADIENT.to})`,
                boxShadow: `0 4px 14px ${MKT_GRADIENT.shadow}`,
              }}
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Ajouter
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

// ============================================================================
// MODAL — Téléchargements guide
// ============================================================================

interface DownloadEvent {
  id: string;
  createdAt: string;
  description: string;
  contact: { email: string; prenom: string | null; nom: string | null; telephone: string | null } | null;
}

function DownloadsModal({ annee, total, onClose }: { annee: string; total: number; onClose: () => void }) {
  const [events, setEvents] = useState<DownloadEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch(`/api/marketing/roi/downloads?annee=${annee}`)
      .then((r) => r.json())
      .then((data) => { setEvents(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [annee]);

  const filtered = events.filter((e) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      e.contact?.email?.toLowerCase().includes(q) ||
      e.contact?.nom?.toLowerCase().includes(q) ||
      e.contact?.prenom?.toLowerCase().includes(q)
    );
  });

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-cockpit-card border border-cockpit rounded-xl shadow-cockpit-lg overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ background: `linear-gradient(135deg, ${MKT_GRADIENT.from}, ${MKT_GRADIENT.to})` }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
              <Download className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Téléchargements guide SDB</h3>
              <p className="text-xs text-white/70">{total} téléchargement{total > 1 ? "s" : ""} en {annee}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/20 text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-cockpit flex-shrink-0">
          <input
            type="text"
            placeholder="Rechercher par email ou nom…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-cockpit-input border border-cockpit rounded-lg px-3 py-2 text-sm text-cockpit-primary placeholder:text-cockpit-secondary focus:outline-none focus:ring-2 focus:ring-[#E36887]/30"
          />
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-cockpit-secondary" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-sm text-cockpit-secondary py-10">Aucun résultat</p>
          ) : (
            <div className="divide-y divide-cockpit">
              {filtered.map((e) => (
                <div key={e.id} className="px-4 py-3 flex items-center gap-3 hover:bg-cockpit-dark transition-colors">
                  <div className="w-8 h-8 rounded-full bg-[#E36887]/10 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-[#E36887]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {e.contact ? (
                      <>
                        <p className="text-sm font-medium text-cockpit-primary truncate">
                          {[e.contact.prenom, e.contact.nom].filter(Boolean).join(" ") || "—"}
                        </p>
                        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                          <span className="flex items-center gap-1 text-xs text-cockpit-secondary">
                            <Mail className="w-3 h-3" />
                            {e.contact.email}
                          </span>
                          {e.contact.telephone && (
                            <span className="flex items-center gap-1 text-xs text-cockpit-secondary">
                              <Phone className="w-3 h-3" />
                              {e.contact.telephone}
                            </span>
                          )}
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-cockpit-secondary italic">Contact non associé</p>
                    )}
                  </div>
                  <p className="text-[10px] text-cockpit-secondary flex-shrink-0">
                    {new Date(e.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {!loading && filtered.length > 0 && (
          <div className="px-4 py-2.5 border-t border-cockpit bg-cockpit-dark flex-shrink-0">
            <p className="text-xs text-cockpit-secondary">{filtered.length} contact{filtered.length > 1 ? "s" : ""} affiché{filtered.length > 1 ? "s" : ""}</p>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

// ============================================================================
// PAGE
// ============================================================================

export default function ROIMarketingPage() {
  const { data: session } = useSession();
  const { addToast } = useToast();
  const userRole = (session?.user as { role?: string } | undefined)?.role;
  const isAdmin = userRole === "ADMIN" || userRole === "DIRECTION";

  const [annee, setAnnee] = useState(new Date().getFullYear());
  const [data, setData] = useState<ROIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDownloads, setShowDownloads] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [catalogueStats, setCatalogueStats] = useState<{ views: number; clicks: number; tauxClic: number; referrers: { domain: string; count: number }[]; sources: { source: string; count: number }[] } | null>(null);
  const [demandesSources, setDemandesSources] = useState<{ total: number; sources: { source: string; label: string; total: number }[]; tableau: Record<string, number | string>[] } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [roiRes, catRes, demRes] = await Promise.all([
        fetch(`/api/marketing/roi?annee=${annee}`),
        fetch(`/api/marketing/catalogue-stats?annee=${annee}`),
        fetch(`/api/marketing/demandes-sources?annee=${annee}`),
      ]);
      if (roiRes.ok) setData(await roiRes.json());
      if (catRes.ok) setCatalogueStats(await catRes.json());
      if (demRes.ok) setDemandesSources(await demRes.json());
    } catch (err) {
      console.error("Erreur chargement ROI:", err);
    } finally {
      setLoading(false);
    }
  }, [annee]);

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/marketing/roi?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        addToast("Dépense supprimée", "success");
        await fetchData();
      } else {
        const d = await res.json();
        addToast(d.error || "Erreur suppression", "error");
      }
    } catch {
      addToast("Erreur de connexion", "error");
    }
    setDeletingId(null);
  };

  // Totals for bar chart
  const maxDepense = data
    ? Math.max(...data.depensesParType.map((d) => d.montant), 1)
    : 1;

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* ================================================================ */}
      {/* HEADER                                                          */}
      {/* ================================================================ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: `linear-gradient(135deg, ${MKT_GRADIENT.from}, ${MKT_GRADIENT.to})`,
              boxShadow: `0 4px 14px ${MKT_GRADIENT.shadow}`,
            }}
          >
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-cockpit-primary">ROI Marketing</h1>
            <p className="text-xs sm:text-sm text-cockpit-secondary">
              Analyse rentabilité des actions marketing
            </p>
          </div>
        </div>

        {/* Year selector */}
        <div className="flex items-center gap-2">
          {[new Date().getFullYear() - 1, new Date().getFullYear()].map((y) => (
            <button
              key={y}
              onClick={() => setAnnee(y)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${
                annee === y
                  ? "text-white border-transparent"
                  : "bg-cockpit-card text-cockpit-secondary border-cockpit hover:text-cockpit-primary hover:border-cockpit-info/20"
              }`}
              style={
                annee === y
                  ? {
                      background: `linear-gradient(135deg, ${MKT_GRADIENT.from}, ${MKT_GRADIENT.to})`,
                      boxShadow: `0 4px 14px ${MKT_GRADIENT.shadow}`,
                    }
                  : undefined
              }
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      {/* ================================================================ */}
      {/* KPI CARDS                                                       */}
      {/* ================================================================ */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl p-4 bg-cockpit-card animate-pulse h-20" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            {
              icon: Euro,
              label: "CA total",
              value: formatEUR(data?.kpis.totalCA || 0),
            },
            {
              icon: BarChart3,
              label: "Dépenses totales",
              value: formatEUR(data?.kpis.totalDepenses || 0),
            },
            {
              icon: TrendingUp,
              label: "ROAS annuel",
              value: `${(data?.kpis.roasAnnuel || 0).toFixed(2)}x`,
            },
            {
              icon: Target,
              label: "CAC",
              value: `${formatEUR(data?.kpis.cac || 0)} / BDC`,
              sub: `${data?.kpis.nbVentes || 0} bons de commande`,
            },
          ].map((kpi, idx) => (
            <div
              key={idx}
              className="rounded-xl p-3 sm:p-4 flex items-center gap-3 transition-transform duration-200 hover:-translate-y-0.5"
              style={{
                background: `linear-gradient(135deg, ${MKT_GRADIENT.from} 0%, ${MKT_GRADIENT.to} 100%)`,
                boxShadow: `0 4px 14px ${MKT_GRADIENT.shadow}`,
              }}
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                <kpi.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white/75 text-[10px] sm:text-xs font-medium truncate">
                  {kpi.label}
                </p>
                <p className="text-lg sm:text-xl font-bold text-white truncate">{kpi.value}</p>
                {kpi.sub && (
                  <p className="text-white/60 text-[10px] sm:text-xs">{kpi.sub}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================================================================ */}
      {/* LEAD MAGNETS                                                    */}
      {/* ================================================================ */}
      {!loading && data && (
        <div>
          <h2 className="text-sm font-semibold text-cockpit-primary mb-3 flex items-center gap-2">
            <Download className="w-4 h-4" style={{ color: MKT_GRADIENT.from }} />
            Guides PDF
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div
              className="rounded-xl p-4 flex items-center gap-3"
              style={{
                background: "var(--color-cockpit-card)",
                border: "1px solid var(--color-cockpit-border)",
              }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${MKT_GRADIENT.from}, ${MKT_GRADIENT.to})`,
                }}
              >
                <Download className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-cockpit-secondary font-medium">Guide SDB teck</p>
                <button
                  onClick={() => setShowDownloads(true)}
                  className="text-2xl font-bold text-cockpit-primary hover:underline cursor-pointer transition-opacity hover:opacity-80"
                  title="Voir les contacts"
                >
                  {data.kpis.guideDownloads}
                </button>
                <p className="text-[10px] text-cockpit-secondary">téléchargements {annee} — <span className="underline cursor-pointer" onClick={() => setShowDownloads(true)}>voir les emails</span></p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* CATALOGUE POPUP STATS                                          */}
      {/* ================================================================ */}
      {!loading && catalogueStats && (
        <div>
          <h2 className="text-sm font-semibold text-cockpit-primary mb-3 flex items-center gap-2">
            <Download className="w-4 h-4" style={{ color: MKT_GRADIENT.from }} />
            Catalogue PDF — Popup dimexoi.fr
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            {/* Vues */}
            <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: "var(--color-cockpit-card)", border: "1px solid var(--color-cockpit-border)" }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `linear-gradient(135deg, ${MKT_GRADIENT.from}, ${MKT_GRADIENT.to})` }}>
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-cockpit-secondary font-medium">Vues popup</p>
                <p className="text-2xl font-bold text-cockpit-primary">{catalogueStats.views}</p>
                <p className="text-[10px] text-cockpit-secondary">{annee}</p>
              </div>
            </div>
            {/* Clics */}
            <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: "var(--color-cockpit-card)", border: "1px solid var(--color-cockpit-border)" }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `linear-gradient(135deg, ${MKT_GRADIENT.from}, ${MKT_GRADIENT.to})` }}>
                <Download className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-cockpit-secondary font-medium">Clics catalogue PDF</p>
                <p className="text-2xl font-bold text-cockpit-primary">{catalogueStats.clicks}</p>
                <p className="text-[10px] text-cockpit-secondary">{annee}</p>
              </div>
            </div>
            {/* Taux clic */}
            <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: "var(--color-cockpit-card)", border: "1px solid var(--color-cockpit-border)" }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `linear-gradient(135deg, ${MKT_GRADIENT.from}, ${MKT_GRADIENT.to})` }}>
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-cockpit-secondary font-medium">Taux de clic</p>
                <p className="text-2xl font-bold text-cockpit-primary">{catalogueStats.tauxClic}%</p>
                <p className="text-[10px] text-cockpit-secondary">clics / vues</p>
              </div>
            </div>
          </div>
          {/* Sources */}
          {(catalogueStats.referrers.length > 0 || catalogueStats.sources.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {catalogueStats.referrers.length > 0 && (
                <div className="rounded-xl p-4" style={{ background: "var(--color-cockpit-card)", border: "1px solid var(--color-cockpit-border)" }}>
                  <p className="text-xs font-semibold text-cockpit-secondary mb-2">Provenance (referrer)</p>
                  <div className="space-y-1">
                    {catalogueStats.referrers.map((r) => (
                      <div key={r.domain} className="flex justify-between text-xs">
                        <span className="text-cockpit-primary truncate max-w-[70%]">{r.domain || "Direct"}</span>
                        <span className="text-cockpit-secondary font-medium">{r.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {catalogueStats.sources.length > 0 && (
                <div className="rounded-xl p-4" style={{ background: "var(--color-cockpit-card)", border: "1px solid var(--color-cockpit-border)" }}>
                  <p className="text-xs font-semibold text-cockpit-secondary mb-2">Sources UTM</p>
                  <div className="space-y-1">
                    {catalogueStats.sources.map((s) => (
                      <div key={s.source} className="flex justify-between text-xs">
                        <span className="text-cockpit-primary truncate max-w-[70%]">{s.source}</span>
                        <span className="text-cockpit-secondary font-medium">{s.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Liens de suivi */}
          <div className="rounded-xl p-4 mt-3" style={{ background: "var(--color-cockpit-card)", border: "1px solid var(--color-cockpit-border)" }}>
            <p className="text-xs font-semibold text-cockpit-secondary mb-3">Liens de suivi — à partager par canal</p>
            <div className="space-y-2">
              {[
                { label: "Instagram / Story", source: "instagram", medium: "social" },
                { label: "Facebook / Post", source: "facebook", medium: "social" },
                { label: "Meta Ads", source: "meta-ads", medium: "paid" },
                { label: "Google Ads", source: "google-ads", medium: "paid" },
                { label: "WhatsApp", source: "whatsapp", medium: "direct" },
                { label: "Email / Newsletter", source: "email", medium: "email" },
                { label: "SMS", source: "sms", medium: "direct" },
              ].map(({ label, source, medium }) => {
                const url = `https://www.dimexoi.fr/catalogue-track?utm_source=${source}&utm_medium=${medium}&utm_campaign=catalogue-${annee}`;
                return (
                  <div key={source} className="flex items-center justify-between gap-2">
                    <span className="text-xs text-cockpit-primary w-36 flex-shrink-0">{label}</span>
                    <span className="text-[10px] text-cockpit-secondary truncate flex-1 font-mono">{url}</span>
                    <button
                      onClick={() => { navigator.clipboard.writeText(url); addToast("Lien copié", "success"); }}
                      className="text-[10px] px-2 py-1 rounded bg-cockpit-dark text-cockpit-secondary hover:text-cockpit-primary flex-shrink-0 border border-cockpit"
                    >
                      Copier
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* TABLEAU MENSUEL                                                 */}
      {/* ================================================================ */}
      {!loading && data && (
        <div>
          <h2 className="text-sm font-semibold text-cockpit-primary mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" style={{ color: MKT_GRADIENT.from }} />
            Performance mensuelle
          </h2>

          {/* Desktop table */}
          <div className="hidden md:block bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cockpit text-cockpit-secondary text-xs">
                  <th className="text-left px-4 py-3 font-medium">Mois</th>
                  <th className="text-right px-4 py-3 font-medium">CA BDC (€)</th>
                  {data.meta?.available && (
                    <th className="text-right px-4 py-3 font-medium">Meta (€)</th>
                  )}
                  {data.google?.available && (
                    <th className="text-right px-4 py-3 font-medium">Google (€)</th>
                  )}
                  <th className="text-right px-4 py-3 font-medium">Dépenses (€)</th>
                  <th className="text-right px-4 py-3 font-medium">ROAS</th>
                </tr>
              </thead>
              <tbody>
                {data.mois.map((m) => (
                  <tr key={m.periode} className="border-b border-cockpit/50 hover:bg-cockpit-dark/50 transition-colors">
                    <td className="px-4 py-3 text-cockpit-primary font-medium">
                      {formatPeriode(m.periode)}
                    </td>
                    <td className="px-4 py-3 text-right text-cockpit-primary">
                      {formatEUR(m.ca)}
                    </td>
                    {data.meta?.available && (
                      <td className="px-4 py-3 text-right text-cockpit-secondary text-xs">
                        {m.metaSpend > 0 ? formatEUR(m.metaSpend) : "—"}
                      </td>
                    )}
                    {data.google?.available && (
                      <td className="px-4 py-3 text-right text-cockpit-secondary text-xs">
                        {m.googleSpend > 0 ? formatEUR(m.googleSpend) : "—"}
                      </td>
                    )}
                    <td className="px-4 py-3 text-right text-cockpit-primary">
                      {formatEUR(m.depenses)}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-semibold ${
                        m.roas >= 1 ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      {m.roas.toFixed(2)}x
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {data.mois.map((m) => (
              <div
                key={m.periode}
                className="bg-cockpit-card rounded-lg border border-cockpit p-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-cockpit-primary">
                    {formatPeriode(m.periode)}
                  </span>
                  <span
                    className={`text-sm font-bold ${
                      m.roas >= 1 ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {m.roas.toFixed(2)}x
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-cockpit-secondary">
                  <span>CA : {formatEUR(m.ca)}</span>
                  <span>Dép. : {formatEUR(m.depenses)}</span>
                </div>
                {(data.meta?.available || data.google?.available) && (
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-cockpit-secondary">
                    {data.meta?.available && m.metaSpend > 0 && (
                      <span>Meta : {formatEUR(m.metaSpend)}</span>
                    )}
                    {data.google?.available && m.googleSpend > 0 && (
                      <span>Google : {formatEUR(m.googleSpend)}</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* SOURCES DES DEMANDES                                            */}
      {/* ================================================================ */}
      {!loading && demandesSources && demandesSources.total > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-cockpit-primary mb-3 flex items-center gap-2">
            <User className="w-4 h-4" style={{ color: MKT_GRADIENT.from }} />
            Sources des demandes — {demandesSources.total} leads {annee}
          </h2>

          {/* Totaux par source */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
            {demandesSources.sources.map((s) => (
              <div key={s.source} className="bg-cockpit-card rounded-xl border border-cockpit p-3">
                <p className="text-[10px] text-cockpit-secondary font-medium uppercase tracking-wide">{s.label}</p>
                <p className="text-2xl font-bold text-cockpit-primary">{s.total}</p>
                <p className="text-[10px] text-cockpit-secondary">{Math.round((s.total / demandesSources.total) * 100)}% du total</p>
              </div>
            ))}
          </div>

          {/* Tableau mensuel desktop */}
          <div className="hidden md:block bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cockpit text-cockpit-secondary text-xs">
                  <th className="text-left px-4 py-3 font-medium">Mois</th>
                  {demandesSources.sources.map((s) => (
                    <th key={s.source} className="text-right px-4 py-3 font-medium">{s.label}</th>
                  ))}
                  <th className="text-right px-4 py-3 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {demandesSources.tableau.filter((m) => (m.total as number) > 0).map((m) => (
                  <tr key={m.mois as string} className="border-b border-cockpit/50 hover:bg-cockpit-dark/50 transition-colors">
                    <td className="px-4 py-3 text-cockpit-primary font-medium">{formatPeriode(m.mois as string)}</td>
                    {demandesSources.sources.map((s) => (
                      <td key={s.source} className="px-4 py-3 text-right text-cockpit-secondary">
                        {(m[s.source] as number) > 0 ? m[s.source] as number : "—"}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right font-semibold text-cockpit-primary">{m.total as number}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="md:hidden space-y-2">
            {demandesSources.tableau.filter((m) => (m.total as number) > 0).map((m) => (
              <div key={m.mois as string} className="bg-cockpit-card rounded-xl border border-cockpit p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-cockpit-primary font-medium">{formatPeriode(m.mois as string)}</span>
                  <span className="text-sm font-bold text-cockpit-primary">{m.total as number} leads</span>
                </div>
                <div className="flex gap-3 flex-wrap">
                  {demandesSources.sources.filter((s) => (m[s.source] as number) > 0).map((s) => (
                    <span key={s.source} className="text-[10px] text-cockpit-secondary">
                      {s.label} : <span className="font-semibold text-cockpit-primary">{m[s.source] as number}</span>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* RÉPARTITION PAR CANAL                                           */}
      {/* ================================================================ */}
      {!loading && data && data.depensesParType.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-cockpit-primary mb-3 flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" style={{ color: MKT_GRADIENT.from }} />
            Répartition par canal
          </h2>

          <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg p-4 sm:p-5 space-y-3">
            {data.depensesParType.map((d) => {
              const pct = maxDepense > 0 ? (d.montant / maxDepense) * 100 : 0;
              const color = CANAL_COLORS[d.type] || CANAL_COLORS.other;
              return (
                <div key={d.type}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-cockpit-primary font-medium">{d.label}</span>
                    <span className="text-sm text-cockpit-secondary font-medium">
                      {formatEUR(d.montant)}
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-cockpit-dark overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* LISTE DES DÉPENSES                                              */}
      {/* ================================================================ */}
      {!loading && data && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-cockpit-primary flex items-center gap-2">
              <Euro className="w-4 h-4" style={{ color: MKT_GRADIENT.from }} />
              Détail des dépenses
            </h2>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{
                background: `linear-gradient(135deg, ${MKT_GRADIENT.from}, ${MKT_GRADIENT.to})`,
                boxShadow: `0 4px 14px ${MKT_GRADIENT.shadow}`,
              }}
            >
              <Plus className="w-4 h-4" />
              Ajouter une dépense
            </button>
          </div>

          {data.couts.length === 0 ? (
            <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg p-8 text-center">
              <Euro className="w-8 h-8 text-cockpit-secondary mx-auto mb-2" />
              <p className="text-cockpit-secondary text-sm">Aucune dépense enregistrée</p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-cockpit text-cockpit-secondary text-xs">
                      <th className="text-left px-4 py-3 font-medium">Période</th>
                      <th className="text-left px-4 py-3 font-medium">Type</th>
                      <th className="text-left px-4 py-3 font-medium">Libellé</th>
                      <th className="text-right px-4 py-3 font-medium">Montant</th>
                      <th className="text-left px-4 py-3 font-medium">Ajouté par</th>
                      {isAdmin && (
                        <th className="text-center px-4 py-3 font-medium w-12" />
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {data.couts.map((c) => {
                      const typeLabel =
                        data.typesCout.find((t) => t.value === c.type)?.label || c.type;
                      return (
                        <tr
                          key={c.id}
                          className="border-b border-cockpit/50 hover:bg-cockpit-dark/50 transition-colors"
                        >
                          <td className="px-4 py-3 text-cockpit-primary">
                            {formatPeriode(c.periode)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium text-white"
                              style={{
                                backgroundColor:
                                  CANAL_COLORS[c.type] || CANAL_COLORS.other,
                              }}
                            >
                              {typeLabel}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-cockpit-primary">{c.libelle}</td>
                          <td className="px-4 py-3 text-right text-cockpit-primary font-medium">
                            {formatEUR(c.montant)}
                          </td>
                          <td className="px-4 py-3 text-cockpit-secondary text-xs">
                            {c.createdBy.prenom} {c.createdBy.nom}
                          </td>
                          {isAdmin && (
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => handleDelete(c.id)}
                                disabled={deletingId === c.id}
                                className="text-cockpit-secondary hover:text-red-400 transition-colors disabled:opacity-50"
                                title="Supprimer"
                              >
                                {deletingId === c.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden space-y-2">
                {data.couts.map((c) => {
                  const typeLabel =
                    data.typesCout.find((t) => t.value === c.type)?.label || c.type;
                  return (
                    <div
                      key={c.id}
                      className="bg-cockpit-card rounded-lg border border-cockpit p-3"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-cockpit-primary truncate">
                            {c.libelle}
                          </p>
                          <p className="text-xs text-cockpit-secondary mt-0.5">
                            {formatPeriode(c.periode)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                          <span className="text-sm font-semibold text-cockpit-primary">
                            {formatEUR(c.montant)}
                          </span>
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(c.id)}
                              disabled={deletingId === c.id}
                              className="text-cockpit-secondary hover:text-red-400 transition-colors disabled:opacity-50"
                            >
                              {deletingId === c.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span
                          className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium text-white"
                          style={{
                            backgroundColor:
                              CANAL_COLORS[c.type] || CANAL_COLORS.other,
                          }}
                        >
                          {typeLabel}
                        </span>
                        <span className="text-[10px] text-cockpit-secondary">
                          {c.createdBy.prenom} {c.createdBy.nom}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ================================================================ */}
      {/* LOADING STATE                                                   */}
      {/* ================================================================ */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2
            className="w-6 h-6 animate-spin"
            style={{ color: MKT_GRADIENT.from }}
          />
        </div>
      )}

      {/* ================================================================ */}
      {/* MODAL                                                           */}
      {/* ================================================================ */}
      {showModal && data && (
        <AjouterDepenseModal
          typesCout={data.typesCout}
          onClose={() => setShowModal(false)}
          onSuccess={() => fetchData()}
        />
      )}

      {showDownloads && data && (
        <DownloadsModal
          annee={String(annee)}
          total={data.kpis.guideDownloads}
          onClose={() => setShowDownloads(false)}
        />
      )}
    </div>
  );
}
