"use client";

import { KPICard } from "@/components/dashboard/kpi-card";
import { Zap, Activity, CheckCircle, AlertCircle } from "lucide-react";

const mockWorkflows = [
  { id: "1", nom: "Bienvenue nouveaux leads", description: "Envoyer un email de bienvenue aux nouveaux leads", statut: "ACTIF", executions: 245, dateCreation: "2025-01-15", actions: 2 },
  { id: "2", nom: "Relance devis non répondus", description: "Relancer les devis sans réponse après 3 jours", statut: "ACTIF", executions: 128, dateCreation: "2025-02-01", actions: 3 },
  { id: "3", nom: "Post-vente cross-sell", description: "Proposer des produits complémentaires après vente", statut: "ACTIF", executions: 89, dateCreation: "2025-01-20", actions: 2 },
];

export default function AutomatisationsPage() {
  const stats = {
    total: mockWorkflows.length,
    actifs: mockWorkflows.filter((w) => w.statut === "ACTIF").length,
    successRate: 95,
    totalActions: mockWorkflows.reduce((acc, w) => acc + w.actions, 0),
  };

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case "ACTIF":
        return "bg-cockpit-success/10 text-cockpit-success";
      case "INACTIF":
        return "bg-cockpit-secondary/10 text-cockpit-secondary";
      case "ERREUR":
        return "bg-cockpit-danger/10 text-cockpit-danger";
      default:
        return "bg-cockpit-warning/10 text-cockpit-warning";
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-cockpit-heading mb-2">Automatisations</h1>
          <p className="text-cockpit-secondary">Gérez vos workflows et automatisations</p>
        </div>
        <button className="bg-cockpit-yellow text-cockpit-bg px-6 py-3 rounded-lg font-semibold hover:opacity-90">+ Nouveau workflow</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <KPICard title="Total workflows" value={stats.total} icon={<Zap className="w-7 h-7" />} bgColor="bg-cockpit-yellow" />
        <KPICard title="Actifs" value={stats.actifs} icon={<CheckCircle className="w-7 h-7" />} bgColor="bg-cockpit-success" change={{ value: 2, direction: "up" }} />
        <KPICard title="Taux de réussite" value={`${stats.successRate}%`} icon={<Activity className="w-7 h-7" />} bgColor="bg-cockpit-info" change={{ value: 5, direction: "up" }} />
        <KPICard title="Actions totales" value={stats.totalActions} icon={<AlertCircle className="w-7 h-7" />} bgColor="bg-cockpit-warning" change={{ value: 3, direction: "up" }} />
      </div>

      <div className="space-y-4">
        {mockWorkflows.map((workflow) => (
          <div key={workflow.id} className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg p-8 hover:shadow-cockpit-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-cockpit-heading mb-2">{workflow.nom}</h3>
                <p className="text-cockpit-secondary text-sm mb-4">{workflow.description}</p>
                <div className="flex items-center gap-6 text-sm">
                  <span className="text-cockpit-secondary"><span className="font-semibold text-cockpit-primary">{workflow.actions}</span> actions</span>
                  <span className="text-cockpit-secondary">Créé le {new Date(workflow.dateCreation).toLocaleDateString("fr-FR")}</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(workflow.statut)}`}>
                  <CheckCircle className="w-4 h-4" />
                  {workflow.statut}
                </span>
                <button className="p-2 hover:bg-cockpit-dark rounded-lg transition-colors">⋮</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
