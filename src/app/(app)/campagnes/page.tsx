"use client";

import { useState, useEffect } from "react";
import { KPICard } from "@/components/dashboard/kpi-card";
import {
  BarChart3,
  DollarSign,
  RefreshCw,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Layers,
  Image,
  MousePointer,
  Eye,
  Clock,
  Calendar,
  Bug,
} from "lucide-react";

// ===== TYPES =====

interface MetaInsight {
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  cpc: number;
  ctr: number;
  costPerResult: number;
  actions?: Record<string, number>;
}

interface MetaAd {
  id: string;
  name: string;
  status: string;
  thumbnailUrl?: string;
  insights: MetaInsight;
}

interface MetaAdSet {
  id: string;
  name: string;
  status: string;
  dailyBudget: number;
  lifetimeBudget: number;
  targeting?: string;
  optimization?: string;
  insights: MetaInsight;
  ads: MetaAd[];
}

interface MetaCampaign {
  id: string;
  name: string;
  status: string;
  objective?: string;
  dailyBudget: number;
  lifetimeBudget: number;
  startDate?: string;
  endDate?: string;
  insights: MetaInsight;
  adsets: MetaAdSet[];
}

// ===== HELPERS =====

const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
  ACTIVE: { label: "Active", bg: "bg-[#8DA035]/10", text: "text-[#8DA035]" },
  PAUSED: { label: "Pause", bg: "bg-[#E2A90A]/10", text: "text-[#E2A90A]" },
  ARCHIVED: { label: "Archivée", bg: "bg-[#8592A3]/10", text: "text-[#8592A3]" },
  DELETED: { label: "Supprimée", bg: "bg-[#C2185B]/10", text: "text-[#C2185B]" },
};

const periodOptions = [
  { value: "maximum", label: "Toute la période" },
  { value: "today", label: "Aujourd'hui" },
  { value: "yesterday", label: "Hier" },
  { value: "last_7d", label: "7 derniers jours" },
  { value: "last_30d", label: "30 derniers jours" },
  { value: "this_month", label: "Ce mois-ci" },
  { value: "last_month", label: "Mois dernier" },
  { value: "this_year", label: "Cette année" },
  { value: "last_year", label: "Année dernière" },
];

const StatusBadge = ({ status }: { status: string }) => {
  const cfg = statusConfig[status] || statusConfig.PAUSED;
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  );
};

const fmt = (n: number) => n.toLocaleString("fr-FR");
const fmtEur = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(n);

const InsightsCells = ({ i, size = "sm" }: { i: MetaInsight; size?: "sm" | "xs" }) => {
  const ts = size === "xs" ? "text-[10px]" : "text-xs";
  return (
    <>
      <td className={`px-3 py-2 text-right ${ts} text-cockpit-primary font-medium`}>{fmtEur(i.spend)}</td>
      <td className={`px-3 py-2 text-right ${ts} text-cockpit-secondary`}>{fmt(i.impressions)}</td>
      <td className={`px-3 py-2 text-right ${ts} text-cockpit-secondary`}>{fmt(i.clicks)}</td>
      <td className={`px-3 py-2 text-right ${ts} text-cockpit-secondary hidden xl:table-cell`}>{i.ctr.toFixed(2)}%</td>
      <td className={`px-3 py-2 text-right ${ts} text-cockpit-secondary hidden xl:table-cell`}>{fmtEur(i.cpc)}</td>
      <td className={`px-3 py-2 text-right ${ts} text-cockpit-primary font-medium`}>{i.conversions}</td>
    </>
  );
};

