import {
  LayoutDashboard,
  Inbox,
  Users,
  Megaphone,
  Mail,
  Package,
  FileText,
  TrendingUp,
  CalendarDays,
  GitCompareArrows,
  BookOpen,
  ClipboardList,
  Crown,
  TreePine,
  Clock,
  AlertTriangle,
  Settings,
  Calculator,
  Truck,
  Sparkles,
  Ruler,
} from "lucide-react";
import type { Module } from "@/lib/auth-utils";

// ===== TYPES =====

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  module: Module;
}

export interface NavCategory {
  id: string;
  label: string;
  color: string; // couleur du header de catégorie
  items: NavItem[];
  defaultCollapsed?: boolean; // repliée par défaut (ex: Ressources)
}

// ===== MENU UNIQUE — TOUTES LES PAGES =====

export const NAV_CATEGORIES: NavCategory[] = [
  {
    id: "commercial",
    label: "Commercial",
    color: "#4C9DB0",
    items: [
      { label: "Tableau de bord", href: "/commercial", icon: TrendingUp, module: "dashboard-commercial" },
      { label: "Demandes", href: "/leads", icon: Inbox, module: "leads" },
      { label: "Contacts", href: "/contacts", icon: Users, module: "contacts" },
      { label: "Traçabilité", href: "/commercial/tracabilite", icon: GitCompareArrows, module: "commandes" },
      { label: "SAV — Litiges", href: "/commercial/sav", icon: AlertTriangle, module: "sav" },
      { label: "Sur-Mesure", href: "/commercial/sur-mesure", icon: Ruler, module: "sur-mesure" },
      { label: "Catalogue", href: "/commercial/catalogue", icon: Package, module: "catalogue" },
    ],
  },
  {
    id: "marketing",
    label: "Marketing",
    color: "#E36887",
    items: [
      { label: "Tableau de bord", href: "/marketing", icon: LayoutDashboard, module: "dashboard" },
      { label: "Campagnes", href: "/campagnes", icon: Megaphone, module: "campagnes" },
      { label: "Emailing", href: "/emailing", icon: Mail, module: "emailing" },
      { label: "Planning", href: "/planning", icon: CalendarDays, module: "planning" },
      { label: "Opérations", href: "/marketing/operations", icon: Sparkles, module: "operations-marketing" },
      { label: "ROI Marketing", href: "/marketing/roi", icon: TrendingUp, module: "analytique" },
    ],
  },
  {
    id: "achat",
    label: "Achat",
    color: "#CBA1D4",
    items: [
      { label: "Need Price", href: "/achat/need-price", icon: FileText, module: "need-price" },
      { label: "Calculateur", href: "/achat/calculateur", icon: Calculator, module: "calculateur" },
      { label: "Suivi commandes", href: "/achat/suivi-commandes", icon: Truck, module: "suivi-commandes" },
      { label: "Prévisionnel", href: "/achat/previsionnel", icon: TrendingUp, module: "previsionnel" },
    ],
  },
  {
    id: "administration",
    label: "Administration",
    color: "#F17142",
    items: [
      { label: "Congés & Absences", href: "/administration/conges", icon: CalendarDays, module: "conges" },
      { label: "Pointage", href: "/administration/pointage", icon: Clock, module: "pointage" },
      { label: "Pointage Équipe", href: "/administration/pointage/equipe", icon: Users, module: "pointage-equipe" },
      { label: "Paramètres", href: "/administration/parametres", icon: Settings, module: "parametres" },
    ],
  },
  {
    id: "general",
    label: "Général",
    color: "#F4B400",
    items: [
      { label: "Mes Tâches", href: "/commercial/taches", icon: ClipboardList, module: "taches" },
      { label: "Club Tectona", href: "/marketing/club", icon: Crown, module: "club-tectona" },
    ],
  },
  {
    id: "ressources",
    label: "Ressources",
    color: "#8592A3",
    defaultCollapsed: true,
    items: [
      { label: "Bois d'Orient", href: "/commercial/bois-dorient", icon: TreePine, module: "bois-dorient" },
      { label: "Docs & Aide", href: "/docs", icon: BookOpen, module: "docs" },
    ],
  },
];

// ===== DÉTECTION COULEUR DEPUIS URL =====

export function detectColorFromPath(pathname: string): string {
  if (pathname.startsWith("/commercial") || pathname.startsWith("/leads") || pathname.startsWith("/contacts")) return "#4C9DB0";
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/campagnes") || pathname.startsWith("/emailing") || pathname.startsWith("/planning") || pathname.startsWith("/marketing")) return "#E36887";
  if (pathname.startsWith("/achat")) return "#CBA1D4";
  if (pathname.startsWith("/administration") || pathname.startsWith("/parametres")) return "#F17142";
  return "#F4B400"; // Général
}

export function detectEspaceFromPath(pathname: string): string {
  if (pathname.startsWith("/commercial") || pathname.startsWith("/leads") || pathname.startsWith("/contacts")) return "commercial";
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/campagnes") || pathname.startsWith("/emailing") || pathname.startsWith("/planning") || pathname.startsWith("/marketing")) return "marketing";
  if (pathname.startsWith("/achat")) return "achat";
  if (pathname.startsWith("/administration") || pathname.startsWith("/parametres")) return "administration";
  return "general";
}
