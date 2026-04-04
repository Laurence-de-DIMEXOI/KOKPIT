"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { Printer } from "lucide-react";

interface BarcodeLabelProps {
  reference: string;
  name: string;
  priceHT: number;
  priceTTC: number;
  description?: string;
}

export function BarcodeLabel({ reference, name, priceTTC }: BarcodeLabelProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [labelStartPos, setLabelStartPos] = useState(0);

  useEffect(() => {
    if (!svgRef.current || !reference) return;

    import("jsbarcode").then((JsBarcode) => {
      try {
        JsBarcode.default(svgRef.current!, reference, {
          format: "CODE128",
          width: 2,
          height: 50,
          displayValue: true,
          fontSize: 12,
          margin: 5,
          background: "transparent",
          lineColor: "#1F2937",
        });
      } catch {
        // Invalid barcode value — leave SVG empty
      }
    });
  }, [reference]);

  const formatEuro = (val: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  // Agipa 51259 — 70 x 35 mm — 3 colonnes x 8 lignes = 24/page A4
  const COLS = 3;
  const ROWS = 8;
  const PER_PAGE = COLS * ROWS;
  const PAGE_MARGIN_TOP = 8.5;
  const LABEL_W = 70;
  const LABEL_H = 35;

  const handlePrint = useCallback(() => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    // Build the 24-cell grid with the single label at labelStartPos
    let gridCells = "";
    for (let i = 0; i < PER_PAGE; i++) {
      if (i === labelStartPos) {
        gridCells += `
          <div class="label">
            <div class="brand">DIMEXOI</div>
            <div class="name">${name.replace(/"/g, "&quot;")}</div>
            <div class="ref">Réf : ${reference}</div>
            <div class="price-ttc">${formatEuro(priceTTC)}</div>
            <div class="barcode-container" id="bc-0"></div>
          </div>`;
      } else {
        gridCells += `<div class="label empty"></div>`;
      }
    }

    printWindow.document.write(`<!DOCTYPE html>
<html><head><meta charset="utf-8">
<title>Étiquette ${reference}</title>
<style>
@page { size: A4; margin: 0; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f5f6f7; }
.page { width: 210mm; height: 297mm; padding: ${PAGE_MARGIN_TOP}mm 0 0 0; page-break-after: always; background: white; }
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
@media screen { body { padding: 20px; display: flex; flex-direction: column; align-items: center; } .page { border: 1px solid #ccc; border-radius: 4px; } .label:not(.empty) { outline: 1px dashed #e5e7eb; } }
</style></head><body>
<div class="page"><div class="grid">${gridCells}</div></div>
<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3/dist/JsBarcode.all.min.js"><\/script>
<script>
try {
  var svg = document.createElementNS("http://www.w3.org/2000/svg","svg");
  document.getElementById("bc-0").appendChild(svg);
  JsBarcode(svg,"${reference.replace(/"/g, '\\"')}",{format:"CODE128",width:1.2,height:16,displayValue:true,fontSize:7,margin:1,background:"transparent",lineColor:"#1F2937"});
} catch(e) {
  var el=document.getElementById("bc-0"); if(el) el.textContent="${reference.replace(/"/g, '\\"')}";
}
setTimeout(function(){window.print();},500);
<\/script>
</body></html>`);
    printWindow.document.close();
  }, [reference, name, priceTTC, labelStartPos, PER_PAGE, PAGE_MARGIN_TOP, COLS, ROWS, LABEL_W, LABEL_H]);

  return (
    <div className="space-y-3">
      {/* Barcode preview */}
      <div className="bg-white border border-[#E8EAED] rounded-lg p-4 flex flex-col items-center">
        <svg ref={svgRef} className="max-w-full" />
      </div>

      {/* Position selector + print */}
      <div className="bg-[#F5F6F7] border border-[#E8EAED] rounded-lg p-3 flex items-center gap-3">
        {/* Mini grid */}
        <div className="flex flex-col gap-1 flex-shrink-0">
          <p className="text-[10px] text-[#8592A3] leading-none">
            Pos. <span className="font-semibold text-[#32475C]">{labelStartPos + 1}</span> / 24
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 14px)", gap: "2px" }}>
            {Array.from({ length: 24 }, (_, i) => (
              <button
                key={i}
                onClick={() => setLabelStartPos(i)}
                title={`Position ${i + 1}`}
                style={{
                  width: 14,
                  height: 10,
                  borderRadius: 2,
                  border: i === labelStartPos
                    ? "1.5px solid #03C3EC"
                    : "1px solid #e5e7eb",
                  backgroundColor: i < labelStartPos
                    ? "#e5e7eb"
                    : i === labelStartPos
                      ? "#03C3EC"
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
              className="text-[9px] text-[#8592A3] hover:text-[#32475C] underline leading-none mt-0.5 text-left"
            >
              Réinitialiser
            </button>
          )}
        </div>

        {/* Divider */}
        <div className="w-px self-stretch bg-[#E8EAED]" />

        {/* Print button */}
        <button
          onClick={handlePrint}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-white border border-[#E8EAED] text-[#32475C] text-sm font-medium hover:bg-white/80 transition-colors"
        >
          <Printer className="w-4 h-4" />
          Imprimer l&apos;étiquette
        </button>
      </div>
    </div>
  );
}
