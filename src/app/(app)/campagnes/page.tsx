"use client";

import { useState, useEffect } from "react";
import { KPICard } from "@/components/dashboard/kpi-card";
import { DollarSign, TrendingUp, BarChart3, Target } from "lucide-react";

interface Campaign {
  id: string;
  nom: string;
  plateforme: string;
  cout: number;
  demandes: number;
  devis: number;
  ventes: number;
  ca: number;
  roi: number;
  statut: string;
}

export default function CampagnesPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [stats, setStats] = useState({
    totalCost: 0,
    totalRevenue: 0,
    avgROI: 0,
    totalLeads: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/campaigns");
        const result = await response.json();

        const campaignsArray = Array.isArray(result) ? result : result.data || [];

        setCampaigns(campaignsArray);

        const totalCost = campaignsArray.reduce((acc: number, c: Campaign) => acc + (c.cout || 0), 0);
        const totalRevenue = campaignsArray.reduce((acc: number, c: Campaign) => acc + (c.ca || 0), 0);
        const avgROI = campaignsArray.reduce((acc: number, c: Campaign) => acc + (c.roi || 0), 0) / (campaignsArray.length || 1);
        const totalLeads = campaignsArray.reduce((acc: number, c: Campaign) => acc + (c.demandes || 0), 0);

        setStats({
          totalCost,
          totalRevenue,
          avgROI: Math.round(avgROI),
          totalLeads,
        });
      } catch (error) {
        console.error("Erreur:", error);
        setCampaigns([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-cockpit-heading mb-2">
            Campagnes
          </h1>
          <p className="text-cockpit-secondary">
            Gérez vos campagnes marketing
          </p>
        </div>
        <button className="bg-cockpit-yellow text-cockpit-bg px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity">
          + Nouvelle campagne
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <KPICard
          title="Dépenses totales"
          value={`${(stats.totalCost / 1000).toFixed(1)}k €`}
          icon={<DollarSign className="w-7 h-7" />}
          bgColor="bg-cockpit-danger"
        />
        <KPICard
          title="Chiffre d'affaires"
          value={`${(stats.totalRevenue / 1000).toFixed(1)}k €`}
          change={{ value: 15, direction: "up" }}
          icon={<TrendingUp className="w-7 h-7" />}
          bgColor="bg-cockpit-success"
        />
        <KPICard
          title="ROI moyen"
          value={`${stats.avgROI}%`}
          change={{ value: 8, direction: "up" }}
          icon={<BarChart3 className="w-7 h-7" />}
          bgColor="bg-cockpit-warning"
        />
        <KPICard
          title="Total demandes"
          value={stats.totalLeads}
          change={{ value: 12, direction: "up" }}
          icon={<Target className="w-7 h-7" />}
          bgColor="bg-cockpit-info"
        />
      </div>

      {/* Table */}
      <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-cockpit-dark border-b border-cockpit">
              <tr>
                <th className="px-8 py-4 text-left text-sm font-semibold text-cockpit-heading">
                  NOM
                </th>
                <th className="px-8 py-4 text-left text-sm font-semibold text-cockpit-heading">
                  PLATEFORME
                </th>
                <th className="px-8 py-4 text-left text-sm font-semibold text-cockpit-heading">
                  COÛT
                </th>
                <th className="px-8 py-4 text-left text-sm font-semibold text-cockpit-heading">
                  DEMANDES
                </th>
                <th className="px-8 py-4 text-left text-sm font-semibold text-cockpit-heading">
                  DEVIS
                </th>
                <th className="px-8 py-4 text-left text-sm font-semibold text-cockpit-heading">
                  CA
                </th>
                <th className="px-8 py-4 text-left text-sm font-semibold text-cockpit-heading">
                  ROI
                </th>
                <th className="px-8 py-4 text-left text-sm font-semibold text-cockpit-heading">
                  STATUT
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cockpit">
              {campaigns.length > 0 ? (
                campaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-cockpit-dark transition-colors">
                    <td className="px-8 py-4 text-cockpit-primary font-medium">
                      {campaign.nom}
                    </td>
                    <td className="px-8 py-4 text-cockpit-secondary text-sm">
                      {campaign.plateforme}
                    </td>
                    <td className="px-8 py-4 text-cockpit-primary font-medium">
                      {campaign.cout?.toFixed(2) || 0} €
                    </td>
                    <td className="px-8 py-4 text-cockpit-primary font-medium">
                      {campaign.demandes}
                    </td>
                    <td className="px-8 py-4 text-cockpit-primary font-medium">
                      {campaign.devis}
                    </td>
                    <td className="px-8 py-4 text-cockpit-primary font-medium">
                      {campaign.ca?.toFixed(2) || 0} €
                    </td>
                    <td className="px-8 py-4 text-cockpit-success font-bold">
                      {campaign.roi}%
                    </td>
                    <td className="px-8 py-4">
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-cockpit-success/10 text-cockpit-success">
                        {campaign.statut}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-8 py-8 text-center text-cockpit-secondary">
                    {loading ? "Chargement..." : "Aucune campagne"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
