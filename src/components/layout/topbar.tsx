"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useSession, signOut } from "next-auth/react";
import { Menu, LogOut, User, ChevronDown, Lock } from "lucide-react";
import clsx from "clsx";
import Link from "next/link";
import { NotificationBell } from "./notification-bell";
import { GlobalSearch } from "./global-search";
import type { Espace } from "@/lib/nav-config";

function getSalutation(prenom: string): string {
  const heure = new Date().getHours();
  if (heure >= 5 && heure < 13) return `Bonjour ${prenom} ☀️`;
  if (heure >= 13 && heure < 18) return `Bonne après-midi ${prenom}`;
  if (heure >= 18 && heure < 22) return `Bonne soirée ${prenom} 🌙`;
  return `Bonsoir ${prenom}`;
}

interface TopbarProps {
  activeSpaceId: string;
  visibleSpaces: Espace[];
  showTabs: boolean;
  onSwitchSpace: (id: string) => void;
  onOpenMobileMenu: () => void;
}

export function Topbar({
  activeSpaceId,
  visibleSpaces,
  showTabs,
  onSwitchSpace,
  onOpenMobileMenu,
}: TopbarProps) {
  const { data: session } = useSession();
  const [avatarOpen, setAvatarOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);
  const salutation = useMemo(
    () => getSalutation(session?.user?.prenom || ""),
    [session?.user?.prenom]
  );

  // Fermer le dropdown avatar au clic extérieur
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-12 bg-white border-b border-gray-200 flex items-center px-4">
      {/* Left: Hamburger mobile + Logo */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-1.5 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg border-2 border-cockpit-yellow flex items-center justify-center bg-cockpit-yellow/10">
            <span className="text-cockpit-yellow font-bold text-sm">K</span>
          </div>
          <span className="text-gray-900 font-bold text-sm hidden sm:inline">
            KOKPIT
          </span>
        </Link>
      </div>

      {/* Center: Space Tabs */}
      {showTabs && (
        <nav className="hidden lg:flex items-center gap-1 ml-8">
          {visibleSpaces.map((espace) => {
            const isActive = espace.id === activeSpaceId;
            const isDisabled = espace.disabled;

            if (isDisabled) {
              return (
                <div
                  key={espace.id}
                  className="relative group px-3 py-3 text-sm text-gray-300 cursor-not-allowed flex items-center gap-1.5"
                >
                  {espace.label}
                  <Lock className="w-3 h-3" />
                  {/* Tooltip */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    {espace.disabledTooltip}
                  </div>
                </div>
              );
            }

            return (
              <button
                key={espace.id}
                onClick={() => onSwitchSpace(espace.id)}
                className={clsx(
                  "px-3 py-3 text-sm font-medium transition-colors relative",
                  isActive
                    ? "font-semibold"
                    : "text-gray-500 hover:text-gray-800"
                )}
                style={isActive ? { color: 'var(--color-active)' } : undefined}
              >
                {espace.label}
                {/* Indicateur actif — barre colorée en bas */}
                {isActive && (
                  <div className="absolute bottom-0 left-0.5 right-0.5 h-[3px] rounded-full" style={{ backgroundColor: 'var(--color-active)', boxShadow: '0 1px 6px var(--color-active-border)' }} />
                )}
              </button>
            );
          })}
        </nav>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right: Search + Notifications + Avatar */}
      <div className="flex items-center gap-2">
        {session?.user?.prenom && (
          <span className="hidden lg:inline text-sm text-gray-500">
            {salutation}
          </span>
        )}
        <div className="hidden md:block">
          <GlobalSearch />
        </div>
        <NotificationBell />

        {/* Avatar + Dropdown */}
        {session?.user && (
          <div ref={avatarRef} className="relative">
            <button
              onClick={() => setAvatarOpen(!avatarOpen)}
              className={clsx(
                "flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors",
                "hover:bg-gray-100",
                avatarOpen && "bg-gray-100"
              )}
            >
              <div className="w-8 h-8 rounded-full bg-cockpit-yellow/15 flex items-center justify-center flex-shrink-0">
                <span className="text-cockpit-yellow font-semibold text-xs">
                  {session.user.prenom?.[0]}
                  {session.user.nom?.[0]}
                </span>
              </div>
              <span className="hidden sm:inline text-sm font-medium text-gray-700 max-w-[120px] truncate">
                {session.user.prenom} {session.user.nom?.[0]}.
              </span>
              <ChevronDown
                className={clsx(
                  "w-3.5 h-3.5 text-gray-400 transition-transform hidden sm:block",
                  avatarOpen && "rotate-180"
                )}
              />
            </button>

            {/* Dropdown menu */}
            {avatarOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50">
                <div className="px-3 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {session.user.prenom} {session.user.nom}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {session.user.role}
                  </p>
                </div>
                <Link
                  href="/parametres"
                  onClick={() => setAvatarOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <User className="w-4 h-4" />
                  Mon Profil
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                >
                  <LogOut className="w-4 h-4" />
                  Déconnexion
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
