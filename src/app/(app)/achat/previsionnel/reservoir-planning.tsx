"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw, AlertTriangle, CheckCircle2, Ship, Plus, X, PackageCheck, ChevronDown, ChevronRight, Warehouse, Upload } from "lucide-react";

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
  etatProduit: string | null;
  bdoBcNumber: string | null;
  moisTheorique: string | null;
  retard: boolean;
  nbMeubles: number;
}
interface Depart {
  key: string;
  id: string | null;
  date: string;
  dateArrivee: string | null;
  navire: string | null;
  estime: boolean;
  isImp618: boolean;
  parti: boolean;
  capacite: number;
  nbMeubles: number;
  nb: number;
  prets: number;
  retards: number;
  totalHT: number;
  items: ResItem[];
}
interface DepartConfig {
  id: string;
  dateDepart: string;
  dateArrivee: string | null;
  capaciteMeubles: number;
  navire: string | null;
  note: string | null;
}
interface ResPayload {
  params: { delaiTotalMois: number; delaiBateauMois: number };
  capacite: number;
  departs: Depart[];
  stock: ResItem[];
  stockMeubles: number;
  sansDate: ResItem[];
  horsScopeCount: number;
  dejaExpedies: number;
  total: number;
}

const STOCK_KEY = "__stock__";

