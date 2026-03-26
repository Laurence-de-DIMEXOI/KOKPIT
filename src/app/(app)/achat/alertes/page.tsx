"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, Loader2, Check, ExternalLink, RefreshCw } from "lucide-react";

interface Alerte {
  sellsyRefId: string;
  designation: string;
  reference: string;
  classe: "A" | "B" | "C";
  caAnnuel: number;
  stockActuel: number | null;
  seuilAlerte: number | null;
  nbCommandes: number;
}

function formatMontant(n: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

export default function AlertesStockPage() {
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"A" | "AB" | "all">("A");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/achat/abc?mode=alertes");
      if (res.ok) {
        const data = await res.json();
        setAlertes(data.alertes || []);
        setStats(data.stats || null);
      }
    } catch { /* silencieux */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = alertes.filter((a) => {
    if (filter === "A") return a.classe === "A";
    if (filter === "AB") return a.classe === "A" || a.classe === "B";
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, var(--color-active), #FEEB9C)" }}>
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-cockpit-heading">Alertes stock</h1>
            <p className="text-xs text-cockpit-secondary">Références sous leur seuil d'alerte</p>
          </div>
        </div>
        <button onClick={load} disabled={loading} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: "linear-gradient(135deg, var(--color-active), #FEEB9C)" }}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        </button>
      </div>

      {/* Filtres */}
      <div className="flex gap-1">
        {([["A", "Classe A"], ["AB", "A + B"], ["all", "Tout"]] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === key ? "text-white" : "text-gray-600 bg-gray-50 hover:bg-gray-100"
            }`}
            style={filter === key ? { background: "var(--color-active)" } : undefined}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Contenu */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-cockpit-secondary">Vérification des stocks...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Check className="w-10 h-10 mx-auto text-green-400 mb-3" />
            <p className="text-cockpit-heading font-medium">Aucune alerte</p>
            <p className="text-xs text-cockpit-secondary mt-1">Tout le stock est au-dessus des seuils ✅</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase">Classe</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase">Désignation</th>
                <th className="text-center px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase">Stock</th>
                <th className="text-center px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase">Seuil</th>
                <th className="text-right px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase">CA 12 mois</th>
                <th className="text-center px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((a) => (
                <tr key={a.sellsyRefId} className="hover:bg-red-50/30 transition-colors">
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-[11px] font-bold bg-red-100 text-red-700">
                      {a.classe}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-cockpit-heading">{a.designation}</p>
                    <p className="text-[10px] text-cockpit-secondary">{a.reference}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm font-bold text-red-600">{a.stockActuel ?? "—"}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm text-cockpit-secondary">{a.seuilAlerte ?? "—"}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-semibold text-cockpit-heading">{formatMontant(a.caAnnuel)}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <a href={`https://www.sellsy.com/?_f=itemOverview&id=${a.sellsyRefId}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
