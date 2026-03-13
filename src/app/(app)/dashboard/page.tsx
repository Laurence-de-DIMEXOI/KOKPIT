"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Users,
  TrendingUp,
  FileText,
  ShoppingCart,
  RefreshCw,
  Loader2,
  ArrowRight,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Target,
  ArrowDownRight,
  ArrowUpRight,
  Minus,
  Mail,
  DollarSign,
  Megaphone,
} from "lucide-react";
import clsx from "clsx";
import { RechartsLineChart } from "@/components/dashboard/line-chart";

// ===== TYPES =====

interface FunnelKPIs {
  totalContacts: number;
  totalWithEstimate: number;
  totalWithOrder: number;
  globalConversionDevis: number;
  globalConversionCommande: number;
  globalConversionGlobale: number;
}

interface MonthlyFunnel {
  month: string;
  label: string;
  contacts: number;
  devis: number;
  commandes: number;
  devisAmount: number;
  commandesAmount: number;
  conversionDevis: number;
  conversionCommande: number;
  conversionGlobale: number;
}

interface ContactSansDevis {
  id: number;
  name: string;
  created: string;
  email: string;
}

interface FunnelData {
  kpis: FunnelKPIs;
  monthlyFunnel: MonthlyFunnel[];
  contactsSansDevis: ContactSansDevis[];
}

// ===== COMPONENT =====

