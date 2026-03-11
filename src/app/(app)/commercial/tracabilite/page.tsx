"use client";

import { useState, useEffect, useCallback } from "react";
import {
  GitCompareArrows,
  ShoppingCart,
  FileText,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Link2,
  Unlink,
  ExternalLink,
  Lightbulb,
  Check,
} from "lucide-react";
import { KPICard } from "@/components/dashboard/kpi-card";
import { FreshnessIndicator } from "@/components/ui/freshness-indicator";
import clsx from "clsx";

interface Amounts {
  total_excl_tax?: string;
  total?: string;
}

interface DocSummary {
  id: number;
  number?: string;
  subject?: string;
  status?: string;
  date?: string;
  company_name?: string;
  contact_id?: number;
  amounts?: Amounts;
  pdf_link?: string;
  ageJours?: number;
}

interface DevisConverti {
  liaisonId: string;
  estimate: DocSummary;
  order: DocSummary;
  montantDevis: number;
  montantCommande: number;
  ecart: number;
}

interface Suggestion {
  estimate: DocSummary;
  order: DocSummary;
  score: number;
}

interface Stats {
  totalDevis: number;
  totalCommandes: number;
  devisConvertis: number;
  commandesDirectes: number;
  tauxConversion: number;
  devisEnAttente: number;
  devisExpires: number;
}

type TabKey = "convertis" | "directes" | "non-convertis";

function formatCurrency(val: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);
}

function getAmountHT(amounts?: Amounts): number {
  if (!amounts) return 0;
  return parseFloat(amounts.total_excl_tax || amounts.total || "0") || 0;
}

function AgeBadge({ jours }: { jours: number }) {
  const color =
    jours > 60
      ? "bg-cockpit-danger/10 text-cockpit-danger"
      : jours > 30
      ? "bg-cockpit-warning/10 text-cockpit-warning"
      : "bg-cockpit-success/10 text-cockpit-success";
  return (
    <span className={clsx("px-2 py-0.5 rounded-full text-xs font-medium", color)}>
      {jours}j
    </span>
  );
}