function parseCachedCampaign(c: any): MetaCampaign {
  const ins = c.metaInsights || {};
  const cachedAdsets = ins.adsets || [];
  const adsets: MetaAdSet[] = cachedAdsets.map((as: any) => ({
    id: as.id, name: as.name, status: as.status,
    dailyBudget: as.dailyBudget || 0, lifetimeBudget: as.lifetimeBudget || 0,
    targeting: as.targeting, optimization: as.optimization,
    insights: {
      spend: as.insights?.spend || 0, impressions: as.insights?.impressions || 0,
      clicks: as.insights?.clicks || 0, conversions: as.insights?.conversions || 0,
      cpc: as.insights?.cpc || 0, ctr: as.insights?.ctr || 0, costPerResult: 0,
    },
    ads: (as.ads || []).map((ad: any) => ({
      id: ad.id, name: ad.name, status: ad.status, thumbnailUrl: ad.thumbnailUrl,
      insights: {
        spend: ad.insights?.spend || 0, impressions: ad.insights?.impressions || 0,
        clicks: ad.insights?.clicks || 0, conversions: ad.insights?.conversions || 0,
        cpc: ad.insights?.cpc || 0, ctr: ad.insights?.ctr || 0, costPerResult: 0,
      },
    })),
  }));

  return {
    id: c.metaCampaignId || c.id, name: c.nom,
    status: ins.status || (c.actif ? "ACTIVE" : "PAUSED"),
    objective: ins.objective || "", dailyBudget: ins.budget || 0, lifetimeBudget: 0,
    startDate: c.dateDebut, endDate: c.dateFin,
    insights: {
      spend: ins.spend || 0, impressions: ins.impressions || 0,
      clicks: ins.clicks || 0, conversions: ins.conversions || 0,
      cpc: ins.cpc || 0, ctr: ins.ctr || 0, costPerResult: 0,
    },
    adsets,
  };
}

// ===== MAIN COMPONENT =====

