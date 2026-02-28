"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { KPICard } from "@/components/dashboard/kpi-card";
import { Users, Loader2, Search } from "lucide-react";
import { contactsData } from "@/data/contacts";
import { ContactPreviewDrawer } from "@/components/contacts/contact-preview-drawer";

const ITEMS_PER_PAGE = 25;

// Utiliser le type any pour éviter les conflits d'interfaces
type ContactData = any;

export default function ContactsPage() {
  const [apiContacts, setApiContacts] = useState<ContactData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedContact, setSelectedContact] = useState<ContactData | null>(null);

  // Charger les contacts API (nouveaux contacts depuis Supabase)
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/contacts?page=1&limit=500`);
        const result = await response.json();
        setApiContacts(result.contacts || []);
      } catch (error) {
        console.error("Erreur lors du chargement des contacts API:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
  }, []);

  // Fusionner contacts statiques + API (éviter doublons par email)
  const allContacts = useMemo(() => {
    const staticNormalized = contactsData.map(c => ({
      ...c,
      _source: "static",
      prenom: "",
      showroomNom: c.showroom,
      lifecycleStage: c.stage,
      leadsCount: c.demandes,
    }));

    const apiNormalized = apiContacts.map((c: any) => ({
      ...c,
      _source: "api",
      showroomNom: c.showroom?.nom || "—",
      lifecycleStage: c.lifecycleStage || "PROSPECT",
      leadsCount: c.leads?.length || 0,
    }));

    const apiEmails = new Set(apiNormalized.map((c: any) => c.email?.toLowerCase()));
    const merged = [
      ...apiNormalized,
      ...staticNormalized.filter(c => !apiEmails.has(c.email?.toLowerCase())),
    ];

    return merged;
  }, [apiContacts]);

  // Filtrer par recherche
  const filtered = useMemo(() =>
    allContacts.filter(c =>
      search === "" ||
      c.nom?.toLowerCase().includes(search.toLowerCase()) ||
      c.prenom?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase())
    ), [search, allContacts]
  );

  // Pagination
  const paged = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

  const handleContactClick = useCallback((contact: ContactData) => {
    setSelectedContact(contact);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setSelectedContact(null);
  }, []);

  const stats = {
    total: filtered.length,
    prospect: allContacts.filter(c => c.lifecycleStage === "PROSPECT").length,
    client: allContacts.filter(c => c.lifecycleStage === "CLIENT").length,
    negociation: allContacts.filter(c => c.lifecycleStage === "NEGOCIATION").length,
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-cockpit-heading mb-1">Contacts</h1>
          <p className="text-cockpit-secondary text-sm">{allContacts.length} contacts</p>
        </div>
        <button className="bg-cockpit-yellow text-cockpit-bg px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold hover:opacity-90 text-sm sm:text-base w-full sm:w-auto">
          + Nouveau
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-8">
        <KPICard title="Total" value={stats.total} icon={<Users className="w-7 h-7" />} bgColor="bg-cockpit-yellow" />
        <KPICard title="Prospects" value={stats.prospect} icon={<Users className="w-7 h-7" />} bgColor="bg-cockpit-info" />
        <KPICard title="Clients" value={stats.client} icon={<Users className="w-7 h-7" />} bgColor="bg-cockpit-success" />
        <KPICard title="Négociation" value={stats.negociation} icon={<Users className="w-7 h-7" />} bgColor="bg-cockpit-warning" />
      </div>

      {/* Search */}
      <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg p-3 sm:p-4 lg:p-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cockpit-secondary" />
          <input
            type="text"
            placeholder="Rechercher par nom ou email..."
            value={search}
            onChange={(e) => {setSearch(e.target.value); setPage(1);}}
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
                <th className="px-4 lg:px-8 py-3 lg:py-4 text-left text-xs lg:text-sm font-semibold text-cockpit-heading">NOM</th>
                <th className="px-4 lg:px-8 py-3 lg:py-4 text-left text-xs lg:text-sm font-semibold text-cockpit-heading">EMAIL</th>
                <th className="px-4 lg:px-8 py-3 lg:py-4 text-left text-xs lg:text-sm font-semibold text-cockpit-heading hidden lg:table-cell">TÉLÉPHONE</th>
                <th className="px-4 lg:px-8 py-3 lg:py-4 text-left text-xs lg:text-sm font-semibold text-cockpit-heading hidden xl:table-cell">SHOWROOM</th>
                <th className="px-4 lg:px-8 py-3 lg:py-4 text-left text-xs lg:text-sm font-semibold text-cockpit-heading">STAGE</th>
                <th className="px-4 lg:px-8 py-3 lg:py-4 text-left text-xs lg:text-sm font-semibold text-cockpit-heading">DEMANDES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cockpit">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 lg:px-8 py-12 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Chargement...
                    </div>
                  </td>
                </tr>
              ) : paged.length > 0 ? (
                paged.map(c => (
                  <tr
                    key={c.id}
                    className="hover:bg-cockpit-dark transition-colors cursor-pointer"
                    onClick={() => handleContactClick(c)}
                  >
                    <td className="px-4 lg:px-8 py-3 lg:py-4">
                      <span className="text-cockpit-yellow font-medium hover:underline text-sm">
                        {c._source === "api" ? `${c.prenom} ${c.nom}` : c.nom}
                      </span>
                    </td>
                    <td className="px-4 lg:px-8 py-3 lg:py-4 text-cockpit-secondary text-xs lg:text-sm truncate max-w-[200px]">{c.email}</td>
                    <td className="px-4 lg:px-8 py-3 lg:py-4 text-cockpit-secondary text-sm hidden lg:table-cell">{c.telephone || "—"}</td>
                    <td className="px-4 lg:px-8 py-3 lg:py-4 text-cockpit-secondary text-sm hidden xl:table-cell">{c.showroomNom || "—"}</td>
                    <td className="px-4 lg:px-8 py-3 lg:py-4">
                      <span className="inline-block px-2 lg:px-3 py-1 rounded-full text-xs font-semibold bg-cockpit-info/10 text-cockpit-info">
                        {c.lifecycleStage || "PROSPECT"}
                      </span>
                    </td>
                    <td className="px-4 lg:px-8 py-3 lg:py-4 text-sm font-medium">{c.leadsCount || 0}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 lg:px-8 py-12 text-center text-cockpit-secondary">
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
              <span className="text-cockpit-secondary text-sm">Chargement...</span>
            </div>
          ) : paged.length > 0 ? (
            paged.map(c => (
              <div
                key={c.id}
                className="p-4 hover:bg-cockpit-dark transition-colors cursor-pointer active:bg-cockpit-dark/80"
                onClick={() => handleContactClick(c)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-cockpit-yellow font-medium text-sm truncate">
                      {c._source === "api" ? `${c.prenom} ${c.nom}` : c.nom}
                    </p>
                    <p className="text-cockpit-secondary text-xs truncate mt-0.5">{c.email}</p>
                    {c.telephone && (
                      <p className="text-cockpit-secondary text-xs mt-0.5">{c.telephone}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cockpit-info/10 text-cockpit-info">
                      {c.lifecycleStage || "PROSPECT"}
                    </span>
                    {(c.leadsCount || 0) > 0 && (
                      <span className="text-xs text-cockpit-secondary">{c.leadsCount} demande{c.leadsCount > 1 ? "s" : ""}</span>
                    )}
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
        <div className="flex flex-col sm:flex-row items-center justify-between px-4 lg:px-8 py-3 lg:py-4 border-t border-cockpit gap-3">
          <p className="text-xs sm:text-sm text-cockpit-secondary">
            {paged.length > 0
              ? `${(page - 1) * ITEMS_PER_PAGE + 1}-${Math.min(page * ITEMS_PER_PAGE, filtered.length)} sur ${filtered.length}`
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
            <span className="px-2 py-1 text-xs sm:text-sm text-cockpit-secondary">{page}/{totalPages}</span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
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
