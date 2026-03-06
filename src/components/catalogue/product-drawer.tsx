"use client";

import { X, Package, Tag, Euro, Hash, Calendar, Info, ExternalLink } from "lucide-react";

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

interface ProductDrawerProps {
  item: SellsyItem | null;
  onClose: () => void;
}

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

export function ProductDrawer({ item, onClose }: ProductDrawerProps) {
  if (!item) return null;

  const priceHT = parseFloat(item.reference_price_taxes_exc || "0");
  const priceTTC = parseFloat(item.reference_price_taxes_inc || "0");
  const purchasePrice = parseFloat(item.purchase_amount || "0");
  const margin = priceHT > 0 && purchasePrice > 0 ? ((priceHT - purchasePrice) / priceHT * 100) : null;
  const tvaRate = priceHT > 0 ? ((priceTTC - priceHT) / priceHT * 100) : null;

  const sellsyUrl = `https://go.sellsy.com/item/${item.id}`;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full sm:w-[480px] bg-[#1a1d23] border-l border-cockpit z-50 overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-[#1a1d23] border-b border-cockpit px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
              item.type === "product" ? "bg-cockpit-info/10" : "bg-cockpit-warning/10"
            }`}>
              <Package className={`w-5 h-5 ${
                item.type === "product" ? "text-cockpit-info" : "text-cockpit-warning"
              }`} />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-cockpit-heading truncate">
                {item.name || item.reference || `#${item.id}`}
              </h2>
              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                item.type === "product"
                  ? "bg-cockpit-info/10 text-cockpit-info"
                  : "bg-cockpit-warning/10 text-cockpit-warning"
              }`}>
                {item.type === "product" ? "Produit" : "Service"}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-cockpit-card transition-colors text-cockpit-secondary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Référence & Sellsy link */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-cockpit-secondary" />
              <span className="text-sm font-mono text-cockpit-info bg-cockpit-info/10 px-2 py-0.5 rounded">
                {item.reference || "—"}
              </span>
            </div>
            <a
              href={sellsyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-cockpit-info hover:text-cockpit-info/80 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Voir sur Sellsy
            </a>
          </div>

          {/* Description */}
          {item.description && (
            <div>
              <label className="text-xs font-semibold text-cockpit-secondary mb-2 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                Description
              </label>
              <p className="text-sm text-cockpit-primary bg-cockpit-card p-3 rounded-lg whitespace-pre-wrap border border-cockpit">
                {item.description}
              </p>
            </div>
          )}

          {/* Prix */}
          <div>
            <label className="text-xs font-semibold text-cockpit-secondary mb-3 flex items-center gap-1.5">
              <Euro className="w-3.5 h-3.5" />
              Tarification
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-cockpit-card border border-cockpit p-4 rounded-lg">
                <p className="text-[10px] text-cockpit-secondary mb-1">PRIX HT</p>
                <p className="text-xl font-bold text-cockpit-heading">{formatEuro(priceHT)}</p>
              </div>
              <div className="bg-cockpit-card border border-cockpit p-4 rounded-lg">
                <p className="text-[10px] text-cockpit-secondary mb-1">PRIX TTC</p>
                <p className="text-xl font-bold text-cockpit-heading">{formatEuro(priceTTC)}</p>
                {tvaRate !== null && tvaRate > 0 && (
                  <p className="text-[10px] text-cockpit-secondary mt-0.5">TVA: {tvaRate.toFixed(1)}%</p>
                )}
              </div>
            </div>
          </div>

          {/* Achat & Marge */}
          {purchasePrice > 0 && (
            <div>
              <label className="text-xs font-semibold text-cockpit-secondary mb-3 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" />
                Achat & Marge
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-cockpit-card border border-cockpit p-4 rounded-lg">
                  <p className="text-[10px] text-cockpit-secondary mb-1">PRIX D&apos;ACHAT</p>
                  <p className="text-lg font-semibold text-cockpit-primary">{formatEuro(purchasePrice)}</p>
                </div>
                <div className="bg-cockpit-card border border-cockpit p-4 rounded-lg">
                  <p className="text-[10px] text-cockpit-secondary mb-1">MARGE BRUTE</p>
                  {margin !== null ? (
                    <>
                      <p className={`text-lg font-semibold ${margin > 30 ? "text-cockpit-success" : margin > 15 ? "text-cockpit-warning" : "text-red-400"}`}>
                        {margin.toFixed(1)}%
                      </p>
                      <p className="text-[10px] text-cockpit-secondary mt-0.5">
                        {formatEuro(priceHT - purchasePrice)} / unité
                      </p>
                    </>
                  ) : (
                    <p className="text-lg text-cockpit-secondary">—</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Dates */}
          <div>
            <label className="text-xs font-semibold text-cockpit-secondary mb-3 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Dates
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-cockpit-card border border-cockpit p-3 rounded-lg">
                <p className="text-[10px] text-cockpit-secondary mb-1">CRÉÉ LE</p>
                <p className="text-sm text-cockpit-primary">
                  {item.created ? new Date(item.created).toLocaleDateString("fr-FR") : "—"}
                </p>
              </div>
              <div className="bg-cockpit-card border border-cockpit p-3 rounded-lg">
                <p className="text-[10px] text-cockpit-secondary mb-1">MODIFIÉ LE</p>
                <p className="text-sm text-cockpit-primary">
                  {item.updated ? new Date(item.updated).toLocaleDateString("fr-FR") : "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Métadonnées */}
          <div className="text-xs text-cockpit-secondary border-t border-cockpit pt-4 space-y-1">
            <p>ID Sellsy: {item.id}</p>
            <p>Catégorie ID: {item.category_id || "—"}</p>
            <p>Devise: {item.currency || "EUR"}</p>
          </div>
        </div>
      </div>
    </>
  );
}
