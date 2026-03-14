"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  GitCompareArrows,
  ShoppingCart,
  FileText,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Check,
  Search,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { KPICard } from "@/components/dashboard/kpi-card";
import { FreshnessIndicator } from "@/components/ui/freshness-indicator";
import { getSellsyUrl } from "@/lib/sellsy-urls";
import clsx from "clsx";
import { traduireStatut } from "@/lib/sellsy-statuts";

type Period = "week" | "month" | "year" | "all";

const PERIOD_LABELS: Record<Period, string> = {
  week: "Semaine",
  month: "Mois",
  year: "Année",
  all: "Tout",
};

function getPeriodStart(period: Period): Date | null {
  if (period === "all") return null;
  const now = new Date();
  if (period === "week") {
    const day = now.getDay();
    const diff = day === 0 ? 6 : day - 1;
    const start = new Date(now);
    start.setDate(start.getDate() - diff);
    start.setHours(0, 0, 0, 0);
    return start;
  }
  if (period === "month") return new Date(now.getFullYear(), now.getMonth(), 1);
  return new Date(now.getFullYear(), 0, 1);
}

function filterByPeriod<T extends { date?: string }>(items: T[], period: Period): T[] {
  const start = getPeriodStart(period);
  if (!start) return items;
  return items.filter((item) => {
    if (!item.date) return true;
    return new Date(item.date) >= start;
  });
}

interface Amounts {
  total_excl_tax?: string;
  total?: string;
}

interface DocSummary {
  id: number;
  number?: string;
  subject?: string;
  status?: string;
  date?: string;
  company_name?: string;
  contact_id?: number;
  amounts?: Amounts;
  ageJours?: number;
}

interface DevisConverti {
  liaisonId: string;
  estimate: DocSummary;
  order: DocSummary;
  montantDevis: number;
  montantCommande: number;
  tempsConversion: number | null;
}

interface Stats {
  totalDevis: number;
  totalCommandes: number;
  devisConvertis: number;
  commandesDirectes: number;
  tauxConversion: number;
  devisEnAttente: number;
  devisExpires: number;
  tempsConversionMoyen: number | null;
}

interface MatchingInfo {
  newLinksCreated: number;
  linksFromNumber: number;
  linksFromContact: number;
}

type TabKey = "convertis" | "directes" | "non-convertis";

function formatCurrency(val: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);
}

function getAmountHT(amounts?: Amounts): number {
  if (!amounts) return 0;
  return parseFloat(amounts.total_excl_tax || amounts.total || "0") || 0;
}

function AgeBadge({ jours }: { jours: number }) {
  const color =
    jours > 60
      ? "bg-cockpit-danger/10 text-cockpit-danger"
      : jours > 30
      ? "bg-cockpit-warning/10 text-cockpit-warning"
      : "bg-cockpit-success/10 text-cockpit-success";
  return (
    <span className={clsx("px-2 py-0.5 rounded-full text-xs font-medium", color)}>
      {jours}j
    </span>
  );
}

// ── Skeletons indépendants ──
function KPISkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-24 bg-cockpit-card rounded-xl border border-cockpit animate-pulse p-4">
          <div className="h-3 w-24 bg-cockpit-dark rounded mb-3" />
          <div className="h-6 w-16 bg-cockpit-dark rounded" />
        </div>
      ))}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg overflow-hidden">
      <div className="flex border-b border-cockpit">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex-1 px-4 py-3">
            <div className="h-4 w-32 bg-cockpit-dark rounded animate-pulse mx-auto" />
          </div>
        ))}
      </div>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="px-4 py-3 border-b border-cockpit flex gap-4 animate-pulse">
          <div className="h-4 w-24 bg-cockpit-dark rounded" />
          <div className="h-4 w-32 bg-cockpit-dark rounded" />
          <div className="h-4 w-20 bg-cockpit-dark rounded ml-auto" />
          <div className="h-4 w-24 bg-cockpit-dark rounded" />
          <div className="h-4 w-20 bg-cockpit-dark rounded" />
          <div className="h-4 w-12 bg-cockpit-dark rounded" />
        </div>
      ))}
    </div>
  );
}

