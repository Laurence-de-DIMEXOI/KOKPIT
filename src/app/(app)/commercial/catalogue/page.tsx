"use client";

import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import {
  Package,
  RefreshCw,
  Loader2,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Tag,
  Printer,
  ScanBarcode,
  ChevronRight,
  ChevronLeft,
  Layers,
  ExternalLink,
  Info,
  ShoppingCart,
} from "lucide-react";
import Link from "next/link";
import { ProductDrawer } from "@/components/catalogue/product-drawer";
import { getSellsyDeclUrl } from "@/lib/sellsy-urls";

interface StockWh { whId: number; name: string; physical: number; reserved: number; available: number }

interface Declination {
  id: number;
  reference: string;
  name: string | null;
  reference_price_taxes_exc: string | null;
  reference_price_taxes_inc: string | null; // enrichi après fetch individuel
  purchase_amount: string | null;
  stock_physical?: number | null;
  stock_reserved?: number | null;
  stock_available?: number | null;
  stock_by_warehouse?: StockWh[] | null;
}

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
  is_declined: boolean;
  created: string;
  updated: string;
  stock_physical?: number | null;
  stock_reserved?: number | null;
  stock_available?: number | null;
  stock_by_warehouse?: StockWh[] | null;
}

type SortKey = "name" | "reference" | "price_ht" | "price_ttc" | "type" | "stock_sp" | "stock_bo";

const WH_SP = 10928; // DIMEXOI Saint-Pierre
const WH_BO = 16712; // Bois d'Orient Saint-Denis

function getWhAvailable(byWh: StockWh[] | null | undefined, whId: number): number | null {
  if (!byWh || !Array.isArray(byWh)) return null;
  const entry = byWh.find((w) => w.whId === whId);
  return entry ? entry.available : null;
}
type SortDir = "asc" | "desc";

const PAGE_SIZE = 50;

