"use client";

import { useState, useEffect, useCallback } from "react";
import { Ship, Package, RefreshCw, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";

interface LigneArrivage {
  id: string;
  reference: string;
  designation: string;
  quantite: number;
  notes: string | null;
}

interface Arrivage {
  id: string;
  reference: string;
  dateDepart: string | null;
  dateLivraisonEstimee: string | null;
  statut: string;
  notes: string | null;
  lignes: LigneArrivage[];
  _count: { bdcLies: number };
}

const STATUT_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  PREVU: { label: "Prévu", color: "#FFAB00", bg: "#FFF8E1", icon: "🟡" },
  EN_TRANSIT: { label: "En transit", color: "#03C3EC", bg: "#E3F7FD", icon: "🔵" },
  ARRIVE: { label: "Arrivé", color: "#71DD37", bg: "#F0FFF4", icon: "✅" },
  ANNULE: { label: "Annulé", color: "#FF3E1D", bg: "#FFF0EE", icon: "❌" },
};

function fmtDate(val: string | null): string {
  if (!val) return "—";
  return new Date(val).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function ArrivageCard({ arrivage }: { arrivage: Arrivage }) {
  const [expanded, setExpanded] = useState(arrivage.statut !== "ARRIVE");
  const cfg = STATUT_CONFIG[arrivage.statut] || { label: arrivage.statut, color: "#8592A3", bg: "#F5F6F7", icon: "•" };

  return (
    <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg overflow-hidden">
      {/* Header */}
      <div
        className="px-5 py-4 cursor-pointer flex items-center justify-between"
        style={{ borderLeft: `4px solid ${cfg.color}` }}
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-lg">{cfg.icon}</span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-cockpit-heading">{arrivage.reference}</h3>
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ color: cfg.color, backgroundColor: cfg.bg }}
              >
                {cfg.label}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-0.5 text-xs text-cockpit-secondary flex-wrap">
              {arrivage.dateDepart && (
                <span>Départ : <span className="font-medium text-cockpit-secondary">{fmtDate(arrivage.dateDepart)}</span></span>
              )}
              {arrivage.dateLivraisonEstimee && (
                <span>Arrivée : <span className="font-medium text-cockpit-secondary">{fmtDate(arrivage.dateLivraisonEstimee)}</span></span>
              )}
              <span className="text-cockpit-secondary opacity-70">
                {arrivage.lignes.length} produit{arrivage.lignes.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>
        <div className="flex-shrink-0 ml-3 text-cockpit-secondary">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {/* Produits */}
      {expanded && arrivage.lignes.length > 0 && (
        <div className="border-t border-cockpit">
          <div className="px-5 py-3">
            <p className="text-xs font-semibold text-cockpit-secondary uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5" />
              Produits attendus
            </p>
            <div className="space-y-1.5">
              {arrivage.lignes.map((l) => (
                <div key={l.id} className="flex items-center justify-between py-1.5 px-3 bg-cockpit-dark rounded-lg">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono text-[#CBA1D4] bg-purple-50 px-1.5 py-0.5 rounded">
                        {l.reference}
                      </span>
                      <span className="text-xs text-cockpit-heading truncate">{l.designation}</span>
                    </div>
                    {l.notes && (
                      <p className="text-[10px] text-cockpit-secondary mt-0.5">{l.notes}</p>
                    )}
                  </div>
                  <span className="text-sm font-bold text-cockpit-heading ml-3 flex-shrink-0">
                    ×{l.quantite}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {expanded && arrivage.lignes.length === 0 && (
        <div className="border-t border-cockpit px-5 py-4">
          <p className="text-xs text-cockpit-secondary text-center">
            Détail des produits non disponible
          </p>
        </div>
      )}
    </div>
  );
}

export default function ArrivagesCommercialPage() {
  const { addToast } = useToast();
  const [arrivages, setArrivages] = useState<Arrivage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchArrivages = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await fetch("/api/commercial/previsionnel");
      const data = await res.json();
      setArrivages(Array.isArray(data) ? data : []);
    } catch {
      addToast("Erreur de chargement", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [addToast]);

  useEffect(() => { fetchArrivages(); }, [fetchArrivages]);

  const prevus = arrivages.filter((a) => a.statut === "PREVU");
  const enTransit = arrivages.filter((a) => a.statut === "EN_TRANSIT");
  const arrives = arrivages.filter((a) => a.statut === "ARRIVE");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#4C9DB0" }} />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-cockpit-heading flex items-center gap-2.5">
            <Ship className="w-6 h-6 text-[#4C9DB0]" />
            Arrivages à venir
          </h1>
          <p className="text-sm text-cockpit-secondary mt-1">
            Conteneurs prévus et produits attendus
          </p>
        </div>
        <button
          onClick={() => fetchArrivages(true)}
          disabled={refreshing}
          className="p-2 rounded-lg border border-cockpit hover:bg-cockpit-dark transition-colors"
        >
          <RefreshCw className={`w-4 h-4 text-cockpit-secondary ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {arrivages.length === 0 ? (
        <div className="text-center py-16 text-cockpit-secondary">
          <Ship className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Aucun arrivage prévu pour le moment</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* En transit en premier (priorité) */}
          {enTransit.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#03C3EC] flex items-center gap-2">
                🔵 En transit ({enTransit.length})
              </h2>
              {enTransit.map((a) => <ArrivageCard key={a.id} arrivage={a} />)}
            </div>
          )}

          {prevus.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#FFAB00] flex items-center gap-2">
                🟡 Prévus ({prevus.length})
              </h2>
              {prevus.map((a) => <ArrivageCard key={a.id} arrivage={a} />)}
            </div>
          )}

          {arrives.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#71DD37] flex items-center gap-2">
                ✅ Récemment arrivés ({arrives.length})
              </h2>
              {arrives.map((a) => <ArrivageCard key={a.id} arrivage={a} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
