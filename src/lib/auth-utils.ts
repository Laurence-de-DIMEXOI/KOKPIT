import type { Session } from "next-auth";

export type Role = "ADMIN" | "MARKETING" | "COMMERCIAL" | "DIRECTION";

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
  | "nos-reseaux";

const roleModuleAccess: Record<Role, Module[]> = {
  ADMIN: [
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
    "dashboard-admin",
    "conges",
    "collaborateurs",
    "planning",
    "liens-utiles",
    "nos-reseaux",
  ],
  MARKETING: [
    "dashboard",
    "leads",
    "contacts",
    "campagnes",
    "emailing",
    "automatisations",
    "planning",
    "liens-utiles",
    "nos-reseaux",
  ],
  COMMERCIAL: [
    "dashboard-commercial",
    "pipeline",
    "catalogue",
    "commandes",
    "leads",
    "contacts",
  ],
  DIRECTION: [
    "dashboard",
    "dashboard-commercial",
    "campagnes",
    "pipeline",
    "analytique",
    "dashboard-admin",
    "conges",
    "collaborateurs",
    "planning",
    "liens-utiles",
    "nos-reseaux",
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
