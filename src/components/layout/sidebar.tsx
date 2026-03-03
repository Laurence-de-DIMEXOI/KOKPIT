"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import clsx from "clsx";
import {
  LayoutDashboard,
  Inbox,
  Users,
  Megaphone,
  Zap,
  Mail,
  Settings,
  Menu,
  X,
  ShoppingCart,
  Package,
  FileText,
  TrendingUp,
  Briefcase,
  BarChart3,
  Building2,
  CalendarDays,
  UserCircle,
} from "lucide-react";
import { canAccessModule } from "@/lib/auth-utils";
import type { Module } from "@/lib/auth-utils";
import { useState, useEffect } from "react";

// ===== SPACES CONFIGURATION =====

interface SpaceConfig {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgActive: string;
  textActive: string;
  borderActive: string;
  requiredModule: Module;
  defaultHref: string; // page par défaut quand on clique sur le service
}

const SPACES: SpaceConfig[] = [
  {
    key: "commercial",
    label: "Commercial",
    icon: Briefcase,
    color: "cockpit-info",
    bgActive: "bg-cockpit-info/15",
    textActive: "text-cockpit-info",
    borderActive: "border-cockpit-info/30",
    requiredModule: "dashboard-commercial",
    defaultHref: "/commercial",
  },
  {
    key: "marketing",
    label: "Marketing",
    icon: BarChart3,
    color: "cockpit-yellow",
    bgActive: "bg-cockpit-yellow/15",
    textActive: "text-cockpit-yellow",
    borderActive: "border-cockpit-yellow/30",
    requiredModule: "dashboard",
    defaultHref: "/dashboard",
  },
  {
    key: "administration",
    label: "Administration",
    icon: Building2,
    color: "cockpit-success",
    bgActive: "bg-cockpit-success/15",
    textActive: "text-cockpit-success",
    borderActive: "border-cockpit-success/30",
    requiredModule: "dashboard-admin",
    defaultHref: "/administration",
  },
];

// ===== NAV ITEMS =====
// Chaque service a son propre menu complet

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  module: Module;
  space: string;
}

const spaceNavItems: NavItem[] = [
  // ── Commercial : flux de vente logique ──
  {
    label: "Dashboard",
    href: "/commercial",
    icon: TrendingUp,
    module: "dashboard-commercial",
    space: "commercial",
  },
  {
    label: "Demandes",
    href: "/leads",
    icon: Inbox,
    module: "leads",
    space: "commercial",
  },
  {
    label: "Contacts",
    href: "/contacts",
    icon: Users,
    module: "contacts",
    space: "commercial",
  },
  {
    label: "Pipeline Devis",
    href: "/commercial/pipeline",
    icon: FileText,
    module: "pipeline",
    space: "commercial",
  },
  {
    label: "Commandes",
    href: "/commercial/commandes",
    icon: ShoppingCart,
    module: "commandes",
    space: "commercial",
  },
  {
    label: "Catalogue",
    href: "/commercial/catalogue",
    icon: Package,
    module: "catalogue",
    space: "commercial",
  },
  // ── Marketing : acquisition → outils → config ──
  {
    label: "Tableau de bord",
    href: "/dashboard",
    icon: LayoutDashboard,
    module: "dashboard",
    space: "marketing",
  },
  {
    label: "Campagnes",
    href: "/campagnes",
    icon: Megaphone,
    module: "campagnes",
    space: "marketing",
  },
  {
    label: "Demandes",
    href: "/leads",
    icon: Inbox,
    module: "leads",
    space: "marketing",
  },
  {
    label: "Contacts",
    href: "/contacts",
    icon: Users,
    module: "contacts",
    space: "marketing",
  },
  {
    label: "Emailing",
    href: "/emailing",
    icon: Mail,
    module: "emailing",
    space: "marketing",
  },
  {
    label: "Automatisations",
    href: "/automatisations",
    icon: Zap,
    module: "automatisations",
    space: "marketing",
  },
  {
    label: "Paramètres",
    href: "/parametres",
    icon: Settings,
    module: "parametres",
    space: "marketing",
  },
  // ── Administration : RH logique ──
  {
    label: "Dashboard",
    href: "/administration",
    icon: Building2,
    module: "dashboard-admin",
    space: "administration",
  },
  {
    label: "Collaborateurs",
    href: "/administration/collaborateurs",
    icon: UserCircle,
    module: "collaborateurs",
    space: "administration",
  },
  {
    label: "Congés & Absences",
    href: "/administration/conges",
    icon: CalendarDays,
    module: "conges",
    space: "administration",
  },
];

