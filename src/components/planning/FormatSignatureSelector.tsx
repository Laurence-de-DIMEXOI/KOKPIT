"use client";

import { useState, useRef } from "react";
import { FORMATS_ANTI_IA, FormatAntiIA } from "@/data/formats-anti-ia";
import { Clapperboard, ChevronDown } from "lucide-react";

interface FormatSignatureSelectorProps {
  labelActif: "VIDEO_REEL" | "STORY";
  onApply: (titre: string, description: string) => void;
}

export default function FormatSignatureSelector({
  labelActif,
  onApply,
}: FormatSignatureSelectorProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const formats = FORMATS_ANTI_IA.filter((f) => f.label === labelActif);
  const selected = selectedId
    ? formats.find((f) => f.id === selectedId) ?? null
    : null;

  const handleApply = (format: FormatAntiIA) => {
    onApply(format.titreSuggere, format.descriptionSuggeree);
  };

  return (
    <div className="transition-all duration-200">
      {/* Label section */}
      <label className="block text-sm font-medium text-gray-600 mb-2">
        <Clapperboard className="w-4 h-4 inline mr-1" />
        Format signature
        <span className="text-gray-400 font-normal ml-1">(optionnel)</span>
      </label>

      {/* Pills horizontales */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {formats.map((format) => (
          <button
            key={format.id}
            type="button"
            onClick={() =>
              setSelectedId(selectedId === format.id ? null : format.id)
            }
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              selectedId === format.id
                ? "text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            style={
              selectedId === format.id
                ? { backgroundColor: "var(--color-active)" }
                : undefined
            }
          >
            {format.nom}
          </button>
        ))}
      </div>

      {/* Bloc script — affiché quand un format est sélectionné */}
      {selected && (
        <div
          className="mt-3 rounded-lg p-3 border-l-[3px] transition-all duration-200"
          style={{
            backgroundColor: "var(--color-active-light)",
            borderLeftColor: "var(--color-active)",
          }}
        >
          {/* Header script */}
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-gray-700">
              Script &quot;0 mot&quot; — {selected.nom}
            </h4>
            <span className="text-[10px] text-gray-400">
              {selected.duree} · {selected.frequence}
            </span>
          </div>

          {/* Lignes du script */}
          <div className="space-y-1 mb-3">
            {selected.script.map((line, i) => (
              <p
                key={i}
                className="text-xs font-mono text-gray-600 leading-relaxed"
              >
                {line.startsWith("→") || line.startsWith("  →") ? (
                  <span className="text-[var(--color-active)]">{line}</span>
                ) : (
                  <>
                    <span className="text-[var(--color-active)] mr-1">▸</span>
                    {line}
                  </>
                )}
              </p>
            ))}
          </div>

          {/* Bouton appliquer */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => handleApply(selected)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white rounded-lg transition-colors hover:opacity-90"
              style={{ backgroundColor: "var(--color-active)" }}
            >
              Utiliser ce format
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
