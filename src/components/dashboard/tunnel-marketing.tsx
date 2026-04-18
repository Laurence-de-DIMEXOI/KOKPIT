"use client";

import { useEffect, useState, useCallback } from "react";
import { Inbox, FileText, ShoppingCart, Target, Wallet, Loader2 } from "lucide-react";
import clsx from "clsx";

type Periode = "jour" | "semaine" | "mois" | "annee" | "custom";

interface TunnelData {
  periode: Periode;
  debut: string;
  fin: string;
  demandes: number;
  devisLies: number;
  bdcLies: number;
  caAttribue: number;
  caDevis: number;
  conversion: number;
  depenses: number;
  roas: number | null;
  parSource: Array<{
    source: string;
    demandes: number;
    devis: number;
    bdc: number;
    caAttribue: number;
    conversion: number;
  }>;
}

const PERIODES: Array<{ value: Periode; label: string }> = [
  { value: "jour", label: "Aujourd'hui" },
  { value: "semaine", label: "Cette semaine" },
  { value: "mois", label: "Ce mois" },
  { value: "annee", label: "Cette année" },
  { value: "custom", label: "Période custom" },
];

function eur(n: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

function pct(num: number, den: number): string {
  if (den === 0) return "0%";
  return `${Math.round((num / den) * 1000) / 10}%`;
}

export function TunnelMarketing() {
  const [periode, setPeriode] = useState<Periode>("mois");
  const [dateDebut, setDateDebut] = useState<string>("");
  const [dateFin, setDateFin] = useState<string>("");
  const [data, setData] = useState<TunnelData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTunnel = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ periode });
      if (periode === "custom" && dateDebut) params.set("dateDebut", dateDebut);
      if (periode === "custom" && dateFin) params.set("dateFin", dateFin);
      const res = await fetch(`/api/marketing/tunnel?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } finally {
      setLoading(false);
    }
  }, [periode, dateDebut, dateFin]);

  useEffect(() => { fetchTunnel(); }, [fetchTunnel]);

  return (
    <div className="space-y-4">
      {/* ===== Header + filtres période ===== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-cockpit-heading flex items-center gap-2">
            <Target className="w-5 h-5" style={{ color: "var(--color-active)" }} />
            Tunnel marketing — Attribution réelle
          </h2>
          <p className="text-xs text-cockpit-secondary mt-0.5">
            Demande &rarr; Devis (7j) &rarr; BDC (30j) · basé sur AttributionDevis/BDC
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {PERIODES.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriode(p.value)}
              className={clsx(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                periode === p.value
                  ? "text-white shadow-sm"
                  : "bg-white border border-cockpit text-cockpit-secondary hover:text-cockpit-heading"
              )}
              style={
                periode === p.value
                  ? { background: "linear-gradient(135deg, var(--color-active), #FEEB9C)" }
                  : undefined
              }
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dates custom */}
      {periode === "custom" && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <label className="flex items-center gap-2">
            <span className="text-cockpit-secondary">Du</span>
            <input
              type="date"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              className="bg-white border border-cockpit rounded-lg px-2 py-1 text-sm"
            />
          </label>
          <label className="flex items-center gap-2">
            <span className="text-cockpit-secondary">au</span>
            <input
              type="date"
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
              className="bg-white border border-cockpit rounded-lg px-2 py-1 text-sm"
            />
          </label>
        </div>
      )}

      {loading ? (
        <div className="h-64 bg-white border border-cockpit rounded-xl animate-pulse flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-cockpit-secondary" />
        </div>
      ) : data ? (
        <>
          {/* ===== 4 KPI cards cascade ===== */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard
              icon={<Inbox className="w-5 h-5" style={{ color: "var(--color-active)" }} />}
              label="Demandes"
              value={data.demandes}
              sub="Reçues sur la période"
            />
            <KpiCard
              icon={<FileText className="w-5 h-5" style={{ color: "var(--color-active)" }} />}
              label="Devis liés"
              value={data.devisLies}
              badge={pct(data.devisLies, data.demandes)}
              sub={`Devis créé ≤ 7j · ${eur(data.caDevis)}`}
            />
            <KpiCard
              icon={<ShoppingCart className="w-5 h-5" style={{ color: "var(--color-active)" }} />}
              label="Commandes liées"
              value={data.bdcLies}
              badge={pct(data.bdcLies, data.devisLies)}
              sub={`BDC créé ≤ 30j · ${eur(data.caAttribue)}`}
            />
            <KpiCard
              icon={<Target className="w-5 h-5" style={{ color: "var(--color-active)" }} />}
              label="Conversion"
              value={`${data.conversion}%`}
              sub="Demande → Vente"
            />
          </div>

          {/* ===== Tableau sources ===== */}
          <div className="bg-white border border-cockpit rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-cockpit bg-cockpit-lighter/30">
              <h3 className="text-sm font-bold text-cockpit-heading">Répartition par source</h3>
            </div>
            {data.parSource.length === 0 ? (
              <div className="p-6 text-center text-sm text-cockpit-secondary">
                Aucune demande sur cette période
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-cockpit-secondary uppercase bg-cockpit-lighter/20">
                    <tr>
                      <th className="text-left px-4 py-2 font-semibold">Source</th>
                      <th className="text-right px-4 py-2 font-semibold">Demandes</th>
                      <th className="text-right px-4 py-2 font-semibold">Devis</th>
                      <th className="text-right px-4 py-2 font-semibold">BDC</th>
                      <th className="text-right px-4 py-2 font-semibold">CA attribué</th>
                      <th className="text-right px-4 py-2 font-semibold">Conv%</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cockpit/50">
                    {data.parSource.map((s) => (
                      <tr key={s.source} className="hover:bg-cockpit-lighter/10">
                        <td className="px-4 py-2 font-medium text-cockpit-heading">{s.source}</td>
                        <td className="text-right px-4 py-2">{s.demandes}</td>
                        <td className="text-right px-4 py-2">{s.devis}</td>
                        <td className="text-right px-4 py-2">{s.bdc}</td>
                        <td className="text-right px-4 py-2 font-semibold" style={{ color: "var(--color-active)" }}>
                          {eur(s.caAttribue)}
                        </td>
                        <td className="text-right px-4 py-2 text-cockpit-secondary">{s.conversion}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ===== ROAS global ===== */}
          <div
            className="rounded-xl p-4 sm:p-5 border flex flex-col sm:flex-row sm:items-center gap-4"
            style={{
              background: "linear-gradient(135deg, var(--color-active)10, #FEEB9C20)",
              borderColor: "var(--color-active)",
            }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, var(--color-active), #FEEB9C)" }}
            >
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <p className="text-[11px] text-cockpit-secondary uppercase tracking-wide">CA attribué</p>
                <p className="text-xl font-bold text-cockpit-heading">{eur(data.caAttribue)}</p>
              </div>
              <div>
                <p className="text-[11px] text-cockpit-secondary uppercase tracking-wide">Dépenses marketing</p>
                <p className="text-xl font-bold text-cockpit-heading">{eur(data.depenses)}</p>
              </div>
              <div>
                <p className="text-[11px] text-cockpit-secondary uppercase tracking-wide">ROAS global</p>
                <p className="text-xl font-bold" style={{ color: "var(--color-active)" }}>
                  {data.roas === null ? "—" : `${data.roas}x`}
                </p>
                {data.roas !== null && data.roas > 0 && (
                  <p className="text-[10px] text-cockpit-secondary mt-0.5">
                    Pour 1€ investi : {eur(data.roas)} de CA
                  </p>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="p-6 text-center text-sm text-cockpit-secondary bg-white border border-cockpit rounded-xl">
          Impossible de charger le tunnel
        </div>
      )}
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  badge,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  badge?: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl overflow-hidden bg-white border border-cockpit transition-transform duration-200 hover:-translate-y-0.5">
      <div className="h-1.5" style={{ background: "linear-gradient(90deg, var(--color-active), #FEEB9C)" }} />
      <div className="p-3 sm:p-4">
        <div className="flex items-center justify-between mb-2">
          {icon}
          {badge && (
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: "var(--color-active-light)", color: "var(--color-active)" }}
            >
              {badge}
            </span>
          )}
        </div>
        <p className="text-cockpit-secondary text-xs mb-1">{label}</p>
        <p className="text-2xl font-bold" style={{ color: "var(--color-active)" }}>
          {value}
        </p>
        {sub && <p className="text-cockpit-secondary text-[10px] mt-1">{sub}</p>}
      </div>
    </div>
  );
}
