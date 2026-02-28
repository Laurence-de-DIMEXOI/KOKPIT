"use client";

import { KPICard } from "@/components/dashboard/kpi-card";
import { Mail, BarChart3, MousePointerClick, Users } from "lucide-react";

const mockCampaigns = [
  { id: "1", nom: "Newsletter Janvier 2025", objet: "Les dernières tendances de 2025", statut: "Envoyé", envoyes: 2340, tauxOuverture: 36.2, tauxClick: 10.0, dateEnvoi: "2025-02-24" },
  { id: "2", nom: "Promotion Hiver", objet: "-20% sur toute la collection hiver", statut: "Envoyé", envoyes: 1950, tauxOuverture: 37.0, tauxClick: 9.5, dateEnvoi: "2025-02-20" },
  { id: "3", nom: "Relance Panier", objet: "Vous avez oublié votre panier !", statut: "Programmé", envoyes: 0, tauxOuverture: 0.0, tauxClick: 0.0, dateEnvoi: "2025-02-28" },
];

export default function EmailingPage() {
  const stats = {
    totalSent: mockCampaigns.reduce((acc, c) => acc + c.envoyes, 0),
    avgOpenRate: 18.3,
    avgClickRate: 4.9,
    totalRecipients: mockCampaigns.reduce((acc, c) => acc + c.envoyes, 0),
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-cockpit-heading mb-1">Emailing</h1>
          <p className="text-cockpit-secondary text-sm">Gérez vos campagnes email</p>
        </div>
        <button className="bg-cockpit-yellow text-cockpit-bg px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold hover:opacity-90 text-sm sm:text-base w-full sm:w-auto">
          + Nouvelle campagne
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-8">
        <KPICard title="Emails envoyés" value={stats.totalSent} icon={<Mail className="w-7 h-7" />} bgColor="bg-cockpit-yellow" />
        <KPICard title="Taux ouverture" value={`${stats.avgOpenRate}%`} icon={<BarChart3 className="w-7 h-7" />} bgColor="bg-cockpit-info" change={{ value: 2.1, direction: "up" }} />
        <KPICard title="Taux de clic" value={`${stats.avgClickRate}%`} icon={<MousePointerClick className="w-7 h-7" />} bgColor="bg-cockpit-warning" change={{ value: 0.8, direction: "down" }} />
        <KPICard title="Destinataires" value={stats.totalRecipients} icon={<Users className="w-7 h-7" />} bgColor="bg-cockpit-success" change={{ value: 5, direction: "up" }} />
      </div>

      <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg overflow-hidden">
        {/* Vue tableau (md+) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-cockpit-dark border-b border-cockpit">
              <tr>
                <th className="px-4 lg:px-8 py-3 lg:py-4 text-left text-xs lg:text-sm font-semibold text-cockpit-heading">NOM</th>
                <th className="px-4 lg:px-8 py-3 lg:py-4 text-left text-xs lg:text-sm font-semibold text-cockpit-heading hidden lg:table-cell">OBJET</th>
                <th className="px-4 lg:px-8 py-3 lg:py-4 text-left text-xs lg:text-sm font-semibold text-cockpit-heading">ENVOYÉS</th>
                <th className="px-4 lg:px-8 py-3 lg:py-4 text-left text-xs lg:text-sm font-semibold text-cockpit-heading">OUVERTURE</th>
                <th className="px-4 lg:px-8 py-3 lg:py-4 text-left text-xs lg:text-sm font-semibold text-cockpit-heading hidden lg:table-cell">CLIC</th>
                <th className="px-4 lg:px-8 py-3 lg:py-4 text-left text-xs lg:text-sm font-semibold text-cockpit-heading">DATE</th>
                <th className="px-4 lg:px-8 py-3 lg:py-4 text-left text-xs lg:text-sm font-semibold text-cockpit-heading">STATUT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cockpit">
              {mockCampaigns.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-cockpit-dark transition-colors">
                  <td className="px-4 lg:px-8 py-3 lg:py-4 text-cockpit-primary font-medium text-sm">{campaign.nom}</td>
                  <td className="px-4 lg:px-8 py-3 lg:py-4 text-cockpit-secondary text-xs lg:text-sm hidden lg:table-cell truncate max-w-[200px]">{campaign.objet}</td>
                  <td className="px-4 lg:px-8 py-3 lg:py-4 text-cockpit-primary font-medium text-sm">{campaign.envoyes}</td>
                  <td className="px-4 lg:px-8 py-3 lg:py-4 text-cockpit-primary font-medium text-sm">{campaign.tauxOuverture}%</td>
                  <td className="px-4 lg:px-8 py-3 lg:py-4 text-cockpit-primary font-medium text-sm hidden lg:table-cell">{campaign.tauxClick}%</td>
                  <td className="px-4 lg:px-8 py-3 lg:py-4 text-cockpit-secondary text-xs lg:text-sm">{new Date(campaign.dateEnvoi).toLocaleDateString("fr-FR")}</td>
                  <td className="px-4 lg:px-8 py-3 lg:py-4">
                    <span className="inline-block px-2 lg:px-3 py-1 rounded-full text-xs font-semibold bg-cockpit-success/10 text-cockpit-success">{campaign.statut}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Vue cartes (mobile) */}
        <div className="md:hidden divide-y divide-cockpit">
          {mockCampaigns.map((campaign) => (
            <div key={campaign.id} className="p-4 hover:bg-cockpit-dark transition-colors">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-cockpit-primary text-sm truncate">{campaign.nom}</p>
                  <p className="text-cockpit-secondary text-xs truncate mt-0.5">{campaign.objet}</p>
                </div>
                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cockpit-success/10 text-cockpit-success flex-shrink-0">
                  {campaign.statut}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="text-cockpit-secondary">Envoyés</p>
                  <p className="text-cockpit-primary font-medium">{campaign.envoyes}</p>
                </div>
                <div>
                  <p className="text-cockpit-secondary">Ouverture</p>
                  <p className="text-cockpit-primary font-medium">{campaign.tauxOuverture}%</p>
                </div>
                <div>
                  <p className="text-cockpit-secondary">Clic</p>
                  <p className="text-cockpit-primary font-medium">{campaign.tauxClick}%</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
