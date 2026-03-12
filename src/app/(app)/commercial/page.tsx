"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback, useMemo } from "react";
import { KPICard } from "@/components/dashboard/kpi-card";
import { EvolutionCharts } from "@/components/dashboard/evolution-charts";
import { PerformanceTable } from "@/components/dashboard/performance-table";
import { ExpiringQuotes } from "@/components/dashboard/expiring-quotes";
import { SalesObjective } from "@/components/dashboard/sales-objective";
import { ConversionTime } from "@/components/dashboard/conversion-time";
import {
  FileText,
  ShoppingCart,
  Package,
  TrendingUp,
  RefreshCw,
  Loader2,
  Euro,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";
import clsx from "clsx";

// ===== TYPES =====

type Period = "today" | "week" | "month" | "year";

interface SellsyAmounts {
  total?: string;
  total_raw_excl_tax?: string;
  total_after_discount_excl_tax?: string;
  total_excl_tax?: string;
}

interface EstimateRow {
  id: number;
  number?: string;
  subject?: string;
  status?: string;
  date?: string;
  created?: string;
  company_name?: string;
  contact_id?: number;
  expiry_date?: string;
  amounts?: SellsyAmounts;
  pdf_link?: string;
}

interface OrderRow {
  id: number;
  number?: string;
  subject?: string;
  status?: string;
  contact_id?: number;
  date?: string;
  created?: string;
  company_name?: string;
  amounts?: SellsyAmounts;
  pdf_link?: string;
}

// ===== DATE HELPERS =====

function getPeriodDates(period: Period): { start: string; end: string } {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  let start: Date;

  switch (period) {
    case "today":
      start = new Date(now);
      start.setHours(0, 0, 0, 0);
      break;
    case "week": {
      start = new Date(now);
      const day = start.getDay();
      const diff = day === 0 ? 6 : day - 1; // Lundi = début de semaine
      start.setDate(start.getDate() - diff);
      start.setHours(0, 0, 0, 0);
      break;
    }
    case "month":
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "year":
      start = new Date(now.getFullYear(), 0, 1);
      break;
  }

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

function getPreviousPeriodDates(period: Period): {
  start: string;
  end: string;
} {
  const now = new Date();

  switch (period) {
    case "today": {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      return {
        start: new Date(
          yesterday.getFullYear(),
          yesterday.getMonth(),
          yesterday.getDate()
        ).toISOString(),
        end: new Date(
          yesterday.getFullYear(),
          yesterday.getMonth(),
          yesterday.getDate(),
          23,
          59,
          59,
          999
        ).toISOString(),
      };
    }
    case "week": {
      const start = new Date(now);
      const day = start.getDay();
      const diff = day === 0 ? 6 : day - 1;
      start.setDate(start.getDate() - diff - 7);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return { start: start.toISOString(), end: end.toISOString() };
    }
    case "month": {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { start: start.toISOString(), end: end.toISOString() };
    }
    case "year": {
      const start = new Date(now.getFullYear() - 1, 0, 1);
      const end = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
      return { start: start.toISOString(), end: end.toISOString() };
    }
  }
}

function getAmount(row: { amounts?: SellsyAmounts }): number {
  if (!row.amounts) return 0;
  const a = row.amounts as Record<string, any>;
  const val = a.total ?? a.total_incl_tax ?? a.total_excl_tax ?? a.total_raw_excl_tax ?? "0";
  const num = Number(val);
  return isNaN(num) ? 0 : num;
}

function isCancelled(row: { status?: string }): boolean {
  const s = (row.status || "").toLowerCase();
  return s === "cancelled" || s === "annulé" || s === "annule";
}

function filterByPeriod<T extends { created?: string; date?: string }>(
  items: T[],
  start: string,
  end: string
): T[] {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  return items.filter((item) => {
    const d = new Date(item.date || item.created || "").getTime();
    return d >= s && d <= e;
  });
}

const PERIOD_LABELS: Record<Period, string> = {
  today: "Aujourd'hui",
  week: "Cette semaine",
  month: "Ce mois-ci",
  year: "Cette année",
};

function formatCurrency(amount: number): string {
  return amount.toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// ===== VARIATION BADGE =====

function VariationBadge({
  current,
  previous,
  isCurrency,
}: {
  current: number;
  previous: number;
  isCurrency?: boolean;
}) {
  if (previous === 0 && current === 0) {
    return (
      <span className="flex items-center gap-1 text-xs text-cockpit-secondary">
        <Minus className="w-3 h-3" />—
      </span>
    );
  }

  const pct =
    previous === 0 ? (current > 0 ? 100 : 0) : Math.round(((current - previous) / previous) * 100);

  const isUp = pct > 0;
  const isNeutral = pct === 0;

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
        isNeutral && "bg-white/15 text-white/70",
        isUp && "bg-white/25 text-white",
        !isUp && !isNeutral && "bg-black/15 text-white/90"
      )}
    >
      {isNeutral ? (
        <Minus className="w-3 h-3" />
      ) : isUp ? (
        <ArrowUpRight className="w-3 h-3" />
      ) : (
        <ArrowDownRight className="w-3 h-3" />
      )}
      {isNeutral ? "—" : `${pct > 0 ? "+" : ""}${pct}%`}
    </span>
  );
}

