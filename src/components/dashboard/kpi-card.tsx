"use client";

import clsx from "clsx";

// ===== COLOR MAP =====
// Palette-based gradients — harmonious per-space tones
const gradientMap: Record<string, { from: string; to: string; shadow: string }> = {
  // Primary / Total — Citron (commercial palette)
  "bg-cockpit-yellow":  { from: "#F2BB16", to: "#BF820F", shadow: "rgba(242, 187, 22, 0.30)" },
  // Info / Devis — Teal (commercial palette)
  "bg-cockpit-info":    { from: "#118C8C", to: "#0E6973", shadow: "rgba(17, 140, 140, 0.30)" },
  // Success / Commandes — reste vert (universel positif)
  "bg-cockpit-success": { from: "#71DD37", to: "#5AC42D", shadow: "rgba(113, 221, 55, 0.30)" },
  // Warning — Sandy Brown (admin palette)
  "bg-cockpit-warning": { from: "#ED9F58", to: "#D15F12", shadow: "rgba(237, 159, 88, 0.30)" },
  // Danger — reste rouge (universel urgent)
  "bg-cockpit-danger":  { from: "#EF4444", to: "#DC2626", shadow: "rgba(239, 68, 68, 0.30)" },
  // Leads status colors
  "bg-[#71DD37]":       { from: "#71DD37", to: "#5AC42D", shadow: "rgba(113, 221, 55, 0.30)" },
  "bg-[#F59E0B]":       { from: "#EE9520", to: "#D15F12", shadow: "rgba(238, 149, 32, 0.30)" },
  "bg-[#60A5FA]":       { from: "#118C8C", to: "#0E6973", shadow: "rgba(17, 140, 140, 0.30)" },
  "bg-[#34D399]":       { from: "#849A28", to: "#6B7E1F", shadow: "rgba(132, 154, 40, 0.30)" },
  "bg-[#EF4444]":       { from: "#E23260", to: "#C2185B", shadow: "rgba(226, 50, 96, 0.30)" },
};

const fallback = { from: "#F2BB16", to: "#BF820F", shadow: "rgba(242, 187, 22, 0.30)" };

// ===== COMPONENT =====

interface KPICardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    direction: "up" | "down";
  };
  icon?: React.ReactNode;
  bgColor?: string;
}

export function KPICard({
  title,
  value,
  change,
  icon,
  bgColor = "bg-cockpit-yellow",
}: KPICardProps) {
  const colors = gradientMap[bgColor] || fallback;

  return (
    <div
      className="rounded-xl p-3 sm:p-4 flex items-center gap-3 transition-transform duration-200 hover:-translate-y-0.5"
      style={{
        background: `linear-gradient(135deg, ${colors.from} 0%, ${colors.to} 100%)`,
        boxShadow: `0 4px 14px ${colors.shadow}`,
      }}
    >
      {icon && (
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
          <div className="text-white [&>svg]:w-4 [&>svg]:h-4 sm:[&>svg]:w-5 sm:[&>svg]:h-5">
            {icon}
          </div>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-white/75 text-[10px] sm:text-xs font-medium truncate">
          {title}
        </p>
        <p className="text-lg sm:text-xl font-bold text-white truncate">
          {value}
        </p>
        {change && (
          <div className="flex items-center gap-1">
            <span
              className={clsx(
                "inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                change.direction === "up"
                  ? "bg-white/25 text-white"
                  : "bg-black/15 text-white/90"
              )}
            >
              {change.direction === "up" ? "+" : ""}
              {change.value}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
