"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckSquare, Square } from "lucide-react";
import clsx from "clsx";
import type { BriefingData } from "./daily-briefing-client";
import { CardShell } from "./card-shell";

interface Props {
  data: BriefingData["tachesJour"];
}

export function TachesJourCard({ data }: Props) {
  // Optimistic UI : on retire visuellement les tâches terminées
  const [done, setDone] = useState<Set<string>>(new Set());

  const handleComplete = async (id: string) => {
    setDone((prev) => new Set(prev).add(id));
    try {
      await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut: "TERMINEE" }),
      });
    } catch {
      // En cas d'erreur, on rollback
      setDone((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const visible = data.items.filter((t) => !done.has(t.tacheId));

  return (
    <CardShell
      icon={<CheckSquare className="w-5 h-5" />}
      iconColor="#F4B400"
      title="À faire aujourd'hui"
      badge={
        data.enRetard > 0 ? (
          <Link
            href="/commercial/taches"
            className="text-red-700 bg-red-50 hover:bg-red-100 rounded-full px-2 py-0.5 text-[10px] font-bold"
          >
            {data.enRetard} en retard
          </Link>
        ) : null
      }
    >
      {visible.length === 0 ? (
        <div className="text-sm text-cockpit-secondary py-8 text-center">
          Aucune tâche aujourd&apos;hui. Profite pour rappeler tes leads chauds 😉
        </div>
      ) : (
        <ul className="space-y-1.5">
          {visible.map((t) => (
            <li
              key={t.tacheId}
              className="flex items-start gap-2 p-2.5 rounded-lg bg-cockpit-dark/40 border border-cockpit hover:border-yellow-300/40 transition group"
            >
              <button
                onClick={() => handleComplete(t.tacheId)}
                className="flex-shrink-0 mt-0.5 text-cockpit-secondary hover:text-cockpit-success transition"
                aria-label="Marquer comme terminée"
              >
                <Square className="w-4 h-4 group-hover:hidden" />
                <CheckSquare className="w-4 h-4 hidden group-hover:block" />
              </button>
              <div className="min-w-0 flex-1">
                <p
                  className={clsx(
                    "text-sm font-medium text-cockpit-primary"
                  )}
                >
                  {t.titre}
                </p>
                {(t.contactNom || t.description) && (
                  <p className="text-xs text-cockpit-secondary mt-0.5 truncate">
                    {t.contactNom && (
                      <>
                        {t.lienContact ? (
                          <Link
                            href={t.lienContact}
                            className="hover:underline"
                          >
                            {t.contactNom}
                          </Link>
                        ) : (
                          t.contactNom
                        )}
                        {t.description && " · "}
                      </>
                    )}
                    {t.description && (
                      <span className="italic">{t.description}</span>
                    )}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </CardShell>
  );
}
