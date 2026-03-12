"use client";

import { useState, useEffect } from "react";
import { Link2, ChevronRight, AlertTriangle, ExternalLink, Loader2 } from "lucide-react";
import { getSellsyUrl } from "@/lib/sellsy-urls";
import clsx from "clsx";

interface ChainNode {
  id: string;
  type: string;
  typeLabel: string;
  numero: string;
  date: string | null;
  montantHT: number | null;
}

interface DocumentChainProps {
  docType: "estimate" | "order";
  docId: number;
  currentNumero?: string;
}

const TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  estimate: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  order: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  delivery: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  invoice: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
};

export function DocumentChain({ docType, docId, currentNumero }: DocumentChainProps) {
  const [chain, setChain] = useState<ChainNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notConfigured, setNotConfigured] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchChain() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/sellsy/document-chain?type=${docType}&id=${docId}`
        );
        const data = await res.json();

        if (cancelled) return;

        if (data.error === "API V1 non configurée") {
          setNotConfigured(true);
          setChain([]);
        } else if (data.error) {
          setError(data.error);
        } else {
          setChain(data.chain || []);
        }
      } catch {
        if (!cancelled) setError("Impossible de charger la chaîne");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchChain();
    return () => { cancelled = true; };
  }, [docType, docId]);

  // Skeleton
  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-xs text-gray-400">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        <span>Chargement de la chaîne...</span>
      </div>
    );
  }

  // API V1 non configurée
  if (notConfigured) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
        <span className="text-amber-700">
          API Sellsy V1 non configurée — Activez le scope dans Sellsy
        </span>
      </div>
    );
  }

  // Erreur
  if (error) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs">
        <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
        <span className="text-red-700">{error}</span>
      </div>
    );
  }

  // Pas de chaîne (document seul)
  if (chain.length <= 1) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-xs text-gray-400">
        <Link2 className="w-3.5 h-3.5" />
        <span>Origine inconnue</span>
      </div>
    );
  }

  // Chaîne trouvée
  const origin = chain[0];

  return (
    <div className="px-3 py-2 bg-white border border-gray-200 rounded-lg">
      {/* Chaîne visuelle */}
      <div className="flex items-center gap-1 flex-wrap">
        <Link2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mr-1" />
        {chain.map((node, i) => {
          const colors = TYPE_COLORS[node.type] || TYPE_COLORS.estimate;
          const isCurrent = node.id === String(docId) && node.type === docType;

          return (
            <div key={`${node.type}-${node.id}`} className="flex items-center gap-1">
              {i > 0 && (
                <ChevronRight className="w-3 h-3 text-gray-300 flex-shrink-0" />
              )}
              <span
                className={clsx(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border",
                  colors.bg,
                  colors.text,
                  colors.border,
                  isCurrent && "ring-1 ring-offset-1 ring-gray-400"
                )}
              >
                {node.numero || `#${node.id}`}
                {isCurrent && (
                  <span className="text-[9px] opacity-60">(actuel)</span>
                )}
              </span>
            </div>
          );
        })}
      </div>

      {/* Info origine */}
      {origin && origin.type !== docType && (
        <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-gray-500">
          <span>
            Origine : {origin.typeLabel}
            {origin.date && (
              <> du {new Date(origin.date).toLocaleDateString("fr-FR")}</>
            )}
            {origin.montantHT != null && origin.montantHT > 0 && (
              <> &middot; {origin.montantHT.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} &euro; HT</>
            )}
          </span>
          <a
            href={getSellsyUrl(origin.type === 'estimate' ? 'estimate' : origin.type === 'order' ? 'order' : 'invoice', origin.id)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-700 inline-flex items-center gap-0.5"
          >
            Voir <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      )}
    </div>
  );
}
