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
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Target,
  Mail,
  Euro,
  Megaphone,
  Inbox,
  Wallet,
  ExternalLink,
} from "lucide-react";
import clsx from "clsx";
import { RechartsLineChart } from "@/components/dashboard/line-chart";
import { OperationsSemaineWidget } from "@/components/dashboard/operations-semaine";
import { TunnelMarketing } from "@/components/dashboard/tunnel-marketing";
import { getSellsyUrl } from "@/lib/sellsy-urls";

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

interface DemandesStats {
  total: number;
  nouveau: number;
  enCours: number;
  devis: number;
  vente: number;
  perdu: number;
}

interface DemandeItem {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  meuble: string;
  statut: string;
  estimationTTC: number | null;
  dateCreation: string;
  contactId: string;
  showroom: string | null;
}

interface SellsyDocInfo {
  estimates: { id: number; number: string; status: string; amounts?: { total_incl_tax?: number } }[];
  orders: { id: number; number: string; status: string; amounts?: { total_incl_tax?: number } }[];
  linked: boolean;
}

// ===== CONSTANTS =====

const BUDGET_MENSUEL = 1000; // Budget marketing mensuel en euros

// ===== COMPONENT =====

export default function DashboardPage() {
  const { data: session } = useSession();
  const [funnel, setFunnel] = useState<FunnelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showAllContacts, setShowAllContacts] = useState(false);
  const [metaMonthly, setMetaMonthly] = useState<Record<string, { spend: number; impressions: number; clicks: number; conversions: number }>>({});
  const [demandesStats, setDemandesStats] = useState<DemandesStats>({ total: 0, nouveau: 0, enCours: 0, devis: 0, vente: 0, perdu: 0 });
  const [demandesList, setDemandesList] = useState<DemandeItem[]>([]);
  const [sellsyDocs, setSellsyDocs] = useState<Record<string, SellsyDocInfo>>({});

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

  const fetchDemandes = useCallback(async () => {
    try {
      // Lecture directe depuis la base — instantané (sync tourne en background via cron)
      const listRes = await fetch("/api/demandes?limit=50");
      if (!listRes.ok) return;
      const data = await listRes.json();
      if (data.stats) setDemandesStats(data.stats);
      const demandes: DemandeItem[] = data.data || [];
      setDemandesList(demandes);
      // Les données devis/ventes sont déjà incluses via contact (API /api/demandes)
    } catch {
      // silencieux
    }
  }, []);

  useEffect(() => {
    if (session?.user) {
      fetchFunnel(true);
      fetchMetaMonthly();
      fetchDemandes();
    }
  }, [session, fetchFunnel, fetchMetaMonthly, fetchDemandes]);

  // ===== HOOKS (avant les early returns) =====

  const monthly = funnel?.monthlyFunnel || [];

  // Tableau ROI : combine funnel (devis/commandes montants) + Meta (budget)
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

  // Budget marketing — mois en cours
  const currentMonthKey = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }, []);

  const currentMonthLabel = useMemo(() => {
    return new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  }, []);

  const currentMonthMeta = metaMonthly[currentMonthKey]?.spend || 0;
  const budgetDepense = currentMonthMeta; // Meta + Google (Google à ajouter)
  const budgetRestant = Math.max(BUDGET_MENSUEL - budgetDepense, 0);
  const budgetPercent = Math.min((budgetDepense / BUDGET_MENSUEL) * 100, 100);

  // KPIs demandes — conversion propre
  const demandesAvecDevis = demandesStats.devis + demandesStats.vente;
  const demandesVentes = demandesStats.vente;
  const convDevis = demandesStats.total > 0 ? Math.round((demandesAvecDevis / demandesStats.total) * 100) : 0;
  const convVente = demandesAvecDevis > 0 ? Math.round((demandesVentes / demandesAvecDevis) * 100) : 0;
  const convGlobale = demandesStats.total > 0 ? Math.round((demandesVentes / demandesStats.total) * 100) : 0;

  // ===== EARLY RETURNS =====

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
          <div className="h-3 w-full bg-cockpit-card rounded-full mb-4" />
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 bg-cockpit-card rounded" />
            ))}
          </div>
        </div>
        <div className="bg-white border border-cockpit rounded-xl p-5 shadow-cockpit-lg animate-pulse">
          <div className="h-5 w-40 bg-cockpit-card rounded mb-4" />
          <div className="h-[200px] bg-cockpit-card rounded-lg" />
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
            style={{ backgroundColor: 'var(--mk-raspberry, var(--color-active))' }}
          >
            R&eacute;essayer
          </button>
        </div>
      </div>
    );
  }

  const contactsSansDevis = funnel!.contactsSansDevis;

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* ===== Header ===== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-cockpit-heading mb-1">
            Marketing — Suivi de conversion
          </h1>
          <p className="text-cockpit-secondary text-sm">
            Demandes du site &rarr; Devis &rarr; Commande
          </p>
        </div>
        <button
          onClick={() => { fetchFunnel(true); fetchMetaMonthly(); fetchDemandes(); }}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-white text-sm hover:opacity-90 transition disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, var(--color-active), #FEEB9C)' }}
        >
          {refreshing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Actualiser
        </button>
      </div>

      {/* ===== Tunnel marketing (attribution stricte 7j/30j) ===== */}
      <TunnelMarketing />

      {/* ===== KPI Cards — Funnel Demandes ===== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Demandes reçues */}
        <div className="rounded-xl overflow-hidden transition-transform duration-200 hover:-translate-y-0.5 bg-white border border-cockpit">
          <div className="h-1.5" style={{ background: 'linear-gradient(90deg, var(--color-active), #FEEB9C)' }} />
          <div className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <Inbox className="w-5 h-5" style={{ color: 'var(--color-active)' }} />
            </div>
            <p className="text-cockpit-secondary text-xs mb-1">Demandes reçues</p>
            <p className="text-2xl font-bold" style={{ color: 'var(--color-active)' }}>{demandesStats.total}</p>
            <p className="text-cockpit-secondary text-[10px] mt-1">
              {demandesStats.nouveau} nouvelle{demandesStats.nouveau > 1 ? "s" : ""} &middot; {demandesStats.enCours} en cours
            </p>
          </div>
        </div>

        {/* Devis envoyés */}
        <div className="rounded-xl overflow-hidden transition-transform duration-200 hover:-translate-y-0.5 bg-white border border-cockpit">
          <div className="h-1.5" style={{ background: 'linear-gradient(90deg, var(--color-active), #FEEB9C)' }} />
          <div className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <FileText className="w-5 h-5" style={{ color: 'var(--color-active)' }} />
              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: 'var(--color-active-light)', color: 'var(--color-active)' }}>
                {convDevis}%
              </span>
            </div>
            <p className="text-cockpit-secondary text-xs mb-1">Ont un devis</p>
            <p className="text-2xl font-bold" style={{ color: 'var(--color-active)' }}>{demandesAvecDevis}</p>
            <p className="text-cockpit-secondary text-[10px] mt-1">Demande &rarr; Devis</p>
          </div>
        </div>

        {/* Ventes signées */}
        <div className="rounded-xl overflow-hidden transition-transform duration-200 hover:-translate-y-0.5 bg-white border border-cockpit">
          <div className="h-1.5" style={{ background: 'linear-gradient(90deg, var(--color-active), #FEEB9C)' }} />
          <div className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <ShoppingCart className="w-5 h-5" style={{ color: 'var(--color-active)' }} />
              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: 'var(--color-active-light)', color: 'var(--color-active)' }}>
                {convVente}%
              </span>
            </div>
            <p className="text-cockpit-secondary text-xs mb-1">Ont commandé</p>
            <p className="text-2xl font-bold" style={{ color: 'var(--color-active)' }}>{demandesVentes}</p>
            <p className="text-cockpit-secondary text-[10px] mt-1">Devis &rarr; Commande</p>
          </div>
        </div>

        {/* Conversion globale */}
        <div className="rounded-xl overflow-hidden transition-transform duration-200 hover:-translate-y-0.5 bg-white border border-cockpit">
          <div className="h-1.5" style={{ background: 'linear-gradient(90deg, var(--color-active), #FEEB9C)' }} />
          <div className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-5 h-5" style={{ color: 'var(--color-active)' }} />
            </div>
            <p className="text-cockpit-secondary text-xs mb-1">Conversion globale</p>
            <p className="text-2xl font-bold" style={{ color: 'var(--color-active)' }}>{convGlobale}%</p>
            <p className="text-cockpit-secondary text-[10px] mt-1">Demande &rarr; Commande</p>
          </div>
        </div>
      </div>

      {/* ===== Suivi Budget Marketing ===== */}
      <div className="bg-white border border-cockpit rounded-xl p-4 sm:p-5 shadow-cockpit-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-cockpit-heading flex items-center gap-2">
            <Wallet className="w-5 h-5" style={{ color: 'var(--mk-raspberry)' }} />
            Budget Marketing
            <span className="text-xs font-normal text-cockpit-secondary ml-1 capitalize">
              {currentMonthLabel}
            </span>
          </h2>
          <div className="text-right">
            <p className={clsx(
              "text-2xl font-bold",
              budgetRestant < 200 ? "text-[#EF4444]" : budgetRestant < 500 ? "text-[#F59E0B]" : "text-[var(--color-active)]"
            )}>
              {budgetRestant.toLocaleString("fr-FR")} &euro;
            </p>
            <p className="text-xs text-cockpit-secondary">restant</p>
          </div>
        </div>

        {/* Barre de progression */}
        <div className="w-full h-3 bg-cockpit rounded-full overflow-hidden mb-4">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${budgetPercent}%`,
              background: 'linear-gradient(90deg, var(--color-active), #FEEB9C)',
            }}
          />
        </div>

        {/* Détail dépenses */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-cockpit/50 rounded-lg">
            <p className="text-xs text-cockpit-secondary mb-1">Budget mensuel</p>
            <p className="text-sm font-bold text-cockpit-heading">
              {BUDGET_MENSUEL.toLocaleString("fr-FR")} &euro;
            </p>
          </div>
          <div className="text-center p-3 bg-cockpit/50 rounded-lg">
            <p className="text-xs text-cockpit-secondary mb-1 flex items-center justify-center gap-1">
              <Megaphone className="w-3 h-3" /> Meta Ads
            </p>
            <p className="text-sm font-bold" style={{ color: 'var(--mk-lemon)' }}>
              {currentMonthMeta.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} &euro;
            </p>
          </div>
          <div className="text-center p-3 bg-cockpit/50 rounded-lg">
            <p className="text-xs text-cockpit-secondary mb-1">Restant</p>
            <p className={clsx(
              "text-sm font-bold",
              budgetRestant < 200 ? "text-[#EF4444]" : "text-[var(--color-active)]"
            )}>
              {budgetRestant.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} &euro;
            </p>
          </div>
        </div>
      </div>

      {/* ===== Derniers devis & commandes des demandes ===== */}
      {(() => {
        const devisVente = demandesList.filter(
          (d) => d.statut === "DEVIS" || d.statut === "VENTE"
        );
        if (devisVente.length === 0) return null;
        return (
          <div className="bg-white border border-cockpit rounded-xl p-4 sm:p-5 shadow-cockpit-lg">
            <h2 className="text-base font-bold text-cockpit-heading mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" style={{ color: 'var(--mk-lemon)' }} />
              Derniers devis & commandes
              <span className="text-xs font-normal text-cockpit-secondary ml-1">
                (issus des demandes de prix)
              </span>
            </h2>
            <div className="space-y-2">
              {devisVente.map((d) => {
                const docs = sellsyDocs[d.contactId];
                const estimate = docs?.estimates?.[0];
                const order = docs?.orders?.[0];
                const sellsyAmount = order?.amounts?.total_incl_tax || estimate?.amounts?.total_incl_tax;
                return (
                  <div key={d.id} className="flex items-center justify-between p-3 bg-cockpit-dark rounded-lg border border-cockpit/50 hover:border-[var(--color-active)]/30 transition">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={clsx(
                        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                        d.statut === "VENTE" ? "bg-[#71DD37]/15" : "bg-[#03C3EC]/15"
                      )}>
                        {d.statut === "VENTE"
                          ? <ShoppingCart className="w-4 h-4 text-[#71DD37]" />
                          : <FileText className="w-4 h-4 text-[#03C3EC]" />
                        }
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-cockpit-heading truncate">
                          {d.prenom} {d.nom}
                          <span className="text-cockpit-secondary font-normal ml-2 text-xs">{d.meuble}</span>
                        </p>
                        <div className="flex items-center gap-2 text-xs text-cockpit-secondary">
                          <span>{new Date(d.dateCreation).toLocaleDateString("fr-FR")}</span>
                          {d.showroom && <span>· {d.showroom}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                      {estimate && (
                        <a
                          href={getSellsyUrl("estimate", estimate.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[10px] font-semibold text-[#03C3EC] bg-[#03C3EC]/10 px-2 py-1 rounded hover:bg-[#03C3EC]/20 transition-colors"
                        >
                          <FileText className="w-3 h-3" />
                          {estimate.number}
                          <ExternalLink className="w-2.5 h-2.5 opacity-50" />
                        </a>
                      )}
                      {order && (
                        <a
                          href={getSellsyUrl("order", order.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[10px] font-semibold text-[#71DD37] bg-[#71DD37]/10 px-2 py-1 rounded hover:bg-[#71DD37]/20 transition-colors"
                        >
                          <ShoppingCart className="w-3 h-3" />
                          {order.number}
                          <ExternalLink className="w-2.5 h-2.5 opacity-50" />
                        </a>
                      )}
                      {sellsyAmount && (
                        <span className="text-xs font-bold text-cockpit-heading min-w-[60px] text-right">
                          {Number(sellsyAmount).toLocaleString("fr-FR", { maximumFractionDigits: 0 })}&nbsp;€
                        </span>
                      )}
                      <span className={clsx(
                        "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                        d.statut === "VENTE" ? "bg-[#71DD37]/15 text-[#71DD37]" : "bg-[#03C3EC]/15 text-[#03C3EC]"
                      )}>
                        {d.statut === "VENTE" ? "Vente" : "Devis"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* ===== Tableau ROI — Performance financière ===== */}
      <div className="bg-white border border-cockpit rounded-xl overflow-hidden shadow-cockpit-lg">
        <div className="p-4 sm:p-5 pb-3">
          <h2 className="text-base font-bold text-cockpit-heading flex items-center gap-2">
            <Euro className="w-5 h-5" style={{ color: 'var(--mk-raspberry)' }} />
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
                    {r.devisAmount > 0 ? r.devisAmount.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }) : "\u2014"}
                  </td>
                  <td className="px-4 py-2.5 text-right text-sm tabular-nums" style={{ color: 'var(--mk-grapefruit)' }}>
                    {r.commandesAmount > 0 ? r.commandesAmount.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }) : "\u2014"}
                  </td>
                  <td className="px-4 py-2.5 text-right text-sm tabular-nums" style={{ color: 'var(--mk-lemon)' }}>
                    {r.metaSpend > 0 ? r.metaSpend.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }) : "\u2014"}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {r.roas > 0 ? (
                      <span className={clsx(
                        "text-xs font-bold px-2 py-0.5 rounded-full",
                        r.roas >= 3 ? "bg-[#71DD37]/15 text-[#71DD37]"
                          : r.roas >= 1 ? "bg-[#F59E0B]/15 text-[#F59E0B]"
                          : "bg-[#EF4444]/15 text-[#EF4444]"
                      )}>
                        {r.roas.toFixed(1)}x
                      </span>
                    ) : (
                      <span className="text-xs text-cockpit-secondary">&mdash;</span>
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
                  {roiTotals.totalDevis > 0 ? roiTotals.totalDevis.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }) : "\u2014"}
                </td>
                <td className="px-4 py-3 text-right text-sm tabular-nums" style={{ color: 'var(--mk-grapefruit)' }}>
                  {roiTotals.totalCommandes > 0 ? roiTotals.totalCommandes.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }) : "\u2014"}
                </td>
                <td className="px-4 py-3 text-right text-sm tabular-nums" style={{ color: 'var(--mk-lemon)' }}>
                  {roiTotals.totalMeta > 0 ? roiTotals.totalMeta.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }) : "\u2014"}
                </td>
                <td className="px-4 py-3 text-right">
                  {roiTotals.totalRoas > 0 ? (
                    <span className={clsx(
                      "text-sm font-bold px-2.5 py-0.5 rounded-full",
                      roiTotals.totalRoas >= 3 ? "bg-[#71DD37]/15 text-[#71DD37]"
                        : roiTotals.totalRoas >= 1 ? "bg-[#F59E0B]/15 text-[#F59E0B]"
                        : "bg-[#EF4444]/15 text-[#EF4444]"
                    )}>
                      {roiTotals.totalRoas.toFixed(1)}x
                    </span>
                  ) : (
                    <span className="text-xs text-cockpit-secondary">&mdash;</span>
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ===== Évolution mensuelle — courbes ===== */}
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
            { dataKey: "Contacts", name: "Contacts", color: "#03C3EC" },
            { dataKey: "Devis", name: "Devis", color: "#F59E0B" },
            { dataKey: "Commandes", name: "Commandes", color: "#71DD37" },
          ]}
          height={300}
        />
      </div>

      {/* ===== Opérations de la semaine ===== */}
      <OperationsSemaineWidget />

      {/* ===== Contacts sans devis — À traiter ===== */}
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
                className="flex items-center justify-between p-3 bg-cockpit rounded-lg border border-cockpit/50 hover:border-[var(--color-active)]/30 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[var(--color-active)]/15 flex items-center justify-center">
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
