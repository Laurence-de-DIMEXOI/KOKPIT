"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw, AlertTriangle, CheckCircle2, Ship, Plus, X, PackageCheck, ChevronDown, ChevronRight } from "lucide-react";

const PREP_IMP = "IMP-619";

interface PrepPayload {
  imp: string;
  items: Array<{ bcdi: string; client: string | null; dateCommande: string | null; montantHT: number | null; trelloStatut: string | null; pret: boolean }>;
  nb: number;
  prets: number;
  totalHT: number;
  bcdis: string[];
}

interface ResItem {
  bcdi: string;
  client: string | null;
  dateCommande: string | null;
  montantHT: number | null;
  trelloStatut: string | null;
  pret: boolean;
  found: boolean;
  isStock: boolean;
  forcedStock: boolean;
  isSav: boolean;
  dansImp618: boolean;
}
interface ResMonth {
  key: string;
  nb: number;
  prets: number;
  urgents: number;
  stock: number;
  totalHT: number;
  enRetard: boolean;
  rattrapage: boolean;
  items: ResItem[];
}
interface ResPayload {
  params: { delaiTotalMois: number; delaiBateauMois: number };
  nowKey: string;
  moisCible: string;
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
  const [prep, setPrep] = useState<PrepPayload | null>(null);
  const [prepOpen, setPrepOpen] = useState(true);
  const [prepBusy, setPrepBusy] = useState<string | null>(null);

  const fetchPrep = useCallback(async () => {
    try {
      const res = await fetch(`/api/achat/reservoir/prep?imp=${PREP_IMP}`);
      if (res.ok) setPrep(await res.json());
    } catch { /* silencieux */ }
  }, []);
  useEffect(() => { fetchPrep(); }, [fetchPrep]);

  const prepSet = useMemo(() => new Set(prep?.bcdis || []), [prep]);
  const [stockBusy, setStockBusy] = useState<string | null>(null);

