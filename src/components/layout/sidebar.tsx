"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { X, ChevronDown, ChevronRight } from "lucide-react";
import clsx from "clsx";
import { NAV_CATEGORIES, type NavCategory, type NavItem } from "@/lib/nav-config";
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

function useSlaOverdue() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let mounted = true;
    const poll = async () => {
      try {
        const res = await fetch("/api/leads/sla-overdue");
        if (res.ok && mounted) {
          const data = await res.json();
          setCount(data.count || 0);
        }
      } catch { /* silencieux */ }
    };
    poll();
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") poll();
    }, 60000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);
  return count;
}

function useDemandesNonTraitees() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let mounted = true;
    const poll = async () => {
      try {
        const res = await fetch("/api/notifications");
        if (res.ok && mounted) {
          const data = await res.json();
          const item = (data.items || []).find((n: { type: string }) => n.type === "demande_non_traitee");
          setCount(item ? parseInt(item.message) || 0 : 0);
        }
      } catch { /* silencieux */ }
    };
    poll();
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") poll();
    }, 5 * 60 * 1000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);
  return count;
}

// ===== PROPS =====

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({ mobileOpen, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = session?.user?.role as Role | undefined;
  const userOverrides = (session?.user as any)?.moduleAccessOverrides as Record<string, boolean> | null | undefined;
  const unreadMessages = useUnreadMessages();
  const slaOverdue = useSlaOverdue();
  const demandesNonTraitees = useDemandesNonTraitees();

  // Catégories collapsed/expanded — défaut: toutes ouvertes
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggleCategory = (id: string) => {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Helper: lien actif ?
  const isNavActive = (href: string): boolean => {
    if (href === "/commercial" || href === "/administration" || href === "/dashboard") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  // Filtrer les catégories par permissions
  const visibleCategories = NAV_CATEGORIES.map((cat) => ({
    ...cat,
    items: cat.items.filter((item) =>
      !userRole || canAccessModule(userRole, item.module, userOverrides)
    ),
  })).filter((cat) => cat.items.length > 0);

  // Render un lien de navigation
  const renderNavLink = (item: NavItem, catColor: string) => {
    const isActive = isNavActive(item.href);
    const Icon = item.icon;

    return (
      <li key={item.href}>
        <Link
          href={item.href}
          onClick={onCloseMobile}
          className={clsx(
            "flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-all text-[13px] relative",
            isActive
              ? "font-semibold"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          )}
          style={isActive ? {
            backgroundColor: `${catColor}15`,
            color: catColor,
            borderLeft: `3px solid ${catColor}`,
          } : undefined}
        >
          <Icon className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1 truncate">{item.label}</span>
          {item.href === "/messagerie" && unreadMessages > 0 && (
            <span className="ml-auto min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1">
              {unreadMessages > 99 ? "99+" : unreadMessages}
            </span>
          )}
          {item.href === "/leads" && (slaOverdue > 0 || demandesNonTraitees > 0) && (
            <span className={`ml-auto min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-white text-[10px] font-bold px-1 ${demandesNonTraitees > 0 ? "bg-red-500" : "bg-orange-500"}`}>
              {demandesNonTraitees > 0
                ? (demandesNonTraitees > 99 ? "99+" : demandesNonTraitees)
                : (slaOverdue > 99 ? "99+" : slaOverdue)}
            </span>
          )}
        </Link>
      </li>
    );
  };

  // Render une catégorie
  const renderCategory = (cat: NavCategory & { items: NavItem[] }) => {
    const isCollapsed = collapsed[cat.id] || false;
    const hasActiveItem = cat.items.some((item) => isNavActive(item.href));

    return (
      <div key={cat.id} className="mb-1">
        {/* Header catégorie */}
        <button
          onClick={() => toggleCategory(cat.id)}
          className="w-full flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors hover:bg-gray-50 rounded-lg"
          style={{ color: cat.color }}
        >
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: cat.color }}
          />
          <span className="flex-1 text-left">{cat.label}</span>
          {isCollapsed ? (
            <ChevronRight className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
          {isCollapsed && hasActiveItem && (
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: cat.color }}
            />
          )}
        </button>

        {/* Items */}
        {!isCollapsed && (
          <ul className="space-y-0.5 mt-0.5">
            {cat.items.map((item) => renderNavLink(item, cat.color))}
          </ul>
        )}
      </div>
    );
  };

  const sidebarContent = (
    <>
      {/* Menu catégories */}
      <nav className="flex-1 overflow-y-auto px-2 pt-3 pb-2">
        {visibleCategories.map(renderCategory)}
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
          "fixed left-0 top-0 h-screen w-[240px] z-50",
          "bg-white border-r border-gray-200",
          "flex flex-col",
          "lg:hidden",
          "transition-transform duration-300 ease-in-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Mobile header: Logo + close */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg border-2 border-cockpit-yellow flex items-center justify-center bg-cockpit-yellow/10">
              <span className="text-cockpit-yellow font-bold text-xs">K</span>
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

        {sidebarContent}
      </div>

      {/* Desktop sidebar */}
      <aside
        className={clsx(
          "hidden lg:flex lg:flex-col",
          "fixed left-0 top-12 bottom-0 w-[200px]",
          "bg-white border-r border-gray-200",
          "overflow-hidden"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
