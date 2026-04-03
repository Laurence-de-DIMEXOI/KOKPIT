"use client";

import { useState, useEffect, useCallback } from "react";
import { Package, Search, RefreshCw, Loader2, AlertTriangle, Check, ExternalLink, Warehouse } from "lucide-react";

interface StockEntrepot {
  warehouseId: string;
  warehouseLabel: string;
  quantity: number;
  booked: number;
  available: number;
  isDefault: boolean;
}

interface RefClassee {
  sellsyRefId: string;
  sellsyItemId: number | null;
  designation: string;
  reference: string;
  caAnnuel: number;
  nbCommandes: number;
  stockActuel: number | null;
  stockDetail: StockEntrepot[] | null;
  classe: "A" | "B" | "C";
  caPourcentage: number;
  caCumule: number;
  seuilAlerte: number | null;
  sousSeuilAlerte: boolean;
  noteSeuil: string | null;
}

interface ABCData {
  refs: RefClassee[];
  stats: {
    nbA: number;
    nbB: number;
    nbC: number;
    totalRefs: number;
    caTotal: number;
    couvertureCaA: number;
    alertesActives: number;
    seuilA: number;
    seuilB: number;
  };
  lastSync: string | null;
  needsCalculation?: boolean;
}

const CLASSE_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  A: { bg: "bg-red-100", text: "text-red-700", label: "A" },
  B: { bg: "bg-yellow-100", text: "text-yellow-700", label: "B" },
  C: { bg: "bg-gray-100", text: "text-gray-500", label: "C" },
};

