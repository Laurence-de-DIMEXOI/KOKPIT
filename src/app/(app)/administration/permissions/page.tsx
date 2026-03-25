"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/toast";
import { type Role, type Module } from "@/lib/auth-utils";
import {
  Shield,
  RotateCcw,
  Loader2,
  Check,
  X,
} from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

interface UserWithOverrides {
  id: string;
  nom: string;
  prenom: string;
  role: string;
  moduleAccessOverrides: Record<string, boolean> | null;
}

// ============================================================================
// MODULE GROUPS
// ============================================================================

const MODULE_GROUPS = [
  {
    label: "Commercial",
    modules: [
      { key: "dashboard-commercial", label: "Dashboard" },
      { key: "leads", label: "Demandes" },
      { key: "contacts", label: "Contacts" },
      { key: "pipeline", label: "Pipeline" },
      { key: "commandes", label: "Commandes" },
      { key: "catalogue", label: "Catalogue" },
      { key: "sav", label: "SAV" },
      { key: "bois-dorient", label: "BDO" },
    ],
  },
  {
    label: "Marketing",
    modules: [
      { key: "dashboard", label: "Dashboard" },
      { key: "campagnes", label: "Campagnes" },
      { key: "emailing", label: "Emailing" },
      { key: "planning", label: "Planning" },
      { key: "nos-reseaux", label: "Réseaux" },
      { key: "automatisations", label: "Auto." },
      { key: "analytique", label: "ROI" },
    ],
  },
  {
    label: "Administration",
    modules: [
      { key: "dashboard-admin", label: "Dashboard" },
      { key: "collaborateurs", label: "Collab." },
      { key: "conges", label: "Congés" },
      { key: "pointage", label: "Pointage" },
      { key: "pointage-equipe", label: "Pt. Équipe" },
      { key: "parametres", label: "Paramètres" },
    ],
  },
  {
    label: "Achat",
    modules: [
      { key: "catalogue", label: "Catalogue" },
      { key: "commandes", label: "Commandes" },
      { key: "sav", label: "SAV" },
    ],
  },
  {
    label: "Général",
    modules: [
      { key: "messagerie", label: "Messagerie" },
      { key: "taches", label: "Tâches" },
      { key: "club-tectona", label: "Club" },
      { key: "liens-utiles", label: "Liens" },
      { key: "docs", label: "Docs" },
    ],
  },
];

// ============================================================================
// ROLE DEFAULTS (mirrors auth-utils.ts roleModuleAccess)
// ============================================================================

const ROLE_DEFAULTS: Record<string, string[]> = {
  ADMIN: [
    "dashboard", "leads", "contacts", "campagnes", "emailing", "automatisations",
    "devis", "ventes", "analytique", "parametres", "dashboard-commercial", "pipeline",
    "catalogue", "commandes", "taches", "dashboard-admin", "conges", "collaborateurs",
    "planning", "liens-utiles", "nos-reseaux", "docs", "club-tectona", "bois-dorient",
    "pointage", "pointage-equipe", "sav", "messagerie",
  ],
  MARKETING: [
    "dashboard", "leads", "contacts", "campagnes", "emailing", "automatisations",
    "analytique", "planning", "nos-reseaux", "docs", "club-tectona", "taches",
    "liens-utiles", "pointage", "sav", "conges", "dashboard-commercial", "pipeline",
    "catalogue", "commandes", "bois-dorient", "dashboard-admin", "messagerie",
  ],
  COMMERCIAL: [
    "dashboard-commercial", "pipeline", "catalogue", "commandes", "taches", "leads",
    "contacts", "bois-dorient", "sav", "docs", "club-tectona", "liens-utiles",
    "dashboard-admin", "conges", "pointage", "messagerie",
  ],
  DIRECTION: [
    "dashboard", "leads", "contacts", "campagnes", "emailing", "automatisations",
    "devis", "ventes", "analytique", "parametres", "dashboard-commercial", "pipeline",
    "catalogue", "commandes", "taches", "dashboard-admin", "conges", "collaborateurs",
    "planning", "liens-utiles", "nos-reseaux", "docs", "club-tectona", "bois-dorient",
    "pointage", "pointage-equipe", "sav", "messagerie",
  ],
  ACHAT: [
    "dashboard-commercial", "commandes", "sav", "catalogue", "contacts", "docs",
    "club-tectona", "liens-utiles", "taches", "dashboard-admin", "conges", "pointage",
    "messagerie",
  ],
};

