"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { ToastProvider } from "@/components/ui/toast";
import { useSession } from "next-auth/react";
import { usePathname, redirect } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import clsx from "clsx";
import { detectEspaceFromPath } from "@/lib/nav-config";
import { getMeteoReunion, meteoStyles, type ConditionMeteo } from "@/lib/meteo";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [meteo, setMeteo] = useState<ConditionMeteo>("soleil");

  // Détecte l'espace depuis l'URL pour appliquer les couleurs CSS
  const espaceId = detectEspaceFromPath(pathname);

  useEffect(() => {
    setIsClient(true);
    getMeteoReunion().then(setMeteo).catch(() => {});
  }, []);

  useEffect(() => {
    if (status === "unauthenticated" && isClient) {
      redirect("/login");
    }
  }, [status, isClient]);

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

  const handleOpenMobileMenu = useCallback(() => setMobileOpen(true), []);
  const handleCloseMobileMenu = useCallback(() => setMobileOpen(false), []);

  if (!isClient || status === "loading") {
    return (
      <div className={clsx(
        "min-h-screen bg-cockpit",
        "flex items-center justify-center"
      )}>
        <div className="text-cockpit-primary text-lg font-medium">
          Chargement...
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-cockpit" data-espace={espaceId} style={meteoStyles[meteo]}>
        {/* Topbar fixe — 48px */}
        <Topbar onOpenMobileMenu={handleOpenMobileMenu} />

        {/* Sidebar + Main content sous la topbar */}
        <div className="pt-12">
          <Sidebar
            mobileOpen={mobileOpen}
            onCloseMobile={handleCloseMobileMenu}
          />
          <main className="flex-1 ml-0 lg:ml-[200px] overflow-y-auto bg-cockpit min-h-[calc(100vh-48px)]">
            <div className="p-4 sm:p-6 md:p-8 lg:p-10">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
