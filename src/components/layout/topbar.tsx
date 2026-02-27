"use client";

import { Search, Bell } from "lucide-react";
import { useSession } from "next-auth/react";

interface TopbarProps {
  title: string;
  subtitle?: string;
}

export function Topbar({ title, subtitle }: TopbarProps) {
  const { data: session } = useSession();

  return (
    <div className="h-20 bg-cockpit-dark/60 border-b border-gray-700/30 backdrop-blur-xl flex items-center justify-between px-8">
      {/* Left Section - Title */}
      <div className="flex-1">
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        {subtitle && <p className="text-gray-400 text-sm mt-1">{subtitle}</p>}
      </div>

      {/* Right Section - Actions */}
      <div className="flex items-center gap-4">
        {/* Search Pill */}
        <div className="hidden md:flex items-center gap-2 bg-gray-700/20 border border-gray-600/30 rounded-full px-4 py-2">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher..."
            className="bg-transparent text-white placeholder-gray-400 text-sm outline-none w-32"
          />
        </div>

        {/* Notification Bell */}
        <button className="relative p-2 hover:bg-gray-700/20 rounded-lg transition-colors">
          <Bell className="w-5 h-5 text-gray-400 hover:text-white" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-yellow-cockpit rounded-full"></span>
        </button>

        {/* User Avatar */}
        {session?.user && (
          <div className="w-10 h-10 rounded-full bg-yellow-cockpit/20 flex items-center justify-center cursor-pointer hover:bg-yellow-cockpit/30 transition-colors">
            <span className="text-yellow-cockpit font-semibold text-sm">
              {session.user.prenom?.[0]}
              {session.user.nom?.[0]}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
