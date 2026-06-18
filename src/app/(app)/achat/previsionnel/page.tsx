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
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  StickyNote,
  Pencil,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { ContainerBanner } from "@/components/layout/container-banner";
import { IMPORTS } from "@/lib/imports-config";
import {
  parseClientNote,
  formatActionLine,
  prependLine,
  ACTION_LABELS,
  ACTION_ORDER,
  type ClientAction,
} from "@/lib/previsionnel-notes";

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
  note: string | null;
  hasManualRestePayer: boolean;
  hasManualTotalHT: boolean;
  items: RowItem[];
}

type SortKey =
  | "bcdi"
  | "client"
  | "commercial"
  | "status"
  | "nbMeubles"
  | "totalHT"
  | "restePayerHT"
  | "potentielCommercial";

type SortDir = "asc" | "desc";

interface StatusFilter {
  status: string | null; // null = tous
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
  onSetAmount,
  onSetNote,
  busy,
  userName,
}: {
  row: Row;
  onConvert: (bcdi: string, note: string) => void;
  onRestore: (bcdi: string) => void;
  onSetAmount: (
    bcdi: string,
    restePayerHT: number | null,
    totalHT: number | null
  ) => void;
  onSetNote: (bcdi: string, note: string | null) => void;
  busy: boolean;
  userName: string;
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

          {/* Journal des actions client (note multi-ligne) */}
          {row.note && (
            <div className="px-3 py-2 border-t border-cockpit bg-amber-50/50 text-[12px] text-amber-900">
              <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-amber-700/80 font-semibold mb-1">
                <StickyNote className="w-3 h-3" />
                Suivi client
              </div>
              <pre className="font-sans whitespace-pre-wrap text-cockpit-heading text-[12px] leading-relaxed">
                {row.note}
              </pre>
            </div>
          )}

          {/* Actions rapides client (BCDI uniquement) */}
          {realBcdiId.toUpperCase().startsWith("BCDI") && (
            <div className="px-3 py-2 border-t border-cockpit bg-cockpit flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] uppercase tracking-wider text-cockpit-secondary font-semibold mr-1">
                Action client :
              </span>
              {ACTION_ORDER.map((action) => {
                const m = ACTION_LABELS[action];
                return (
                  <button
                    key={action}
                    onClick={() => {
                      const line = formatActionLine(
                        action,
                        new Date(),
                        userName || null
                      );
                      onSetNote(realBcdiId, prependLine(row.note, line));
                    }}
                    disabled={busy}
                    className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border hover:opacity-90 disabled:opacity-40 transition-opacity"
                    style={{
                      color: m.color,
                      backgroundColor: m.bg,
                      borderColor: m.border,
                    }}
                    title={`Ajouter « ${m.label} » daté d'aujourd'hui`}
                  >
                    <span>{m.emoji}</span>
                    <span>{m.label}</span>
                  </button>
                );
              })}
              <span className="text-cockpit-secondary/40 text-[11px] mx-1">·</span>
              <button
                onClick={() => {
                  const txt = window.prompt(
                    `Note libre pour ${realBcdiId} (ajoutée en haut, laisser vide pour effacer tout) :`,
                    ""
                  );
                  if (txt === null) return;
                  if (txt.trim() === "") {
                    if (window.confirm("Effacer tout le suivi client ?")) {
                      onSetNote(realBcdiId, null);
                    }
                    return;
                  }
                  onSetNote(realBcdiId, prependLine(row.note, txt.trim()));
                }}
                disabled={busy}
                className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border border-cockpit-input text-cockpit-primary hover:bg-cockpit-card disabled:opacity-40"
              >
                <Pencil className="w-3 h-3" />
                Note libre
              </button>
            </div>
          )}

          {/* Actions discrètes en bas du drawer */}
          {realBcdiId.toUpperCase().startsWith("BCDI") && (
            <div className="px-3 py-2 border-t border-cockpit bg-cockpit flex flex-wrap items-center justify-between gap-2">
              <div className="text-[11px] text-cockpit-secondary flex-1 min-w-[200px]">
                {isConverted ? (
                  <>
                    <span className="font-medium text-amber-700">
                      Converti en stock potentiel
                    </span>
                    {row.overrideNote && <span> · {row.overrideNote}</span>}
                  </>
                ) : row.hasManualRestePayer || row.hasManualTotalHT ? (
                  <span className="text-[var(--color-active)] font-medium">
                    ✏️ Saisie manuelle active
                  </span>
                ) : (
                  <>Modifs manuelles : note / reste à payer / conversion stock.</>
                )}
              </div>

              {/* Bouton Saisir montants manuels */}
              {!isConverted && (
                <button
                  onClick={() => {
                    const cur = row.restePayerHT == null ? "" : String(row.restePayerHT);
                    const v = window.prompt(
                      `Reste à payer HT pour ${realBcdiId} (€, vide = retirer override) :`,
                      cur
                    );
                    if (v === null) return;
                    const clean = v.trim().replace(",", ".");
                    const num = clean === "" ? null : Number(clean);
                    if (clean !== "" && (!Number.isFinite(num) || (num as number) < 0)) {
                      window.alert("Montant invalide");
                      return;
                    }
                    // Si total HT est à 0 / null, propose aussi de le saisir
                    let totalNum: number | null | undefined = undefined;
                    if (row.totalHT == null || row.totalHT === 0) {
                      const t = window.prompt(
                        `Total HT pour ${realBcdiId} (€, optionnel) :`,
                        row.totalHT ? String(row.totalHT) : ""
                      );
                      if (t !== null) {
                        const ct = t.trim().replace(",", ".");
                        totalNum = ct === "" ? null : Number(ct);
                        if (ct !== "" && (!Number.isFinite(totalNum) || (totalNum as number) < 0)) {
                          window.alert("Total HT invalide");
                          return;
                        }
                      }
                    }
                    onSetAmount(realBcdiId, num, totalNum === undefined ? null : totalNum);
                  }}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-emerald-700 border border-emerald-300 bg-emerald-50 rounded-input hover:bg-emerald-100 disabled:opacity-40"
                >
                  <Pencil className="w-3 h-3" />
                  Saisir reste à payer
                </button>
              )}

              {/* Bouton convertir stock / restaurer */}
              {isConverted ? (
                <button
                  onClick={() => onRestore(realBcdiId)}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-cockpit-primary border border-cockpit-input rounded-input hover:bg-cockpit-card disabled:opacity-40"
                >
                  <Undo2 className="w-3 h-3" />
                  Restaurer le BCDI client
                </button>
              ) : canConvert ? (
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
              ) : null}
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

function ContactBadge({ note }: { note: string | null }) {
  const parsed = parseClientNote(note);
  if (!parsed) return null;
  const m = ACTION_LABELS[parsed.action];
  return (
    <span
      title={parsed.line}
      className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full border whitespace-nowrap"
      style={{ color: m.color, backgroundColor: m.bg, borderColor: m.border }}
    >
      <span>{m.emoji}</span>
      <span>{m.label}</span>
      {parsed.date && <span className="opacity-80">· {parsed.date}</span>}
      {parsed.by && <span className="opacity-80">· {parsed.by}</span>}
    </span>
  );
}

function SortableHeader({
  label,
  field,
  sortKey,
  sortDir,
  onSort,
  align = "left",
  width,
}: {
  label: string;
  field: SortKey;
  sortKey: SortKey | null;
  sortDir: SortDir;
  onSort: (k: SortKey) => void;
  align?: "left" | "right";
  width?: string;
}) {
  const active = sortKey === field;
  const Icon = !active ? ArrowUpDown : sortDir === "asc" ? ArrowUp : ArrowDown;
  return (
    <th
      className={`px-3 py-2.5 ${align === "right" ? "text-right" : "text-left"} font-semibold whitespace-nowrap select-none ${width || ""}`}
    >
      <button
        onClick={() => onSort(field)}
        className={`inline-flex items-center gap-1 ${
          align === "right" ? "flex-row-reverse" : ""
        } ${active ? "text-cockpit-heading" : "hover:text-cockpit-primary"}`}
      >
        <span>{label}</span>
        <Icon className="w-3 h-3 opacity-60" />
      </button>
    </th>
  );
}

export default function PrevisionnelPage() {
  const { data: session } = useSession();
  const userName = useMemo(() => {
    const u = session?.user as { prenom?: string; nom?: string } | undefined;
    if (!u) return "";
    return `${u.prenom || ""} ${u.nom?.charAt(0) || ""}`.trim().replace(/\s+/g, " ");
  }, [session]);
  const [activeImp, setActiveImp] = useState(IMPORTS[0]?.code || "IMP-618");
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(false);
  const [overrideBusy, setOverrideBusy] = useState(false);
  const [q, setQ] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [statusFilter, setStatusFilter] = useState<string>(""); // "" = tous
  const [filterIsSav, setFilterIsSav] = useState<"all" | "sav" | "no-sav">("all");
  const [filterIsStock, setFilterIsStock] = useState<"all" | "stock" | "no-stock">("all");
  const [filterZeroHT, setFilterZeroHT] = useState<boolean>(false);

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
    let out = data.rows;
    if (needle) {
      out = out.filter(
        (r) =>
          r.bcdi.toLowerCase().includes(needle) ||
          (r.client || "").toLowerCase().includes(needle) ||
          (r.commercial || "").toLowerCase().includes(needle) ||
          (r.note || "").toLowerCase().includes(needle) ||
          r.items.some(
            (it) =>
              it.ref.toLowerCase().includes(needle) ||
              it.description.toLowerCase().includes(needle)
          )
      );
    }
    if (statusFilter) {
      out = out.filter((r) => (r.status || "") === statusFilter);
    }
    if (filterIsSav !== "all") {
      out = out.filter((r) => (filterIsSav === "sav" ? r.isSav : !r.isSav));
    }
    if (filterIsStock !== "all") {
      out = out.filter((r) => (filterIsStock === "stock" ? r.isStock : !r.isStock));
    }
    if (filterZeroHT) {
      out = out.filter((r) => !r.isStock && !r.isSav && (r.totalHT == null || r.totalHT === 0));
    }
    if (sortKey) {
      const mul = sortDir === "asc" ? 1 : -1;
      out = [...out].sort((a, b) => {
        const av = a[sortKey] as number | string | null;
        const bv = b[sortKey] as number | string | null;
        // null toujours en bas
        if (av == null && bv == null) return 0;
        if (av == null) return 1;
        if (bv == null) return -1;
        if (typeof av === "number" && typeof bv === "number") return (av - bv) * mul;
        return String(av).localeCompare(String(bv), "fr", { sensitivity: "base" }) * mul;
      });
    }
    return out;
  }, [data, q, statusFilter, filterIsSav, filterIsStock, filterZeroHT, sortKey, sortDir]);

  const allStatuses = useMemo(() => {
    if (!data) return [] as string[];
    return Array.from(new Set(data.rows.map((r) => r.status).filter(Boolean))) as string[];
  }, [data]);

  const handleSort = (k: SortKey) => {
    setSortKey((prev) => {
      if (prev === k) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        return prev;
      }
      setSortDir("asc");
      return k;
    });
  };

  const toggleExpand = (bcdi: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(bcdi)) next.delete(bcdi);
      else next.add(bcdi);
      return next;
    });
  };

  const setOverride = useCallback(
    async (
      bcdi: string,
      action: "to-stock" | "restore" | "set-amount" | "set-note",
      payload?: { note?: string | null; restePayerHT?: number | null; totalHT?: number | null }
    ) => {
      setOverrideBusy(true);
      try {
        const res = await fetch("/api/achat/previsionnel/override", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bcdi, impCode: activeImp, action, ...payload }),
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

        {/* Toolbar — Filtres */}
        <div className="px-4 py-2.5 flex flex-wrap items-center gap-2 bg-cockpit border-b border-cockpit/60">
          <span className="text-[11px] uppercase tracking-wider text-cockpit-secondary font-semibold">
            Filtres :
          </span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-2 py-1 border border-cockpit-input rounded-input bg-cockpit-card text-cockpit-primary focus:outline-none focus:ring-1 focus:ring-[var(--color-active)]"
          >
            <option value="">Statut : tous</option>
            {allStatuses.map((s) => (
              <option key={s} value={s}>
                {STATUS_BADGES[s]?.label || s}
              </option>
            ))}
          </select>
          <select
            value={filterIsSav}
            onChange={(e) => setFilterIsSav(e.target.value as "all" | "sav" | "no-sav")}
            className="text-xs px-2 py-1 border border-cockpit-input rounded-input bg-cockpit-card text-cockpit-primary focus:outline-none focus:ring-1 focus:ring-[var(--color-active)]"
          >
            <option value="all">SAV : tous</option>
            <option value="sav">Uniquement SAV</option>
            <option value="no-sav">Sans SAV</option>
          </select>
          <select
            value={filterIsStock}
            onChange={(e) => setFilterIsStock(e.target.value as "all" | "stock" | "no-stock")}
            className="text-xs px-2 py-1 border border-cockpit-input rounded-input bg-cockpit-card text-cockpit-primary focus:outline-none focus:ring-1 focus:ring-[var(--color-active)]"
          >
            <option value="all">Stock : tous</option>
            <option value="stock">Uniquement stock</option>
            <option value="no-stock">Sans stock</option>
          </select>
          <label className="inline-flex items-center gap-1.5 text-xs text-cockpit-primary cursor-pointer">
            <input
              type="checkbox"
              checked={filterZeroHT}
              onChange={(e) => setFilterZeroHT(e.target.checked)}
              className="accent-[var(--color-active)]"
            />
            BDC à 0 HT (hors SAV)
          </label>
          {(statusFilter || filterIsSav !== "all" || filterIsStock !== "all" || filterZeroHT) && (
            <button
              onClick={() => {
                setStatusFilter("");
                setFilterIsSav("all");
                setFilterIsStock("all");
                setFilterZeroHT(false);
              }}
              className="text-[11px] text-cockpit-secondary hover:text-cockpit-primary underline"
            >
              Réinitialiser
            </button>
          )}
        </div>

        {/* Toolbar — Recherche + actions */}
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
                  <SortableHeader label="N° BCDI" field="bcdi" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} width="w-28" />
                  <SortableHeader label="Client" field="client" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                  <SortableHeader label="Propriétaire" field="commercial" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} width="w-32" />
                  <SortableHeader label="Statut" field="status" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} width="w-40" />
                  <SortableHeader label="Nb meubles" field="nbMeubles" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} align="right" width="w-20" />
                  <SortableHeader label="Total HT" field="totalHT" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} align="right" width="w-24" />
                  <SortableHeader label="Reste à payer HT" field="restePayerHT" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} align="right" width="w-32" />
                  <SortableHeader label="Potentiel comm." field="potentielCommercial" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} align="right" width="w-32" />
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
                          <span className="inline-flex items-center gap-1.5">
                            <span>{r.bcdi}</span>
                            {r.note && (
                              <span
                                title={r.note}
                                className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-100 text-amber-700 border border-amber-300"
                              >
                                <StickyNote className="w-2.5 h-2.5" />
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-cockpit-heading">
                          <div className="flex flex-col gap-0.5">
                            <span>
                              {r.client || (
                                <span className="text-cockpit-secondary/70">—</span>
                              )}
                            </span>
                            {r.note && <ContactBadge note={r.note} />}
                          </div>
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
                          <span className="inline-flex items-center gap-1">
                            {r.hasManualTotalHT && (
                              <Pencil className="w-2.5 h-2.5 text-[var(--color-active)]" />
                            )}
                            {eur(r.totalHT)}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono font-semibold text-emerald-700">
                          <span className="inline-flex items-center gap-1">
                            {r.hasManualRestePayer && (
                              <Pencil className="w-2.5 h-2.5 text-[var(--color-active)]" />
                            )}
                            {eur(r.restePayerHT)}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono font-semibold text-amber-700">
                          {eur(r.potentielCommercial)}
                        </td>
                      </tr>
                      {isOpen && (
                        <ExpandedRow
                          row={r}
                          busy={overrideBusy}
                          userName={userName}
                          onConvert={(b, note) => setOverride(b, "to-stock", { note })}
                          onRestore={(b) => setOverride(b, "restore")}
                          onSetAmount={(b, restePayerHT, totalHT) =>
                            setOverride(b, "set-amount", { restePayerHT, totalHT })
                          }
                          onSetNote={(b, note) => setOverride(b, "set-note", { note })}
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
