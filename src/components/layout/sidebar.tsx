"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { X, Lock } from "lucide-react";
import clsx from "clsx";
import type { Espace, NavItem } from "@/lib/nav-config";
import { MENU_GENERAL } from "@/lib/nav-config";
import { canAccessModule } from "@/lib/auth-utils";
import type { Role } from "@/lib/auth-utils";

function useUnreadMessages() {
  const [total, setTotal] = useState(0);
  useEffect(() => {
    let mounted = true;
    const poll = async () => {
      try {
        const res = await fetch("/api/messagerie/unread");
        if (res.ok && mounted) {
          const data = await res.json();
          setTotal(data.total || 0);
        }
      } catch { /* silencieux */ }
    };
    poll();
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") poll();
    }, 15000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);
  return total;
}

// ===== PROPS =====

interface SidebarProps {
  activeSpaceId: string;
  currentSpace: Espace | undefined;
  menuItems: NavItem[];
  generalItems: NavItem[];
  // Mobile
  mobileOpen: boolean;
  onCloseMobile: () => void;
  // Onglets espaces dans le drawer mobile
  showTabs: boolean;
  visibleSpaces: Espace[];
  onSwitchSpace: (id: string) => void;
}

export function Sidebar({
  activeSpaceId,
  currentSpace,
  menuItems,
  generalItems,
  mobileOpen,
  onCloseMobile,
  showTabs,
  visibleSpaces,
  onSwitchSpace,
}: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = session?.user?.role as Role | undefined;
  const userOverrides = (session?.user as any)?.moduleAccessOverrides as Record<string, boolean> | null | undefined;
  const unreadMessages = useUnreadMessages();

  // Filtrer MENU_GENERAL par rôle + overrides utilisateur
  const generalNav = generalItems.length > 0
    ? generalItems
    : userRole
      ? MENU_GENERAL.filter((item) => canAccessModule(userRole, item.module, userOverrides))
      : [];

  // Helper: lien actif ?
  const isNavActive = (href: string): boolean => {
    // Dashboard pages: exact match
    if (href === "/commercial" || href === "/administration" || href === "/dashboard") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  // Render un lien de navigation
  const renderNavLink = (item: NavItem) => {
    const isActive = isNavActive(item.href);
    const Icon = item.icon;

    return (
      <li key={`${activeSpaceId}-${item.href}`}>
        <Link
          href={item.href}
          onClick={onCloseMobile}
          className={clsx(
            "flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm relative",
            isActive
              ? "font-semibold"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          )}
          style={isActive ? {
            backgroundColor: 'var(--color-active-light)',
            color: 'var(--color-active)',
            borderLeft: '4px solid var(--color-active)',
            boxShadow: '0 1px 3px var(--color-active-border)',
          } : undefined}
        >
          <Icon className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1">{item.label}</span>
          {item.href === "/messagerie" && unreadMessages > 0 && (
            <span className="ml-auto min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1">
              {unreadMessages > 99 ? "99+" : unreadMessages}
            </span>
          )}
        </Link>
      </li>
    );
  };

  const sidebarContent = (
    <>
      {/* Espace actif — badge */}
      {currentSpace && (
        <div className="px-3 pt-4 pb-2">
          <div
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold"
            style={{
              backgroundColor: 'var(--color-active-light)',
              color: 'var(--color-active)',
              borderLeft: '4px solid var(--color-active)',
              boxShadow: '0 1px 4px var(--color-active-border)',
            }}
          >
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'var(--color-active)' }} />
            {currentSpace.label}
          </div>
        </div>
      )}

      {/* Menu items de l'espace actif */}
      <nav className="flex-1 overflow-y-auto px-3 pt-1 pb-2">
        <ul className="space-y-0.5">
          {menuItems
            .filter((item) => !userRole || canAccessModule(userRole, item.module, userOverrides))
            .map(renderNavLink)}
        </ul>

        {/* Séparateur + Général */}
        {generalNav.length > 0 && (
          <>
            <div className="border-t border-gray-200 my-3" />
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 mb-2">
              Général
            </p>
            <ul className="space-y-0.5">
              {generalNav.map(renderNavLink)}
            </ul>
          </>
        )}
      </nav>

      {/* Footer — user compact */}
      {session?.user && (
        <div className="border-t border-gray-200 p-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-cockpit-yellow/15 flex items-center justify-center flex-shrink-0">
              <span className="text-cockpit-yellow font-semibold text-xs">
                {session.user.prenom?.[0]}
                {session.user.nom?.[0]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-gray-700 text-xs font-medium truncate">
                {session.user.prenom} {session.user.nom}
              </p>
              <p className="text-gray-400 text-[10px] truncate">
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
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm"
          onClick={onCloseMobile}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={clsx(
          "fixed left-0 top-0 h-screen w-[280px] z-50",
          "bg-white border-r border-gray-200",
          "flex flex-col",
          "lg:hidden",
          "transition-transform duration-300 ease-in-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Mobile header: Logo + close */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg border-2 border-cockpit-yellow flex items-center justify-center bg-cockpit-yellow/10">
              <span className="text-cockpit-yellow font-bold text-sm">K</span>
            </div>
            <span className="text-gray-900 font-bold text-sm">KOKPIT</span>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile: Space tabs (si showTabs) */}
        {showTabs && (
          <div className="px-3 pt-3 pb-1 flex flex-wrap gap-1">
            {visibleSpaces.map((espace) => {
              const isActive = espace.id === activeSpaceId;
              const isDisabled = espace.disabled;

              if (isDisabled) {
                return (
                  <div
                    key={espace.id}
                    className="px-3 py-1.5 text-xs text-gray-300 cursor-not-allowed flex items-center gap-1 rounded-lg"
                  >
                    {espace.label}
                    <Lock className="w-3 h-3" />
                  </div>
                );
              }

              return (
                <button
                  key={espace.id}
                  onClick={() => onSwitchSpace(espace.id)}
                  className={clsx(
                    "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border",
                    isActive
                      ? "font-semibold"
                      : "text-gray-500 hover:text-gray-800 hover:bg-gray-100 border-transparent"
                  )}
                  style={isActive ? {
                    backgroundColor: 'var(--color-active-light)',
                    color: 'var(--color-active)',
                    borderColor: 'var(--color-active-border)',
                  } : undefined}
                >
                  {espace.label}
                </button>
              );
            })}
          </div>
        )}

        {sidebarContent}
      </div>

      {/* Desktop sidebar — toujours visible sur lg+ */}
      <aside
        className={clsx(
          "hidden lg:flex",
          "fixed left-0 top-12 h-[calc(100vh-48px)] w-[200px]",
          "bg-white border-r border-gray-200",
          "flex-col"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
