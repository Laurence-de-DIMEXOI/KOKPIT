"use client";

import { PostLabel, LABEL_CONFIG, LabelCategory } from "./types";

interface LabelPickerProps {
  selected: PostLabel[];
  onChange: (labels: PostLabel[]) => void;
}

const ALL_LABELS = Object.keys(LABEL_CONFIG) as PostLabel[];

// Regroupe les labels par catégorie
const CATEGORIES: LabelCategory[] = ["Piliers", "Parcours", "Contexte", "Canal"];

function getLabelsByCategory(category: LabelCategory): PostLabel[] {
  return ALL_LABELS.filter((l) => LABEL_CONFIG[l].category === category);
}

export default function LabelPicker({ selected, onChange }: LabelPickerProps) {
  const toggle = (label: PostLabel) => {
    if (selected.includes(label)) {
      onChange(selected.filter((l) => l !== label));
    } else {
      onChange([...selected, label]);
    }
  };

  return (
    <div className="space-y-3">
      {CATEGORIES.map((category) => (
        <div key={category}>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
            {category}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {getLabelsByCategory(category).map((label) => {
              const config = LABEL_CONFIG[label];
              const isSelected = selected.includes(label);
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => toggle(label)}
                  className={`text-[11px] font-medium px-2.5 py-1 rounded-full border-2 transition-all ${
                    isSelected
                      ? "border-current shadow-sm scale-105"
                      : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                  style={{
                    color: config.color,
                    backgroundColor: config.bg,
                    borderColor: isSelected ? config.color : "transparent",
                  }}
                >
                  {config.name}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