function hasDefaultAccess(role: string, moduleKey: string): boolean {
  return ROLE_DEFAULTS[role]?.includes(moduleKey) ?? false;
}

// ============================================================================
// GRADIENT
// ============================================================================

const ADMIN_GRADIENT = {
  from: "var(--color-active)",
  to: "#FEEB9C",
};

// ============================================================================
// ROLE BADGE COLORS
// ============================================================================

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-red-500/15 text-red-400",
  DIRECTION: "bg-purple-500/15 text-purple-400",
  MARKETING: "bg-pink-500/15 text-pink-400",
  COMMERCIAL: "bg-blue-500/15 text-blue-400",
  ACHAT: "bg-amber-500/15 text-amber-400",
};

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  DIRECTION: "Direction",
  MARKETING: "Marketing",
  COMMERCIAL: "Commercial",
  ACHAT: "Achat",
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function PermissionsPage() {
  const { data: session } = useSession();
  const { addToast } = useToast();

  const [users, setUsers] = useState<UserWithOverrides[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingUsers, setSavingUsers] = useState<Set<string>>(new Set());

  // --------------------------------------------------------------------------
  // Fetch users
  // --------------------------------------------------------------------------

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/user-modules");
      if (!res.ok) throw new Error("Erreur lors du chargement");
      const data = await res.json();
      setUsers(data);
    } catch {
      addToast("Impossible de charger les utilisateurs", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // --------------------------------------------------------------------------
  // Access check
  // --------------------------------------------------------------------------

  // Accès uniquement pour Laurence (super-admin permissions)
  const isAdmin =
    session?.user?.email === "laurence.payet@dimexoi.fr" ||
    session?.user?.role === "DIRECTION";

  if (!isAdmin && !loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-3">
          <Shield className="w-12 h-12 text-cockpit-secondary mx-auto opacity-40" />
          <p className="text-cockpit-secondary text-sm">
            Accès réservé aux administrateurs
          </p>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // Resolve effective access
  // --------------------------------------------------------------------------

  function getAccessState(
    user: UserWithOverrides,
    moduleKey: string
  ): { checked: boolean; source: "default" | "override-grant" | "override-deny" | "none" } {
    const overrides = user.moduleAccessOverrides;
    if (overrides && moduleKey in overrides) {
      return {
        checked: overrides[moduleKey],
        source: overrides[moduleKey] ? "override-grant" : "override-deny",
      };
    }
    const defaultAccess = hasDefaultAccess(user.role, moduleKey);
    return {
      checked: defaultAccess,
      source: defaultAccess ? "default" : "none",
    };
  }

  // --------------------------------------------------------------------------
  // Toggle
  // --------------------------------------------------------------------------

  async function handleToggle(user: UserWithOverrides, moduleKey: string) {
    const current = getAccessState(user, moduleKey);
    const newValue = !current.checked;

    // Build new overrides
    const currentOverrides = user.moduleAccessOverrides
      ? { ...user.moduleAccessOverrides }
      : {};
    currentOverrides[moduleKey] = newValue;

    // If the override matches the role default, remove it
    if (newValue === hasDefaultAccess(user.role, moduleKey)) {
      delete currentOverrides[moduleKey];
    }

    // If all overrides removed, send null
    const finalOverrides =
      Object.keys(currentOverrides).length === 0 ? null : currentOverrides;

    // Optimistic update
    setUsers((prev) =>
      prev.map((u) =>
        u.id === user.id ? { ...u, moduleAccessOverrides: finalOverrides } : u
      )
    );

    setSavingUsers((prev) => new Set(prev).add(user.id));

    try {
      const res = await fetch(`/api/admin/user-modules/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ overrides: finalOverrides }),
      });
      if (!res.ok) throw new Error("Erreur");
      addToast(
        `Permission mise à jour pour ${user.prenom} ${user.nom}`,
        "success"
      );
    } catch {
      // Revert
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? { ...u, moduleAccessOverrides: user.moduleAccessOverrides }
            : u
        )
      );
      addToast("Erreur lors de la mise à jour", "error");
    } finally {
      setSavingUsers((prev) => {
        const next = new Set(prev);
        next.delete(user.id);
        return next;
      });
    }
  }

  // --------------------------------------------------------------------------
  // Reset
  // --------------------------------------------------------------------------

  async function handleReset(user: UserWithOverrides) {
    setSavingUsers((prev) => new Set(prev).add(user.id));
    const prevOverrides = user.moduleAccessOverrides;

    // Optimistic
    setUsers((prev) =>
      prev.map((u) =>
        u.id === user.id ? { ...u, moduleAccessOverrides: null } : u
      )
    );

    try {
      const res = await fetch(`/api/admin/user-modules/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ overrides: null }),
      });
      if (!res.ok) throw new Error("Erreur");
      addToast(
        `Permissions réinitialisées pour ${user.prenom} ${user.nom}`,
        "success"
      );
    } catch {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, moduleAccessOverrides: prevOverrides } : u
        )
      );
      addToast("Erreur lors de la réinitialisation", "error");
    } finally {
      setSavingUsers((prev) => {
        const next = new Set(prev);
        next.delete(user.id);
        return next;
      });
    }
  }

  // --------------------------------------------------------------------------
  // All module keys (flat)
  // --------------------------------------------------------------------------

  const allModules = MODULE_GROUPS.flatMap((g) => g.modules);

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
          style={{
            background: `linear-gradient(135deg, ${ADMIN_GRADIENT.from}, ${ADMIN_GRADIENT.to})`,
          }}
        >
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-cockpit-heading">
            Permissions
          </h1>
          <p className="text-sm text-cockpit-secondary">
            Gérer l&apos;accès aux modules par utilisateur
          </p>
        </div>
      </div>

      {/* ── Matrix ─────────────────────────────────────────────────────── */}
      <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[900px]">
            {/* ── Header ───────────────────────────────────────────────── */}
            <thead>
              {/* Group header row */}
              <tr className="border-b border-cockpit">
                <th
                  className="sticky left-0 z-20 bg-cockpit-card border-r border-cockpit px-4 py-3"
                  style={{ minWidth: 200 }}
                />
                {MODULE_GROUPS.map((group) => (
                  <th
                    key={group.label}
                    colSpan={group.modules.length}
                    className="px-2 py-2 text-xs font-bold uppercase tracking-wider text-center border-r border-cockpit last:border-r-0"
                    style={{ color: "var(--color-active)" }}
                  >
                    {group.label}
                  </th>
                ))}
                <th className="w-12" />
              </tr>
              {/* Module header row */}
              <tr className="border-b border-cockpit bg-cockpit-dark/30">
                <th
                  className="sticky left-0 z-20 bg-cockpit-card border-r border-cockpit px-4 py-2 text-left text-xs font-semibold text-cockpit-secondary"
                  style={{ minWidth: 200 }}
                >
                  Utilisateur
                </th>
                {allModules.map((mod, idx) => {
                  // Find if this is the last module in its group
                  let isGroupEnd = false;
                  let cumulative = 0;
                  for (const g of MODULE_GROUPS) {
                    cumulative += g.modules.length;
                    if (idx === cumulative - 1) {
                      isGroupEnd = true;
                      break;
                    }
                  }
                  return (
                    <th
                      key={mod.key}
                      className={`px-1 py-2 text-[10px] font-medium text-cockpit-secondary text-center whitespace-nowrap ${
                        isGroupEnd ? "border-r border-cockpit" : ""
                      }`}
                      title={mod.key}
                    >
                      {mod.label}
                    </th>
                  );
                })}
                <th className="w-12" />
              </tr>
            </thead>

            {/* ── Body ─────────────────────────────────────────────────── */}
            <tbody>
              {loading ? (
                // Skeleton
                Array.from({ length: 5 }).map((_, i) => (
                  <tr
                    key={`skeleton-${i}`}
                    className="border-b border-cockpit/50"
                  >
                    <td className="sticky left-0 z-10 bg-cockpit-card border-r border-cockpit px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-cockpit-dark/50 animate-pulse" />
                        <div className="space-y-1.5">
                          <div className="w-24 h-3 rounded bg-cockpit-dark/50 animate-pulse" />
                          <div className="w-16 h-2.5 rounded bg-cockpit-dark/30 animate-pulse" />
                        </div>
                      </div>
                    </td>
                    {allModules.map((mod) => (
                      <td key={mod.key} className="px-1 py-3 text-center">
                        <div className="w-5 h-5 rounded bg-cockpit-dark/30 animate-pulse mx-auto" />
                      </td>
                    ))}
                    <td />
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={allModules.length + 2}
                    className="px-4 py-12 text-center text-cockpit-secondary text-sm"
                  >
                    Aucun utilisateur trouvé
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const isSaving = savingUsers.has(user.id);
                  const hasOverrides =
                    user.moduleAccessOverrides &&
                    Object.keys(user.moduleAccessOverrides).length > 0;

                  return (
                    <tr
                      key={user.id}
                      className="border-b border-cockpit/50 hover:bg-cockpit-dark/20 transition-colors"
                    >
                      {/* User cell */}
                      <td className="sticky left-0 z-10 bg-cockpit-card border-r border-cockpit px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                            style={{
                              background: `linear-gradient(135deg, ${ADMIN_GRADIENT.from}, ${ADMIN_GRADIENT.to})`,
                            }}
                          >
                            {user.prenom[0]}
                            {user.nom[0]}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-cockpit-heading truncate">
                                {user.prenom} {user.nom}
                              </p>
                              {isSaving && (
                                <Loader2 className="w-3 h-3 animate-spin text-cockpit-secondary flex-shrink-0" />
                              )}
                            </div>
                            <span
                              className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                                ROLE_COLORS[user.role] ?? "bg-gray-500/15 text-gray-400"
                              }`}
                            >
                              {ROLE_LABELS[user.role] ?? user.role}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Module cells */}
                      {allModules.map((mod, idx) => {
                        const state = getAccessState(user, mod.key);

                        // Group border
                        let isGroupEnd = false;
                        let cumulative = 0;
                        for (const g of MODULE_GROUPS) {
                          cumulative += g.modules.length;
                          if (idx === cumulative - 1) {
                            isGroupEnd = true;
                            break;
                          }
                        }

                        let boxClasses =
                          "w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition-all duration-150 mx-auto ";

                        if (state.source === "override-grant") {
                          boxClasses +=
                            "border-[var(--color-active)] bg-[var(--color-active)]/20";
                        } else if (state.source === "override-deny") {
                          boxClasses +=
                            "border-red-400/60 bg-red-400/10";
                        } else if (state.source === "default") {
                          boxClasses +=
                            "border-cockpit bg-cockpit-dark/40 opacity-70";
                        } else {
                          boxClasses +=
                            "border-cockpit bg-transparent opacity-50";
                        }

                        return (
                          <td
                            key={mod.key}
                            className={`px-1 py-2 text-center ${
                              isGroupEnd ? "border-r border-cockpit" : ""
                            }`}
                          >
                            <button
                              type="button"
                              className={boxClasses}
                              onClick={() => handleToggle(user, mod.key)}
                              title={`${mod.label}: ${
                                state.checked ? "Activé" : "Désactivé"
                              } (${
                                state.source === "default"
                                  ? "par défaut"
                                  : state.source === "none"
                                  ? "par défaut"
                                  : "personnalisé"
                              })`}
                              disabled={isSaving}
                            >
                              {state.checked ? (
                                <Check
                                  className={`w-3 h-3 ${
                                    state.source === "override-grant"
                                      ? "text-[var(--color-active)]"
                                      : "text-cockpit-secondary"
                                  }`}
                                />
                              ) : state.source === "override-deny" ? (
                                <X className="w-3 h-3 text-red-400" />
                              ) : null}
                            </button>
                          </td>
                        );
                      })}

                      {/* Reset button */}
                      <td className="px-2 py-2 text-center">
                        {hasOverrides && (
                          <button
                            type="button"
                            onClick={() => handleReset(user)}
                            disabled={isSaving}
                            className="p-1.5 rounded-lg hover:bg-cockpit-dark/40 transition-colors group"
                            title={`Réinitialiser les permissions de ${user.prenom}`}
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-cockpit-secondary group-hover:text-cockpit-heading transition-colors" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Legend ──────────────────────────────────────────────────── */}
        {!loading && users.length > 0 && (
          <div className="px-4 py-3 border-t border-cockpit flex flex-wrap items-center gap-4 text-[10px] text-cockpit-secondary">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded border-2 border-cockpit bg-cockpit-dark/40 opacity-70 flex items-center justify-center">
                <Check className="w-2.5 h-2.5 text-cockpit-secondary" />
              </div>
              <span>Accès par défaut (rôle)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded border-2 flex items-center justify-center" style={{ borderColor: "var(--color-active)", backgroundColor: "var(--color-active)", opacity: 0.2 }}>
                <Check className="w-2.5 h-2.5" style={{ color: "var(--color-active)" }} />
              </div>
              <span>Accès ajouté (override)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded border-2 border-red-400/60 bg-red-400/10 flex items-center justify-center">
                <X className="w-2.5 h-2.5 text-red-400" />
              </div>
              <span>Accès retiré (override)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded border-2 border-cockpit bg-transparent opacity-50" />
              <span>Pas d&apos;accès</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
