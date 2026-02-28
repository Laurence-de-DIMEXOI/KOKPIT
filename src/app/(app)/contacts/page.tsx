"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { KPICard } from "@/components/dashboard/kpi-card";
import { Users, Loader2 } from "lucide-react";
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
    // Normaliser les contacts statiques
    const staticNormalized = contactsData.map(c => ({
      ...c,
      _source: "static",
      prenom: "",
      showroomNom: c.showroom,
      lifecycleStage: c.stage,
      leadsCount: c.demandes,
    }));

    // Normaliser les contacts API
    const apiNormalized = apiContacts.map((c: any) => ({
      ...c,
      _source: "api",
      showroomNom: c.showroom?.nom || "—",
      lifecycleStage: c.lifecycleStage || "PROSPECT",
      leadsCount: c.leads?.length || 0,
    }));

    // Fusionner en évitant doublons (API a la priorité)
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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-cockpit-heading mb-2">Contacts</h1>
          <p className="text-cockpit-secondary">{allContacts.length} contacts</p>
        </div>
        <button className="bg-cockpit-yellow text-cockpit-bg px-6 py-3 rounded-lg font-semibold hover:opacity-90">+ Nouveau</button>
      </div>

      <div className="grid grid-cols-4 gap-8">
        <KPICard title="Total" value={stats.total} icon={<Users className="w-7 h-7" />} bgColor="bg-cockpit-yellow" />
        <KPICard title="Prospects" value={stats.prospect} icon={<Users className="w-7 h-7" />} bgColor="bg-cockpit-info" />
        <KPICard title="Clients" value={stats.client} icon={<Users className="w-7 h-7" />} bgColor="bg-cockpit-success" />
        <KPICard title="Négociation" value={stats.negociation} icon={<Users className="w-7 h-7" />} bgColor="bg-cockpit-warning" />
      </div>

      <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg p-8">
        <input
          type="text"
          placeholder="Rechercher par nom ou email..."
          value={search}
          onChange={(e) => {setSearch(e.target.value); setPage(1);}}
          className="w-full px-4 py-2 border border-cockpit-input rounded-input bg-cockpit-input text-cockpit-primary"
        />
      </div>

      <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-cockpit-dark border-b border-cockpit">
              <tr>
                <th className="px-8 py-4 text-left text-sm font-semibold text-cockpit-heading">NOM</th>
                <th className="px-8 py-4 text-left text-sm font-semibold text-cockpit-heading">EMAIL</th>
                <th className="px-8 py-4 text-left text-sm font-semibold text-cockpit-heading">TÉLÉPHONE</th>
                <th className="px-8 py-4 text-left text-sm font-semibold text-cockpit-heading">SHOWROOM</th>
                <th className="px-8 py-4 text-left text-sm font-semibold text-cockpit-heading">STAGE</th>
                <th className="px-8 py-4 text-left text-sm font-semibold text-cockpit-heading">DEMANDES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cockpit">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-8 py-12 text-center">
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
                    <td className="px-8 py-4">
                      <span className="text-cockpit-yellow font-medium hover:underline">
                        {c._source === "api" ? `${c.prenom} ${c.nom}` : c.nom}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-cockpit-secondary text-sm">{c.email}</td>
                    <td className="px-8 py-4 text-cockpit-secondary text-sm">{c.telephone || "—"}</td>
                    <td className="px-8 py-4 text-cockpit-secondary text-sm">{c.showroomNom || "—"}</td>
                    <td className="px-8 py-4">
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-cockpit-info/10 text-cockpit-info">
                        {c.lifecycleStage || "PROSPECT"}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-sm font-medium">{c.leadsCount || 0}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-8 py-12 text-center text-cockpit-secondary">
                    Aucun contact trouvé
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-8 py-4 border-t border-cockpit">
          <p className="text-sm text-cockpit-secondary">
            {paged.length > 0
              ? `${(page - 1) * ITEMS_PER_PAGE + 1}-${Math.min(page * ITEMS_PER_PAGE, filtered.length)} sur ${filtered.length} contacts`
              : "Aucun contact"}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-lg text-sm font-medium border border-cockpit text-cockpit-primary hover:bg-cockpit-dark disabled:opacity-40"
            >
              Précédent
            </button>
            <span className="px-4 py-2 text-sm text-cockpit-secondary">Page {page} / {totalPages}</span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-lg text-sm font-medium border border-cockpit text-cockpit-primary hover:bg-cockpit-dark disabled:opacity-40"
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
