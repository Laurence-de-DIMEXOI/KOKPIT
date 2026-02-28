"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { KPICard } from "@/components/dashboard/kpi-card";
import { Inbox, TrendingUp, Clock, AlertCircle, RefreshCw, Loader2 } from "lucide-react";

interface Demande {
  id: string;
  type: "DEMANDE_PRIX";
  nom: string;
  prenom: string;
  email: string;
  telephone: string | null;
  source: string;
  statut: string;
  meuble?: string;
  showroom?: string;
  assigneA?: string;
  dateCreation: string;
  dateDemande?: string | null;
}

export default function LeadsPage() {
  const { data: session } = useSession();
  const [demandes, setDemandes] = useState<Demande[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    nouveau: 0,
    encours: 0,
    devis: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchDemandes = async (showLoader = true) => {
    if (showLoader) setRefreshing(true);
    try {
      const response = await fetch("/api/demandes");
      const result = await response.json();

      const demandesArray = result.data || [];

      setDemandes(demandesArray);
      setStats({
        total: demandesArray.length,
        nouveau: demandesArray.filter((d: Demande) => d.statut === "NOUVEAU").length,
        encours: demandesArray.filter((d: Demande) => d.statut === "EN_COURS").length,
        devis: demandesArray.filter((d: Demande) => d.statut === "DEVIS").length,
      });
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
      if (showLoader) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDemandes(true);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchDemandes(false);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (statut: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      NOUVEAU: { bg: "bg-[#71DD37]/10", text: "text-[#71DD37]" },
      EN_COURS: { bg: "bg-[#F59E0B]/10", text: "text-[#F59E0B]" },
      DEVIS: { bg: "bg-[#60A5FA]/10", text: "text-[#60A5FA]" },
      VENTE: { bg: "bg-[#34D399]/10", text: "text-[#34D399]" },
      PERDU: { bg: "bg-[#EF4444]/10", text: "text-[#EF4444]" },
    };
    return colors[statut] || { bg: "bg-gray-100", text: "text-gray-600" };
  };

  const nomComplet = (demande: Demande) => {
    return `${demande.prenom || ""} ${demande.nom || ""}`.trim();
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-cockpit-heading mb-1 sm:mb-2">
            Demandes de Prix
          </h1>
          <p className="text-cockpit-secondary text-sm">
            Gérez les demandes de prix en provenance de Glide
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => fetchDemandes(true)}
            disabled={refreshing}
            className="flex items-center gap-2 bg-cockpit-card border border-cockpit px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-cockpit-dark transition-colors disabled:opacity-50 text-sm"
          >
            {refreshing ? (
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
            <span className="hidden sm:inline">Actualiser</span>
          </button>
          <button className="bg-cockpit-yellow text-cockpit-bg px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity text-sm">
            + <span className="hidden sm:inline">Nouvelle demande</span><span className="sm:hidden">Nouveau</span>
          </button>
        </div>
      </div>

      {/* Auto-refresh indicator */}
      <div className="flex items-center gap-2 text-xs text-cockpit-secondary">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        Auto 10s • {lastUpdate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-8">
        <KPICard
          title="Total"
          value={stats.total}
          icon={<Inbox className="w-7 h-7" />}
          bgColor="bg-cockpit-yellow"
        />
        <KPICard
          title="Nouveau"
          value={stats.nouveau}
          icon={<TrendingUp className="w-7 h-7" />}
          bgColor="bg-cockpit-info"
        />
        <KPICard
          title="En cours"
          value={stats.encours}
          icon={<Clock className="w-7 h-7" />}
          bgColor="bg-cockpit-warning"
        />
        <KPICard
          title="Devis"
          value={stats.devis}
          icon={<AlertCircle className="w-7 h-7" />}
          bgColor="bg-cockpit-success"
        />
      </div>

      {/* Table desktop / Cards mobile */}
      <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg overflow-hidden">
        {/* Vue tableau (md+) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-cockpit-dark border-b border-cockpit">
              <tr>
                <th className="px-4 lg:px-8 py-3 lg:py-4 text-left text-xs lg:text-sm font-semibold text-cockpit-heading">TYPE</th>
                <th className="px-4 lg:px-8 py-3 lg:py-4 text-left text-xs lg:text-sm font-semibold text-cockpit-heading">CONTACT</th>
                <th className="px-4 lg:px-8 py-3 lg:py-4 text-left text-xs lg:text-sm font-semibold text-cockpit-heading">MEUBLE</th>
                <th className="px-4 lg:px-8 py-3 lg:py-4 text-left text-xs lg:text-sm font-semibold text-cockpit-heading hidden lg:table-cell">SOURCE</th>
                <th className="px-4 lg:px-8 py-3 lg:py-4 text-left text-xs lg:text-sm font-semibold text-cockpit-heading">STATUT</th>
                <th className="px-4 lg:px-8 py-3 lg:py-4 text-left text-xs lg:text-sm font-semibold text-cockpit-heading hidden xl:table-cell">ASSIGNÉ À</th>
                <th className="px-4 lg:px-8 py-3 lg:py-4 text-left text-xs lg:text-sm font-semibold text-cockpit-heading">DATE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cockpit">
              {demandes.length > 0 ? (
                demandes.map((demande) => {
                  const statusColor = getStatusColor(demande.statut);
                  return (
                    <tr key={demande.id} className="hover:bg-cockpit-dark transition-colors">
                      <td className="px-4 lg:px-8 py-3 lg:py-4 text-center text-lg">📋</td>
                      <td className="px-4 lg:px-8 py-3 lg:py-4">
                        <div className="font-medium text-cockpit-primary text-sm">{nomComplet(demande)}</div>
                        <div className="text-xs text-cockpit-secondary truncate max-w-[180px]">{demande.email}</div>
                      </td>
                      <td className="px-4 lg:px-8 py-3 lg:py-4 text-cockpit-secondary text-sm">{demande.meuble || "—"}</td>
                      <td className="px-4 lg:px-8 py-3 lg:py-4 text-cockpit-secondary text-sm hidden lg:table-cell">{demande.source}</td>
                      <td className="px-4 lg:px-8 py-3 lg:py-4">
                        <span className={`inline-block px-2 lg:px-3 py-1 rounded-full text-xs font-semibold ${statusColor.bg} ${statusColor.text}`}>
                          {demande.statut}
                        </span>
                      </td>
                      <td className="px-4 lg:px-8 py-3 lg:py-4 text-cockpit-secondary text-sm hidden xl:table-cell">{demande.assigneA || "—"}</td>
                      <td className="px-4 lg:px-8 py-3 lg:py-4 text-cockpit-secondary text-xs lg:text-sm">
                        {new Date(demande.dateCreation).toLocaleDateString("fr-FR")}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 lg:px-8 py-12 text-center text-cockpit-secondary">
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Chargement...
                      </div>
                    ) : (
                      "Aucune demande"
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Vue cartes (mobile) */}
        <div className="md:hidden divide-y divide-cockpit">
          {loading ? (
            <div className="flex items-center justify-center py-12 gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-cockpit-secondary text-sm">Chargement...</span>
            </div>
          ) : demandes.length > 0 ? (
            demandes.map((demande) => {
              const statusColor = getStatusColor(demande.statut);
              return (
                <div key={demande.id} className="p-4 hover:bg-cockpit-dark transition-colors active:bg-cockpit-dark/80">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-base">📋</span>
                        <p className="text-cockpit-primary font-medium text-sm truncate">{nomComplet(demande)}</p>
                      </div>
                      <p className="text-cockpit-secondary text-xs truncate mt-1">{demande.email}</p>
                      {demande.meuble && (
                        <p className="text-cockpit-secondary text-xs mt-1">Meuble: {demande.meuble}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusColor.bg} ${statusColor.text}`}>
                        {demande.statut}
                      </span>
                      <span className="text-[10px] text-cockpit-secondary">
                        {new Date(demande.dateCreation).toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-cockpit-secondary text-sm">Aucune demande</div>
          )}
        </div>
      </div>
    </div>
  );
}
