"use client";

import { useState, useEffect, useCallback } from "react";
import { KPICard } from "@/components/dashboard/kpi-card";
import {
  Users,
  Loader2,
  Search,
  FileText,
  ShoppingCart,
  RefreshCw,
  Link2,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  X,
  Check,
  Ban,
} from "lucide-react";
import { ContactPreviewDrawer } from "@/components/contacts/contact-preview-drawer";

const ITEMS_PER_PAGE = 25;

type ContactData = any;

const sourceConfig: Record<string, { label: string; bg: string; text: string }> = {
  GLIDE: { label: "Glide", bg: "bg-purple-500/10", text: "text-purple-400" },
  SITE_WEB: { label: "Site Web", bg: "bg-cockpit-info/10", text: "text-cockpit-info" },
  WEBHOOK: { label: "Webhook", bg: "bg-blue-500/10", text: "text-blue-400" },
  MANUAL: { label: "Manuel", bg: "bg-cockpit-secondary/10", text: "text-cockpit-secondary" },
};

const stageConfig: Record<string, { bg: string; text: string }> = {
  CLIENT: { bg: "bg-cockpit-success/10", text: "text-cockpit-success" },
  LEAD: { bg: "bg-cockpit-warning/10", text: "text-cockpit-warning" },
  INACTIF: { bg: "bg-red-500/10", text: "text-red-400" },
  PROSPECT: { bg: "bg-cockpit-info/10", text: "text-cockpit-info" },
};

