"use client";

import { Target } from "lucide-react";
import type { BriefingData } from "./daily-briefing-client";
import { CardShell } from "./card-shell";

interface Props {
  data: BriefingData["moodMensuel"];
}

const eur0 = (n: number) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);

const STATUT_CONFIG: Record<
  BriefingData["moodMensuel"]["statut"],
  { color: string; message: string }
> = {
  AVANCE: { color: "#16A34A", message: "🚀 Tu es en avance, continue !" },
  DANS_LES_CLOUS: {
    color: "#F4B400",
    message: "✅ Dans les temps.",
  },
  RETARD: { color: "#E65100", message: "⚡ Il faut accélérer." },
  CRITIQUE: {
    color: "#D32F2F",
    message: "🔥 Mois compliqué — focus sur les conversions.",
  },
};

export function MoodMensuelCard({ data }: Props) {
  const cfg = STATUT_CONFIG[data.statut];
  const pct = Math.round(data.pourcentageAtteinte);
  const showroomLabel =
    data.showroom === "GLOBAL"
      ? "global"
      : `showroom ${data.showroom}`;

  return (
    <CardShell
      icon={<Target className="w-5 h-5" />}
      iconColor={cfg.color}
      title="Mood du mois"
    >
      <div className="flex flex-col items-center text-center py-2">
        <div className="text-4xl font-extrabold" style={{ color: cfg.color }}>
          {pct}%
        </div>
        <p className="text-xs text-cockpit-secondary mt-1">
          de l&apos;objectif {showroomLabel}
        </p>

        <div className="w-full mt-4">
          <div className="h-3 w-full rounded-full bg-cockpit-dark/40 overflow-hidden">
            <div
              className="h-full transition-all duration-500"
              style={{
                width: `${Math.min(100, pct)}%`,
                background: cfg.color,
              }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-cockpit-secondary mt-1.5">
            <span>{eur0(data.realiseHT)} HT</span>
            <span>/ {eur0(data.objectifHT)} HT</span>
          </div>
        </div>

        <p className="mt-4 text-sm font-medium" style={{ color: cfg.color }}>
          {cfg.message}
        </p>
        <p className="text-[11px] text-cockpit-secondary mt-1">
          J-{data.joursRestants} jours restants · rythme attendu{" "}
          {Math.round(data.rythmeAttendu)}%
        </p>
      </div>
    </CardShell>
  );
}
