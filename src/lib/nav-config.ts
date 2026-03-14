import {
  LayoutDashboard,
  Inbox,
  Users,
  Megaphone,
  Zap,
  Mail,
  ShoppingCart,
  Package,
  FileText,
  TrendingUp,
  Building2,
  CalendarDays,
  UserCircle,
  Link2,
  GitCompareArrows,
  Share2,
  BookOpen,
  ClipboardList,
} from "lucide-react";
import type { Module } from "@/lib/auth-utils";

// ===== TYPES =====

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  module: Module;
}

export interface Espace {
  id: string;
  label: string;
  disabled?: boolean;
  disabledTooltip?: string;
  requiredModule: Module;
  defaultHref: string;
  menu: NavItem[];
}

// ===== ESPACES =====

export const ESPACES: Espace[] = [
  {
    id: "commercial",
    label: "Commercial",
    requiredModule: "dashboard-commercial",
    defaultHref: "/commercial",
    menu: [
      { label: "Tableau de bord", href: "/commercial", icon: TrendingUp, module: "dashboard-commercial" },
      { label: "Demandes", href: "/leads", icon: Inbox, module: "leads" },
      { label: "Contacts", href: "/contacts", icon: Users, module: "contacts" },
      { label: "Pipeline Devis", href: "/commercial/pipeline", icon: FileText, module: "pipeline" },
      { label: "Commandes", href: "/commercial/commandes", icon: ShoppingCart, module: "commandes" },
      { label: "Traçabilité", href: "/commercial/tracabilite", icon: GitCompareArrows, module: "commandes" },
      { label: "Mes Tâches", href: "/commercial/taches", icon: ClipboardList, module: "taches" },
      { label: "Catalogue", href: "/commercial/catalogue", icon: Package, module: "catalogue" },
    ],
  },
  {
    id: "marketing",
    label: "Marketing",
    requiredModule: "dashboard",
    defaultHref: "/dashboard",
    menu: [
      { label: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard, module: "dashboard" },
      { label: "Campagnes", href: "/campagnes", icon: Megaphone, module: "campagnes" },
      { label: "Demandes", href: "/leads", icon: Inbox, module: "leads" },
      { label: "Contacts", href: "/contacts", icon: Users, module: "contacts" },
      { label: "Emailing", href: "/emailing", icon: Mail, module: "emailing" },
      { label: "Planning", href: "/planning", icon: CalendarDays, module: "planning" },
      { label: "Nos Réseaux", href: "/nos-reseaux", icon: Share2, module: "nos-reseaux" },
      { label: "Liens utiles", href: "/liens-utiles", icon: Link2, module: "liens-utiles" },
      { label: "Automatisations", href: "/automatisations", icon: Zap, module: "automatisations" },
    ],
  },
  {
    id: "administration",
    label: "Administration",
    requiredModule: "dashboard-admin",
    defaultHref: "/administration",
    menu: [
      { label: "Tableau de bord", href: "/administration", icon: Building2, module: "dashboard-admin" },
      { label: "Collaborateurs", href: "/administration/collaborateurs", icon: UserCircle, module: "collaborateurs" },
      { label: "Congés & Absences", href: "/administration/conges", icon: CalendarDays, module: "conges" },
    ],
  },
  {
    id: "achat",
    label: "Achat",
    disabled: true,
    disabledTooltip: "Bientôt disponible",
    requiredModule: "dashboard",
    defaultHref: "#",
    menu: [],
  },
];

// ===== MENU GÉNÉRAL (toujours visible) =====

export const MENU_GENERAL: NavItem[] = [
  { label: "Docs & Aide", href: "/docs", icon: BookOpen, module: "docs" },
];

// ===== PERSISTANCE =====

export const STORAGE_KEY = "kokpit_espace_actif";

// ===== DÉTECTION ESPACE DEPUIS URL =====

export function detectSpaceFromPath(pathname: string): string | null {
  if (pathname.startsWith("/commercial")) return "commercial";
  if (pathname.startsWith("/administration")) return "administration";
  // Marketing pages (routes legacy sans préfixe /marketing)
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/campagnes") ||
    pathname.startsWith("/automatisations") ||
    pathname.startsWith("/emailing") ||
    pathname.startsWith("/planning") ||
    pathname.startsWith("/liens-utiles") ||
    pathname.startsWith("/nos-reseaux") ||
    pathname.startsWith("/parametres")
  ) {
    return "marketing";
  }
  // Pages partagées (/leads, /contacts, /docs) → null = garder l'espace courant
  return null;
}
