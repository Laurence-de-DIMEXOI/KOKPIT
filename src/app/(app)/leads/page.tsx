"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { KPICard } from "@/components/dashboard/kpi-card";
import {
  Inbox, TrendingUp, Clock, AlertCircle, RefreshCw, Loader2,
  ChevronDown, ChevronUp, Package, Phone, Mail, MapPin,
  DollarSign, User, Calendar, MessageSquare, Tag,
  CheckCircle, XCircle, FileText, Search, Trash2,
} from "lucide-react";

// ===== TYPES =====

interface Article {
  nom: string;
  categorie?: string;
  finition?: string;
  quantite?: number;
}

interface Demande {
  id: string;
  type: "DEMANDE_PRIX";
  contactId: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string | null;
  source: string;
  statut: string;
  priorite: string;
  meuble?: string;
  message?: string | null;
  showroom?: string | null;
  budget?: string | null;
  modePaiement?: string | null;
  articles?: Article[] | null;
  estimationHT?: number | null;
  estimationTTC?: number | null;
  leadId?: string | null;
  assigneA?: string;
  assigneEmail?: string | null;
  commercialId?: string | null;
  notes?: string | null;
  slaDeadline?: string | null;
  dateCreation: string;
  dateDemande?: string | null;
}

interface SellsyMatch {
  articleDemande: {
    nom: string;
    categorie?: string;
    finition?: string;
    quantite: number;
  };
  bestMatch: {
    id: number;
    name: string;
    reference: string;
    prixHT: number;
    prixTTC: number;
    score: number;
  } | null;
  matchesSellsy: {
    id: number;
    name: string;
    reference: string;
    prixHT: number;
    prixTTC: number;
    score: number;
    matchType: string;
  }[];
  estimatedValueHT: number;
  estimatedValueTTC: number;
}

interface SellsyResult {
  success: boolean;
  matches: SellsyMatch[];
  totalEstimatedHT: number;
  totalEstimatedTTC: number;
  catalogSize: number;
  error?: string;
}

// ===== COMPONENT =====

