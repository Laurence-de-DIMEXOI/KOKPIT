"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { KPICard } from "@/components/dashboard/kpi-card";
import { LeadsChart } from "@/components/dashboard/leads-chart";
import { Users, TrendingUp, FileText, Activity, RefreshCw, Loader2 } from "lucide-react";

interface DashboardStats {
  totalLeads: number;
  newLeads: number;
  pendingDevis: number;
  conversionRate: number;
  statsBySource: Array<{
    source: string;
    count: number;
  }>;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchStats = async (showLoader = true) => {
    if (showLoader) setRefreshing(true);
    try {
      const params = new URLSearchParams({
        vue: session?.user?.role || "ADMIN",
      });

      const response = await fetch(`/api/dashboard/stats?${params}`);
      const data = await response.json();
      setStats(data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Erreur lors du chargement des stats:", error);
    } finally {
      setLoading(false);
      if (showLoader) setRefreshing(false);
    }
  };

  // Charger au montage
  useEffect(() => {
    if (session?.user) {
      fetchStats(true);
    }
  }, [session]);

  // Polling automatique chaque 10 secondes (sans loader)
  useEffect(() => {
    const interval = setInterval(() => {
      if (session?.user) {
        fetchStats(false);
      }
    }, 10000); // 10 secondes

    return () => clearInterval(interval);
  }, [session]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-cockpit-secondary">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-cockpit-heading mb-1 sm:mb-2">
            Tableau de bord
          </h1>
          <p className="text-cockpit-secondary text-sm sm:text-base">
            Bienvenue, {session?.user?.prenom}
          </p>
        </div>
        <button
          onClick={() => fetchStats(true)}
          disabled={refreshing}
          className="flex items-center justify-center gap-2 bg-cockpit-card border border-cockpit px-4 py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-cockpit-dark transition-colors disabled:opacity-50 text-sm sm:text-base"
        >
          {refreshing ? (
            <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
          )}
          Actualiser
        </button>
      </div>

      {/* Auto-refresh indicator */}
      <div className="flex items-center gap-2 text-xs text-cockpit-secondary">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        Mise à jour auto toutes les 10s • Dernière: {lastUpdate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-8">
        <KPICard
          title="Demandes totales"
          value={stats?.totalLeads ?? 0}
          icon={<Users className="w-7 h-7" />}
          bgColor="bg-cockpit-yellow"
        />
        <KPICard
          title="Nouvelles demandes"
          value={stats?.newLeads ?? 0}
          change={{ value: 8.2, direction: "up" }}
          icon={<TrendingUp className="w-7 h-7" />}
          bgColor="bg-cockpit-info"
        />
        <KPICard
          title="Devis envoyés"
          value={stats?.pendingDevis ?? 0}
          change={{ value: 2.1, direction: "down" }}
          icon={<FileText className="w-7 h-7" />}
          bgColor="bg-cockpit-warning"
        />
        <KPICard
          title="Taux de conversion"
          value={`${stats?.conversionRate ?? 0}%`}
          change={{ value: 5.3, direction: "up" }}
          icon={<Activity className="w-7 h-7" />}
          bgColor="bg-cockpit-success"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8">
        <LeadsChart />
        <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg p-4 sm:p-6 lg:p-12">
          <h3 className="text-lg font-bold text-cockpit-heading mb-6">
            Entonnoir de conversion
          </h3>
          <div className="flex items-center justify-center h-80">
            <p className="text-cockpit-secondary">
              Données en cours de chargement...
            </p>
          </div>
        </div>
      </div>

      {/* SLA Alerts */}
      <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg p-4 sm:p-6 lg:p-12">
        <h3 className="text-lg font-bold text-cockpit-heading mb-6">
          Aucune alerte SLA
        </h3>
        <p className="text-cockpit-secondary">
          Tous vos devis sont à jour
        </p>
      </div>
    </div>
  );
}
