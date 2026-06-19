"use client";

import { useState } from "react";
import { BookOpen, Link2 } from "lucide-react";
import clsx from "clsx";
import { DocsReader } from "@/components/docs-reader";
import { LiensUtilesPanel } from "@/components/liens-utiles-panel";

type Tab = "docs" | "liens";

export default function DocsPage() {
  const [tab, setTab] = useState<Tab>("docs");

  const tabs: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "docs", label: "Documentation", icon: BookOpen },
    { id: "liens", label: "Liens utiles", icon: Link2 },
  ];

  return (
    <div className="space-y-4">
      {/* Onglets */}
      <div className="flex items-center gap-1 border-b border-cockpit">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={clsx(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
                active
                  ? "border-[var(--color-active)] text-[var(--color-active)]"
                  : "border-transparent text-cockpit-secondary hover:text-cockpit-heading"
              )}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "docs" ? <DocsReader /> : <LiensUtilesPanel />}
    </div>
  );
}