// ===== COMPOSANT PRINCIPAL =====

export default function CommercialDashboardPage() {
  const { data: session } = useSession();
  const [period, setPeriod] = useState<Period>("month");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Raw data from Sellsy
  const [allEstimates, setAllEstimates] = useState<EstimateRow[]>([]);
  const [allOrders, setAllOrders] = useState<OrderRow[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [monthlyEvolution, setMonthlyEvolution] = useState<Array<{
    month: string;
    label: string;
    devis: number;
    commandes: number;
    devisAmount: number;
    commandesAmount: number;
  }>>([]);
  const [evolutionLoading, setEvolutionLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setRefreshing(true);
    try {
      // Use year start as created_start to get recent data (API sorts desc)
      const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString();

      // Fetch estimates with date filter, orders sorted desc, products count, and funnel for charts
      const [estRes, ordRes, itemsRes, funnelRes] = await Promise.all([
        fetch(
          `/api/sellsy/estimates?limit=100&created_start=${encodeURIComponent(yearStart)}`
        ),
        fetch("/api/sellsy/orders?limit=100"),
        fetch("/api/sellsy/items?limit=1"),
        fetch("/api/sellsy/funnel?months=12"),
      ]);

      const estData = await estRes.json();
      const ordData = await ordRes.json();
      const itemsData = await itemsRes.json();
      const funnelData = await funnelRes.json();

      setAllEstimates(estData.estimates || []);
      setAllOrders(ordData.orders || []);
      setTotalProducts(itemsData.pagination?.total || 0);

      if (funnelData.success && funnelData.monthlyFunnel) {
        setMonthlyEvolution(funnelData.monthlyFunnel);
      }
    } catch (error) {
      console.error("Erreur chargement données Sellsy:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setEvolutionLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session?.user) {
      fetchAll();
    }
  }, [session, fetchAll]);

  // Computed stats filtered by period — memoized to avoid recalc on every render
  const { start, end } = useMemo(() => getPeriodDates(period), [period]);
  const { start: prevStart, end: prevEnd } = useMemo(() => getPreviousPeriodDates(period), [period]);

  const periodEstimates = useMemo(() => filterByPeriod(allEstimates, start, end), [allEstimates, start, end]);
  const periodOrders = useMemo(() => filterByPeriod(allOrders, start, end), [allOrders, start, end]);
  const prevEstimates = useMemo(() => filterByPeriod(allEstimates, prevStart, prevEnd), [allEstimates, prevStart, prevEnd]);
  const prevOrders = useMemo(() => filterByPeriod(allOrders, prevStart, prevEnd), [allOrders, prevStart, prevEnd]);

  // Exclure les annulés des calculs de CA
  const activeEstimates = useMemo(() => periodEstimates.filter((e) => !isCancelled(e)), [periodEstimates]);
  const activeOrders = useMemo(() => periodOrders.filter((o) => !isCancelled(o)), [periodOrders]);
  const prevActiveEstimates = useMemo(() => prevEstimates.filter((e) => !isCancelled(e)), [prevEstimates]);
  const prevActiveOrders = useMemo(() => prevOrders.filter((o) => !isCancelled(o)), [prevOrders]);

  const estimatesAmount = useMemo(() => activeEstimates.reduce((sum, e) => sum + getAmount(e), 0), [activeEstimates]);
  const ordersAmount = useMemo(() => activeOrders.reduce((sum, o) => sum + getAmount(o), 0), [activeOrders]);
  const prevEstimatesAmount = useMemo(() => prevActiveEstimates.reduce((sum, e) => sum + getAmount(e), 0), [prevActiveEstimates]);
  const prevOrdersAmount = useMemo(() => prevActiveOrders.reduce((sum, o) => sum + getAmount(o), 0), [prevActiveOrders]);

  const conversionRate = useMemo(() =>
    activeEstimates.length > 0
      ? Math.round((activeOrders.length / activeEstimates.length) * 100)
      : 0, [activeEstimates.length, activeOrders.length]);
  const prevConversionRate = useMemo(() =>
    prevActiveEstimates.length > 0
      ? Math.round((prevActiveOrders.length / prevActiveEstimates.length) * 100)
      : 0, [prevActiveEstimates.length, prevActiveOrders.length]);

  // Global totals (all time, from pagination)
  const totalEstimatesAllTime = allEstimates.length;
  const totalOrdersAllTime = allOrders.length;

  // Top 5 for lists (also exclude cancelled) — memoized sort+slice
  const recentEstimates = useMemo(() =>
    [...activeEstimates]
      .sort(
        (a, b) =>
          new Date(b.date || b.created || "").getTime() -
          new Date(a.date || a.created || "").getTime()
      )
      .slice(0, 5), [activeEstimates]);

  const recentOrders = useMemo(() =>
    [...activeOrders]
      .sort(
        (a, b) =>
          new Date(b.date || b.created || "").getTime() -
          new Date(a.date || a.created || "").getTime()
      )
      .slice(0, 5), [activeOrders]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-cockpit-info" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Header + Period Filter */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-cockpit-heading mb-1">
              Espace Commercial
            </h1>
            <p className="text-cockpit-secondary text-sm sm:text-base">
              Données Sellsy en temps réel
            </p>
          </div>
          <button
            onClick={fetchAll}
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

        {/* Period tabs */}
        <div className="flex flex-wrap gap-2">
          {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={clsx(
                "px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all border",
                period === p
                  ? "bg-cockpit-info/15 text-cockpit-info border-cockpit-info/30"
                  : "bg-cockpit-card text-cockpit-secondary border-cockpit hover:text-cockpit-primary hover:border-cockpit-info/20"
              )}
            >
              <Calendar className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
        <div className="rounded-xl p-4 sm:p-5 transition-transform duration-200 hover:-translate-y-0.5" style={{ background: 'linear-gradient(135deg, #118C8C 0%, #0E6973 100%)', boxShadow: '0 4px 14px rgba(14, 105, 115, 0.30)' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs sm:text-sm font-semibold text-white/75">
              Devis
            </p>
            <FileText className="w-5 h-5 text-white/60" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-white">
            {activeEstimates.length}
          </p>
          <VariationBadge
            current={activeEstimates.length}
            previous={prevActiveEstimates.length}
          />
        </div>

        <div className="rounded-xl p-4 sm:p-5 transition-transform duration-200 hover:-translate-y-0.5" style={{ background: 'linear-gradient(135deg, #71DD37 0%, #5AC42D 100%)', boxShadow: '0 4px 14px rgba(113, 221, 55, 0.30)' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs sm:text-sm font-semibold text-white/75">
              Commandes
            </p>
            <ShoppingCart className="w-5 h-5 text-white/60" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-white">
            {activeOrders.length}
          </p>
          <VariationBadge
            current={activeOrders.length}
            previous={prevActiveOrders.length}
          />
        </div>

        <div className="rounded-xl p-4 sm:p-5 transition-transform duration-200 hover:-translate-y-0.5" style={{ background: 'linear-gradient(135deg, #BAD9CE 0%, #8BB8A5 100%)', boxShadow: '0 4px 14px rgba(186, 217, 206, 0.35)' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs sm:text-sm font-semibold text-white/75">
              Produits
            </p>
            <Package className="w-5 h-5 text-white/60" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-white">
            {totalProducts}
          </p>
          <span className="text-xs text-white/70">Catalogue</span>
        </div>

        <div className="rounded-xl p-4 sm:p-5 transition-transform duration-200 hover:-translate-y-0.5" style={{ background: 'linear-gradient(135deg, #F2BB16 0%, #BF820F 100%)', boxShadow: '0 4px 14px rgba(242, 187, 22, 0.30)' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs sm:text-sm font-semibold text-white/75">
              Conversion
            </p>
            <TrendingUp className="w-5 h-5 text-white/60" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-white">
            {conversionRate}%
          </p>
          <VariationBadge
            current={conversionRate}
            previous={prevConversionRate}
          />
        </div>

        <ConversionTime
          estimates={periodEstimates}
          orders={periodOrders}
          previousEstimates={prevEstimates}
          previousOrders={prevOrders}
        />
      </div>

      {/* Objectif commercial */}
      <SalesObjective currentAmount={ordersAmount} />

      {/* Amount Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
        <div className="bg-cockpit-card rounded-xl border-t-[3px] border-t-[#118C8C] border border-cockpit shadow-cockpit-lg p-4 sm:p-6 transition-all duration-200 hover:shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cockpit-info/15 flex items-center justify-center">
                <Euro className="w-5 h-5 text-cockpit-info" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-cockpit-secondary">
                  CA Devis
                </h3>
                <p className="text-xs text-cockpit-secondary">
                  {PERIOD_LABELS[period]}
                </p>
              </div>
            </div>
            <VariationBadge
              current={estimatesAmount}
              previous={prevEstimatesAmount}
              isCurrency
            />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-cockpit-heading">
            {formatCurrency(estimatesAmount)}
          </p>
        </div>

        <div className="bg-cockpit-card rounded-xl border-t-[3px] border-t-[#71DD37] border border-cockpit shadow-cockpit-lg p-4 sm:p-6 transition-all duration-200 hover:shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cockpit-success/15 flex items-center justify-center">
                <Euro className="w-5 h-5 text-cockpit-success" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-cockpit-secondary">
                  CA Commandes
                </h3>
                <p className="text-xs text-cockpit-secondary">
                  {PERIOD_LABELS[period]}
                </p>
              </div>
            </div>
            <VariationBadge
              current={ordersAmount}
              previous={prevOrdersAmount}
              isCurrency
            />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-cockpit-heading">
            {formatCurrency(ordersAmount)}
          </p>
        </div>
      </div>

      {/* Alertes devis expirants */}
      <ExpiringQuotes estimates={allEstimates} />

      {/* Graphiques évolution Devis & Commandes sur l'année */}
      <EvolutionCharts data={monthlyEvolution} loading={evolutionLoading} />

      {/* Tableau performance commerciaux */}
      <PerformanceTable />

      {/* Recent data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Recent Estimates */}
        <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-cockpit-heading">
              Derniers devis
            </h3>
            <span className="text-xs bg-cockpit-info/10 text-cockpit-info px-2 py-1 rounded-full font-semibold">
              {activeEstimates.length} sur la période
            </span>
          </div>
          {recentEstimates.length > 0 ? (
            <div className="space-y-3">
              {recentEstimates.map((est) => (
                <div
                  key={est.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-cockpit-dark/50 border border-cockpit"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-cockpit-primary truncate">
                      {est.number || est.subject || `Devis #${est.id}`}
                    </p>
                    <p className="text-xs text-cockpit-secondary">
                      {est.company_name || est.status || "—"}
                      {est.date &&
                        ` • ${new Date(est.date).toLocaleDateString("fr-FR")}`}
                    </p>
                  </div>
                  <a
                    href={est.pdf_link || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-cockpit-heading ml-3 whitespace-nowrap hover:text-cockpit-info transition-colors"
                  >
                    {formatCurrency(getAmount(est))}
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-cockpit-secondary text-sm py-4 text-center">
              Aucun devis sur cette période
            </p>
          )}
        </div>

        {/* Recent Orders */}
        <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-cockpit-heading">
              Dernières commandes
            </h3>
            <span className="text-xs bg-cockpit-success/10 text-cockpit-success px-2 py-1 rounded-full font-semibold">
              {activeOrders.length} sur la période
            </span>
          </div>
          {recentOrders.length > 0 ? (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-cockpit-dark/50 border border-cockpit"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-cockpit-primary truncate">
                      {order.number ||
                        order.subject ||
                        `Commande #${order.id}`}
                    </p>
                    <p className="text-xs text-cockpit-secondary">
                      {order.company_name || order.status || "—"}
                      {order.date &&
                        ` • ${new Date(order.date).toLocaleDateString("fr-FR")}`}
                    </p>
                  </div>
                  <a
                    href={order.pdf_link || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-cockpit-heading ml-3 whitespace-nowrap hover:text-cockpit-info transition-colors"
                  >
                    {formatCurrency(getAmount(order))}
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-cockpit-secondary text-sm py-4 text-center">
              Aucune commande sur cette période
            </p>
          )}
        </div>
      </div>

      {/* Summary footer */}
      <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cockpit-yellow/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-cockpit-yellow" />
            </div>
            <div>
              <p className="text-sm font-semibold text-cockpit-heading">
                Volume total chargé
              </p>
              <p className="text-xs text-cockpit-secondary">
                {totalEstimatesAllTime} devis • {totalOrdersAllTime} commandes •{" "}
                {totalProducts} produits
              </p>
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-cockpit-yellow">
            {formatCurrency(estimatesAmount + ordersAmount)}
            <span className="text-sm font-normal text-cockpit-secondary ml-2">
              {PERIOD_LABELS[period]}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