function formatMontant(n: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

export default function CatalogueABCPage() {
  const [data, setData] = useState<ABCData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterClasse, setFilterClasse] = useState<string | null>(null);
  const [filterStockBas, setFilterStockBas] = useState(false);
  const [search, setSearch] = useState("");
  const [editingSeuil, setEditingSeuil] = useState<string | null>(null);
  const [seuilValue, setSeuilValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [expandedStock, setExpandedStock] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/achat/abc");
      if (res.ok) setData(await res.json());
    } catch { /* silencieux */ }
    setLoading(false);
  }, []);

  const handleRecalcul = async () => {
    setRecalculating(true);
    try {
      const res = await fetch("/api/achat/abc", { method: "POST" });
      if (res.ok) await load();
    } catch { /* silencieux */ }
    setRecalculating(false);
  };

  useEffect(() => { load(); }, [load]);

  const handleSaveSeuil = async (ref: RefClassee) => {
    if (!seuilValue) return;
    setSaving(true);
    try {
      await fetch("/api/achat/seuils", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sellsyRefId: ref.sellsyRefId,
          seuilAlerte: parseInt(seuilValue),
          classeABC: ref.classe,
        }),
      });
      setEditingSeuil(null);
      setSeuilValue("");
      await load();
    } catch { /* silencieux */ }
    setSaving(false);
  };

  // Filtrer les données
  const filtered = data?.refs.filter((r) => {
    if (filterClasse && r.classe !== filterClasse) return false;
    if (filterStockBas && !r.sousSeuilAlerte) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!r.designation.toLowerCase().includes(q) && !r.reference.toLowerCase().includes(q)) return false;
    }
    return true;
  }) || [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, var(--color-active), #FEEB9C)" }}>
            <Package className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-cockpit-heading">Catalogue ABC</h1>
            <p className="text-xs text-cockpit-secondary">Classification Pareto — {data?.stats.totalRefs || 0} références</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {data?.lastSync && (
            <span className="text-[10px] text-cockpit-secondary hidden sm:block">
              Calcul : {new Date(data.lastSync).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <button
            onClick={handleRecalcul}
            disabled={recalculating || loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 text-cockpit-secondary hover:bg-gray-50 transition-colors"
          >
            {recalculating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {recalculating ? "Calcul en cours…" : "Recalculer"}
          </button>
          <button onClick={load} disabled={loading} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: "linear-gradient(135deg, var(--color-active), #FEEB9C)" }}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Actualiser
          </button>
        </div>
      </div>

      {/* État vide — premier calcul */}
      {!loading && data?.needsCalculation && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 text-center">
          <Package className="w-12 h-12 mx-auto mb-4 text-gray-200" />
          <p className="text-cockpit-heading font-semibold mb-1">Aucune donnée disponible</p>
          <p className="text-sm text-cockpit-secondary mb-5">Lancez un premier calcul pour classer vos références selon la méthode Pareto.</p>
          <button
            onClick={handleRecalcul}
            disabled={recalculating}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white"
            style={{ background: "linear-gradient(135deg, var(--color-active), #FEEB9C)" }}
          >
            {recalculating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {recalculating ? "Calcul en cours… (environ 3 min)" : "Lancer le calcul ABC"}
          </button>
        </div>
      )}

      {/* KPIs */}
      {data && !data.needsCalculation && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Classe A", value: data.stats.nbA, sub: `${data.stats.couvertureCaA}% du CA` },
            { label: "Classe B", value: data.stats.nbB, sub: `${Math.round(100 - data.stats.couvertureCaA - (data.stats.nbC / data.stats.totalRefs * 100))}% du CA` },
            { label: "Classe C", value: data.stats.nbC, sub: "Long tail" },
            { label: "Alertes", value: data.stats.alertesActives, sub: "Stock sous seuil" },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="h-1 rounded-full mb-3" style={{ background: "linear-gradient(90deg, var(--color-active), #FEEB9C)" }} />
              <p className="text-2xl font-bold text-cockpit-heading">{kpi.value}</p>
              <p className="text-xs text-cockpit-secondary">{kpi.label}</p>
              <p className="text-[10px] text-cockpit-secondary mt-0.5">{kpi.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filtres + Table — masqués si pas encore de données */}
      {!data?.needsCalculation && (
        <>
          {/* Filtres */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex gap-1">
                {[null, "A", "B", "C"].map((c) => (
                  <button
                    key={c || "all"}
                    onClick={() => setFilterClasse(c)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      filterClasse === c ? "text-white" : "text-gray-600 bg-gray-50 hover:bg-gray-100"
                    }`}
                    style={filterClasse === c ? { background: "var(--color-active)" } : undefined}
                  >
                    {c || "Tout"}
                  </button>
                ))}
              </div>
              <label className="flex items-center gap-2 text-xs text-cockpit-secondary cursor-pointer">
                <input type="checkbox" checked={filterStockBas} onChange={(e) => setFilterStockBas(e.target.checked)} className="rounded" />
                Stock bas uniquement
              </label>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher une référence..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-cockpit-secondary">Chargement de la classification ABC…</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase">Classe</th>
                      <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase">Désignation</th>
                      <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase hidden md:table-cell">Réf</th>
                      <th className="text-right px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase">CA 12 mois</th>
                      <th className="text-right px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase hidden sm:table-cell">% CA</th>
                      <th className="text-center px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase hidden lg:table-cell">Cmd</th>
                      <th className="text-center px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase">Stock</th>
                      <th className="text-center px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase">Seuil</th>
                      <th className="text-center px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-4 py-12 text-center text-cockpit-secondary text-sm">Aucune référence trouvée</td>
                      </tr>
                    ) : (
                      filtered.map((ref) => {
                        const badge = CLASSE_BADGE[ref.classe];
                        return (
                          <tr key={ref.sellsyRefId} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-[11px] font-bold ${badge.bg} ${badge.text}`}>
                                {badge.label}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-sm font-medium text-cockpit-heading truncate max-w-[250px]">{ref.designation}</p>
                            </td>
                            <td className="px-4 py-3 hidden md:table-cell">
                              <code className="text-[11px] text-cockpit-secondary">{ref.reference || "—"}</code>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="text-sm font-semibold text-cockpit-heading">{formatMontant(ref.caAnnuel)}</span>
                            </td>
                            <td className="px-4 py-3 text-right hidden sm:table-cell">
                              <span className="text-xs text-cockpit-secondary">{ref.caPourcentage.toFixed(1)}%</span>
                            </td>
                            <td className="px-4 py-3 text-center hidden lg:table-cell">
                              <span className="text-xs text-cockpit-secondary">{ref.nbCommandes}</span>
                            </td>
                            {/* Stock par entrepôt */}
                            <td className="px-4 py-3 text-center">
                              {ref.stockActuel !== null ? (
                                <div className="relative">
                                  <button
                                    onClick={() => {
                                      const next = new Set(expandedStock);
                                      next.has(ref.sellsyRefId) ? next.delete(ref.sellsyRefId) : next.add(ref.sellsyRefId);
                                      setExpandedStock(next);
                                    }}
                                    className={`text-xs font-semibold px-2 py-0.5 rounded inline-flex items-center gap-1 ${
                                      ref.stockActuel <= 0
                                        ? "bg-red-50 text-red-600"
                                        : ref.sousSeuilAlerte
                                        ? "bg-orange-50 text-orange-600"
                                        : "bg-green-50 text-green-700"
                                    }`}
                                  >
                                    <Warehouse className="w-3 h-3" />
                                    {ref.stockActuel}
                                  </button>
                                  {expandedStock.has(ref.sellsyRefId) && ref.stockDetail && (
                                    <div className="absolute z-20 top-full mt-1 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-[200px] text-left">
                                      {ref.stockDetail.map((s) => (
                                        <div key={s.warehouseId} className="flex items-center justify-between gap-3 py-1 text-[11px]">
                                          <span className="text-cockpit-secondary truncate">
                                            {s.isDefault && <span className="text-[9px] bg-blue-50 text-blue-600 px-1 rounded mr-1">Défaut</span>}
                                            {s.warehouseLabel}
                                          </span>
                                          <span className={`font-semibold whitespace-nowrap ${s.available <= 0 ? "text-red-500" : "text-green-600"}`}>
                                            {s.available}
                                            {s.booked > 0 && <span className="text-orange-400 ml-1">({s.booked} rés.)</span>}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-[10px] text-gray-300">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {editingSeuil === ref.sellsyRefId ? (
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    value={seuilValue}
                                    onChange={(e) => setSeuilValue(e.target.value)}
                                    className="w-14 px-1.5 py-1 border border-gray-300 rounded text-xs text-center"
                                    autoFocus
                                    onKeyDown={(e) => e.key === "Enter" && handleSaveSeuil(ref)}
                                  />
                                  <button onClick={() => handleSaveSeuil(ref)} disabled={saving} className="p-1 rounded bg-green-50 text-green-600 hover:bg-green-100">
                                    <Check className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : ref.seuilAlerte != null ? (
                                <button
                                  onClick={() => { setEditingSeuil(ref.sellsyRefId); setSeuilValue(String(ref.seuilAlerte)); }}
                                  className={`text-xs font-medium px-2 py-0.5 rounded ${ref.sousSeuilAlerte ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}
                                >
                                  {ref.sousSeuilAlerte ? <><AlertTriangle className="w-3 h-3 inline mr-0.5" />{ref.seuilAlerte}</> : <><Check className="w-3 h-3 inline mr-0.5" />{ref.seuilAlerte}</>}
                                </button>
                              ) : (
                                <button
                                  onClick={() => { setEditingSeuil(ref.sellsyRefId); setSeuilValue(""); }}
                                  className="text-[10px] text-cockpit-secondary border border-dashed border-gray-300 px-2 py-0.5 rounded hover:border-gray-400"
                                >
                                  Définir
                                </button>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <a
                                href={`https://www.sellsy.com/?_f=itemOverview&id=${ref.sellsyRefId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-400 hover:text-gray-600"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
