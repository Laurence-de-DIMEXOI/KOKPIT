"use client";

import { createPortal } from "react-dom";
import { X, Package, Tag, Euro, Hash, Calendar, ExternalLink, Barcode, Warehouse, Layers } from "lucide-react";
import { getSellsyUrl } from "@/lib/sellsy-urls";
import { BarcodeLabel } from "./barcode-label";

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

interface Declination {
  id: number;
  reference: string;
  name: string | null;
  reference_price_taxes_exc: string | null;
  purchase_amount: string | null;
}

interface StockEntry {
  warehouseId: string;
  warehouseLabel: string;
  quantity: number;
  booked: number;
  available: number;
  isDefault: boolean;
}

interface ItemStock {
  stock: StockEntry[];
  totalAvailable: number;
}

interface ProductDrawerProps {
  item: SellsyItem | null;
  onClose: () => void;
  declinations?: Declination[];
  stock?: ItemStock | null;
  canSeePurchase?: boolean;
  sellsyUrlOverride?: string;
}

const formatEuro = (val: string | number | null | undefined) => {
  if (val === null || val === undefined) return "—";
  const num = typeof val === "string" ? parseFloat(val) : val;
  if (!num && num !== 0) return "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

export function ProductDrawer({ item, onClose, declinations = [], stock, canSeePurchase = false, sellsyUrlOverride }: ProductDrawerProps) {
  if (!item) return null;

  const priceHT = parseFloat(item.reference_price_taxes_exc || "0");
  const priceTTC = parseFloat(item.reference_price_taxes_inc || "0");
  const purchasePrice = parseFloat(item.purchase_amount || "0");
  const margin = priceHT > 0 && purchasePrice > 0 ? ((priceHT - purchasePrice) / priceHT * 100) : null;
  const tvaRate = priceHT > 0 && priceTTC > priceHT ? ((priceTTC - priceHT) / priceHT * 100) : 8.5;

  const sellsyUrl = sellsyUrlOverride || getSellsyUrl('product', item.id);

  const content = (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-[9998]" onClick={onClose} />

      {/* Drawer */}
      <div
        className="fixed right-0 top-0 h-full w-full sm:w-[480px] bg-white z-[9999] flex flex-col shadow-2xl"
        style={{ animation: "slideIn 0.25s ease-out" }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#F5F6F7] border-b border-[#E8EAED] px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
              item.type === "product" ? "bg-[#03C3EC]/10" : "bg-[#FFAB00]/10"
            }`}>
              <Package className={`w-5 h-5 ${
                item.type === "product" ? "text-[#03C3EC]" : "text-[#FFAB00]"
              }`} />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-[#1F2937] truncate">
                {item.name || item.reference || `#${item.id}`}
              </h2>
              <div className="flex items-center gap-2">
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                  item.type === "product"
                    ? "bg-[#03C3EC]/10 text-[#03C3EC]"
                    : "bg-[#FFAB00]/10 text-[#FFAB00]"
                }`}>
                  {item.type === "product" ? "Produit" : "Service"}
                </span>
                {item.is_declined && declinations.length > 0 && (
                  <span className="text-[9px] font-semibold text-purple-500 bg-purple-100 px-1.5 py-0.5 rounded">
                    {declinations.length} déclinaison{declinations.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white transition-colors text-[#8592A3]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Référence & Sellsy link */}
          <div className="px-6 py-4 border-b border-[#E8EAED] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-[#8592A3]" />
              <span className="text-sm font-mono text-[#03C3EC] bg-[#03C3EC]/10 px-2 py-0.5 rounded">
                {item.reference || "—"}
              </span>
            </div>
            <a
              href={sellsyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-[#03C3EC] hover:text-[#03C3EC]/80 transition-colors font-medium"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Voir sur Sellsy
            </a>
          </div>

          {/* Description */}
          {item.description && item.description.trim() && (
            <div className="px-6 py-4 border-b border-[#E8EAED]">
              <p className="text-sm text-[#32475C] bg-[#F5F6F7] p-3 rounded-lg whitespace-pre-wrap border border-[#E8EAED]">
                {item.description}
              </p>
            </div>
          )}

          {/* Prix */}
          <div className="px-6 py-4 border-b border-[#E8EAED]">
            <h3 className="text-xs font-semibold text-[#8592A3] uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Euro className="w-3.5 h-3.5" />
              Tarification
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#F5F6F7] border border-[#E8EAED] p-4 rounded-lg">
                <p className="text-[10px] text-[#8592A3] mb-1 uppercase">Prix HT</p>
                <p className="text-xl font-bold text-[#1F2937]">{formatEuro(priceHT)}</p>
              </div>
              <div className="bg-[#F5F6F7] border border-[#E8EAED] p-4 rounded-lg">
                <p className="text-[10px] text-[#8592A3] mb-1 uppercase">Prix TTC</p>
                <p className="text-xl font-bold text-[#1F2937]">{formatEuro(priceTTC)}</p>
                {tvaRate !== null && tvaRate > 0 && (
                  <p className="text-[10px] text-[#8592A3] mt-0.5">TVA: {tvaRate.toFixed(1)}%</p>
                )}
              </div>
            </div>
          </div>

          {/* Stock par entrepôt */}
          {stock && (
            <div className="px-6 py-4 border-b border-[#E8EAED]">
              <h3 className="text-xs font-semibold text-[#8592A3] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Warehouse className="w-3.5 h-3.5" />
                Stock — {stock.totalAvailable} disponible{stock.totalAvailable !== 1 ? "s" : ""}
              </h3>
              <div className="space-y-2">
                {stock.stock.map((s) => (
                  <div key={s.warehouseId} className="flex items-center justify-between bg-[#F5F6F7] border border-[#E8EAED] px-4 py-2.5 rounded-lg">
                    <div className="flex items-center gap-2">
                      {s.isDefault && <span className="text-[8px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-semibold">Défaut</span>}
                      <span className="text-xs text-[#32475C]">{s.warehouseLabel}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className={`font-bold ${s.available > 0 ? "text-[#71DD37]" : "text-[#FF3E1D]"}`}>
                        {s.available}
                      </span>
                      {s.booked > 0 && (
                        <span className="text-[#FFAB00] text-[10px]">({s.booked} rés.)</span>
                      )}
                    </div>
                  </div>
                ))}
                {stock.stock.length === 0 && (
                  <p className="text-xs text-[#8592A3] text-center py-2">Aucun entrepôt</p>
                )}
              </div>
            </div>
          )}

          {/* Déclinaisons */}
          {declinations.length > 0 && (
            <div className="px-6 py-4 border-b border-[#E8EAED]">
              <h3 className="text-xs font-semibold text-[#8592A3] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                Déclinaisons ({declinations.length})
              </h3>
              <div className="space-y-1.5">
                {declinations.map((d) => {
                  const dHT = parseFloat(d.reference_price_taxes_exc || "0");
                  const dPurch = parseFloat(d.purchase_amount || "0");
                  const dMargin = dHT > 0 && dPurch > 0 ? ((dHT - dPurch) / dHT * 100) : null;
                  return (
                    <div key={d.id} className="flex items-center justify-between bg-[#F5F6F7] border border-[#E8EAED] px-4 py-2.5 rounded-lg">
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-mono text-purple-500 bg-purple-100 px-1.5 py-0.5 rounded">
                          {d.reference}
                        </span>
                        {d.name && d.name !== d.reference && (
                          <p className="text-xs text-[#32475C] mt-0.5 truncate">{d.name}</p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0 ml-3">
                        <p className="text-xs font-semibold text-[#1F2937]">{dHT > 0 ? formatEuro(dHT) : "—"}</p>
                        {canSeePurchase && dMargin !== null && dMargin > 0 && (
                          <p className={`text-[9px] ${dMargin > 30 ? "text-[#71DD37]" : dMargin > 15 ? "text-[#FFAB00]" : "text-[#FF3E1D]"}`}>
                            Marge {dMargin.toFixed(0)}%
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Achat & Marge — uniquement pour les rôles autorisés */}
          {canSeePurchase && purchasePrice > 0 && (
            <div className="px-6 py-4 border-b border-[#E8EAED]">
              <h3 className="text-xs font-semibold text-[#8592A3] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" />
                Achat & Marge
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#F5F6F7] border border-[#E8EAED] p-4 rounded-lg">
                  <p className="text-[10px] text-[#8592A3] mb-1 uppercase">Prix d&apos;achat</p>
                  <p className="text-lg font-semibold text-[#32475C]">{formatEuro(purchasePrice)}</p>
                </div>
                <div className="bg-[#F5F6F7] border border-[#E8EAED] p-4 rounded-lg">
                  <p className="text-[10px] text-[#8592A3] mb-1 uppercase">Marge brute</p>
                  {margin !== null ? (
                    <>
                      <p className={`text-lg font-semibold ${margin > 30 ? "text-[#71DD37]" : margin > 15 ? "text-[#FFAB00]" : "text-[#FF3E1D]"}`}>
                        {margin.toFixed(1)}%
                      </p>
                      <p className="text-[10px] text-[#8592A3] mt-0.5">
                        {formatEuro(priceHT - purchasePrice)} / unité
                      </p>
                    </>
                  ) : (
                    <p className="text-lg text-[#8592A3]">—</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="px-6 py-4 border-b border-[#E8EAED]">
            <h3 className="text-xs font-semibold text-[#8592A3] uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Dates
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#F5F6F7] border border-[#E8EAED] p-3 rounded-lg">
                <p className="text-[10px] text-[#8592A3] mb-1 uppercase">Créé le</p>
                <p className="text-sm text-[#32475C]">
                  {item.created ? new Date(item.created).toLocaleDateString("fr-FR") : "—"}
                </p>
              </div>
              <div className="bg-[#F5F6F7] border border-[#E8EAED] p-3 rounded-lg">
                <p className="text-[10px] text-[#8592A3] mb-1 uppercase">Modifié le</p>
                <p className="text-sm text-[#32475C]">
                  {item.updated ? new Date(item.updated).toLocaleDateString("fr-FR") : "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Code-barres & Étiquette */}
          {item.reference && (
            <div className="px-6 py-4 border-b border-[#E8EAED]">
              <h3 className="text-xs font-semibold text-[#8592A3] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Barcode className="w-3.5 h-3.5" />
                Code-barres & Étiquette
              </h3>
              <BarcodeLabel
                reference={item.reference}
                name={item.name || item.reference}
                priceHT={priceHT}
                priceTTC={priceTTC}
                description={item.description}
              />
            </div>
          )}

          {/* Métadonnées */}
          <div className="px-6 py-4">
            <div className="text-xs text-[#8592A3] space-y-1">
              <p>ID Sellsy: {item.id}</p>
              <p>Catégorie ID: {item.category_id || "—"}</p>
              <p>Devise: {item.currency || "EUR"}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 p-4 border-t border-[#E8EAED] bg-[#F5F6F7]">
          <a
            href={sellsyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center bg-[#F4B400] text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity text-sm"
          >
            Ouvrir dans Sellsy
          </a>
        </div>
      </div>
    </>
  );

  if (typeof document !== "undefined") {
    return createPortal(content, document.body);
  }
  return content;
}
