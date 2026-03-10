"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
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
} from "lucide-react";
import clsx from "clsx";
import { EvolutionCharts } from "@/components/dashboard/evolution-charts";
import { PerformanceTable } from "@/components/dashboard/performance-table";

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

  useEffect(() => {
    if (session?.user) fetchFunnel(true);
  }, [session, fetchFunnel]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-cockpit-yellow" />
          <p className="text-cockpit-secondary">Chargement du funnel...</p>
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
            className="px-4 py-2 bg-cockpit-yellow text-black font-medium rounded-lg hover:bg-cockpit-yellow/90 transition"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  const kpis = funnel!.kpis;
  const monthly = funnel!.monthlyFunnel;
  const contactsSansDevis = funnel!.contactsSansDevis;

  // Calcul du max pour les barres du graphique
  const maxBarValue = Math.max(
    ...monthly.map((m) => Math.max(m.contacts, m.devis, m.commandes)),
    1
  );

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
        {/* Total contacts */}
        <div className="bg-cockpit-dark border border-cockpit rounded-xl p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5 text-cockpit-yellow" />
          </div>
          <p className="text-cockpit-secondary text-xs mb-1">Contacts Sellsy</p>
          <p className="text-2xl font-bold text-cockpit-heading">{kpis.totalContacts}</p>
        </div>

        {/* Contacts → Devis */}
        <div className="bg-cockpit-dark border border-cockpit rounded-xl p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <FileText className="w-5 h-5 text-cockpit-info" />
            <span className="text-xs font-bold text-cockpit-info bg-cockpit-info/15 px-2 py-0.5 rounded-full">
              {kpis.globalConversionDevis}%
            </span>
          </div>
          <p className="text-cockpit-secondary text-xs mb-1">Ont un devis</p>
          <p className="text-2xl font-bold text-cockpit-heading">{kpis.totalWithEstimate}</p>
        </div>

        {/* Devis → Commande */}
        <div className="bg-cockpit-dark border border-cockpit rounded-xl p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <ShoppingCart className="w-5 h-5 text-cockpit-success" />
            <span className="text-xs font-bold text-cockpit-success bg-cockpit-success/15 px-2 py-0.5 rounded-full">
              {kpis.globalConversionCommande}%
            </span>
          </div>
          <p className="text-cockpit-secondary text-xs mb-1">Ont commandé</p>
          <p className="text-2xl font-bold text-cockpit-heading">{kpis.totalWithOrder}</p>
        </div>

        {/* Conversion globale */}
        <div className="bg-cockpit-dark border border-cockpit rounded-xl p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <Target className="w-5 h-5 text-cockpit-warning" />
          </div>
          <p className="text-cockpit-secondary text-xs mb-1">Conversion globale</p>
          <p className="text-2xl font-bold text-cockpit-heading">{kpis.globalConversionGlobale}%</p>
          <p className="text-cockpit-secondary text-[10px] mt-1">Contact → Commande</p>
        </div>
      </div>

      {/* Graphiques évolution Devis & Commandes */}
      <EvolutionCharts data={monthly} />

      {/* Tableau performance commerciaux */}
      <PerformanceTable />

      {/* Entonnoir visuel */}
      <div className="bg-cockpit-dark border border-cockpit rounded-xl p-4 sm:p-5">
        <h2 className="text-base font-bold text-cockpit-heading mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-cockpit-yellow" />
          Entonnoir de conversion
        </h2>
        <div className="space-y-4">
          {/* Contacts */}
          <div className="flex items-center gap-4">
            <div className="w-28 text-sm text-cockpit-secondary text-right flex-shrink-0">Contacts</div>
            <div className="flex-1 relative">
              <div
                className="h-10 bg-cockpit-yellow/30 border border-cockpit-yellow/40 rounded-lg flex items-center px-4"
                style={{ width: "100%" }}
              >
                <span className="text-cockpit-yellow font-bold text-sm">{kpis.totalContacts}</span>
              </div>
            </div>
          </div>
          {/* Arrow */}
          <div className="flex items-center gap-4">
            <div className="w-28 text-right flex-shrink-0">
              <span className="text-xs text-cockpit-info font-semibold">{kpis.globalConversionDevis}%</span>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <ArrowRight className="w-4 h-4 text-cockpit-secondary rotate-90" />
            </div>
          </div>
          {/* Devis */}
          <div className="flex items-center gap-4">
            <div className="w-28 text-sm text-cockpit-secondary text-right flex-shrink-0">Devis</div>
            <div className="flex-1 relative">
              <div
                className="h-10 bg-cockpit-info/30 border border-cockpit-info/40 rounded-lg flex items-center px-4"
                style={{
                  width: kpis.totalContacts > 0
                    ? `${Math.max((kpis.totalWithEstimate / kpis.totalContacts) * 100, 10)}%`
                    : "10%"
                }}
              >
                <span className="text-cockpit-info font-bold text-sm">{kpis.totalWithEstimate}</span>
              </div>
            </div>
          </div>
          {/* Arrow */}
          <div className="flex items-center gap-4">
            <div className="w-28 text-right flex-shrink-0">
              <span className="text-xs text-cockpit-success font-semibold">{kpis.globalConversionCommande}%</span>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <ArrowRight className="w-4 h-4 text-cockpit-secondary rotate-90" />
            </div>
          </div>
          {/* Commandes */}
          <div className="flex items-center gap-4">
            <div className="w-28 text-sm text-cockpit-secondary text-right flex-shrink-0">Commandes</div>
            <div className="flex-1 relative">
              <div
                className="h-10 bg-cockpit-success/30 border border-cockpit-success/40 rounded-lg flex items-center px-4"
                style={{
                  width: kpis.totalContacts > 0
                    ? `${Math.max((kpis.totalWithOrder / kpis.totalContacts) * 100, 8)}%`
                    : "8%"
                }}
              >
                <span className="text-cockpit-success font-bold text-sm">{kpis.totalWithOrder}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Graphique mensuel — barres par mois */}
      <div className="bg-cockpit-dark border border-cockpit rounded-xl p-4 sm:p-5">
        <h2 className="text-base font-bold text-cockpit-heading mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-cockpit-yellow" />
          Évolution mensuelle
        </h2>

        {/* Légende */}
        <div className="flex gap-4 mb-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-cockpit-yellow/60" />
            <span className="text-cockpit-secondary">Contacts</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-cockpit-info/60" />
            <span className="text-cockpit-secondary">Devis</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-cockpit-success/60" />
            <span className="text-cockpit-secondary">Commandes</span>
          </div>
        </div>

        {/* Barres */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {monthly.map((m) => (
            <div key={m.month} className="bg-cockpit rounded-lg p-4 border border-cockpit/50">
              <p className="text-xs font-semibold text-cockpit-heading mb-3 text-center">
                {m.label.split(" ")[0].substring(0, 4)}.
              </p>
              {/* Mini barres verticales */}
              <div className="flex items-end justify-center gap-2 h-24 mb-3">
                <div className="flex flex-col items-center gap-1 flex-1">
                  <span className="text-[10px] text-cockpit-yellow font-bold">{m.contacts}</span>
                  <div
                    className="w-full bg-cockpit-yellow/40 rounded-t"
                    style={{ height: `${Math.max((m.contacts / maxBarValue) * 80, 4)}px` }}
                  />
                </div>
                <div className="flex flex-col items-center gap-1 flex-1">
                  <span className="text-[10px] text-cockpit-info font-bold">{m.devis}</span>
                  <div
                    className="w-full bg-cockpit-info/40 rounded-t"
                    style={{ height: `${Math.max((m.devis / maxBarValue) * 80, 4)}px` }}
                  />
                </div>
                <div className="flex flex-col items-center gap-1 flex-1">
                  <span className="text-[10px] text-cockpit-success font-bold">{m.commandes}</span>
                  <div
                    className="w-full bg-cockpit-success/40 rounded-t"
                    style={{ height: `${Math.max((m.commandes / maxBarValue) * 80, 4)}px` }}
                  />
                </div>
              </div>
              {/* Taux de conversion global du mois */}
              <div className="text-center">
                <span
                  className={clsx(
                    "text-xs font-bold px-2 py-0.5 rounded-full",
                    m.conversionGlobale > 0
                      ? "bg-cockpit-success/15 text-cockpit-success"
                      : "bg-cockpit-dark text-cockpit-secondary"
                  )}
                >
                  {m.conversionGlobale}% conv.
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tableau mensuel détaillé */}
      <div className="bg-cockpit-dark border border-cockpit rounded-xl overflow-hidden">
        <div className="p-4 sm:p-5 pb-3">
          <h2 className="text-base font-bold text-cockpit-heading flex items-center gap-2">
            <FileText className="w-5 h-5 text-cockpit-yellow" />
            Détail mensuel
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-cockpit border-y border-cockpit">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-cockpit-heading">Mois</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-cockpit-yellow">Contacts</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-cockpit-info">Devis</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-cockpit-success">Commandes</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-cockpit-heading">Contact→Devis</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-cockpit-heading">Devis→Cde</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-cockpit-heading">Global</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cockpit">
              {monthly.map((m) => (
                <tr key={m.month} className="hover:bg-cockpit/30 transition">
                  <td className="px-6 py-3 text-sm font-medium text-cockpit-heading">{m.label}</td>
                  <td className="px-6 py-3 text-center text-sm text-cockpit-yellow font-semibold">{m.contacts}</td>
                  <td className="px-6 py-3 text-center text-sm text-cockpit-info font-semibold">{m.devis}</td>
                  <td className="px-6 py-3 text-center text-sm text-cockpit-success font-semibold">{m.commandes}</td>
                  <td className="px-6 py-3 text-center">
                    <span className={clsx(
                      "text-xs font-bold px-2 py-0.5 rounded-full",
                      m.conversionDevis > 50 ? "bg-cockpit-success/15 text-cockpit-success"
                        : m.conversionDevis > 20 ? "bg-cockpit-yellow/15 text-cockpit-yellow"
                        : "bg-cockpit-error/15 text-cockpit-error"
                    )}>
                      {m.conversionDevis}%
                    </span>
                  </td>
                  <td className="px-6 py-3 text-center">
                    <span className={clsx(
                      "text-xs font-bold px-2 py-0.5 rounded-full",
                      m.conversionCommande > 50 ? "bg-cockpit-success/15 text-cockpit-success"
                        : m.conversionCommande > 20 ? "bg-cockpit-yellow/15 text-cockpit-yellow"
                        : "bg-cockpit-error/15 text-cockpit-error"
                    )}>
                      {m.conversionCommande}%
                    </span>
                  </td>
                  <td className="px-6 py-3 text-center">
                    <span className={clsx(
                      "text-xs font-bold px-2 py-0.5 rounded-full",
                      m.conversionGlobale > 30 ? "bg-cockpit-success/15 text-cockpit-success"
                        : m.conversionGlobale > 10 ? "bg-cockpit-yellow/15 text-cockpit-yellow"
                        : "bg-cockpit-error/15 text-cockpit-error"
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

      {/* Contacts sans devis — À traiter */}
      {contactsSansDevis.length > 0 && (
        <div className="bg-cockpit-dark border border-cockpit rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-bold text-cockpit-heading flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-cockpit-warning" />
              Contacts sans devis
              <span className="text-xs font-normal text-cockpit-secondary ml-2">
                ({contactsSansDevis.length} à traiter)
              </span>
            </h2>
            {contactsSansDevis.length > 5 && (
              <button
                onClick={() => setShowAllContacts(!showAllContacts)}
                className="flex items-center gap-1 text-xs text-cockpit-yellow hover:text-cockpit-yellow/80 transition"
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
                className="flex items-center justify-between p-3 bg-cockpit rounded-lg border border-cockpit/50 hover:border-cockpit-warning/30 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-cockpit-warning/15 flex items-center justify-center">
                    <Users className="w-4 h-4 text-cockpit-warning" />
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