export default function ContactsPage() {
  const [apiContacts, setApiContacts] = useState<ContactData[]>([]);
  const [totalContacts, setTotalContacts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedContact, setSelectedContact] = useState<ContactData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [stageFilter, setStageFilter] = useState<string>("ALL");
  const [sourceFilter, setSourceFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("derniere_demande");

  // KPIs from API
  const [kpis, setKpis] = useState({
    totalContacts: 0,
    totalLinkedSellsy: 0,
    totalAvecBDC: 0,
    totalCABDC: 0,
    totalDevis: 0,
    totalVentes: 0,
  });

  // Sellsy sync modal
  const [showSellsyModal, setShowSellsyModal] = useState(false);
  const [sellsySyncing, setSellsySyncing] = useState(false);
  const [sellsySyncResult, setSellsySyncResult] = useState<{
    success: boolean;
    linkedByEmail: number;
    alreadyLinked: number;
    totalKokpitContacts: number;
    totalSellsyEntities: number;
    devisImported: number;
    ventesImported: number;
    clientsUpdated: number;
    suggestions: Array<{
      contactId: string;
      kokpitNom: string;
      kokpitPrenom: string;
      kokpitEmail: string;
      kokpitTelephone: string;
      sellsyContactId: number;
      sellsyNom: string;
      sellsyPrenom: string;
      sellsyEmail: string;
      sellsyTelephone: string;
      matchType: string;
    }>;
    errors: string[];
  } | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());

  // Search debounce
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Charger les contacts API
  const fetchContacts = useCallback(
    async (showRefresh = false) => {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const searchParam = search ? `&search=${encodeURIComponent(search)}` : "";
        const stageParam = stageFilter !== "ALL" ? `&stage=${stageFilter}` : "";
        const sortParam = `&sort=${sortBy}`;
        const response = await fetch(
          `/api/contacts?page=${page}&limit=${ITEMS_PER_PAGE}${searchParam}${stageParam}${sortParam}`
        );
        const result = await response.json();

        let contacts = result.contacts || [];

        // Client-side source filter
        if (sourceFilter !== "ALL") {
          contacts = contacts.filter((c: any) => {
            const src = (c.sourcePremiere || "").toUpperCase();
            if (sourceFilter === "GLIDE") return src === "GLIDE";
            if (sourceFilter === "SITE_WEB") return src === "SITE_WEB" || src === "SITE-WEB" || src === "SITE-WEB-V2";
            if (sourceFilter === "WEBHOOK") return src === "WEBHOOK" || src === "GLIDE_WEBHOOK";
            return src !== "GLIDE" && src !== "WEBHOOK";
          });
        }

        setApiContacts(contacts);
        setTotalContacts(result.pagination?.total || 0);

        // Update KPIs from API response
        if (result.kpis) {
          setKpis(result.kpis);
        }
      } catch (error) {
        console.error("Erreur chargement contacts:", error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, search, stageFilter, sourceFilter, sortBy]
  );

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  // Sellsy sync
  const handleSellsySync = async () => {
    setSellsySyncing(true);
    setSellsySyncResult(null);
    setDismissedSuggestions(new Set());
    try {
      const res = await fetch("/api/contacts/sellsy-sync", { method: "POST" });
      const data = await res.json();
      setSellsySyncResult(data);
      // Refresh contacts si des liaisons / imports ont été faits
      if (data.linkedByEmail > 0 || data.devisImported > 0 || data.ventesImported > 0 || data.clientsUpdated > 0) {
        fetchContacts(true);
      }
    } catch (err: any) {
      console.error("Sellsy sync error:", err);
    } finally {
      setSellsySyncing(false);
    }
  };

  // Confirm suggestion
  const handleConfirmSuggestion = async (contactId: string, sellsyContactId: number) => {
    setConfirmingId(contactId);
    try {
      const res = await fetch("/api/contacts/sellsy-sync/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId, sellsyContactId }),
      });
      const data = await res.json();
      if (data.success) {
        setSellsySyncResult((prev) =>
          prev ? { ...prev, suggestions: prev.suggestions.filter((s) => s.contactId !== contactId) } : null
        );
      }
    } catch (err: any) {
      console.error("Confirm suggestion error:", err);
    } finally {
      setConfirmingId(null);
    }
  };

  const totalPages = Math.ceil(totalContacts / ITEMS_PER_PAGE);

  const formatEuro = (amount: number) => {
    if (amount === 0) return "0 €";
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(amount);
  };

  // Source badge
  const SourceBadge = ({ source }: { source?: string }) => {
    const src = (source || "").toUpperCase();
    const cfg = sourceConfig[src] || sourceConfig.MANUAL;
    return (
      <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold ${cfg.bg} ${cfg.text}`}>
        {cfg.label}
      </span>
    );
  };

  // Date dernière demande
  const getLastDemandeDate = (contact: ContactData) => {
    const demandes = contact.demandesPrix;
    if (!demandes || demandes.length === 0) return null;
    const latest = demandes[0];
    if (!latest?.dateDemande) return null;
    try {
      return new Date(latest.dateDemande).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit" });
    } catch {
      return null;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-cockpit-heading mb-1">Contacts</h1>
          <p className="text-cockpit-secondary text-sm">{totalContacts} contacts en base</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => { setShowSellsyModal(true); if (!sellsySyncResult) handleSellsySync(); }}
            className="flex items-center gap-1.5 bg-cockpit-info/10 border border-cockpit-info/30 text-cockpit-info px-3 py-2 rounded-lg text-xs font-medium hover:bg-cockpit-info/20 transition-colors">
            <Link2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sync Sellsy</span>
          </button>
          <button onClick={() => fetchContacts(true)} disabled={refreshing}
            className="flex items-center gap-1.5 bg-cockpit-card border border-cockpit px-3 py-2 rounded-lg text-xs font-medium hover:bg-cockpit-dark transition-colors disabled:opacity-50">
            {refreshing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          </button>
          <button className="bg-cockpit-yellow text-cockpit-bg px-4 py-2 rounded-lg font-semibold hover:opacity-90 text-sm">
            + Nouveau
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KPICard title="Contacts" value={kpis.totalContacts} icon={<Users className="w-7 h-7" />} bgColor="bg-cockpit-yellow" />
        <KPICard title="Devis Sellsy" value={kpis.totalDevis} icon={<FileText className="w-7 h-7" />} bgColor="bg-cockpit-info" />
        <KPICard title="Bons de commande" value={kpis.totalVentes} icon={<ShoppingCart className="w-7 h-7" />} bgColor="bg-cockpit-success" />
        <KPICard title="CA BDC" value={formatEuro(kpis.totalCABDC)} icon={<DollarSign className="w-7 h-7" />} bgColor="bg-cockpit-warning" />
      </div>

      {/* Search + Filters */}
      <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cockpit-secondary" />
            <input type="text" placeholder="Rechercher par nom, prénom ou email..."
              value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-cockpit-input rounded-input bg-cockpit-input text-cockpit-primary text-sm" />
          </div>
          <select value={stageFilter} onChange={(e) => { setStageFilter(e.target.value); setPage(1); }}
            className="bg-cockpit-input border border-cockpit-input px-3 py-2.5 rounded-input text-xs text-cockpit-primary">
            <option value="ALL">Tous les stages</option>
            <option value="PROSPECT">Prospect</option>
            <option value="LEAD">Lead</option>
            <option value="CLIENT">Client</option>
            <option value="INACTIF">Inactif</option>
          </select>
          <select value={sourceFilter} onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }}
            className="bg-cockpit-input border border-cockpit-input px-3 py-2.5 rounded-input text-xs text-cockpit-primary">
            <option value="ALL">Toutes les sources</option>
            <option value="GLIDE">Glide (anciens)</option>
            <option value="SITE_WEB">Site Web</option>
            <option value="WEBHOOK">Webhook</option>
          </select>
          <select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
            className="bg-cockpit-input border border-cockpit-input px-3 py-2.5 rounded-input text-xs text-cockpit-primary">
            <option value="derniere_demande">Tri: Dernière demande</option>
            <option value="dernier_devis">Tri: Dernier devis</option>
            <option value="dernier_bdc">Tri: Dernier BDC</option>
            <option value="nom">Tri: Nom A-Z</option>
            <option value="date_creation">Tri: Date création</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg overflow-hidden">
        {/* Desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-cockpit-dark border-b border-cockpit">
              <tr>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-cockpit-heading">NOM</th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-cockpit-heading">EMAIL</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-cockpit-heading hidden lg:table-cell">TÉL.</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-cockpit-heading">SOURCE</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-cockpit-heading">STAGE</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-cockpit-heading">DEM.</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-cockpit-heading">DEVIS</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-cockpit-heading">BDC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cockpit">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />Chargement...
                    </div>
                  </td>
                </tr>
              ) : apiContacts.length > 0 ? (
                apiContacts.map((c: any) => {
                  const sc = stageConfig[c.lifecycleStage] || stageConfig.PROSPECT;
                  const nbDevis = c._count?.devis || 0;
                  const nbVentes = c._count?.ventes || 0;
                  const nbDem = c._count?.demandesPrix || 0;
                  const lastDate = getLastDemandeDate(c);
                  return (
                    <tr key={c.id} className="hover:bg-cockpit-dark transition-colors cursor-pointer"
                      onClick={() => setSelectedContact(c)}>
                      <td className="px-4 lg:px-6 py-3">
                        <span className="text-cockpit-yellow font-medium hover:underline text-sm">
                          {c.prenom} {c.nom}
                        </span>
                        {lastDate && (
                          <p className="text-[10px] text-cockpit-secondary mt-0.5">{lastDate}</p>
                        )}
                      </td>
                      <td className="px-4 lg:px-6 py-3 text-cockpit-secondary text-xs truncate max-w-[200px]">{c.email}</td>
                      <td className="px-3 py-3 text-cockpit-secondary text-sm hidden lg:table-cell">{c.telephone || "—"}</td>
                      <td className="px-3 py-3"><SourceBadge source={c.sourcePremiere} /></td>
                      <td className="px-3 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${sc.bg} ${sc.text}`}>
                          {c.lifecycleStage || "PROSPECT"}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center text-sm font-medium text-cockpit-primary">
                        {nbDem > 0 ? nbDem : <span className="text-cockpit-secondary text-xs">—</span>}
                      </td>
                      <td className="px-3 py-3 text-center">
                        {nbDevis > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-cockpit-info/10 text-cockpit-info">
                            <FileText className="w-3 h-3" />{nbDevis}
                          </span>
                        ) : (
                          <span className="text-cockpit-secondary text-xs">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center">
                        {nbVentes > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-cockpit-success/10 text-cockpit-success">
                            <ShoppingCart className="w-3 h-3" />{nbVentes}
                          </span>
                        ) : (
                          <span className="text-cockpit-secondary text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-cockpit-secondary">
                    {totalContacts === 0 ? "Aucun contact en base" : "Aucun contact trouvé avec ces filtres"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="md:hidden divide-y divide-cockpit">
          {loading ? (
            <div className="flex items-center justify-center py-12 gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-cockpit-secondary text-sm">Chargement...</span>
            </div>
          ) : apiContacts.length > 0 ? (
            apiContacts.map((c: any) => {
              const sc = stageConfig[c.lifecycleStage] || stageConfig.PROSPECT;
              const nbDevis = c._count?.devis || 0;
              const nbVentes = c._count?.ventes || 0;
              const nbDem = c._count?.demandesPrix || 0;
              return (
                <div key={c.id} className="p-4 hover:bg-cockpit-dark transition-colors cursor-pointer"
                  onClick={() => setSelectedContact(c)}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-cockpit-yellow font-medium text-sm truncate">{c.prenom} {c.nom}</p>
                      <p className="text-cockpit-secondary text-xs truncate mt-0.5">{c.email}</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <SourceBadge source={c.sourcePremiere} />
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${sc.bg} ${sc.text}`}>
                          {c.lifecycleStage || "PROSPECT"}
                        </span>
                        {nbDem > 0 && <span className="text-[10px] text-cockpit-secondary">{nbDem} dem.</span>}
                        {nbDevis > 0 && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-cockpit-info font-semibold">
                            <FileText className="w-3 h-3" />{nbDevis}
                          </span>
                        )}
                        {nbVentes > 0 && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-cockpit-success font-semibold">
                            <ShoppingCart className="w-3 h-3" />{nbVentes}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-cockpit-secondary text-sm">
              Aucun contact trouvé
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-4 lg:px-6 py-3 border-t border-cockpit gap-3">
          <p className="text-xs sm:text-sm text-cockpit-secondary">
            {apiContacts.length > 0
              ? `${(page - 1) * ITEMS_PER_PAGE + 1}-${Math.min(page * ITEMS_PER_PAGE, totalContacts)} sur ${totalContacts}`
              : "Aucun contact"}
          </p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-cockpit text-cockpit-primary hover:bg-cockpit-dark disabled:opacity-40">
              Précédent
            </button>
            <span className="px-2 py-1 text-xs text-cockpit-secondary">{page}/{totalPages || 1}</span>
            <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-cockpit text-cockpit-primary hover:bg-cockpit-dark disabled:opacity-40">
              Suivant
            </button>
          </div>
        </div>
      </div>

      {/* Modal Sync Sellsy */}
      {showSellsyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-cockpit-card border border-cockpit rounded-2xl shadow-cockpit-lg w-full max-w-2xl max-h-[85vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-cockpit">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cockpit-info/10 flex items-center justify-center">
                  <Link2 className="w-5 h-5 text-cockpit-info" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-cockpit-heading">Synchronisation Sellsy</h2>
                  <p className="text-xs text-cockpit-secondary">Liaison contacts + import devis/BDC</p>
                </div>
              </div>
              <button onClick={() => setShowSellsyModal(false)} className="p-2 hover:bg-cockpit-dark rounded-lg transition-colors">
                <X className="w-5 h-5 text-cockpit-secondary" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {sellsySyncing ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-cockpit-info" />
                  <p className="text-sm text-cockpit-secondary">Synchronisation en cours...</p>
                  <p className="text-xs text-cockpit-secondary">Récupération des données Sellsy, matching et import...</p>
                </div>
              ) : sellsySyncResult ? (
                <>
                  {/* Résumé */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="bg-cockpit-dark rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-cockpit-success">{sellsySyncResult.linkedByEmail}</p>
                      <p className="text-[10px] text-cockpit-secondary mt-1">Liés par email</p>
                    </div>
                    <div className="bg-cockpit-dark rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-cockpit-info">{sellsySyncResult.devisImported}</p>
                      <p className="text-[10px] text-cockpit-secondary mt-1">Devis importés</p>
                    </div>
                    <div className="bg-cockpit-dark rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-cockpit-success">{sellsySyncResult.ventesImported}</p>
                      <p className="text-[10px] text-cockpit-secondary mt-1">BDC importés</p>
                    </div>
                    <div className="bg-cockpit-dark rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-cockpit-warning">{sellsySyncResult.clientsUpdated}</p>
                      <p className="text-[10px] text-cockpit-secondary mt-1">→ CLIENT</p>
                    </div>
                    <div className="bg-cockpit-dark rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-cockpit-heading">{sellsySyncResult.alreadyLinked}</p>
                      <p className="text-[10px] text-cockpit-secondary mt-1">Déjà liés</p>
                    </div>
                    <div className="bg-cockpit-dark rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-cockpit-heading">{sellsySyncResult.totalSellsyEntities}</p>
                      <p className="text-[10px] text-cockpit-secondary mt-1">Entreprises Sellsy</p>
                    </div>
                  </div>

                  {/* Erreurs */}
                  {sellsySyncResult.errors && sellsySyncResult.errors.length > 0 && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                      <p className="text-xs font-semibold text-red-400 mb-1">Erreurs ({sellsySyncResult.errors.length})</p>
                      <div className="max-h-24 overflow-y-auto space-y-1">
                        {sellsySyncResult.errors.slice(0, 5).map((err, i) => (
                          <p key={i} className="text-[10px] text-red-400">{err}</p>
                        ))}
                        {sellsySyncResult.errors.length > 5 && (
                          <p className="text-[10px] text-red-400">...et {sellsySyncResult.errors.length - 5} autres</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Succès message */}
                  {sellsySyncResult.success && (sellsySyncResult.linkedByEmail > 0 || sellsySyncResult.devisImported > 0 || sellsySyncResult.ventesImported > 0) && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-cockpit-success/10 border border-cockpit-success/30">
                      <CheckCircle2 className="w-4 h-4 text-cockpit-success flex-shrink-0" />
                      <p className="text-xs text-cockpit-success">
                        Synchronisation réussie ! Les données ont été mises à jour.
                      </p>
                    </div>
                  )}

                  {/* Suggestions */}
                  {sellsySyncResult.suggestions.filter((s) => !dismissedSuggestions.has(s.contactId)).length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-cockpit-heading mb-3">
                        Suggestions à valider ({sellsySyncResult.suggestions.filter((s) => !dismissedSuggestions.has(s.contactId)).length})
                      </h3>
                      <div className="space-y-2">
                        {sellsySyncResult.suggestions
                          .filter((s) => !dismissedSuggestions.has(s.contactId))
                          .map((sug) => (
                            <div key={sug.contactId} className="flex items-center gap-3 p-3 bg-cockpit-dark rounded-xl border border-cockpit">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-cockpit-heading truncate">
                                  {sug.kokpitPrenom} {sug.kokpitNom}
                                </p>
                                <p className="text-[10px] text-cockpit-secondary truncate">{sug.kokpitEmail || "—"}</p>
                                <p className="text-[10px] text-cockpit-secondary">{sug.kokpitTelephone || "—"}</p>
                              </div>
                              <div className="text-cockpit-warning text-lg">→</div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-cockpit-info truncate">
                                  {sug.sellsyPrenom} {sug.sellsyNom}
                                </p>
                                <p className="text-[10px] text-cockpit-secondary truncate">{sug.sellsyEmail || "—"}</p>
                                <p className="text-[10px] text-cockpit-secondary">{sug.sellsyTelephone || "—"}</p>
                              </div>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <button
                                  onClick={() => handleConfirmSuggestion(sug.contactId, sug.sellsyContactId)}
                                  disabled={confirmingId === sug.contactId}
                                  className="p-2 rounded-lg bg-cockpit-success/10 text-cockpit-success hover:bg-cockpit-success/20 transition-colors disabled:opacity-50"
                                  title="Valider cette liaison"
                                >
                                  {confirmingId === sug.contactId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                </button>
                                <button
                                  onClick={() => setDismissedSuggestions((prev) => new Set([...prev, sug.contactId]))}
                                  className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                                  title="Ignorer"
                                >
                                  <Ban className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-cockpit">
              <button
                onClick={handleSellsySync}
                disabled={sellsySyncing}
                className="flex items-center gap-2 bg-cockpit-info/10 text-cockpit-info px-4 py-2 rounded-lg text-xs font-medium hover:bg-cockpit-info/20 transition-colors disabled:opacity-50"
              >
                {sellsySyncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                Relancer la sync
              </button>
              <button
                onClick={() => setShowSellsyModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-medium border border-cockpit text-cockpit-primary hover:bg-cockpit-dark transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drawer */}
      <ContactPreviewDrawer contact={selectedContact} isOpen={selectedContact !== null} onClose={() => setSelectedContact(null)} />
    </div>
  );
}
