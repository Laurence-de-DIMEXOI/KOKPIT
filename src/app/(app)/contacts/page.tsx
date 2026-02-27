"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { KPICard } from "@/components/dashboard/kpi-card";
import { Users } from "lucide-react";
import { contactsData } from "@/data/contacts";

const ITEMS_PER_PAGE = 25;

export default function ContactsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() =>
    contactsData.filter(c =>
      search === "" || c.nom.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
    ), [search]
  );

  const paged = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-cockpit-heading mb-2">Contacts</h1>
          <p className="text-cockpit-secondary">{contactsData.length} contacts importés</p>
        </div>
        <button className="bg-cockpit-yellow text-cockpit-bg px-6 py-3 rounded-lg font-semibold hover:opacity-90">+ Nouveau</button>
      </div>

      <div className="grid grid-cols-4 gap-8">
        <KPICard title="Total" value={contactsData.length} icon={<Users className="w-7 h-7" />} bgColor="bg-cockpit-yellow" />
        <KPICard title="Prospects" value={contactsData.filter(c => c.stage === "PROSPECT").length} icon={<Users className="w-7 h-7" />} bgColor="bg-cockpit-info" />
        <KPICard title="Clients" value={contactsData.filter(c => c.stage === "CLIENT").length} icon={<Users className="w-7 h-7" />} bgColor="bg-cockpit-success" />
        <KPICard title="Négociation" value={contactsData.filter(c => c.stage === "NEGOCIATION").length} icon={<Users className="w-7 h-7" />} bgColor="bg-cockpit-warning" />
      </div>

      <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg p-8">
        <input type="text" placeholder="Rechercher par nom ou email..." value={search} onChange={(e) => {setSearch(e.target.value); setPage(1);}} className="w-full px-4 py-2 border border-cockpit-input rounded-input bg-cockpit-input text-cockpit-primary" />
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
              {paged.map(c => (
                <tr key={c.id} className="hover:bg-cockpit-dark transition-colors">
                  <td className="px-8 py-4">
                    <Link href={`/contacts/${c.id}`} className="text-cockpit-yellow font-medium hover:underline">
                      {c.nom}
                    </Link>
                  </td>
                  <td className="px-8 py-4 text-cockpit-secondary text-sm">{c.email}</td>
                  <td className="px-8 py-4 text-cockpit-secondary text-sm">{c.telephone}</td>
                  <td className="px-8 py-4 text-cockpit-secondary text-sm">{c.showroom}</td>
                  <td className="px-8 py-4"><span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-cockpit-info/10 text-cockpit-info">{c.stage}</span></td>
                  <td className="px-8 py-4 text-sm font-medium">{c.demandes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-8 py-4 border-t border-cockpit">
          <p className="text-sm text-cockpit-secondary">{(page - 1) * ITEMS_PER_PAGE + 1}-{Math.min(page * ITEMS_PER_PAGE, filtered.length)} sur {filtered.length} contacts</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-4 py-2 rounded-lg text-sm font-medium border border-cockpit text-cockpit-primary hover:bg-cockpit-dark disabled:opacity-40">Précédent</button>
            <span className="px-4 py-2 text-sm text-cockpit-secondary">Page {page} / {totalPages}</span>
            <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="px-4 py-2 rounded-lg text-sm font-medium border border-cockpit text-cockpit-primary hover:bg-cockpit-dark disabled:opacity-40">Suivant</button>
          </div>
        </div>
      </div>
    </div>
  );
}
