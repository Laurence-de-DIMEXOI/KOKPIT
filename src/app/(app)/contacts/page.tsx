"use client";

import { useState, useEffect, useCallback } from "react";
import { KPICard } from "@/components/dashboard/kpi-card";
import { Users, Loader2 } from "lucide-react";
import { ContactPreviewDrawer } from "@/components/contacts/contact-preview-drawer";

const ITEMS_PER_PAGE = 25;

// Utiliser le type any pour éviter les conflits d'interfaces
type ContactData = any;

export default function ContactsPage() {
  const [contacts, setContacts] = useState<ContactData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedContact, setSelectedContact] = useState<ContactData | null>(null);
  const [totalContacts, setTotalContacts] = useState(0);

  // Charger les contacts
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        setLoading(true);
        const query = new URLSearchParams({
          page: page.toString(),
          limit: ITEMS_PER_PAGE.toString(),
          ...(search && { search }),
        });
        const response = await fetch(`/api/contacts?${query}`);
        const result = await response.json();

        setContacts(result.contacts || []);
        setTotalContacts(result.pagination?.total || 0);
      } catch (error) {
        console.error("Erreur lors du chargement des contacts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
  }, [page, search]);

  const totalPages = Math.ceil(totalContacts / ITEMS_PER_PAGE);

  const handleContactClick = useCallback((contact: ContactData) => {
    setSelectedContact(contact);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setSelectedContact(null);
  }, []);

  const stats = {
    total: totalContacts,
    prospect: contacts.filter(c => c.lifecycleStage === "PROSPECT").length,
    client: contacts.filter(c => c.lifecycleStage === "CLIENT").length,
    inactif: contacts.filter(c => c.lifecycleStage === "INACTIF").length,
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-cockpit-heading mb-2">Contacts</h1>
          <p className="text-cockpit-secondary">{totalContacts} contacts</p>
        </div>
        <button className="bg-cockpit-yellow text-cockpit-bg px-6 py-3 rounded-lg font-semibold hover:opacity-90">+ Nouveau</button>
      </div>

      <div className="grid grid-cols-4 gap-8">
        <KPICard title="Total" value={stats.total} icon={<Users className="w-7 h-7" />} bgColor="bg-cockpit-yellow" />
        <KPICard title="Prospects" value={stats.prospect} icon={<Users className="w-7 h-7" />} bgColor="bg-cockpit-info" />
        <KPICard title="Clients" value={stats.client} icon={<Users className="w-7 h-7" />} bgColor="bg-cockpit-success" />
        <KPICard title="Inactifs" value={stats.inactif} icon={<Users className="w-7 h-7" />} bgColor="bg-cockpit-warning" />
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
                <th className="px-8 py-4 text-left text-sm font-semibold text-cockpit-heading">HISTORIQUE</th>
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
              ) : contacts.length > 0 ? (
                contacts.map(c => (
                  <tr
                    key={c.id}
                    className="hover:bg-cockpit-dark transition-colors cursor-pointer"
                    onClick={() => handleContactClick(c)}
                  >
                    <td className="px-8 py-4">
                      <span className="text-cockpit-yellow font-medium hover:underline">
                        {c.prenom} {c.nom}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-cockpit-secondary text-sm">{c.email}</td>
                    <td className="px-8 py-4 text-cockpit-secondary text-sm">{c.telephone || "—"}</td>
                    <td className="px-8 py-4 text-cockpit-secondary text-sm">{c.showroom?.nom || "—"}</td>
                    <td className="px-8 py-4">
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-cockpit-info/10 text-cockpit-info">
                        {c.lifecycleStage || "PROSPECT"}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-sm font-medium">
                      {c.leads && c.leads.length > 0 ? (
                        <span className="text-cockpit-success">{c.leads.length} demande(s)</span>
                      ) : (
                        <span className="text-cockpit-secondary">—</span>
                      )}
                    </td>
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
            {contacts.length > 0
              ? `${(page - 1) * ITEMS_PER_PAGE + 1}-${Math.min(page * ITEMS_PER_PAGE, totalContacts)} sur ${totalContacts} contacts`
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
