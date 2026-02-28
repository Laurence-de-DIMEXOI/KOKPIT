"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { KPICard } from "@/components/dashboard/kpi-card";
import { Inbox, TrendingUp, Clock, AlertCircle, RefreshCw, Loader2 } from "lucide-react";

interface Demande {
  id: string;
  type: "LEAD" | "DEMANDE_PRIX";
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

  // Fonction pour récupérer les demandes
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

  // Charger au montage
  useEffect(() => {
    fetchDemandes(true);
  }, []);

  // Polling automatique chaque 10 secondes (sans loader)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDemandes(false);
    }, 10000); // 10 secondes

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

  const getTypeIcon = (type: string) => {
    return type === "DEMANDE_PRIX" ? "📋" : "👤";
  };

  const nomComplet = (demande: Demande) => {
    return `${demande.prenom || ""} ${demande.nom || ""}`.trim();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-cockpit-heading mb-2">
            Demandes
          </h1>
          <p className="text-cockpit-secondary">
            Gérez vos demandes clients et demandes de prix
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchDemandes(true)}
            disabled={refreshing}
            className="flex items-center gap-2 bg-cockpit-card border border-cockpit px-4 py-3 rounded-lg font-semibold hover:bg-cockpit-dark transition-colors disabled:opacity-50"
          >
            {refreshing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <RefreshCw className="w-5 h-5" />
            )}
            Actualiser
          </button>
          <button className="bg-cockpit-yellow text-cockpit-bg px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity">
            + Nouvelle demande
          </button>
        </div>
      </div>

      {/* Auto-refresh indicator */}
      <div className="flex items-center gap-2 text-xs text-cockpit-secondary">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        Mise à jour auto toutes les 10s • Dernière: {lastUpdate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
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

      {/* Table */}
      <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-cockpit-dark border-b border-cockpit">
              <tr>
                <th className="px-8 py-4 text-left text-sm font-semibold text-cockpit-heading">
                  TYPE
                </th>
                <th className="px-8 py-4 text-left text-sm font-semibold text-cockpit-heading">
                  CONTACT
                </th>
                <th className="px-8 py-4 text-left text-sm font-semibold text-cockpit-heading">
                  MEUBLE
                </th>
                <th className="px-8 py-4 text-left text-sm font-semibold text-cockpit-heading">
                  SOURCE
                </th>
                <th className="px-8 py-4 text-left text-sm font-semibold text-cockpit-heading">
                  STATUT
                </th>
                <th className="px-8 py-4 text-left text-sm font-semibold text-cockpit-heading">
                  ASSIGNÉ À
                </th>
                <th className="px-8 py-4 text-left text-sm font-semibold text-cockpit-heading">
                  DATE
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cockpit">
              {demandes.length > 0 ? (
                demandes.map((demande) => {
                  const statusColor = getStatusColor(demande.statut);
                  return (
                    <tr key={demande.id} className="hover:bg-cockpit-dark transition-colors">
                      <td className="px-8 py-4 text-center text-lg">
                        {getTypeIcon(demande.type)}
                      </td>
                      <td className="px-8 py-4">
                        <div className="font-medium text-cockpit-primary">
                          {nomComplet(demande)}
                        </div>
                        <div className="text-xs text-cockpit-secondary">
                          {demande.email}
                        </div>
                      </td>
                      <td className="px-8 py-4 text-cockpit-secondary text-sm">
                        {demande.meuble || "—"}
                      </td>
                      <td className="px-8 py-4 text-cockpit-secondary text-sm">
                        {demande.source}
                      </td>
                      <td className="px-8 py-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusColor.bg} ${statusColor.text}`}>
                          {demande.statut}
                        </span>
                      </td>
                      <td className="px-8 py-4 text-cockpit-secondary text-sm">
                        {demande.assigneA || "—"}
                      </td>
                      <td className="px-8 py-4 text-cockpit-secondary text-sm">
                        {new Date(demande.dateCreation).toLocaleDateString("fr-FR")}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-8 py-12 text-center text-cockpit-secondary">
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
      </div>
    </div>
  );
}
