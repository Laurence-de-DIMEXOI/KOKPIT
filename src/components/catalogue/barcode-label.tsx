"use client";

import { useEffect, useRef, useCallback } from "react";
import { Printer } from "lucide-react";

interface BarcodeLabelProps {
  reference: string;
  name: string;
  priceHT: number;
  priceTTC: number;
  description?: string;
}

export function BarcodeLabel({ reference, name, priceHT, priceTTC, description }: BarcodeLabelProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !reference) return;

    // Dynamic import to avoid SSR issues
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

  const handlePrint = useCallback(() => {
    // Create a print-only window with the label
    const printWindow = window.open("", "_blank", "width=400,height=300");
    if (!printWindow) return;

    const labelHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Étiquette ${reference}</title>
        <style>
          @page {
            size: 62mm 100mm;
            margin: 3mm;
          }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            padding: 4mm;
            width: 56mm;
          }
          .label {
            text-align: center;
            border: 1px solid #ccc;
            border-radius: 3mm;
            padding: 3mm;
          }
          .brand {
            font-size: 7pt;
            color: #8592A3;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 2mm;
          }
          .name {
            font-size: 10pt;
            font-weight: bold;
            color: #1F2937;
            margin-bottom: 1mm;
            line-height: 1.2;
            max-height: 2.4em;
            overflow: hidden;
          }
          .ref {
            font-family: monospace;
            font-size: 8pt;
            color: #03C3EC;
            background: #f0f9ff;
            display: inline-block;
            padding: 0.5mm 2mm;
            border-radius: 1mm;
            margin-bottom: 2mm;
          }
          .price-ttc {
            font-size: 16pt;
            font-weight: bold;
            color: #1F2937;
            margin: 2mm 0;
          }
          .price-ht {
            font-size: 8pt;
            color: #8592A3;
            margin-bottom: 2mm;
          }
          .barcode svg {
            width: 100%;
            height: auto;
          }
          .barcode-container {
            margin-top: 2mm;
          }
          @media print {
            body { padding: 0; }
            .label { border: none; }
          }
        </style>
      </head>
      <body>
        <div class="label">
          <div class="brand">DIMEXOI</div>
          <div class="name">${name.replace(/"/g, "&quot;")}</div>
          <div class="ref">${reference}</div>
          <div class="price-ttc">${formatEuro(priceTTC)}</div>
          <div class="price-ht">${formatEuro(priceHT)} HT</div>
          <div class="barcode-container" id="barcode-target"></div>
        </div>
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3/dist/JsBarcode.all.min.js"><\/script>
        <script>
          try {
            var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            document.getElementById("barcode-target").appendChild(svg);
            JsBarcode(svg, "${reference.replace(/"/g, '\\"')}", {
              format: "CODE128",
              width: 1.5,
              height: 35,
              displayValue: true,
              fontSize: 10,
              margin: 2,
              background: "transparent",
              lineColor: "#1F2937",
            });
            setTimeout(function() { window.print(); }, 300);
          } catch(e) {
            document.getElementById("barcode-target").textContent = "${reference}";
            setTimeout(function() { window.print(); }, 300);
          }
        <\/script>
      </body>
      </html>
    `;

    printWindow.document.write(labelHtml);
    printWindow.document.close();
  }, [reference, name, priceHT, priceTTC]);

  return (
    <div className="space-y-3">
      {/* Barcode preview */}
      <div className="bg-white border border-[#E8EAED] rounded-lg p-4 flex flex-col items-center">
        <svg ref={svgRef} className="max-w-full" />
      </div>

      {/* Print button */}
      <button
        onClick={handlePrint}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[#E8EAED] text-[#32475C] text-sm font-medium hover:bg-[#F5F6F7] transition-colors"
      >
        <Printer className="w-4 h-4" />
        Imprimer l&apos;étiquette
      </button>
    </div>
  );
}
