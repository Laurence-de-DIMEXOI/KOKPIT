import type { Session } from "next-auth";

export type Role = "ADMIN" | "MARKETING" | "COMMERCIAL" | "DIRECTION" | "ACHAT";

export type Module =
  | "dashboard"
  | "leads"
  | "contacts"
  | "campagnes"
  | "emailing"
  | "automatisations"
  | "devis"
  | "ventes"
  | "analytique"
  | "parametres"
  | "dashboard-commercial"
  | "pipeline"
  | "catalogue"
  | "commandes"
  | "dashboard-admin"
  | "conges"
  | "collaborateurs"
  | "planning"
  | "liens-utiles"
  | "nos-reseaux"
  | "taches"
  | "docs"
  | "club-tectona"
  | "bois-dorient"
  | "pointage"
  | "pointage-equipe"
  | "sav"
  | "messagerie";

/**
 * Permissions par rôle — DIMEXOI
 *
 * ADMIN (Michelle, Liliane, Alain) : Tout + options spéciales Michelle (pointage Georget, validation congés)
 * MARKETING (Laurence) : Tout sauf pointage-equipe et options Michelle
 * COMMERCIAL (Bernard, Daniella, Laurent) : Section commerciale + Général + congés/pointage
 * ACHAT (Elaury) : Commandes + SAV + Catalogue + Général + congés/pointage
 */
const roleModuleAccess: Record<Role, Module[]> = {
  ADMIN: [
    // Tout accès
    "dashboard",
    "leads",
    "contacts",
    "campagnes",
    "emailing",
    "automatisations",
    "devis",
    "ventes",
    "analytique",
    "parametres",
    "dashboard-commercial",
    "pipeline",
    "catalogue",
    "commandes",
    "taches",
    "dashboard-admin",
    "conges",
    "collaborateurs",
    "planning",
    "liens-utiles",
    "nos-reseaux",
    "docs",
    "club-tectona",
    "bois-dorient",
    "pointage",
    "pointage-equipe",
    "sav",
    "messagerie",
  ],
  MARKETING: [
    // Marketing complet
    "dashboard",
    "leads",
    "contacts",
    "campagnes",
    "emailing",
    "automatisations",
    "analytique",
    "planning",
    "nos-reseaux",
    "docs",
    "club-tectona",
    "taches",
    "liens-utiles",
    "pointage",
    "sav",
    "conges",
    // Commercial
    "dashboard-commercial",
    "pipeline",
    "catalogue",
    "commandes",
    "bois-dorient",
    // Administration (congés + pointage perso, pas pointage-equipe/collaborateurs/parametres)
    "dashboard-admin",
    "messagerie",
  ],
  COMMERCIAL: [
    // Section commerciale
    "dashboard-commercial",
    "pipeline",
    "catalogue",
    "commandes",
    "taches",
    "leads",
    "contacts",
    "bois-dorient",
    "sav",
    // Général
    "docs",
    "club-tectona",
    "liens-utiles",
    // Administration (congés + pointage perso uniquement)
    "dashboard-admin",
    "conges",
    "pointage",
    "messagerie",
  ],
  DIRECTION: [
    // Tout accès (comme ADMIN)
    "dashboard",
    "leads",
    "contacts",
    "campagnes",
    "emailing",
    "automatisations",
    "devis",
    "ventes",
    "analytique",
    "parametres",
    "dashboard-commercial",
    "pipeline",
    "catalogue",
    "commandes",
    "taches",
    "dashboard-admin",
    "conges",
    "collaborateurs",
    "planning",
    "liens-utiles",
    "nos-reseaux",
    "docs",
    "club-tectona",
    "bois-dorient",
    "pointage",
    "pointage-equipe",
    "sav",
    "messagerie",
  ],
  ACHAT: [
    // Section commerciale (Commandes + SAV + Catalogue)
    "dashboard-commercial",
    "commandes",
    "sav",
    "catalogue",
    "contacts",
    // Général
    "docs",
    "club-tectona",
    "liens-utiles",
    "taches",
    // Administration (congés + pointage perso uniquement)
    "dashboard-admin",
    "conges",
    "pointage",
    "messagerie",
  ],
};

export function getCurrentUser(session: Session | null) {
  if (!session || !session.user) {
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email,
    nom: session.user.nom,
    prenom: session.user.prenom,
    role: session.user.role as Role,
    showroomId: session.user.showroomId,
  };
}

export function isAdmin(session: Session | null): boolean {
  if (!session || !session.user) {
    return false;
  }

  return session.user.role === "ADMIN";
}

export function requireRole(
  session: Session | null,
  roles: Role[]
): boolean {
  const user = getCurrentUser(session);

  if (!user) {
    throw new Error("Unauthorized: No user session");
  }

  if (!roles.includes(user.role)) {
    throw new Error(
      `Unauthorized: User role '${user.role}' does not have required role(s): ${roles.join(", ")}`
    );
  }

  return true;
}

export function canAccessModule(role: Role, module: Module): boolean {
  const allowedModules = roleModuleAccess[role];

  if (!allowedModules) {
    return false;
  }

  return allowedModules.includes(module);
}
