"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import {
  Loader2,
  TrendingUp,
  RefreshCw,
  Search,
  ChevronRight,
  ChevronDown,
  PackageX,
  Undo2,
} from "lucide-react";
import { ContainerBanner } from "@/components/layout/container-banner";
import { IMPORTS } from "@/lib/imports-config";

const ACHAT_GRADIENT = {
  from: "var(--color-active)",
  to: "#FEEB9C",
};

interface RowItem {
  ref: string;
  description: string;
  qty: number;
  note?: string;
  priceHT?: number | null;
}

interface Row {
  bcdi: string;
  isStock: boolean;
  convertedFromBcdi: boolean;
  originalBcdi?: string;
  overrideNote?: string | null;
  client: string | null;
  commercial: string | null;
  nbMeubles: number;
  totalHT: number | null;
  restePayerHT: number | null;
  potentielCommercial: number | null;
  status: string | null;
  paidPct: number | null;
  etatProduit: string | null;
  isSav: boolean;
  items: RowItem[];
}

interface Payload {
  imp: { code: string; label: string; containerNo: string };
  meta: { contNo: string; arriveeLabel: string; departLabel: string };
  rows: Row[];
  totals: {
    nbMeubles: number;
    totalHT: number;
    restePayerHT: number;
    potentielCommercial: number;
  };
}

function eur(n: number | null): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

function eurPrecise(n: number | null): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(n);
}

interface StatusBadge {
  label: string;
  fg: string;
  bg: string;
}
const STATUS_BADGES: Record<string, StatusBadge> = {
  paid: { label: "Payé", fg: "#065F46", bg: "#D1FAE5" },
  invoiced: { label: "Facturé", fg: "#065F46", bg: "#D1FAE5" },
  advanced: { label: "Acompte", fg: "#92400E", bg: "#FEF3C7" },
  accepted: { label: "Accepté", fg: "#1E40AF", bg: "#DBEAFE" },
  sent: { label: "Envoyé", fg: "#B91C1C", bg: "#FEE2E2" },
  draft: { label: "Brouillon", fg: "#6B7280", bg: "#F3F4F6" },
  cancelled: { label: "Annulé", fg: "#6B7280", bg: "#F3F4F6" },
  refused: { label: "Refusé", fg: "#6B7280", bg: "#F3F4F6" },
  expired: { label: "Expiré", fg: "#6B7280", bg: "#F3F4F6" },
};

function StatusPill({ row }: { row: Row }) {
  if (row.isStock) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-800 border border-amber-200">
        Stock
      </span>
    );
  }
  if (!row.status) return <span className="text-cockpit-secondary/60">—</span>;
  const b = STATUS_BADGES[row.status] || {
    label: row.status,
    fg: "#6B7280",
    bg: "#F3F4F6",
  };
  const pct = row.paidPct != null ? Math.round(row.paidPct * 100) : null;
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <span
        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium"
        style={{ backgroundColor: b.bg, color: b.fg }}
      >
        {b.label}
      </span>
      {row.isSav && (
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300"
          title={row.etatProduit ? `Etat des produits : ${row.etatProduit}` : "SAV"}
        >
          {row.etatProduit?.toUpperCase().includes("RETOUR") ? "RETOUR" : "SAV"}
        </span>
      )}
      {pct != null && pct > 0 && pct < 100 && !row.isSav && (
        <span className="text-[10px] text-cockpit-secondary tabular-nums">
          {pct}%
        </span>
      )}
    </span>
  );
}

