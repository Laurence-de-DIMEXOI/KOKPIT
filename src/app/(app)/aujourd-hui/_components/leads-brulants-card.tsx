"use client";

import Link from "next/link";
import { Flame, Phone } from "lucide-react";
import type { BriefingData } from "./daily-briefing-client";
import { CardShell } from "./card-shell";

interface Props {
  data: BriefingData["leadsBrulants"];
}

export function LeadsBrulantsCard({ data }: Props) {
  return (
    <CardShell
      icon={<Flame className="w-5 h-5" />}
      iconColor="#D32F2F"
      title="À rappeler en urgence"
      badge={data.total > 3 ? `${data.items.length} sur ${data.total}` : null}
    >
      {data.items.length === 0 ? (
        <div className="text-sm text-cockpit-secondary py-8 text-center">
          Tous tes leads chauds sont à jour. Beau travail ☀️
        </div>
      ) : (
        <ul className="space-y-2">
          {data.items.map((it) => (
            <li
              key={it.leadId}
              className="flex items-center justify-between gap-3 p-3 rounded-lg bg-cockpit-dark/40 border border-cockpit hover:border-red-300/40 transition"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-cockpit-primary truncate">
                    {`${it.contactPrenom} ${it.contactNom}`.trim() || "Inconnu"}
                  </span>
                  {it.priorite === "burning" && (
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700">
                      Brûlant
                    </span>
                  )}
                  {it.priorite === "hot" && (
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-orange-100 text-orange-700">
                      Chaud
                    </span>
                  )}
                </div>
                <p className="text-xs text-cockpit-secondary mt-0.5">
                  Pas de contact depuis {it.heuresDepuisActivite}h
                </p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {it.telephone && (
                  <a
                    href={`tel:${it.telephone}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-red-50 text-red-700 hover:bg-red-100 text-xs font-semibold transition"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    Appeler
                  </a>
                )}
                <Link
                  href={it.lienContact}
                  className="px-2.5 py-1.5 rounded-md border border-cockpit text-xs font-semibold text-cockpit-primary hover:border-cockpit-info/40 transition"
                >
                  Voir
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </CardShell>
  );
}
