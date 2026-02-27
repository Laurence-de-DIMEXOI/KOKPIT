"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { KPICard } from "@/components/dashboard/kpi-card";
import { LeadsChart } from "@/components/dashboard/leads-chart";
import { Users, TrendingUp, FileText, Activity } from "lucide-react";

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

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const params = new URLSearchParams({
          vue: session?.user?.role || "ADMIN",
        });

        const response = await fetch(`/api/dashboard/stats?${params}`);
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error("Erreur lors du chargement des stats:", error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user) {
      fetchStats();
    }
  }, [session]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-cockpit-secondary">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-cockpit-heading mb-2">
          Tableau de bord
        </h1>
        <p className="text-cockpit-secondary">
          Bienvenue, {session?.user?.prenom}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <LeadsChart />
        <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg p-12">
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
      <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg p-12">
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
