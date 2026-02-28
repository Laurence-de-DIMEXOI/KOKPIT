"use client";

import { useEffect, useState } from "react";
import {
  Package,
  RefreshCw,
  Loader2,
  Search,
  Euro,
} from "lucide-react";

interface SellsyItem {
  id: number;
  name?: string;
  reference?: string;
  unit_amount?: string;
  description?: string;
  type?: string;
  is_active?: boolean;
  category?: { id: number; name?: string };
}

export default function CataloguePage() {
  const [items, setItems] = useState<SellsyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [total, setTotal] = useState(0);

  const fetchItems = async (query?: string) => {
    setRefreshing(true);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (query) params.set("search", query);
      const res = await fetch(`/api/sellsy/items?${params}`);
      const data = await res.json();
      setItems(data.items || []);
      setTotal(data.pagination?.total || 0);
    } catch (error) {
      console.error("Erreur chargement catalogue:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchItems(search);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-cockpit-info" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-cockpit-heading mb-1">
            Catalogue Produits
          </h1>
          <p className="text-cockpit-secondary text-sm">
            {total} produits Sellsy
          </p>
        </div>
        <button
          onClick={() => fetchItems(search)}
          disabled={refreshing}
          className="flex items-center justify-center gap-2 bg-cockpit-card border border-cockpit px-4 py-2.5 rounded-lg font-semibold hover:bg-cockpit-dark transition-colors disabled:opacity-50 text-sm"
        >
          {refreshing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Sync Sellsy
        </button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cockpit-secondary" />
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-cockpit-card border border-cockpit rounded-lg pl-10 pr-4 py-2.5 text-sm text-cockpit-primary placeholder:text-cockpit-secondary focus:outline-none focus:ring-2 focus:ring-cockpit-info/40"
          />
        </div>
        <button
          type="submit"
          className="bg-cockpit-info/15 text-cockpit-info border border-cockpit-info/30 px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-cockpit-info/25 transition-colors"
        >
          Chercher
        </button>
      </form>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg p-4 hover:border-cockpit-info/40 transition-colors"
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-cockpit-info/10 flex items-center justify-center flex-shrink-0">
                <Package className="w-5 h-5 text-cockpit-info" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-cockpit-heading truncate">
                  {item.name || `Produit #${item.id}`}
                </p>
                {item.reference && (
                  <p className="text-xs text-cockpit-secondary">
                    Réf: {item.reference}
                  </p>
                )}
              </div>
            </div>

            {item.description && (
              <p className="text-xs text-cockpit-secondary line-clamp-2 mb-3">
                {item.description}
              </p>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-cockpit">
              <div className="flex items-center gap-1">
                <Euro className="w-4 h-4 text-cockpit-heading" />
                <span className="text-base font-bold text-cockpit-heading">
                  {parseFloat(item.unit_amount || "0").toLocaleString("fr-FR", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              {item.type && (
                <span className="text-xs bg-cockpit-dark px-2 py-1 rounded text-cockpit-secondary">
                  {item.type}
                </span>
              )}
            </div>

            {item.category?.name && (
              <p className="text-xs text-cockpit-info mt-2">
                {item.category.name}
              </p>
            )}
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-cockpit-secondary mx-auto mb-4" />
          <p className="text-cockpit-secondary">Aucun produit trouvé</p>
        </div>
      )}
    </div>
  );
}
