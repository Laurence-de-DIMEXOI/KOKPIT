"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { KPICard } from "@/components/dashboard/kpi-card";
import { Inbox, TrendingUp, Clock, AlertCircle } from "lucide-react";

interface Lead {
  id: string;
  nom: string;
  source: string;
  statut: string;
  dateCreation: string;
  devis?: boolean;
}

export default function LeadsPage() {
  const { data: session } = useSession();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    nouveau: 0,
    encours: 0,
    devis: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/leads");
        const result = await response.json();
        
        // Gérer la réponse - peut être un array ou un objet avec data
        const leadsArray = Array.isArray(result) ? result : result.data || [];
        
        setLeads(leadsArray);
        setStats({
          total: leadsArray.length,
          nouveau: leadsArray.filter((l: Lead) => l.statut === "NOUVEAU").length,
          encours: leadsArray.filter((l: Lead) => l.statut === "EN_COURS").length,
          devis: leadsArray.filter((l: Lead) => l.devis).length,
        });
      } catch (error) {
        console.error("Erreur:", error);
        setLeads([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-cockpit-heading mb-2">
            Demandes
          </h1>
          <p className="text-cockpit-secondary">
            Gérez toutes vos demandes clients
          </p>
        </div>
        <button className="bg-cockpit-yellow text-cockpit-bg px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity">
          + Nouvelle demande
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <KPICard
          title="Total"
          value={stats.total}
          icon={<Inbox className="w-7 h-7" />}
          bgColor="bg-cockpit-yellow"
        />
        <KPICard
          title="Nouveau"
          value={stats.nouveau}
          change={{ value: 12, direction: "up" }}
          icon={<TrendingUp className="w-7 h-7" />}
          bgColor="bg-cockpit-info"
        />
        <KPICard
          title="En cours"
          value={stats.encours}
          change={{ value: 5, direction: "down" }}
          icon={<Clock className="w-7 h-7" />}
          bgColor="bg-cockpit-warning"
        />
        <KPICard
          title="Devis"
          value={stats.devis}
          change={{ value: 8, direction: "up" }}
          icon={<AlertCircle className="w-7 h-7" />}
          bgColor="bg-cockpit-success"
        />
      </div>

      {/* Filters */}
      <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg p-8">
        <h3 className="text-lg font-bold text-cockpit-heading mb-6">Filtres</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <input
            type="text"
            placeholder="Rechercher..."
            className="px-4 py-2 border border-cockpit-input rounded-input bg-cockpit-input text-cockpit-primary"
          />
          <select className="px-4 py-2 border border-cockpit-input rounded-input bg-cockpit-input text-cockpit-primary">
            <option>Statut</option>
            <option>Nouveau</option>
            <option>En cours</option>
            <option>Devis envoyé</option>
          </select>
          <select className="px-4 py-2 border border-cockpit-input rounded-input bg-cockpit-input text-cockpit-primary">
            <option>Source</option>
            <option>Site web</option>
            <option>Salon</option>
            <option>Email</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-cockpit-dark border-b border-cockpit">
              <tr>
                <th className="px-8 py-4 text-left text-sm font-semibold text-cockpit-heading">
                  CONTACT
                </th>
                <th className="px-8 py-4 text-left text-sm font-semibold text-cockpit-heading">
                  SOURCE
                </th>
                <th className="px-8 py-4 text-left text-sm font-semibold text-cockpit-heading">
                  STATUT
                </th>
                <th className="px-8 py-4 text-left text-sm font-semibold text-cockpit-heading">
                  DATE
                </th>
                <th className="px-8 py-4 text-left text-sm font-semibold text-cockpit-heading">
                  SLA
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cockpit">
              {leads.length > 0 ? (
                leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-cockpit-dark transition-colors">
                    <td className="px-8 py-4 text-cockpit-primary font-medium">
                      {lead.nom}
                    </td>
                    <td className="px-8 py-4 text-cockpit-secondary text-sm">
                      {lead.source}
                    </td>
                    <td className="px-8 py-4">
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-cockpit-success/10 text-cockpit-success">
                        {lead.statut}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-cockpit-secondary text-sm">
                      {new Date(lead.dateCreation).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-8 py-4 text-sm font-medium text-cockpit-primary">
                      72h
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-8 py-8 text-center text-cockpit-secondary">
                    {loading ? "Chargement..." : "Aucune demande"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
