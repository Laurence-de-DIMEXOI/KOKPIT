"use client";

import { useState, useEffect } from "react";
import { KPICard } from "@/components/dashboard/kpi-card";
import { BarChart3, TrendingUp, DollarSign, Users, RefreshCw, Loader2, AlertCircle, ChevronDown } from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  status: "ACTIVE" | "PAUSED" | "ARCHIVED" | "DELETED";
  channel?: "META" | "GOOGLE_ADS" | "OFFLINE" | "OTHER";
  spend?: number;
  impressions?: number;
  clicks?: number;
  conversions?: number;
  roas?: number;
  budget?: number;
  startDate?: string;
  endDate?: string;
  cpc?: number;
  ctr?: number;
  metaCampaignId: string;
}

type SortBy = "date" | "spend" | "impressions" | "clicks" | "roas";
type SortOrder = "asc" | "desc";

export default function CampagnesPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  // Charger depuis le cache Prisma au mount (rapide)
  useEffect(() => {
    loadFromCache();
  }, []);

  const loadFromCache = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/campagnes?limit=100");
      if (res.ok) {
        const data = await res.json();
        const campagnes = data.campagnes || [];
        const mapped: Campaign[] = campagnes.map((c: any) => {
          const insights = c.metaInsights || {};
          return {
            id: c.id,
            name: c.nom,
            status: insights.status || (c.actif ? "ACTIVE" : "PAUSED"),
            channel: c.plateforme || "META",
            spend: insights.spend ?? c.coutTotal ?? 0,
            impressions: insights.impressions ?? 0,
            clicks: insights.clicks ?? 0,
            conversions: insights.conversions ?? 0,
            roas: insights.roas ?? 0,
            budget: insights.budget ?? 0,
            startDate: c.dateDebut,
            endDate: c.dateFin,
            cpc: insights.cpc ?? 0,
            ctr: insights.ctr ?? 0,
            metaCampaignId: c.metaCampaignId || c.id,
          };
        });
        setCampaigns(mapped);
      } else {
        const err = await res.json();
        setError(err.error || "Erreur lors du chargement");
      }
    } catch (err: any) {
      setError(err.message || "Erreur réseau");
    } finally {
      setLoading(false);
    }
  };

  // Sync depuis Meta API (lent, uniquement au clic)
  const handleSync = async () => {
    setSyncing(true);
    setError("");
    try {
      const res = await fetch("/api/meta/campaigns");
      if (res.ok) {
        const data = await res.json();
        const campaignsWithChannel = (data.campaigns || []).map((c: Campaign) => ({
          ...c,
          channel: c.channel || "META",
        }));
        setCampaigns(campaignsWithChannel);
      } else {
        const err = await res.json();
        setError(err.error || "Erreur lors de la synchronisation");
      }
    } catch (err: any) {
      setError(err.message || "Erreur réseau");
    } finally {
      setSyncing(false);
    }
  };

  // Filtrer les campagnes à partir du 1er janvier 2026
  let filteredCampaigns = campaigns.filter((c) => {
    if (!c.startDate) return false;
    const campaignDate = new Date(c.startDate);
    const minDate = new Date("2026-01-01");
    return campaignDate >= minDate;
  });

  if (selectedStatus !== "ALL") {
    filteredCampaigns = filteredCampaigns.filter((c) => c.status === selectedStatus);
  }

  filteredCampaigns = [...filteredCampaigns].sort((a, b) => {
    let aVal: number = 0;
    let bVal: number = 0;

    switch (sortBy) {
      case "date":
        aVal = a.startDate ? new Date(a.startDate).getTime() : 0;
        bVal = b.startDate ? new Date(b.startDate).getTime() : 0;
        break;
      case "spend": aVal = a.spend || 0; bVal = b.spend || 0; break;
      case "impressions": aVal = a.impressions || 0; bVal = b.impressions || 0; break;
      case "clicks": aVal = a.clicks || 0; bVal = b.clicks || 0; break;
      case "roas": aVal = a.roas || 0; bVal = b.roas || 0; break;
    }
    return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
  });

  const totalSpend = filteredCampaigns.reduce((sum, c) => sum + (c.spend || 0), 0);
  const totalImpressions = filteredCampaigns.reduce((sum, c) => sum + (c.impressions || 0), 0);
  const totalClicks = filteredCampaigns.reduce((sum, c) => sum + (c.clicks || 0), 0);
  const totalConversions = filteredCampaigns.reduce((sum, c) => sum + (c.conversions || 0), 0);

  const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
    ACTIVE: { label: "Active", bg: "bg-[#71DD37]/10", text: "text-[#71DD37]" },
    PAUSED: { label: "En pause", bg: "bg-[#FFAB00]/10", text: "text-[#FFAB00]" },
    ARCHIVED: { label: "Archivée", bg: "bg-[#8592A3]/10", text: "text-[#8592A3]" },
    DELETED: { label: "Supprimée", bg: "bg-[#FF3E1D]/10", text: "text-[#FF3E1D]" },
  };

  const channelConfig: Record<string, { label: string; bg: string; text: string }> = {
    META: { label: "Meta", bg: "bg-[#1877F2]/10", text: "text-[#1877F2]" },
    GOOGLE_ADS: { label: "Google Ads", bg: "bg-[#EA4335]/10", text: "text-[#EA4335]" },
    OFFLINE: { label: "Offline", bg: "bg-[#34A853]/10", text: "text-[#34A853]" },
    OTHER: { label: "Autre", bg: "bg-[#9AA0A6]/10", text: "text-[#9AA0A6]" },
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-cockpit-heading mb-1">Campagnes</h1>
          <p className="text-cockpit-secondary text-xs sm:text-sm">{filteredCampaigns.length} campagnes Meta (depuis jan. 2026)</p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing || loading}
          className="flex items-center justify-center gap-2 bg-cockpit-yellow text-cockpit-bg px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity text-sm w-full sm:w-auto"
        >
          {syncing ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />}
          {syncing ? "Sync..." : "Synchroniser Meta"}
        </button>
      </div>

      {/* Filtres et tri */}
      <div className="flex flex-wrap gap-2 sm:gap-4">
        <div className="relative">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="appearance-none bg-cockpit-card border border-cockpit px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm text-cockpit-primary cursor-pointer pr-7 sm:pr-8"
          >
            <option value="ALL">Tous</option>
            <option value="ACTIVE">Active</option>
            <option value="PAUSED">En pause</option>
            <option value="ARCHIVED">Archivée</option>
            <option value="DELETED">Supprimée</option>
          </select>
          <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 absolute right-2 top-1/2 -translate-y-1/2 text-cockpit-secondary pointer-events-none" />
        </div>

        <div className="flex gap-2">
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="appearance-none bg-cockpit-card border border-cockpit px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm text-cockpit-primary cursor-pointer pr-7 sm:pr-8"
            >
              <option value="date">Date</option>
              <option value="spend">Budget</option>
              <option value="impressions">Impressions</option>
              <option value="clicks">Clics</option>
              <option value="roas">ROAS</option>
            </select>
            <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 absolute right-2 top-1/2 -translate-y-1/2 text-cockpit-secondary pointer-events-none" />
          </div>

          <button
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="bg-cockpit-card border border-cockpit px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm text-cockpit-primary hover:bg-cockpit-dark transition-colors"
          >
            {sortOrder === "asc" ? "↑" : "↓"}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-8">
        <KPICard title="Budget" value={`€${totalSpend.toFixed(0)}`} icon={<DollarSign className="w-7 h-7" />} bgColor="bg-cockpit-yellow" />
        <KPICard title="Impressions" value={totalImpressions.toLocaleString("fr-FR")} icon={<Users className="w-7 h-7" />} bgColor="bg-cockpit-info" />
        <KPICard title="Clics" value={totalClicks.toLocaleString("fr-FR")} icon={<TrendingUp className="w-7 h-7" />} bgColor="bg-cockpit-success" />
        <KPICard title="Conversions" value={totalConversions.toLocaleString("fr-FR")} icon={<BarChart3 className="w-7 h-7" />} bgColor="bg-cockpit-warning" />
      </div>

      {error && (
        <div className="flex items-center gap-3 p-3 sm:p-4 bg-[#FF3E1D]/10 border border-[#FF3E1D]/30 rounded-lg">
          <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-[#FF3E1D] flex-shrink-0" />
          <p className="text-xs sm:text-sm text-[#FF3E1D]">{error}</p>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-cockpit-yellow" />
        </div>
      )}

      {!loading && filteredCampaigns.length > 0 && (
        <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg overflow-hidden">
          {/* Vue tableau (lg+) */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-cockpit-dark border-b border-cockpit">
                <tr>
                  <th className="px-4 xl:px-6 py-3 text-left text-xs font-semibold text-cockpit-heading">NOM</th>
                  <th className="px-4 xl:px-6 py-3 text-left text-xs font-semibold text-cockpit-heading">STATUT</th>
                  <th className="px-4 xl:px-6 py-3 text-right text-xs font-semibold text-cockpit-heading">DÉPENSES</th>
                  <th className="px-4 xl:px-6 py-3 text-right text-xs font-semibold text-cockpit-heading">IMPRESSIONS</th>
                  <th className="px-4 xl:px-6 py-3 text-right text-xs font-semibold text-cockpit-heading">CLICS</th>
                  <th className="px-4 xl:px-6 py-3 text-right text-xs font-semibold text-cockpit-heading hidden xl:table-cell">CTR</th>
                  <th className="px-4 xl:px-6 py-3 text-right text-xs font-semibold text-cockpit-heading hidden xl:table-cell">CPC</th>
                  <th className="px-4 xl:px-6 py-3 text-right text-xs font-semibold text-cockpit-heading">CONV.</th>
                  <th className="px-4 xl:px-6 py-3 text-right text-xs font-semibold text-cockpit-heading">ROAS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cockpit">
                {filteredCampaigns.map((c) => {
                  const status = statusConfig[c.status] || statusConfig.PAUSED;
                  return (
                    <tr key={c.id} className="hover:bg-cockpit-dark transition-colors">
                      <td className="px-4 xl:px-6 py-3">
                        <span className="font-medium text-cockpit-primary text-sm truncate block max-w-[200px] xl:max-w-none">{c.name}</span>
                      </td>
                      <td className="px-4 xl:px-6 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${status.bg} ${status.text}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 xl:px-6 py-3 text-right text-sm font-medium text-cockpit-primary">€{c.spend?.toFixed(2) || "-"}</td>
                      <td className="px-4 xl:px-6 py-3 text-right text-xs text-cockpit-secondary">{c.impressions?.toLocaleString("fr-FR") || "-"}</td>
                      <td className="px-4 xl:px-6 py-3 text-right text-xs text-cockpit-secondary">{c.clicks?.toLocaleString("fr-FR") || "-"}</td>
                      <td className="px-4 xl:px-6 py-3 text-right text-xs text-cockpit-secondary hidden xl:table-cell">{c.ctr?.toFixed(2) || "-"}%</td>
                      <td className="px-4 xl:px-6 py-3 text-right text-xs text-cockpit-secondary hidden xl:table-cell">€{c.cpc?.toFixed(2) || "-"}</td>
                      <td className="px-4 xl:px-6 py-3 text-right text-sm font-medium text-cockpit-primary">{c.conversions || "-"}</td>
                      <td className="px-4 xl:px-6 py-3 text-right text-sm font-medium text-cockpit-primary">{c.roas?.toFixed(2) || "-"}x</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Vue cartes (mobile + tablette) */}
          <div className="lg:hidden divide-y divide-cockpit">
            {filteredCampaigns.map((c) => {
              const status = statusConfig[c.status] || statusConfig.PAUSED;
              const channel = channelConfig[c.channel || "META"] || channelConfig.META;
              return (
                <div key={c.id} className="p-4 hover:bg-cockpit-dark transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-cockpit-primary text-sm truncate">{c.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${channel.bg} ${channel.text}`}>
                          {channel.label}
                        </span>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${status.bg} ${status.text}`}>
                          {status.label}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-cockpit-yellow">€{c.spend?.toFixed(2) || "0"}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <p className="text-cockpit-secondary">Impressions</p>
                      <p className="text-cockpit-primary font-medium">{c.impressions?.toLocaleString("fr-FR") || "-"}</p>
                    </div>
                    <div>
                      <p className="text-cockpit-secondary">Clics</p>
                      <p className="text-cockpit-primary font-medium">{c.clicks?.toLocaleString("fr-FR") || "-"}</p>
                    </div>
                    <div>
                      <p className="text-cockpit-secondary">Conv.</p>
                      <p className="text-cockpit-primary font-medium">{c.conversions || "-"}</p>
                    </div>
                    <div className="hidden sm:block">
                      <p className="text-cockpit-secondary">ROAS</p>
                      <p className="text-cockpit-primary font-medium">{c.roas?.toFixed(2) || "-"}x</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!loading && filteredCampaigns.length === 0 && !error && campaigns.length === 0 && (
        <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg p-6 sm:p-12 text-center">
          <BarChart3 className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-cockpit-secondary opacity-50" />
          <h3 className="text-base sm:text-lg font-semibold text-cockpit-heading mb-2">Aucune campagne trouvée</h3>
          <p className="text-cockpit-secondary text-sm mb-6">
            Clique sur "Synchroniser" pour importer tes campagnes
          </p>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="bg-cockpit-yellow text-cockpit-bg px-6 py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 text-sm"
          >
            Synchroniser maintenant
          </button>
        </div>
      )}

      {!loading && filteredCampaigns.length === 0 && !error && campaigns.length > 0 && (
        <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg p-6 sm:p-12 text-center">
          <BarChart3 className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-cockpit-secondary opacity-50" />
          <h3 className="text-base sm:text-lg font-semibold text-cockpit-heading mb-2">Aucune campagne depuis jan. 2026</h3>
          <p className="text-cockpit-secondary text-sm">
            {campaigns.length} campagne{campaigns.length > 1 ? "s" : ""} plus ancienne{campaigns.length > 1 ? "s" : ""} disponible{campaigns.length > 1 ? "s" : ""}
          </p>
        </div>
      )}
    </div>
  );
}
