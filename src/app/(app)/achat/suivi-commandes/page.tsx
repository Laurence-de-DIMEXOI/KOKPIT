"use client";

import { useState, useCallback } from "react";
import { Search, Loader2, Package, Truck } from "lucide-react";

interface TrelloCard {
  id: string;
  name: string;
  ref: string;
  client: string;
  statut: string;
  step: number;
  maxSteps: number;
  style: { color: string; bg: string };
  due: string | null;
  lastActivity: string;
}

const ACHAT_GRADIENT = {
  from: "var(--color-active)",
  to: "#FEEB9C",
};

export default function SuiviCommandesPage() {
  const [cards, setCards] = useState<TrelloCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const fetchCards = useCallback(async (query: string) => {
    if (!query.trim()) return;
    setLoading(true);
    setHasSearched(true);
    try {
      const res = await fetch(`/api/achat/trello?search=${encodeURIComponent(query.trim())}`);
      if (!res.ok) throw new Error("Erreur");
      const data = await res.json();
      setCards(data.cards || []);
    } catch {
      setCards([]);
    }
    setLoading(false);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCards(search);
  };

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-cockpit-heading flex items-center gap-2">
          <Truck className="w-7 h-7" style={{ color: "var(--color-active)" }} />
          Suivi commandes
        </h1>
        <p className="text-cockpit-secondary text-sm mt-1">
          Recherchez une commande par nom client ou référence BCDI
        </p>
      </div>

      {/* Légende statuts */}
      <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg p-4">
        <p className="text-xs font-semibold text-cockpit-secondary mb-2">Étapes de fabrication</p>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "BCDI", desc: "Commande enregistrée", color: "#6B7280", bg: "#F3F4F6" },
            { label: "Questions", desc: "En attente de réponse", color: "#D97706", bg: "#FEF3C7" },
            { label: "Check 1→3", desc: "Vérification menuisier", color: "#2563EB", bg: "#DBEAFE" },
            { label: "Warehouse", desc: "En entrepôt", color: "#7C3AED", bg: "#EDE9FE" },
            { label: "Finishing", desc: "Finitions en cours", color: "#D97706", bg: "#FEF3C7" },
            { label: "Ready", desc: "Prêt à expédier", color: "#059669", bg: "#D1FAE5" },
            { label: "Sent", desc: "Expédié", color: "#059669", bg: "#D1FAE5" },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-1.5">
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium"
                style={{ backgroundColor: s.bg, color: s.color }}
              >
                {s.label}
              </span>
              <span className="text-[10px] text-cockpit-secondary">{s.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg p-4">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cockpit-secondary" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nom client, réf BCDI, produit..."
              className="w-full pl-10 pr-4 py-2.5 border border-cockpit-input rounded-input bg-cockpit-input text-cockpit-primary text-sm focus:outline-none"
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={!search.trim() || loading}
            className="px-4 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-40"
            style={{ background: `linear-gradient(135deg, ${ACHAT_GRADIENT.from}, ${ACHAT_GRADIENT.to})` }}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Rechercher"}
          </button>
        </form>
      </div>

      {/* Results — only after search */}
      {hasSearched && (
        <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-cockpit-secondary" />
            </div>
          ) : cards.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-8 h-8 mx-auto mb-2 text-cockpit-secondary opacity-40" />
              <p className="text-cockpit-primary font-medium">Aucune commande trouvée</p>
              <p className="text-cockpit-secondary text-xs mt-1">
                Essayez un autre terme de recherche
              </p>
            </div>
          ) : (
            <>
              <div className="px-4 py-2 border-b border-cockpit">
                <p className="text-xs text-cockpit-secondary">
                  {cards.length} résultat{cards.length > 1 ? "s" : ""}
                </p>
              </div>

              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-cockpit">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-cockpit-secondary">Référence</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-cockpit-secondary">Client</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-cockpit-secondary">Dernier check</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-cockpit-secondary">Progression</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-cockpit-secondary">Dernière activité</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cockpit">
                    {cards.map((card) => (
                      <tr key={card.id} className="hover:bg-cockpit-dark/50 transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-mono text-sm font-semibold" style={{ color: "var(--color-active)" }}>
                            {card.ref}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-cockpit-primary font-medium">
                          {card.client}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
                            style={{ backgroundColor: card.style.bg, color: card.style.color }}
                          >
                            {card.statut}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {card.step >= 0 ? (
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden max-w-[120px]">
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{
                                    width: `${((card.step + 1) / card.maxSteps) * 100}%`,
                                    background: `linear-gradient(90deg, ${ACHAT_GRADIENT.from}, ${ACHAT_GRADIENT.to})`,
                                  }}
                                />
                              </div>
                              <span className="text-[10px] text-cockpit-secondary">
                                {card.step + 1}/{card.maxSteps}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-cockpit-secondary">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-cockpit-secondary">
                          {formatDate(card.lastActivity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-cockpit">
                {cards.map((card) => (
                  <div key={card.id} className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-semibold" style={{ color: "var(--color-active)" }}>
                        {card.ref}
                      </span>
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium"
                        style={{ backgroundColor: card.style.bg, color: card.style.color }}
                      >
                        {card.statut}
                      </span>
                    </div>
                    <p className="text-sm text-cockpit-primary font-medium">{card.client}</p>
                    {card.step >= 0 && (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${((card.step + 1) / card.maxSteps) * 100}%`,
                              background: `linear-gradient(90deg, ${ACHAT_GRADIENT.from}, ${ACHAT_GRADIENT.to})`,
                            }}
                          />
                        </div>
                        <span className="text-[10px] text-cockpit-secondary">{card.step + 1}/{card.maxSteps}</span>
                      </div>
                    )}
                    <p className="text-[10px] text-cockpit-secondary">{formatDate(card.lastActivity)}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Empty state — before search */}
      {!hasSearched && (
        <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg p-12 text-center">
          <Search className="w-10 h-10 mx-auto mb-3 text-cockpit-secondary opacity-30" />
          <p className="text-cockpit-primary font-medium">Recherchez une commande</p>
          <p className="text-cockpit-secondary text-xs mt-1">
            Tapez un nom de client ou une référence BCDI pour voir le suivi
          </p>
        </div>
      )}
    </div>
  );
}
