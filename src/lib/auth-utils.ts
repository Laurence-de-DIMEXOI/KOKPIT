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
  | "parametres";

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
  ],
  MARKETING: [
    "dashboard",
    "leads",
    "contacts",
    "campagnes",
    "emailing",
    "automatisations",
  ],
  COMMERCIAL: ["dashboard", "leads", "contacts", "devis", "ventes"],
  DIRECTION: ["dashboard", "campagnes", "analytique"],
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
