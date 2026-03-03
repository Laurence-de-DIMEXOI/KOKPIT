"use client";

import { useState, useEffect, useCallback } from "react";
import { KPICard } from "@/components/dashboard/kpi-card";
import {
  Users,
  Loader2,
  Search,
  FileText,
  ShoppingCart,
  HelpCircle,
  RefreshCw,
  Link2,
  DollarSign,
  CheckCircle2,
  Download,
  Upload,
  AlertCircle,
} from "lucide-react";
import { ContactPreviewDrawer } from "@/components/contacts/contact-preview-drawer";

const ITEMS_PER_PAGE = 25;

type ContactData = any;

interface SellsyDoc {
  id: number;
  number: string;
  date: string;
  status: string;
  company_name: string;
  subject: string;
  totalHT: number;
}

interface ContactLink {
  contactId: string;
  email: string;
  matchType: "email" | "nom" | "nom_partiel" | "telephone";
  confidence: "confirmed" | "high" | "medium";
  sellsyContactName?: string;
  devis: SellsyDoc[];
  commandes: SellsyDoc[];
  totalDevisHT: number;
  totalCommandesHT: number;
  totalCA: number;
}

interface SellsySuggestion {
  sellsyName: string;
  matchType: string;
  confidence: string;
}

const sourceConfig: Record<string, { label: string; bg: string; text: string }> = {
  GLIDE: { label: "Glide", bg: "bg-purple-500/10", text: "text-purple-400" },
  HUBSPOT: { label: "HubSpot", bg: "bg-orange-500/10", text: "text-orange-400" },
  WEBHOOK: { label: "Web", bg: "bg-cockpit-info/10", text: "text-cockpit-info" },
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

  // Import / Sync states
  const [importingLegacy, setImportingLegacy] = useState(false);
  const [syncingHubSpot, setSyncingHubSpot] = useState(false);
  const [importMessage, setImportMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Sellsy data
  const [sellsyLinks, setSellsyLinks] = useState<Record<string, ContactLink>>({});
  const [sellsySuggestions, setSellsySuggestions] = useState<Record<string, SellsySuggestion[]>>({});
  const [sellsyKPIs, setSellsyKPIs] = useState({
    totalLinked: 0, contactsAvecDevis: 0, contactsAvecCommande: 0, totalCA: 0, totalDevisHT: 0,
  });
  const [sellsyLoading, setSellsyLoading] = useState(true);

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
        const response = await fetch(
          `/api/contacts?page=${page}&limit=${ITEMS_PER_PAGE}${searchParam}${stageParam}`
        );
        const result = await response.json();

        let contacts = result.contacts || [];

        // Client-side source filter (sourcePremiere field)
        if (sourceFilter !== "ALL") {
          contacts = contacts.filter((c: any) => {
            const src = (c.sourcePremiere || "").toUpperCase();
            if (sourceFilter === "GLIDE") return src === "GLIDE";
            if (sourceFilter === "HUBSPOT") return src === "HUBSPOT";
            if (sourceFilter === "WEBHOOK") return src === "WEBHOOK" || src === "GLIDE_WEBHOOK";
            return src !== "GLIDE" && src !== "HUBSPOT" && src !== "WEBHOOK";
          });
        }

        setApiContacts(contacts);
        setTotalContacts(result.pagination?.total || 0);
      } catch (error) {
        console.error("Erreur chargement contacts:", error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, search, stageFilter, sourceFilter]
  );

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  // Charger les liens Sellsy
  useEffect(() => {
    const fetchSellsy = async () => {
      try {
        setSellsyLoading(true);
        const res = await fetch("/api/contacts/sellsy-links");
        const data = await res.json();
        if (data.success) {
          setSellsyLinks(data.links || {});
          setSellsySuggestions(data.suggestions || {});
          setSellsyKPIs({
            totalLinked: data.kpis?.totalLinked || 0,
            contactsAvecDevis: data.kpis?.contactsAvecDevis || 0,
            contactsAvecCommande: data.kpis?.contactsAvecCommande || 0,
            totalCA: data.kpis?.totalCA || 0,
            totalDevisHT: data.kpis?.totalDevisHT || 0,
          });
        }
      } catch (error) {
        console.error("Erreur Sellsy links:", error);
      } finally {
        setSellsyLoading(false);
      }
    };
    fetchSellsy();
  }, []);

  // Import legacy contacts
  const handleImportLegacy = async () => {
    setImportingLegacy(true);
    setImportMessage(null);
    try {
      const res = await fetch("/api/contacts/import-legacy", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setImportMessage({
          type: "success",
          text: `Import terminé : ${data.created} créés, ${data.updated} mis à jour, ${data.skipped} ignorés${data.errors > 0 ? `, ${data.errors} erreurs` : ""}`,
        });
        fetchContacts(true);
      } else {
        setImportMessage({ type: "error", text: data.error || "Erreur import" });
      }
    } catch (err: any) {
      setImportMessage({ type: "error", text: err.message });
    } finally {
      setImportingLegacy(false);
    }
  };

  // Sync HubSpot
  const handleSyncHubSpot = async () => {
    setSyncingHubSpot(true);
    setImportMessage(null);
    try {
      const res = await fetch("/api/hubspot/sync", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setImportMessage({
          type: "success",
          text: `HubSpot : ${data.created} créés, ${data.updated} mis à jour (${data.totalFromHubSpot} contacts HubSpot)`,
        });
        fetchContacts(true);
      } else {
        setImportMessage({ type: "error", text: data.error || "Erreur sync HubSpot" });
      }
    } catch (err: any) {
      setImportMessage({ type: "error", text: err.message });
    } finally {
      setSyncingHubSpot(false);
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

  // Sellsy badge
  const renderSellsyCell = (contact: ContactData) => {
    if (sellsyLoading) return <span className="text-cockpit-secondary text-xs">...</span>;

    const link = sellsyLinks[contact.id];
    const sugs = sellsySuggestions[contact.id];

    if (link) {
      return (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            {link.matchType === "email" && (
              <span className="inline-flex items-center text-[10px] text-cockpit-success"><CheckCircle2 className="w-3 h-3" /></span>
            )}
            {link.devis.length > 0 && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-cockpit-info/10 text-cockpit-info">
                <FileText className="w-3 h-3" />{link.devis.length}
              </span>
            )}
            {link.commandes.length > 0 && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-cockpit-success/10 text-cockpit-success">
                <ShoppingCart className="w-3 h-3" />{link.commandes.length}
              </span>
            )}
          </div>
          {link.totalCA > 0 && (
            <span className="text-[10px] text-cockpit-success font-semibold">{formatEuro(link.totalCA)}</span>
          )}
        </div>
      );
    }

    if (sugs && sugs.length > 0) {
      return (
        <div className="group relative">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-cockpit-warning/10 text-cockpit-warning cursor-help">
            <HelpCircle className="w-3 h-3" />Peut-être...
          </span>
          <div className="absolute z-50 bottom-full left-0 mb-2 w-64 p-3 bg-cockpit-card border border-cockpit rounded-lg shadow-cockpit-lg hidden group-hover:block">
            <p className="text-xs text-cockpit-heading font-semibold mb-1.5">Il s&apos;agit peut-être de :</p>
            {sugs.map((sug, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-cockpit-primary mb-1">
                <span className="text-cockpit-yellow font-medium">{sug.sellsyName}</span>
                <span className="text-cockpit-secondary text-[10px]">
                  ({sug.matchType === "nom" ? "même nom" : sug.matchType === "telephone" ? "même tél." : "nom similaire"})
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return <span className="text-cockpit-secondary text-[10px]">—</span>;
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-cockpit-heading mb-1">Contacts</h1>
          <p className="text-cockpit-secondary text-sm">{totalContacts} contacts en base</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={handleImportLegacy} disabled={importingLegacy}
            className="flex items-center gap-1.5 bg-cockpit-card border border-cockpit px-3 py-2 rounded-lg text-xs font-medium hover:bg-cockpit-dark transition-colors disabled:opacity-50">
            {importingLegacy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{importingLegacy ? "Import..." : "Import anciens"}</span>
          </button>
          <button onClick={handleSyncHubSpot} disabled={syncingHubSpot}
            className="flex items-center gap-1.5 bg-cockpit-card border border-cockpit px-3 py-2 rounded-lg text-xs font-medium hover:bg-cockpit-dark transition-colors disabled:opacity-50">
            {syncingHubSpot ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5 text-orange-400" />}
            <span className="hidden sm:inline">{syncingHubSpot ? "Sync..." : "Sync HubSpot"}</span>
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

      {/* Import message */}
      {importMessage && (
        <div className={`flex items-center gap-3 p-3 rounded-lg border ${
          importMessage.type === "success"
            ? "bg-cockpit-success/10 border-cockpit-success/30 text-cockpit-success"
            : "bg-[#FF3E1D]/10 border-[#FF3E1D]/30 text-[#FF3E1D]"
        }`}>
          {importMessage.type === "success" ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
          <p className="text-xs">{importMessage.text}</p>
          <button onClick={() => setImportMessage(null)} className="ml-auto text-xs opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-8">
        <KPICard title="Contacts" value={totalContacts} icon={<Users className="w-7 h-7" />} bgColor="bg-cockpit-yellow" />
        <KPICard title="Liés Sellsy" value={sellsyKPIs.totalLinked} icon={<Link2 className="w-7 h-7" />} bgColor="bg-cockpit-info" />
        <KPICard title="Avec commande" value={sellsyKPIs.contactsAvecCommande} icon={<ShoppingCart className="w-7 h-7" />} bgColor="bg-cockpit-success" />
        <KPICard title="CA Généré" value={formatEuro(sellsyKPIs.totalCA)} icon={<DollarSign className="w-7 h-7" />} bgColor="bg-cockpit-warning" />
      </div>

      {/* Search + Filters */}
      <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg p-3 sm:p-4 lg:p-8">
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
            <option value="HUBSPOT">HubSpot</option>
            <option value="WEBHOOK">Webhook</option>
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
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-cockpit-heading hidden lg:table-cell">TÉL.</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-cockpit-heading">SOURCE</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-cockpit-heading">STAGE</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-cockpit-heading">DEM.</th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-cockpit-heading">SELLSY</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cockpit">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />Chargement...
                    </div>
                  </td>
                </tr>
              ) : apiContacts.length > 0 ? (
                apiContacts.map((c: any) => {
                  const sc = stageConfig[c.lifecycleStage] || stageConfig.PROSPECT;
                  return (
                    <tr key={c.id} className="hover:bg-cockpit-dark transition-colors cursor-pointer"
                      onClick={() => setSelectedContact(c)}>
                      <td className="px-4 lg:px-6 py-3">
                        <span className="text-cockpit-yellow font-medium hover:underline text-sm">
                          {c.prenom} {c.nom}
                        </span>
                      </td>
                      <td className="px-4 lg:px-6 py-3 text-cockpit-secondary text-xs truncate max-w-[200px]">{c.email}</td>
                      <td className="px-4 lg:px-6 py-3 text-cockpit-secondary text-sm hidden lg:table-cell">{c.telephone || "—"}</td>
                      <td className="px-3 py-3"><SourceBadge source={c.sourcePremiere} /></td>
                      <td className="px-3 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${sc.bg} ${sc.text}`}>
                          {c.lifecycleStage || "PROSPECT"}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center text-sm font-medium">
                        {(c._count?.demandesPrix || 0) + (c._count?.leads || 0)}
                      </td>
                      <td className="px-4 lg:px-6 py-3" onClick={(e) => e.stopPropagation()}>
                        {renderSellsyCell(c)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-cockpit-secondary">
                    {totalContacts === 0 ? (
                      <div className="space-y-3">
                        <p>Aucun contact en base</p>
                        <div className="flex items-center justify-center gap-3">
                          <button onClick={handleImportLegacy} disabled={importingLegacy}
                            className="flex items-center gap-2 bg-cockpit-yellow text-cockpit-bg px-4 py-2 rounded-lg font-semibold hover:opacity-90 text-sm disabled:opacity-50">
                            {importingLegacy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                            Importer les anciens contacts
                          </button>
                          <button onClick={handleSyncHubSpot} disabled={syncingHubSpot}
                            className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg font-semibold hover:opacity-90 text-sm disabled:opacity-50">
                            {syncingHubSpot ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                            Sync HubSpot
                          </button>
                        </div>
                      </div>
                    ) : (
                      "Aucun contact trouvé avec ces filtres"
                    )}
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
                        {((c._count?.demandesPrix || 0) + (c._count?.leads || 0)) > 0 && (
                          <span className="text-[10px] text-cockpit-secondary">
                            {(c._count?.demandesPrix || 0) + (c._count?.leads || 0)} dem.
                          </span>
                        )}
                      </div>
                      <div className="mt-2">{renderSellsyCell(c)}</div>
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

      {/* Drawer */}
      <ContactPreviewDrawer contact={selectedContact} isOpen={selectedContact !== null} onClose={() => setSelectedContact(null)} />
    </div>
  );
}
