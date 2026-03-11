"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { ToastProvider } from "@/components/ui/toast";
import { ChatbotWidget } from "@/components/chat/chatbot-widget";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import clsx from "clsx";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (status === "unauthenticated" && isClient) {
      redirect("/login");
    }
  }, [status, isClient]);

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
      <div className="flex min-h-screen bg-cockpit">
        <Sidebar />
        <main className="flex-1 ml-0 lg:ml-[280px] overflow-y-auto bg-cockpit min-h-screen">
          <div className="p-4 pt-16 sm:p-6 sm:pt-16 md:p-8 lg:p-12 lg:pt-12">
            {children}
          </div>
        </main>
        <ChatbotWidget />
      </div>
    </ToastProvider>
  );
}
