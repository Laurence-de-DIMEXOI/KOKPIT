"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/toast";
import {
  Settings,
  Clock,
  Shield,
  Users,
  Save,
  Loader2,
  AlertTriangle,
  Check,
} from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

interface ConfigData {
  slaHeures: number;
  pointageHeuresJour: number;
  pointagePauseDefaut: number;
}

interface UserInfo {
  id: string;
  nom: string;
  prenom: string;
  role: string;
  email: string;
}

// ============================================================================
// GRADIENT
// ============================================================================

const ADMIN_GRADIENT = {
  from: "#F17142",
  to: "#A04A0E",
  shadow: "rgba(209,95,18,0.30)",
};

const ROLES_CONFIG: Record<string, { label: string; couleur: string; modules: string[] }> = {
  ADMIN: {
    label: "Administrateur",
    couleur: "bg-red-500",
    modules: ["Tout accès — tous les modules"],
  },
  DIRECTION: {
    label: "Direction",
    couleur: "bg-purple-500",
    modules: ["Dashboard", "Commercial", "Marketing", "Administration", "Pointage équipe", "SAV"],
  },
  MARKETING: {
    label: "Marketing",
    couleur: "bg-pink-500",
    modules: ["Dashboard", "Leads", "Contacts", "Campagnes", "Emailing", "Planning", "Club Tectona", "SAV"],
  },
  COMMERCIAL: {
    label: "Commercial",
    couleur: "bg-teal-500",
    modules: ["Dashboard commercial", "Pipeline", "Catalogue", "Commandes", "Tâches", "Contacts", "SAV"],
  },
};

// ============================================================================
// PAGE
// ============================================================================