const formatEuro = (val: string | number | null | undefined) => {
  if (val === null || val === undefined) return "—";
  const num = typeof val === "string" ? parseFloat(val) : val;
  if (isNaN(num)) return "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

function QtyControl({ qty, onChange, accent = "blue" }: { qty: number; onChange: (n: number) => void; accent?: "blue" | "purple" }) {
  const color = accent === "purple" ? "text-purple-500 border-purple-400/40 bg-purple-400/10 hover:bg-purple-400/20" : "text-cockpit-info border-cockpit-info/40 bg-cockpit-info/10 hover:bg-cockpit-info/20";
  return (
    <div
      className="flex items-center gap-0.5"
      onClick={(e) => e.stopPropagation()}
      title="Nombre d'étiquettes à imprimer"
    >
      <button
        type="button"
        onClick={() => onChange(qty - 1)}
        disabled={qty <= 1}
        className={`w-5 h-5 rounded border ${color} flex items-center justify-center text-xs font-bold leading-none transition-colors disabled:opacity-30 disabled:cursor-not-allowed`}
      >−</button>
      <span className="min-w-[16px] text-center text-[11px] font-bold text-cockpit-heading tabular-nums">{qty}</span>
      <button
        type="button"
        onClick={() => onChange(qty + 1)}
        disabled={qty >= 99}
        className={`w-5 h-5 rounded border ${color} flex items-center justify-center text-xs font-bold leading-none transition-colors disabled:opacity-30 disabled:cursor-not-allowed`}
      >+</button>
    </div>
  );
}

function StockBadge({ available, byWh }: { available: number | null | undefined; byWh?: StockWh[] | null }) {
  if (available === null || available === undefined) {
    return <span className="text-[10px] text-cockpit-secondary">—</span>;
  }
  const color =
    available <= 0 ? "bg-red-500/15 text-red-600"
    : available <= 5 ? "bg-amber-500/15 text-amber-700"
    : "bg-green-500/15 text-green-700";
  const title = byWh && byWh.length
    ? byWh.map((w) => `${w.name}: ${w.available} dispo (${w.physical} phys - ${w.reserved} rés)`).join("\n")
    : undefined;
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${color}`} title={title}>
      {available}
    </span>
  );
}

const SELLSY_ITEM_URL = "https://app.sellsy.com/items";
const LABEL_BUY_URL = "https://www.bureau-vallee.re/fr_RE/2400-etiquettes-multi-usages-35x70-agipa-51259.html";

export default function CataloguePage() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role as string | undefined;
  const canSeePurchase = userRole === "ADMIN" || userRole === "DIRECTION" || userRole === "ACHAT";

  const [items, setItems] = useState<SellsyItem[]>([]);
  const [declinations, setDeclinations] = useState<Record<number, Declination[]>>({});
  const [loadingDecl, setLoadingDecl] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [declFilter, setDeclFilter] = useState<string>("ALL"); // ALL | with | without
  const [priceFilter, setPriceFilter] = useState<string>("ALL"); // ALL | <100 | 100-500 | 500-1000 | >1000
  const [stockFilter, setStockFilter] = useState<string>("ALL"); // ALL | in | out | low
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [selectedItem, setSelectedItem] = useState<SellsyItem | null>(null);
  const [drawerDeclUrl, setDrawerDeclUrl] = useState<string | undefined>(undefined);
  const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set());
  const [checkedDeclIds, setCheckedDeclIds] = useState<Set<number>>(new Set());
  const [labelQuantities, setLabelQuantities] = useState<Record<string, number>>({});
  const [labelStartPos, setLabelStartPos] = useState(0);
  const [page, setPage] = useState(1);
  const [loadingAllDecl, setLoadingAllDecl] = useState(false); // chargement arrière-plan
  const enrichedItemIds = useRef<Set<number>>(new Set()); // items dont les prix déclinaisons ont été enrichis

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1); // reset page on search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [typeFilter, declFilter, priceFilter, stockFilter]);

  const [syncProgress, setSyncProgress] = useState<string>("");

  // Lit le catalogue depuis Supabase (synchronisé depuis Sellsy).
  // Si `fresh=true`, déclenche d'abord une sync Sellsy → Supabase en 2 phases.
  const fetchItems = async (fresh = false) => {
    setRefreshing(true);
    try {
      if (fresh) {
        setLoadingAllDecl(true);
        // Phase 1 : sync items (rapide, bulk)
        setSyncProgress("Phase 1/3 : sync articles…");
        const syncItems = await fetch("/api/sellsy/sync-catalogue/items", { method: "POST" });
        const syncItemsData = await syncItems.json();
        if (!syncItemsData.success) {
          console.error("Erreur sync items:", syncItemsData.error);
          setSyncProgress("");
        } else {
          // Phase 2 : sync déclinaisons en mode resume (pioche next not-synced)
          const syncId = syncItemsData.syncId;
          let done = false;
          let consecutiveErrors = 0;
          while (!done) {
            try {
              const res = await fetch(
                `/api/sellsy/sync-catalogue/declinations?limit=30&syncId=${syncId}`,
                { method: "POST" }
              );
              const data = await res.json();
              if (!data.success) {
                console.error("Erreur sync decls:", data.error);
                consecutiveErrors++;
                if (consecutiveErrors >= 3) break;
                await new Promise((r) => setTimeout(r, 2000));
                continue;
              }
              consecutiveErrors = 0;
              done = data.done;
              setSyncProgress(`Phase 2/3 : déclinaisons ${data.synced}/${data.total}…`);
            } catch (e) {
              console.error("Erreur fetch decls:", e);
              consecutiveErrors++;
              if (consecutiveErrors >= 3) break;
              await new Promise((r) => setTimeout(r, 2000));
            }
          }

          // Phase 3 : sync stocks (resume mode)
          let stockDone = false;
          let stockErrors = 0;
          while (!stockDone) {
            try {
              const res = await fetch(
                `/api/sellsy/sync-catalogue/stock?limit=30&syncId=${syncId}`,
                { method: "POST" }
              );
              const data = await res.json();
              if (!data.success) {
                console.error("Erreur sync stock:", data.error);
                stockErrors++;
                if (stockErrors >= 3) break;
                await new Promise((r) => setTimeout(r, 2000));
                continue;
              }
              stockErrors = 0;
              stockDone = data.done;
              setSyncProgress(`Phase 3/3 : stocks ${data.synced}/${data.total}…`);
            } catch (e) {
              console.error("Erreur fetch stock:", e);
              stockErrors++;
              if (stockErrors >= 3) break;
              await new Promise((r) => setTimeout(r, 2000));
            }
          }
          setSyncProgress("");
        }
      }
      const res = await fetch("/api/catalogue");
      const data = await res.json();
      if (data.success) {
        setItems(data.items || []);
        setDeclinations(data.declinations || {});
        enrichedItemIds.current = new Set((data.items || []).map((i: SellsyItem) => i.id));
      }
    } catch (error) {
      console.error("Erreur chargement catalogue:", error);
      setSyncProgress("");
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingAllDecl(false);
    }
  };

  // Lazy-load declinations for a single item + enrichit les prix via GET /items/{decl.id}
  const fetchDeclinations = async (itemId: number) => {
    // Garde : déjà enrichi (pas seulement chargé — le background load peut avoir rempli sans enrichissement)
    if (enrichedItemIds.current.has(itemId)) return;
    enrichedItemIds.current.add(itemId);
    setLoadingDecl((prev) => new Set(prev).add(itemId));
    try {
      // Récupère les déclinaisons (depuis état ou API)
      let decls: Declination[] = [];
      const res = await fetch(`/api/sellsy/items/${itemId}/declinations`);
      const data = await res.json();
      if (data.success) decls = data.declinations || [];

      // Enrichissement : le HT est déjà retourné par listDeclinations (reference_price_taxes_exc).
      // Le TTC est calculé via la TVA du parent (tvaMultiplier = parentTTC / parentHT).
      // Le sous-endpoint /prices renvoie 404 si l'item n'a pas de grilles tarifaires multiples — on l'évite.
      const parent = items.find((i) => i.id === itemId);
      const parentHT = parseFloat(parent?.reference_price_taxes_exc || "0");
      const parentTTC = parseFloat(parent?.reference_price_taxes_inc || "0");
      const tvaMultiplier = parentHT > 0 && parentTTC > parentHT ? parentTTC / parentHT : 1.085;
      const enriched = decls.map((d) => {
        if (d.reference_price_taxes_inc) return d;
        const declHT = parseFloat(d.reference_price_taxes_exc || "0");
        if (declHT > 0) {
          return {
            ...d,
            reference_price_taxes_inc: String(declHT * tvaMultiplier),
          };
        }
        return d;
      });
      console.log(`[decls item=${itemId}] ${decls.length} déclinaisons enrichies`, enriched.slice(0, 3));

      setDeclinations((prev) => ({ ...prev, [itemId]: enriched }));
    } catch (error) {
      console.error(`Erreur déclinaisons item ${itemId}:`, error);
      enrichedItemIds.current.delete(itemId); // permettre retry
    } finally {
      setLoadingDecl((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  useEffect(() => { fetchItems(); }, []);

  // Filter & sort
  const filtered = useMemo(() => {
    let result = items;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((item) => {
        const itemMatch =
          (item.name || "").toLowerCase().includes(q) ||
          (item.reference || "").toLowerCase().includes(q) ||
          (item.description || "").toLowerCase().includes(q);
        if (itemMatch) return true;
        const decls = declinations[item.id];
        if (decls) {
          return decls.some(
            (d) =>
              (d.name || "").toLowerCase().includes(q) ||
              (d.reference || "").toLowerCase().includes(q)
          );
        }
        return false;
      });
    }


    if (typeFilter !== "ALL") {
      result = result.filter((item) => item.type === typeFilter);
    }

    if (declFilter === "with") {
      result = result.filter((item) => item.is_declined);
    } else if (declFilter === "without") {
      result = result.filter((item) => !item.is_declined);
    }

    if (priceFilter !== "ALL") {
      result = result.filter((item) => {
        const ht = parseFloat(item.reference_price_taxes_exc || "0");
        switch (priceFilter) {
          case "<100": return ht < 100;
          case "100-500": return ht >= 100 && ht < 500;
          case "500-1000": return ht >= 500 && ht < 1000;
          case ">1000": return ht >= 1000;
          default: return true;
        }
      });
    }

    if (stockFilter !== "ALL") {
      result = result.filter((item) => {
        const avail = item.stock_available ?? 0;
        switch (stockFilter) {
          case "in": return avail > 0;
          case "out": return avail <= 0;
          case "low": return avail > 0 && avail <= 5;
          default: return true;
        }
      });
    }

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
        case "stock_sp":
          cmp = (getWhAvailable(a.stock_by_warehouse, WH_SP) ?? -1) - (getWhAvailable(b.stock_by_warehouse, WH_SP) ?? -1);
          break;
        case "stock_bo":
          cmp = (getWhAvailable(a.stock_by_warehouse, WH_BO) ?? -1) - (getWhAvailable(b.stock_by_warehouse, WH_BO) ?? -1);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [items, declinations, search, typeFilter, declFilter, priceFilter, stockFilter, sortKey, sortDir]);

  // Index rapide pour résoudre les prix des déclinaisons (qui sont aussi des items standalone)
  const itemsByIdEarly = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);

  // Quand une recherche est active : quelles déclinaisons matchent (pour n'afficher que celles-là)
  const searchMatchedDeclIdsEarly = useMemo(() => {
    if (!search) return null;
    const q = search.toLowerCase();
    const matched = new Set<number>();
    for (const decls of Object.values(declinations)) {
      for (const d of decls) {
        if (
          (d.name || "").toLowerCase().includes(q) ||
          (d.reference || "").toLowerCase().includes(q)
        ) {
          matched.add(d.id);
        }
      }
    }
    return matched;
  }, [search, declinations]);

  const parentMatchesSearchEarly = useCallback(
    (item: SellsyItem): boolean => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        (item.name || "").toLowerCase().includes(q) ||
        (item.reference || "").toLowerCase().includes(q) ||
        (item.description || "").toLowerCase().includes(q)
      );
    },
    [search]
  );

  // Flat display rows : en mode recherche, chaque déclinaison qui match apparait comme une ligne top-level (comme Sellsy).
  type DisplayRow =
    | { kind: "parent"; item: SellsyItem }
    | { kind: "decl"; item: SellsyItem; decl: Declination };

  const displayRows = useMemo<DisplayRow[]>(() => {
    const rows: DisplayRow[] = [];
    for (const item of filtered) {
      const decls = declinations[item.id] || [];
      const hasDecls = item.is_declined;
      if (search) {
        const pMatches = parentMatchesSearchEarly(item);
        if (pMatches) {
          rows.push({ kind: "parent", item });
        }
        for (const d of decls) {
          if (searchMatchedDeclIdsEarly?.has(d.id)) {
            rows.push({ kind: "decl", item, decl: d });
          }
        }
        // Si aucun match explicite n'a été ajouté (edge case : item matché mais pas de decls chargées)
        if (!pMatches && decls.length === 0) {
          rows.push({ kind: "parent", item });
        }
      } else {
        const showParent = !hasDecls || decls.length === 0;
        if (showParent) {
          rows.push({ kind: "parent", item });
        } else {
          for (const d of decls) {
            rows.push({ kind: "decl", item, decl: d });
          }
        }
      }
    }
    return rows;
  }, [filtered, declinations, search, searchMatchedDeclIdsEarly, parentMatchesSearchEarly]);

  // Pagination (sur les lignes d'affichage)
  const totalPages = Math.max(1, Math.ceil(displayRows.length / PAGE_SIZE));
  const paginatedRows = useMemo(
    () => displayRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [displayRows, page]
  );

  // Items uniques présents dans la page courante (pour le prefetch des déclinaisons)
  const paginated = useMemo(() => {
    const seen = new Set<number>();
    const arr: SellsyItem[] = [];
    for (const r of paginatedRows) {
      if (!seen.has(r.item.id)) {
        seen.add(r.item.id);
        arr.push(r.item);
      }
    }
    return arr;
  }, [paginatedRows]);

  // Auto-fetch + enrichit les déclinaisons pour les items de la page courante
  useEffect(() => {
    const declined = paginated.filter(
      (i) => i.is_declined && !enrichedItemIds.current.has(i.id) && !loadingDecl.has(i.id)
    );
    declined.forEach((i) => fetchDeclinations(i.id));
  }, [paginated, declinations]); // eslint-disable-line react-hooks/exhaustive-deps


  // Aliases pour compat avec le reste du fichier
  const itemsById = itemsByIdEarly;
  const searchMatchedDeclIds = searchMatchedDeclIdsEarly;
  const parentMatchesSearch = parentMatchesSearchEarly;

  // KPIs
  const totalDeclined = useMemo(() => items.filter((i) => i.is_declined).length, [items]);
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
      declined: totalDeclined,
    };
  }, [items, totalDeclined]);

  // Ouvrir le drawer d'une déclinaison spécifique (virtual SellsyItem)
  const openDeclDrawer = (decl: Declination, parentItem: SellsyItem) => {
    const parentHT = parseFloat(parentItem.reference_price_taxes_exc || "0");
    const parentTTC = parseFloat(parentItem.reference_price_taxes_inc || "0");
    const tvaMultiplier = parentHT > 0 && parentTTC > parentHT ? parentTTC / parentHT : 1.085;
    const dHT = parseFloat(decl.reference_price_taxes_exc || "0") || parentHT;
    const dTTC = decl.reference_price_taxes_inc
      ? parseFloat(decl.reference_price_taxes_inc)
      : dHT * tvaMultiplier;
    const dPurch = parseFloat(decl.purchase_amount || "0") || parseFloat(parentItem.purchase_amount || "0");
    const virtualItem: SellsyItem = {
      id: parentItem.id,
      type: parentItem.type,
      name: decl.name || parentItem.name || null,
      reference: decl.reference,
      description: parentItem.description || "",
      reference_price_taxes_exc: String(dHT),
      reference_price_taxes_inc: String(dTTC),
      purchase_amount: String(dPurch),
      currency: parentItem.currency,
      standard_quantity: parentItem.standard_quantity,
      category_id: parentItem.category_id,
      is_archived: parentItem.is_archived,
      is_declined: false,
      created: parentItem.created,
      updated: parentItem.updated,
      stock_physical: decl.stock_physical ?? null,
      stock_reserved: decl.stock_reserved ?? null,
      stock_available: decl.stock_available ?? null,
      stock_by_warehouse: decl.stock_by_warehouse ?? null,
    };
    setSelectedItem(virtualItem);
    setDrawerDeclUrl(getSellsyDeclUrl(parentItem.id, decl.id));
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  };

  // ── Sélection multi-étiquettes ──
  const getQty = (key: string) => labelQuantities[key] ?? 1;
  const setQty = (key: string, n: number) => {
    setLabelQuantities((prev) => ({ ...prev, [key]: Math.max(1, Math.min(99, n)) }));
  };

  const toggleCheck = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setLabelQuantities((q) => { const c = { ...q }; delete c[`item-${id}`]; return c; });
      } else next.add(id);
      return next;
    });
  };

  const toggleCheckDecl = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setCheckedDeclIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setLabelQuantities((q) => { const c = { ...q }; delete c[`decl-${id}`]; return c; });
      } else next.add(id);
      return next;
    });
  };

  const allPageChecked = paginatedRows.length > 0 && paginatedRows.every((r) => {
    if (r.kind === "decl") return checkedDeclIds.has(r.decl.id);
    return checkedIds.has(r.item.id);
  });

  const toggleAll = () => {
    if (allPageChecked) {
      setCheckedIds((prev) => {
        const next = new Set(prev);
        paginatedRows.forEach((r) => { if (r.kind === "parent") next.delete(r.item.id); });
        return next;
      });
      setCheckedDeclIds((prev) => {
        const next = new Set(prev);
        paginatedRows.forEach((r) => { if (r.kind === "decl") next.delete(r.decl.id); });
        return next;
      });
    } else {
      setCheckedIds((prev) => {
        const next = new Set(prev);
        paginatedRows.forEach((r) => { if (r.kind === "parent") next.add(r.item.id); });
        return next;
      });
      setCheckedDeclIds((prev) => {
        const next = new Set(prev);
        paginatedRows.forEach((r) => { if (r.kind === "decl") next.add(r.decl.id); });
        return next;
      });
    }
  };

  const totalChecked = checkedIds.size + checkedDeclIds.size;

  const printableLabels = useMemo(() => {
    const labels: Array<{ reference: string; name: string; priceTTC: string }> = [];
    for (const item of items) {
      if (checkedIds.has(item.id)) {
        const qty = labelQuantities[`item-${item.id}`] ?? 1;
        const label = {
          reference: item.reference || "",
          name: item.name || item.reference || `#${item.id}`,
          priceTTC: item.reference_price_taxes_inc || "0",
        };
        for (let k = 0; k < qty; k++) labels.push(label);
      }
    }
    for (const [itemIdStr, decls] of Object.entries(declinations)) {
      const parentItem = items.find((i) => i.id === Number(itemIdStr));
      const parentHT = parseFloat(parentItem?.reference_price_taxes_exc || "0");
      const parentTTC = parseFloat(parentItem?.reference_price_taxes_inc || "0");
      const tvaMultiplier = parentHT > 0 && parentTTC > parentHT ? parentTTC / parentHT : 1.085;
      for (const decl of decls) {
        if (checkedDeclIds.has(decl.id)) {
          // 1) Prix TTC propre de la déclinaison (enrichi via /items/{id}/declinations/prices)
          const declTTCRaw = parseFloat(decl.reference_price_taxes_inc || "0");
          // 2) Sinon HT déclinaison × TVA
          const declHTRaw = parseFloat(decl.reference_price_taxes_exc || "0");
          // 3) Fallback final : prix parent
          let priceTTC = 0;
          if (declTTCRaw > 0) {
            priceTTC = declTTCRaw;
          } else if (declHTRaw > 0) {
            priceTTC = declHTRaw * tvaMultiplier;
          } else {
            priceTTC = parentTTC > 0 ? parentTTC : parentHT * tvaMultiplier;
          }
          const qty = labelQuantities[`decl-${decl.id}`] ?? 1;
          const label = {
            reference: decl.reference || "",
            name: decl.name || decl.reference || "",
            priceTTC: String(priceTTC),
          };
          for (let k = 0; k < qty; k++) labels.push(label);
        }
      }
    }
    return labels;
  }, [items, declinations, checkedIds, checkedDeclIds, labelQuantities]);

  const handlePrintMulti = useCallback(() => {
    if (printableLabels.length === 0) return;

    const fmtEuro = (val: string | number) => {
      const num = typeof val === "string" ? parseFloat(val) : val;
      if (!num && num !== 0) return "—";
      return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
    };

    // Agipa 51259 — 70 x 35 mm — 3 colonnes x 8 lignes = 24/page A4
    const COLS = 3;
    const ROWS = 8;
    const PER_PAGE = COLS * ROWS;
    const PAGE_MARGIN_TOP = 8.5;
    const PAGE_MARGIN_LEFT = 0;
    const LABEL_W = 70;
    const LABEL_H = 35;

    // Prepend empty slots for the chosen start position
    const allSlots: (typeof printableLabels[0] | null)[] = [
      ...Array(labelStartPos).fill(null),
      ...printableLabels,
    ];

    const pages: string[] = [];
    for (let p = 0; p < Math.ceil(allSlots.length / PER_PAGE); p++) {
      const pageSlots = allSlots.slice(p * PER_PAGE, (p + 1) * PER_PAGE);
      let gridCells = "";
      for (let i = 0; i < PER_PAGE; i++) {
        const label = pageSlots[i];
        const globalIdx = p * PER_PAGE + i;
        if (label) {
          gridCells += `
            <div class="label">
              <div class="brand">DIMEXOI</div>
              <div class="name">${(label.name).replace(/"/g, "&quot;")}</div>
              <div class="ref">Réf : ${label.reference || "—"}</div>
              <div class="price-ttc">${fmtEuro(label.priceTTC)}</div>
              <div class="origin">Origine Bois : Tectona Grandis (Teck)</div>
              <div class="barcode-container" id="bc-${globalIdx}"></div>
            </div>`;
        } else {
          gridCells += `<div class="label empty"></div>`;
        }
      }
      pages.push(`<div class="page"><div class="grid">${gridCells}</div></div>`);
    }

    const barcodeScripts = printableLabels
      .map((label, idx) => {
        const slotIdx = idx + labelStartPos;
        return `
        try {
          var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
          document.getElementById("bc-${slotIdx}").appendChild(svg);
          JsBarcode(svg, "${(label.reference).replace(/"/g, '\\"')}", {
            format: "CODE128", width: 1.2, height: 16, displayValue: true,
            fontSize: 7, margin: 1, background: "transparent", lineColor: "#1F2937",
          });
        } catch(e) {
          var el = document.getElementById("bc-${slotIdx}");
          if (el) el.textContent = "${(label.reference).replace(/"/g, '\\"')}";
        }`;
      })
      .join("\n");

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`<!DOCTYPE html>
<html><head><meta charset="utf-8">
<title>Étiquettes DIMEXOI (${printableLabels.length})</title>
<style>
@page { size: A4; margin: 0; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f5f6f7; }
.page { width: 210mm; height: 297mm; padding: ${PAGE_MARGIN_TOP}mm 0 0 ${PAGE_MARGIN_LEFT}mm; page-break-after: always; background: white; }
.page:last-child { page-break-after: auto; }
.grid { display: grid; grid-template-columns: repeat(${COLS}, ${LABEL_W}mm); grid-template-rows: repeat(${ROWS}, ${LABEL_H}mm); justify-content: center; }
.label { width: ${LABEL_W}mm; height: ${LABEL_H}mm; padding: 1mm 2mm; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; overflow: hidden; }
.label.empty { visibility: hidden; }
.brand { font-size: 5pt; color: #8592A3; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 0.5mm; }
.name { font-size: 6.5pt; font-weight: bold; color: #1F2937; line-height: 1.2; max-height: 2.4em; overflow: hidden; margin-bottom: 0.5mm; padding: 0 1mm; }
.ref { font-family: monospace; font-size: 6pt; color: #03C3EC; margin-bottom: 0.5mm; }
.price-ttc { font-size: 9pt; font-weight: bold; color: #1F2937; margin-bottom: 0.5mm; }
.origin { font-size: 4.5pt; color: #6B7280; font-style: italic; margin-bottom: 0.5mm; }
.barcode-container { width: 100%; }
.barcode-container svg { width: 80%; height: auto; max-height: 9mm; }
@media print { body { background: white; } }
@media screen { body { padding: 20px; display: flex; flex-direction: column; align-items: center; gap: 20px; } .page { border: 1px solid #ccc; border-radius: 4px; } .label:not(.empty) { outline: 1px dashed #e5e7eb; } }
</style></head><body>
${pages.join("\n")}
<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3/dist/JsBarcode.all.min.js"><\/script>
<script>${barcodeScripts}\nsetTimeout(function(){window.print();},500);<\/script>
</body></html>`);
    printWindow.document.close();
  }, [printableLabels, labelStartPos]);

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
            <div className="h-8 w-56 bg-cockpit-dark rounded-lg animate-pulse" />
            <div className="h-4 w-40 bg-cockpit-dark rounded mt-2 animate-pulse" />
          </div>
          <div className="h-10 w-28 bg-cockpit-dark rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-cockpit-card rounded-card border border-cockpit animate-pulse p-4">
              <div className="h-3 w-20 bg-cockpit-dark rounded mb-3" />
              <div className="h-6 w-16 bg-cockpit-dark rounded" />
            </div>
          ))}
        </div>
        <div className="h-12 w-full bg-cockpit-dark rounded-xl animate-pulse" />
        <div className="bg-cockpit-card rounded-card border border-cockpit overflow-hidden">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="px-4 py-3 border-b border-cockpit flex gap-4 animate-pulse">
              <div className="h-4 w-20 bg-cockpit-dark rounded" />
              <div className="h-4 w-48 bg-cockpit-dark rounded" />
              <div className="h-4 w-14 bg-cockpit-dark rounded" />
              <div className="h-4 w-20 bg-cockpit-dark rounded ml-auto" />
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
          <p className="text-cockpit-secondary text-sm flex items-center gap-2 flex-wrap">
            <span>{filtered.length} produit{filtered.length > 1 ? "s" : ""} sur {items.length}
            {totalDeclined > 0 && <span className="ml-1">({totalDeclined} avec déclinaisons)</span>}</span>
            {loadingAllDecl && (
              <span className="flex items-center gap-1 text-xs text-cockpit-warning">
                <Loader2 className="w-3 h-3 animate-spin" />
                {syncProgress || "Chargement des déclinaisons…"}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/commercial/catalogue/scan"
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-white text-sm min-h-[44px]"
            style={{ background: `linear-gradient(135deg, var(--color-active), #FEEB9C)` }}
          >
            <ScanBarcode className="w-4 h-4" />
            Scanner
          </Link>
          <button
            onClick={() => fetchItems(true)}
            disabled={refreshing}
            className="flex items-center justify-center gap-2 bg-cockpit-card border border-cockpit px-4 py-2.5 rounded-lg font-semibold hover:bg-cockpit-dark transition-colors disabled:opacity-50 text-sm"
          >
            {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Rafraîchir
          </button>
        </div>
      </div>

      {/* Mémo étiquettes */}
      <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg p-3 sm:p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-cockpit-info flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-xs font-semibold text-cockpit-heading">Étiquettes compatibles</p>
          <p className="text-[11px] text-cockpit-secondary mt-0.5">
            Agipa — 2400 étiquettes blanches multi-usages — <strong>70 x 35 mm</strong> — coins droits — réf <strong>51259</strong>
            <br />Format A4, 24 étiquettes/page (3 colonnes x 8 lignes). Jet d&apos;encre / Laser / Copieur.
          </p>
        </div>
        <a
          href={LABEL_BUY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white flex-shrink-0"
          style={{ backgroundColor: "var(--color-active, #4C9DB0)" }}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          Commander
        </a>
      </div>

      {/* Search + Filters */}
      <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg p-3 sm:p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cockpit-secondary" />
            <input
              type="text"
              placeholder="Rechercher par nom, référence..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-cockpit-input rounded-input bg-cockpit-input text-cockpit-primary text-sm"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Type */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-cockpit-input border border-cockpit-input px-3 py-1.5 rounded-lg text-xs text-cockpit-primary"
          >
            <option value="ALL">Tous les types</option>
            <option value="product">Produits</option>
            <option value="service">Services</option>
          </select>
          {/* Déclinaisons */}
          <select
            value={declFilter}
            onChange={(e) => setDeclFilter(e.target.value)}
            className="bg-cockpit-input border border-cockpit-input px-3 py-1.5 rounded-lg text-xs text-cockpit-primary"
          >
            <option value="ALL">Déclinaisons : Tous</option>
            <option value="with">Avec déclinaisons</option>
            <option value="without">Sans déclinaison</option>
          </select>
          {/* Prix HT */}
          <select
            value={priceFilter}
            onChange={(e) => setPriceFilter(e.target.value)}
            className="bg-cockpit-input border border-cockpit-input px-3 py-1.5 rounded-lg text-xs text-cockpit-primary"
          >
            <option value="ALL">Prix : Tous</option>
            <option value="<100">&lt; 100 &euro;</option>
            <option value="100-500">100 - 500 &euro;</option>
            <option value="500-1000">500 - 1 000 &euro;</option>
            <option value=">1000">&gt; 1 000 &euro;</option>
          </select>
          {/* Stock */}
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="bg-cockpit-input border border-cockpit-input px-3 py-1.5 rounded-lg text-xs text-cockpit-primary"
          >
            <option value="ALL">Stock : Tous</option>
            <option value="in">En stock (&gt; 0)</option>
            <option value="low">Stock faible (≤ 5)</option>
            <option value="out">Rupture (0)</option>
          </select>
          {/* Reset */}
          {(typeFilter !== "ALL" || declFilter !== "ALL" || priceFilter !== "ALL" || stockFilter !== "ALL" || search) && (
            <button
              onClick={() => { setTypeFilter("ALL"); setDeclFilter("ALL"); setPriceFilter("ALL"); setStockFilter("ALL"); setSearchInput(""); setSearch(""); }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-500 bg-red-50 hover:bg-red-100 transition-colors"
            >
              Effacer filtres
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg overflow-hidden">
        {/* Desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-cockpit-dark border-b border-cockpit">
              <tr>
                <th className="pl-4 pr-1 py-3 w-8">
                  <input
                    type="checkbox"
                    checked={allPageChecked}
                    onChange={toggleAll}
                    className="w-4 h-4 rounded border-cockpit accent-[var(--color-active,#4C9DB0)] cursor-pointer"
                  />
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-cockpit-heading cursor-pointer hover:text-cockpit-info transition-colors" onClick={() => handleSort("reference")}>
                  <span className="flex items-center gap-1.5">RÉF. <SortIcon col="reference" /></span>
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-cockpit-heading cursor-pointer hover:text-cockpit-info transition-colors" onClick={() => handleSort("name")}>
                  <span className="flex items-center gap-1.5">NOM <SortIcon col="name" /></span>
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-cockpit-heading cursor-pointer hover:text-cockpit-info transition-colors" onClick={() => handleSort("type")}>
                  <span className="flex items-center gap-1.5">TYPE <SortIcon col="type" /></span>
                </th>
                <th className="px-4 lg:px-6 py-3 text-right text-xs font-semibold text-cockpit-heading cursor-pointer hover:text-cockpit-info transition-colors" onClick={() => handleSort("price_ht")}>
                  <span className="flex items-center gap-1.5 justify-end">PRIX HT <SortIcon col="price_ht" /></span>
                </th>
                <th className="px-4 lg:px-6 py-3 text-right text-xs font-semibold text-cockpit-heading cursor-pointer hover:text-cockpit-info transition-colors" onClick={() => handleSort("price_ttc")}>
                  <span className="flex items-center gap-1.5 justify-end">PRIX TTC <SortIcon col="price_ttc" /></span>
                </th>
                <th className="px-3 py-3 text-right text-xs font-semibold text-cockpit-heading cursor-pointer hover:text-cockpit-info transition-colors" onClick={() => handleSort("stock_sp")}>
                  <span className="flex items-center gap-1.5 justify-end">DISPO SP <SortIcon col="stock_sp" /></span>
                </th>
                <th className="px-3 py-3 text-right text-xs font-semibold text-cockpit-heading cursor-pointer hover:text-cockpit-info transition-colors" onClick={() => handleSort("stock_bo")}>
                  <span className="flex items-center gap-1.5 justify-end">DISPO BO <SortIcon col="stock_bo" /></span>
                </th>
                {canSeePurchase && (
                  <th className="px-3 py-3 text-right text-xs font-semibold text-cockpit-heading hidden lg:table-cell">
                    ACHAT / MARGE
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-cockpit">
              {paginatedRows.length > 0 ? (
                paginatedRows.map((row) => {
                  if (row.kind === "parent") {
                  const item = row.item;
                  const priceHT = parseFloat(item.reference_price_taxes_exc || "0");
                  const priceTTC = parseFloat(item.reference_price_taxes_inc || "0");
                  const purchasePrice = parseFloat(item.purchase_amount || "0");
                  const margin = priceHT > 0 && purchasePrice > 0 ? ((priceHT - purchasePrice) / priceHT * 100) : null;
                  const hasDecls = item.is_declined;
                  const isDeclLoading = loadingDecl.has(item.id);

                  return (
                    <React.Fragment key={`item-${item.id}`}>
                      {/* Parent row */}
                      {true && (
                        <tr className={`hover:bg-cockpit-dark transition-colors cursor-pointer ${checkedIds.has(item.id) ? "bg-[var(--color-active-light,rgba(14,105,115,0.06))]" : ""}`} onClick={() => setSelectedItem(item)}>
                          <td className="pl-4 pr-1 py-3" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={checkedIds.has(item.id)}
                                onChange={() => {}}
                                onClick={(e) => toggleCheck(item.id, e)}
                                className="w-4 h-4 rounded border-cockpit accent-[var(--color-active,#4C9DB0)] cursor-pointer"
                              />
                              {checkedIds.has(item.id) && (
                                <QtyControl qty={getQty(`item-${item.id}`)} onChange={(n) => setQty(`item-${item.id}`, n)} accent="blue" />
                              )}
                            </div>
                          </td>
                          <td className="px-4 lg:px-6 py-3">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-mono text-cockpit-info bg-cockpit-info/10 px-2 py-0.5 rounded">
                                {item.reference || "—"}
                              </span>
                              {hasDecls && isDeclLoading && (
                                <Loader2 className="w-3 h-3 animate-spin text-purple-400" />
                              )}
                            </div>
                          </td>
                          <td className="px-4 lg:px-6 py-3">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-cockpit-heading truncate max-w-[300px]">
                                {item.name || item.reference || `#${item.id}`}
                              </p>
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
                            <span className="text-sm text-cockpit-primary">
                              {formatEuro(priceHT)}
                            </span>
                          </td>
                          <td className="px-4 lg:px-6 py-3 text-right">
                            <span className="text-sm font-semibold text-cockpit-heading">
                              {formatEuro(priceTTC)}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right">
                            <StockBadge available={getWhAvailable(item.stock_by_warehouse, WH_SP)} byWh={item.stock_by_warehouse} />
                          </td>
                          <td className="px-3 py-3 text-right">
                            <StockBadge available={getWhAvailable(item.stock_by_warehouse, WH_BO)} byWh={item.stock_by_warehouse} />
                          </td>
                          {canSeePurchase && (
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
                          )}
                        </tr>
                      )}
                    </React.Fragment>
                  );
                  } else {
                    const { item, decl } = row;
                    const priceHT = parseFloat(item.reference_price_taxes_exc || "0");
                    const priceTTC = parseFloat(item.reference_price_taxes_inc || "0");
                    const purchasePrice = parseFloat(item.purchase_amount || "0");
                    const tvaMultiplier = priceHT > 0 && priceTTC > priceHT ? priceTTC / priceHT : 1.085;
                    const dHT = parseFloat(decl.reference_price_taxes_exc || "0") || priceHT;
                    const dTTC = decl.reference_price_taxes_inc
                      ? parseFloat(decl.reference_price_taxes_inc)
                      : dHT * tvaMultiplier;
                    const dPurchRaw = parseFloat(decl.purchase_amount || "0");
                    const dPurch = dPurchRaw > 0 ? dPurchRaw : purchasePrice;
                    const dMargin = dHT > 0 && dPurch > 0 ? ((dHT - dPurch) / dHT * 100) : null;
                    return (
                      <tr key={`decl-${decl.id}`} className={`hover:bg-cockpit-dark/50 transition-colors cursor-pointer ${checkedDeclIds.has(decl.id) ? "bg-[var(--color-active-light,rgba(14,105,115,0.06))]" : ""}`} onClick={() => openDeclDrawer(decl, item)}>
                        <td className="pl-4 pr-1 py-2" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={checkedDeclIds.has(decl.id)}
                              onChange={() => {}}
                              onClick={(e) => toggleCheckDecl(decl.id, e)}
                              className="w-4 h-4 rounded border-cockpit accent-purple-500 cursor-pointer"
                            />
                            {checkedDeclIds.has(decl.id) && (
                              <QtyControl qty={getQty(`decl-${decl.id}`)} onChange={(n) => setQty(`decl-${decl.id}`, n)} accent="purple" />
                            )}
                          </div>
                        </td>
                        <td className="px-4 lg:px-6 py-2">
                          <span className="text-xs font-mono text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded">
                            {decl.reference || "—"}
                          </span>
                        </td>
                        <td className="px-4 lg:px-6 py-2">
                          <div className="min-w-0">
                            <p className="text-xs text-cockpit-primary truncate max-w-[300px]">
                              {decl.name || decl.reference}
                            </p>
                            <p className="text-[9px] text-cockpit-secondary mt-0.5">
                              {item.name || item.reference}
                            </p>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <span className="text-[9px] text-purple-400 font-medium bg-purple-400/10 px-1.5 py-0.5 rounded">Déclinaison</span>
                        </td>
                        <td className="px-4 lg:px-6 py-2 text-right">
                          <span className="text-xs text-cockpit-primary">
                            {formatEuro(dHT)}
                          </span>
                        </td>
                        <td className="px-4 lg:px-6 py-2 text-right">
                          <span className="text-xs font-semibold text-cockpit-heading">
                            {formatEuro(dTTC)}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <StockBadge available={getWhAvailable(decl.stock_by_warehouse, WH_SP)} byWh={decl.stock_by_warehouse} />
                        </td>
                        <td className="px-3 py-2 text-right">
                          <StockBadge available={getWhAvailable(decl.stock_by_warehouse, WH_BO)} byWh={decl.stock_by_warehouse} />
                        </td>
                        {canSeePurchase && (
                          <td className="px-3 py-2 text-right hidden lg:table-cell">
                            <div>
                              <span className="text-[10px] text-cockpit-secondary">
                                {formatEuro(dPurch)}
                              </span>
                              {dMargin !== null && dMargin > 0 && (
                                <p className={`text-[9px] ${dMargin > 30 ? "text-cockpit-success" : dMargin > 15 ? "text-cockpit-warning" : "text-red-400"}`}>
                                  Marge {dMargin.toFixed(0)}%
                                </p>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  }
                })
              ) : (
                <tr>
                  <td colSpan={canSeePurchase ? 10 : 9} className="px-4 py-12 text-center text-cockpit-secondary">
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
          {paginatedRows.length > 0 ? (
            paginatedRows.map((row) => {
              if (row.kind === "parent") {
              const item = row.item;
              const priceHT = parseFloat(item.reference_price_taxes_exc || "0");
              const priceTTC = parseFloat(item.reference_price_taxes_inc || "0");

              return (
                <div key={`item-${item.id}`}>
                  {/* Parent */}
                  {true && (
                    <div className={`p-4 hover:bg-cockpit-dark transition-colors cursor-pointer ${checkedIds.has(item.id) ? "bg-[var(--color-active-light,rgba(14,105,115,0.06))]" : ""}`} onClick={() => setSelectedItem(item)}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-shrink-0 pt-0.5 flex items-center gap-1.5">
                          <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={checkedIds.has(item.id)}
                              onChange={() => {}}
                              onClick={(e) => toggleCheck(item.id, e)}
                              className="w-4 h-4 rounded border-cockpit accent-[var(--color-active,#4C9DB0)] cursor-pointer"
                            />
                            {checkedIds.has(item.id) && (
                              <QtyControl qty={getQty(`item-${item.id}`)} onChange={(n) => setQty(`item-${item.id}`, n)} accent="blue" />
                            )}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
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
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-[10px] text-cockpit-secondary">HT: {formatEuro(priceHT)}</p>
                          <p className="text-sm font-bold text-cockpit-heading">{formatEuro(priceTTC)}</p>
                          <div className="mt-1 flex items-center gap-1 justify-end">
                            <span className="text-[9px] text-cockpit-secondary">SP</span>
                            <StockBadge available={getWhAvailable(item.stock_by_warehouse, WH_SP)} byWh={item.stock_by_warehouse} />
                            <span className="text-[9px] text-cockpit-secondary ml-1">BO</span>
                            <StockBadge available={getWhAvailable(item.stock_by_warehouse, WH_BO)} byWh={item.stock_by_warehouse} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
              } else {
                const { item, decl } = row;
                const priceHT = parseFloat(item.reference_price_taxes_exc || "0");
                const priceTTC = parseFloat(item.reference_price_taxes_inc || "0");
                const tvaMultiplier = priceHT > 0 && priceTTC > priceHT ? priceTTC / priceHT : 1.085;
                const dHT = parseFloat(decl.reference_price_taxes_exc || "0") || priceHT;
                const dTTC = decl.reference_price_taxes_inc
                  ? parseFloat(decl.reference_price_taxes_inc)
                  : dHT * tvaMultiplier;
                return (
                  <div
                    key={`decl-${decl.id}`}
                    className={`p-4 hover:bg-cockpit-dark/50 transition-colors cursor-pointer ${checkedDeclIds.has(decl.id) ? "bg-[var(--color-active-light,rgba(14,105,115,0.06))]" : ""}`}
                    onClick={() => openDeclDrawer(decl, item)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-shrink-0 pt-0.5 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={checkedDeclIds.has(decl.id)}
                          onChange={() => {}}
                          onClick={(e) => toggleCheckDecl(decl.id, e)}
                          className="w-4 h-4 rounded border-cockpit accent-purple-500 cursor-pointer"
                        />
                        {checkedDeclIds.has(decl.id) && (
                          <QtyControl qty={getQty(`decl-${decl.id}`)} onChange={(n) => setQty(`decl-${decl.id}`, n)} accent="purple" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-[10px] font-mono text-purple-400 bg-purple-400/10 px-1.5 py-0.5 rounded">
                            {decl.reference}
                          </span>
                          <span className="text-[9px] text-purple-400 font-medium bg-purple-400/10 px-1.5 py-0.5 rounded">Déclinaison</span>
                        </div>
                        <p className="text-xs text-cockpit-primary truncate">
                          {decl.name || decl.reference}
                        </p>
                        <p className="text-[9px] text-cockpit-secondary mt-0.5">{item.name || item.reference}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-[10px] text-cockpit-secondary">HT: {formatEuro(dHT)}</p>
                        <p className="text-xs font-semibold text-cockpit-heading">{formatEuro(dTTC)}</p>
                        <div className="mt-1 flex items-center gap-1 justify-end">
                          <span className="text-[9px] text-cockpit-secondary">SP</span>
                          <StockBadge available={getWhAvailable(decl.stock_by_warehouse, WH_SP)} byWh={decl.stock_by_warehouse} />
                          <span className="text-[9px] text-cockpit-secondary ml-1">BO</span>
                          <StockBadge available={getWhAvailable(decl.stock_by_warehouse, WH_BO)} byWh={decl.stock_by_warehouse} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
            })
          ) : (
            <div className="py-12 text-center text-cockpit-secondary text-sm">
              Aucun produit trouvé
            </div>
          )}
        </div>

        {/* Pagination + Footer */}
        <div className="px-4 lg:px-6 py-3 border-t border-cockpit flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-cockpit-secondary">
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, displayRows.length)} sur {displayRows.length} ligne{displayRows.length > 1 ? "s" : ""}
            {displayRows.length !== items.length && ` (${items.length} articles)`}
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg border border-cockpit hover:bg-cockpit-dark disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 7) {
                  pageNum = i + 1;
                } else if (page <= 4) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 3) {
                  pageNum = totalPages - 6 + i;
                } else {
                  pageNum = page - 3 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                      page === pageNum
                        ? "text-white"
                        : "text-cockpit-secondary hover:bg-cockpit-dark border border-cockpit"
                    }`}
                    style={page === pageNum ? { backgroundColor: "var(--color-active, #4C9DB0)" } : undefined}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg border border-cockpit hover:bg-cockpit-dark disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Floating Print Bar */}
      {totalChecked > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 animate-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center gap-4 bg-white rounded-2xl shadow-2xl px-5 py-3 border border-gray-200">
            {/* Mini grid: 3×8 = 24 positions */}
            <div className="flex flex-col gap-1">
              <p className="text-[10px] text-gray-400 leading-none">
                Départ : position <span className="font-semibold text-gray-600">{labelStartPos + 1}</span>
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 14px)", gap: "2px" }}>
                {Array.from({ length: 24 }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setLabelStartPos(i)}
                    title={`Commencer à la position ${i + 1}`}
                    style={{
                      width: 14,
                      height: 10,
                      borderRadius: 2,
                      border: i === labelStartPos
                        ? "1.5px solid var(--color-active, #4C9DB0)"
                        : "1px solid #e5e7eb",
                      backgroundColor: i < labelStartPos
                        ? "#e5e7eb"
                        : i === labelStartPos
                          ? "var(--color-active, #4C9DB0)"
                          : "white",
                      cursor: "pointer",
                      transition: "all 0.1s",
                      flexShrink: 0,
                    }}
                  />
                ))}
              </div>
              {labelStartPos > 0 && (
                <button
                  onClick={() => setLabelStartPos(0)}
                  className="text-[9px] text-gray-400 hover:text-gray-600 underline leading-none mt-0.5 text-left"
                >
                  Réinitialiser
                </button>
              )}
            </div>
            {/* Divider */}
            <div className="w-px self-stretch bg-gray-200" />
            {/* Print button */}
            <button
              onClick={handlePrintMulti}
              className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95"
              style={{ backgroundColor: "var(--color-active, #4C9DB0)", color: "white" }}
            >
              <Printer className="w-4 h-4" />
              Imprimer {printableLabels.length} étiquette{printableLabels.length > 1 ? "s" : ""}
              {printableLabels.length !== totalChecked && (
                <span className="text-[10px] opacity-80 ml-1">({totalChecked} article{totalChecked > 1 ? "s" : ""})</span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Product Drawer */}
      <ProductDrawer
        item={selectedItem}
        onClose={() => { setSelectedItem(null); setDrawerDeclUrl(undefined); }}
        declinations={selectedItem && !drawerDeclUrl ? declinations[selectedItem.id] || [] : []}
        stockByWarehouse={selectedItem?.stock_by_warehouse ?? null}
        canSeePurchase={canSeePurchase}
        sellsyUrlOverride={drawerDeclUrl}
      />
    </div>
  );
}
