"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Sunrise } from "lucide-react";
import clsx from "clsx";
import { LeadsBrulantsCard } from "./leads-brulants-card";
import { DevisExpirantsCard } from "./devis-expirants-card";
import { MoodMensuelCard } from "./mood-mensuel-card";
import { TachesJourCard } from "./taches-jour-card";
import { BriefingSkeleton } from "./briefing-skeleton";

interface ToggleOption {
  id: string;
  label: string;
}

interface Props {
  prenom: string;
  mode: "own" | "aggregated";
  toggleOptions: ToggleOption[] | null;
}

export interface BriefingData {
  meta: {
    user: { id: string; nom: string; prenom: string; role: string } | null;
    mode: "own" | "aggregated" | null;
    target: string;
    generatedAt: string;
    cached: boolean;
  };
  leadsBrulants: {
    items: Array<{
      leadId: string;
      contactId: string;
      contactNom: string;
      contactPrenom: string;
      priorite: string;
      derniereActivite: string;
      heuresDepuisActivite: number;
      telephone: string | null;
      email: string | null;
      lienContact: string;
    }>;
    total: number;
  };
  devisExpirants: {
    items: Array<{
      devisId: string;
      numero: string;
      contactNom: string;
      montantHT: number;
      dateExpiration: string;
      joursRestants: number;
      sellsyUrl: string | null;
      lienContact: string;
    }>;
  };
  moodMensuel: {
    showroom: "SUD" | "NORD" | "GLOBAL";
    objectifHT: number;
    realiseHT: number;
    pourcentageAtteinte: number;
    joursRestants: number;
    rythmeAttendu: number;
    statut: "AVANCE" | "DANS_LES_CLOUS" | "RETARD" | "CRITIQUE";
  };
  tachesJour: {
    items: Array<{
      tacheId: string;
      titre: string;
      description: string | null;
      contactNom: string | null;
      lienContact: string | null;
      echeance: string | null;
    }>;
    enRetard: number;
  };
}

function formatDateLongue(date: Date): string {
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function DailyBriefingClient({ prenom, mode, toggleOptions }: Props) {
  const [data, setData] = useState<BriefingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [target, setTarget] = useState<string>("all");

  const fetchData = useCallback(
    async (fresh = false) => {
      setRefreshing(true);
      try {
        const params = new URLSearchParams();
        if (mode === "aggregated") params.set("userId", target);
        if (fresh) params.set("fresh", "true");
        const res = await fetch(`/api/aujourd-hui?${params.toString()}`);
        if (!res.ok) return;
        const json = (await res.json()) as BriefingData;
        setData(json);
      } catch (e) {
        console.error("[daily-briefing]", e);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [mode, target]
  );

  useEffect(() => {
    fetchData(false);
  }, [fetchData]);

  return (
    <div data-espace="general" className="p-4 md:p-6 max-w-7xl mx-auto">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-cockpit-heading flex items-center gap-2">
            <Sunrise
              className="w-7 h-7"
              style={{ color: "var(--color-active, #F4B400)" }}
            />
            Bonjour {prenom} <span>👋</span>
          </h1>
          <p className="text-sm text-cockpit-secondary mt-1 capitalize">
            {formatDateLongue(new Date())}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {mode === "aggregated" && toggleOptions && (
            <div className="flex gap-1 bg-cockpit-card rounded-lg p-1 border border-cockpit">
              {toggleOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setTarget(opt.id)}
                  className={clsx(
                    "px-3 py-1.5 text-xs font-semibold rounded-md transition",
                    target === opt.id
                      ? "text-black"
                      : "text-cockpit-secondary hover:text-cockpit-primary"
                  )}
                  style={
                    target === opt.id
                      ? { background: "var(--color-active, #F4B400)" }
                      : undefined
                  }
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className={clsx(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold border border-cockpit bg-cockpit-card transition",
              refreshing
                ? "opacity-50 cursor-not-allowed"
                : "hover:border-cockpit-info/40"
            )}
            title="Forcer le refresh des données"
          >
            <RefreshCw
              className={clsx("w-4 h-4", refreshing && "animate-spin")}
            />
            Actualiser
          </button>
        </div>
      </header>

      {loading || !data ? (
        <BriefingSkeleton />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          <LeadsBrulantsCard data={data.leadsBrulants} />
          <DevisExpirantsCard data={data.devisExpirants} />
          <MoodMensuelCard data={data.moodMensuel} />
          <TachesJourCard data={data.tachesJour} />
        </div>
      )}
    </div>
  );
}
