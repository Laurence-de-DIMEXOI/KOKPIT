"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { KPICard } from "@/components/dashboard/kpi-card";
import {
  FileText,
  ShoppingCart,
  Package,
  TrendingUp,
  RefreshCw,
  Loader2,
  Euro,
} from "lucide-react";

interface CommercialStats {
  totalEstimates: number;
  totalOrders: number;
  totalProducts: number;
  estimatesAmount: number;
  ordersAmount: number;
  conversionRate: number;
}

export default function CommercialDashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<CommercialStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recentEstimates, setRecentEstimates] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  const fetchStats = async () => {
    setRefreshing(true);
    try {
      const [estimatesRes, ordersRes, itemsRes] = await Promise.all([
        fetch("/api/sellsy/estimates?limit=10"),
        fetch("/api/sellsy/orders?limit=10"),
        fetch("/api/sellsy/items?limit=1"),
      ]);

      const estimatesData = await estimatesRes.json();
      const ordersData = await ordersRes.json();
      const itemsData = await itemsRes.json();

      const estimates = estimatesData.estimates || [];
      const orders = ordersData.orders || [];

      // Calculate totals from paginated results
      const totalEstimates = estimatesData.pagination?.total || estimates.length;
      const totalOrders = ordersData.pagination?.total || orders.length;
      const totalProducts = itemsData.pagination?.total || 0;

      // Sum amounts
      const estimatesAmount = estimates.reduce(
        (sum: number, e: any) => sum + (parseFloat(e.total) || 0),
        0
      );
      const ordersAmount = orders.reduce(
        (sum: number, o: any) => sum + (parseFloat(o.total) || 0),
        0
      );

      const conversionRate =
        totalEstimates > 0
          ? Math.round((totalOrders / totalEstimates) * 100)
          : 0;

      setStats({
        totalEstimates,
        totalOrders,
        totalProducts,
        estimatesAmount,
        ordersAmount,
        conversionRate,
      });

      setRecentEstimates(estimates.slice(0, 5));
      setRecentOrders(orders.slice(0, 5));
    } catch (error) {
      console.error("Erreur chargement stats commerciales:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchStats();
    }
  }, [session]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-cockpit-info" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-cockpit-heading mb-1">
            Espace Commercial
          </h1>
          <p className="text-cockpit-secondary text-sm sm:text-base">
            Vue d&apos;ensemble Sellsy
          </p>
        </div>
        <button
          onClick={fetchStats}
          disabled={refreshing}
          className="flex items-center justify-center gap-2 bg-cockpit-card border border-cockpit px-4 py-2.5 rounded-lg font-semibold hover:bg-cockpit-dark transition-colors disabled:opacity-50 text-sm"
        >
          {refreshing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Synchroniser
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <KPICard
          title="Devis"
          value={stats?.totalEstimates ?? 0}
          icon={<FileText className="w-7 h-7" />}
          bgColor="bg-cockpit-info"
        />
        <KPICard
          title="Commandes"
          value={stats?.totalOrders ?? 0}
          icon={<ShoppingCart className="w-7 h-7" />}
          bgColor="bg-cockpit-success"
        />
        <KPICard
          title="Produits"
          value={stats?.totalProducts ?? 0}
          icon={<Package className="w-7 h-7" />}
          bgColor="bg-cockpit-warning"
        />
        <KPICard
          title="Conversion"
          value={`${stats?.conversionRate ?? 0}%`}
          icon={<TrendingUp className="w-7 h-7" />}
          bgColor="bg-cockpit-yellow"
        />
      </div>

      {/* Amounts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
        <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-2">
            <Euro className="w-5 h-5 text-cockpit-info" />
            <h3 className="text-sm font-semibold text-cockpit-secondary">
              Montant Devis (derniers)
            </h3>
          </div>
          <p className="text-2xl font-bold text-cockpit-heading">
            {(stats?.estimatesAmount ?? 0).toLocaleString("fr-FR", {
              style: "currency",
              currency: "EUR",
            })}
          </p>
        </div>
        <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-2">
            <Euro className="w-5 h-5 text-cockpit-success" />
            <h3 className="text-sm font-semibold text-cockpit-secondary">
              Montant Commandes (dernières)
            </h3>
          </div>
          <p className="text-2xl font-bold text-cockpit-heading">
            {(stats?.ordersAmount ?? 0).toLocaleString("fr-FR", {
              style: "currency",
              currency: "EUR",
            })}
          </p>
        </div>
      </div>

      {/* Recent data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Recent Estimates */}
        <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg p-4 sm:p-6">
          <h3 className="text-lg font-bold text-cockpit-heading mb-4">
            Derniers devis
          </h3>
          {recentEstimates.length > 0 ? (
            <div className="space-y-3">
              {recentEstimates.map((est: any) => (
                <div
                  key={est.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-cockpit-dark/50 border border-cockpit"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-cockpit-primary truncate">
                      {est.subject || est.reference || `Devis #${est.id}`}
                    </p>
                    <p className="text-xs text-cockpit-secondary">
                      {est.status || "—"}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-cockpit-heading ml-3">
                    {parseFloat(est.total || 0).toLocaleString("fr-FR", {
                      style: "currency",
                      currency: "EUR",
                    })}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-cockpit-secondary text-sm">
              Aucun devis récent
            </p>
          )}
        </div>

        {/* Recent Orders */}
        <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg p-4 sm:p-6">
          <h3 className="text-lg font-bold text-cockpit-heading mb-4">
            Dernières commandes
          </h3>
          {recentOrders.length > 0 ? (
            <div className="space-y-3">
              {recentOrders.map((order: any) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-cockpit-dark/50 border border-cockpit"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-cockpit-primary truncate">
                      {order.subject || order.reference || `Commande #${order.id}`}
                    </p>
                    <p className="text-xs text-cockpit-secondary">
                      {order.status || "—"}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-cockpit-heading ml-3">
                    {parseFloat(order.total || 0).toLocaleString("fr-FR", {
                      style: "currency",
                      currency: "EUR",
                    })}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-cockpit-secondary text-sm">
              Aucune commande récente
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
