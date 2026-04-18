"use client";

import { useEffect, useState } from "react";
import { Target, FileText, ShoppingCart, Loader2 } from "lucide-react";

interface AttributionDevisItem {
  id: string;
  devisId: string;
  devisRef: string;
  devisCA: number;
  devisDate: string;
  joursApres: number;
}

interface AttributionBDCItem {
  id: string;
  bdcId: string;
  bdcRef: string;
  bdcCA: number;
  bdcDate: string;
  joursApres: number;
}

interface AttributionData {
  lead: {
    id: string;
    createdAt: string;
    source: string;
    utmSource: string | null;
    utmMedium: string | null;
    utmCampaign: string | null;
  };
  attributionsDevis: AttributionDevisItem[];
  attributionsBDC: AttributionBDCItem[];
  caTotalDevis: number;
  caTotalBDC: number;
}

function eur(n: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function LeadAttribution({ leadId }: { leadId: string }) {
  const [data, setData] = useState<AttributionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/marketing/tunnel/lead/${leadId}`);
        if (res.ok && alive) {
          setData(await res.json());
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [leadId]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
        <div className="flex items-center gap-2 text-gray-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Chargement attribution…</span>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const source = data.lead.utmSource || data.lead.source || "Direct";
  const campaign = data.lead.utmCampaign;
  const nothing = data.attributionsDevis.length === 0 && data.attributionsBDC.length === 0;

  return (
    <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
      <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
        <Target className="w-5 h-5 text-yellow-600" />
        Attribution marketing
      </h2>

      {/* Source */}
      <div className="flex flex-wrap items-center gap-2 text-sm mb-4 pb-3 border-b border-gray-100">
        <span className="text-gray-500">Source :</span>
        <span className="font-semibold text-gray-900">{source}</span>
        {campaign && (
          <>
            <span className="text-gray-400">·</span>
            <span className="text-gray-500">Campagne :</span>
            <span className="font-medium text-gray-900">{campaign}</span>
          </>
        )}
      </div>

      {nothing ? (
        <p className="text-sm text-gray-500 italic">
          Aucun devis ni BDC lié dans les fenêtres d&apos;attribution (7j devis / 30j BDC).
        </p>
      ) : (
        <div className="space-y-4">
          {/* Devis liés (7j) */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Devis liés (fenêtre 7j)
            </h3>
            {data.attributionsDevis.length === 0 ? (
              <p className="text-sm text-gray-400 italic pl-5">Aucun devis dans les 7 jours</p>
            ) : (
              <ul className="space-y-1.5">
                {data.attributionsDevis.map((d) => (
                  <li
                    key={d.id}
                    className="flex flex-wrap items-center gap-2 text-sm pl-5 py-1.5 border-l-2 border-yellow-400 bg-yellow-50/50 rounded-r"
                  >
                    <span className="font-mono font-semibold text-gray-900">{d.devisRef}</span>
                    <span className="text-gray-500">·</span>
                    <span className="font-semibold">{eur(d.devisCA)}</span>
                    <span className="text-gray-500">·</span>
                    <span className="text-gray-500">J+{d.joursApres}</span>
                  </li>
                ))}
              </ul>
            )}
            {data.attributionsDevis.length > 1 && (
              <p className="text-xs text-gray-500 mt-1.5 pl-5">
                Total devis : <strong>{eur(data.caTotalDevis)}</strong>
              </p>
            )}
          </div>

          {/* BDC liés (30j) */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2 flex items-center gap-1.5">
              <ShoppingCart className="w-3.5 h-3.5" />
              BDC liés (fenêtre 30j)
            </h3>
            {data.attributionsBDC.length === 0 ? (
              <p className="text-sm text-gray-400 italic pl-5">Aucun BDC dans les 30 jours</p>
            ) : (
              <ul className="space-y-1.5">
                {data.attributionsBDC.map((b) => (
                  <li
                    key={b.id}
                    className="flex flex-wrap items-center gap-2 text-sm pl-5 py-1.5 border-l-2 border-green-500 bg-green-50/50 rounded-r"
                  >
                    <span className="font-mono font-semibold text-gray-900">{b.bdcRef}</span>
                    <span className="text-gray-500">·</span>
                    <span className="font-semibold text-green-700">{eur(b.bdcCA)}</span>
                    <span className="text-gray-500">·</span>
                    <span className="text-gray-500">J+{b.joursApres}</span>
                  </li>
                ))}
              </ul>
            )}
            {data.attributionsBDC.length > 0 && (
              <p className="text-xs text-gray-700 mt-1.5 pl-5 font-medium">
                CA attribué total : <strong className="text-green-700">{eur(data.caTotalBDC)}</strong>
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