export default function ParametresPage() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<ConfigData>({
    slaHeures: 72,
    pointageHeuresJour: 7,
    pointagePauseDefaut: 1,
  });
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/config");
      if (res.ok) {
        const data = await res.json();
        if (data.config) {
          setConfig({
            slaHeures: data.config.slaHeures,
            pointageHeuresJour: data.config.pointageHeuresJour,
            pointagePauseDefaut: data.config.pointagePauseDefaut,
          });
        }
        setUsers(data.users || []);
      }
    } catch {
      addToast("Erreur chargement configuration", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const updateConfig = (key: keyof ConfigData, value: number) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        addToast("Configuration enregistrée", "success");
        setHasChanges(false);
      } else {
        throw new Error("Erreur");
      }
    } catch {
      addToast("Erreur lors de l'enregistrement", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cockpit-darker p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="h-10 w-64 bg-cockpit-dark rounded-lg animate-pulse" />
        <div className="grid gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-cockpit-dark rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cockpit-darker p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${ADMIN_GRADIENT.from}, ${ADMIN_GRADIENT.to})`,
            }}
          >
            <Settings className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-cockpit-heading">Paramètres</h1>
            <p className="text-sm text-cockpit-secondary">Configuration générale KOKPIT</p>
          </div>
        </div>

        {hasChanges && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all min-h-[44px] w-full sm:w-auto"
            style={{
              background: `linear-gradient(135deg, ${ADMIN_GRADIENT.from}, ${ADMIN_GRADIENT.to})`,
              boxShadow: `0 4px 14px ${ADMIN_GRADIENT.shadow}`,
            }}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Enregistrer
          </button>
        )}
      </div>

      {/* ================================================================ */}
      {/* SLA */}
      {/* ================================================================ */}
      <div className="bg-cockpit-card border border-cockpit rounded-card p-5 sm:p-6 shadow-cockpit-lg">
        <h2 className="text-base font-bold text-cockpit-heading flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4" style={{ color: ADMIN_GRADIENT.from }} />
          Délai SLA — Demandes clients
        </h2>
        <p className="text-sm text-cockpit-secondary mb-4">
          Temps maximum pour traiter une demande client avant alerte. Une tâche automatique est créée pour le commercial assigné après dépassement.
        </p>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <label className="text-sm font-medium text-cockpit-primary whitespace-nowrap">
            Délai SLA :
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={config.slaHeures}
              onChange={(e) => updateConfig("slaHeures", parseInt(e.target.value) || 72)}
              min={1}
              max={168}
              className="w-20 bg-cockpit-dark border border-cockpit rounded-lg px-3 py-2 text-sm text-cockpit-primary text-center focus:outline-none focus:ring-2 focus:ring-[#F17142]/40"
            />
            <span className="text-sm text-cockpit-secondary">heures</span>
          </div>
          <span className="text-xs text-cockpit-secondary">
            ({Math.round(config.slaHeures / 24 * 10) / 10} jours)
          </span>
        </div>
      </div>

      {/* ================================================================ */}
      {/* POINTAGE */}
      {/* ================================================================ */}
      <div className="bg-cockpit-card border border-cockpit rounded-card p-5 sm:p-6 shadow-cockpit-lg">
        <h2 className="text-base font-bold text-cockpit-heading flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4" style={{ color: ADMIN_GRADIENT.from }} />
          Pointage — Horaires de travail
        </h2>
        <p className="text-sm text-cockpit-secondary mb-4">
          Configuration des heures théoriques pour le calcul des heures travaillées et supplémentaires.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-cockpit-primary mb-1.5">
              Heures théoriques / jour
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={config.pointageHeuresJour}
                onChange={(e) => updateConfig("pointageHeuresJour", parseFloat(e.target.value) || 7)}
                min={1}
                max={12}
                step={0.5}
                className="w-20 bg-cockpit-dark border border-cockpit rounded-lg px-3 py-2 text-sm text-cockpit-primary text-center focus:outline-none focus:ring-2 focus:ring-[#F17142]/40"
              />
              <span className="text-sm text-cockpit-secondary">heures</span>
            </div>
            <p className="text-xs text-cockpit-secondary mt-1">Heures supp = travaillé - théorique</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-cockpit-primary mb-1.5">
              Pause par défaut
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={config.pointagePauseDefaut}
                onChange={(e) => updateConfig("pointagePauseDefaut", parseFloat(e.target.value) || 1)}
                min={0}
                max={3}
                step={0.25}
                className="w-20 bg-cockpit-dark border border-cockpit rounded-lg px-3 py-2 text-sm text-cockpit-primary text-center focus:outline-none focus:ring-2 focus:ring-[#F17142]/40"
              />
              <span className="text-sm text-cockpit-secondary">heures</span>
            </div>
            <p className="text-xs text-cockpit-secondary mt-1">Déduite si pause non pointée</p>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* RÔLES & MODULES */}
      {/* ================================================================ */}
      <div className="bg-cockpit-card border border-cockpit rounded-card p-5 sm:p-6 shadow-cockpit-lg">
        <h2 className="text-base font-bold text-cockpit-heading flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4" style={{ color: ADMIN_GRADIENT.from }} />
          Rôles et accès
        </h2>
        <p className="text-sm text-cockpit-secondary mb-4">
          Aperçu des rôles et modules accessibles par chaque profil. La modification des rôles se fait dans Collaborateurs.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Object.entries(ROLES_CONFIG).map(([role, cfg]) => (
            <div key={role} className="bg-cockpit-dark border border-cockpit/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-2.5 h-2.5 rounded-full ${cfg.couleur}`} />
                <span className="text-sm font-bold text-cockpit-heading">{cfg.label}</span>
                <span className="text-xs text-cockpit-secondary ml-auto">
                  {users.filter((u) => u.role === role).length} utilisateur{users.filter((u) => u.role === role).length > 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {cfg.modules.map((mod) => (
                  <span key={mod} className="px-2 py-0.5 rounded-full bg-cockpit-card text-[10px] font-medium text-cockpit-secondary border border-cockpit/30">
                    {mod}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ================================================================ */}
      {/* COLLABORATEURS PAR RÔLE */}
      {/* ================================================================ */}
      <div className="bg-cockpit-card border border-cockpit rounded-card p-5 sm:p-6 shadow-cockpit-lg">
        <h2 className="text-base font-bold text-cockpit-heading flex items-center gap-2 mb-4">
          <Users className="w-4 h-4" style={{ color: ADMIN_GRADIENT.from }} />
          Équipe — {users.length} collaborateurs actifs
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-cockpit">
              <tr>
                <th className="text-left px-3 py-2 text-xs font-semibold text-cockpit-secondary uppercase">Collaborateur</th>
                <th className="text-left px-3 py-2 text-xs font-semibold text-cockpit-secondary uppercase">Email</th>
                <th className="text-center px-3 py-2 text-xs font-semibold text-cockpit-secondary uppercase">Rôle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cockpit/50">
              {users.map((u) => {
                const roleCfg = ROLES_CONFIG[u.role];
                return (
                  <tr key={u.id} className="hover:bg-cockpit-dark/50 transition-colors">
                    <td className="px-3 py-2.5 text-sm font-medium text-cockpit-heading">
                      {u.prenom} {u.nom}
                    </td>
                    <td className="px-3 py-2.5 text-sm text-cockpit-secondary">{u.email}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${roleCfg?.couleur || "bg-gray-500"}`}>
                        {roleCfg?.label || u.role}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Save indicator */}
      {hasChanges && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white shadow-lg transition-all hover:-translate-y-0.5"
            style={{
              background: `linear-gradient(135deg, ${ADMIN_GRADIENT.from}, ${ADMIN_GRADIENT.to})`,
              boxShadow: `0 8px 24px ${ADMIN_GRADIENT.shadow}`,
            }}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Enregistrer les modifications
          </button>
        </div>
      )}
    </div>
  );
}
