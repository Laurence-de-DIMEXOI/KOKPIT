"use client";

import { useState, useEffect, useCallback } from "react";
import { Cormorant_Garamond } from "next/font/google";
import {
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  Crown,
  Users,
  TrendingUp,
  Loader2,
  Trash2,
  X,
  AlertTriangle,
  Check,
  Copy,
  Ticket,
  Info,
} from "lucide-react";
import { CLUB_LEVELS, CLUB_DA, type ClubLevel } from "@/data/club-grandis";

// ============================================================================
// FONTS — Cormorant Garamond (fallback pour Perandory/Burgues Script)
// ============================================================================

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-cormorant",
});

// ============================================================================
// TYPES
// ============================================================================

interface ClubMembre {
  id: string;
  sellsyContactId: string;
  email: string;
  nom: string;
  prenom: string;
  niveau: number;
  totalCommandes: number;
  totalMontant: number;
  dateEntree: string;
  dernierSync: string | null;
  brevoSynced: boolean;
  sellsySynced: boolean;
  codePromo: string | null;
  bonUtilise: boolean;
  dateBonUtilise: string | null;
}

interface StatsData {
  totalMembres: number;
  parNiveau: { niveau: number; count: number }[];
  dernierSync: string | null;
  totalCA: number;
  sansEmail: number;
}

