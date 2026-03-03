"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
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

export default function ContactsPage() {
  const [apiContacts, setApiContacts] = useState<ContactData[]>([]);
  const [totalContacts, setTotalContacts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedContact, setSelectedContact] = useState<ContactData | null>(
    null
  );
  const [refreshing, setRefreshing] = useState(false);

  // Sellsy data
  const [sellsyLinks, setSellsyLinks] = useState<Record<string, ContactLink>>(
    {}
  );
  const [sellsySuggestions, setSellsySuggestions] = useState<
    Record<string, SellsySuggestion[]>
  >({});
  const [sellsyKPIs, setSellsyKPIs] = useState({
    totalLinked: 0,
    contactsAvecDevis: 0,
    contactsAvecCommande: 0,
    totalCA: 0,
    totalDevisHT: 0,
  });
  const [sellsyLoading, setSellsyLoading] = useState(true);

  // Search debounce
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Charger les contacts API
  const fetchContacts = useCallback(
    async (showRefresh = false) => {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const searchParam = search
          ? `&search=${encodeURIComponent(search)}`
          : "";
        const response = await fetch(
          `/api/contacts?page=${page}&limit=${ITEMS_PER_PAGE}${searchParam}`
        );
        const result = await response.json();
        setApiContacts(result.contacts || []);
        setTotalContacts(result.pagination?.total || 0);
      } catch (error) {
        console.error("Erreur chargement contacts:", error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, search]
  );

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

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

  const totalPages = Math.ceil(totalContacts / ITEMS_PER_PAGE);

  const handleContactClick = useCallback((contact: ContactData) => {
    setSelectedContact(contact);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setSelectedContact(null);
  }, []);

  // Format monétaire
  const formatEuro = (amount: number) => {
    if (amount === 0) return "0 €";
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Rendu Sellsy badge
  const renderSellsyCell = (contact: ContactData) => {
    if (sellsyLoading) {
      return <span className="text-cockpit-secondary text-xs">...</span>;
    }

    const link = sellsyLinks[contact.id];
    const sugs = sellsySuggestions[contact.id];

    if (link) {
      return (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            {link.matchType === "email" && (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-cockpit-success">
                <CheckCircle2 className="w-3 h-3" />
              </span>
            )}
            {link.devis.length > 0 && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-cockpit-info/10 text-cockpit-info">
                <FileText className="w-3 h-3" />
                {link.devis.length}
              </span>
            )}
            {link.commandes.length > 0 && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-cockpit-success/10 text-cockpit-success">
                <ShoppingCart className="w-3 h-3" />
                {link.commandes.length}
              </span>
            )}
          </div>
          {link.totalCA > 0 && (
            <span className="text-[10px] text-cockpit-success font-semibold">
              {formatEuro(link.totalCA)}
            </span>
          )}
        </div>
      );
    }

    if (sugs && sugs.length > 0) {
      return (
        <div className="group relative">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-cockpit-warning/10 text-cockpit-warning cursor-help">
            <HelpCircle className="w-3 h-3" />
            Peut-être...
          </span>
          <div className="absolute z-50 bottom-full left-0 mb-2 w-64 p-3 bg-cockpit-card border border-cockpit rounded-lg shadow-cockpit-lg hidden group-hover:block">
            <p className="text-xs text-cockpit-heading font-semibold mb-1.5">
              Il s&apos;agit peut-être de :
            </p>
            {sugs.map((sug, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-xs text-cockpit-primary mb-1"
              >
                <span className="text-cockpit-yellow font-medium">
                  {sug.sellsyName}
                </span>
                <span className="text-cockpit-secondary text-[10px]">
                  (
                  {sug.matchType === "nom"
                    ? "même nom"
                    : sug.matchType === "telephone"
                    ? "même tél."
                    : "nom similaire"}
                  )
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
          <h1 className="text-2xl sm:text-3xl font-bold text-cockpit-heading mb-1">
            Contacts
          </h1>
          <p className="text-cockpit-secondary text-sm">
            {totalContacts} contacts en base
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchContacts(true)}
            disabled={refreshing}
            className="flex items-center gap-2 bg-cockpit-card border border-cockpit px-3 py-2.5 rounded-lg font-semibold hover:bg-cockpit-dark transition-colors disabled:opacity-50 text-sm"
          >
            {refreshing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Actualiser</span>
          </button>
          <button className="bg-cockpit-yellow text-cockpit-bg px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold hover:opacity-90 text-sm">
            + Nouveau
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-8">
        <KPICard
          title="Contacts"
          value={totalContacts}
          icon={<Users className="w-7 h-7" />}
          bgColor="bg-cockpit-yellow"
        />
        <KPICard
          title="Liés Sellsy"
          value={sellsyKPIs.totalLinked}
          icon={<Link2 className="w-7 h-7" />}
          bgColor="bg-cockpit-info"
        />
        <KPICard
          title="Avec commande"
          value={sellsyKPIs.contactsAvecCommande}
          icon={<ShoppingCart className="w-7 h-7" />}
          bgColor="bg-cockpit-success"
        />
        <KPICard
          title="CA Généré"
          value={formatEuro(sellsyKPIs.totalCA)}
          icon={<DollarSign className="w-7 h-7" />}
          bgColor="bg-cockpit-warning"
        />
      </div>

      {/* Search */}
      <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg p-3 sm:p-4 lg:p-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cockpit-secondary" />
          <input
            type="text"
            placeholder="Rechercher par nom, prénom ou email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-cockpit-input rounded-input bg-cockpit-input text-cockpit-primary text-sm"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg overflow-hidden">
        {/* Desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-cockpit-dark border-b border-cockpit">
              <tr>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-cockpit-heading">
                  NOM
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-cockpit-heading">
                  EMAIL
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-cockpit-heading hidden lg:table-cell">
                  TÉLÉPHONE
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-cockpit-heading">
                  STAGE
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-cockpit-heading">
                  DEMANDES
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-cockpit-heading">
                  SELLSY
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cockpit">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Chargement...
                    </div>
                  </td>
                </tr>
              ) : apiContacts.length > 0 ? (
                apiContacts.map((c: any) => (
                  <tr
                    key={c.id}
                    className="hover:bg-cockpit-dark transition-colors cursor-pointer"
                    onClick={() => handleContactClick(c)}
                  >
                    <td className="px-4 lg:px-6 py-3">
                      <span className="text-cockpit-yellow font-medium hover:underline text-sm">
                        {c.prenom} {c.nom}
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-3 text-cockpit-secondary text-xs truncate max-w-[200px]">
                      {c.email}
                    </td>
                    <td className="px-4 lg:px-6 py-3 text-cockpit-secondary text-sm hidden lg:table-cell">
                      {c.telephone || "—"}
                    </td>
                    <td className="px-4 lg:px-6 py-3">
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                          c.lifecycleStage === "CLIENT"
                            ? "bg-cockpit-success/10 text-cockpit-success"
                            : c.lifecycleStage === "LEAD"
                            ? "bg-cockpit-warning/10 text-cockpit-warning"
                            : c.lifecycleStage === "INACTIF"
                            ? "bg-red-500/10 text-red-400"
                            : "bg-cockpit-info/10 text-cockpit-info"
                        }`}
                      >
                        {c.lifecycleStage || "PROSPECT"}
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-3 text-sm font-medium">
                      {(c._count?.demandesPrix || 0) +
                        (c._count?.leads || 0)}
                    </td>
                    <td
                      className="px-4 lg:px-6 py-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {renderSellsyCell(c)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-cockpit-secondary"
                  >
                    Aucun contact trouvé
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
              <span className="text-cockpit-secondary text-sm">
                Chargement...
              </span>
            </div>
          ) : apiContacts.length > 0 ? (
            apiContacts.map((c: any) => (
              <div
                key={c.id}
                className="p-4 hover:bg-cockpit-dark transition-colors cursor-pointer"
                onClick={() => handleContactClick(c)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-cockpit-yellow font-medium text-sm truncate">
                      {c.prenom} {c.nom}
                    </p>
                    <p className="text-cockpit-secondary text-xs truncate mt-0.5">
                      {c.email}
                    </p>
                    <div className="mt-2">{renderSellsyCell(c)}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        c.lifecycleStage === "CLIENT"
                          ? "bg-cockpit-success/10 text-cockpit-success"
                          : "bg-cockpit-info/10 text-cockpit-info"
                      }`}
                    >
                      {c.lifecycleStage || "PROSPECT"}
                    </span>
                  </div>
                </div>
              </div>
            ))
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
              ? `${(page - 1) * ITEMS_PER_PAGE + 1}-${Math.min(
                  page * ITEMS_PER_PAGE,
                  totalContacts
                )} sur ${totalContacts}`
              : "Aucun contact"}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-cockpit text-cockpit-primary hover:bg-cockpit-dark disabled:opacity-40"
            >
              Précédent
            </button>
            <span className="px-2 py-1 text-xs text-cockpit-secondary">
              {page}/{totalPages || 1}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-cockpit text-cockpit-primary hover:bg-cockpit-dark disabled:opacity-40"
            >
              Suivant
            </button>
          </div>
        </div>
      </div>

      {/* Drawer */}
      <ContactPreviewDrawer
        contact={selectedContact}
        isOpen={selectedContact !== null}
        onClose={handleCloseDrawer}
      />
    </div>
  );
}
