"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";
import { canAccessModule } from "@/lib/auth-utils";
import type { Module } from "@/lib/auth-utils";
import { useState, useEffect } from "react";

type Space = "marketing" | "commercial";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  module: Module;
  space: Space;
}

const navItems: NavItem[] = [
  // ── Marketing ──
  {
    label: "Tableau de bord",
    href: "/dashboard",
    icon: LayoutDashboard,
    module: "dashboard",
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
    label: "Campagnes",
    href: "/campagnes",
    icon: Megaphone,
    module: "campagnes",
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
    label: "Emailing",
    href: "/emailing",
    icon: Mail,
    module: "emailing",
    space: "marketing",
  },
  {
    label: "Paramètres",
    href: "/parametres",
    icon: Settings,
    module: "parametres",
    space: "marketing",
  },
  // ── Commercial ──
  {
    label: "Dashboard",
    href: "/commercial",
    icon: TrendingUp,
    module: "dashboard-commercial",
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
    label: "Catalogue",
    href: "/commercial/catalogue",
    icon: Package,
    module: "catalogue",
    space: "commercial",
  },
  {
    label: "Commandes",
    href: "/commercial/commandes",
    icon: ShoppingCart,
    module: "commandes",
    space: "commercial",
  },
  // Shared items visible in Commercial space too
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
];

function detectSpace(pathname: string): Space {
  if (pathname.startsWith("/commercial")) return "commercial";
  return "marketing";
}

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSpace, setActiveSpace] = useState<Space>(() =>
    detectSpace(typeof window !== "undefined" ? window.location.pathname : "/")
  );

  const userRole = session?.user?.role as any;

  // Sync space with current URL
  useEffect(() => {
    setActiveSpace(detectSpace(pathname));
  }, [pathname]);

  // Filter nav items by current space AND role access
  const filteredNavItems = navItems.filter(
    (item) =>
      item.space === activeSpace &&
      (userRole ? canAccessModule(userRole, item.module) : false)
  );

  // Check if user can see the other space
  const canSeeMarketing = userRole
    ? canAccessModule(userRole, "dashboard")
    : false;
  const canSeeCommercial = userRole
    ? canAccessModule(userRole, "dashboard-commercial")
    : false;
  const showSpaceToggle = canSeeMarketing && canSeeCommercial;

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

  const sidebarContent = (
    <>
      {/* Brand Section */}
      <div className="p-6 lg:p-8 border-b border-cockpit">
        <div className="flex items-center gap-4">
          <div
            className={clsx(
              "w-10 h-10 lg:w-12 lg:h-12 rounded-xl",
              "border-2 border-cockpit-yellow",
              "flex items-center justify-center",
              "bg-cockpit-yellow/10"
            )}
          >
            <span className="text-cockpit-yellow font-bold text-lg lg:text-xl">
              K
            </span>
          </div>
          <div>
            <h1 className="text-cockpit-heading font-bold text-base lg:text-lg">
              KÒKPIT
            </h1>
            <p className="text-cockpit-secondary text-xs">Le SaaS Peï</p>
          </div>
          {/* Close button on mobile */}
          <button
            onClick={() => setMobileOpen(false)}
            className="ml-auto lg:hidden p-2 text-cockpit-secondary hover:text-cockpit-heading"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Space Toggle */}
      {showSpaceToggle && (
        <div className="px-3 lg:px-4 pt-4 pb-2">
          <div className="flex bg-cockpit-dark rounded-lg border border-cockpit p-1">
            <button
              onClick={() => setActiveSpace("marketing")}
              className={clsx(
                "flex-1 py-2 px-3 rounded-md text-xs font-semibold transition-all",
                activeSpace === "marketing"
                  ? "bg-cockpit-yellow/15 text-cockpit-yellow border border-cockpit-yellow/30"
                  : "text-cockpit-secondary hover:text-cockpit-primary"
              )}
            >
              Marketing
            </button>
            <button
              onClick={() => setActiveSpace("commercial")}
              className={clsx(
                "flex-1 py-2 px-3 rounded-md text-xs font-semibold transition-all",
                activeSpace === "commercial"
                  ? "bg-cockpit-info/15 text-cockpit-info border border-cockpit-info/30"
                  : "text-cockpit-secondary hover:text-cockpit-primary"
              )}
            >
              Commercial
            </button>
          </div>
        </div>
      )}

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto py-4 lg:py-6 px-3 lg:px-4">
        <ul className="space-y-1 lg:space-y-2">
          {filteredNavItems.map((item) => {
            const isActive =
              item.href === "/commercial"
                ? pathname === "/commercial"
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            const accentColor =
              activeSpace === "commercial"
                ? "cockpit-info"
                : "cockpit-yellow";

            return (
              <li key={`${item.space}-${item.href}`}>
                <Link
                  href={item.href}
                  className={clsx(
                    "flex items-center gap-3 lg:gap-4 px-3 lg:px-4 py-3 lg:py-4 rounded-input transition-all relative",
                    isActive
                      ? clsx(
                          `bg-${accentColor}/15 border border-${accentColor}/30`,
                          `text-${accentColor}`
                        )
                      : clsx(
                          "text-cockpit-primary",
                          "hover:text-cockpit-heading hover:bg-cockpit-dark/80"
                        )
                  )}
                >
                  {isActive && (
                    <div
                      className={clsx(
                        "absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full",
                        `bg-${accentColor}`
                      )}
                    />
                  )}
                  <Icon className="w-5 h-5 lg:w-6 lg:h-6 flex-shrink-0" />
                  <span className="font-medium text-sm">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Info Footer */}
      {session?.user && (
        <div className="border-t border-cockpit p-4 lg:p-6">
          <div className="flex items-center gap-3 lg:gap-4">
            <div
              className={clsx(
                "w-10 h-10 lg:w-12 lg:h-12 rounded-full",
                "bg-cockpit-yellow/15 flex items-center justify-center",
                "flex-shrink-0"
              )}
            >
              <span className="text-cockpit-yellow font-semibold text-sm lg:text-base">
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
