"use client";

import { useState, useEffect } from "react";
import { KPICard } from "@/components/dashboard/kpi-card";
import { BarChart3, TrendingUp, DollarSign, Users, RefreshCw, Loader2, AlertCircle } from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  status: "ACTIVE" | "PAUSED" | "ARCHIVED" | "DELETED";
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

export default function CampagnesPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/meta/campaigns");
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns || []);
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

  const handleSync = async () => {
    setSyncing(true);
    await loadCampaigns();
    setSyncing(false);
  };

  // Filtrer les campagnes à partir du 1er janvier 2026
  const filteredCampaigns = campaigns.filter((c) => {
    if (!c.startDate) return false;
    const campaignDate = new Date(c.startDate);
    const minDate = new Date("2026-01-01");
    return campaignDate >= minDate;
  });

  const totalSpend = filteredCampaigns.reduce((sum, c) => sum + (c.spend || 0), 0);
  const totalImpressions = filteredCampaigns.reduce((sum, c) => sum + (c.impressions || 0), 0);
  const totalClicks = filteredCampaigns.reduce((sum, c) => sum + (c.clicks || 0), 0);
  const totalConversions = filteredCampaigns.reduce((sum, c) => sum + (c.conversions || 0), 0);
  const avgRoas =
    filteredCampaigns.length > 0
      ? filteredCampaigns.reduce((sum, c) => sum + (c.roas || 0), 0) / filteredCampaigns.length
      : 0;

  const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
    ACTIVE: { label: "Active", bg: "bg-[#71DD37]/10", text: "text-[#71DD37]" },
    PAUSED: { label: "En pause", bg: "bg-[#FFAB00]/10", text: "text-[#FFAB00]" },
    ARCHIVED: { label: "Archivée", bg: "bg-[#8592A3]/10", text: "text-[#8592A3]" },
    DELETED: { label: "Supprimée", bg: "bg-[#FF3E1D]/10", text: "text-[#FF3E1D]" },
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-cockpit-heading mb-2">Campagnes</h1>
          <p className="text-cockpit-secondary">{filteredCampaigns.length} campagnes Facebook / Instagram (à partir du 1er janvier 2026)</p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing || loading}
          className="flex items-center gap-2 bg-cockpit-yellow text-cockpit-bg px-6 py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {syncing ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
          {syncing ? "Synchronisation..." : "Synchroniser depuis Meta"}
        </button>
      </div>

      <div className="grid grid-cols-4 gap-8">
        <KPICard
          title="Budget total"
          value={`€${totalSpend.toFixed(2)}`}
          icon={<DollarSign className="w-7 h-7" />}
          bgColor="bg-cockpit-yellow"
        />
        <KPICard
          title="Impressions"
          value={totalImpressions.toLocaleString("fr-FR")}
          icon={<Users className="w-7 h-7" />}
          bgColor="bg-cockpit-info"
        />
        <KPICard
          title="Clics"
          value={totalClicks.toLocaleString("fr-FR")}
          icon={<TrendingUp className="w-7 h-7" />}
          bgColor="bg-cockpit-success"
        />
        <KPICard
          title="Conversions"
          value={totalConversions.toLocaleString("fr-FR")}
          icon={<BarChart3 className="w-7 h-7" />}
          bgColor="bg-cockpit-warning"
        />
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-[#FF3E1D]/10 border border-[#FF3E1D]/30 rounded-lg">
          <AlertCircle className="w-5 h-5 text-[#FF3E1D] flex-shrink-0" />
          <p className="text-sm text-[#FF3E1D]">{error}</p>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-cockpit-yellow" />
        </div>
      )}

      {!loading && filteredCampaigns.length > 0 && (
        <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-cockpit-dark border-b border-cockpit">
                <tr>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-cockpit-heading">NOM</th>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-cockpit-heading">STATUT</th>
                  <th className="px-8 py-4 text-right text-sm font-semibold text-cockpit-heading">BUDGET</th>
                  <th className="px-8 py-4 text-right text-sm font-semibold text-cockpit-heading">DÉPENSES</th>
                  <th className="px-8 py-4 text-right text-sm font-semibold text-cockpit-heading">IMPRESSIONS</th>
                  <th className="px-8 py-4 text-right text-sm font-semibold text-cockpit-heading">CLICS</th>
                  <th className="px-8 py-4 text-right text-sm font-semibold text-cockpit-heading">CTR</th>
                  <th className="px-8 py-4 text-right text-sm font-semibold text-cockpit-heading">CPC</th>
                  <th className="px-8 py-4 text-right text-sm font-semibold text-cockpit-heading">CONVERSIONS</th>
                  <th className="px-8 py-4 text-right text-sm font-semibold text-cockpit-heading">ROAS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cockpit">
                {filteredCampaigns.map((c) => {
                  const status = statusConfig[c.status] || statusConfig.PAUSED;
                  return (
                    <tr key={c.id} className="hover:bg-cockpit-dark transition-colors">
                      <td className="px-8 py-4">
                        <span className="font-medium text-cockpit-primary">{c.name}</span>
                      </td>
                      <td className="px-8 py-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${status.bg} ${status.text}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-8 py-4 text-right text-sm text-cockpit-secondary">
                        €{c.budget ? (c.budget / 100).toFixed(2) : "-"}
                      </td>
                      <td className="px-8 py-4 text-right text-sm font-medium text-cockpit-primary">
                        €{c.spend?.toFixed(2) || "-"}
                      </td>
                      <td className="px-8 py-4 text-right text-sm text-cockpit-secondary">
                        {c.impressions?.toLocaleString("fr-FR") || "-"}
                      </td>
                      <td className="px-8 py-4 text-right text-sm text-cockpit-secondary">
                        {c.clicks?.toLocaleString("fr-FR") || "-"}
                      </td>
                      <td className="px-8 py-4 text-right text-sm text-cockpit-secondary">
                        {c.ctr?.toFixed(2) || "-"}%
                      </td>
                      <td className="px-8 py-4 text-right text-sm text-cockpit-secondary">
                        €{c.cpc?.toFixed(2) || "-"}
                      </td>
                      <td className="px-8 py-4 text-right text-sm font-medium text-cockpit-primary">
                        {c.conversions || "-"}
                      </td>
                      <td className="px-8 py-4 text-right text-sm font-medium text-cockpit-primary">
                        {c.roas?.toFixed(2) || "-"}x
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && filteredCampaigns.length === 0 && !error && campaigns.length === 0 && (
        <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg p-12 text-center">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 text-cockpit-secondary opacity-50" />
          <h3 className="text-lg font-semibold text-cockpit-heading mb-2">Aucune campagne trouvée</h3>
          <p className="text-cockpit-secondary mb-6">
            Clique sur "Synchroniser depuis Meta" pour importer tes campagnes Facebook et Instagram
          </p>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="bg-cockpit-yellow text-cockpit-bg px-6 py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50"
          >
            Synchroniser maintenant
          </button>
        </div>
      )}

      {!loading && filteredCampaigns.length === 0 && !error && campaigns.length > 0 && (
        <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg p-12 text-center">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 text-cockpit-secondary opacity-50" />
          <h3 className="text-lg font-semibold text-cockpit-heading mb-2">Aucune campagne depuis le 1er janvier 2026</h3>
          <p className="text-cockpit-secondary mb-4">
            {campaigns.length} campagne{campaigns.length > 1 ? "s" : ""} disponible{campaigns.length > 1 ? "s" : ""}, mais aucune n'a démarré à partir du 1er janvier 2026
          </p>
          <p className="text-cockpit-secondary text-sm">
            Vous avez des campagnes plus anciennes synchronisées avec Meta.
          </p>
        </div>
      )}
    </div>
  );
}
