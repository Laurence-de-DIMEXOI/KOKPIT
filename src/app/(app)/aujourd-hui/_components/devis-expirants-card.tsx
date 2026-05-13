"use client";

import Link from "next/link";
import { Clock, ExternalLink } from "lucide-react";
import type { BriefingData } from "./daily-briefing-client";
import { CardShell } from "./card-shell";

interface Props {
  data: BriefingData["devisExpirants"];
}

const eur = (n: number) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);

export function DevisExpirantsCard({ data }: Props) {
  return (
    <CardShell
      icon={<Clock className="w-5 h-5" />}
      iconColor="#E65100"
      title="Devis qui expirent bientôt"
    >
      {data.items.length === 0 ? (
        <div className="text-sm text-cockpit-secondary py-8 text-center">
          Aucun devis n&apos;expire dans les 5 prochains jours.
        </div>
      ) : (
        <ul className="space-y-2">
          {data.items.map((it) => (
            <li
              key={it.devisId}
              className="flex items-center justify-between gap-3 p-3 rounded-lg bg-cockpit-dark/40 border border-cockpit hover:border-orange-300/40 transition"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-cockpit-primary truncate">
                    {it.contactNom}
                  </span>
                  <span className="text-xs text-cockpit-secondary">
                    {it.numero}
                  </span>
                </div>
                <p className="text-xs text-cockpit-secondary mt-0.5">
                  <span className="font-semibold text-cockpit-primary">
                    {eur(it.montantHT)} HT
                  </span>{" "}
                  · expire dans {it.joursRestants}j
                </p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {it.sellsyUrl && (
                  <a
                    href={it.sellsyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-orange-50 text-orange-700 hover:bg-orange-100 text-xs font-semibold transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Sellsy
                  </a>
                )}
                <Link
                  href={it.lienContact}
                  className="px-2.5 py-1.5 rounded-md border border-cockpit text-xs font-semibold text-cockpit-primary hover:border-cockpit-info/40 transition"
                >
                  Contact
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </CardShell>
  );
}
