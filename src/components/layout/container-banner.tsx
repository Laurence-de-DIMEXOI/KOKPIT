"use client";

import { useEffect, useState } from "react";
import { Ship } from "lucide-react";
import { ContainerModal } from "./container-modal";

interface ContainerMeta {
  contNo: string;
  departLabel: string;
  origine: string;
  arriveeLabel: string;
  destination: string;
}

/**
 * Bandeau "Container en transit" — réutilisable sur toute page KOKPIT.
 * Affiche les méta + un bouton qui ouvre la pop-up détaillée du contenu.
 * DA Commercial : gradient teal #0E6973 → #FEEB9C.
 */
export function ContainerBanner() {
  const [meta, setMeta] = useState<ContainerMeta | null>(null);
  const [count, setCount] = useState<number | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/data/container-caau9910103.json")
      .then((r) => r.json())
      .then((d) => {
        setMeta(d.meta);
        setCount(Array.isArray(d.items) ? d.items.length : null);
      })
      .catch(() => {});
  }, []);

  if (!meta) return null;

  return (
    <>
      <div
        className="rounded-card shadow-cockpit-md overflow-hidden border border-cockpit"
        style={{
          background:
            "linear-gradient(90deg, #0E6973 0%, #128894 60%, #FEEB9C 130%)",
        }}
      >
        <div className="px-5 py-4 flex items-center gap-4 text-white">
          <div className="shrink-0 w-11 h-11 rounded-full bg-white/15 flex items-center justify-center">
            <Ship className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-white/85 font-semibold">
              Container en transit
            </div>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 mt-0.5">
              <span className="text-lg font-semibold">{meta.contNo}</span>
              <span className="text-[13px] text-white/90">
                Quitte {meta.origine} le <strong>{meta.departLabel}</strong> —
                arrivée prévue le <strong>{meta.arriveeLabel}</strong> à{" "}
                {meta.destination}
              </span>
            </div>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="shrink-0 px-3.5 py-2 rounded-input text-[13px] font-semibold bg-white text-[#0E6973] hover:bg-white/90 shadow-cockpit-sm transition-colors whitespace-nowrap"
          >
            Voir le contenu
            {count !== null && (
              <span className="ml-1.5 text-cockpit-secondary font-normal">
                ({count})
              </span>
            )}
          </button>
        </div>
      </div>

      <ContainerModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
