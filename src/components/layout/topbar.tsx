"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useSession, signOut } from "next-auth/react";
import { Menu, LogOut, User, ChevronDown } from "lucide-react";
import Link from "next/link";
import { NotificationBell } from "./notification-bell";
import { GlobalSearch } from "./global-search";

function getSalutation(prenom: string): string {
  const heure = new Date().getHours();
  if (heure >= 5 && heure < 13) return `Bonjour ${prenom} ☀️`;
  if (heure >= 13 && heure < 18) return `Bonne après-midi ${prenom}`;
  if (heure >= 18 && heure < 22) return `Bonne soirée ${prenom} 🌙`;
  return `Bonsoir ${prenom}`;
}

interface TopbarProps {
  onOpenMobileMenu: () => void;
}

export function Topbar({ onOpenMobileMenu }: TopbarProps) {
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
              className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-cockpit-yellow/15 flex items-center justify-center">
                <span className="text-cockpit-yellow font-semibold text-[11px]">
                  {session.user.prenom?.[0]}
                  {session.user.nom?.[0]}
                </span>
              </div>
              <span className="text-gray-700 text-sm font-medium hidden sm:inline">
                {session.user.prenom} {session.user.nom?.[0]}.
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>

            {/* Dropdown */}
            {avatarOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50">
                <Link
                  href="/administration/pointage"
                  onClick={() => setAvatarOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <User className="w-4 h-4 text-gray-400" />
                  Mon profil
                </Link>
                <div className="border-t border-gray-100 my-1" />
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full transition-colors"
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