interface MembresData {
  membres: ClubMembre[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================================
// HELPERS
// ============================================================================

function formatMontant(n: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getLevelConfig(niveau: number): ClubLevel {
  return CLUB_LEVELS.find((l) => l.niveau === niveau) || CLUB_LEVELS[0];
}

// Club green gradient
const CLUB_GRADIENT = {
  from: "#6b7318",
  to: "#3a3d0d",
  shadow: "rgba(81, 87, 18, 0.30)",
};

// ============================================================================
// PAGE
// ============================================================================

export default function ClubGrandisPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [membresData, setMembresData] = useState<MembresData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncStep, setSyncStep] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterNiveau, setFilterNiveau] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<ClubMembre | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showMemo, setShowMemo] = useState(false);

  const da = CLUB_DA;

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch("/api/club/stats");
      if (res.ok) setStats(await res.json());
    } catch (err) {
      console.error("Erreur chargement stats:", err);
    }
  }, []);

  const loadMembres = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (filterNiveau) params.set("niveau", String(filterNiveau));
      if (search.trim()) params.set("search", search.trim());
      const res = await fetch(`/api/club/membres?${params}`);
      if (res.ok) setMembresData(await res.json());
    } catch (err) {
      console.error("Erreur chargement membres:", err);
    }
  }, [page, filterNiveau, search]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([loadStats(), loadMembres()]);
      setLoading(false);
    };
    init();
  }, [loadStats, loadMembres]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      // Étape 1 : Sync commandes Sellsy
      setSyncStep("Commandes Sellsy…");
      const syncRes = await fetch("/api/club/sync", { method: "POST" });
      const syncData = await syncRes.json();
      if (!syncRes.ok) { showToast(`Erreur sync : ${syncData.error}`); setSyncing(false); return; }
      showToast(`${syncData.synced} membres synchronisés`);
      await Promise.all([loadStats(), loadMembres()]);

      // Étape 2 : Emails (boucle auto — avant tags/brevo car ils en ont besoin)
      setSyncStep("Emails…");
      let emailsRemaining = 1;
      while (emailsRemaining > 0) {
        const res = await fetch("/api/club/sync-emails", { method: "POST" });
        const data = await res.json();
        if (!res.ok) break;
        emailsRemaining = data.remaining;
        if (data.fetched === 0) break;
      }

      // Étape 3 : Tags Sellsy (boucle auto)
      setSyncStep("Tags Sellsy…");
      let tagsRemaining = 1;
      while (tagsRemaining > 0) {
        const res = await fetch("/api/club/sync-tags", { method: "POST" });
        const data = await res.json();
        if (!res.ok) break;
        tagsRemaining = data.remaining;
        if (data.synced === 0 && data.errors === 0) break;
      }

      // Étape 4 : Brevo (liste "Club Grandis" + attributs)
      setSyncStep("Liste Brevo…");
      try {
        await fetch("/api/club/sync-brevo", { method: "POST" });
      } catch {
        // Brevo optionnel — ne pas bloquer la sync
      }

      // Rafraîchir les données
      await Promise.all([loadStats(), loadMembres()]);
      showToast("Synchronisation complète terminée !");
    } catch {
      showToast("Erreur de connexion");
    }
    setSyncStep("");
    setSyncing(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/club/membres?id=${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        showToast(`${deleteTarget.prenom} ${deleteTarget.nom} retiré du programme`);
        setDeleteTarget(null);
        await Promise.all([loadStats(), loadMembres()]);
      } else {
        showToast(`Erreur : ${data.error}`);
      }
    } catch {
      showToast("Erreur de connexion");
    }
    setDeleting(false);
  };

  const handleToggleBon = async (membre: ClubMembre) => {
    try {
      const res = await fetch("/api/club/membres", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: membre.id, action: "toggle-bon" }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(
          data.membre.bonUtilise
            ? `Bon marqué utilisé — ${membre.prenom} ${membre.nom}`
            : `Bon réinitialisé — ${membre.prenom} ${membre.nom}`
        );
        await loadMembres();
      } else {
        showToast(`Erreur : ${data.error}`);
      }
    } catch {
      showToast("Erreur de connexion");
    }
  };

  const handleGenererCode = async (membre: ClubMembre) => {
    try {
      const res = await fetch("/api/club/membres", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: membre.id, action: "generer-code" }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Code généré : ${data.membre.codePromo}`);
        await loadMembres();
      } else {
        showToast(`Erreur : ${data.error}`);
      }
    } catch {
      showToast("Erreur de connexion");
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    showToast(`Code copié : ${code}`);
  };

  // @font-face pour les polices commerciales
  const fontFaceCSS = `
    @font-face {
      font-family: 'Perandory';
      src: url('/fonts/Perandory/Perandory-Regular.otf') format('opentype');
      font-weight: 400;
      font-style: normal;
      font-display: swap;
    }
    @font-face {
      font-family: 'Perandory';
      src: url('/fonts/Perandory/Perandory-Regular.otf') format('opentype');
      font-weight: 700;
      font-style: normal;
      font-display: swap;
    }
    @font-face {
      font-family: 'Burgues Script';
      src: url('/fonts/Burgues%20Script%20Regular/Burgues%20Script%20Regular.otf') format('opentype');
      font-weight: 400;
      font-style: normal;
      font-display: swap;
    }
  `;

  return (
    <div className={`space-y-4 sm:space-y-5 ${cormorant.variable}`}>
      <style dangerouslySetInnerHTML={{ __html: fontFaceCSS }} />

      {/* Toast */}
      {toast && (
        <div
          className="fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm max-w-md text-white"
          style={{ backgroundColor: da.primary }}
        >
          {toast}
        </div>
      )}

      {/* ================================================================ */}
      {/* HEADER — Logo centré + bouton sync */}
      {/* ================================================================ */}
      <div className="flex flex-col items-center gap-3">
        <img
          src="/images/club-grandis-logo.png"
          alt="Club Grandis"
          className="w-72 sm:w-96 h-auto"
        />
        <p className="text-cockpit-secondary text-sm">
          Programme de fidélité · {stats?.totalMembres || 0} membres
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: da.primary }}
          >
            {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {syncing ? syncStep || "Mise à jour…" : "Mettre à jour le club"}
          </button>
          <button
            onClick={() => setShowMemo(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium border transition-all hover:opacity-90"
            style={{ borderColor: da.primary, color: da.primary }}
            title="Mémo du programme"
          >
            <Info className="w-4 h-4" />
            Mémo
          </button>
        </div>
      </div>

      {/* ================================================================ */}
      {/* KPI CARDS — gradient style KOKPIT */}
      {/* ================================================================ */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl p-4 bg-cockpit-card animate-pulse h-20" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div
            className="rounded-xl p-3 sm:p-4 flex items-center gap-3 transition-transform duration-200 hover:-translate-y-0.5"
            style={{
              background: `linear-gradient(135deg, ${CLUB_GRADIENT.from} 0%, ${CLUB_GRADIENT.to} 100%)`,
              boxShadow: `0 4px 14px ${CLUB_GRADIENT.shadow}`,
            }}
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/75 text-[10px] sm:text-xs font-medium truncate">Membres</p>
              <p className="text-lg sm:text-xl font-bold text-white">{stats?.totalMembres || 0}</p>
            </div>
          </div>

          <div
            className="rounded-xl p-3 sm:p-4 flex items-center gap-3 transition-transform duration-200 hover:-translate-y-0.5"
            style={{
              background: `linear-gradient(135deg, ${CLUB_GRADIENT.from} 0%, ${CLUB_GRADIENT.to} 100%)`,
              boxShadow: `0 4px 14px ${CLUB_GRADIENT.shadow}`,
            }}
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/75 text-[10px] sm:text-xs font-medium truncate">CA TTC</p>
              <p className="text-lg sm:text-xl font-bold text-white">{formatMontant(stats?.totalCA || 0)}</p>
            </div>
          </div>

          <div
            className="rounded-xl p-3 sm:p-4 flex items-center gap-3 transition-transform duration-200 hover:-translate-y-0.5"
            style={{
              background: `linear-gradient(135deg, ${CLUB_GRADIENT.from} 0%, ${CLUB_GRADIENT.to} 100%)`,
              boxShadow: `0 4px 14px ${CLUB_GRADIENT.shadow}`,
            }}
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
              <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/75 text-[10px] sm:text-xs font-medium truncate">Niveau max</p>
              <p className="text-lg sm:text-xl font-bold text-white">
                {stats?.parNiveau ? (() => {
                  const highestWithMembers = [...stats.parNiveau].reverse().find(p => p.count > 0);
                  return highestWithMembers ? getLevelConfig(highestWithMembers.niveau).nom : "—";
                })() : "—"}
              </p>
            </div>
          </div>

          <div
            className="rounded-xl p-3 sm:p-4 flex items-center gap-3 transition-transform duration-200 hover:-translate-y-0.5"
            style={{
              background: `linear-gradient(135deg, ${CLUB_GRADIENT.from} 0%, ${CLUB_GRADIENT.to} 100%)`,
              boxShadow: `0 4px 14px ${CLUB_GRADIENT.shadow}`,
            }}
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
              <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/75 text-[10px] sm:text-xs font-medium truncate">Dernier sync</p>
              <p className="text-sm sm:text-base font-bold text-white truncate">
                {stats?.dernierSync
                  ? new Date(stats.dernierSync).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) +
                    " " + new Date(stats.dernierSync).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
                  : "—"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* NIVEAUX — cards filtrables */}
      {/* ================================================================ */}
      <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg p-4 sm:p-5">
        <h2
          className="text-lg font-bold mb-4"
          style={{ fontFamily: da.fontDisplay, color: da.primary }}
        >
          Répartition par niveau
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {CLUB_LEVELS.map((level) => {
            const count = stats?.parNiveau.find((p) => p.niveau === level.niveau)?.count || 0;
            const isActive = filterNiveau === level.niveau;
            return (
              <button
                key={level.niveau}
                onClick={() => { setFilterNiveau(isActive ? null : level.niveau); setPage(1); }}
                className="rounded-xl p-3 sm:p-4 text-left transition-all border hover:-translate-y-0.5"
                style={{
                  backgroundColor: isActive ? da.primary : undefined,
                  borderColor: isActive ? da.primary : "var(--color-border, #E8EAED)",
                  boxShadow: isActive ? `0 4px 12px rgba(81,87,18,0.25)` : undefined,
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: isActive ? "#fff" : da.primary,
                      color: isActive ? da.primary : "#fff",
                    }}
                  >
                    {level.chiffre}
                  </span>
                  <span
                    className="text-xs font-medium truncate"
                    style={{ color: isActive ? "rgba(255,255,255,0.7)" : undefined }}
                  >
                    {level.nom}
                  </span>
                </div>
                <p
                  className="text-2xl font-bold"
                  style={{
                    color: isActive ? "#fff" : da.primary,
                    fontFamily: da.fontDisplay,
                  }}
                >
                  {count}
                </p>
                <p
                  className="text-[11px] mt-1"
                  style={{ color: isActive ? "rgba(255,255,255,0.6)" : undefined }}
                >
                  -{level.remise}%
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* ================================================================ */}
      {/* SEARCH + FILTER — style KOKPIT */}
      {/* ================================================================ */}
      <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cockpit-secondary" />
            <input
              type="text"
              placeholder="Rechercher un membre…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 border border-cockpit-input rounded-input bg-cockpit-input text-cockpit-primary text-sm focus:outline-none"
            />
          </div>
          <select
            value={filterNiveau || ""}
            onChange={(e) => { setFilterNiveau(e.target.value ? parseInt(e.target.value) : null); setPage(1); }}
            className="bg-cockpit-input border border-cockpit-input px-3 py-2.5 rounded-input text-xs text-cockpit-primary"
          >
            <option value="">Tous les niveaux</option>
            {CLUB_LEVELS.map((l) => (
              <option key={l.niveau} value={l.niveau}>
                {l.chiffre} — {l.nom}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ================================================================ */}
      {/* TABLE — style KOKPIT */}
      {/* ================================================================ */}
      <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-cockpit" style={{ backgroundColor: da.primary }}>
              <tr>
                <th className="text-left px-4 lg:px-6 py-3 text-xs font-semibold text-white">MEMBRE</th>
                <th className="text-left px-4 lg:px-6 py-3 text-xs font-semibold text-white hidden md:table-cell">EMAIL</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-white">NIVEAU</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-white hidden sm:table-cell">CMD</th>
                <th className="text-right px-4 lg:px-6 py-3 text-xs font-semibold text-white">CA TTC</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-white hidden lg:table-cell">CODE PROMO</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-white hidden sm:table-cell">BON</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-white w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cockpit">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={8} className="px-4 py-4">
                      <div className="h-4 rounded animate-pulse bg-cockpit-dark" />
                    </td>
                  </tr>
                ))
              ) : membresData?.membres.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <Crown className="w-8 h-8 mx-auto mb-2 text-cockpit-secondary opacity-40" />
                    <p className="text-cockpit-primary font-medium">Aucun membre trouvé</p>
                    <p className="text-cockpit-secondary text-xs mt-1">
                      Lancez une synchronisation Sellsy pour peupler le Club
                    </p>
                  </td>
                </tr>
              ) : (
                membresData?.membres.map((m) => {
                  const level = getLevelConfig(m.niveau);
                  return (
                    <tr
                      key={m.id}
                      className="hover:bg-cockpit-dark transition-colors"
                    >
                      <td className="px-4 lg:px-6 py-3">
                        <span className="font-medium text-sm" style={{ color: da.primary }}>
                          {m.prenom} {m.nom}
                        </span>
                      </td>
                      <td className="px-4 lg:px-6 py-3 text-cockpit-secondary text-xs truncate max-w-[200px] hidden md:table-cell">
                        {m.email || "—"}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span
                          className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                          style={{ backgroundColor: da.primary }}
                        >
                          {level.chiffre}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center hidden sm:table-cell text-sm font-medium text-cockpit-primary">
                        {m.totalCommandes}
                      </td>
                      <td className="px-4 lg:px-6 py-3 text-right font-semibold text-sm text-cockpit-heading">
                        {formatMontant(m.totalMontant)}
                      </td>
                      <td className="px-3 py-3 text-center hidden lg:table-cell">
                        {m.codePromo ? (
                          <div className="inline-flex items-center gap-1">
                            <code
                              className="text-[11px] font-mono px-2 py-0.5 rounded-md border"
                              style={{ borderColor: da.border, color: da.primary, backgroundColor: "rgba(81,87,18,0.06)" }}
                            >
                              {m.codePromo}
                            </code>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleCopyCode(m.codePromo!); }}
                              className="p-1 rounded hover:bg-cockpit-dark transition-colors text-cockpit-secondary"
                              title="Copier le code"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleGenererCode(m); }}
                            className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-md border border-dashed transition-all hover:border-solid"
                            style={{ borderColor: da.textMuted, color: da.textMuted }}
                            title="Générer un code promo"
                          >
                            <Ticket className="w-3 h-3" />
                            Générer
                          </button>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center hidden sm:table-cell">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleToggleBon(m); }}
                          className={`inline-flex items-center justify-center w-7 h-7 rounded-lg border-2 transition-all ${
                            m.bonUtilise
                              ? "border-green-500 bg-green-500 text-white"
                              : "border-cockpit-input bg-cockpit-input text-transparent hover:border-green-300"
                          }`}
                          title={m.bonUtilise ? `Utilisé le ${formatDate(m.dateBonUtilise)}` : "Marquer comme utilisé"}
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </td>
                      <td className="px-2 py-3 text-center">
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteTarget(m); }}
                          className="p-1.5 rounded-md hover:bg-red-50 text-cockpit-secondary hover:text-red-500 transition-colors"
                          title="Retirer du programme"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {membresData && membresData.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 lg:px-6 py-3 border-t border-cockpit">
            <p className="text-xs text-cockpit-secondary">
              {membresData.pagination.total} membres · Page {page}/{membresData.pagination.totalPages}
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-md hover:bg-cockpit-dark disabled:opacity-30 transition-colors text-cockpit-primary"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(membresData.pagination.totalPages, p + 1))}
                disabled={page >= membresData.pagination.totalPages}
                className="p-1.5 rounded-md hover:bg-cockpit-dark disabled:opacity-30 transition-colors text-cockpit-primary"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ================================================================ */}
      {/* LÉGENDE NIVEAUX — style KOKPIT */}
      {/* ================================================================ */}
      <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg p-4 sm:p-5">
        <h3
          className="text-lg font-bold text-cockpit-heading mb-4"
          style={{ fontFamily: da.fontDisplay, color: da.primary }}
        >
          Niveaux du programme
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {CLUB_LEVELS.map((level) => (
            <div
              key={level.niveau}
              className="rounded-xl p-4 bg-cockpit-dark border border-cockpit/50"
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="text-[11px] font-bold px-2 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: da.primary }}
                >
                  {level.chiffre}
                </span>
                <span
                  className="font-semibold text-sm"
                  style={{ color: da.primary, fontFamily: da.fontDisplay }}
                >
                  {level.nom}
                </span>
              </div>
              <p className="text-xs text-cockpit-secondary mt-1">
                {level.condition}
              </p>
              <p className="text-sm font-bold mt-1" style={{ color: da.primary }}>
                -{level.remise}%
              </p>
              {level.permanent && (
                <p className="text-[10px] text-cockpit-secondary mt-1 italic">
                  Permanent · À vie
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ================================================================ */}
      {/* MODALE CONFIRMATION SUPPRESSION */}
      {/* ================================================================ */}
      {/* ================================================================ */}
      {/* MODALE MÉMO PROGRAMME */}
      {/* ================================================================ */}
      {showMemo && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm overflow-y-auto py-8">
          <div className="bg-cockpit-card border border-cockpit rounded-2xl shadow-cockpit-lg w-full max-w-2xl mx-4 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-cockpit" style={{ backgroundColor: da.primary }}>
              <h3 className="font-bold text-white text-lg" style={{ fontFamily: da.fontDisplay }}>
                Club Grandis — Mémo programme
              </h3>
              <button
                onClick={() => setShowMemo(false)}
                className="p-1.5 rounded-md hover:bg-white/20 transition-colors text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-6 max-h-[75vh] overflow-y-auto text-sm text-cockpit-primary">
              {/* Concept */}
              <div>
                <p className="text-cockpit-secondary italic">
                  Programme de fidélité nommé d&apos;après le <strong>Tectona Grandis</strong>, nom scientifique du teck.
                  Chaque palier porte le nom d&apos;une partie de l&apos;arbre.
                </p>
              </div>

              {/* Tableau niveaux */}
              <div>
                <h4 className="font-bold mb-2" style={{ color: da.primary, fontFamily: da.fontDisplay }}>Les 5 niveaux</h4>
                <table className="w-full text-xs border border-cockpit rounded-lg overflow-hidden">
                  <thead>
                    <tr style={{ backgroundColor: da.primary }}>
                      <th className="text-left px-3 py-2 text-white font-semibold">Niveau</th>
                      <th className="text-left px-3 py-2 text-white font-semibold">Nom</th>
                      <th className="text-right px-3 py-2 text-white font-semibold">Seuil</th>
                      <th className="text-right px-3 py-2 text-white font-semibold">Remise</th>
                      <th className="text-right px-3 py-2 text-white font-semibold">Validité</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cockpit">
                    <tr><td className="px-3 py-2 font-bold" style={{ color: da.primary }}>I</td><td className="px-3 py-2">L&apos;Écorce</td><td className="px-3 py-2 text-right">1 cmd ≥ 500 €</td><td className="px-3 py-2 text-right font-bold" style={{ color: da.primary }}>-5%</td><td className="px-3 py-2 text-right">3 mois</td></tr>
                    <tr><td className="px-3 py-2 font-bold" style={{ color: da.primary }}>II</td><td className="px-3 py-2">L&apos;Aubier</td><td className="px-3 py-2 text-right">Cumul ≥ 2 000 €</td><td className="px-3 py-2 text-right font-bold" style={{ color: da.primary }}>-10%</td><td className="px-3 py-2 text-right">6 mois</td></tr>
                    <tr><td className="px-3 py-2 font-bold" style={{ color: da.primary }}>III</td><td className="px-3 py-2">Le Cœur</td><td className="px-3 py-2 text-right">Cumul ≥ 5 000 €</td><td className="px-3 py-2 text-right font-bold" style={{ color: da.primary }}>-15%</td><td className="px-3 py-2 text-right">9 mois</td></tr>
                    <tr><td className="px-3 py-2 font-bold" style={{ color: da.primary }}>IV</td><td className="px-3 py-2">Le Grain</td><td className="px-3 py-2 text-right">Cumul ≥ 10 000 €</td><td className="px-3 py-2 text-right font-bold" style={{ color: da.primary }}>-20%</td><td className="px-3 py-2 text-right">12 mois</td></tr>
                    <tr><td className="px-3 py-2 font-bold" style={{ color: da.primary }}>V</td><td className="px-3 py-2">Le Tectona</td><td className="px-3 py-2 text-right">Cumul ≥ 20 000 €</td><td className="px-3 py-2 text-right font-bold" style={{ color: da.primary }}>-25%</td><td className="px-3 py-2 text-right font-bold">À vie</td></tr>
                  </tbody>
                </table>
              </div>

              {/* Avantages */}
              <div>
                <h4 className="font-bold mb-2" style={{ color: da.primary, fontFamily: da.fontDisplay }}>Avantages par niveau</h4>
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-cockpit-dark">
                    <p className="font-bold text-xs mb-1" style={{ color: da.primary }}>I — L&apos;Écorce</p>
                    <ul className="text-xs text-cockpit-secondary space-y-0.5 list-disc list-inside">
                      <li>Bon de remise nominatif et personnel</li>
                      <li>Espace personnel : suivi de commande et historique des bons</li>
                      <li>Newsletter exclusive Club Grandis</li>
                    </ul>
                  </div>
                  <div className="p-3 rounded-lg bg-cockpit-dark">
                    <p className="font-bold text-xs mb-1" style={{ color: da.primary }}>II — L&apos;Aubier <span className="font-normal text-cockpit-secondary">(+ avantages du I)</span></p>
                    <ul className="text-xs text-cockpit-secondary space-y-0.5 list-disc list-inside">
                      <li>Accès aux ventes privées</li>
                      <li>Livraison offerte dès 1 500 € d&apos;achat</li>
                    </ul>
                  </div>
                  <div className="p-3 rounded-lg bg-cockpit-dark">
                    <p className="font-bold text-xs mb-1" style={{ color: da.primary }}>III — Le Cœur <span className="font-normal text-cockpit-secondary">(+ avantages du II)</span></p>
                    <ul className="text-xs text-cockpit-secondary space-y-0.5 list-disc list-inside">
                      <li>Accès aux avant-premières des nouvelles collections</li>
                    </ul>
                  </div>
                  <div className="p-3 rounded-lg bg-cockpit-dark">
                    <p className="font-bold text-xs mb-1" style={{ color: da.primary }}>IV — Le Grain <span className="font-normal text-cockpit-secondary">(+ avantages du III)</span></p>
                    <ul className="text-xs text-cockpit-secondary space-y-0.5 list-disc list-inside">
                      <li>Remise chez l&apos;un de nos partenaires hôteliers*</li>
                    </ul>
                    <p className="text-[10px] text-cockpit-secondary mt-1 italic">*voir conditions en showroom</p>
                  </div>
                  <div className="p-3 rounded-lg bg-cockpit-dark">
                    <p className="font-bold text-xs mb-1" style={{ color: da.primary }}>V — Le Tectona</p>
                    <ul className="text-xs text-cockpit-secondary space-y-0.5 list-disc list-inside">
                      <li>Cadeau pour avoir atteint le palier</li>
                      <li>Carte membre personnalisée à votre nom</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Conditions */}
              <div>
                <h4 className="font-bold mb-2" style={{ color: da.primary, fontFamily: da.fontDisplay }}>Conditions clés</h4>
                <ul className="text-xs text-cockpit-secondary space-y-1.5">
                  <li><strong className="text-cockpit-primary">Périmètre :</strong> meubles en teck massif uniquement (catalogue + sur-mesure). Exclut livraison, montage, accessoires, autres matières</li>
                  <li><strong className="text-cockpit-primary">Nominatif :</strong> chaque bon est personnel et incessible</li>
                  <li><strong className="text-cockpit-primary">Usage unique :</strong> utilisable 1 fois dans le délai de validité (sauf niv. V = à vie)</li>
                  <li><strong className="text-cockpit-primary">Non cumulable :</strong> pas cumulable avec promos, soldes, offres spéciales. Le montant le plus avantageux est retenu</li>
                  <li><strong className="text-cockpit-primary">Non régressif :</strong> un niveau atteint est acquis, mais le bon peut expirer</li>
                  <li><strong className="text-cockpit-primary">Historique :</strong> commandes confirmées et réglées depuis 2020 prises en compte</li>
                  <li><strong className="text-cockpit-primary">Public :</strong> particuliers résidant à La Réunion</li>
                  <li><strong className="text-cockpit-primary">Exclusions du cumul :</strong> commandes annulées, remboursées ou impayées</li>
                </ul>
              </div>

              {/* Signification */}
              <div className="pb-2">
                <h4 className="font-bold mb-2" style={{ color: da.primary, fontFamily: da.fontDisplay }}>Signification des paliers</h4>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { chiffre: "I", nom: "L'Écorce", desc: "Première couche protectrice" },
                    { chiffre: "II", nom: "L'Aubier", desc: "Bois vivant sous l'écorce" },
                    { chiffre: "III", nom: "Le Cœur", desc: "Le duramen, partie la plus précieuse" },
                    { chiffre: "IV", nom: "Le Grain", desc: "Texture signature de chaque pièce" },
                    { chiffre: "V", nom: "Le Tectona", desc: "L'arbre entier" },
                  ].map((p) => (
                    <div key={p.chiffre} className="text-center p-2 rounded-lg bg-cockpit-dark">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: da.primary }}>{p.chiffre}</span>
                      <p className="text-xs font-semibold mt-1" style={{ color: da.primary }}>{p.nom}</p>
                      <p className="text-[10px] text-cockpit-secondary mt-0.5">{p.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-cockpit flex justify-end">
              <button
                onClick={() => setShowMemo(false)}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
                style={{ backgroundColor: da.primary }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-cockpit-card border border-cockpit rounded-2xl shadow-cockpit-lg w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-cockpit">
              <div className="flex items-center gap-2 text-red-500">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-semibold text-cockpit-heading">Retirer du programme</h3>
              </div>
              <button
                onClick={() => setDeleteTarget(null)}
                className="p-1.5 rounded-md hover:bg-cockpit-dark transition-colors text-cockpit-secondary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-5 py-5">
              <p className="text-cockpit-primary text-sm">
                Retirer <strong>{deleteTarget.prenom} {deleteTarget.nom}</strong> du Club Grandis ?
              </p>
              <p className="text-cockpit-secondary text-xs mt-2">
                Ce membre (niveau {getLevelConfig(deleteTarget.niveau).chiffre} — {formatMontant(deleteTarget.totalMontant)} de CA) sera supprimé définitivement.
                Il ne sera pas recréé lors de la prochaine synchronisation, sauf si vous le souhaitez.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-cockpit">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-cockpit-primary hover:bg-cockpit-dark transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {deleting ? "Suppression…" : "Retirer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
