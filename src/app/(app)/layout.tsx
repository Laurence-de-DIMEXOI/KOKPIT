"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { ToastProvider } from "@/components/ui/toast";
import { useActiveSpace } from "@/hooks/use-active-space";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import clsx from "clsx";

// Lazy load chatbot — pas besoin au premier render
const ChatbotWidget = dynamic(
  () => import("@/components/chat/chatbot-widget").then((m) => m.ChatbotWidget),
  { ssr: false }
);

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const [isClient, setIsClient] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const {
    activeSpaceId,
    currentSpace,
    visibleSpaces,
    menuItems,
    generalItems,
    showTabs,
    switchSpace,
  } = useActiveSpace();

  useEffect(() => {
    setIsClient(true);
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
      <div className="min-h-screen bg-cockpit">
        {/* Topbar fixe — 48px */}
        <Topbar
          activeSpaceId={activeSpaceId}
          visibleSpaces={visibleSpaces}
          showTabs={showTabs}
          onSwitchSpace={switchSpace}
          onOpenMobileMenu={handleOpenMobileMenu}
        />

        {/* Sidebar + Main content sous la topbar */}
        <div className="pt-12">
          <Sidebar
            activeSpaceId={activeSpaceId}
            currentSpace={currentSpace}
            menuItems={menuItems}
            generalItems={generalItems}
            mobileOpen={mobileOpen}
            onCloseMobile={handleCloseMobileMenu}
            showTabs={showTabs}
            visibleSpaces={visibleSpaces}
            onSwitchSpace={switchSpace}
          />
          <main className="flex-1 ml-0 lg:ml-[200px] overflow-y-auto bg-cockpit min-h-[calc(100vh-48px)]">
            <div className="p-4 sm:p-6 md:p-8 lg:p-10">
              {children}
            </div>
          </main>
        </div>

        <ChatbotWidget />
      </div>
    </ToastProvider>
  );
}