// ===== DETECT SPACE FROM URL =====

function detectSpace(pathname: string): string {
  if (pathname.startsWith("/commercial")) return "commercial";
  if (pathname.startsWith("/administration")) return "administration";
  // Marketing pages (legacy routes sans préfixe)
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/campagnes") ||
    pathname.startsWith("/automatisations") ||
    pathname.startsWith("/emailing") ||
    pathname.startsWith("/parametres")
  ) return "marketing";
  // /leads et /contacts sont dans Commercial ET Marketing
  // On garde le space actuel (ne pas changer), fallback commercial
  return "";
}

// ===== MAIN SIDEBAR =====

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSpace, setActiveSpace] = useState<string>(() => {
    const detected = detectSpace(typeof window !== "undefined" ? window.location.pathname : "/");
    return detected || "commercial";
  });

  const userRole = session?.user?.role as any;

  // Sync space with current URL (empty = shared page, keep current space)
  useEffect(() => {
    const detected = detectSpace(pathname);
    if (detected) {
      setActiveSpace(detected);
    }
  }, [pathname]);

  // Spaces visible to this user
  const visibleSpaces = SPACES.filter((s) =>
    userRole ? canAccessModule(userRole, s.requiredModule) : false
  );

  // Space-specific nav items
  const filteredNavItems = spaceNavItems.filter(
    (item) =>
      item.space === activeSpace &&
      (userRole ? canAccessModule(userRole, item.module) : false)
  );

  // Get current space config for accent color
  const currentSpace =
    visibleSpaces.find((s) => s.key === activeSpace) || SPACES[0];

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // Switch space + navigate to its default page
  const handleSpaceSwitch = (space: SpaceConfig) => {
    setActiveSpace(space.key);
    router.push(space.defaultHref);
  };

  // Helper: is this href the exact active page?
  const isNavActive = (href: string): boolean => {
    // Dashboard pages: exact match only
    if (href === "/commercial" || href === "/administration" || href === "/dashboard") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  // Helper to render a nav link
  const renderNavLink = (
    item: NavItem,
    accentSpace: SpaceConfig
  ) => {
    const isActive = isNavActive(item.href);
    const Icon = item.icon;

    return (
      <li key={`${item.space}-${item.href}`}>
        <Link
          href={item.href}
          className={clsx(
            "flex items-center gap-3 lg:gap-4 px-3 lg:px-4 py-2.5 lg:py-3 rounded-input transition-all relative",
            isActive
              ? clsx(
                  accentSpace.bgActive,
                  "border",
                  accentSpace.borderActive,
                  accentSpace.textActive
                )
              : "text-cockpit-primary hover:text-cockpit-heading hover:bg-cockpit-dark/80"
          )}
        >
          {isActive && (
            <div
              className={clsx(
                "absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full",
                `bg-${accentSpace.color}`
              )}
            />
          )}
          <Icon className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium text-sm">{item.label}</span>
        </Link>
      </li>
    );
  };

  const sidebarContent = (
    <>
      {/* Brand Section */}
      <div className="p-5 lg:p-6 border-b border-cockpit">
        <div className="flex items-center gap-3">
          <div
            className={clsx(
              "w-10 h-10 rounded-xl",
              "border-2 border-cockpit-yellow",
              "flex items-center justify-center",
              "bg-cockpit-yellow/10"
            )}
          >
            <span className="text-cockpit-yellow font-bold text-lg">K</span>
          </div>
          <div>
            <h1 className="text-cockpit-heading font-bold text-base">
              KÒKPIT
            </h1>
            <p className="text-cockpit-secondary text-xs">Le SaaS Peï</p>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="ml-auto lg:hidden p-2 text-cockpit-secondary hover:text-cockpit-heading"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Active space label */}
      <div className="px-3 lg:px-4 pt-3 pb-1">
        <div
          className={clsx(
            "flex items-center gap-2 px-3 py-2 rounded-lg border",
            currentSpace.bgActive,
            currentSpace.textActive,
            currentSpace.borderActive
          )}
        >
          {(() => {
            const Icon = currentSpace.icon;
            return <Icon className="w-3.5 h-3.5" />;
          })()}
          <span className="text-xs font-bold">{currentSpace.label}</span>
        </div>
      </div>

      {/* Navigation — items du service actif */}
      <nav className="flex-1 overflow-y-auto pt-2 pb-4 px-3 lg:px-4">
        <ul className="space-y-0.5">
          {filteredNavItems.map((item) =>
            renderNavLink(item, currentSpace)
          )}
        </ul>
      </nav>

      {/* Space Switcher — boutons en bas */}
      {visibleSpaces.length > 1 && (
        <div className="border-t border-cockpit px-3 lg:px-4 py-3">
          <p className="text-[10px] font-semibold text-cockpit-secondary uppercase tracking-widest px-3 mb-2">
            Services
          </p>
          <div className="space-y-1">
            {visibleSpaces.map((space) => {
              const Icon = space.icon;
              const isActive = space.key === activeSpace;
              return (
                <button
                  key={space.key}
                  onClick={() => handleSpaceSwitch(space)}
                  className={clsx(
                    "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                    isActive
                      ? clsx(space.bgActive, space.textActive, "border", space.borderActive)
                      : "text-cockpit-secondary hover:text-cockpit-primary hover:bg-cockpit-dark/80 border border-transparent"
                  )}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {space.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* User Info Footer */}
      {session?.user && (
        <div className="border-t border-cockpit p-4 lg:p-5">
          <div className="flex items-center gap-3">
            <div
              className={clsx(
                "w-10 h-10 rounded-full",
                "bg-cockpit-yellow/15 flex items-center justify-center",
                "flex-shrink-0"
              )}
            >
              <span className="text-cockpit-yellow font-semibold text-sm">
                {session.user.prenom?.[0]}
                {session.user.nom?.[0]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-cockpit-primary text-sm font-medium truncate">
                {session.user.prenom} {session.user.nom}
              </p>
              <p className="text-cockpit-secondary text-xs truncate">
                {session.user.role}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Hamburger button - mobile only */}
      <button
        onClick={() => setMobileOpen(true)}
        className={clsx(
          "fixed top-4 left-4 z-50 lg:hidden",
          "p-2 rounded-lg",
          "bg-cockpit-dark border border-cockpit",
          "text-cockpit-primary hover:text-cockpit-heading",
          "transition-colors",
          mobileOpen && "hidden"
        )}
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar mobile (drawer) */}
      <div
        className={clsx(
          "fixed left-0 top-0 h-screen w-[280px] z-50",
          "bg-cockpit-dark border-r border-cockpit",
          "flex flex-col",
          "lg:hidden",
          "transition-transform duration-300 ease-in-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </div>

      {/* Sidebar desktop - always visible on lg+ */}
      <div
        className={clsx(
          "hidden lg:flex",
          "fixed left-0 top-0 h-screen w-[280px]",
          "bg-cockpit-dark border-r border-cockpit",
          "flex-col"
        )}
      >
        {sidebarContent}
      </div>
    </>
  );
}
