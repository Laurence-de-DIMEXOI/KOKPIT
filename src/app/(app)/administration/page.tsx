"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Users,
  CalendarDays,
  Clock,
  ArrowRight,
  UserCircle,
  Loader2,
} from "lucide-react";

interface DashStats {
  effectifTotal: number;
  enCongeAujourdhui: { count: number; noms: string[] };
  demandesEnAttente: number;
  pointagesAujourdhui: { count: number; total: number };
  prochainsConges: {
    id: string;
    nom: string;
    prenom: string;
    dateDebut: string;
    dateFin: string;
    type: string;
  }[];
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AdministrationPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/dashboard-stats");
      if (res.ok) setStats(await res.json());
    } catch {
      // silencieux
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const kpis = [
    {
      icon: <Users className="w-5 h-5" />,
      label: "Effectif total",
      value: stats?.effectifTotal ?? "—",
    },
    {
      icon: <UserCircle className="w-5 h-5" />,
      label: "En congé aujourd'hui",
      value: stats?.enCongeAujourdhui.count ?? "—",
      subtitle: stats?.enCongeAujourdhui.noms.join(", "),
    },
    {
      icon: <Clock className="w-5 h-5" />,
      label: "Demandes en attente",
      value: stats?.demandesEnAttente ?? "—",
    },
    {
      icon: <CalendarDays className="w-5 h-5" />,
      label: "Pointés aujourd'hui",
      value: stats ? `${stats.pointagesAujourdhui.count}/${stats.pointagesAujourdhui.total}` : "—",
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: "var(--color-active-light)" }}
        >
          <Building2 className="w-5 h-5" style={{ color: "var(--color-active)" }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-cockpit-heading">Administration</h1>
          <p className="text-sm text-cockpit-secondary">Gestion RH & Comptabilité</p>
        </div>
      </div>

      {/* KPI Cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl bg-cockpit-card border border-cockpit animate-pulse h-24" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {kpis.map((kpi, i) => (
            <div
              key={i}
              className="rounded-xl overflow-hidden bg-white border border-cockpit transition-transform hover:-translate-y-0.5"
            >
              <div className="h-1.5" style={{ background: "linear-gradient(90deg, var(--color-active), #FEEB9C)" }} />
              <div className="p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: "var(--color-active-light)" }}
                  >
                    <div style={{ color: "var(--color-active)" }}>{kpi.icon}</div>
                  </div>
                  <p className="text-[10px] sm:text-xs font-medium text-cockpit-secondary">{kpi.label}</p>
                </div>
                <p className="text-xl sm:text-2xl font-bold" style={{ color: "var(--color-active)" }}>
                  {kpi.value}
                </p>
                {kpi.subtitle && (
                  <p className="text-xs text-cockpit-secondary mt-0.5 truncate">{kpi.subtitle}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => router.push("/administration/conges")}
          className="bg-cockpit-card border border-cockpit rounded-card shadow-cockpit-lg p-5 text-left hover:border-[var(--color-active)]/30 transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="p-2.5 rounded-lg"
                style={{ backgroundColor: "var(--color-active-light)" }}
              >
                <CalendarDays className="w-5 h-5" style={{ color: "var(--color-active)" }} />
              </div>
              <div>
                <h3 className="font-semibold text-cockpit-heading">Congés & Absences</h3>
                <p className="text-xs text-cockpit-secondary">Gérer les demandes et soldes</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-cockpit-secondary group-hover:translate-x-1 transition-transform" style={{ color: "var(--color-active)" }} />
          </div>
        </button>

        <button
          onClick={() => router.push("/administration/collaborateurs")}
          className="bg-cockpit-card border border-cockpit rounded-card shadow-cockpit-lg p-5 text-left hover:border-[var(--color-active)]/30 transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="p-2.5 rounded-lg"
                style={{ backgroundColor: "var(--color-active-light)" }}
              >
                <Users className="w-5 h-5" style={{ color: "var(--color-active)" }} />
              </div>
              <div>
                <h3 className="font-semibold text-cockpit-heading">Collaborateurs</h3>
                <p className="text-xs text-cockpit-secondary">Annuaire et fiches RH</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-cockpit-secondary group-hover:translate-x-1 transition-transform" style={{ color: "var(--color-active)" }} />
          </div>
        </button>
      </div>

      {/* Prochains Congés */}
      <div className="bg-cockpit-card border border-cockpit rounded-card shadow-cockpit-lg p-5">
        <div className="flex items-center gap-2 mb-4">
          <CalendarDays className="w-5 h-5" style={{ color: "var(--color-active)" }} />
          <h2 className="text-lg font-semibold text-cockpit-heading">Prochains congés</h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-cockpit-secondary" />
          </div>
        ) : stats?.prochainsConges.length === 0 ? (
          <p className="text-sm text-cockpit-secondary text-center py-8">Aucun congé à venir</p>
        ) : (
          <div className="space-y-2">
            {stats?.prochainsConges.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between px-4 py-3 bg-cockpit-dark rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: "var(--color-active)" }}
                  >
                    {c.prenom?.[0]}{c.nom?.[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-cockpit-heading">
                      {c.prenom} {c.nom}
                    </p>
                    <p className="text-xs text-cockpit-secondary">
                      {formatDate(c.dateDebut)}
                      {c.dateDebut !== c.dateFin && ` - ${formatDate(c.dateFin)}`}
                    </p>
                  </div>
                </div>
                <span
                  className="text-xs font-medium px-2.5 py-1 rounded-full"
                  style={{
                    backgroundColor: "var(--color-active-light)",
                    color: "var(--color-active)",
                  }}
                >
                  {c.type === "CP" ? "Congé payé" : c.type === "RTT" ? "RTT" : c.type === "MALADIE" ? "Maladie" : c.type}
                </span>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => router.push("/administration/conges")}
          className="w-full mt-4 py-2.5 rounded-lg text-sm font-medium transition-all hover:opacity-90 text-white"
          style={{ background: "linear-gradient(135deg, var(--color-active), #FEEB9C)" }}
        >
          Voir tous les congés
        </button>
      </div>
    </div>
  );
}
