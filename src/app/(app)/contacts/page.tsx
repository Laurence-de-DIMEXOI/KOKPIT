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
  AlertTriangle,
} from "lucide-react";
import { ContactPreviewDrawer } from "@/components/contacts/contact-preview-drawer";

const ITEMS_PER_PAGE = 25;

type ContactData = any;

interface SellsyLink {
  email: string;
  sellsyContactName?: string;
  devisCount: number;
  commandesCount: number;
  totalDevisHT: number;
  totalCommandesHT: number;
}

interface SellsyNameEntry {
  normalized: string;
  original: string;
  devisCount: number;
  commandesCount: number;
}

interface SellsyPhoneEntry {
  phone: string;
  name: string;
  email: string;
}

interface Suggestion {
  sellsyName: string;
  matchType: "nom" | "telephone" | "nom_partiel";
  devisCount: number;
  commandesCount: number;
}

// Normaliser un nom pour comparaison
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-.()]/g, "").replace(/^(\+262|0262|262)/, "0");
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

  // Sellsy links data
  const [sellsyLinks, setSellsyLinks] = useState<
    Record<string, SellsyLink>
  >({});
  const [sellsyNames, setSellsyNames] = useState<SellsyNameEntry[]>([]);
  const [sellsyPhones, setSellsyPhones] = useState<SellsyPhoneEntry[]>([]);
  const [sellsyLoading, setSellsyLoading] = useState(true);
  const [sellsyStats, setSellsyStats] = useState({
    totalEstimates: 0,
    totalOrders: 0,
    linkedByEmail: 0,
  });

  // Charger les contacts API (Supabase)
  const fetchContacts = useCallback(
    async (showRefresh = false) => {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const searchParam = search ? `&search=${encodeURIComponent(search)}` : "";
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

  // Charger les liens Sellsy (une seule fois)
  useEffect(() => {
    const fetchSellsyLinks = async () => {
      try {
        setSellsyLoading(true);
        const res = await fetch("/api/contacts/sellsy-links");
        const data = await res.json();
        if (data.success) {
          setSellsyLinks(data.links || {});
          setSellsyNames(data.sellsyNames || []);
          setSellsyPhones(data.sellsyPhones || []);
          setSellsyStats(
            data.stats || {
              totalEstimates: 0,
              totalOrders: 0,
              linkedByEmail: 0,
            }
          );
        }
      } catch (error) {
        console.error("Erreur Sellsy links:", error);
      } finally {
        setSellsyLoading(false);
      }
    };

    fetchSellsyLinks();
  }, []);

  // Calculer les suggestions pour un contact
  const getSuggestions = useCallback(
    (contact: ContactData): Suggestion[] => {
      const email = contact.email?.toLowerCase();
      // Si déjà lié par email, pas besoin de suggestion
      if (email && sellsyLinks[email]) return [];

      const suggestions: Suggestion[] = [];
      const contactNom = normalizeName(
        `${contact.prenom || ""} ${contact.nom || ""}`.trim()
      );
      const contactNomReverse = normalizeName(
        `${contact.nom || ""} ${contact.prenom || ""}`.trim()
      );
      const contactPhone = contact.telephone
        ? normalizePhone(contact.telephone)
        : "";

      // Match par nom exact
      for (const sn of sellsyNames) {
        if (sn.normalized === contactNom || sn.normalized === contactNomReverse) {
          suggestions.push({
            sellsyName: sn.original,
            matchType: "nom",
            devisCount: sn.devisCount,
            commandesCount: sn.commandesCount,
          });
        }
      }

      // Si pas de match exact, chercher match partiel (le nom de famille apparaît)
      if (suggestions.length === 0) {
        const nomFamille = normalizeName(contact.nom || "");
        if (nomFamille.length >= 3) {
          for (const sn of sellsyNames) {
            if (
              sn.normalized.includes(nomFamille) ||
              nomFamille.includes(sn.normalized)
            ) {
              suggestions.push({
                sellsyName: sn.original,
                matchType: "nom_partiel",
                devisCount: sn.devisCount,
                commandesCount: sn.commandesCount,
              });
            }
          }
        }
      }

      // Match par téléphone
      if (contactPhone && contactPhone.length >= 8) {
        for (const sp of sellsyPhones) {
          if (sp.phone === contactPhone) {
            // Vérifier que ce n'est pas déjà dans les suggestions
            const alreadySuggested = suggestions.some(
              (s) => normalizeName(s.sellsyName) === normalizeName(sp.name)
            );
            if (!alreadySuggested) {
              suggestions.push({
                sellsyName: sp.name,
                matchType: "telephone",
                devisCount: 0,
                commandesCount: 0,
              });
            }
          }
        }
      }

      return suggestions.slice(0, 2); // Max 2 suggestions
    },
    [sellsyLinks, sellsyNames, sellsyPhones]
  );

  const totalPages = Math.ceil(totalContacts / ITEMS_PER_PAGE);

  const handleContactClick = useCallback((contact: ContactData) => {
    setSelectedContact(contact);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setSelectedContact(null);
  }, []);

  // Debounce search
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Stats
  const stats = useMemo(
    () => ({
      total: totalContacts,
      prospect: apiContacts.filter(
        (c: any) => c.lifecycleStage === "PROSPECT"
      ).length,
      client: apiContacts.filter((c: any) => c.lifecycleStage === "CLIENT")
        .length,
      linkedSellsy: sellsyStats.linkedByEmail,
    }),
    [apiContacts, totalContacts, sellsyStats]
  );

  // Rendu du badge Sellsy pour un contact
  const renderSellsyBadge = (contact: ContactData) => {
    const email = contact.email?.toLowerCase();
    const link = email ? sellsyLinks[email] : null;
    const suggestions = getSuggestions(contact);

    if (sellsyLoading) {
      return (
        <span className="text-cockpit-secondary text-xs">...</span>
      );
    }

    if (link) {
      return (
        <div className="flex items-center gap-1.5">
          {link.devisCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cockpit-info/10 text-cockpit-info">
              <FileText className="w-3 h-3" />
              {link.devisCount} devis
            </span>
          )}
          {link.commandesCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cockpit-success/10 text-cockpit-success">
              <ShoppingCart className="w-3 h-3" />
              {link.commandesCount} cmd
            </span>
          )}
          {link.devisCount === 0 && link.commandesCount === 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cockpit-yellow/10 text-cockpit-yellow">
              <Link2 className="w-3 h-3" />
              Lié
            </span>
          )}
        </div>
      );
    }

    if (suggestions.length > 0) {
      const s = suggestions[0];
      return (
        <div className="group relative">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cockpit-warning/10 text-cockpit-warning cursor-help">
            <HelpCircle className="w-3 h-3" />
            Peut-être...
          </span>
          <div className="absolute z-50 bottom-full left-0 mb-2 w-64 p-3 bg-cockpit-card border border-cockpit rounded-lg shadow-cockpit-lg hidden group-hover:block">
            <p className="text-xs text-cockpit-heading font-semibold mb-1.5">
              Il s&apos;agit peut-être de :
            </p>
            {suggestions.map((sug, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-xs text-cockpit-primary mb-1"
              >
                <span className="text-cockpit-yellow font-medium">
                  {sug.sellsyName}
                </span>
                <span className="text-cockpit-secondary">
                  ({sug.matchType === "nom"
                    ? "même nom"
                    : sug.matchType === "telephone"
                    ? "même tél."
                    : "nom similaire"}
                  )
                </span>
              </div>
            ))}
            <p className="text-[10px] text-cockpit-secondary mt-2 border-t border-cockpit pt-2">
              Basé sur{" "}
              {suggestions[0].matchType === "telephone"
                ? "le numéro de téléphone"
                : "le nom du contact"}
            </p>
          </div>
        </div>
      );
    }

    return (
      <span className="text-cockpit-secondary text-[10px]">—</span>
    );
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
          <button className="bg-cockpit-yellow text-cockpit-bg px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold hover:opacity-90 text-sm sm:text-base w-full sm:w-auto">
            + Nouveau
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-8">
        <KPICard
          title="Total"
          value={stats.total}
          icon={<Users className="w-7 h-7" />}
          bgColor="bg-cockpit-yellow"
        />
        <KPICard
          title="Prospects"
          value={stats.prospect}
          icon={<Users className="w-7 h-7" />}
          bgColor="bg-cockpit-info"
        />
        <KPICard
          title="Clients"
          value={stats.client}
          icon={<Users className="w-7 h-7" />}
          bgColor="bg-cockpit-success"
        />
        <KPICard
          title="Liés Sellsy"
          value={stats.linkedSellsy}
          icon={<Link2 className="w-7 h-7" />}
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

      {/* Table desktop / Cards mobile */}
      <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg overflow-hidden">
        {/* Vue tableau (desktop md+) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-cockpit-dark border-b border-cockpit">
              <tr>
                <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs lg:text-sm font-semibold text-cockpit-heading">
                  NOM
                </th>
                <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs lg:text-sm font-semibold text-cockpit-heading">
                  EMAIL
                </th>
                <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs lg:text-sm font-semibold text-cockpit-heading hidden lg:table-cell">
                  TÉLÉPHONE
                </th>
                <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs lg:text-sm font-semibold text-cockpit-heading">
                  STAGE
                </th>
                <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs lg:text-sm font-semibold text-cockpit-heading">
                  DEMANDES
                </th>
                <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs lg:text-sm font-semibold text-cockpit-heading">
                  SELLSY
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cockpit">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 lg:px-6 py-12 text-center">
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
                    <td className="px-4 lg:px-6 py-3 lg:py-4">
                      <span className="text-cockpit-yellow font-medium hover:underline text-sm">
                        {c.prenom} {c.nom}
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-3 lg:py-4 text-cockpit-secondary text-xs lg:text-sm truncate max-w-[200px]">
                      {c.email}
                    </td>
                    <td className="px-4 lg:px-6 py-3 lg:py-4 text-cockpit-secondary text-sm hidden lg:table-cell">
                      {c.telephone || "—"}
                    </td>
                    <td className="px-4 lg:px-6 py-3 lg:py-4">
                      <span
                        className={`inline-block px-2 lg:px-3 py-1 rounded-full text-xs font-semibold ${
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
                    <td className="px-4 lg:px-6 py-3 lg:py-4 text-sm font-medium">
                      {(c._count?.demandesPrix || 0) +
                        (c._count?.leads || 0)}
                    </td>
                    <td
                      className="px-4 lg:px-6 py-3 lg:py-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {renderSellsyBadge(c)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 lg:px-6 py-12 text-center text-cockpit-secondary"
                  >
                    Aucun contact trouvé
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Vue cartes (mobile) */}
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
                className="p-4 hover:bg-cockpit-dark transition-colors cursor-pointer active:bg-cockpit-dark/80"
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
                    {c.telephone && (
                      <p className="text-cockpit-secondary text-xs mt-0.5">
                        {c.telephone}
                      </p>
                    )}
                    <div className="mt-2">{renderSellsyBadge(c)}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        c.lifecycleStage === "CLIENT"
                          ? "bg-cockpit-success/10 text-cockpit-success"
                          : c.lifecycleStage === "LEAD"
                          ? "bg-cockpit-warning/10 text-cockpit-warning"
                          : "bg-cockpit-info/10 text-cockpit-info"
                      }`}
                    >
                      {c.lifecycleStage || "PROSPECT"}
                    </span>
                    <span className="text-xs text-cockpit-secondary">
                      {(c._count?.demandesPrix || 0) +
                        (c._count?.leads || 0)}{" "}
                      demande
                      {(c._count?.demandesPrix || 0) +
                        (c._count?.leads || 0) >
                      1
                        ? "s"
                        : ""}
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
        <div className="flex flex-col sm:flex-row items-center justify-between px-4 lg:px-6 py-3 lg:py-4 border-t border-cockpit gap-3">
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
              className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium border border-cockpit text-cockpit-primary hover:bg-cockpit-dark disabled:opacity-40"
            >
              Précédent
            </button>
            <span className="px-2 py-1 text-xs sm:text-sm text-cockpit-secondary">
              {page}/{totalPages || 1}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium border border-cockpit text-cockpit-primary hover:bg-cockpit-dark disabled:opacity-40"
            >
              Suivant
            </button>
          </div>
        </div>
      </div>

      {/* Drawer d'aperçu du contact */}
      <ContactPreviewDrawer
        contact={selectedContact}
        isOpen={selectedContact !== null}
        onClose={handleCloseDrawer}
      />
    </div>
  );
}