export default function DashboardPage() {
  const { data: session } = useSession();
  const [funnel, setFunnel] = useState<FunnelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showAllContacts, setShowAllContacts] = useState(false);
  const [metaMonthly, setMetaMonthly] = useState<Record<string, { spend: number; impressions: number; clicks: number; conversions: number }>>({});

  const fetchFunnel = useCallback(async (showLoader = true) => {
    if (showLoader) setRefreshing(true);
    setError(null);
    try {
      const res = await fetch("/api/sellsy/funnel?months=12");
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Erreur inconnue");
      setFunnel(data);
    } catch (err: any) {
      console.error("Erreur funnel:", err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchMetaMonthly = useCallback(async () => {
    try {
      const res = await fetch("/api/meta/monthly-spend");
      if (!res.ok) return;
      const data = await res.json();
      const map: Record<string, { spend: number; impressions: number; clicks: number; conversions: number }> = {};
      for (const m of data.months || []) {
        map[m.month] = { spend: m.spend, impressions: m.impressions, clicks: m.clicks, conversions: m.conversions };
      }
      setMetaMonthly(map);
    } catch {
      // silencieux
    }
  }, []);

  useEffect(() => {
    if (session?.user) {
      fetchFunnel(true);
      fetchMetaMonthly();
    }
  }, [session, fetchFunnel, fetchMetaMonthly]);

  // Tableau statistique : combine funnel (devis/commandes montants) + Meta (budget)
  // Les hooks doivent être appelés AVANT les early returns
  const monthly = funnel?.monthlyFunnel || [];
  const roiTable = useMemo(() => {
    return monthly.map((m) => {
      const meta = metaMonthly[m.month] || { spend: 0, impressions: 0, clicks: 0, conversions: 0 };
      const roas = meta.spend > 0 ? m.commandesAmount / meta.spend : 0;
      return {
        month: m.month,
        label: m.label,
        devisAmount: m.devisAmount,
        commandesAmount: m.commandesAmount,
        metaSpend: meta.spend,
        roas: Math.round(roas * 100) / 100,
      };
    });
  }, [monthly, metaMonthly]);

  const roiTotals = useMemo(() => {
    const totalDevis = roiTable.reduce((s, r) => s + r.devisAmount, 0);
    const totalCommandes = roiTable.reduce((s, r) => s + r.commandesAmount, 0);
    const totalMeta = roiTable.reduce((s, r) => s + r.metaSpend, 0);
    const totalRoas = totalMeta > 0 ? Math.round((totalCommandes / totalMeta) * 100) / 100 : 0;
    return { totalDevis, totalCommandes, totalMeta, totalRoas };
  }, [roiTable]);

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="h-8 w-72 bg-cockpit-card rounded-lg animate-pulse" />
            <div className="h-4 w-56 bg-cockpit-card rounded mt-2 animate-pulse" />
          </div>
          <div className="h-10 w-32 bg-cockpit-card rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl p-4 bg-cockpit-card animate-pulse h-28">
              <div className="h-4 w-12 bg-cockpit-dark rounded mb-3" />
              <div className="h-3 w-24 bg-cockpit-dark rounded mb-2" />
              <div className="h-7 w-16 bg-cockpit-dark rounded" />
            </div>
          ))}
        </div>
        <div className="bg-white border border-cockpit rounded-xl p-5 shadow-cockpit-lg animate-pulse">
          <div className="h-5 w-48 bg-cockpit-card rounded mb-6" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-28 h-4 bg-cockpit-card rounded" />
                <div className={`flex-1 h-10 bg-cockpit-card rounded-lg`} style={{ width: `${100 - i * 25}%` }} />
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white border border-cockpit rounded-xl p-5 shadow-cockpit-lg animate-pulse">
          <div className="h-5 w-40 bg-cockpit-card rounded mb-4" />
          <div className="h-[300px] bg-cockpit-card rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-cockpit-dark border border-cockpit-error/30 rounded-xl p-8 text-center max-w-md">
          <AlertCircle className="w-10 h-10 text-cockpit-error mx-auto mb-3" />
          <p className="text-cockpit-heading font-semibold mb-2">Erreur de chargement</p>
          <p className="text-cockpit-secondary text-sm mb-4">{error}</p>
          <button
            onClick={() => fetchFunnel(true)}
            className="px-4 py-2 font-medium rounded-lg transition text-white"
            style={{ backgroundColor: 'var(--mk-raspberry, #C2185B)' }}
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  const kpis = funnel!.kpis;
  const contactsSansDevis = funnel!.contactsSansDevis;

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-cockpit-heading mb-1">
            Marketing — Funnel de conversion
          </h1>
          <p className="text-cockpit-secondary text-sm">
            Suivi du parcours client : Contact → Devis → Commande
          </p>
        </div>
        <button
          onClick={() => fetchFunnel(true)}
          disabled={refreshing}
          className="flex items-center gap-2 bg-cockpit-dark border border-cockpit px-4 py-2.5 rounded-lg font-medium hover:bg-cockpit-card transition disabled:opacity-50 text-sm"
        >
          {refreshing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Actualiser
        </button>
      </div>

      {/* KPI Cards — Funnel global */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total contacts — Lemon */}
        <div className="rounded-xl p-3 sm:p-4 transition-transform duration-200 hover:-translate-y-0.5" style={{ background: 'linear-gradient(135deg, #E2A90A 0%, #C89208 100%)', boxShadow: '0 4px 14px rgba(226, 169, 10, 0.30)' }}>
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5 text-white/70" />
          </div>
          <p className="text-white/75 text-xs mb-1">Contacts Sellsy</p>
          <p className="text-2xl font-bold text-white">{kpis.totalContacts}</p>
        </div>

        {/* Contacts → Devis — Lime */}
        <div className="rounded-xl p-3 sm:p-4 transition-transform duration-200 hover:-translate-y-0.5" style={{ background: 'linear-gradient(135deg, #8DA035 0%, #6E8028 100%)', boxShadow: '0 4px 14px rgba(141, 160, 53, 0.30)' }}>
          <div className="flex items-center justify-between mb-2">
            <FileText className="w-5 h-5 text-white/70" />
            <span className="text-xs font-bold text-white bg-white/20 px-2 py-0.5 rounded-full">
              {kpis.globalConversionDevis}%
            </span>
          </div>
          <p className="text-white/75 text-xs mb-1">Ont un devis</p>
          <p className="text-2xl font-bold text-white">{kpis.totalWithEstimate}</p>
        </div>

        {/* Devis → Commande — Pink Grapefruit */}
        <div className="rounded-xl p-3 sm:p-4 transition-transform duration-200 hover:-translate-y-0.5" style={{ background: 'linear-gradient(135deg, #D4567A 0%, #B8406A 100%)', boxShadow: '0 4px 14px rgba(212, 86, 122, 0.30)' }}>
          <div className="flex items-center justify-between mb-2">
            <ShoppingCart className="w-5 h-5 text-white/70" />
            <span className="text-xs font-bold text-white bg-white/20 px-2 py-0.5 rounded-full">
              {kpis.globalConversionCommande}%
            </span>
          </div>
          <p className="text-white/75 text-xs mb-1">Ont commandé</p>
          <p className="text-2xl font-bold text-white">{kpis.totalWithOrder}</p>
        </div>

        {/* Conversion globale — Raspberry */}
        <div className="rounded-xl p-3 sm:p-4 transition-transform duration-200 hover:-translate-y-0.5" style={{ background: 'linear-gradient(135deg, #C2185B 0%, #A01248 100%)', boxShadow: '0 4px 14px rgba(194, 24, 91, 0.30)' }}>
          <div className="flex items-center justify-between mb-2">
            <Target className="w-5 h-5 text-white/70" />
          </div>
          <p className="text-white/75 text-xs mb-1">Conversion globale</p>
          <p className="text-2xl font-bold text-white">{kpis.globalConversionGlobale}%</p>
          <p className="text-white/60 text-[10px] mt-1">Contact → Commande</p>
        </div>
      </div>

      {/* Entonnoir visuel */}
      <div className="bg-white border border-cockpit rounded-xl p-4 sm:p-5 shadow-cockpit-lg">
        <h2 className="text-base font-bold text-cockpit-heading mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" style={{ color: 'var(--mk-raspberry)' }} />
          Entonnoir de conversion
        </h2>
        <div className="space-y-4">
          {/* Contacts */}
          <div className="flex items-center gap-4">
            <div className="w-28 text-sm text-cockpit-secondary text-right flex-shrink-0">Contacts</div>
            <div className="flex-1 relative">
              <div
                className="h-10 rounded-lg flex items-center px-4"
                style={{ width: "100%", background: "linear-gradient(90deg, #E2A90A 0%, #C89208 100%)" }}
              >
                <span className="text-white font-bold text-sm">{kpis.totalContacts}</span>
              </div>
            </div>
          </div>
          {/* Arrow */}
          <div className="flex items-center gap-4">
            <div className="w-28 text-right flex-shrink-0">
              <span className="text-xs font-semibold" style={{ color: 'var(--mk-lime)' }}>{kpis.globalConversionDevis}%</span>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <ChevronDown className="w-4 h-4 text-cockpit-secondary" />
            </div>
          </div>
          {/* Devis */}
          <div className="flex items-center gap-4">
            <div className="w-28 text-sm text-cockpit-secondary text-right flex-shrink-0">Devis</div>
            <div className="flex-1 relative">
              <div
                className="h-10 rounded-lg flex items-center px-4"
                style={{
                  width: kpis.totalContacts > 0
                    ? `${Math.max((kpis.totalWithEstimate / kpis.totalContacts) * 100, 10)}%`
                    : "10%",
                  background: "linear-gradient(90deg, #8DA035 0%, #6E8028 100%)",
                }}
              >
                <span className="text-white font-bold text-sm">{kpis.totalWithEstimate}</span>
              </div>
            </div>
          </div>
          {/* Arrow */}
          <div className="flex items-center gap-4">
            <div className="w-28 text-right flex-shrink-0">
              <span className="text-xs font-semibold" style={{ color: 'var(--mk-grapefruit)' }}>{kpis.globalConversionCommande}%</span>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <ChevronDown className="w-4 h-4 text-cockpit-secondary" />
            </div>
          </div>
          {/* Commandes */}
          <div className="flex items-center gap-4">
            <div className="w-28 text-sm text-cockpit-secondary text-right flex-shrink-0">Commandes</div>
            <div className="flex-1 relative">
              <div
                className="h-10 rounded-lg flex items-center px-4"
                style={{
                  width: kpis.totalContacts > 0
                    ? `${Math.max((kpis.totalWithOrder / kpis.totalContacts) * 100, 8)}%`
                    : "8%",
                  background: "linear-gradient(90deg, #D4567A 0%, #B8406A 100%)",
                }}
              >
                <span className="text-white font-bold text-sm">{kpis.totalWithOrder}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Graphique mensuel — courbes */}
      <div className="bg-white border border-cockpit rounded-xl p-4 sm:p-5 shadow-cockpit-lg">
        <h2 className="text-base font-bold text-cockpit-heading mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" style={{ color: 'var(--mk-raspberry)' }} />
          Évolution mensuelle
        </h2>
        <RechartsLineChart
          data={monthly.map((m) => ({
            label: m.label.split(" ")[0].substring(0, 4) + ".",
            Contacts: m.contacts,
            Devis: m.devis,
            Commandes: m.commandes,
          }))}
          series={[
            { dataKey: "Contacts", name: "Contacts", color: "#E2A90A" },
            { dataKey: "Devis", name: "Devis", color: "#8DA035" },
            { dataKey: "Commandes", name: "Commandes", color: "#C2185B" },
          ]}
          height={300}
        />
      </div>

      {/* Tableau mensuel détaillé */}
      <div className="bg-white border border-cockpit rounded-xl overflow-hidden shadow-cockpit-lg">
        <div className="p-4 sm:p-5 pb-3">
          <h2 className="text-base font-bold text-cockpit-heading flex items-center gap-2">
            <FileText className="w-5 h-5" style={{ color: 'var(--mk-raspberry)' }} />
            Détail mensuel
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-cockpit border-y border-cockpit">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-cockpit-heading">Mois</th>
                <th className="px-6 py-3 text-center text-xs font-semibold" style={{ color: 'var(--mk-lemon)' }}>Contacts</th>
                <th className="px-6 py-3 text-center text-xs font-semibold" style={{ color: 'var(--mk-lime)' }}>Devis</th>
                <th className="px-6 py-3 text-center text-xs font-semibold" style={{ color: 'var(--mk-grapefruit)' }}>Commandes</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-cockpit-heading">Contact→Devis</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-cockpit-heading">Devis→Cde</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-cockpit-heading">Global</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cockpit">
              {monthly.map((m) => (
                <tr key={m.month} className="hover:bg-cockpit/30 transition">
                  <td className="px-6 py-3 text-sm font-medium text-cockpit-heading">{m.label}</td>
                  <td className="px-6 py-3 text-center text-sm font-semibold" style={{ color: 'var(--mk-lemon)' }}>{m.contacts}</td>
                  <td className="px-6 py-3 text-center text-sm font-semibold" style={{ color: 'var(--mk-lime)' }}>{m.devis}</td>
                  <td className="px-6 py-3 text-center text-sm font-semibold" style={{ color: 'var(--mk-grapefruit)' }}>{m.commandes}</td>
                  <td className="px-6 py-3 text-center">
                    <span className={clsx(
                      "text-xs font-bold px-2 py-0.5 rounded-full",
                      m.conversionDevis > 50 ? "bg-[#8DA035]/15 text-[#8DA035]"
                        : m.conversionDevis > 20 ? "bg-[#E2A90A]/15 text-[#E2A90A]"
                        : "bg-[#C2185B]/15 text-[#C2185B]"
                    )}>
                      {m.conversionDevis}%
                    </span>
                  </td>
                  <td className="px-6 py-3 text-center">
                    <span className={clsx(
                      "text-xs font-bold px-2 py-0.5 rounded-full",
                      m.conversionCommande > 50 ? "bg-[#8DA035]/15 text-[#8DA035]"
                        : m.conversionCommande > 20 ? "bg-[#E2A90A]/15 text-[#E2A90A]"
                        : "bg-[#C2185B]/15 text-[#C2185B]"
                    )}>
                      {m.conversionCommande}%
                    </span>
                  </td>
                  <td className="px-6 py-3 text-center">
                    <span className={clsx(
                      "text-xs font-bold px-2 py-0.5 rounded-full",
                      m.conversionGlobale > 30 ? "bg-[#8DA035]/15 text-[#8DA035]"
                        : m.conversionGlobale > 10 ? "bg-[#E2A90A]/15 text-[#E2A90A]"
                        : "bg-[#C2185B]/15 text-[#C2185B]"
                    )}>
                      {m.conversionGlobale}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tableau ROI — Montants + Budget Meta + ROAS */}
      <div className="bg-white border border-cockpit rounded-xl overflow-hidden shadow-cockpit-lg">
        <div className="p-4 sm:p-5 pb-3">
          <h2 className="text-base font-bold text-cockpit-heading flex items-center gap-2">
            <DollarSign className="w-5 h-5" style={{ color: 'var(--mk-raspberry)' }} />
            Performance financière
            <span className="text-xs font-normal text-cockpit-secondary ml-1">12 derniers mois</span>
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-cockpit border-y border-cockpit">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-cockpit-heading">Mois</th>
                <th className="px-4 py-3 text-right text-xs font-semibold" style={{ color: 'var(--mk-lime)' }}>
                  Montant devis
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold" style={{ color: 'var(--mk-grapefruit)' }}>
                  Montant BDC
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold" style={{ color: 'var(--mk-lemon)' }}>
                  <span className="flex items-center justify-end gap-1">
                    <Megaphone className="w-3.5 h-3.5" />
                    Budget Meta
                  </span>
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-cockpit-heading">ROAS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cockpit">
              {roiTable.map((r) => (
                <tr key={r.month} className="hover:bg-cockpit/30 transition">
                  <td className="px-4 py-2.5 text-sm font-medium text-cockpit-heading">{r.label}</td>
                  <td className="px-4 py-2.5 text-right text-sm tabular-nums" style={{ color: 'var(--mk-lime)' }}>
                    {r.devisAmount > 0 ? r.devisAmount.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }) : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-right text-sm tabular-nums" style={{ color: 'var(--mk-grapefruit)' }}>
                    {r.commandesAmount > 0 ? r.commandesAmount.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }) : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-right text-sm tabular-nums" style={{ color: 'var(--mk-lemon)' }}>
                    {r.metaSpend > 0 ? r.metaSpend.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }) : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {r.roas > 0 ? (
                      <span className={clsx(
                        "text-xs font-bold px-2 py-0.5 rounded-full",
                        r.roas >= 3 ? "bg-[#8DA035]/15 text-[#8DA035]"
                          : r.roas >= 1 ? "bg-[#E2A90A]/15 text-[#E2A90A]"
                          : "bg-[#C2185B]/15 text-[#C2185B]"
                      )}>
                        {r.roas.toFixed(1)}x
                      </span>
                    ) : (
                      <span className="text-xs text-cockpit-secondary">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            {/* Ligne total */}
            <tfoot className="bg-cockpit border-t-2 border-cockpit">
              <tr className="font-bold">
                <td className="px-4 py-3 text-sm text-cockpit-heading">Total</td>
                <td className="px-4 py-3 text-right text-sm tabular-nums" style={{ color: 'var(--mk-lime)' }}>
                  {roiTotals.totalDevis > 0 ? roiTotals.totalDevis.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }) : "—"}
                </td>
                <td className="px-4 py-3 text-right text-sm tabular-nums" style={{ color: 'var(--mk-grapefruit)' }}>
                  {roiTotals.totalCommandes > 0 ? roiTotals.totalCommandes.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }) : "—"}
                </td>
                <td className="px-4 py-3 text-right text-sm tabular-nums" style={{ color: 'var(--mk-lemon)' }}>
                  {roiTotals.totalMeta > 0 ? roiTotals.totalMeta.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }) : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  {roiTotals.totalRoas > 0 ? (
                    <span className={clsx(
                      "text-sm font-bold px-2.5 py-0.5 rounded-full",
                      roiTotals.totalRoas >= 3 ? "bg-[#8DA035]/15 text-[#8DA035]"
                        : roiTotals.totalRoas >= 1 ? "bg-[#E2A90A]/15 text-[#E2A90A]"
                        : "bg-[#C2185B]/15 text-[#C2185B]"
                    )}>
                      {roiTotals.totalRoas.toFixed(1)}x
                    </span>
                  ) : (
                    <span className="text-xs text-cockpit-secondary">—</span>
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Contacts sans devis — À traiter */}
      {contactsSansDevis.length > 0 && (
        <div className="bg-cockpit-dark border border-cockpit rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-bold text-cockpit-heading flex items-center gap-2">
              <AlertCircle className="w-5 h-5" style={{ color: 'var(--mk-lemon)' }} />
              Contacts sans devis
              <span className="text-xs font-normal text-cockpit-secondary ml-2">
                ({contactsSansDevis.length} à traiter)
              </span>
            </h2>
            {contactsSansDevis.length > 5 && (
              <button
                onClick={() => setShowAllContacts(!showAllContacts)}
                className="flex items-center gap-1 text-xs hover:opacity-80 transition"
                style={{ color: 'var(--mk-raspberry)' }}
              >
                {showAllContacts ? "Voir moins" : "Voir tout"}
                {showAllContacts ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
          </div>
          <div className="space-y-2">
            {(showAllContacts ? contactsSansDevis : contactsSansDevis.slice(0, 5)).map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between p-3 bg-cockpit rounded-lg border border-cockpit/50 hover:border-[#E2A90A]/30 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#E2A90A]/15 flex items-center justify-center">
                    <Users className="w-4 h-4" style={{ color: 'var(--mk-lemon)' }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-cockpit-heading">{c.name}</p>
                    {c.email && (
                      <p className="text-xs text-cockpit-secondary flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {c.email}
                      </p>
                    )}
                  </div>
                </div>
                <span className="text-xs text-cockpit-secondary">
                  {new Date(c.created).toLocaleDateString("fr-FR")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
