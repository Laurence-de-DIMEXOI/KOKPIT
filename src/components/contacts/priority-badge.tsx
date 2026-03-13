"use client";

import { useState, useRef, useEffect } from "react";
import { Flame, Thermometer, Snowflake, Zap } from "lucide-react";

export interface PriorityData {
  score: number;
  level: "cold" | "warm" | "hot" | "burning";
  reasons: string[];
  color: string;
  label: string;
}

const levelIcons = {
  cold: Snowflake,
  warm: Thermometer,
  hot: Flame,
  burning: Zap,
};

const bgMap = {
  cold: "bg-[#8592A3]/10",
  warm: "bg-[#F4B400]/10",
  hot: "bg-[#E65100]/10",
  burning: "bg-[#D32F2F]/10",
};

export function PriorityBadge({ priority }: { priority: PriorityData }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showTooltip) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setShowTooltip(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showTooltip]);

  const Icon = levelIcons[priority.level];

  return (
    <div ref={ref} className="relative inline-flex">
      <button
        onClick={(e) => { e.stopPropagation(); setShowTooltip(!showTooltip); }}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${bgMap[priority.level]}`}
        style={{ color: priority.color }}
        title={`${priority.label} (${priority.score}/100)`}
      >
        <Icon className="w-3 h-3" />
        {priority.label}
      </button>

      {showTooltip && priority.reasons.length > 0 && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-64 bg-white rounded-lg shadow-xl border border-[#E8EAED] p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-2 rounded-full bg-[#E8EAED] overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${priority.score}%`, backgroundColor: priority.color }}
              />
            </div>
            <span className="text-xs font-bold" style={{ color: priority.color }}>
              {priority.score}/100
            </span>
          </div>
          <div className="flex gap-1 mb-2 flex-wrap">
            {[
              { label: "Intention", max: 50 },
              { label: "Historique", max: 30 },
              { label: "Fraîcheur", max: 20 },
            ].map((comp) => (
              <span key={comp.label} className="text-[9px] px-1.5 py-0.5 rounded bg-[#F5F6F7] text-[#8592A3]">
                {comp.label} /{comp.max}
              </span>
            ))}
          </div>
          <ul className="space-y-1">
            {priority.reasons.map((r, i) => (
              <li key={i} className="text-[11px] text-[#32475C] flex items-start gap-1.5">
                <span className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: priority.color }} />
                {r}
              </li>
            ))}
          </ul>
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-white border-r border-b border-[#E8EAED] -rotate-45 -mt-1" />
        </div>
      )}
    </div>
  );
}

/** Mini gauge for the drawer header */
export function PriorityGauge({ priority }: { priority: PriorityData }) {
  const Icon = levelIcons[priority.level];

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#F5F6F7] border border-[#E8EAED]">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center"
        style={{ backgroundColor: `${priority.color}15` }}
      >
        <Icon className="w-5 h-5" style={{ color: priority.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-bold" style={{ color: priority.color }}>
            {priority.label}
          </span>
          <span className="text-xs text-[#8592A3]">{priority.score}/100</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-[#E8EAED] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${priority.score}%`, backgroundColor: priority.color }}
          />
        </div>
      </div>
      {priority.reasons.length > 0 && (
        <div className="text-[10px] text-[#8592A3] max-w-[140px] leading-tight">
          {priority.reasons[0]}
        </div>
      )}
    </div>
  );
}
