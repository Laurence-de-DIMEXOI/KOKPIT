"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
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
import { KPICard } from "@/components/dashboard/kpi-card";
import { ProductDrawer } from "@/components/catalogue/product-drawer";
import { getSellsyDeclUrl } from "@/lib/sellsy-urls";

interface Declination {
  id: number;
  reference: string;
  name: string | null;
  reference_price_taxes_exc: string | null;
  purchase_amount: string | null;
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
}

type SortKey = "name" | "reference" | "price_ht" | "price_ttc" | "type";
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
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [selectedItem, setSelectedItem] = useState<SellsyItem | null>(null);
  const [drawerDeclUrl, setDrawerDeclUrl] = useState<string | undefined>(undefined);
  const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set());
  const [checkedDeclIds, setCheckedDeclIds] = useState<Set<number>>(new Set());
  const [page, setPage] = useState(1);

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1); // reset page on search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [typeFilter, declFilter, priceFilter]);

  // Fetch items only (fast — no declinations)
  const fetchItems = async (fresh = false) => {
    setRefreshing(true);
    try {
      const res = await fetch(`/api/sellsy/items?all=true${fresh ? "&fresh=true" : ""}`);
      const data = await res.json();
      if (data.success) {
        setItems(data.items || []);
        if (fresh) {
          setDeclinations({});
        }
      }
    } catch (error) {
      console.error("Erreur chargement catalogue:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Lazy-load declinations for a single item
  const fetchDeclinations = async (itemId: number) => {
    if (declinations[itemId]) return;
    setLoadingDecl((prev) => new Set(prev).add(itemId));
    try {
      const res = await fetch(`/api/sellsy/items/${itemId}/declinations`);
      const data = await res.json();
      if (data.success) {
        setDeclinations((prev) => ({ ...prev, [itemId]: data.declinations || [] }));
      }
    } catch (error) {
      console.error(`Erreur déclinaisons item ${itemId}:`, error);
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
  }, [items, declinations, search, typeFilter, declFilter, priceFilter, sortKey, sortDir]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  );

  // Auto-fetch declinations for items on current page
  useEffect(() => {
    const declined = paginated.filter((i) => i.is_declined && !declinations[i.id] && !loadingDecl.has(i.id));
    declined.forEach((i) => fetchDeclinations(i.id));
  }, [paginated]); // eslint-disable-line react-hooks/exhaustive-deps


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
    const dTTC = dHT * tvaMultiplier;
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
  const toggleCheck = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleCheckDecl = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setCheckedDeclIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allPageChecked = paginated.length > 0 && paginated.every((i) => {
    const decls = declinations[i.id];
    if (i.is_declined && decls && decls.length > 0) {
      return decls.every((d) => checkedDeclIds.has(d.id));
    }
    return checkedIds.has(i.id);
  });

  const toggleAll = () => {
    if (allPageChecked) {
      setCheckedIds((prev) => {
        const next = new Set(prev);
        paginated.forEach((i) => {
          if (!i.is_declined || !declinations[i.id]?.length) next.delete(i.id);
        });
        return next;
      });
      setCheckedDeclIds((prev) => {
        const next = new Set(prev);
        paginated.forEach((i) => {
          (declinations[i.id] || []).forEach((d) => next.delete(d.id));
        });
        return next;
      });
    } else {
      paginated.forEach((i) => {
        const decls = declinations[i.id];
        if (i.is_declined && decls && decls.length > 0) {
          setCheckedDeclIds((prev) => {
            const next = new Set(prev);
            decls.forEach((d) => next.add(d.id));
            return next;
          });
        } else {
          setCheckedIds((prev) => new Set(prev).add(i.id));
        }
      });
    }
  };

  const totalChecked = checkedIds.size + checkedDeclIds.size;

  const printableLabels = useMemo(() => {
    const labels: Array<{ reference: string; name: string; priceTTC: string }> = [];
    for (const item of items) {
      if (checkedIds.has(item.id)) {
        labels.push({
          reference: item.reference || "",
          name: item.name || item.reference || `#${item.id}`,
          priceTTC: item.reference_price_taxes_inc || "0",
        });
      }
    }
    for (const decls of Object.values(declinations)) {
      for (const decl of decls) {
        if (checkedDeclIds.has(decl.id)) {
          labels.push({
            reference: decl.reference || "",
            name: decl.name || decl.reference || "",
            priceTTC: decl.reference_price_taxes_exc || "0",
          });
        }
      }
    }
    return labels;
  }, [items, declinations, checkedIds, checkedDeclIds]);

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

    const pages: string[] = [];
    for (let p = 0; p < Math.ceil(printableLabels.length / PER_PAGE); p++) {
      const pageLabels = printableLabels.slice(p * PER_PAGE, (p + 1) * PER_PAGE);
      let gridCells = "";
      for (let i = 0; i < PER_PAGE; i++) {
        const label = pageLabels[i];
        if (label) {
          gridCells += `
            <div class="label">
              <div class="brand">DIMEXOI</div>
              <div class="name">${(label.name).replace(/"/g, "&quot;")}</div>
              <div class="ref">Réf : ${label.reference || "—"}</div>
              <div class="price-ttc">${fmtEuro(label.priceTTC)}</div>
              <div class="barcode-container" id="bc-${p}-${i}"></div>
            </div>`;
        } else {
          gridCells += `<div class="label empty"></div>`;
        }
      }
      pages.push(`<div class="page"><div class="grid">${gridCells}</div></div>`);
    }

    const barcodeScripts = printableLabels
      .map((label, idx) => {
        const pageIdx = Math.floor(idx / PER_PAGE);
        const cellIdx = idx % PER_PAGE;
        return `
        try {
          var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
          document.getElementById("bc-${pageIdx}-${cellIdx}").appendChild(svg);
          JsBarcode(svg, "${(label.reference).replace(/"/g, '\\"')}", {
            format: "CODE128", width: 1.2, height: 16, displayValue: true,
            fontSize: 7, margin: 1, background: "transparent", lineColor: "#1F2937",
          });
        } catch(e) {
          var el = document.getElementById("bc-${pageIdx}-${cellIdx}");
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
  }, [printableLabels]);

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
          <p className="text-cockpit-secondary text-sm">
            {filtered.length} produit{filtered.length > 1 ? "s" : ""} sur {items.length}
            {totalDeclined > 0 && <span className="ml-1">({totalDeclined} avec déclinaisons)</span>}
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

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KPICard title="Total articles" value={kpis.total} icon={<Package className="w-7 h-7" />} bgColor="bg-cockpit-yellow" />
        <KPICard title="Produits" value={kpis.products} icon={<Package className="w-7 h-7" />} bgColor="bg-cockpit-info" />
        <KPICard title="Services" value={kpis.services} icon={<Tag className="w-7 h-7" />} bgColor="bg-cockpit-success" />
        <KPICard title="Avec déclinaisons" value={kpis.declined} icon={<Layers className="w-7 h-7" />} bgColor="bg-purple-500" />
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
          {/* Reset */}
          {(typeFilter !== "ALL" || declFilter !== "ALL" || priceFilter !== "ALL" || search) && (
            <button
              onClick={() => { setTypeFilter("ALL"); setDeclFilter("ALL"); setPriceFilter("ALL"); setSearchInput(""); setSearch(""); }}
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
                {canSeePurchase && (
                  <th className="px-3 py-3 text-right text-xs font-semibold text-cockpit-heading hidden lg:table-cell">
                    ACHAT / MARGE
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-cockpit">
              {paginated.length > 0 ? (
                paginated.map((item) => {
                  const priceHT = parseFloat(item.reference_price_taxes_exc || "0");
                  const priceTTC = parseFloat(item.reference_price_taxes_inc || "0");
                  const purchasePrice = parseFloat(item.purchase_amount || "0");
                  const margin = priceHT > 0 && purchasePrice > 0 ? ((priceHT - purchasePrice) / priceHT * 100) : null;
                  const decls = declinations[item.id] || [];
                  const hasDecls = item.is_declined;
                  const isDeclLoading = loadingDecl.has(item.id);
                  const showParent = !hasDecls || decls.length === 0;

                  return (
                    <React.Fragment key={item.id}>
                      {/* Parent row — hidden when declinations are loaded */}
                      {showParent && (
                        <tr className={`hover:bg-cockpit-dark transition-colors cursor-pointer ${checkedIds.has(item.id) ? "bg-[var(--color-active-light,rgba(14,105,115,0.06))]" : ""}`} onClick={() => setSelectedItem(item)}>
                          <td className="pl-4 pr-1 py-3 w-8" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={checkedIds.has(item.id)}
                              onChange={() => {}}
                              onClick={(e) => toggleCheck(item.id, e)}
                              className="w-4 h-4 rounded border-cockpit accent-[var(--color-active,#4C9DB0)] cursor-pointer"
                            />
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
                            <span className="text-sm font-semibold text-cockpit-heading">
                              {formatEuro(priceHT)}
                            </span>
                          </td>
                          <td className="px-4 lg:px-6 py-3 text-right">
                            <span className="text-sm text-cockpit-primary">
                              {formatEuro(priceTTC)}
                            </span>
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
                      {/* Declination rows — each with its own checkbox + drawer */}
                      {hasDecls && decls.map((decl, dIdx) => {
                        const dHT = parseFloat(decl.reference_price_taxes_exc || "0") || priceHT;
                        const tvaMultiplier = priceHT > 0 && priceTTC > priceHT ? priceTTC / priceHT : 1.085;
                        const dTTC = dHT * tvaMultiplier;
                        const dPurchRaw = parseFloat(decl.purchase_amount || "0");
                        const dPurch = dPurchRaw > 0 ? dPurchRaw : purchasePrice;
                        const dMargin = dHT > 0 && dPurch > 0 ? ((dHT - dPurch) / dHT * 100) : null;
                        return (
                          <tr key={`decl-${decl.id}`} className={`hover:bg-cockpit-dark/50 transition-colors cursor-pointer ${checkedDeclIds.has(decl.id) ? "bg-[var(--color-active-light,rgba(14,105,115,0.06))]" : ""}`} onClick={() => openDeclDrawer(decl, item)}>
                            <td className="pl-4 pr-1 py-2 w-8" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={checkedDeclIds.has(decl.id)}
                                onChange={() => {}}
                                onClick={(e) => toggleCheckDecl(decl.id, e)}
                                className="w-4 h-4 rounded border-cockpit accent-purple-500 cursor-pointer"
                              />
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
                                {dIdx === 0 && (
                                  <p className="text-[9px] text-cockpit-secondary mt-0.5">
                                    {item.name || item.reference}
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              <span className="text-[9px] text-purple-400 font-medium bg-purple-400/10 px-1.5 py-0.5 rounded">Déclinaison</span>
                            </td>
                            <td className="px-4 lg:px-6 py-2 text-right">
                              <span className="text-xs font-semibold text-cockpit-heading">
                                {formatEuro(dHT)}
                              </span>
                            </td>
                            <td className="px-4 lg:px-6 py-2 text-right">
                              <span className="text-xs text-cockpit-primary">
                                {formatEuro(dTTC)}
                              </span>
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
                      })}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={canSeePurchase ? 8 : 7} className="px-4 py-12 text-center text-cockpit-secondary">
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
          {paginated.length > 0 ? (
            paginated.map((item) => {
              const priceHT = parseFloat(item.reference_price_taxes_exc || "0");
              const priceTTC = parseFloat(item.reference_price_taxes_inc || "0");
              const decls = declinations[item.id] || [];
              const hasDecls = item.is_declined;
              const showParent = !hasDecls || decls.length === 0;

              return (
                <div key={item.id}>
                  {/* Parent — hidden when declinations loaded */}
                  {showParent && (
                    <div className={`p-4 hover:bg-cockpit-dark transition-colors cursor-pointer ${checkedIds.has(item.id) ? "bg-[var(--color-active-light,rgba(14,105,115,0.06))]" : ""}`} onClick={() => setSelectedItem(item)}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-shrink-0 pt-0.5 flex items-center gap-1.5">
                          <div onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={checkedIds.has(item.id)}
                              onChange={() => {}}
                              onClick={(e) => toggleCheck(item.id, e)}
                              className="w-4 h-4 rounded border-cockpit accent-[var(--color-active,#4C9DB0)] cursor-pointer"
                            />
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
                          <p className="text-sm font-bold text-cockpit-heading">{formatEuro(priceHT)}</p>
                          <p className="text-[10px] text-cockpit-secondary">TTC: {formatEuro(priceTTC)}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Declination rows with checkboxes */}
                  {hasDecls && decls.length > 0 && (
                    <div className="divide-y divide-cockpit/50">
                      {decls.map((decl, dIdx) => {
                        const dHT = parseFloat(decl.reference_price_taxes_exc || "0") || priceHT;
                        const tvaMultiplier = priceHT > 0 && priceTTC > priceHT ? priceTTC / priceHT : 1.085;
                        const dTTC = dHT * tvaMultiplier;
                        return (
                          <div
                            key={decl.id}
                            className={`p-4 hover:bg-cockpit-dark/50 transition-colors cursor-pointer ${checkedDeclIds.has(decl.id) ? "bg-[var(--color-active-light,rgba(14,105,115,0.06))]" : ""}`}
                            onClick={() => openDeclDrawer(decl, item)}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-shrink-0 pt-0.5" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={checkedDeclIds.has(decl.id)}
                                  onChange={() => {}}
                                  onClick={(e) => toggleCheckDecl(decl.id, e)}
                                  className="w-4 h-4 rounded border-cockpit accent-purple-500 cursor-pointer"
                                />
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
                                {dIdx === 0 && (
                                  <p className="text-[9px] text-cockpit-secondary mt-0.5">{item.name || item.reference}</p>
                                )}
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="text-xs font-semibold text-cockpit-heading">{formatEuro(dHT)}</p>
                                <p className="text-[10px] text-cockpit-secondary">TTC: {formatEuro(dTTC)}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
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
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} sur {filtered.length} article{filtered.length > 1 ? "s" : ""}
            {filtered.length !== items.length && ` (${items.length} total)`}
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

      {/* Floating Print Button */}
      {totalChecked > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 animate-in slide-in-from-bottom-4 duration-200">
          <button
            onClick={handlePrintMulti}
            className="flex items-center gap-2.5 px-6 py-3 rounded-full shadow-xl text-sm font-bold transition-all hover:scale-105 active:scale-95"
            style={{ backgroundColor: "var(--color-active, #4C9DB0)", color: "white" }}
          >
            <Printer className="w-4 h-4" />
            Imprimer {totalChecked} étiquette{totalChecked > 1 ? "s" : ""}
          </button>
        </div>
      )}

      {/* Product Drawer */}
      <ProductDrawer
        item={selectedItem}
        onClose={() => { setSelectedItem(null); setDrawerDeclUrl(undefined); }}
        declinations={selectedItem && !drawerDeclUrl ? declinations[selectedItem.id] || [] : []}
        canSeePurchase={canSeePurchase}
        sellsyUrlOverride={drawerDeclUrl}
      />
    </div>
  );
}