export default function LeadsPage() {
  const { data: session } = useSession();
  const [demandes, setDemandes] = useState<Demande[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    nouveau: 0,
    enCours: 0,
    devis: 0,
    vente: 0,
    perdu: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sellsyResults, setSellsyResults] = useState<Record<string, SellsyResult>>({});
  const [sellsyLoading, setSellsyLoading] = useState<Record<string, boolean>>({});
  const [statutFilter, setStatutFilter] = useState<string>("ALL");

  const fetchDemandes = useCallback(async (showLoader = true) => {
    if (showLoader) setRefreshing(true);
    try {
      const response = await fetch("/api/demandes");
      const result = await response.json();
      const demandesArray = result.data || [];
      setDemandes(demandesArray);
      if (result.stats) setStats(result.stats);
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
      if (showLoader) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDemandes(true);
  }, [fetchDemandes]);

  useEffect(() => {
    const interval = setInterval(() => fetchDemandes(false), 60000);
    return () => clearInterval(interval);
  }, [fetchDemandes]);

  // ===== SELLSY CATALOGUE MATCH =====

  const fetchSellsyMatch = async (demandeId: string) => {
    if (sellsyResults[demandeId] || sellsyLoading[demandeId]) return;
    setSellsyLoading((prev) => ({ ...prev, [demandeId]: true }));
    try {
      const res = await fetch(`/api/demandes/${demandeId}/match-sellsy`);
      const data = await res.json();
      setSellsyResults((prev) => ({ ...prev, [demandeId]: data }));
    } catch (err) {
      setSellsyResults((prev) => ({
        ...prev,
        [demandeId]: { success: false, matches: [], totalEstimatedHT: 0, totalEstimatedTTC: 0, catalogSize: 0, error: "Erreur de connexion" },
      }));
    } finally {
      setSellsyLoading((prev) => ({ ...prev, [demandeId]: false }));
    }
  };

  // ===== UPDATE STATUT =====

  const updateStatut = async (leadId: string, newStatut: string) => {
    try {
      await fetch("/api/demandes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, statut: newStatut }),
      });
      fetchDemandes(false);
    } catch (err) {
      console.error("Erreur update statut:", err);
    }
  };

  const deleteDemande = async (demandeId: string, nom: string) => {
    if (!confirm(`Supprimer la demande de ${nom} ? Cette action est irréversible.`)) return;
    try {
      const res = await fetch(`/api/demandes/${demandeId}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Erreur lors de la suppression");
        return;
      }
      fetchDemandes(false);
    } catch (err) {
      console.error("Erreur suppression:", err);
    }
  };

  // ===== EXPAND =====

  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      fetchSellsyMatch(id);
    }
  };

  // ===== HELPERS =====

  const getStatusColor = (statut: string) => {
    const colors: Record<string, { bg: string; text: string; ring: string }> = {
      NOUVEAU: { bg: "bg-[#8DA035]/10", text: "text-[#8DA035]", ring: "ring-[#8DA035]/30" },
      EN_COURS: { bg: "bg-[#E2A90A]/10", text: "text-[#E2A90A]", ring: "ring-[#E2A90A]/30" },
      DEVIS: { bg: "bg-[#D4567A]/10", text: "text-[#D4567A]", ring: "ring-[#D4567A]/30" },
      VENTE: { bg: "bg-[#8DA035]/10", text: "text-[#8DA035]", ring: "ring-[#8DA035]/30" },
      PERDU: { bg: "bg-[#C2185B]/10", text: "text-[#C2185B]", ring: "ring-[#C2185B]/30" },
    };
    return colors[statut] || { bg: "bg-gray-500/10", text: "text-gray-400", ring: "ring-gray-500/30" };
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-[#8DA035]";
    if (score >= 50) return "text-[#E2A90A]";
    return "text-[#C2185B]";
  };

  const nomComplet = (d: Demande) => `${d.prenom || ""} ${d.nom || ""}`.trim();

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

  const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const isSlaExpired = (sla: string | null | undefined) => {
    if (!sla) return false;
    return new Date(sla) < new Date();
  };

  const filteredDemandes = useMemo(() =>
    statutFilter === "ALL"
      ? demandes
      : demandes.filter((d) => d.statut === statutFilter),
    [demandes, statutFilter]);

  // ===== RENDER =====

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-cockpit-heading mb-1 sm:mb-2">
            Demandes de Prix
          </h1>
          <p className="text-cockpit-secondary text-sm">
            Gérez les demandes · Correspondance catalogue Sellsy
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => fetchDemandes(true)}
            disabled={refreshing}
            className="flex items-center gap-2 bg-cockpit-card border border-cockpit px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-cockpit-dark transition-colors disabled:opacity-50 text-sm"
          >
            {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            <span className="hidden sm:inline">Actualiser</span>
          </button>
        </div>
      </div>

      {/* Auto-refresh indicator */}
      <div className="flex items-center gap-3 text-xs text-cockpit-secondary">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          Auto-refresh · {lastUpdate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <KPICard title="Total" value={stats.total} icon={<Inbox className="w-6 h-6" />} bgColor="bg-mk-lemon" />
        <KPICard title="Nouveau" value={stats.nouveau} icon={<TrendingUp className="w-6 h-6" />} bgColor="bg-mk-lime" />
        <KPICard title="En cours" value={stats.enCours} icon={<Clock className="w-6 h-6" />} bgColor="bg-mk-lemon" />
        <KPICard title="Devis" value={stats.devis} icon={<FileText className="w-6 h-6" />} bgColor="bg-mk-grapefruit" />
        <KPICard title="Vente" value={stats.vente} icon={<CheckCircle className="w-6 h-6" />} bgColor="bg-mk-lime" />
        <KPICard title="Perdu" value={stats.perdu} icon={<XCircle className="w-6 h-6" />} bgColor="bg-mk-raspberry" />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {["ALL", "NOUVEAU", "EN_COURS", "DEVIS", "VENTE", "PERDU"].map((s) => {
          const label: Record<string, string> = {
            ALL: "Tous",
            NOUVEAU: "Nouveau",
            EN_COURS: "En cours",
            DEVIS: "Devis",
            VENTE: "Vente",
            PERDU: "Perdu",
          };
          const isActive = statutFilter === s;
          const sc = s !== "ALL" ? getStatusColor(s) : { bg: "", text: "", ring: "" };
          return (
            <button
              key={s}
              onClick={() => setStatutFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                isActive
                  ? s === "ALL"
                    ? "bg-[#C2185B] text-white"
                    : `${sc.bg} ${sc.text} ring-1 ${sc.ring}`
                  : "bg-cockpit-card border border-cockpit text-cockpit-secondary hover:text-cockpit-primary"
              }`}
            >
              {label[s]}
            </button>
          );
        })}
        <span className="text-xs text-cockpit-secondary ml-2">
          {filteredDemandes.length} demande{filteredDemandes.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Demandes list */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-cockpit-card rounded-card border border-cockpit p-12 text-center">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
            <span className="text-cockpit-secondary text-sm">Chargement...</span>
          </div>
        ) : filteredDemandes.length === 0 ? (
          <div className="bg-cockpit-card rounded-card border border-cockpit p-12 text-center">
            <Inbox className="w-8 h-8 mx-auto mb-3 text-cockpit-secondary" />
            <p className="text-cockpit-secondary">Aucune demande</p>
          </div>
        ) : (
          filteredDemandes.map((demande) => {
            const isExpanded = expandedId === demande.id;
            const statusColor = getStatusColor(demande.statut);
            const sellsy = sellsyResults[demande.id];
            const sellsyIsLoading = sellsyLoading[demande.id];
            const articles = demande.articles as Article[] | null;
            const slaExpired = isSlaExpired(demande.slaDeadline);

            return (
              <div
                key={demande.id}
                className={`bg-cockpit-card rounded-card border transition-all ${
                  isExpanded ? "border-[#C2185B]/50 shadow-cockpit-lg" : "border-cockpit hover:border-[#C2185B]/30"
                }`}
              >
                {/* Row principal — cliquable */}
                <div
                  className="flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 cursor-pointer"
                  onClick={() => toggleExpand(demande.id)}
                >
                  {/* Icône expand */}
                  <div className="flex-shrink-0 text-cockpit-secondary">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>

                  {/* Contact */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-cockpit-primary text-sm truncate">
                        {nomComplet(demande)}
                      </span>
                      {slaExpired && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-red-500/10 text-red-400 rounded font-semibold">
                          SLA
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-cockpit-secondary truncate">
                      {demande.meuble || "Produit non spécifié"}
                    </p>
                  </div>

                  {/* Showroom */}
                  <div className="hidden md:block text-xs text-cockpit-secondary min-w-[100px]">
                    {demande.showroom || "—"}
                  </div>

                  {/* Budget */}
                  <div className="hidden lg:block text-xs text-cockpit-secondary min-w-[100px]">
                    {demande.budget || "—"}
                  </div>

                  {/* Assigné */}
                  <div className="hidden xl:flex items-center gap-1.5 text-xs text-cockpit-secondary min-w-[120px]">
                    <User className="w-3 h-3" />
                    <span className="truncate">{demande.assigneA || "Non assigné"}</span>
                  </div>

                  {/* Statut */}
                  <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${statusColor.bg} ${statusColor.text}`}>
                    {demande.statut === "EN_COURS" ? "En cours" : demande.statut.charAt(0) + demande.statut.slice(1).toLowerCase()}
                  </span>

                  {/* Date */}
                  <span className="text-xs text-cockpit-secondary flex-shrink-0 hidden sm:block min-w-[80px] text-right">
                    {formatDate(demande.dateCreation)}
                  </span>

                  {/* Estimation catalogue */}
                  {(demande.estimationTTC || sellsy?.totalEstimatedTTC) ? (
                    <span className="text-xs font-bold text-[#C2185B] flex-shrink-0 min-w-[80px] text-right" title="Estimation catalogue">
                      <DollarSign className="w-3 h-3 inline mr-0.5 -mt-0.5" />
                      {Number(demande.estimationTTC || sellsy?.totalEstimatedTTC || 0).toLocaleString("fr-FR", { maximumFractionDigits: 0 })}€
                    </span>
                  ) : (
                    <span className="text-[10px] text-cockpit-secondary flex-shrink-0 min-w-[80px] text-right hidden lg:block" title="Non estimé">
                      —
                    </span>
                  )}
                </div>

                {/* Détails expandés */}
                {isExpanded && (
                  <div className="border-t border-cockpit px-3 sm:px-4 py-3 sm:py-4 space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      {/* Col 1 — Contact & Demande */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-cockpit-heading flex items-center gap-2">
                          <User className="w-4 h-4 text-[#C2185B]" />
                          Contact
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-cockpit-primary">
                            <Mail className="w-3.5 h-3.5 text-cockpit-secondary" />
                            <a href={`mailto:${demande.email}`} className="hover:text-[#C2185B] transition-colors">
                              {demande.email}
                            </a>
                          </div>
                          {demande.telephone && (
                            <div className="flex items-center gap-2 text-cockpit-primary">
                              <Phone className="w-3.5 h-3.5 text-cockpit-secondary" />
                              <a href={`tel:${demande.telephone}`} className="hover:text-[#C2185B] transition-colors">
                                {demande.telephone}
                              </a>
                            </div>
                          )}
                          {demande.showroom && (
                            <div className="flex items-center gap-2 text-cockpit-primary">
                              <MapPin className="w-3.5 h-3.5 text-cockpit-secondary" />
                              {demande.showroom}
                            </div>
                          )}
                          {demande.budget && (
                            <div className="flex items-center gap-2 text-cockpit-primary">
                              <DollarSign className="w-3.5 h-3.5 text-cockpit-secondary" />
                              Budget: {demande.budget}
                            </div>
                          )}
                          {demande.modePaiement && (
                            <div className="flex items-center gap-2 text-cockpit-primary">
                              <Tag className="w-3.5 h-3.5 text-cockpit-secondary" />
                              {demande.modePaiement}
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-cockpit-secondary text-xs">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDateTime(demande.dateCreation)}
                          </div>
                        </div>

                        {demande.message && (
                          <div className="mt-3">
                            <div className="flex items-center gap-2 text-sm font-semibold text-cockpit-heading mb-1">
                              <MessageSquare className="w-4 h-4 text-[#C2185B]" />
                              Message
                            </div>
                            <p className="text-sm text-cockpit-secondary bg-cockpit-dark p-3 rounded-lg">
                              {demande.message}
                            </p>
                          </div>
                        )}

                        {/* Articles de la demande */}
                        {articles && articles.length > 0 && (
                          <div className="mt-3">
                            <div className="flex items-center gap-2 text-sm font-semibold text-cockpit-heading mb-2">
                              <Package className="w-4 h-4 text-[#C2185B]" />
                              Articles ({articles.length})
                            </div>
                            <div className="space-y-1.5">
                              {articles.map((a, i) => (
                                <div key={i} className="flex items-center justify-between bg-cockpit-dark p-2.5 rounded-lg text-sm">
                                  <div>
                                    <span className="text-cockpit-primary font-medium">{a.nom}</span>
                                    {a.finition && (
                                      <span className="text-cockpit-secondary text-xs ml-2">({a.finition})</span>
                                    )}
                                    {a.categorie && (
                                      <span className="text-cockpit-secondary text-xs ml-2">· {a.categorie}</span>
                                    )}
                                  </div>
                                  <span className="text-cockpit-secondary text-xs">x{a.quantite || 1}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Col 2 — Correspondance Catalogue Sellsy */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-cockpit-heading flex items-center gap-2">
                          <Search className="w-4 h-4 text-[#C2185B]" />
                          Correspondance Catalogue Sellsy
                        </h3>

                        {sellsyIsLoading ? (
                          <div className="flex items-center gap-2 text-cockpit-secondary text-sm py-4">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Recherche dans le catalogue Sellsy...
                          </div>
                        ) : sellsy?.error ? (
                          <div className="bg-red-500/10 text-red-400 p-3 rounded-lg text-sm">
                            {sellsy.error}
                          </div>
                        ) : sellsy ? (
                          <div className="space-y-3">
                            {/* Total estimé */}
                            {sellsy.totalEstimatedTTC > 0 && (
                              <div className="bg-[#C2185B]/10 border border-[#C2185B]/30 p-4 rounded-lg">
                                <div className="text-xs text-[#C2185B] font-semibold mb-1">ESTIMATION TOTALE</div>
                                <div className="text-2xl font-bold text-[#C2185B]">
                                  {Number(sellsy.totalEstimatedTTC).toFixed(2)}€ <span className="text-sm font-normal">TTC</span>
                                </div>
                                <div className="text-xs text-cockpit-secondary mt-1">
                                  {Number(sellsy.totalEstimatedHT).toFixed(2)}€ HT · {sellsy.catalogSize} produits analysés
                                </div>
                              </div>
                            )}

                            {/* Détails par article */}
                            {sellsy.matches.map((m, i) => (
                              <div key={i} className="bg-cockpit-dark p-3 rounded-lg">
                                <div className="text-xs text-cockpit-secondary mb-1.5">
                                  {m.articleDemande.nom} (x{m.articleDemande.quantite})
                                </div>
                                {m.bestMatch ? (
                                  <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm text-cockpit-primary font-medium">
                                        {m.bestMatch.name}
                                      </span>
                                      <span className={`text-xs font-bold ${getScoreColor(m.bestMatch.score)}`}>
                                        {m.bestMatch.score}%
                                      </span>
                                    </div>
                                    {m.bestMatch.reference && (
                                      <div className="text-xs text-cockpit-secondary">
                                        Réf: {m.bestMatch.reference}
                                      </div>
                                    )}
                                    <div className="flex items-center justify-between text-sm">
                                      <span className="text-cockpit-secondary">
                                        {Number(m.bestMatch.prixHT).toFixed(2)}€ HT
                                      </span>
                                      <span className="text-[#C2185B] font-semibold">
                                        {Number(m.estimatedValueTTC).toFixed(2)}€ TTC
                                      </span>
                                    </div>
                                    {/* Alternatives */}
                                    {(m.matchesSellsy?.length || 0) > 1 && (
                                      <details className="mt-1">
                                        <summary className="text-[10px] text-cockpit-secondary cursor-pointer hover:text-cockpit-primary">
                                          {m.matchesSellsy!.length - 1} autre{m.matchesSellsy!.length > 2 ? "s" : ""} correspondance{m.matchesSellsy!.length > 2 ? "s" : ""}
                                        </summary>
                                        <div className="mt-1 space-y-1">
                                          {m.matchesSellsy!.slice(1).map((alt, j) => (
                                            <div key={j} className="flex items-center justify-between text-xs text-cockpit-secondary">
                                              <span className="truncate mr-2">{alt.name}</span>
                                              <span>{Number(alt.prixTTC).toFixed(0)}€ ({alt.score}%)</span>
                                            </div>
                                          ))}
                                        </div>
                                      </details>
                                    )}
                                  </div>
                                ) : (
                                  <div className="text-xs text-cockpit-secondary italic">
                                    Aucune correspondance trouvée
                                  </div>
                                )}
                              </div>
                            ))}

                            {sellsy.matches.length === 0 && (
                              <div className="text-sm text-cockpit-secondary italic py-2">
                                Aucun article à analyser
                              </div>
                            )}
                          </div>
                        ) : null}
                      </div>

                      {/* Col 3 — Actions & Statut */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-cockpit-heading flex items-center gap-2">
                          <Tag className="w-4 h-4 text-[#C2185B]" />
                          Actions
                        </h3>

                        {/* Changer le statut */}
                        <div>
                          <label className="text-xs text-cockpit-secondary mb-1.5 block">Statut</label>
                          <div className="flex flex-wrap gap-1.5">
                            {["NOUVEAU", "EN_COURS", "DEVIS", "VENTE", "PERDU"].map((s) => {
                              const sc = getStatusColor(s);
                              const isActive = demande.statut === s;
                              return (
                                <button
                                  key={s}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (demande.leadId && !isActive) updateStatut(demande.leadId, s);
                                  }}
                                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
                                    isActive
                                      ? `${sc.bg} ${sc.text} ring-1 ${sc.ring}`
                                      : "bg-cockpit-dark text-cockpit-secondary hover:text-cockpit-primary"
                                  }`}
                                >
                                  {s === "EN_COURS" ? "En cours" : s.charAt(0) + s.slice(1).toLowerCase()}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Assignation */}
                        <div>
                          <label className="text-xs text-cockpit-secondary mb-1.5 block">Assigné à</label>
                          <div className="bg-cockpit-dark p-3 rounded-lg text-sm text-cockpit-primary">
                            {demande.assigneA || "Non assigné"}
                            {demande.assigneEmail && (
                              <span className="text-xs text-cockpit-secondary block">{demande.assigneEmail}</span>
                            )}
                          </div>
                        </div>

                        {/* Notes */}
                        {demande.notes && (
                          <div>
                            <label className="text-xs text-cockpit-secondary mb-1.5 block">Notes</label>
                            <div className="bg-cockpit-dark p-3 rounded-lg text-xs text-cockpit-secondary">
                              {demande.notes}
                            </div>
                          </div>
                        )}

                        {/* SLA */}
                        {demande.slaDeadline && (
                          <div>
                            <label className="text-xs text-cockpit-secondary mb-1.5 block">SLA (72h)</label>
                            <div className={`p-3 rounded-lg text-sm font-semibold ${
                              slaExpired
                                ? "bg-red-500/10 text-red-400"
                                : "bg-cockpit-dark text-cockpit-primary"
                            }`}>
                              {slaExpired ? "!! " : ""}
                              {formatDateTime(demande.slaDeadline)}
                            </div>
                          </div>
                        )}

                        {/* Source */}
                        <div className="flex items-center gap-3 text-xs text-cockpit-secondary">
                          <span>Source: {demande.source}</span>
                          {demande.priorite && demande.priorite !== "NORMALE" && (
                            <span className={`px-2 py-0.5 rounded-full font-semibold ${
                              demande.priorite === "HAUTE" ? "bg-red-500/10 text-red-400" : "bg-gray-500/10 text-gray-400"
                            }`}>
                              {demande.priorite}
                            </span>
                          )}
                        </div>

                        {/* Supprimer (spam) */}
                        <div className="pt-3 border-t border-cockpit">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteDemande(demande.id, `${demande.nom} ${demande.prenom || ""}`.trim());
                            }}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-all w-full justify-center"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Supprimer cette demande
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
