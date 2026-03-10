"use client";

import { PostLabel, LABEL_CONFIG } from "./types";

interface LabelPickerProps {
  selected: PostLabel[];
  onChange: (labels: PostLabel[]) => void;
}

const ALL_LABELS = Object.keys(LABEL_CONFIG) as PostLabel[];

export default function LabelPicker({ selected, onChange }: LabelPickerProps) {
  const toggle = (label: PostLabel) => {
    if (selected.includes(label)) {
      onChange(selected.filter((l) => l !== label));
    } else {
      onChange([...selected, label]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {ALL_LABELS.map((label) => {
        const config = LABEL_CONFIG[label];
        const isSelected = selected.includes(label);
        return (
          <button
            key={label}
            type="button"
            onClick={() => toggle(label)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border-2 transition-all ${
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
  );
}
