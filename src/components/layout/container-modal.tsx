"use client";

import { useEffect, useMemo, useState } from "react";

interface ContainerItem {
  bcdi: string;
  ref: string;
  description: string;
  qty: number;
  note?: string;
}

interface ContainerData {
  meta: {
    contNo: string;
    departLabel: string;
    origine: string;
    arriveeLabel: string;
    destination: string;
    source: string;
  };
  items: ContainerItem[];
}

interface Props {
  open: boolean;
  onClose: () => void;
}

/**
 * Pop-up listant le contenu d'un container en transit.
 * Données statiques chargées depuis /data/container-caau9910103.json.
 * Recherche multi-champs (BCDI, réf, désignation).
 * DA KOKPIT — gradient teal #0E6973 → Butter Yellow #FEEB9C.
 */
type EnrichEntry = { client: string | null; commercial: string | null };

export function ContainerModal({ open, onClose }: Props) {
  const [data, setData] = useState<ContainerData | null>(null);
  const [enrich, setEnrich] = useState<Record<string, EnrichEntry>>({});
  const [enrichLoading, setEnrichLoading] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!open || data) return;
    fetch("/data/container-caau9910103.json")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null));
  }, [open, data]);

  useEffect(() => {
    if (!open || !data) return;
    const uniq = Array.from(
      new Set(data.items.map((i) => i.bcdi).filter((b) => b.startsWith("BCDI")))
    );
    if (uniq.length === 0) return;
    setEnrichLoading(true);
    fetch(`/api/container/enrich?bcdis=${encodeURIComponent(uniq.join(","))}`)
      .then((r) => r.json())
      .then((j) => setEnrich(j.enrich || {}))
      .catch(() => {})
      .finally(() => setEnrichLoading(false));
  }, [open, data]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const needle = q.trim().toLowerCase();
    if (!needle) return data.items;
    return data.items.filter((it) => {
      const e = enrich[it.bcdi];
      return (
        it.bcdi.toLowerCase().includes(needle) ||
        it.ref.toLowerCase().includes(needle) ||
        it.description.toLowerCase().includes(needle) ||
        (e?.client || "").toLowerCase().includes(needle) ||
        (e?.commercial || "").toLowerCase().includes(needle)
      );
    });
  }, [data, q, enrich]);

  const totalUnits = useMemo(
    () => filtered.reduce((s, it) => s + (it.qty || 0), 0),
    [filtered]
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative w-full max-w-5xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden border border-white/10"
        style={{ background: "#0a0f1e" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header — gradient KOKPIT Commercial */}
        <div
          className="px-6 py-4 flex items-start justify-between gap-4 text-white"
          style={{
            background:
              "linear-gradient(90deg, #0E6973 0%, #128894 50%, #FEEB9C 130%)",
          }}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-white/80">
              <span>🚢</span>
              <span>Container en transit</span>
            </div>
            <h2 className="mt-0.5 text-xl font-semibold truncate">
              {data?.meta.contNo || "CAAU9910103"}
            </h2>
            <p className="mt-1 text-[13px] text-white/90 leading-snug">
              Quitte {data?.meta.origine || "l'Indonésie"} le{" "}
              <strong>{data?.meta.departLabel || "14 juin 2026"}</strong> —
              arrivée prévue le{" "}
              <strong>{data?.meta.arriveeLabel || "6 juillet 2026"}</strong> à{" "}
              {data?.meta.destination || "La Réunion"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 text-white/80 hover:text-white text-lg w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-6 py-3 border-b border-white/5 flex items-center gap-3 bg-slate-900/40">
          <div className="relative flex-1 max-w-md">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
              🔎
            </span>
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher (BCDI, réf, désignation, client, commercial)…"
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-800/70 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0E6973]"
              autoFocus
            />
          </div>
          <div className="text-xs text-slate-400 whitespace-nowrap">
            {data ? (
              <>
                <span className="text-white font-medium">{filtered.length}</span>{" "}
                ligne{filtered.length > 1 ? "s" : ""} ·{" "}
                <span className="text-white font-medium">{totalUnits}</span>{" "}
                unité{totalUnits > 1 ? "s" : ""}
                {data.items.length !== filtered.length && (
                  <span className="text-slate-500"> / {data.items.length}</span>
                )}
              </>
            ) : (
              "Chargement…"
            )}
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          {!data ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              Chargement du contenu…
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              Aucun article ne correspond à « {q} »
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-900/95 backdrop-blur text-[11px] uppercase tracking-wider text-slate-400 border-b border-white/10">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold w-32">
                    N° BCDI
                  </th>
                  <th className="px-4 py-2 text-left font-semibold w-32">Réf</th>
                  <th className="px-4 py-2 text-left font-semibold">
                    Dénomination
                  </th>
                  <th className="px-4 py-2 text-left font-semibold w-40">
                    Client
                  </th>
                  <th className="px-4 py-2 text-left font-semibold w-32">
                    Commercial
                  </th>
                  <th className="px-4 py-2 text-right font-semibold w-16">
                    Qté
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((it, i) => {
                  const e = enrich[it.bcdi];
                  return (
                    <tr
                      key={`${it.bcdi}-${it.ref}-${i}`}
                      className="border-b border-white/5 hover:bg-white/[0.03] transition-colors"
                    >
                      <td className="px-4 py-2 font-mono text-xs text-[#FEEB9C]/90">
                        {it.bcdi}
                      </td>
                      <td className="px-4 py-2 font-mono text-xs text-slate-300">
                        {it.ref}
                      </td>
                      <td className="px-4 py-2 text-slate-200">
                        <div>{it.description}</div>
                        {it.note && (
                          <div className="mt-1 inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            ⚠ {it.note}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2 text-slate-200 text-[13px]">
                        {e?.client || (
                          <span className="text-slate-600">
                            {enrichLoading ? "…" : "—"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-slate-300 text-[13px]">
                        {e?.commercial || (
                          <span className="text-slate-600">
                            {enrichLoading ? "…" : "—"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right font-mono text-slate-100">
                        {it.qty}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-2 border-t border-white/5 bg-slate-900/40 flex items-center justify-between text-[11px] text-slate-500">
          <span>Source : {data?.meta.source || "Elaury"}</span>
          <span>ESC pour fermer</span>
        </div>
      </div>
    </div>
  );
}
