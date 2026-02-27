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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-cockpit-heading mb-2">Emailing</h1>
          <p className="text-cockpit-secondary">Gérez vos campagnes email</p>
        </div>
        <button className="bg-cockpit-yellow text-cockpit-bg px-6 py-3 rounded-lg font-semibold hover:opacity-90">+ Nouvelle campagne</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <KPICard title="Emails envoyés" value={stats.totalSent} icon={<Mail className="w-7 h-7" />} bgColor="bg-cockpit-yellow" />
        <KPICard title="Taux d'ouverture moyen" value={`${stats.avgOpenRate}%`} icon={<BarChart3 className="w-7 h-7" />} bgColor="bg-cockpit-info" change={{ value: 2.1, direction: "up" }} />
        <KPICard title="Taux de clic moyen" value={`${stats.avgClickRate}%`} icon={<MousePointerClick className="w-7 h-7" />} bgColor="bg-cockpit-warning" change={{ value: 0.8, direction: "down" }} />
        <KPICard title="Total destinataires" value={stats.totalRecipients} icon={<Users className="w-7 h-7" />} bgColor="bg-cockpit-success" change={{ value: 5, direction: "up" }} />
      </div>

      <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-cockpit-dark border-b border-cockpit">
            <tr>
              <th className="px-8 py-4 text-left text-sm font-semibold text-cockpit-heading">NOM</th>
              <th className="px-8 py-4 text-left text-sm font-semibold text-cockpit-heading">OBJET</th>
              <th className="px-8 py-4 text-left text-sm font-semibold text-cockpit-heading">ENVOYES</th>
              <th className="px-8 py-4 text-left text-sm font-semibold text-cockpit-heading">TAUX D'OUVERTURE</th>
              <th className="px-8 py-4 text-left text-sm font-semibold text-cockpit-heading">TAUX DE CLIC</th>
              <th className="px-8 py-4 text-left text-sm font-semibold text-cockpit-heading">DATE</th>
              <th className="px-8 py-4 text-left text-sm font-semibold text-cockpit-heading">STATUT</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cockpit">
            {mockCampaigns.map((campaign) => (
              <tr key={campaign.id} className="hover:bg-cockpit-dark transition-colors">
                <td className="px-8 py-4 text-cockpit-primary font-medium">{campaign.nom}</td>
                <td className="px-8 py-4 text-cockpit-secondary text-sm">{campaign.objet}</td>
                <td className="px-8 py-4 text-cockpit-primary font-medium">{campaign.envoyes}</td>
                <td className="px-8 py-4 text-cockpit-primary font-medium">{campaign.tauxOuverture}%</td>
                <td className="px-8 py-4 text-cockpit-primary font-medium">{campaign.tauxClick}%</td>
                <td className="px-8 py-4 text-cockpit-secondary text-sm">{new Date(campaign.dateEnvoi).toLocaleDateString("fr-FR")}</td>
                <td className="px-8 py-4"><span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-cockpit-success/10 text-cockpit-success">{campaign.statut}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
