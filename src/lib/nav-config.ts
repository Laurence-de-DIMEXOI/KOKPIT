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
  Crown,
  TreePine,
  Clock,
  AlertTriangle,
  Settings,
  MessageSquare,
  Shield,
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
      { label: "Bois d'Orient", href: "/commercial/bois-dorient", icon: TreePine, module: "bois-dorient" },
      { label: "Pipeline Devis", href: "/commercial/pipeline", icon: FileText, module: "pipeline" },
      { label: "Commandes", href: "/commercial/commandes", icon: ShoppingCart, module: "commandes" },
      { label: "Traçabilité", href: "/commercial/tracabilite", icon: GitCompareArrows, module: "commandes" },
      { label: "SAV — Litiges", href: "/commercial/sav", icon: AlertTriangle, module: "sav" },
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
      { label: "Automatisations", href: "/automatisations", icon: Zap, module: "automatisations" },
      { label: "ROI Marketing", href: "/marketing/roi", icon: TrendingUp, module: "analytique" },
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
      { label: "Pointage", href: "/administration/pointage", icon: Clock, module: "pointage" },
      { label: "Pointage Équipe", href: "/administration/pointage/equipe", icon: Users, module: "pointage-equipe" },
      { label: "Permissions", href: "/administration/permissions", icon: Shield, module: "dashboard-admin" },
      { label: "Paramètres", href: "/administration/parametres", icon: Settings, module: "dashboard-admin" },
    ],
  },
  {
    id: "achat",
    label: "Achat",
    requiredModule: "catalogue",
    defaultHref: "/achat/need-price",
    menu: [
      { label: "Need Price", href: "/achat/need-price", icon: FileText, module: "need-price" },
      { label: "Calculateur", href: "/achat/calculateur", icon: Package, module: "calculateur" },
      { label: "Suivi commandes", href: "/achat/suivi-commandes", icon: ShoppingCart, module: "commandes" },
      { label: "Commandes", href: "/commercial/commandes", icon: ShoppingCart, module: "commandes" },
      { label: "SAV — Litiges", href: "/commercial/sav", icon: AlertTriangle, module: "sav" },
      { label: "Catalogue", href: "/commercial/catalogue", icon: Package, module: "catalogue" },
    ],
  },
];

// ===== MENU GÉNÉRAL (toujours visible) =====

export const MENU_GENERAL: NavItem[] = [
  { label: "Messagerie", href: "/messagerie", icon: MessageSquare, module: "messagerie" },
  { label: "Mes Tâches", href: "/commercial/taches", icon: ClipboardList, module: "taches" },
  { label: "Club Tectona", href: "/marketing/club", icon: Crown, module: "club-tectona" },
  { label: "Liens utiles", href: "/liens-utiles", icon: Link2, module: "liens-utiles" },
  { label: "Docs & Aide", href: "/docs", icon: BookOpen, module: "docs" },
];

// ===== PERSISTANCE =====

export const STORAGE_KEY = "kokpit_espace_actif";

// ===== DÉTECTION ESPACE DEPUIS URL =====

export function detectSpaceFromPath(pathname: string): string | null {
  // Pages partagées (existent dans plusieurs espaces) → null = garder l'espace courant
  const sharedPaths = [
    "/commercial/commandes",
    "/commercial/sav",
    "/commercial/catalogue",
    "/commercial/tracabilite",
    "/leads",
    "/contacts",
  ];
  if (sharedPaths.some((p) => pathname.startsWith(p))) return null;

  if (pathname.startsWith("/commercial")) return "commercial";
  if (pathname.startsWith("/achat")) return "achat";
  if (pathname.startsWith("/administration")) return "administration";
  // Marketing pages (routes legacy sans préfixe /marketing + nouvelles routes /marketing/*)
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/campagnes") ||
    pathname.startsWith("/automatisations") ||
    pathname.startsWith("/emailing") ||
    pathname.startsWith("/planning") ||
    pathname.startsWith("/liens-utiles") ||
    pathname.startsWith("/nos-reseaux") ||
    pathname.startsWith("/parametres") ||
    pathname.startsWith("/marketing")
  ) {
    return "marketing";
  }
  // Pages partagées (/docs, etc.) → null = garder l'espace courant
  return null;
}
