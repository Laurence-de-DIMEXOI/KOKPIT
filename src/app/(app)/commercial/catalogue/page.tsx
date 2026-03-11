"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Package,
  RefreshCw,
  Loader2,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Tag,
  Filter,
} from "lucide-react";
import { KPICard } from "@/components/dashboard/kpi-card";
import { ProductDrawer } from "@/components/catalogue/product-drawer";

interface SellsyItem {
  id: number;
  type: "product" | "service";
  name: string | null;
  reference: string;
  description: string;
  reference_price_taxes_exc: string;
  reference_price_taxes_inc: string;
  purchase_amount: string;
  currency: string;
  standard_quantity: string;
  category_id: number;
  is_archived: boolean;
  created: string;
  updated: string;
}

type SortKey = "name" | "reference" | "price_ht" | "price_ttc" | "type";
type SortDir = "asc" | "desc";

const formatEuro = (val: string | number) => {
  const num = typeof val === "string" ? parseFloat(val) : val;
  if (!num && num !== 0) return "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

export default function CataloguePage() {
  const [items, setItems] = useState<SellsyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [selectedItem, setSelectedItem] = useState<SellsyItem | null>(null);

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchItems = async (fresh = false) => {
    setRefreshing(true);
    try {
      const res = await fetch(`/api/sellsy/items?all=true${fresh ? "&fresh=true" : ""}`);
      const data = await res.json();
      if (data.success) {
        setItems(data.items || []);
      }
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

  // Filter & sort
  const filtered = useMemo(() => {
    let result = items;

    // Search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (item) =>
          (item.name || "").toLowerCase().includes(q) ||
          (item.reference || "").toLowerCase().includes(q) ||
          (item.description || "").toLowerCase().includes(q)
      );
    }

    // Type filter
    if (typeFilter !== "ALL") {
      result = result.filter((item) => item.type === typeFilter);
    }

    // Sort
    result = [...result].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name":
          cmp = (a.name || a.reference || "").localeCompare(b.name || b.reference || "", "fr");
          break;
        case "reference":
          cmp = (a.reference || "").localeCompare(b.reference || "", "fr");
          break;
        case "price_ht":
          cmp = parseFloat(a.reference_price_taxes_exc || "0") - parseFloat(b.reference_price_taxes_exc || "0");
          break;
        case "price_ttc":
          cmp = parseFloat(a.reference_price_taxes_inc || "0") - parseFloat(b.reference_price_taxes_inc || "0");
          break;
        case "type":
          cmp = (a.type || "").localeCompare(b.type || "");
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [items, search, typeFilter, sortKey, sortDir]);

  // KPIs
  const kpis = useMemo(() => {
    const products = items.filter((i) => i.type === "product");
    const services = items.filter((i) => i.type === "service");
    const avgPriceHT =
      items.length > 0
        ? items.reduce((sum, i) => sum + parseFloat(i.reference_price_taxes_exc || "0"), 0) / items.length
        : 0;
    return {
      total: items.length,
      products: products.length,
      services: services.length,
      avgPriceHT,
    };
  }, [items]);

  // Sort handler
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="w-3 h-3 text-cockpit-secondary" />;
    return sortDir === "asc" ? (
      <ArrowUp className="w-3 h-3 text-cockpit-info" />
    ) : (
      <ArrowDown className="w-3 h-3 text-cockpit-info" />
    );
  };

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="h-8 w-56 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-4 w-40 bg-gray-200 rounded mt-2 animate-pulse" />
          </div>
          <div className="h-10 w-28 bg-gray-200 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-white rounded-xl border border-gray-200 animate-pulse p-4">
              <div className="h-3 w-20 bg-gray-200 rounded mb-3" />
              <div className="h-6 w-16 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
        <div className="h-12 w-full bg-gray-200 rounded-xl animate-pulse" />
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="bg-[#F5F6F7] border-b border-gray-200 px-4 py-3 flex gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="px-4 py-3 border-b border-gray-100 flex gap-4 animate-pulse">
              <div className="h-4 w-20 bg-gray-200 rounded" />
              <div className="h-4 w-48 bg-gray-200 rounded" />
              <div className="h-4 w-14 bg-gray-200 rounded" />
              <div className="h-4 w-20 bg-gray-200 rounded ml-auto" />
              <div className="h-4 w-20 bg-gray-200 rounded" />
              <div className="h-4 w-24 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-cockpit-heading mb-1">
            Catalogue Produits
          </h1>
          <p className="text-cockpit-secondary text-sm">
            {filtered.length} produit{filtered.length > 1 ? "s" : ""} affichés sur {items.length}
          </p>
        </div>
        <button
          onClick={() => fetchItems(true)}
          disabled={refreshing}
          className="flex items-center justify-center gap-2 bg-cockpit-card border border-cockpit px-4 py-2.5 rounded-lg font-semibold hover:bg-cockpit-dark transition-colors disabled:opacity-50 text-sm"
        >
          {refreshing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Rafraîchir
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KPICard title="Total articles" value={kpis.total} icon={<Package className="w-7 h-7" />} bgColor="bg-cockpit-yellow" />
        <KPICard title="Produits" value={kpis.products} icon={<Package className="w-7 h-7" />} bgColor="bg-cockpit-info" />
        <KPICard title="Services" value={kpis.services} icon={<Tag className="w-7 h-7" />} bgColor="bg-cockpit-success" />
        <KPICard title="Prix moy. HT" value={formatEuro(kpis.avgPriceHT)} icon={<Tag className="w-7 h-7" />} bgColor="bg-cockpit-warning" />
      </div>

      {/* Search + Filters */}
      <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cockpit-secondary" />
            <input
              type="text"
              placeholder="Rechercher par nom, référence ou description..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-cockpit-input rounded-input bg-cockpit-input text-cockpit-primary text-sm"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-cockpit-input border border-cockpit-input px-3 py-2.5 rounded-input text-xs text-cockpit-primary"
          >
            <option value="ALL">Tous les types</option>
            <option value="product">Produits</option>
            <option value="service">Services</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg overflow-hidden">
        {/* Desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-cockpit-dark border-b border-cockpit">
              <tr>
                <th
                  className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-cockpit-heading cursor-pointer hover:text-cockpit-info transition-colors"
                  onClick={() => handleSort("reference")}
                >
                  <span className="flex items-center gap-1.5">RÉF. <SortIcon col="reference" /></span>
                </th>
                <th
                  className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-cockpit-heading cursor-pointer hover:text-cockpit-info transition-colors"
                  onClick={() => handleSort("name")}
                >
                  <span className="flex items-center gap-1.5">NOM <SortIcon col="name" /></span>
                </th>
                <th
                  className="px-3 py-3 text-left text-xs font-semibold text-cockpit-heading cursor-pointer hover:text-cockpit-info transition-colors"
                  onClick={() => handleSort("type")}
                >
                  <span className="flex items-center gap-1.5">TYPE <SortIcon col="type" /></span>
                </th>
                <th
                  className="px-4 lg:px-6 py-3 text-right text-xs font-semibold text-cockpit-heading cursor-pointer hover:text-cockpit-info transition-colors"
                  onClick={() => handleSort("price_ht")}
                >
                  <span className="flex items-center gap-1.5 justify-end">PRIX HT <SortIcon col="price_ht" /></span>
                </th>
                <th
                  className="px-4 lg:px-6 py-3 text-right text-xs font-semibold text-cockpit-heading cursor-pointer hover:text-cockpit-info transition-colors"
                  onClick={() => handleSort("price_ttc")}
                >
                  <span className="flex items-center gap-1.5 justify-end">PRIX TTC <SortIcon col="price_ttc" /></span>
                </th>
                <th className="px-3 py-3 text-right text-xs font-semibold text-cockpit-heading hidden lg:table-cell">
                  ACHAT / MARGE
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cockpit">
              {filtered.length > 0 ? (
                filtered.map((item) => {
                  const priceHT = parseFloat(item.reference_price_taxes_exc || "0");
                  const priceTTC = parseFloat(item.reference_price_taxes_inc || "0");
                  const purchasePrice = parseFloat(item.purchase_amount || "0");
                  const margin = priceHT > 0 && purchasePrice > 0 ? ((priceHT - purchasePrice) / priceHT * 100) : null;
                  return (
                    <tr key={item.id} className="hover:bg-cockpit-dark transition-colors cursor-pointer" onClick={() => setSelectedItem(item)}>
                      <td className="px-4 lg:px-6 py-3">
                        <span className="text-xs font-mono text-cockpit-info bg-cockpit-info/10 px-2 py-0.5 rounded">
                          {item.reference || "—"}
                        </span>
                      </td>
                      <td className="px-4 lg:px-6 py-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-cockpit-heading truncate max-w-[300px]">
                            {item.name || item.reference || `#${item.id}`}
                          </p>
                          {item.description && item.description !== item.name && (
                            <p className="text-[10px] text-cockpit-secondary truncate max-w-[300px] mt-0.5">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                          item.type === "product"
                            ? "bg-cockpit-info/10 text-cockpit-info"
                            : "bg-cockpit-warning/10 text-cockpit-warning"
                        }`}>
                          {item.type === "product" ? "Produit" : "Service"}
                        </span>
                      </td>
                      <td className="px-4 lg:px-6 py-3 text-right">
                        <span className="text-sm font-semibold text-cockpit-heading">
                          {formatEuro(priceHT)}
                        </span>
                      </td>
                      <td className="px-4 lg:px-6 py-3 text-right">
                        <span className="text-sm text-cockpit-primary">
                          {formatEuro(priceTTC)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right hidden lg:table-cell">
                        <div>
                          <span className="text-xs text-cockpit-secondary">
                            {purchasePrice > 0 ? formatEuro(purchasePrice) : "—"}
                          </span>
                          {margin !== null && margin > 0 && (
                            <p className={`text-[10px] ${margin > 30 ? "text-cockpit-success" : margin > 15 ? "text-cockpit-warning" : "text-red-400"}`}>
                              Marge {margin.toFixed(0)}%
                            </p>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-cockpit-secondary">
                    <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p>Aucun produit trouvé</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="md:hidden divide-y divide-cockpit">
          {filtered.length > 0 ? (
            filtered.map((item) => {
              const priceHT = parseFloat(item.reference_price_taxes_exc || "0");
              const priceTTC = parseFloat(item.reference_price_taxes_inc || "0");
              return (
                <div key={item.id} className="p-4 hover:bg-cockpit-dark transition-colors cursor-pointer" onClick={() => setSelectedItem(item)}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono text-cockpit-info bg-cockpit-info/10 px-1.5 py-0.5 rounded">
                          {item.reference || "—"}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          item.type === "product"
                            ? "bg-cockpit-info/10 text-cockpit-info"
                            : "bg-cockpit-warning/10 text-cockpit-warning"
                        }`}>
                          {item.type === "product" ? "Produit" : "Service"}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-cockpit-heading truncate">
                        {item.name || item.reference || `#${item.id}`}
                      </p>
                      {item.description && item.description !== item.name && (
                        <p className="text-[10px] text-cockpit-secondary truncate mt-0.5">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-cockpit-heading">{formatEuro(priceHT)}</p>
                      <p className="text-[10px] text-cockpit-secondary">TTC: {formatEuro(priceTTC)}</p>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-cockpit-secondary text-sm">
              Aucun produit trouvé
            </div>
          )}
        </div>

        {/* Footer count */}
        <div className="px-4 lg:px-6 py-3 border-t border-cockpit">
          <p className="text-xs text-cockpit-secondary">
            {filtered.length} article{filtered.length > 1 ? "s" : ""} affichés
            {filtered.length !== items.length && ` (sur ${items.length} total)`}
          </p>
        </div>
      </div>
      {/* Product Drawer */}
      <ProductDrawer item={selectedItem} onClose={() => setSelectedItem(null)} />
    </div>
  );
}