export default function TracabilitePage() {
  // ── Chargement progressif en 2 phases ──
  const [statsReady, setStatsReady] = useState(false);   // Phase 1 : KPIs
  const [dataReady, setDataReady] = useState(false);      // Phase 2 : Tables
  const [refreshing, setRefreshing] = useState(false);
  const [isStale, setIsStale] = useState(false);          // Données périmées en cours de revalidation
  const [activeTab, setActiveTab] = useState<TabKey>("convertis");
  const [period, setPeriod] = useState<Period>("year");
  const [searchQuery, setSearchQuery] = useState("");

  const [devisConvertis, setDevisConvertis] = useState<DevisConverti[]>([]);
  const [commandesSansDevis, setCommandesSansDevis] = useState<DocSummary[]>([]);
  const [devisNonConvertis, setDevisNonConvertis] = useState<DocSummary[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [matchingInfo, setMatchingInfo] = useState<MatchingInfo | null>(null);
  const [cacheDate, setCacheDate] = useState<string | null>(null);

  // Phase 1 : charger les stats depuis le cache (instantané)
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/sellsy/tracabilite?mode=stats");
      const data = await res.json();
      if (data.stats) {
        setStats(data.stats);
        setMatchingInfo(data.matching || null);
        setCacheDate(data._cache?.generatedAt || null);
        setStatsReady(true);
        return data._cache?.stale ?? true; // retourne si les données sont stale
      }
      return true; // pas de cache → stale
    } catch {
      return true;
    }
  }, []);

  // Phase 2 : charger les données complètes (tables + matching)
  const fetchFullData = useCallback(async (freshForce = false) => {
    try {
      const url = freshForce ? "/api/sellsy/tracabilite?fresh=true" : "/api/sellsy/tracabilite";
      const res = await fetch(url);
      const data = await res.json();
      setDevisConvertis(data.devisConvertis || []);
      setCommandesSansDevis(data.commandesSansDevis || []);
      setDevisNonConvertis(data.devisNonConvertis || []);
      setStats(data.stats || null);
      setMatchingInfo(data.matching || null);
      setCacheDate(data._cache?.generatedAt || null);
      setStatsReady(true);
      setDataReady(true);
      setIsStale(!!data._cache?.stale);

      // Si données stale, relancer en background pour rafraîchir
      if (data._cache?.stale && !freshForce) {
        fetch("/api/sellsy/tracabilite?fresh=true")
          .then((r) => r.json())
          .then((freshData) => {
            setDevisConvertis(freshData.devisConvertis || []);
            setCommandesSansDevis(freshData.commandesSansDevis || []);
            setDevisNonConvertis(freshData.devisNonConvertis || []);
            setStats(freshData.stats || null);
            setMatchingInfo(freshData.matching || null);
            setCacheDate(freshData._cache?.generatedAt || null);
            setIsStale(false);
          })
          .catch(() => {}); // silencieux
      }
    } catch (err) {
      console.error("Erreur chargement traçabilité:", err);
    }
  }, []);

  // Rafraîchissement manuel
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchFullData(true);
    } finally {
      setRefreshing(false);
    }
  }, [fetchFullData]);

  // ── Chargement initial en 2 phases ──
  useEffect(() => {
    (async () => {
      // Phase 1 : stats instantanées depuis cache
      const stale = await fetchStats();
      // Phase 2 : données complètes (tables)
      await fetchFullData(false);
    })();
  }, [fetchStats, fetchFullData]);

  // Period-filtered data
  const sq = searchQuery.toLowerCase();
  const matchesSearch = (doc: DocSummary) =>
    !sq ||
    (doc.number || "").toLowerCase().includes(sq) ||
    (doc.subject || "").toLowerCase().includes(sq) ||
    (doc.company_name || "").toLowerCase().includes(sq);

  const filteredConvertis = useMemo(() => {
    const byPeriod = period === "all" ? devisConvertis : devisConvertis.filter((item) => {
      const start = getPeriodStart(period);
      if (!start) return true;
      const d = new Date(item.estimate.date || item.order.date || "");
      return d >= start;
    });
    return byPeriod.filter((item) => !sq || matchesSearch(item.estimate) || matchesSearch(item.order));
  }, [devisConvertis, period, sq]);

  const filteredDirectes = useMemo(() =>
    filterByPeriod(commandesSansDevis, period).filter(matchesSearch),
    [commandesSansDevis, period, sq]
  );

  const filteredNonConvertis = useMemo(() =>
    filterByPeriod(devisNonConvertis, period).filter(matchesSearch),
    [devisNonConvertis, period, sq]
  );

  // Stats recalculées en fonction des filtres période + recherche
  const filteredStats = useMemo(() => {
    const totalDevis = filteredConvertis.length + filteredNonConvertis.length;
    const nbConvertis = filteredConvertis.length;
    const tauxConversion = totalDevis > 0
      ? Math.round((nbConvertis / totalDevis) * 1000) / 10
      : 0;

    const conversions = filteredConvertis
      .map((d) => d.tempsConversion)
      .filter((t): t is number => t !== null && t !== undefined && t >= 0);
    const tempsConversionMoyen = conversions.length > 0
      ? Math.round((conversions.reduce((a, b) => a + b, 0) / conversions.length) * 10) / 10
      : null;

    const nbExpires = filteredNonConvertis.filter((e) => (e.ageJours ?? 0) > 60).length;

    return {
      totalDevis,
      totalCommandes: filteredConvertis.length + filteredDirectes.length,
      devisConvertis: nbConvertis,
      commandesDirectes: filteredDirectes.length,
      tauxConversion,
      devisEnAttente: filteredNonConvertis.length,
      devisExpires: nbExpires,
      tempsConversionMoyen,
    };
  }, [filteredConvertis, filteredDirectes, filteredNonConvertis]);

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: "convertis", label: "Devis → Commandes", count: filteredConvertis.length },
    { key: "directes", label: "Commandes directes", count: filteredDirectes.length },
    { key: "non-convertis", label: "Devis non convertis", count: filteredNonConvertis.length },
  ];

  return (
    <div className="space-y-6">
      {/* Header — toujours visible */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cockpit-info/15 flex items-center justify-center">
            <GitCompareArrows className="w-5 h-5 text-cockpit-info" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-cockpit-heading">
              Traçabilité Devis → Commandes
            </h1>
            <p className="text-sm text-cockpit-secondary">
              Liaisons automatiques par correspondance de numéro
              {isStale && (
                <span className="ml-2 text-cockpit-warning text-xs">(actualisation en cours…)</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Period filter */}
          <div className="flex items-center gap-1 bg-cockpit-card border border-cockpit rounded-lg px-1 py-1">
            {(["week", "month", "year", "all"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={clsx(
                  "px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors",
                  period === p
                    ? "text-white"
                    : "text-cockpit-secondary hover:bg-cockpit-dark"
                )}
                style={period === p ? { backgroundColor: 'var(--color-active)' } : undefined}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-cockpit text-cockpit-primary text-sm font-medium hover:bg-cockpit-dark/80 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={clsx("w-4 h-4", refreshing && "animate-spin")} />
            Actualiser
          </button>
        </div>
      </div>

      {/* Freshness indicator */}
      <FreshnessIndicator
        label="Données Sellsy"
        cacheDate={cacheDate}
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />

      {/* Nouvelles liaisons trouvées */}
      {matchingInfo && matchingInfo.newLinksCreated > 0 && (
        <div className="bg-cockpit-success/10 border border-cockpit-success/30 rounded-lg p-3 flex items-center gap-3">
          <CheckCircle2 className="w-4 h-4 text-cockpit-success flex-shrink-0" />
          <span className="text-sm text-cockpit-heading">
            {matchingInfo.newLinksCreated} nouvelle{matchingInfo.newLinksCreated > 1 ? "s" : ""} liaison{matchingInfo.newLinksCreated > 1 ? "s" : ""} trouvée{matchingInfo.newLinksCreated > 1 ? "s" : ""}
          </span>
        </div>
      )}

      {/* Barre de recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cockpit-secondary" />
        <input
          type="text"
          placeholder="Rechercher par contact, n° de devis ou n° de commande..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-cockpit-card border border-cockpit rounded-lg pl-10 pr-4 py-2.5 text-sm text-cockpit-primary placeholder:text-cockpit-secondary focus:outline-none focus:ring-2 focus:ring-cockpit-info/40"
        />
      </div>

      {/* ── KPIs — Phase 1 : s'affichent dès que les stats sont prêtes ── */}
      {!statsReady ? (
        <KPISkeleton />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <KPICard
            title="Taux de conversion"
            value={`${filteredStats.tauxConversion}%`}
            icon={<GitCompareArrows className="w-7 h-7" />}
            bgColor="bg-cockpit-yellow"
          />
          <KPICard
            title="Devis convertis"
            value={`${filteredStats.devisConvertis} / ${filteredStats.totalDevis}`}
            icon={<Check className="w-7 h-7" />}
            bgColor="bg-cockpit-success"
          />
          <KPICard
            title="Temps moyen"
            value={filteredStats.tempsConversionMoyen !== null ? `${filteredStats.tempsConversionMoyen}j` : "—"}
            icon={<Clock className="w-7 h-7" />}
            bgColor="bg-cockpit-info"
          />
          <KPICard
            title="Commandes directes"
            value={filteredStats.commandesDirectes}
            icon={<ShoppingCart className="w-7 h-7" />}
            bgColor="bg-cockpit-warning"
          />
          <KPICard
            title="Devis en attente"
            value={filteredStats.devisEnAttente}
            icon={<AlertTriangle className="w-7 h-7" />}
            bgColor={filteredStats.devisExpires > 0 ? "bg-cockpit-danger" : "bg-cockpit-warning"}
          />
        </div>
      )}

      {/* ── Tables — Phase 2 : s'affichent quand les données complètes arrivent ── */}
      {!dataReady ? (
        <TableSkeleton />
      ) : (
      <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg overflow-hidden">
        <div className="flex border-b border-cockpit">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={clsx(
                "flex-1 px-4 py-3 text-sm font-medium transition-colors relative",
                activeTab === tab.key
                  ? "text-cockpit-info border-b-2 border-cockpit-info bg-cockpit-info/5"
                  : "text-cockpit-secondary hover:text-cockpit-primary"
              )}
            >
              {tab.label}
              <span className={clsx(
                "ml-2 px-1.5 py-0.5 rounded-full text-xs",
                activeTab === tab.key
                  ? "bg-cockpit-info/15 text-cockpit-info"
                  : "bg-cockpit-dark text-cockpit-secondary"
              )}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="overflow-x-auto">
          {/* Devis convertis */}
          {activeTab === "convertis" && (
            <table className="w-full">
              <thead className="bg-cockpit-dark border-b border-cockpit">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-cockpit-heading">N° DEVIS</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-cockpit-heading">CLIENT</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-cockpit-heading">MONTANT DEVIS</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-cockpit-heading">N° COMMANDE</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-cockpit-heading">MONTANT COMMANDE</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-cockpit-heading">CONVERSION</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-cockpit-heading">SELLSY</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cockpit">
                {filteredConvertis.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center">
                      <p className="text-cockpit-heading font-semibold mb-1">Aucune liaison trouvée</p>
                      <p className="text-cockpit-secondary text-sm">Sellsy n&apos;a pas remonté de lien pour ce document.</p>
                    </td>
                  </tr>
                ) : (
                  filteredConvertis.map((item) => (
                      <tr key={item.liaisonId} className="hover:bg-cockpit-dark/50 transition-colors">
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5 text-cockpit-secondary" />
                            <a
                              href={getSellsyUrl('estimate', item.estimate.id)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-cockpit-info hover:underline flex items-center gap-1"
                            >
                              {item.estimate.number || `#${item.estimate.id}`}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-cockpit-primary">{item.estimate.company_name || "—"}</td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-cockpit-primary">{formatCurrency(item.montantDevis)}</td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center gap-2">
                            <ShoppingCart className="w-3.5 h-3.5 text-cockpit-secondary" />
                            <a
                              href={getSellsyUrl('order', item.order.id)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-cockpit-info hover:underline flex items-center gap-1"
                            >
                              {item.order.number || `#${item.order.id}`}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-cockpit-primary">{formatCurrency(item.montantCommande)}</td>
                        <td className="px-4 py-3 text-center">
                          {item.tempsConversion !== null && item.tempsConversion !== undefined ? (
                            <span className={clsx(
                              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                              item.tempsConversion === 0
                                ? "bg-cockpit-success/10 text-cockpit-success"
                                : item.tempsConversion <= 7
                                ? "bg-cockpit-info/10 text-cockpit-info"
                                : item.tempsConversion <= 30
                                ? "bg-cockpit-warning/10 text-cockpit-warning"
                                : "bg-cockpit-danger/10 text-cockpit-danger"
                            )}>
                              <Clock className="w-3 h-3" />
                              {item.tempsConversion === 0 ? "Même jour" : `${item.tempsConversion}j`}
                            </span>
                          ) : (
                            <span className="text-cockpit-secondary text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <a
                            href={getSellsyUrl('order', item.order.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-md hover:bg-cockpit-info/10 text-cockpit-secondary hover:text-cockpit-info transition-colors inline-block"
                            title="Ouvrir dans Sellsy"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </td>
                      </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* Commandes directes */}
          {activeTab === "directes" && (
            <table className="w-full">
              <thead className="bg-cockpit-dark border-b border-cockpit">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-cockpit-heading">N° COMMANDE</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-cockpit-heading">CLIENT</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-cockpit-heading">MONTANT HT</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-cockpit-heading">DATE</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-cockpit-heading">STATUT</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-cockpit-heading">SELLSY</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cockpit">
                {filteredDirectes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-cockpit-secondary text-sm">
                      Toutes les commandes sont liées à un devis.
                    </td>
                  </tr>
                ) : (
                  filteredDirectes.map((order) => (
                    <tr key={order.id} className="hover:bg-cockpit-dark/50 transition-colors">
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <ShoppingCart className="w-3.5 h-3.5 text-cockpit-secondary" />
                          <a
                            href={getSellsyUrl('order', order.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-cockpit-info hover:underline flex items-center gap-1"
                          >
                            {order.number || `#${order.id}`}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-cockpit-primary">{order.company_name || "—"}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-cockpit-primary">{formatCurrency(getAmountHT(order.amounts))}</td>
                      <td className="px-4 py-3 text-sm text-cockpit-secondary">
                        {order.date ? new Date(order.date).toLocaleDateString("fr-FR") : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-cockpit-info/10 text-cockpit-info">
                          {traduireStatut(order.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <a
                          href={getSellsyUrl('order', order.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-md hover:bg-cockpit-info/10 text-cockpit-secondary hover:text-cockpit-info transition-colors inline-block"
                          title="Ouvrir dans Sellsy"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* Devis non convertis */}
          {activeTab === "non-convertis" && (
            <table className="w-full">
              <thead className="bg-cockpit-dark border-b border-cockpit">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-cockpit-heading">N° DEVIS</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-cockpit-heading">CLIENT</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-cockpit-heading">MONTANT HT</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-cockpit-heading">DATE</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-cockpit-heading">STATUT</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-cockpit-heading">ANCIENNETÉ</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-cockpit-heading">SELLSY</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cockpit">
                {filteredNonConvertis.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-cockpit-secondary text-sm">
                      Tous les devis sont liés à une commande.
                    </td>
                  </tr>
                ) : (
                  filteredNonConvertis.map((est) => (
                    <tr key={est.id} className="hover:bg-cockpit-dark/50 transition-colors">
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-cockpit-secondary" />
                          <a
                            href={getSellsyUrl('estimate', est.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-cockpit-info hover:underline flex items-center gap-1"
                          >
                            {est.number || `#${est.id}`}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-cockpit-primary">{est.company_name || "—"}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-cockpit-primary">{formatCurrency(getAmountHT(est.amounts))}</td>
                      <td className="px-4 py-3 text-sm text-cockpit-secondary">
                        {est.date ? new Date(est.date).toLocaleDateString("fr-FR") : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-cockpit-info/10 text-cockpit-info">
                          {traduireStatut(est.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {est.ageJours !== undefined && <AgeBadge jours={est.ageJours} />}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <a
                          href={getSellsyUrl('estimate', est.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-md hover:bg-cockpit-info/10 text-cockpit-secondary hover:text-cockpit-info transition-colors inline-block"
                          title="Ouvrir dans Sellsy"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
