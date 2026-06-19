"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw, AlertTriangle, CheckCircle2, Ship } from "lucide-react";

interface ResItem {
  bcdi: string;
  client: string | null;
  dateCommande: string | null;
  montantHT: number | null;
  trelloStatut: string | null;
  pret: boolean;
  found: boolean;
}
interface ResMonth {
  key: string;
  nb: number;
  prets: number;
  totalHT: number;
  enRetard: boolean;
  items: ResItem[];
}
interface ResPayload {
  params: { delaiTotalMois: number; delaiBateauMois: number };
  nowKey: string;
  months: ResMonth[];
  sansDate: ResItem[];
  horsScopeCount: number;
  total: number;
}

const CONTAINERS: Record<string, number> = { "20ft": 33, "40ft HC": 76.4 };

function eur(n: number | null): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}
function moisLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}
function dateCourt(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

const STATUT_STYLE: Record<string, string> = {
  "Ready to Sent": "bg-emerald-100 text-emerald-700",
  "In Warehouse": "bg-violet-100 text-violet-700",
  "Finishing": "bg-amber-100 text-amber-700",
  "Check 1 @Carpenter": "bg-blue-100 text-blue-700",
  "Check 2 @Carpenter": "bg-blue-100 text-blue-700",
  "Check 3 @Carpenter": "bg-blue-100 text-blue-700",
  "Questions Asked": "bg-amber-100 text-amber-700",
  "BCDI": "bg-gray-100 text-gray-600",
  "Problems on furniture": "bg-red-100 text-red-700",
};

export function ReservoirPlanning() {
  const [data, setData] = useState<ResPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [delaiTotal, setDelaiTotal] = useState(6);
  const [delaiBateau, setDelaiBateau] = useState(1.5);
  const [activeMonth, setActiveMonth] = useState<string | null>(null);
  const [containerByMonth, setContainerByMonth] = useState<Record<string, string>>({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/achat/reservoir?delaiTotal=${delaiTotal}&delaiBateau=${delaiBateau}`);
      const j = await res.json();
      if (res.ok) setData(j);
    } finally {
      setLoading(false);
    }
  }, [delaiTotal, delaiBateau]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Onglet par défaut : 1er mois en retard (le plus ancien), sinon le 1er
  useEffect(() => {
    if (!data || activeMonth) return;
    const firstRetard = data.months.find((m) => m.enRetard);
    setActiveMonth((firstRetard || data.months[0])?.key || null);
  }, [data, activeMonth]);

  const active = useMemo(() => data?.months.find((m) => m.key === activeMonth) || null, [data, activeMonth]);
  const containerType = (activeMonth && containerByMonth[activeMonth]) || "40ft HC";

  const totaux = useMemo(() => {
    if (!data) return { nb: 0, prets: 0, ht: 0, retard: 0 };
    return data.months.reduce(
      (a, m) => ({
        nb: a.nb + m.nb,
        prets: a.prets + m.prets,
        ht: a.ht + m.totalHT,
        retard: a.retard + (m.enRetard ? m.nb : 0),
      }),
      { nb: 0, prets: 0, ht: 0, retard: 0 }
    );
  }, [data]);

  return (
    <div className="space-y-4">
      {/* Bandeau réglages */}
      <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-sm p-4 flex flex-wrap items-end gap-4">
        <div className="flex items-center gap-2">
          <Ship className="w-5 h-5" style={{ color: "var(--color-active)" }} />
          <div>
            <p className="text-sm font-semibold text-cockpit-heading">Planning réservoir</p>
            <p className="text-[11px] text-cockpit-secondary">Commandes à charger, par mois de chargement (Trello × Sellsy)</p>
          </div>
        </div>
        <label className="text-xs text-cockpit-secondary">
          Délai total (mois)
          <input type="number" step="0.5" min="1" value={delaiTotal}
            onChange={(e) => { setDelaiTotal(Number(e.target.value)); setActiveMonth(null); }}
            className="ml-2 w-16 px-2 py-1 border border-cockpit-input rounded-input bg-cockpit-input text-cockpit-primary" />
        </label>
        <label className="text-xs text-cockpit-secondary">
          Dont bateau (mois)
          <input type="number" step="0.5" min="0" value={delaiBateau}
            onChange={(e) => { setDelaiBateau(Number(e.target.value)); setActiveMonth(null); }}
            className="ml-2 w-16 px-2 py-1 border border-cockpit-input rounded-input bg-cockpit-input text-cockpit-primary" />
        </label>
        <span className="text-[11px] text-cockpit-secondary">
          → production {Math.max(0, delaiTotal - delaiBateau)} mois
        </span>
        <button onClick={fetchData} disabled={loading}
          className="ml-auto inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-cockpit-primary border border-cockpit-input rounded-input hover:bg-cockpit-card disabled:opacity-50">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Rafraîchir
        </button>
      </div>

      {/* Résumé global */}
      {data && (
        <div className="flex flex-wrap gap-3 text-xs">
          <span className="px-3 py-1.5 rounded-lg bg-cockpit-card border border-cockpit"><b>{totaux.nb}</b> commandes en réservoir</span>
          <span className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700"><b>{totaux.prets}</b> prêtes à charger</span>
          <span className="px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-700"><b>{totaux.retard}</b> en retard</span>
          <span className="px-3 py-1.5 rounded-lg bg-cockpit-card border border-cockpit">{eur(totaux.ht)} HT</span>
          {data.horsScopeCount > 0 && (
            <span className="px-3 py-1.5 rounded-lg bg-cockpit border border-cockpit text-cockpit-secondary">{data.horsScopeCount} cartes &lt; 2024 (stale, ignorées)</span>
          )}
        </div>
      )}

      {/* Onglets mois */}
      {loading && !data ? (
        <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-cockpit-secondary" /></div>
      ) : data && data.months.length > 0 ? (
        <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-sm overflow-hidden">
          <div className="flex items-center gap-1 px-3 pt-2 border-b border-cockpit overflow-x-auto">
            {data.months.map((m) => {
              const act = m.key === activeMonth;
              return (
                <button key={m.key} onClick={() => setActiveMonth(m.key)}
                  className={`px-3 py-2 text-xs font-medium rounded-t-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    act ? "bg-[var(--color-active)]/10 text-[var(--color-active)] border-b-2 border-[var(--color-active)] -mb-px"
                        : "text-cockpit-secondary hover:text-cockpit-primary"
                  }`}>
                  {m.enRetard && <AlertTriangle className="w-3 h-3 text-red-500" />}
                  {moisLabel(m.key)}
                  <span className="text-[10px] opacity-70">({m.nb})</span>
                </button>
              );
            })}
          </div>

          {active && (
            <div className="p-4 space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-semibold text-cockpit-heading">
                  Chargement {moisLabel(active.key)}
                </span>
                {active.enRetard && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                    <AlertTriangle className="w-3 h-3" /> En retard
                  </span>
                )}
                <span className="text-xs text-cockpit-secondary">
                  {active.nb} commandes · <span className="text-emerald-700 font-medium">{active.prets} prêtes</span> · {eur(active.totalHT)} HT
                </span>
                <label className="ml-auto text-xs text-cockpit-secondary">
                  Container prévu :
                  <select value={containerType}
                    onChange={(e) => setContainerByMonth((p) => ({ ...p, [active.key]: e.target.value }))}
                    className="ml-2 px-2 py-1 border border-cockpit-input rounded-input bg-cockpit-card text-cockpit-primary">
                    {Object.keys(CONTAINERS).map((c) => <option key={c} value={c}>{c} (~{CONTAINERS[c]} m³)</option>)}
                  </select>
                </label>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-[11px] uppercase tracking-wider text-cockpit-secondary border-b border-cockpit">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold w-28">N° BCDI</th>
                      <th className="px-3 py-2 text-left font-semibold">Client</th>
                      <th className="px-3 py-2 text-left font-semibold w-24">Commande</th>
                      <th className="px-3 py-2 text-right font-semibold w-24">Montant HT</th>
                      <th className="px-3 py-2 text-left font-semibold w-40">Statut prod (Trello)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {active.items.map((it) => (
                      <tr key={it.bcdi} className={`border-b border-cockpit/50 ${it.pret ? "bg-emerald-50/30" : ""}`}>
                        <td className="px-3 py-2 font-mono text-xs font-semibold text-[var(--color-active)]">{it.bcdi}</td>
                        <td className="px-3 py-2 text-cockpit-heading">{it.client || <span className="text-cockpit-secondary/60">—</span>}</td>
                        <td className="px-3 py-2 text-cockpit-primary text-xs">{dateCourt(it.dateCommande)}</td>
                        <td className="px-3 py-2 text-right font-mono text-cockpit-primary">{eur(it.montantHT)}</td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUT_STYLE[it.trelloStatut || ""] || "bg-gray-100 text-gray-600"}`}>
                            {it.pret && <CheckCircle2 className="w-3 h-3" />}
                            {it.trelloStatut || "—"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="py-12 text-center text-cockpit-secondary text-sm">Aucune commande dans le réservoir</div>
      )}
    </div>
  );
}
