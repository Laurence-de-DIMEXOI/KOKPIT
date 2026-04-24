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
  RotateCcw,
  KeyRound,
} from "lucide-react";
import { roleModuleAccess, type Role, type Module } from "@/lib/auth-utils";
import { NAV_CATEGORIES } from "@/lib/nav-config";

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

interface UserModules {
  id: string;
  nom: string;
  prenom: string;
  role: Role;
  moduleAccessOverrides: Record<string, boolean> | null;
}

// ============================================================================
// GRADIENT
// ============================================================================

const ADMIN_GRADIENT = {
  from: "var(--color-active)",
  to: "#FEEB9C",
  shadow: "var(--color-active-border)",
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
    slaHeures: 48,
    pointageHeuresJour: 7,
    pointagePauseDefaut: 1,
  });
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // ===== Permissions par utilisateur =====
  const [userModules, setUserModules] = useState<UserModules[]>([]);
  const [permChanges, setPermChanges] = useState<Record<string, Record<string, boolean>>>({});
  const [loadingPerms, setLoadingPerms] = useState(true);
  const [savingPerms, setSavingPerms] = useState(false);

  // Liste aplatie de tous les modules (via nav-config) + catégorie d'origine
  const ALL_MODULES: { module: Module; label: string; category: string; color: string }[] =
    NAV_CATEGORIES.flatMap((cat) =>
      cat.items.map((item) => ({
        module: item.module,
        label: item.label,
        category: cat.label,
        color: cat.color,
      }))
    ).filter((m, idx, arr) => arr.findIndex((x) => x.module === m.module) === idx);

  const fetchUserModules = useCallback(async () => {
    try {
      setLoadingPerms(true);
      const res = await fetch("/api/admin/user-modules");
      if (res.ok) {
        const data = await res.json();
        setUserModules(data);
      }
    } catch {
      addToast("Erreur chargement permissions", "error");
    } finally {
      setLoadingPerms(false);
    }
  }, [addToast]);

  // Calcule l'état effectif (role default + override + changements locaux)
  const getEffectiveAccess = (user: UserModules, module: Module): boolean => {
    const localOverrides = permChanges[user.id];
    if (localOverrides && module in localOverrides) return localOverrides[module];
    const savedOverrides = user.moduleAccessOverrides;
    if (savedOverrides && module in savedOverrides) return savedOverrides[module];
    return roleModuleAccess[user.role]?.includes(module) ?? false;
  };

  // Indique si la valeur actuelle est un override (diffère du rôle par défaut)
  const isOverride = (user: UserModules, module: Module): boolean => {
    const effective = getEffectiveAccess(user, module);
    const roleDefault = roleModuleAccess[user.role]?.includes(module) ?? false;
    return effective !== roleDefault;
  };

  // Indique si cet utilisateur a des changements non sauvegardés
  const userHasChanges = (userId: string): boolean => {
    const changes = permChanges[userId];
    return !!changes && Object.keys(changes).length > 0;
  };

  const totalPermChanges = Object.values(permChanges).reduce(
    (sum, c) => sum + Object.keys(c).length,
    0
  );

  const toggleModule = (user: UserModules, module: Module) => {
    const current = getEffectiveAccess(user, module);
    const newValue = !current;
    const roleDefault = roleModuleAccess[user.role]?.includes(module) ?? false;
    const savedOverride = user.moduleAccessOverrides?.[module];

    setPermChanges((prev) => {
      const userChanges = { ...(prev[user.id] || {}) };

      // Si la nouvelle valeur matche le rôle par défaut ET qu'il n'y avait pas d'override sauvé
      // → pas de changement local (revert)
      if (newValue === roleDefault && savedOverride === undefined) {
        delete userChanges[module];
      } else if (newValue === savedOverride) {
        // Revert au sauvegardé
        delete userChanges[module];
      } else {
        userChanges[module] = newValue;
      }

      const next = { ...prev };
      if (Object.keys(userChanges).length === 0) {
        delete next[user.id];
      } else {
        next[user.id] = userChanges;
      }
      return next;
    });
  };

  const resetUserOverrides = async (userId: string) => {
    if (!confirm("Réinitialiser les permissions aux valeurs par défaut du rôle ?")) return;
    try {
      const res = await fetch(`/api/admin/user-modules/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ overrides: null }),
      });
      if (res.ok) {
        addToast("Permissions réinitialisées", "success");
        setPermChanges((prev) => {
          const next = { ...prev };
          delete next[userId];
          return next;
        });
        await fetchUserModules();
      } else {
        throw new Error("Erreur");
      }
    } catch {
      addToast("Erreur réinitialisation", "error");
    }
  };

  const savePermissions = async () => {
    setSavingPerms(true);
    try {
      // Pour chaque user avec changements, calculer l'override final et envoyer
      const entries = Object.entries(permChanges);
      await Promise.all(
        entries.map(async ([userId, changes]) => {
          const user = userModules.find((u) => u.id === userId);
          if (!user) return;

          // Merger saved + local
          const merged: Record<string, boolean> = {
            ...(user.moduleAccessOverrides || {}),
            ...changes,
          };

          // Nettoyer: retirer les clés qui correspondent au rôle par défaut
          const cleaned: Record<string, boolean> = {};
          for (const [mod, val] of Object.entries(merged)) {
            const roleDefault = roleModuleAccess[user.role]?.includes(mod as Module) ?? false;
            if (val !== roleDefault) {
              cleaned[mod] = val;
            }
          }

          const body = Object.keys(cleaned).length === 0 ? { overrides: null } : { overrides: cleaned };
          await fetch(`/api/admin/user-modules/${userId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
        })
      );
      addToast(`Permissions mises à jour (${entries.length} utilisateur${entries.length > 1 ? "s" : ""})`, "success");
      setPermChanges({});
      await fetchUserModules();
    } catch {
      addToast("Erreur sauvegarde permissions", "error");
    } finally {
      setSavingPerms(false);
    }
  };

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
    fetchUserModules();
  }, [fetchConfig, fetchUserModules]);

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
              onChange={(e) => updateConfig("slaHeures", parseInt(e.target.value) || 48)}
              min={1}
              max={168}
              className="w-20 bg-cockpit-dark border border-cockpit rounded-lg px-3 py-2 text-sm text-cockpit-primary text-center focus:outline-none focus:ring-2 focus:ring-[var(--color-active)]/40"
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
                className="w-20 bg-cockpit-dark border border-cockpit rounded-lg px-3 py-2 text-sm text-cockpit-primary text-center focus:outline-none focus:ring-2 focus:ring-[var(--color-active)]/40"
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
                className="w-20 bg-cockpit-dark border border-cockpit rounded-lg px-3 py-2 text-sm text-cockpit-primary text-center focus:outline-none focus:ring-2 focus:ring-[var(--color-active)]/40"
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

      {/* ================================================================ */}
      {/* PERMISSIONS PAR UTILISATEUR — MATRICE */}
      {/* ================================================================ */}
      <div className="bg-cockpit-card border border-cockpit rounded-card p-5 sm:p-6 shadow-cockpit-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-bold text-cockpit-heading flex items-center gap-2">
              <KeyRound className="w-4 h-4" style={{ color: ADMIN_GRADIENT.from }} />
              Permissions par utilisateur
            </h2>
            <p className="text-sm text-cockpit-secondary mt-1">
              Coche pour donner accès, décoche pour retirer. Les cases grises reflètent l&apos;accès par défaut du rôle, les cases orange un override manuel.
            </p>
          </div>
          {totalPermChanges > 0 && (
            <button
              onClick={savePermissions}
              disabled={savingPerms}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all"
              style={{
                background: `linear-gradient(135deg, ${ADMIN_GRADIENT.from}, ${ADMIN_GRADIENT.to})`,
                boxShadow: `0 4px 14px ${ADMIN_GRADIENT.shadow}`,
              }}
            >
              {savingPerms ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Enregistrer ({totalPermChanges})
            </button>
          )}
        </div>

        {loadingPerms ? (
          <div className="h-32 bg-cockpit-dark rounded-lg animate-pulse" />
        ) : (
          <div className="overflow-x-auto -mx-5 sm:-mx-6 px-5 sm:px-6">
            <table className="border-separate border-spacing-0 text-xs min-w-full">
              <thead>
                <tr>
                  <th
                    className="sticky left-0 z-20 bg-cockpit-card text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-cockpit-secondary border-b-2 border-cockpit min-w-[160px]"
                  >
                    Utilisateur
                  </th>
                  {ALL_MODULES.map((m) => (
                    <th
                      key={m.module}
                      className="px-2 py-2 border-b-2 border-cockpit text-[9px] font-bold uppercase tracking-wider whitespace-nowrap"
                      style={{ color: m.color, minWidth: "80px" }}
                      title={`${m.category} — ${m.label}`}
                    >
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-[8px] opacity-70">{m.category.slice(0, 3)}</span>
                        <span>{m.label.length > 10 ? m.label.slice(0, 10) + "…" : m.label}</span>
                      </div>
                    </th>
                  ))}
                  <th className="sticky right-0 z-20 bg-cockpit-card px-2 py-2 border-b-2 border-cockpit" />
                </tr>
              </thead>
              <tbody>
                {userModules.map((user) => {
                  const rowChanged = userHasChanges(user.id);
                  const hasSavedOverrides = user.moduleAccessOverrides && Object.keys(user.moduleAccessOverrides).length > 0;
                  return (
                    <tr
                      key={user.id}
                      className={rowChanged ? "bg-[var(--color-active)]/5" : "hover:bg-cockpit-dark/30 transition-colors"}
                    >
                      <td
                        className={`sticky left-0 z-10 px-3 py-2 border-b border-cockpit/50 text-sm font-medium text-cockpit-heading whitespace-nowrap ${rowChanged ? "bg-[var(--color-active)]/10" : "bg-cockpit-card"}`}
                      >
                        <div className="flex flex-col">
                          <span>{user.prenom} {user.nom}</span>
                          <span className="text-[10px] text-cockpit-secondary font-normal">{user.role}</span>
                        </div>
                      </td>
                      {ALL_MODULES.map((m) => {
                        const checked = getEffectiveAccess(user, m.module);
                        const override = isOverride(user, m.module);
                        return (
                          <td
                            key={m.module}
                            className="px-2 py-2 border-b border-cockpit/50 text-center"
                          >
                            <button
                              onClick={() => toggleModule(user, m.module)}
                              className={`w-6 h-6 rounded transition-all flex items-center justify-center ${
                                checked
                                  ? override
                                    ? "bg-[var(--color-active)] text-white shadow-md ring-2 ring-[var(--color-active)]/30"
                                    : "bg-cockpit-secondary/30 text-cockpit-heading"
                                  : override
                                    ? "bg-red-500/20 border-2 border-red-500/50"
                                    : "bg-cockpit-dark border border-cockpit/40 hover:border-cockpit"
                              }`}
                              title={override ? "Override actif (diffère du rôle)" : "Accès par défaut du rôle"}
                            >
                              {checked && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                            </button>
                          </td>
                        );
                      })}
                      <td className={`sticky right-0 z-10 px-2 py-2 border-b border-cockpit/50 ${rowChanged ? "bg-[var(--color-active)]/10" : "bg-cockpit-card"}`}>
                        {hasSavedOverrides && (
                          <button
                            onClick={() => resetUserOverrides(user.id)}
                            className="p-1.5 rounded-lg text-cockpit-secondary hover:text-red-500 hover:bg-red-500/10 transition-colors"
                            title="Réinitialiser aux permissions du rôle"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Légende */}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-[11px] text-cockpit-secondary">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-cockpit-secondary/30 flex items-center justify-center">
              <Check className="w-2.5 h-2.5 text-cockpit-heading" strokeWidth={3} />
            </div>
            Accès par défaut du rôle
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-[var(--color-active)] flex items-center justify-center ring-2 ring-[var(--color-active)]/30">
              <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
            </div>
            Override — accès accordé
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-red-500/20 border-2 border-red-500/50" />
            Override — accès retiré
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-cockpit-dark border border-cockpit/40" />
            Pas d&apos;accès (rôle par défaut)
          </div>
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
