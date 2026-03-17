"use client";

import { useState, useEffect, useCallback } from "react";
import {
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  Tag,
  Mail,
  Crown,
  Users,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { CLUB_LEVELS, CLUB_DA, type ClubLevel } from "@/data/club-grandis";

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
}

interface StatsData {
  totalMembres: number;
  parNiveau: { niveau: number; count: number }[];
  dernierSync: string | null;
  totalCA: number;
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

// ============================================================================
// PAGE
// ============================================================================

export default function ClubGrandisPage() {
  // State
  const [stats, setStats] = useState<StatsData | null>(null);
  const [membresData, setMembresData] = useState<MembresData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncingTags, setSyncingTags] = useState(false);
  const [syncingBrevo, setSyncingBrevo] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterNiveau, setFilterNiveau] = useState<number | null>(null);
  const [page, setPage] = useState(1);

  // Fetch stats
  const loadStats = useCallback(async () => {
    try {
      const res = await fetch("/api/club/stats");
      if (res.ok) setStats(await res.json());
    } catch (err) {
      console.error("Erreur chargement stats:", err);
    }
  }, []);

  // Fetch membres
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

  // Initial load
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([loadStats(), loadMembres()]);
      setLoading(false);
    };
    init();
  }, [loadStats, loadMembres]);

  // Show toast
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  // Sync principal
  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/club/sync", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        showToast(
          `Synchronisation terminée : ${data.synced} membres, ${data.nouveaux} nouveaux, ${data.upgraded} promus`
        );
        await Promise.all([loadStats(), loadMembres()]);
      } else {
        showToast(`Erreur : ${data.error}`);
      }
    } catch {
      showToast("Erreur de connexion");
    }
    setSyncing(false);
  };

  // Sync tags Sellsy
  const handleSyncTags = async () => {
    setSyncingTags(true);
    try {
      const res = await fetch("/api/club/sync-tags", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        showToast(`Tags Sellsy : ${data.synced} synchronisés, ${data.errors} erreurs`);
        await loadMembres();
      } else {
        showToast(`Erreur : ${data.error}`);
      }
    } catch {
      showToast("Erreur de connexion");
    }
    setSyncingTags(false);
  };

  // Sync Brevo
  const handleSyncBrevo = async () => {
    setSyncingBrevo(true);
    try {
      const res = await fetch("/api/club/sync-brevo", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        showToast(`Brevo : ${data.synced} synchronisés, ${data.errors} erreurs`);
        await loadMembres();
      } else {
        showToast(`Erreur : ${data.error}`);
      }
    } catch {
      showToast("Erreur de connexion");
    }
    setSyncingBrevo(false);
  };

  // DA styles
  const da = CLUB_DA;

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: da.bg, color: da.text, fontFamily: da.fontBody }}
    >
      {/* Toast */}
      {toast && (
        <div
          className="fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm max-w-md animate-in slide-in-from-right"
          style={{ backgroundColor: da.primary, color: "#fff" }}
        >
          {toast}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ================================================================ */}
        {/* HEADER */}
        {/* ================================================================ */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
          <div className="flex items-center gap-4">
            {/* Logo */}
            <img
              src="/images/club-grandis-logo.svg"
              alt="Club Grandis"
              className="h-16 w-auto"
            />
            <div>
              <h1
                className="text-3xl font-bold tracking-tight"
                style={{ fontFamily: da.fontDisplay, color: da.primary }}
              >
                Club Grandis
              </h1>
              <p
                className="text-sm italic mt-0.5"
                style={{ color: da.textMuted, fontFamily: da.fontDisplay }}
              >
                Programme de fidélité · Croître ensemble
              </p>
            </div>
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: da.primary, color: "#fff" }}
          >
            {syncing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {syncing ? "Synchronisation…" : "Synchroniser Sellsy"}
          </button>
        </header>

        {/* ================================================================ */}
        {/* STATS CARDS */}
        {/* ================================================================ */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-28 rounded-xl animate-pulse"
                style={{ backgroundColor: da.bgCard }}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {CLUB_LEVELS.map((level) => {
              const count =
                stats?.parNiveau.find((p) => p.niveau === level.niveau)
                  ?.count || 0;
              return (
                <button
                  key={level.niveau}
                  onClick={() =>
                    setFilterNiveau(
                      filterNiveau === level.niveau ? null : level.niveau
                    )
                  }
                  className={`rounded-xl p-4 text-left transition-all hover:shadow-md ${
                    filterNiveau === level.niveau
                      ? "ring-2 shadow-md"
                      : "hover:ring-1"
                  }`}
                  style={{
                    backgroundColor: da.bgCard,
                    borderColor: level.couleur,
                    boxShadow: filterNiveau === level.niveau
                      ? `0 0 0 2px ${level.couleur}`
                      : undefined,
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: level.couleur,
                        color: "#fff",
                      }}
                    >
                      {level.chiffre}
                    </span>
                    <span
                      className="text-xs font-medium truncate"
                      style={{ color: da.textMuted }}
                    >
                      {level.nom}
                    </span>
                  </div>
                  <p
                    className="text-2xl font-bold"
                    style={{ color: level.couleur, fontFamily: da.fontDisplay }}
                  >
                    {count}
                  </p>
                  <p className="text-[11px] mt-1" style={{ color: da.textMuted }}>
                    {level.remise}% de remise
                  </p>
                </button>
              );
            })}
          </div>
        )}

        {/* Summary row */}
        {stats && (
          <div
            className="flex flex-wrap gap-6 mb-8 px-4 py-3 rounded-lg"
            style={{ backgroundColor: da.bgCard }}
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" style={{ color: da.primary }} />
              <span className="text-sm font-medium">
                {stats.totalMembres} membres
              </span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" style={{ color: da.primary }} />
              <span className="text-sm font-medium">
                CA total : {formatMontant(stats.totalCA)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm" style={{ color: da.textMuted }}>
              Dernier sync : {formatDate(stats.dernierSync)}
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* SEARCH + FILTER */}
        {/* ================================================================ */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: da.textMuted }}
            />
            <input
              type="text"
              placeholder="Rechercher un membre…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-all"
              style={{
                borderColor: da.border,
                backgroundColor: "#fff",
                fontFamily: da.fontBody,
                color: da.text,
              }}
            />
          </div>
          <select
            value={filterNiveau || ""}
            onChange={(e) => {
              setFilterNiveau(e.target.value ? parseInt(e.target.value) : null);
              setPage(1);
            }}
            className="px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-all"
            style={{
              borderColor: da.border,
              backgroundColor: "#fff",
              fontFamily: da.fontBody,
              color: da.text,
            }}
          >
            <option value="">Tous les niveaux</option>
            {CLUB_LEVELS.map((l) => (
              <option key={l.niveau} value={l.niveau}>
                {l.chiffre} — {l.nom}
              </option>
            ))}
          </select>
        </div>

        {/* ================================================================ */}
        {/* TABLE */}
        {/* ================================================================ */}
        <div
          className="rounded-xl border overflow-hidden"
          style={{ borderColor: da.border, backgroundColor: "#fff" }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: da.bgCard }}>
                  <th
                    className="text-left px-4 py-3 font-semibold"
                    style={{ color: da.textMuted }}
                  >
                    Membre
                  </th>
                  <th
                    className="text-left px-4 py-3 font-semibold hidden md:table-cell"
                    style={{ color: da.textMuted }}
                  >
                    Email
                  </th>
                  <th
                    className="text-center px-4 py-3 font-semibold"
                    style={{ color: da.textMuted }}
                  >
                    Niveau
                  </th>
                  <th
                    className="text-center px-4 py-3 font-semibold hidden sm:table-cell"
                    style={{ color: da.textMuted }}
                  >
                    Commandes
                  </th>
                  <th
                    className="text-right px-4 py-3 font-semibold"
                    style={{ color: da.textMuted }}
                  >
                    CA
                  </th>
                  <th
                    className="text-center px-4 py-3 font-semibold hidden lg:table-cell"
                    style={{ color: da.textMuted }}
                  >
                    Sellsy
                  </th>
                  <th
                    className="text-center px-4 py-3 font-semibold hidden lg:table-cell"
                    style={{ color: da.textMuted }}
                  >
                    Brevo
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      <td colSpan={7} className="px-4 py-4">
                        <div
                          className="h-4 rounded animate-pulse"
                          style={{ backgroundColor: da.bgCard }}
                        />
                      </td>
                    </tr>
                  ))
                ) : membresData?.membres.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-12 text-center"
                      style={{ color: da.textMuted }}
                    >
                      <Crown
                        className="w-8 h-8 mx-auto mb-2"
                        style={{ color: da.border }}
                      />
                      <p>Aucun membre trouvé</p>
                      <p className="text-xs mt-1">
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
                        className="border-t hover:bg-opacity-50 transition-colors"
                        style={{ borderColor: da.border }}
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium" style={{ color: da.text }}>
                            {m.prenom} {m.nom}
                          </p>
                        </td>
                        <td
                          className="px-4 py-3 hidden md:table-cell"
                          style={{ color: da.textMuted }}
                        >
                          {m.email || "—"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full"
                            style={{
                              backgroundColor: level.couleur,
                              color: "#fff",
                            }}
                          >
                            {level.chiffre} {level.nom}
                          </span>
                        </td>
                        <td
                          className="px-4 py-3 text-center hidden sm:table-cell font-medium"
                          style={{ color: da.text }}
                        >
                          {m.totalCommandes}
                        </td>
                        <td
                          className="px-4 py-3 text-right font-semibold"
                          style={{ color: da.primary }}
                        >
                          {formatMontant(m.totalMontant)}
                        </td>
                        <td className="px-4 py-3 text-center hidden lg:table-cell">
                          <span
                            className={`inline-block w-2.5 h-2.5 rounded-full ${
                              m.sellsySynced ? "bg-green-500" : "bg-orange-400"
                            }`}
                            title={
                              m.sellsySynced ? "Synchronisé" : "En attente"
                            }
                          />
                        </td>
                        <td className="px-4 py-3 text-center hidden lg:table-cell">
                          <span
                            className={`inline-block w-2.5 h-2.5 rounded-full ${
                              m.brevoSynced ? "bg-green-500" : "bg-orange-400"
                            }`}
                            title={
                              m.brevoSynced ? "Synchronisé" : "En attente"
                            }
                          />
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
            <div
              className="flex items-center justify-between px-4 py-3 border-t"
              style={{ borderColor: da.border, backgroundColor: da.bgCard }}
            >
              <p className="text-xs" style={{ color: da.textMuted }}>
                {membresData.pagination.total} membres · Page {page}/
                {membresData.pagination.totalPages}
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-1.5 rounded-md hover:bg-white/50 disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() =>
                    setPage((p) =>
                      Math.min(membresData.pagination.totalPages, p + 1)
                    )
                  }
                  disabled={page >= membresData.pagination.totalPages}
                  className="p-1.5 rounded-md hover:bg-white/50 disabled:opacity-30 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ================================================================ */}
        {/* SYNC ACTIONS */}
        {/* ================================================================ */}
        <div
          className="mt-8 rounded-xl p-6"
          style={{ backgroundColor: da.bgCard, border: `1px solid ${da.border}` }}
        >
          <h3
            className="text-lg font-bold mb-4"
            style={{ fontFamily: da.fontDisplay, color: da.primary }}
          >
            Actions de synchronisation
          </h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleSyncTags}
              disabled={syncingTags}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border transition-all hover:shadow-sm disabled:opacity-50"
              style={{
                borderColor: da.primary,
                color: da.primary,
                backgroundColor: "transparent",
              }}
            >
              {syncingTags ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Tag className="w-4 h-4" />
              )}
              {syncingTags ? "Synchronisation…" : "Sync tags Sellsy"}
            </button>
            <button
              onClick={handleSyncBrevo}
              disabled={syncingBrevo}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border transition-all hover:shadow-sm disabled:opacity-50"
              style={{
                borderColor: da.primary,
                color: da.primary,
                backgroundColor: "transparent",
              }}
            >
              {syncingBrevo ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Mail className="w-4 h-4" />
              )}
              {syncingBrevo ? "Synchronisation…" : "Sync segments Brevo"}
            </button>
          </div>
          <p className="text-xs mt-3" style={{ color: da.textMuted }}>
            Les tags Sellsy ("CLUB - Niv 1" à "CLUB - Niv 5") et les segments Brevo
            ("Club Grandis · i" à "Club Grandis · v") sont mis à jour pour les membres
            non encore synchronisés.
          </p>
        </div>

        {/* ================================================================ */}
        {/* FOOTER — LÉGENDE NIVEAUX */}
        {/* ================================================================ */}
        <div
          className="mt-8 rounded-xl p-6"
          style={{ backgroundColor: da.bgCard, border: `1px solid ${da.border}` }}
        >
          <h3
            className="text-lg font-bold mb-4"
            style={{ fontFamily: da.fontDisplay, color: da.primary }}
          >
            Niveaux du programme
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {CLUB_LEVELS.map((level) => (
              <div
                key={level.niveau}
                className="rounded-lg p-4"
                style={{
                  borderLeft: `4px solid ${level.couleur}`,
                  backgroundColor: "#fff",
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: level.couleur, color: "#fff" }}
                  >
                    {level.chiffre}
                  </span>
                  <span
                    className="font-semibold text-sm"
                    style={{
                      color: level.couleur,
                      fontFamily: da.fontDisplay,
                    }}
                  >
                    {level.nom}
                  </span>
                </div>
                <p className="text-xs mt-1" style={{ color: da.textMuted }}>
                  {level.condition}
                </p>
                <p
                  className="text-sm font-bold mt-1"
                  style={{ color: level.couleur }}
                >
                  -{level.remise}%
                </p>
                {level.permanent && (
                  <p className="text-[10px] mt-1 italic" style={{ color: da.accent }}>
                    Permanent · Sur invitation
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