export default function CampagnesPage() {
  const [campaigns, setCampaigns] = useState<MetaCampaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncedAt, setSyncedAt] = useState<string | null>(null);
  const [expandedCampaigns, setExpandedCampaigns] = useState<Set<string>>(new Set());
  const [expandedAdSets, setExpandedAdSets] = useState<Set<string>>(new Set());
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("maximum");
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [kpis, setKpis] = useState({
    totalSpend: 0, totalImpressions: 0, totalClicks: 0, totalConversions: 0,
    totalCampaigns: 0, totalAdSets: 0, totalAds: 0, campaignsWithData: 0,
  });

  useEffect(() => { loadFromCache(); }, []);

  const loadFromCache = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/campagnes?limit=100");
      if (res.ok) {
        const data = await res.json();
        const mapped: MetaCampaign[] = (data.campagnes || []).map(parseCachedCampaign);
        setCampaigns(mapped);
        computeKPIs(mapped);
        const firstWithSync = (data.campagnes || []).find((c: any) => c.metaInsights?.syncedAt);
        if (firstWithSync) setSyncedAt(firstWithSync.metaInsights.syncedAt);
      }
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleSync = async (period?: string) => {
    const p = period || selectedPeriod;
    setSyncing(true);
    setError("");
    setDebugInfo(null);
    try {
      const res = await fetch(`/api/meta/campaigns?period=${p}&debug=1`);
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns || []);
        if (data.kpis) {
          setKpis({
            totalSpend: data.kpis.totalSpend, totalImpressions: data.kpis.totalImpressions,
            totalClicks: data.kpis.totalClicks, totalConversions: data.kpis.totalConversions,
            totalCampaigns: data.kpis.totalCampaigns, totalAdSets: data.kpis.totalAdSets,
            totalAds: data.kpis.totalAds, campaignsWithData: data.kpis.campaignsWithData || 0,
          });
        }
        setSyncedAt(new Date().toISOString());
        if (data.debug) setDebugInfo(data.debug);
      } else {
        const err = await res.json();
        setError(err.error || "Erreur sync Meta");
      }
    } catch (err: any) { setError(err.message); }
    finally { setSyncing(false); }
  };

  const computeKPIs = (camps: MetaCampaign[]) => {
    setKpis({
      totalSpend: Math.round(camps.reduce((s, c) => s + c.insights.spend, 0) * 100) / 100,
      totalImpressions: camps.reduce((s, c) => s + c.insights.impressions, 0),
      totalClicks: camps.reduce((s, c) => s + c.insights.clicks, 0),
      totalConversions: camps.reduce((s, c) => s + c.insights.conversions, 0),
      totalCampaigns: camps.length,
      totalAdSets: camps.reduce((s, c) => s + c.adsets.length, 0),
      totalAds: camps.reduce((s, c) => s + c.adsets.reduce((ss, a) => ss + a.ads.length, 0), 0),
      campaignsWithData: camps.filter((c) => c.insights.spend > 0 || c.insights.impressions > 0).length,
    });
  };

  const filteredCampaigns = selectedStatus === "ALL" ? campaigns : campaigns.filter((c) => c.status === selectedStatus);

  const toggleCampaign = (id: string) => {
    const next = new Set(expandedCampaigns);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpandedCampaigns(next);
  };

  const toggleAdSet = (id: string) => {
    const next = new Set(expandedAdSets);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpandedAdSets(next);
  };

  const statusOrder: Record<string, number> = { ACTIVE: 0, PAUSED: 1, ARCHIVED: 2, DELETED: 3 };
  const sortedCampaigns = [...filteredCampaigns].sort((a, b) => {
    const statusDiff = (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9);
    if (statusDiff !== 0) return statusDiff;
    return b.insights.spend - a.insights.spend;
  });

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-cockpit-heading mb-1">Campagnes</h1>
          <p className="text-cockpit-secondary text-xs sm:text-sm">
            {kpis.totalCampaigns} campagnes · {kpis.totalAdSets} ensembles · {kpis.totalAds} publicités
            {kpis.campaignsWithData > 0 && (
              <span className="text-[#8DA035] ml-1">({kpis.campaignsWithData} avec données)</span>
            )}
          </p>
          {syncedAt && (
            <p className="text-cockpit-secondary text-[10px] flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3" />
              Sync : {new Date(syncedAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
        </div>
        <button onClick={() => handleSync()} disabled={syncing || loading}
          className="flex items-center justify-center gap-2 bg-cockpit-card border border-cockpit px-4 py-2.5 rounded-lg font-semibold hover:bg-cockpit-dark transition-colors disabled:opacity-50 text-sm">
          {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          <span className="hidden sm:inline">{syncing ? "Actualisation..." : "Actualiser"}</span>
        </button>
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Period filter */}
        <div className="relative inline-block">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-cockpit-secondary" />
            <select
              value={selectedPeriod}
              onChange={(e) => {
                setSelectedPeriod(e.target.value);
                // Auto-sync when changing period
                handleSync(e.target.value);
              }}
              className="appearance-none bg-cockpit-card border border-cockpit px-3 py-2 rounded-lg text-xs text-cockpit-primary cursor-pointer pr-7"
            >
              {periodOptions.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-cockpit-secondary pointer-events-none" />
          </div>
        </div>

        {/* Status filter */}
        <div className="relative inline-block">
          <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}
            className="appearance-none bg-cockpit-card border border-cockpit px-3 py-2 rounded-lg text-xs text-cockpit-primary cursor-pointer pr-7">
            <option value="ALL">Tous les statuts</option>
            <option value="ACTIVE">Active</option>
            <option value="PAUSED">En pause</option>
            <option value="ARCHIVED">Archivée</option>
          </select>
          <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-cockpit-secondary pointer-events-none" />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-8">
        <KPICard title="Dépenses" value={fmtEur(kpis.totalSpend)} icon={<DollarSign className="w-7 h-7" />} bgColor="bg-mk-lemon" />
        <KPICard title="Impressions" value={fmt(kpis.totalImpressions)} icon={<Eye className="w-7 h-7" />} bgColor="bg-mk-lime" />
        <KPICard title="Clics" value={fmt(kpis.totalClicks)} icon={<MousePointer className="w-7 h-7" />} bgColor="bg-mk-grapefruit" />
        <KPICard title="Conversions" value={fmt(kpis.totalConversions)} icon={<BarChart3 className="w-7 h-7" />} bgColor="bg-mk-raspberry" />
      </div>

      {/* ROI KPIs */}
      {kpis.totalSpend > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg p-4">
            <p className="text-[10px] font-semibold text-cockpit-secondary uppercase mb-1">CPC moyen</p>
            <p className="text-xl font-bold text-cockpit-heading">
              {kpis.totalClicks > 0 ? fmtEur(kpis.totalSpend / kpis.totalClicks) : "—"}
            </p>
          </div>
          <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg p-4">
            <p className="text-[10px] font-semibold text-cockpit-secondary uppercase mb-1">Coût / conversion</p>
            <p className="text-xl font-bold text-cockpit-heading">
              {kpis.totalConversions > 0 ? fmtEur(kpis.totalSpend / kpis.totalConversions) : "—"}
            </p>
          </div>
          <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg p-4">
            <p className="text-[10px] font-semibold text-cockpit-secondary uppercase mb-1">CTR moyen</p>
            <p className="text-xl font-bold text-cockpit-heading">
              {kpis.totalImpressions > 0 ? ((kpis.totalClicks / kpis.totalImpressions) * 100).toFixed(2) + "%" : "—"}
            </p>
          </div>
          <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg p-4">
            <p className="text-[10px] font-semibold text-cockpit-secondary uppercase mb-1">Taux conversion</p>
            <p className="text-xl font-bold text-cockpit-heading">
              {kpis.totalClicks > 0 ? ((kpis.totalConversions / kpis.totalClicks) * 100).toFixed(1) + "%" : "—"}
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 p-3 bg-[#FF3E1D]/10 border border-[#FF3E1D]/30 rounded-lg">
          <AlertCircle className="w-4 h-4 text-[#FF3E1D] flex-shrink-0" />
          <p className="text-xs text-[#FF3E1D]">{error}</p>
        </div>
      )}

      {/* Debug panel (only shows after sync) */}
      {debugInfo && (
        <details className="bg-cockpit-card rounded-lg border border-cockpit p-3">
          <summary className="flex items-center gap-2 cursor-pointer text-xs text-cockpit-secondary">
            <Bug className="w-3.5 h-3.5" />
            Diagnostic Meta API
          </summary>
          <div className="mt-3 space-y-2 text-[10px] font-mono text-cockpit-secondary">
            {debugInfo.accounts && (
              <p>Comptes : {debugInfo.accounts.map((a: any) => `${a.name} (${a.id})`).join(", ")}</p>
            )}
            {debugInfo.counts && (
              <div className="grid grid-cols-3 gap-2">
                <p>Campagnes: {debugInfo.counts.campaigns}</p>
                <p>AdSets: {debugInfo.counts.adsets}</p>
                <p>Ads: {debugInfo.counts.ads}</p>
                <p>Insights camp.: {debugInfo.counts.campaignInsights}</p>
                <p>Insights adset: {debugInfo.counts.adsetInsights}</p>
                <p>Insights ad: {debugInfo.counts.adInsights}</p>
              </div>
            )}
            {debugInfo.errors?.length > 0 && (
              <div className="text-[#FF3E1D]">
                {debugInfo.errors.map((e: any, i: number) => (
                  <p key={i}>{e.step}: {e.message || JSON.stringify(e.body || "").substring(0, 200)}</p>
                ))}
              </div>
            )}
            {debugInfo.sampleCampaignInsight && (
              <div>
                <p className="font-semibold">Exemple insight :</p>
                <pre className="overflow-x-auto bg-cockpit-dark rounded p-2 mt-1">
                  {JSON.stringify(debugInfo.sampleCampaignInsight, null, 2).substring(0, 500)}
                </pre>
              </div>
            )}
          </div>
        </details>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#C2185B]" />
        </div>
      )}

      {/* HIERARCHY TABLE */}
      {!loading && sortedCampaigns.length > 0 && (
        <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg overflow-hidden">
          {/* Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-cockpit-dark border-b border-cockpit">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-cockpit-heading w-[40%]">NOM</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-cockpit-heading">DÉPENSES</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-cockpit-heading">IMPRESSIONS</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-cockpit-heading">CLICS</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-cockpit-heading hidden xl:table-cell">CTR</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-cockpit-heading hidden xl:table-cell">CPC</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-cockpit-heading">CONV.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cockpit">
                {sortedCampaigns.map((camp) => {
                  const isExp = expandedCampaigns.has(camp.id);
                  const hasAdSets = camp.adsets.length > 0;
                  return (
                    <CampaignBlock key={camp.id} campaign={camp} isExpanded={isExp} hasAdSets={hasAdSets}
                      toggleCampaign={() => toggleCampaign(camp.id)} expandedAdSets={expandedAdSets} toggleAdSet={toggleAdSet} />
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="md:hidden divide-y divide-cockpit">
            {sortedCampaigns.map((camp) => (
              <MobileCard key={camp.id} campaign={camp} expanded={expandedCampaigns.has(camp.id)}
                toggle={() => toggleCampaign(camp.id)} expandedAdSets={expandedAdSets} toggleAdSet={toggleAdSet} />
            ))}
          </div>
        </div>
      )}

      {/* Empty */}
      {!loading && sortedCampaigns.length === 0 && !error && (
        <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg p-8 text-center">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 text-cockpit-secondary opacity-50" />
          <h3 className="text-base font-semibold text-cockpit-heading mb-2">Aucune campagne</h3>
          <p className="text-cockpit-secondary text-sm mb-6">Les données Meta s'actualisent automatiquement</p>
          <button onClick={() => handleSync()} disabled={syncing}
            className="flex items-center gap-2 mx-auto bg-cockpit-card border border-cockpit px-6 py-3 rounded-lg font-semibold hover:bg-cockpit-dark transition-colors disabled:opacity-50 text-sm">
            {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Actualiser
          </button>
        </div>
      )}
    </div>
  );
}

// ===== LEVEL INDICATOR =====

function LevelIndicator({ level }: { level: "campaign" | "adset" | "ad" }) {
  const config = {
    campaign: { bg: "bg-[#C2185B]/15", text: "text-[#C2185B]", label: "Camp." },
    adset: { bg: "bg-[#D4567A]/15", text: "text-[#D4567A]", label: "Ens." },
    ad: { bg: "bg-[#E2A90A]/15", text: "text-[#E2A90A]", label: "Pub" },
  };
  const c = config[level];
  return (
    <div className={`flex items-center justify-center px-1.5 py-0.5 rounded ${c.bg} flex-shrink-0`}>
      {level === "campaign" ? (
        <Layers className="w-3.5 h-3.5 text-[#C2185B]" />
      ) : (
        <span className={`text-[8px] font-bold ${c.text}`}>{c.label}</span>
      )}
    </div>
  );
}

// ===== DESKTOP ROWS =====

function CampaignBlock({ campaign, isExpanded, hasAdSets, toggleCampaign, expandedAdSets, toggleAdSet }: {
  campaign: MetaCampaign; isExpanded: boolean; hasAdSets: boolean;
  toggleCampaign: () => void; expandedAdSets: Set<string>; toggleAdSet: (id: string) => void;
}) {
  return (
    <>
      <tr className={`hover:bg-cockpit-dark transition-colors ${hasAdSets ? "cursor-pointer" : ""}`}
        onClick={hasAdSets ? toggleCampaign : undefined}>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            {hasAdSets ? (
              isExpanded
                ? <ChevronDown className="w-4 h-4 text-[#C2185B] flex-shrink-0" />
                : <ChevronRight className="w-4 h-4 text-cockpit-secondary flex-shrink-0" />
            ) : <span className="w-4" />}
            <LevelIndicator level="campaign" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-cockpit-primary truncate">{campaign.name}</p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <StatusBadge status={campaign.status} />
                {campaign.objective && (
                  <span className="text-[10px] text-cockpit-secondary">{campaign.objective.replace(/_/g, " ")}</span>
                )}
                {campaign.startDate && (
                  <span className="text-[10px] text-cockpit-secondary">
                    {new Date(campaign.startDate).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "2-digit" })}
                  </span>
                )}
                {hasAdSets && (
                  <span className="text-[10px] text-cockpit-secondary font-medium">
                    {campaign.adsets.length} ens. · {campaign.adsets.reduce((s, a) => s + a.ads.length, 0)} pubs
                  </span>
                )}
              </div>
            </div>
          </div>
        </td>
        <InsightsCells i={campaign.insights} />
      </tr>

      {isExpanded && campaign.adsets.map((adset) => (
        <AdSetBlock key={adset.id} adset={adset} isExpanded={expandedAdSets.has(adset.id)}
          hasAds={adset.ads.length > 0} toggle={() => toggleAdSet(adset.id)} />
      ))}
    </>
  );
}

function AdSetBlock({ adset, isExpanded, hasAds, toggle }: {
  adset: MetaAdSet; isExpanded: boolean; hasAds: boolean; toggle: () => void;
}) {
  return (
    <>
      <tr className={`hover:bg-cockpit-dark/50 transition-colors bg-cockpit-dark/30 ${hasAds ? "cursor-pointer" : ""}`}
        onClick={hasAds ? toggle : undefined}>
        <td className="px-4 py-2">
          <div className="flex items-center gap-2 pl-6">
            {hasAds ? (
              isExpanded
                ? <ChevronDown className="w-3.5 h-3.5 text-[#C2185B] flex-shrink-0" />
                : <ChevronRight className="w-3.5 h-3.5 text-cockpit-secondary flex-shrink-0" />
            ) : <span className="w-3.5" />}
            <LevelIndicator level="adset" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-cockpit-primary truncate">{adset.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <StatusBadge status={adset.status} />
                {adset.targeting && <span className="text-[9px] text-cockpit-secondary truncate max-w-[200px]">{adset.targeting}</span>}
                {hasAds && <span className="text-[9px] text-cockpit-secondary">{adset.ads.length} pub{adset.ads.length > 1 ? "s" : ""}</span>}
              </div>
            </div>
          </div>
        </td>
        <InsightsCells i={adset.insights} size="xs" />
      </tr>

      {isExpanded && adset.ads.map((ad) => (
        <tr key={ad.id} className="hover:bg-cockpit-dark/30 transition-colors bg-cockpit-dark/10">
          <td className="px-4 py-2">
            <div className="flex items-center gap-2 pl-14">
              {ad.thumbnailUrl ? (
                <img src={ad.thumbnailUrl} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0 border border-cockpit" />
              ) : (
                <div className="w-8 h-8 rounded bg-cockpit-dark flex items-center justify-center flex-shrink-0 border border-cockpit">
                  <Image className="w-3.5 h-3.5 text-cockpit-secondary" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-cockpit-primary truncate">{ad.name}</p>
                <StatusBadge status={ad.status} />
              </div>
            </div>
          </td>
          <InsightsCells i={ad.insights} size="xs" />
        </tr>
      ))}
    </>
  );
}

// ===== MOBILE =====

function MobileCard({ campaign, expanded, toggle, expandedAdSets, toggleAdSet }: {
  campaign: MetaCampaign; expanded: boolean; toggle: () => void;
  expandedAdSets: Set<string>; toggleAdSet: (id: string) => void;
}) {
  const hasAdSets = campaign.adsets.length > 0;
  const cfg = statusConfig[campaign.status] || statusConfig.PAUSED;

  return (
    <div>
      <div className={`p-4 hover:bg-cockpit-dark transition-colors ${hasAdSets ? "cursor-pointer" : ""}`}
        onClick={hasAdSets ? toggle : undefined}>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {hasAdSets && (expanded ? <ChevronDown className="w-4 h-4 text-[#C2185B] flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-cockpit-secondary flex-shrink-0" />)}
            <LevelIndicator level="campaign" />
            <p className="font-medium text-cockpit-primary text-sm truncate">{campaign.name}</p>
          </div>
          <p className="text-sm font-bold text-[#C2185B] flex-shrink-0">{fmtEur(campaign.insights.spend)}</p>
        </div>
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#C2185B]/10 text-[#C2185B]">Meta</span>
          {hasAdSets && (
            <span className="text-[10px] text-cockpit-secondary">
              {campaign.adsets.length} ens. · {campaign.adsets.reduce((s, a) => s + a.ads.length, 0)} pubs
            </span>
          )}
        </div>
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div><p className="text-cockpit-secondary">Impr.</p><p className="text-cockpit-primary font-medium">{fmt(campaign.insights.impressions)}</p></div>
          <div><p className="text-cockpit-secondary">Clics</p><p className="text-cockpit-primary font-medium">{fmt(campaign.insights.clicks)}</p></div>
          <div><p className="text-cockpit-secondary">Conv.</p><p className="text-cockpit-primary font-medium">{campaign.insights.conversions}</p></div>
        </div>
      </div>

      {expanded && campaign.adsets.map((adset) => (
        <div key={adset.id} className="border-t border-cockpit/50">
          <div className={`p-4 pl-8 bg-cockpit-dark/20 ${adset.ads.length > 0 ? "cursor-pointer" : ""}`}
            onClick={adset.ads.length > 0 ? () => toggleAdSet(adset.id) : undefined}>
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {adset.ads.length > 0 && (expandedAdSets.has(adset.id) ? <ChevronDown className="w-3 h-3 text-[#C2185B] flex-shrink-0" /> : <ChevronRight className="w-3 h-3 text-cockpit-secondary flex-shrink-0" />)}
                <LevelIndicator level="adset" />
                <p className="text-xs font-medium text-cockpit-primary truncate">{adset.name}</p>
              </div>
              <p className="text-xs font-medium text-[#C2185B]">{fmtEur(adset.insights.spend)}</p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-[10px] mt-1">
              <div><span className="text-cockpit-secondary">Impr. </span><span className="text-cockpit-primary">{fmt(adset.insights.impressions)}</span></div>
              <div><span className="text-cockpit-secondary">Clics </span><span className="text-cockpit-primary">{fmt(adset.insights.clicks)}</span></div>
              <div><span className="text-cockpit-secondary">Conv. </span><span className="text-cockpit-primary">{adset.insights.conversions}</span></div>
            </div>
          </div>

          {expandedAdSets.has(adset.id) && adset.ads.map((ad) => (
            <div key={ad.id} className="p-3 pl-14 bg-cockpit-dark/10 border-t border-cockpit/30">
              <div className="flex items-center gap-2">
                {ad.thumbnailUrl ? (
                  <img src={ad.thumbnailUrl} alt="" className="w-8 h-8 rounded object-cover border border-cockpit" />
                ) : (
                  <div className="w-8 h-8 rounded bg-cockpit-dark flex items-center justify-center border border-cockpit">
                    <Image className="w-3 h-3 text-cockpit-secondary" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-cockpit-primary truncate">{ad.name}</p>
                  <div className="flex gap-3 text-[10px] mt-0.5">
                    <span className="text-cockpit-secondary">{fmtEur(ad.insights.spend)}</span>
                    <span className="text-cockpit-secondary">{fmt(ad.insights.clicks)} clics</span>
                    <span className="text-cockpit-secondary">{ad.insights.conversions} conv.</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