function eur(n: number | null): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}
function departLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
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
  const [delaiTotal, setDelaiTotal] = useState(9);
  const [delaiBateau, setDelaiBateau] = useState(1.5);
  const [capacite, setCapacite] = useState(130);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [prep, setPrep] = useState<PrepPayload | null>(null);
  const [prepOpen, setPrepOpen] = useState(true);
  const [prepBusy, setPrepBusy] = useState<string | null>(null);
  const [stockBusy, setStockBusy] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [impCode, setImpCode] = useState("");
  const [importBusy, setImportBusy] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [departsOpen, setDepartsOpen] = useState(false);
  const [departsList, setDepartsList] = useState<DepartConfig[]>([]);
  const [departsBusy, setDepartsBusy] = useState(false);

  const fetchPrep = useCallback(async () => {
    try {
      const res = await fetch(`/api/achat/reservoir/prep?imp=${PREP_IMP}`);
      if (res.ok) setPrep(await res.json());
    } catch { /* silencieux */ }
  }, []);
  useEffect(() => { fetchPrep(); }, [fetchPrep]);

  const prepSet = useMemo(() => new Set(prep?.bcdis || []), [prep]);

  const togglePrep = useCallback(async (bcdi: string) => {
    const action = prepSet.has(bcdi) ? "remove" : "add";
    setPrepBusy(bcdi);
    try {
      await fetch("/api/achat/reservoir/prep", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imp: PREP_IMP, bcdi, action }),
      });
      await fetchPrep();
    } finally { setPrepBusy(null); }
  }, [prepSet, fetchPrep]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/achat/reservoir?delaiTotal=${delaiTotal}&delaiBateau=${delaiBateau}&capacite=${capacite}`);
      const j = await res.json();
      if (res.ok) setData(j);
    } finally { setLoading(false); }
  }, [delaiTotal, delaiBateau, capacite]);
  useEffect(() => { fetchData(); }, [fetchData]);

  const fetchDeparts = useCallback(async () => {
    try {
      const res = await fetch("/api/achat/reservoir/departs");
      if (res.ok) setDepartsList((await res.json()).departs || []);
    } catch { /* silencieux */ }
  }, []);
  useEffect(() => { fetchDeparts(); }, [fetchDeparts]);

  const addDepart = useCallback(async () => {
    setDepartsBusy(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      await fetch("/api/achat/reservoir/departs", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dateDepart: today, capaciteMeubles: capacite }),
      });
      await fetchDeparts(); await fetchData();
    } finally { setDepartsBusy(false); }
  }, [capacite, fetchDeparts, fetchData]);

  const updateDepart = useCallback(async (id: string, patch: Partial<DepartConfig>) => {
    setDepartsList((list) => list.map((d) => (d.id === id ? { ...d, ...patch } : d)));
    await fetch("/api/achat/reservoir/departs", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...patch }),
    });
    await fetchData();
  }, [fetchData]);

  const deleteDepart = useCallback(async (id: string) => {
    setDepartsBusy(true);
    try {
      await fetch(`/api/achat/reservoir/departs?id=${id}`, { method: "DELETE" });
      await fetchDeparts(); await fetchData();
    } finally { setDepartsBusy(false); }
  }, [fetchDeparts, fetchData]);

  // Édition inline d'un départ depuis son onglet. Un départ estimé est matérialisé (créé).
  const saveDepart = useCallback(async (dep: Depart, patch: Record<string, unknown>) => {
    if (dep.isImp618) return;
    const newKey = (patch.dateDepart as string) || dep.date.slice(0, 10);
    if (dep.id) {
      await fetch("/api/achat/reservoir/departs", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: dep.id, ...patch }),
      });
    } else {
      await fetch("/api/achat/reservoir/departs", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dateDepart: dep.date.slice(0, 10), capaciteMeubles: dep.capacite, ...patch }),
      });
    }
    setActiveKey(newKey);
    await fetchDeparts(); await fetchData();
  }, [fetchDeparts, fetchData]);

  const importImp = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formEl = e.currentTarget;
    const fd = new FormData(formEl);
    if (!fd.get("imp") || !(fd.getAll("files").length)) return;
    setImportBusy(true); setImportMsg(null);
    try {
      const res = await fetch("/api/achat/reservoir/imp-import", { method: "POST", body: fd });
      const j = await res.json();
      if (res.ok) {
        setImportMsg(`✓ ${j.imp} : ${j.bcdiTrouves} BCDI lus, ${j.retiresDuReservoir} retirés du réservoir`);
        setImpCode(""); formEl.reset();
        await fetchData();
      } else {
        setImportMsg(`⚠ ${j.error || "Échec de l'import"}`);
      }
    } catch {
      setImportMsg("⚠ Erreur réseau");
    } finally { setImportBusy(false); }
  }, [fetchData]);

  const toggleStock = useCallback(async (bcdi: string, currentlyForced: boolean) => {
    setStockBusy(bcdi);
    try {
      await fetch("/api/achat/reservoir/override", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bcdi, action: currentlyForced ? "reset" : "stock" }),
      });
      await fetchData();
    } finally { setStockBusy(null); }
  }, [fetchData]);

  // Onglet par défaut : 1er départ à venir (non parti), sinon le 1er
  useEffect(() => {
    if (!data || activeKey) return;
    const next = data.departs.find((d) => !d.parti) || data.departs[0];
    setActiveKey(next?.key || null);
  }, [data, activeKey]);

  const activeDepart = useMemo(
    () => (activeKey === STOCK_KEY ? null : data?.departs.find((d) => d.key === activeKey) || null),
    [data, activeKey]
  );
  const showStock = activeKey === STOCK_KEY;

  const totaux = useMemo(() => {
    if (!data) return { nb: 0, readyToSent: 0, ht: 0, retards: 0 };
    const acc = { nb: 0, readyToSent: 0, ht: 0, retards: 0 };
    for (const d of data.departs) {
      acc.nb += d.nb; acc.ht += d.totalHT; acc.retards += d.retards;
      acc.readyToSent += d.items.filter((i) => i.trelloStatut === "Ready to Sent").length;
    }
    return acc;
  }, [data]);

  const renderRow = (it: ResItem) => (
    <tr key={it.bcdi} className={`border-b border-cockpit/50 ${
      prepSet.has(it.bcdi) ? "bg-[var(--color-active)]/10" : it.isStock ? "bg-amber-50/30 opacity-80" : it.pret ? "bg-emerald-50/30" : ""
    }`}>
      <td className="px-2 py-2">
        <button onClick={() => togglePrep(it.bcdi)} disabled={prepBusy === it.bcdi}
          title={prepSet.has(it.bcdi) ? "Retirer de la préparation" : "Ajouter à la préparation"}
          className={`w-6 h-6 inline-flex items-center justify-center rounded-md border transition-colors disabled:opacity-40 ${
            prepSet.has(it.bcdi) ? "bg-[var(--color-active)] border-[var(--color-active)] text-white"
              : "border-cockpit-input text-cockpit-secondary hover:border-[var(--color-active)] hover:text-[var(--color-active)]"
          }`}>
          {prepBusy === it.bcdi ? <Loader2 className="w-3 h-3 animate-spin" /> : prepSet.has(it.bcdi) ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
        </button>
      </td>
      <td className="px-3 py-2 font-mono text-xs font-semibold text-[var(--color-active)] whitespace-nowrap">
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
          {it.bcdi}
          {prepSet.has(it.bcdi) && <span title={`Sélectionnée pour la préparation ${PREP_IMP}`} className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--color-active)] text-white whitespace-nowrap">{PREP_IMP}</span>}
          {it.bdoBcNumber && <span title={`Bois d'Orient — ${it.bdoBcNumber}`} className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 whitespace-nowrap">BO {it.bdoBcNumber}</span>}
          {it.isSav && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 whitespace-nowrap">SAV</span>}
          {it.isStock && <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 whitespace-nowrap">Stock magasin{it.forcedStock ? " (manuel)" : ""}</span>}
        </span>
      </td>
      <td className="px-3 py-2 text-cockpit-heading">{it.client || <span className="text-cockpit-secondary/60">—</span>}</td>
      <td className="px-3 py-2 text-cockpit-primary text-xs whitespace-nowrap">
        <span className="inline-flex items-center gap-1">
          {it.retard && <AlertTriangle className="w-3 h-3 text-red-500 flex-shrink-0" aria-label="En retard, non chargée" />}
          {dateCourt(it.dateCommande)}
        </span>
      </td>
      <td className="px-3 py-2 text-right font-mono text-cockpit-heading">{it.nbMeubles}</td>
      <td className="px-3 py-2 text-right font-mono text-cockpit-primary">{eur(it.montantHT)}</td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${STATUT_STYLE[it.trelloStatut || ""] || "bg-gray-100 text-gray-600"}`}>
            {it.pret && <CheckCircle2 className="w-3 h-3 flex-shrink-0" />}
            {it.trelloStatut || "—"}
          </span>
          <button onClick={() => toggleStock(it.bcdi, it.forcedStock)} disabled={stockBusy === it.bcdi}
            title={it.forcedStock ? "Annuler la conversion en stock" : "Convertir en stock magasin"}
            className={`text-[10px] font-medium px-1.5 py-0.5 rounded border transition-colors disabled:opacity-40 whitespace-nowrap ${
              it.forcedStock ? "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
                : "border-cockpit-input text-cockpit-secondary hover:border-amber-400 hover:text-amber-700"
            }`}>
            {stockBusy === it.bcdi ? "…" : it.forcedStock ? "↩ client" : "→ stock"}
          </button>
        </div>
      </td>
    </tr>
  );

  const tableHead = (
    <thead className="text-[11px] uppercase tracking-wider text-cockpit-secondary border-b border-cockpit">
      <tr>
        <th className="px-2 py-2 w-9"></th>
        <th className="px-3 py-2 text-left font-semibold w-44 whitespace-nowrap">N° BCDI</th>
        <th className="px-3 py-2 text-left font-semibold">Client</th>
        <th className="px-3 py-2 text-left font-semibold w-24">Commande</th>
        <th className="px-3 py-2 text-right font-semibold w-20">Meubles</th>
        <th className="px-3 py-2 text-right font-semibold w-24">Montant HT</th>
        <th className="px-3 py-2 text-left font-semibold w-56 whitespace-nowrap">Statut prod (Trello)</th>
      </tr>
    </thead>
  );

  return (
    <div className="space-y-4">
      {/* Bandeau réglages */}
      <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-sm p-4 flex flex-wrap items-end gap-4">
        <div className="flex items-center gap-2">
          <Ship className="w-5 h-5" style={{ color: "var(--color-active)" }} />
          <div>
            <p className="text-sm font-semibold text-cockpit-heading">Planning containers</p>
            <p className="text-[11px] text-cockpit-secondary">{departsList.length > 0 ? `${departsList.length} départ(s) MSC saisis` : "Départs estimés (6 sem.)"} · ~{capacite} meubles / container · sans couper les commandes</p>
          </div>
        </div>
        <label className="text-xs text-cockpit-secondary">
          Capacité défaut
          <input type="number" step="5" min="10" value={capacite}
            onChange={(e) => { setCapacite(Number(e.target.value)); setActiveKey(null); }}
            className="ml-2 w-16 px-2 py-1 border border-cockpit-input rounded-input bg-cockpit-input text-cockpit-primary" />
        </label>
        <label className="text-xs text-cockpit-secondary">
          Délai cible (mois)
          <input type="number" step="0.5" min="1" value={delaiTotal}
            onChange={(e) => { setDelaiTotal(Number(e.target.value)); setActiveKey(null); }}
            className="ml-2 w-16 px-2 py-1 border border-cockpit-input rounded-input bg-cockpit-input text-cockpit-primary" />
        </label>
        <span className="text-[11px] text-cockpit-secondary">(retard = vs date cible)</span>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => setDepartsOpen((o) => !o)}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-cockpit-primary border border-cockpit-input rounded-input hover:bg-cockpit-card">
            <Ship className="w-3.5 h-3.5" /> Départs MSC
          </button>
          <button onClick={() => { setImportOpen((o) => !o); setImportMsg(null); }}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-cockpit-primary border border-cockpit-input rounded-input hover:bg-cockpit-card">
            <Upload className="w-3.5 h-3.5" /> Ajouter un IMP parti
          </button>
          <button onClick={fetchData} disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-cockpit-primary border border-cockpit-input rounded-input hover:bg-cockpit-card disabled:opacity-50">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Rafraîchir
          </button>
        </div>
      </div>

      {/* Import packing list d'un IMP parti → exclut ses BCDI du réservoir */}
      {importOpen && (
        <form onSubmit={importImp} className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-sm p-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-[11px] text-cockpit-secondary mb-1">N° du container parti</label>
            <input name="imp" value={impCode} onChange={(e) => setImpCode(e.target.value)} placeholder="ex : 619"
              className="w-28 px-2 py-1.5 text-sm border border-cockpit-input rounded-input bg-cockpit-input text-cockpit-primary" />
          </div>
          <div className="flex-1 min-w-[220px]">
            <label className="block text-[11px] text-cockpit-secondary mb-1">Packing list(s) .xlsx</label>
            <input name="files" type="file" accept=".xlsx,.xls" multiple
              className="block w-full text-xs text-cockpit-primary file:mr-3 file:px-3 file:py-1.5 file:rounded-input file:border-0 file:text-xs file:font-medium file:bg-[var(--color-active)]/10 file:text-[var(--color-active)]" />
          </div>
          <button type="submit" disabled={importBusy}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-[var(--color-active)] rounded-input hover:opacity-90 disabled:opacity-50">
            {importBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />} Importer
          </button>
          {importMsg && <span className={`text-xs ${importMsg.startsWith("✓") ? "text-emerald-700" : "text-red-600"}`}>{importMsg}</span>}
          <span className="w-full text-[11px] text-cockpit-secondary">Les BCDI présents dans la packing list seront retirés du réservoir (déjà reçus). Les SAV sont conservés.</span>
        </form>
      )}

      {/* Gestion des départs MSC (horaires réels saisis à la main) */}
      {departsOpen && (
        <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-sm p-4 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Ship className="w-4 h-4 text-[var(--color-active)]" />
            <span className="text-sm font-semibold text-cockpit-heading">Départs containers (horaires MSC)</span>
            <a href="https://www.msc.com/fr/search-a-schedule" target="_blank" rel="noopener noreferrer"
              className="text-[11px] text-[var(--color-active)] underline">Consulter MSC (Semarang IDSRG → Pointe des Galets REPDG) ↗</a>
            <button onClick={addDepart} disabled={departsBusy}
              className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[var(--color-active)] rounded-input hover:opacity-90 disabled:opacity-50">
              <Plus className="w-3.5 h-3.5" /> Ajouter un départ
            </button>
          </div>
          {departsList.length === 0 ? (
            <p className="text-xs text-cockpit-secondary italic">Aucun départ saisi — le calendrier utilise une cadence estimée de 6 semaines. Ajoute les départs MSC réels ci-dessus.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-[10px] uppercase tracking-wider text-cockpit-secondary border-b border-cockpit">
                  <tr>
                    <th className="px-2 py-1.5 text-left font-semibold">Départ Semarang</th>
                    <th className="px-2 py-1.5 text-left font-semibold">Arrivée ≈ Réunion</th>
                    <th className="px-2 py-1.5 text-left font-semibold">Navire / réf.</th>
                    <th className="px-2 py-1.5 text-right font-semibold">Capacité</th>
                    <th className="px-2 py-1.5 w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {departsList.map((d) => (
                    <tr key={d.id} className="border-b border-cockpit/50">
                      <td className="px-2 py-1.5">
                        <input type="date" defaultValue={d.dateDepart?.slice(0, 10)}
                          onBlur={(e) => e.target.value && updateDepart(d.id, { dateDepart: e.target.value })}
                          className="px-2 py-1 border border-cockpit-input rounded-input bg-cockpit-input text-cockpit-primary" />
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="date" defaultValue={d.dateArrivee?.slice(0, 10) || ""}
                          onBlur={(e) => updateDepart(d.id, { dateArrivee: e.target.value || null })}
                          className="px-2 py-1 border border-cockpit-input rounded-input bg-cockpit-input text-cockpit-primary" />
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="text" defaultValue={d.navire || ""} placeholder="ex : MSC …"
                          onBlur={(e) => updateDepart(d.id, { navire: e.target.value || null })}
                          className="w-40 px-2 py-1 border border-cockpit-input rounded-input bg-cockpit-input text-cockpit-primary" />
                      </td>
                      <td className="px-2 py-1.5 text-right">
                        <input type="number" step="5" min="10" defaultValue={d.capaciteMeubles}
                          onBlur={(e) => Number(e.target.value) > 0 && updateDepart(d.id, { capaciteMeubles: Number(e.target.value) })}
                          className="w-16 px-2 py-1 border border-cockpit-input rounded-input bg-cockpit-input text-cockpit-primary text-right" />
                      </td>
                      <td className="px-2 py-1.5">
                        <button onClick={() => deleteDepart(d.id)} disabled={departsBusy}
                          className="p-1 rounded hover:bg-red-100 text-cockpit-secondary hover:text-red-600" title="Supprimer ce départ">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="text-[11px] text-cockpit-secondary">Les commandes sont réparties dans ces départs (FIFO, sans couper). Au-delà des départs saisis, une cadence estimée de 6 semaines prend le relais.</p>
        </div>
      )}

      {/* Résumé global */}
      {data && (
        <div className="flex flex-wrap gap-3 text-xs">
          <span className="px-3 py-1.5 rounded-lg bg-cockpit-card border border-cockpit"><b>{totaux.nb}</b> commandes à planifier</span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold shadow-cockpit-sm">
            <CheckCircle2 className="w-4 h-4" /> {totaux.readyToSent} prêts à charger
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-700"><b>{totaux.retards}</b> en retard</span>
          <span className="px-3 py-1.5 rounded-lg bg-cockpit-card border border-cockpit">{eur(totaux.ht)} HT</span>
          {data.stock.length > 0 && (
            <span className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700"><b>{data.stock.length}</b> stock magasin ({data.stockMeubles} meubles)</span>
          )}
          {data.dejaExpedies > 0 && (
            <span className="px-3 py-1.5 rounded-lg bg-cockpit border border-cockpit text-cockpit-secondary" title="Commandes retrouvées dans un IMP déjà parti (reçues) — exclues du calendrier">{data.dejaExpedies} déjà expédiées (exclues)</span>
          )}
        </div>
      )}

      {/* Panneau préparation container */}
      <div className="bg-[var(--color-active)]/5 rounded-card border border-[var(--color-active)]/30 overflow-hidden">
        <button onClick={() => setPrepOpen((o) => !o)} className="w-full flex items-center gap-2 px-4 py-2.5 text-left">
          <PackageCheck className="w-4 h-4 text-[var(--color-active)]" />
          <span className="text-sm font-semibold text-cockpit-heading">Préparation {PREP_IMP}</span>
          <span className="text-xs text-cockpit-secondary">{prep ? `${prep.nb} commandes · ${prep.prets} prêtes · ${eur(prep.totalHT)} HT` : "…"}</span>
          {prepOpen ? <ChevronDown className="w-4 h-4 ml-auto text-cockpit-secondary" /> : <ChevronRight className="w-4 h-4 ml-auto text-cockpit-secondary" />}
        </button>
        {prepOpen && (
          <div className="px-4 pb-3">
            {!prep || prep.items.length === 0 ? (
              <p className="text-xs text-cockpit-secondary italic py-2">Aucune commande. Ajoute des BCDI depuis les onglets ci-dessous (bouton +).</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {prep.items.map((it) => (
                  <span key={it.bcdi} className="inline-flex items-center gap-1.5 text-xs bg-cockpit-card border border-cockpit rounded-lg pl-2 pr-1 py-1">
                    <span className="font-mono text-[var(--color-active)]">{it.bcdi}</span>
                    <span className="text-cockpit-secondary truncate max-w-[120px]">{it.client}</span>
                    {it.pret && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                    <button onClick={() => togglePrep(it.bcdi)} disabled={prepBusy === it.bcdi} className="p-0.5 rounded hover:bg-red-100 text-cockpit-secondary hover:text-red-600">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Onglets départs */}
      {loading && !data ? (
        <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-cockpit-secondary" /></div>
      ) : data && data.departs.length > 0 ? (
        <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-sm overflow-hidden">
          <div className="flex items-center gap-1 px-3 pt-2 border-b border-cockpit overflow-x-auto">
            {data.departs.map((d) => {
              const act = d.key === activeKey;
              const over = d.nbMeubles > d.capacite;
              return (
                <button key={d.key} onClick={() => setActiveKey(d.key)}
                  className={`px-3 py-2 text-xs font-medium rounded-t-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    act ? "bg-[var(--color-active)]/10 text-[var(--color-active)] border-b-2 border-[var(--color-active)] -mb-px" : "text-cockpit-secondary hover:text-cockpit-primary"
                  }`}>
                  {d.retards > 0 && !d.isImp618 && <AlertTriangle className="w-3 h-3 text-red-500" />}
                  <span className={d.estime ? "italic opacity-90" : ""}>{d.isImp618 ? "IMP-618 (juin)" : (d.estime ? "~ " : "") + departLabel(d.date)}</span>
                  <span className={`text-[10px] ${over ? "text-red-600 font-bold" : "opacity-70"}`}>({d.nbMeubles}/{d.capacite})</span>
                </button>
              );
            })}
            {data.stock.length > 0 && (
              <button onClick={() => setActiveKey(STOCK_KEY)}
                className={`px-3 py-2 text-xs font-medium rounded-t-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  showStock ? "bg-amber-100 text-amber-800 border-b-2 border-amber-500 -mb-px" : "text-cockpit-secondary hover:text-cockpit-primary"
                }`}>
                <Warehouse className="w-3 h-3" /> Stock magasin <span className="text-[10px] opacity-70">({data.stock.length})</span>
              </button>
            )}
          </div>

          {/* Contenu : un départ */}
          {activeDepart && (
            <div className="p-4 space-y-3">
              {activeDepart.isImp618 ? (
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm font-semibold text-cockpit-heading">IMP-618 — parti le 14 juin 2026</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sky-100 text-sky-700">Déjà parti</span>
                </div>
              ) : (
                <div className="flex flex-wrap items-end gap-3">
                  <label className="text-[11px] text-cockpit-secondary flex flex-col gap-0.5">Départ Semarang
                    <input type="date" key={`d-${activeDepart.key}`} defaultValue={activeDepart.date.slice(0, 10)}
                      onChange={(e) => e.target.value && saveDepart(activeDepart, { dateDepart: e.target.value })}
                      className="px-2 py-1 text-sm border border-cockpit-input rounded-input bg-cockpit-input text-cockpit-primary" />
                  </label>
                  <label className="text-[11px] text-cockpit-secondary flex flex-col gap-0.5">Arrivée ≈ Réunion
                    <input type="date" key={`a-${activeDepart.key}`} defaultValue={activeDepart.dateArrivee?.slice(0, 10) || ""}
                      onChange={(e) => saveDepart(activeDepart, { dateArrivee: e.target.value || null })}
                      className="px-2 py-1 text-sm border border-cockpit-input rounded-input bg-cockpit-input text-cockpit-primary" />
                  </label>
                  <label className="text-[11px] text-cockpit-secondary flex flex-col gap-0.5">Navire / réf.
                    <input type="text" key={`n-${activeDepart.key}`} defaultValue={activeDepart.navire || ""} placeholder="MSC …"
                      onBlur={(e) => { const v = e.target.value || null; if (v !== (activeDepart.navire || null)) saveDepart(activeDepart, { navire: v }); }}
                      className="w-36 px-2 py-1 text-sm border border-cockpit-input rounded-input bg-cockpit-input text-cockpit-primary" />
                  </label>
                  <label className="text-[11px] text-cockpit-secondary flex flex-col gap-0.5">Capacité (meubles)
                    <input type="number" step="5" min="10" key={`c-${activeDepart.key}`} defaultValue={activeDepart.capacite}
                      onBlur={(e) => { const n = Number(e.target.value); if (n > 0 && n !== activeDepart.capacite) saveDepart(activeDepart, { capaciteMeubles: n }); }}
                      className="w-20 px-2 py-1 text-sm border border-cockpit-input rounded-input bg-cockpit-input text-cockpit-primary text-right" />
                  </label>
                  <div className="flex items-center gap-2 pb-1.5">
                    {activeDepart.estime
                      ? <span title="Date estimée — modifie un champ pour la fixer comme vrai départ MSC" className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">≈ estimé</span>
                      : <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[var(--color-active)]/15 text-[var(--color-active)]">MSC</span>}
                    {activeDepart.id && (
                      <button onClick={() => { deleteDepart(activeDepart.id!); setActiveKey(null); }}
                        className="text-[11px] text-cockpit-secondary hover:text-red-600 underline">supprimer</button>
                    )}
                  </div>
                </div>
              )}
              <div className="text-xs text-cockpit-secondary">
                <b className={activeDepart.nbMeubles > activeDepart.capacite ? "text-red-600" : "text-cockpit-heading"}>{activeDepart.nbMeubles}</b>/{activeDepart.capacite} meubles · {activeDepart.nb} commandes · <span className="text-emerald-700 font-medium">{activeDepart.prets} prêtes</span>
                {activeDepart.retards > 0 && <> · <span className="text-red-600 font-semibold">⚠ {activeDepart.retards} en retard</span></>} · {eur(activeDepart.totalHT)} HT
              </div>
              {/* Jauge remplissage */}
              <div className="h-2 w-full rounded-full bg-cockpit-input overflow-hidden">
                <div className={`h-full ${activeDepart.nbMeubles > activeDepart.capacite ? "bg-red-500" : "bg-[var(--color-active)]"}`}
                  style={{ width: `${Math.min(100, (activeDepart.nbMeubles / activeDepart.capacite) * 100)}%` }} />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">{tableHead}<tbody>{activeDepart.items.map(renderRow)}</tbody></table>
              </div>
            </div>
          )}

          {/* Contenu : stock magasin */}
          {showStock && data && (
            <div className="p-4 space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-semibold text-cockpit-heading">Stock magasin</span>
                <span className="text-xs text-cockpit-secondary">{data.stock.length} commandes · {data.stockMeubles} meubles — hors quota client, à caser dans la place restante</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">{tableHead}<tbody>{data.stock.map(renderRow)}</tbody></table>
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
