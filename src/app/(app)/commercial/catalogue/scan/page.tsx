"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import {
  Camera,
  X,
  Search,
  Package,
  ArrowLeft,
  Loader2,
  ScanBarcode,
} from "lucide-react";
import Link from "next/link";

// ============================================================================
// TYPES
// ============================================================================

interface ProductMatch {
  id: number;
  name: string;
  reference: string;
  prixHT: number;
  prixTTC: number;
  type: string;
}

// ============================================================================
// GRADIENT
// ============================================================================

const COMMERCIAL_GRADIENT = {
  from: "var(--color-active)",
  to: "#FEEB9C",
  shadow: "var(--color-active-border)",
};

// ============================================================================
// PAGE
// ============================================================================

export default function ScanBarcodePage() {
  const router = useRouter();
  const { addToast } = useToast();
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<any>(null);

  const [scanning, setScanning] = useState(false);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState<ProductMatch | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Search product by reference
  const searchProduct = useCallback(
    async (code: string) => {
      setSearching(true);
      setNotFound(false);
      setResult(null);

      try {
        const res = await fetch(`/api/sellsy/items?all=true`);
        if (!res.ok) throw new Error("Erreur API");
        const data = await res.json();
        const items = data.items || data || [];

        // Chercher par référence exacte ou partielle
        const match = items.find(
          (item: any) =>
            item.reference === code ||
            item.reference?.toLowerCase() === code.toLowerCase() ||
            item.reference?.replace(/\s/g, "") === code.replace(/\s/g, "")
        );

        if (match) {
          setResult({
            id: match.id,
            name: match.name || "Sans nom",
            reference: match.reference,
            prixHT: Number(match.reference_price_taxes_exc) || 0,
            prixTTC: Number(match.reference_price_taxes_inc) || 0,
            type: match.type || "product",
          });
          addToast("Produit trouvé !", "success");
        } else {
          setNotFound(true);
          addToast("Aucun produit trouvé pour ce code", "warning");
        }
      } catch {
        addToast("Erreur lors de la recherche", "error");
      } finally {
        setSearching(false);
      }
    },
    [addToast]
  );

  // Start scanner
  const startScanner = useCallback(async () => {
    if (!scannerRef.current) return;
    setCameraError(null);

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode("barcode-reader");
      html5QrCodeRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 280, height: 150 },
          aspectRatio: 1.5,
        },
        (decodedText: string) => {
          // Barcode decoded
          setScannedCode(decodedText);
          setScanning(false);
          scanner.stop().catch(() => {});
          searchProduct(decodedText);
        },
        () => {
          // Scanning in progress (no decode yet)
        }
      );

      setScanning(true);
    } catch (err: any) {
      console.error("Camera error:", err);
      setCameraError(
        err?.message?.includes("NotAllowedError")
          ? "Accès caméra refusé. Autorisez l'accès dans les paramètres de votre navigateur."
          : "Impossible d'accéder à la caméra. Vérifiez les permissions."
      );
    }
  }, [searchProduct]);

  // Stop scanner
  const stopScanner = useCallback(() => {
    if (html5QrCodeRef.current) {
      html5QrCodeRef.current.stop().catch(() => {});
      html5QrCodeRef.current = null;
    }
    setScanning(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const resetScan = () => {
    setScannedCode(null);
    setResult(null);
    setNotFound(false);
    setCameraError(null);
  };

  const formatEuro = (n: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(n);

  return (
    <div className="min-h-screen bg-cockpit-darker p-4 sm:p-6 max-w-lg mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/commercial/catalogue"
          className="p-2 rounded-lg hover:bg-cockpit-dark transition"
        >
          <ArrowLeft className="w-5 h-5 text-cockpit-secondary" />
        </Link>
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${COMMERCIAL_GRADIENT.from}, ${COMMERCIAL_GRADIENT.to})`,
            }}
          >
            <ScanBarcode className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-cockpit-heading">
              Scanner un produit
            </h1>
            <p className="text-xs text-cockpit-secondary">
              Scannez le code-barres avec votre caméra
            </p>
          </div>
        </div>
      </div>

      {/* Scanner area */}
      <div className="bg-cockpit-card border border-cockpit rounded-card overflow-hidden shadow-cockpit-lg">
        {!scannedCode ? (
          <>
            <div
              id="barcode-reader"
              ref={scannerRef}
              className="w-full bg-black"
              style={{ minHeight: scanning ? 300 : 0 }}
            />

            {cameraError ? (
              <div className="p-6 text-center">
                <Camera className="w-10 h-10 mx-auto mb-3 text-red-400" />
                <p className="text-sm text-red-500 font-medium mb-1">
                  Caméra inaccessible
                </p>
                <p className="text-xs text-cockpit-secondary mb-4">
                  {cameraError}
                </p>
                <button
                  onClick={startScanner}
                  className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white min-h-[44px]"
                  style={{
                    background: `linear-gradient(135deg, ${COMMERCIAL_GRADIENT.from}, ${COMMERCIAL_GRADIENT.to})`,
                  }}
                >
                  Réessayer
                </button>
              </div>
            ) : !scanning ? (
              <div className="p-6 text-center">
                <Camera className="w-12 h-12 mx-auto mb-3 text-cockpit-secondary opacity-40" />
                <p className="text-sm text-cockpit-secondary mb-4">
                  Positionnez le code-barres devant la caméra
                </p>
                <button
                  onClick={startScanner}
                  className="w-full px-5 py-3.5 rounded-xl text-sm font-bold text-white min-h-[56px] transition-all hover:-translate-y-0.5"
                  style={{
                    background: `linear-gradient(135deg, ${COMMERCIAL_GRADIENT.from}, ${COMMERCIAL_GRADIENT.to})`,
                    boxShadow: `0 4px 14px ${COMMERCIAL_GRADIENT.shadow}`,
                  }}
                >
                  <Camera className="w-5 h-5 inline mr-2" />
                  Lancer le scanner
                </button>
              </div>
            ) : (
              <div className="p-3 text-center">
                <p className="text-xs text-cockpit-secondary animate-pulse">
                  Recherche de code-barres en cours...
                </p>
                <button
                  onClick={stopScanner}
                  className="mt-2 px-4 py-2 rounded-lg text-xs font-medium text-cockpit-secondary border border-cockpit hover:bg-cockpit-dark transition min-h-[44px]"
                >
                  <X className="w-3.5 h-3.5 inline mr-1" />
                  Arrêter
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="p-5 space-y-4">
            {/* Scanned code */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-cockpit-secondary uppercase font-semibold">
                  Code scanné
                </p>
                <p className="text-lg font-mono font-bold text-cockpit-heading mt-0.5">
                  {scannedCode}
                </p>
              </div>
              <button
                onClick={() => {
                  resetScan();
                  setTimeout(startScanner, 100);
                }}
                className="p-2 rounded-lg border border-cockpit hover:bg-cockpit-dark transition"
                title="Scanner un autre code"
              >
                <Camera className="w-5 h-5 text-cockpit-secondary" />
              </button>
            </div>

            {/* Searching */}
            {searching && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-cockpit-secondary" />
                <span className="ml-2 text-sm text-cockpit-secondary">
                  Recherche en cours...
                </span>
              </div>
            )}

            {/* Product found */}
            {result && (
              <div
                className="rounded-xl p-4 border-2"
                style={{ borderColor: COMMERCIAL_GRADIENT.from }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${COMMERCIAL_GRADIENT.from}, ${COMMERCIAL_GRADIENT.to})`,
                    }}
                  >
                    <Package className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-cockpit-heading">
                      {result.name}
                    </p>
                    <p className="text-xs text-cockpit-secondary font-mono mt-0.5">
                      Réf : {result.reference}
                    </p>
                    <div className="flex items-baseline gap-3 mt-2">
                      <span
                        className="text-xl font-bold"
                        style={{ color: COMMERCIAL_GRADIENT.from }}
                      >
                        {formatEuro(result.prixTTC)}
                      </span>
                      <span className="text-xs text-cockpit-secondary">
                        {formatEuro(result.prixHT)} HT
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Not found */}
            {notFound && (
              <div className="text-center py-6">
                <Search className="w-8 h-8 mx-auto mb-2 text-cockpit-secondary opacity-40" />
                <p className="text-sm font-medium text-cockpit-heading">
                  Produit non trouvé
                </p>
                <p className="text-xs text-cockpit-secondary mt-1">
                  Le code "{scannedCode}" ne correspond à aucune référence du
                  catalogue.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  resetScan();
                  setTimeout(startScanner, 100);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-sm font-semibold text-white min-h-[48px] transition-all"
                style={{
                  background: `linear-gradient(135deg, ${COMMERCIAL_GRADIENT.from}, ${COMMERCIAL_GRADIENT.to})`,
                }}
              >
                <Camera className="w-4 h-4" />
                Nouveau scan
              </button>
              <Link
                href="/commercial/catalogue"
                className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-sm font-medium text-cockpit-primary border border-cockpit hover:bg-cockpit-dark transition min-h-[48px]"
              >
                <Package className="w-4 h-4" />
                Catalogue
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Manual input */}
      <div className="bg-cockpit-card border border-cockpit rounded-card p-4 shadow-cockpit-lg">
        <p className="text-xs font-semibold text-cockpit-secondary uppercase mb-2">
          Recherche manuelle
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const input = (e.target as HTMLFormElement).elements.namedItem(
              "code"
            ) as HTMLInputElement;
            if (input.value.trim()) {
              setScannedCode(input.value.trim());
              stopScanner();
              searchProduct(input.value.trim());
            }
          }}
          className="flex gap-2"
        >
          <input
            name="code"
            type="text"
            placeholder="Tapez une référence..."
            className="flex-1 bg-cockpit-dark border border-cockpit rounded-lg px-3 py-2.5 text-sm text-cockpit-primary placeholder:text-cockpit-secondary focus:outline-none focus:ring-2 focus:ring-teal-500/40"
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white min-h-[44px]"
            style={{
              background: `linear-gradient(135deg, ${COMMERCIAL_GRADIENT.from}, ${COMMERCIAL_GRADIENT.to})`,
            }}
          >
            <Search className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