export default function TracabilitePage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("convertis");

  const [devisConvertis, setDevisConvertis] = useState<DevisConverti[]>([]);
  const [commandesSansDevis, setCommandesSansDevis] = useState<DocSummary[]>([]);
  const [devisNonConvertis, setDevisNonConvertis] = useState<DocSummary[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [cacheDate, setCacheDate] = useState<string | null>(null);

  // Dropdown state for linking
  const [linkingOrderId, setLinkingOrderId] = useState<number | null>(null);
  const [linkingEstimateId, setLinkingEstimateId] = useState<number | null>(null);

  const fetchData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const res = await fetch("/api/sellsy/tracabilite");
      const data = await res.json();
      setDevisConvertis(data.devisConvertis || []);
      setCommandesSansDevis(data.commandesSansDevis || []);
      setDevisNonConvertis(data.devisNonConvertis || []);
      setSuggestions(data.suggestions || []);
      setStats(data.stats || null);
      setCacheDate(data._cache?.generatedAt || null);
    } catch (err) {
      console.error("Erreur chargement traçabilité:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLink = async (estimateId: number, orderId: number) => {
    try {
      await fetch("/api/sellsy/liaison", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estimateId, orderId }),
      });
      setLinkingOrderId(null);
      setLinkingEstimateId(null);
      fetchData(true);
    } catch (err) {
      console.error("Erreur liaison:", err);
    }
  };

  const handleUnlink = async (estimateId: number, orderId: number) => {
    try {
      await fetch("/api/sellsy/liaison", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estimateId, orderId }),
      });
      fetchData(true);
    } catch (err) {
      console.error("Erreur suppression liaison:", err);
    }
  };

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: "convertis", label: "Devis \u2192 Commandes", count: devisConvertis.length },
    { key: "directes", label: "Commandes directes", count: commandesSansDevis.length },
    { key: "non-convertis", label: "Devis non convertis", count: devisNonConvertis.length },
  ];

  // Get candidate estimates for an order (same contact_id)
  const getCandidateEstimates = (orderId: number) => {
    const order = commandesSansDevis.find((o) => o.id === orderId);
    if (!order?.contact_id) return devisNonConvertis;
    return devisNonConvertis.filter((e) => e.contact_id === order.contact_id);
  };

  // Get candidate orders for an estimate (same contact_id)
  const getCandidateOrders = (estimateId: number) => {
    const estimate = devisNonConvertis.find((e) => e.id === estimateId);
    if (!estimate?.contact_id) return commandesSansDevis;
    return commandesSansDevis.filter((o) => o.contact_id === estimate.contact_id);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-200 animate-pulse" />
            <div>
              <div className="h-6 w-64 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-80 bg-gray-200 rounded mt-1 animate-pulse" />
            </div>
          </div>
          <div className="h-10 w-28 bg-gray-200 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-white rounded-xl border border-gray-200 animate-pulse p-4">
              <div className="h-3 w-24 bg-gray-200 rounded mb-3" />
              <div className="h-6 w-16 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex border-b border-gray-200">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex-1 px-4 py-3">
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mx-auto" />
              </div>
            ))}
          </div>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="px-4 py-3 border-b border-gray-100 flex gap-4 animate-pulse">
              <div className="h-4 w-24 bg-gray-200 rounded" />
              <div className="h-4 w-32 bg-gray-200 rounded" />
              <div className="h-4 w-20 bg-gray-200 rounded ml-auto" />
              <div className="h-4 w-24 bg-gray-200 rounded" />
              <div className="h-4 w-20 bg-gray-200 rounded" />
              <div className="h-4 w-12 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cockpit-info/15 flex items-center justify-center">
            <GitCompareArrows className="w-5 h-5 text-cockpit-info" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-cockpit-heading">
              Traçabilité Devis → Commandes
            </h1>
            <p className="text-sm text-cockpit-secondary">
              Liez vos devis Sellsy à leurs commandes pour suivre la conversion
            </p>
          </div>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-cockpit text-cockpit-primary text-sm font-medium hover:bg-cockpit-dark/80 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={clsx("w-4 h-4", refreshing && "animate-spin")} />
          Actualiser
        </button>
      </div>

      {/* Freshness indicator */}
      <FreshnessIndicator
        label="Données Sellsy"
        cacheDate={cacheDate}
        onRefresh={() => fetchData(true)}
        refreshing={refreshing}
      />

      {/* KPIs */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <KPICard
            title="Taux de conversion"
            value={`${stats.tauxConversion}%`}
            icon={<GitCompareArrows className="w-7 h-7" />}
            bgColor="bg-cockpit-yellow"
          />
          <KPICard
            title="Devis convertis"
            value={`${stats.devisConvertis} / ${stats.totalDevis}`}
            icon={<Check className="w-7 h-7" />}
            bgColor="bg-cockpit-success"
          />
          <KPICard
            title="Commandes directes"
            value={stats.commandesDirectes}
            icon={<ShoppingCart className="w-7 h-7" />}
            bgColor="bg-cockpit-info"
          />
          <KPICard
            title="Devis en attente"
            value={stats.devisEnAttente}
            icon={<AlertTriangle className="w-7 h-7" />}
            bgColor={stats.devisExpires > 0 ? "bg-cockpit-danger" : "bg-cockpit-warning"}
          />
        </div>
      )}

      {/* Suggestions banner */}
      {suggestions.length > 0 && (
        <div className="bg-cockpit-yellow/10 border border-cockpit-yellow/30 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Lightbulb className="w-5 h-5 text-cockpit-yellow" />
            <span className="text-sm font-medium text-cockpit-heading">
              {suggestions.length} liaison{suggestions.length > 1 ? "s" : ""} suggérée{suggestions.length > 1 ? "s" : ""} (même client, montant similaire)
            </span>
          </div>
          <button
            onClick={async () => {
              for (const s of suggestions) {
                await handleLink(s.estimate.id, s.order.id);
              }
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cockpit-yellow text-white text-xs font-medium hover:bg-cockpit-yellow/90 transition-colors"
          >
            <Link2 className="w-3.5 h-3.5" />
            Appliquer toutes
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg overflow-hidden">
        <div className="flex border-b border-cockpit">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={clsx(
                "flex-1 px-4 py-3 text-sm font-medium transition-colors relative",
                activeTab === tab.key
                  ? "text-cockpit-info border-b-2 border-cockpit-info bg-cockpit-info/5"
                  : "text-cockpit-secondary hover:text-cockpit-primary"
              )}
            >
              {tab.label}
              <span className={clsx(
                "ml-2 px-1.5 py-0.5 rounded-full text-xs",
                activeTab === tab.key
                  ? "bg-cockpit-info/15 text-cockpit-info"
                  : "bg-cockpit-dark text-cockpit-secondary"
              )}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="overflow-x-auto">
          {/* Devis convertis */}
          {activeTab === "convertis" && (
            <table className="w-full">
              <thead className="bg-cockpit-dark border-b border-cockpit">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-cockpit-heading">N° DEVIS</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-cockpit-heading">CLIENT</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-cockpit-heading">MONTANT DEVIS</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-cockpit-heading">N° COMMANDE</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-cockpit-heading">MONTANT COMMANDE</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-cockpit-heading">ÉCART</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-cockpit-heading">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cockpit">
                {devisConvertis.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-cockpit-secondary text-sm">
                      Aucune liaison créée. Liez vos devis à leurs commandes depuis les onglets ci-dessous.
                    </td>
                  </tr>
                ) : (
                  devisConvertis.map((item) => (
                    <tr key={item.liaisonId} className="hover:bg-cockpit-dark/50 transition-colors">
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-cockpit-secondary" />
                          <span className="font-medium text-cockpit-primary">{item.estimate.number || `#${item.estimate.id}`}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-cockpit-primary">{item.estimate.company_name || "—"}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-cockpit-primary">{formatCurrency(item.montantDevis)}</td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <ShoppingCart className="w-3.5 h-3.5 text-cockpit-secondary" />
                          <span className="font-medium text-cockpit-primary">{item.order.number || `#${item.order.id}`}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-cockpit-primary">{formatCurrency(item.montantCommande)}</td>
                      <td className="px-4 py-3 text-sm text-right">
                        <span className={clsx(
                          "font-medium",
                          item.ecart === 0 ? "text-cockpit-secondary" : item.ecart > 0 ? "text-cockpit-success" : "text-cockpit-danger"
                        )}>
                          {item.ecart > 0 ? "+" : ""}{item.ecart}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleUnlink(item.estimate.id, item.order.id)}
                          className="p-1.5 rounded-md hover:bg-cockpit-danger/10 text-cockpit-secondary hover:text-cockpit-danger transition-colors"
                          title="Supprimer la liaison"
                        >
                          <Unlink className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* Commandes directes */}
          {activeTab === "directes" && (
            <table className="w-full">
              <thead className="bg-cockpit-dark border-b border-cockpit">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-cockpit-heading">N° COMMANDE</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-cockpit-heading">CLIENT</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-cockpit-heading">MONTANT HT</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-cockpit-heading">DATE</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-cockpit-heading">STATUT</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-cockpit-heading">LIER</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cockpit">
                {commandesSansDevis.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-cockpit-secondary text-sm">
                      Toutes les commandes sont liées à un devis.
                    </td>
                  </tr>
                ) : (
                  commandesSansDevis.map((order) => (
                    <tr key={order.id} className="hover:bg-cockpit-dark/50 transition-colors">
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <ShoppingCart className="w-3.5 h-3.5 text-cockpit-secondary" />
                          <span className="font-medium text-cockpit-primary">{order.number || `#${order.id}`}</span>
                          {order.pdf_link && (
                            <a href={order.pdf_link} target="_blank" rel="noopener noreferrer" className="text-cockpit-info hover:text-cockpit-info/80">
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-cockpit-primary">{order.company_name || "—"}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-cockpit-primary">{formatCurrency(getAmountHT(order.amounts))}</td>
                      <td className="px-4 py-3 text-sm text-cockpit-secondary">
                        {order.date ? new Date(order.date).toLocaleDateString("fr-FR") : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-cockpit-info/10 text-cockpit-info">
                          {order.status || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center relative">
                        <button
                          onClick={() => setLinkingOrderId(linkingOrderId === order.id ? null : order.id)}
                          className="p-1.5 rounded-md hover:bg-cockpit-yellow/10 text-cockpit-secondary hover:text-cockpit-yellow transition-colors"
                          title="Lier à un devis"
                        >
                          <Link2 className="w-4 h-4" />
                        </button>
                        {linkingOrderId === order.id && (
                          <div className="absolute right-0 top-full z-10 mt-1 w-72 bg-cockpit-card border border-cockpit rounded-lg shadow-cockpit-lg max-h-60 overflow-y-auto">
                            <div className="p-2 border-b border-cockpit">
                              <p className="text-xs font-semibold text-cockpit-heading">Lier à un devis</p>
                            </div>
                            {getCandidateEstimates(order.id).length === 0 ? (
                              <p className="p-3 text-xs text-cockpit-secondary">Aucun devis trouvé pour ce client</p>
                            ) : (
                              getCandidateEstimates(order.id).map((est) => (
                                <button
                                  key={est.id}
                                  onClick={() => handleLink(est.id, order.id)}
                                  className="w-full px-3 py-2 text-left hover:bg-cockpit-dark/80 transition-colors flex items-center justify-between"
                                >
                                  <div>
                                    <p className="text-xs font-medium text-cockpit-primary">{est.number || `#${est.id}`}</p>
                                    <p className="text-[10px] text-cockpit-secondary">{est.company_name}</p>
                                  </div>
                                  <span className="text-xs font-medium text-cockpit-primary">{formatCurrency(getAmountHT(est.amounts))}</span>
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* Devis non convertis */}
          {activeTab === "non-convertis" && (
            <table className="w-full">
              <thead className="bg-cockpit-dark border-b border-cockpit">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-cockpit-heading">N° DEVIS</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-cockpit-heading">CLIENT</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-cockpit-heading">MONTANT HT</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-cockpit-heading">DATE</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-cockpit-heading">ANCIENNETÉ</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-cockpit-heading">LIER</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cockpit">
                {devisNonConvertis.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-cockpit-secondary text-sm">
                      Tous les devis sont liés à une commande.
                    </td>
                  </tr>
                ) : (
                  devisNonConvertis.map((est) => (
                    <tr key={est.id} className="hover:bg-cockpit-dark/50 transition-colors">
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-cockpit-secondary" />
                          <span className="font-medium text-cockpit-primary">{est.number || `#${est.id}`}</span>
                          {est.pdf_link && (
                            <a href={est.pdf_link} target="_blank" rel="noopener noreferrer" className="text-cockpit-info hover:text-cockpit-info/80">
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-cockpit-primary">{est.company_name || "—"}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-cockpit-primary">{formatCurrency(getAmountHT(est.amounts))}</td>
                      <td className="px-4 py-3 text-sm text-cockpit-secondary">
                        {est.date ? new Date(est.date).toLocaleDateString("fr-FR") : "—"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {est.ageJours !== undefined && <AgeBadge jours={est.ageJours} />}
                      </td>
                      <td className="px-4 py-3 text-center relative">
                        <button
                          onClick={() => setLinkingEstimateId(linkingEstimateId === est.id ? null : est.id)}
                          className="p-1.5 rounded-md hover:bg-cockpit-yellow/10 text-cockpit-secondary hover:text-cockpit-yellow transition-colors"
                          title="Lier à une commande"
                        >
                          <Link2 className="w-4 h-4" />
                        </button>
                        {linkingEstimateId === est.id && (
                          <div className="absolute right-0 top-full z-10 mt-1 w-72 bg-cockpit-card border border-cockpit rounded-lg shadow-cockpit-lg max-h-60 overflow-y-auto">
                            <div className="p-2 border-b border-cockpit">
                              <p className="text-xs font-semibold text-cockpit-heading">Lier à une commande</p>
                            </div>
                            {getCandidateOrders(est.id).length === 0 ? (
                              <p className="p-3 text-xs text-cockpit-secondary">Aucune commande trouvée pour ce client</p>
                            ) : (
                              getCandidateOrders(est.id).map((ord) => (
                                <button
                                  key={ord.id}
                                  onClick={() => handleLink(est.id, ord.id)}
                                  className="w-full px-3 py-2 text-left hover:bg-cockpit-dark/80 transition-colors flex items-center justify-between"
                                >
                                  <div>
                                    <p className="text-xs font-medium text-cockpit-primary">{ord.number || `#${ord.id}`}</p>
                                    <p className="text-[10px] text-cockpit-secondary">{ord.company_name}</p>
                                  </div>
                                  <span className="text-xs font-medium text-cockpit-primary">{formatCurrency(getAmountHT(ord.amounts))}</span>
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