  const togglePrep = useCallback(async (bcdi: string) => {
    const action = prepSet.has(bcdi) ? "remove" : "add";
    setPrepBusy(bcdi);
    try {
      await fetch("/api/achat/reservoir/prep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imp: PREP_IMP, bcdi, action }),
      });
      await fetchPrep();
    } finally {
      setPrepBusy(null);
    }
  }, [prepSet, fetchPrep]);

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

  const toggleStock = useCallback(async (bcdi: string, currentlyForced: boolean) => {
    setStockBusy(bcdi);
    try {
      await fetch("/api/achat/reservoir/override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bcdi, action: currentlyForced ? "reset" : "stock" }),
      });
      await fetchData();
    } finally {
      setStockBusy(null);
    }
  }, [fetchData]);

  // Onglet par défaut : le mois cible (rattrapage), sinon 1er en retard, sinon 1er
  useEffect(() => {
    if (!data || activeMonth) return;
    const target = data.months.find((m) => m.rattrapage) || data.months.find((m) => m.enRetard);
    setActiveMonth((target || data.months[0])?.key || null);
  }, [data, activeMonth]);

  const active = useMemo(() => data?.months.find((m) => m.key === activeMonth) || null, [data, activeMonth]);
  const containerType = (activeMonth && containerByMonth[activeMonth]) || "40ft HC";

  const totaux = useMemo(() => {
    if (!data) return { nb: 0, prets: 0, readyToSent: 0, ht: 0, retard: 0 };
    const acc = { nb: 0, prets: 0, readyToSent: 0, ht: 0, retard: 0 };
    for (const m of data.months) {
      acc.nb += m.nb;
      acc.prets += m.prets;
      acc.ht += m.totalHT;
      acc.retard += m.enRetard ? m.nb : 0;
      acc.readyToSent += m.items.filter((i) => i.trelloStatut === "Ready to Sent").length;
    }
    return acc;
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
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold shadow-cockpit-sm">
            <CheckCircle2 className="w-4 h-4" /> {totaux.readyToSent} prêts à charger (Indonésie)
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700"><b>{totaux.prets}</b> avancés (entrepôt+)</span>
          <span className="px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-700"><b>{totaux.retard}</b> en retard</span>
          <span className="px-3 py-1.5 rounded-lg bg-cockpit-card border border-cockpit">{eur(totaux.ht)} HT</span>
          {data.horsScopeCount > 0 && (
            <span className="px-3 py-1.5 rounded-lg bg-cockpit border border-cockpit text-cockpit-secondary">{data.horsScopeCount} cartes &lt; 2024 (stale, ignorées)</span>
          )}
        </div>
      )}

      {/* Panneau préparation container */}
      <div className="bg-[var(--color-active)]/5 rounded-card border border-[var(--color-active)]/30 overflow-hidden">
        <button onClick={() => setPrepOpen((o) => !o)}
          className="w-full flex items-center gap-2 px-4 py-2.5 text-left">
          <PackageCheck className="w-4 h-4 text-[var(--color-active)]" />
          <span className="text-sm font-semibold text-cockpit-heading">Préparation {PREP_IMP}</span>
          <span className="text-xs text-cockpit-secondary">
            {prep ? `${prep.nb} commandes · ${prep.prets} prêtes · ${eur(prep.totalHT)} HT` : "…"}
          </span>
          {prepOpen ? <ChevronDown className="w-4 h-4 ml-auto text-cockpit-secondary" /> : <ChevronRight className="w-4 h-4 ml-auto text-cockpit-secondary" />}
        </button>
        {prepOpen && (
          <div className="px-4 pb-3">
            {!prep || prep.items.length === 0 ? (
              <p className="text-xs text-cockpit-secondary italic py-2">
                Aucune commande. Ajoute des BCDI depuis les onglets ci-dessous (bouton +).
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {prep.items.map((it) => (
                  <span key={it.bcdi}
                    className="inline-flex items-center gap-1.5 text-xs bg-cockpit-card border border-cockpit rounded-lg pl-2 pr-1 py-1">
                    <span className="font-mono text-[var(--color-active)]">{it.bcdi}</span>
                    <span className="text-cockpit-secondary truncate max-w-[120px]">{it.client}</span>
                    {it.pret && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                    <button onClick={() => togglePrep(it.bcdi)} disabled={prepBusy === it.bcdi}
                      className="p-0.5 rounded hover:bg-red-100 text-cockpit-secondary hover:text-red-600">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

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
                  {(m.rattrapage || m.enRetard) && <AlertTriangle className="w-3 h-3 text-red-500" />}
                  {moisLabel(m.key)}
                  <span className="text-[10px] opacity-70">({m.urgents}{m.stock ? `+${m.stock}` : ""})</span>
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
                {active.rattrapage && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                    <AlertTriangle className="w-3 h-3" /> Rattrapage backlog (≤ {moisLabel(active.key)})
                  </span>
                )}
                <span className="text-xs text-cockpit-secondary">
                  {active.urgents} à charger · <span className="text-emerald-700 font-medium">{active.prets} prêtes</span>
                  {active.stock > 0 && <> · <span className="text-amber-700">{active.stock} stock magasin</span></>} · {eur(active.totalHT)} HT
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
                      <th className="px-2 py-2 w-9"></th>
                      <th className="px-3 py-2 text-left font-semibold w-28">N° BCDI</th>
                      <th className="px-3 py-2 text-left font-semibold">Client</th>
                      <th className="px-3 py-2 text-left font-semibold w-24">Commande</th>
                      <th className="px-3 py-2 text-right font-semibold w-24">Montant HT</th>
                      <th className="px-3 py-2 text-left font-semibold w-40">Statut prod (Trello)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {active.items.map((it) => (
                      <tr key={it.bcdi} className={`border-b border-cockpit/50 ${
                        prepSet.has(it.bcdi) ? "bg-[var(--color-active)]/10"
                          : it.isStock ? "bg-amber-50/30 opacity-80"
                          : it.pret ? "bg-emerald-50/30" : ""
                      }`}>
                        <td className="px-2 py-2">
                          <button onClick={() => togglePrep(it.bcdi)} disabled={prepBusy === it.bcdi}
                            title={prepSet.has(it.bcdi) ? "Retirer de la préparation" : "Ajouter à la préparation"}
                            className={`w-6 h-6 inline-flex items-center justify-center rounded-md border transition-colors disabled:opacity-40 ${
                              prepSet.has(it.bcdi)
                                ? "bg-[var(--color-active)] border-[var(--color-active)] text-white"
                                : "border-cockpit-input text-cockpit-secondary hover:border-[var(--color-active)] hover:text-[var(--color-active)]"
                            }`}>
                            {prepBusy === it.bcdi ? <Loader2 className="w-3 h-3 animate-spin" /> : prepSet.has(it.bcdi) ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                          </button>
                        </td>
                        <td className="px-3 py-2 font-mono text-xs font-semibold text-[var(--color-active)]">
                          <span className="inline-flex items-center gap-1.5 flex-wrap">
                            {it.bcdi}
                            {it.isSav && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700">SAV</span>}
                            {it.isStock && <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800">Stock magasin{it.forcedStock ? " (manuel)" : ""}</span>}
                            {it.dansImp618 && <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-sky-100 text-sky-700">déjà IMP-618</span>}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-cockpit-heading">{it.client || <span className="text-cockpit-secondary/60">—</span>}</td>
                        <td className="px-3 py-2 text-cockpit-primary text-xs">{dateCourt(it.dateCommande)}</td>
                        <td className="px-3 py-2 text-right font-mono text-cockpit-primary">{eur(it.montantHT)}</td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUT_STYLE[it.trelloStatut || ""] || "bg-gray-100 text-gray-600"}`}>
                              {it.pret && <CheckCircle2 className="w-3 h-3" />}
                              {it.trelloStatut || "—"}
                            </span>
                            <button
                              onClick={() => toggleStock(it.bcdi, it.forcedStock)}
                              disabled={stockBusy === it.bcdi}
                              title={it.forcedStock ? "Annuler la conversion en stock" : "Convertir en stock magasin (on le fait venir pour le magasin)"}
                              className={`text-[10px] font-medium px-1.5 py-0.5 rounded border transition-colors disabled:opacity-40 ${
                                it.forcedStock
                                  ? "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
                                  : "border-cockpit-input text-cockpit-secondary hover:border-amber-400 hover:text-amber-700"
                              }`}>
                              {stockBusy === it.bcdi ? "…" : it.forcedStock ? "↩ client" : "→ stock"}
                            </button>
                          </div>
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
