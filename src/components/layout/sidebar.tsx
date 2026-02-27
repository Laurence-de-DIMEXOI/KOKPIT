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
} from "lucide-react";
import { canAccessModule } from "@/lib/auth-utils";
import type { Module } from "@/lib/auth-utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  module: Module;
}

const navItems: NavItem[] = [
  {
    label: "Tableau de bord",
    href: "/dashboard",
    icon: LayoutDashboard,
    module: "dashboard",
  },
  {
    label: "Demandes",
    href: "/leads",
    icon: Inbox,
    module: "leads",
  },
  {
    label: "Contacts",
    href: "/contacts",
    icon: Users,
    module: "contacts",
  },
  {
    label: "Campagnes",
    href: "/campagnes",
    icon: Megaphone,
    module: "campagnes",
  },
  {
    label: "Automatisations",
    href: "/automatisations",
    icon: Zap,
    module: "automatisations",
  },
  {
    label: "Emailing",
    href: "/emailing",
    icon: Mail,
    module: "emailing",
  },
  {
    label: "Paramètres",
    href: "/parametres",
    icon: Settings,
    module: "parametres",
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const userRole = session?.user?.role as any;

  const filteredNavItems = navItems.filter((item) =>
    userRole ? canAccessModule(userRole, item.module) : false
  );

  return (
    <div className={clsx(
      "fixed left-0 top-0 h-screen w-[280px]",
      "bg-cockpit-dark border-r border-cockpit",
      "flex flex-col"
    )}>
      {/* Brand Section */}
      <div className={clsx(
        "p-8 border-b border-cockpit"
      )}>
        <div className="flex items-center gap-4">
          <div className={clsx(
            "w-12 h-12 rounded-xl",
            "border-2 border-cockpit-yellow",
            "flex items-center justify-center",
            "bg-cockpit-yellow/10"
          )}>
            <span className="text-cockpit-yellow font-bold text-xl">K</span>
          </div>
          <div>
            <h1 className="text-cockpit-heading font-bold text-lg">KÒKPIT</h1>
            <p className="text-cockpit-secondary text-xs">Le SaaS Peï</p>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto py-8 px-4">
        <ul className="space-y-2">
          {filteredNavItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={clsx(
                    "flex items-center gap-4 px-4 py-4 rounded-input transition-all relative",
                    isActive
                      ? clsx(
                          "bg-cockpit-yellow/15 border border-cockpit-yellow/30",
                          "text-cockpit-yellow"
                        )
                      : clsx(
                          "text-cockpit-primary",
                          "hover:text-cockpit-heading hover:bg-cockpit-dark/80"
                        )
                  )}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-cockpit-yellow rounded-full" />
                  )}
                  <Icon className="w-6 h-6 flex-shrink-0" />
                  <span className="font-medium text-sm">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Info Footer */}
      {session?.user && (
        <div className={clsx(
          "border-t border-cockpit p-6"
        )}>
          <div className="flex items-center gap-4">
            <div className={clsx(
              "w-12 h-12 rounded-full",
              "bg-cockpit-yellow/15 flex items-center justify-center",
              "flex-shrink-0"
            )}>
              <span className="text-cockpit-yellow font-semibold text-base">
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
    </div>
  );
}