function ExpandedRow({
  row,
  onConvert,
  onRestore,
  busy,
}: {
  row: Row;
  onConvert: (bcdi: string, note: string) => void;
  onRestore: (bcdi: string) => void;
  busy: boolean;
}) {
  const canConvert = !row.isStock || row.convertedFromBcdi;
  const realBcdiId = row.originalBcdi || row.bcdi;
  const isConverted = row.convertedFromBcdi;
  return (
    <tr className="bg-cockpit border-b border-cockpit">
      <td colSpan={9} className="px-12 py-3">
        <div className="rounded-card bg-cockpit-card border border-cockpit shadow-cockpit-sm overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-cockpit text-[10px] uppercase tracking-wider text-cockpit-secondary border-b border-cockpit">
              <tr>
                <th className="px-3 py-2 text-left font-semibold w-32">Réf</th>
                <th className="px-3 py-2 text-left font-semibold">
                  Dénomination
                </th>
                <th className="px-3 py-2 text-right font-semibold w-16">Qté</th>
                {row.isStock && (
                  <th className="px-3 py-2 text-right font-semibold w-28">
                    Prix HT
                  </th>
                )}
                {row.isStock && (
                  <th className="px-3 py-2 text-right font-semibold w-28">
                    Sous-total
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {row.items.map((it, i) => (
                <tr
                  key={`${row.bcdi}-${it.ref}-${i}`}
                  className="border-b border-cockpit/50 last:border-b-0"
                >
                  <td className="px-3 py-1.5 font-mono text-cockpit-primary">
                    {it.ref}
                  </td>
                  <td className="px-3 py-1.5 text-cockpit-heading">
                    <div>{it.description}</div>
                    {it.note && (
                      <div className="mt-0.5 inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                        ⚠ {it.note}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-1.5 text-right font-mono text-cockpit-heading">
                    {it.qty}
                  </td>
                  {row.isStock && (
                    <td className="px-3 py-1.5 text-right font-mono text-cockpit-primary">
                      {it.priceHT != null ? eurPrecise(it.priceHT) : "—"}
                    </td>
                  )}
                  {row.isStock && (
                    <td className="px-3 py-1.5 text-right font-mono font-semibold text-amber-700">
                      {it.priceHT != null ? eur(it.priceHT * it.qty) : "—"}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Actions discrètes en bas du drawer */}
          {canConvert && realBcdiId.toUpperCase().startsWith("BCDI") && (
            <div className="px-3 py-2 border-t border-cockpit bg-cockpit flex items-center justify-between gap-3">
              <div className="text-[11px] text-cockpit-secondary">
                {isConverted ? (
                  <>
                    <span className="font-medium text-amber-700">
                      Converti en stock potentiel
                    </span>
                    {row.overrideNote && (
                      <span> · {row.overrideNote}</span>
                    )}
                  </>
                ) : (
                  <>Le client a annulé ? Bascule ce BCDI en stock pour le revaloriser.</>
                )}
              </div>
              {isConverted ? (
                <button
                  onClick={() => onRestore(realBcdiId)}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-cockpit-primary border border-cockpit-input rounded-input hover:bg-cockpit-card disabled:opacity-40"
                >
                  <Undo2 className="w-3 h-3" />
                  Restaurer le BCDI client
                </button>
              ) : (
                <button
                  onClick={() => {
                    const note = window.prompt(
                      `Raison de la conversion en stock pour ${realBcdiId} ?`,
                      "Annulation client"
                    );
                    if (note === null) return;
                    onConvert(realBcdiId, note.trim() || "Annulation client");
                  }}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-amber-700 border border-amber-300 bg-amber-50 rounded-input hover:bg-amber-100 disabled:opacity-40"
                >
                  <PackageX className="w-3 h-3" />
                  Convertir en stock
                </button>
              )}
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function PrevisionnelPage() {
  const [activeImp, setActiveImp] = useState(IMPORTS[0]?.code || "IMP-618");
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(false);
  const [overrideBusy, setOverrideBusy] = useState(false);
  const [q, setQ] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const fetchData = useCallback(async (imp: string, fresh = false) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/achat/previsionnel?imp=${encodeURIComponent(imp)}${fresh ? "&fresh=true" : ""}`
      );
      const j = await res.json();
      if (res.ok) setData(j);
      else setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(activeImp);
    setExpanded(new Set());
  }, [activeImp, fetchData]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const needle = q.trim().toLowerCase();
    if (!needle) return data.rows;
    return data.rows.filter(
      (r) =>
        r.bcdi.toLowerCase().includes(needle) ||
        (r.client || "").toLowerCase().includes(needle) ||
        (r.commercial || "").toLowerCase().includes(needle) ||
        r.items.some(
          (it) =>
            it.ref.toLowerCase().includes(needle) ||
            it.description.toLowerCase().includes(needle)
        )
    );
  }, [data, q]);

  const toggleExpand = (bcdi: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(bcdi)) next.delete(bcdi);
      else next.add(bcdi);
      return next;
    });
  };

  const setOverride = useCallback(
    async (bcdi: string, action: "to-stock" | "restore", note?: string) => {
      setOverrideBusy(true);
      try {
        const res = await fetch("/api/achat/previsionnel/override", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bcdi, impCode: activeImp, action, note }),
        });
        if (!res.ok) throw new Error("override ko");
        await fetchData(activeImp, true);
      } finally {
        setOverrideBusy(false);
      }
    },
    [activeImp, fetchData]
  );

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-cockpit-heading flex items-center gap-2">
          <TrendingUp className="w-7 h-7" style={{ color: "var(--color-active)" }} />
          Prévisionnel
        </h1>
        <p className="text-cockpit-secondary text-sm mt-1">
          Suivi financier par arrivage : reste à encaisser des commandes clients et potentiel
          commercial du stock à venir.
        </p>
      </div>

      {/* Container banner */}
      <ContainerBanner />

      {/* Tabs */}
      <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-sm overflow-hidden">
        <div className="flex items-center gap-1 px-3 pt-2 border-b border-cockpit">
          {IMPORTS.map((imp) => (
            <button
              key={imp.code}
              onClick={() => setActiveImp(imp.code)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeImp === imp.code
                  ? "text-white"
                  : "text-cockpit-secondary hover:text-cockpit-primary hover:bg-cockpit"
              }`}
              style={
                activeImp === imp.code
                  ? {
                      background: `linear-gradient(135deg, ${ACHAT_GRADIENT.from}, ${ACHAT_GRADIENT.to})`,
                    }
                  : undefined
              }
            >
              {imp.label}
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="px-4 py-3 flex flex-wrap items-center gap-3 bg-cockpit">
          <div className="relative flex-1 min-w-[260px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cockpit-secondary" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher (BCDI, client, commercial, réf, désignation)…"
              className="w-full pl-10 pr-4 py-2 border border-cockpit-input rounded-input bg-cockpit-input text-cockpit-primary text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-active)] focus:border-transparent"
            />
          </div>
          <div className="text-xs text-cockpit-secondary">
            {data ? (
              <>
                <span className="font-semibold text-cockpit-heading">
                  {filtered.length}
                </span>{" "}
                ligne{filtered.length > 1 ? "s" : ""}
              </>
            ) : (
              "—"
            )}
          </div>
          <button
            onClick={() => fetchData(activeImp, true)}
            disabled={loading}
            className="ml-auto inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-cockpit-primary border border-cockpit-input rounded-input hover:bg-cockpit-card disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Rafraîchir
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading && !data ? (
            <div className="py-12 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-cockpit-secondary" />
            </div>
          ) : !data ? (
            <div className="py-12 text-center text-cockpit-secondary text-sm">
              Aucune donnée
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-cockpit-card text-[11px] uppercase tracking-wider text-cockpit-secondary border-b border-cockpit">
                <tr>
                  <th className="w-8 px-2 py-2.5"></th>
                  <th className="px-3 py-2.5 text-left font-semibold whitespace-nowrap w-28">
                    N° BCDI
                  </th>
                  <th className="px-3 py-2.5 text-left font-semibold whitespace-nowrap">
                    Client
                  </th>
                  <th className="px-3 py-2.5 text-left font-semibold whitespace-nowrap w-32">
                    Propriétaire
                  </th>
                  <th className="px-3 py-2.5 text-left font-semibold whitespace-nowrap w-40">
                    Statut
                  </th>
                  <th className="px-3 py-2.5 text-right font-semibold whitespace-nowrap w-20">
                    Nb meubles
                  </th>
                  <th className="px-3 py-2.5 text-right font-semibold whitespace-nowrap w-24">
                    Total HT
                  </th>
                  <th className="px-3 py-2.5 text-right font-semibold whitespace-nowrap w-32">
                    Reste à payer HT
                  </th>
                  <th className="px-3 py-2.5 text-right font-semibold whitespace-nowrap w-32">
                    Potentiel comm.
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const isOpen = expanded.has(r.bcdi);
                  return (
                    <Fragment key={r.bcdi}>
                      <tr
                        onClick={() => toggleExpand(r.bcdi)}
                        className={`border-b border-cockpit hover:bg-cockpit/60 transition-colors cursor-pointer align-middle [&>td]:align-middle ${
                          r.isStock ? "bg-amber-50/40" : ""
                        } ${isOpen ? "bg-cockpit/40" : ""}`}
                      >
                        <td className="w-8 px-2 py-2.5 text-cockpit-secondary">
                          {isOpen ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-xs font-semibold text-[var(--color-active)]">
                          {r.bcdi}
                        </td>
                        <td className="px-3 py-2.5 text-cockpit-heading">
                          {r.client || (
                            <span className="text-cockpit-secondary/70">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-cockpit-primary text-[13px]">
                          {r.commercial || (
                            <span className="text-cockpit-secondary/70">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          <StatusPill row={r} />
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-cockpit-heading font-medium">
                          {r.nbMeubles}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-cockpit-primary">
                          {eur(r.totalHT)}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono font-semibold text-emerald-700">
                          {eur(r.restePayerHT)}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono font-semibold text-amber-700">
                          {eur(r.potentielCommercial)}
                        </td>
                      </tr>
                      {isOpen && (
                        <ExpandedRow
                          row={r}
                          busy={overrideBusy}
                          onConvert={(b, note) => setOverride(b, "to-stock", note)}
                          onRestore={(b) => setOverride(b, "restore")}
                        />
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
              {data.rows.length > 0 && (
                <tfoot className="bg-cockpit border-t-2 border-cockpit">
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-3 text-right text-xs uppercase tracking-wider font-semibold text-cockpit-secondary"
                    >
                      Totaux
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-cockpit-heading font-bold">
                      {data.totals.nbMeubles}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-cockpit-heading font-bold">
                      {eur(data.totals.totalHT)}
                    </td>
                    <td className="px-3 py-3 text-right font-mono font-bold text-emerald-700">
                      {eur(data.totals.restePayerHT)}
                    </td>
                    <td className="px-3 py-3 text-right font-mono font-bold text-amber-700">
                      {eur(data.totals.potentielCommercial)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
