"use client";

import { useState, useEffect, useCallback } from "react";
import { Calendar, CheckCircle, XCircle, BarChart3, Search, FileText, ShoppingBag, BookOpen, Mail } from "lucide-react";

interface RdvContact {
  id: string;
  nom: string;
  prenom: string;
  email: string;
}

interface Rdv {
  id: string;
  contactId: string;
  contact: RdvContact;
  dateDebut: string;
  dateFin: string;
  statut: string;
  source: string;
  productSlug: string | null;
  notes: string | null;
  createdAt: string;
}

interface Stats {
  aVenir: number;
  honoresMois: number;
  annulesMois: number;
  tauxRdvVente: number;
}

const SOURCE_CONFIG: Record<string, { icon: typeof Calendar; label: string; color: string }> = {
  calendly_contact: { icon: Mail, label: "Page contact", color: "bg-blue-100 text-blue-700" },
  calendly_fiche_produit: { icon: FileText, label: "Fiche produit", color: "bg-purple-100 text-purple-700" },
  calendly_vente_privee: { icon: ShoppingBag, label: "Vente privée", color: "bg-amber-100 text-amber-700" },
  calendly_guide_sdb: { icon: BookOpen, label: "Guide SDB", color: "bg-teal-100 text-teal-700" },
  calendly: { icon: Calendar, label: "Calendly", color: "bg-gray-100 text-gray-700" },
};

const STATUT_CONFIG: Record<string, { label: string; color: string }> = {
  CONFIRME: { label: "Confirmé", color: "bg-green-100 text-green-700" },
  HONORE: { label: "Honoré", color: "bg-blue-100 text-blue-700" },
  ANNULE: { label: "Annulé", color: "bg-red-100 text-red-700" },
};

export default function RendezVousPage() {
  const [rdvs, setRdvs] = useState<Rdv[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filtreStatut, setFiltreStatut] = useState("");
  const [filtrePeriode, setFiltrePeriode] = useState("mois");
  const [search, setSearch] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filtreStatut) params.set("statut", filtreStatut);
    if (filtrePeriode && filtrePeriode !== "tout") params.set("periode", filtrePeriode);
    if (search) params.set("search", search);

    const [rdvRes, statsRes] = await Promise.all([
      fetch(`/api/commercial/rendez-vous?${params}`),
      fetch("/api/commercial/rendez-vous/stats"),
    ]);

    if (rdvRes.ok) {
      const data = await rdvRes.json();
      setRdvs(data.rdvs || []);
    }
    if (statsRes.ok) {
      const data = await statsRes.json();
      setStats(data);
    }
    setLoading(false);
  }, [filtreStatut, filtrePeriode, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function changeStatut(id: string, statut: string) {
    const res = await fetch(`/api/commercial/rendez-vous/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut }),
    });
    if (res.ok) fetchData();
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Rendez-vous</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "À venir",
            value: stats?.aVenir ?? "—",
            icon: Calendar,
            gradient: "from-[#0E6973] to-[#FEEB9C]",
          },
          {
            label: "Honorés ce mois",
            value: stats?.honoresMois ?? "—",
            icon: CheckCircle,
            gradient: "from-[#0E6973] to-[#FEEB9C]",
          },
          {
            label: "Annulés ce mois",
            value: stats?.annulesMois ?? "—",
            icon: XCircle,
            gradient: "from-[#0E6973] to-[#FEEB9C]",
          },
          {
            label: "Taux RDV→Vente",
            value: stats ? `${stats.tauxRdvVente}%` : "—",
            icon: BarChart3,
            gradient: "from-[#0E6973] to-[#FEEB9C]",
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className={`bg-gradient-to-br ${kpi.gradient} rounded-xl p-5 text-white shadow-cockpit-lg card-hover`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium opacity-90">{kpi.label}</span>
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <kpi.icon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-bold">
              {loading ? (
                <span className="inline-block w-12 h-8 bg-white/20 rounded animate-pulse" />
              ) : (
                kpi.value
              )}
            </p>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-cockpit-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0E6973]/30"
          />
        </div>
        <select
          value={filtreStatut}
          onChange={(e) => setFiltreStatut(e.target.value)}
          className="px-4 py-2 border border-cockpit-input rounded-lg text-sm bg-white"
        >
          <option value="">Tous les statuts</option>
          <option value="CONFIRME">Confirmés</option>
          <option value="HONORE">Honorés</option>
          <option value="ANNULE">Annulés</option>
        </select>
        <select
          value={filtrePeriode}
          onChange={(e) => setFiltrePeriode(e.target.value)}
          className="px-4 py-2 border border-cockpit-input rounded-lg text-sm bg-white"
        >
          <option value="semaine">Cette semaine</option>
          <option value="mois">Ce mois</option>
          <option value="mois_dernier">Mois dernier</option>
          <option value="tout">Tout</option>
        </select>
      </div>

      {/* Tableau */}
      <div className="bg-cockpit-card rounded-xl border border-cockpit shadow-cockpit-lg overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-cockpit-dark rounded animate-pulse" />
            ))}
          </div>
        ) : rdvs.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Aucun rendez-vous trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cockpit bg-cockpit-dark/50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Date / Heure</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Client</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Source</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Produit</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Statut</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rdvs.map((rdv) => {
                  const srcConfig = SOURCE_CONFIG[rdv.source] || SOURCE_CONFIG.calendly;
                  const statConfig = STATUT_CONFIG[rdv.statut] || STATUT_CONFIG.CONFIRME;
                  const SrcIcon = srcConfig.icon;

                  return (
                    <tr key={rdv.id} className="border-b border-cockpit hover:bg-cockpit-dark/30 transition-colors">
                      <td className="px-4 py-3 font-medium">{formatDate(rdv.dateDebut)}</td>
                      <td className="px-4 py-3">
                        <a
                          href={`/contacts/${rdv.contact.id}`}
                          className="text-[var(--color-active)] hover:underline font-medium"
                        >
                          {rdv.contact.prenom} {rdv.contact.nom}
                        </a>
                        <p className="text-xs text-gray-400">{rdv.contact.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${srcConfig.color}`}>
                          <SrcIcon className="w-3 h-3" />
                          {srcConfig.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {rdv.productSlug || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${statConfig.color}`}>
                          {statConfig.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {rdv.statut === "CONFIRME" && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => changeStatut(rdv.id, "HONORE")}
                              className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                            >
                              Honoré
                            </button>
                            <button
                              onClick={() => changeStatut(rdv.id, "ANNULE")}
                              className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                            >
                              Annulé
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
