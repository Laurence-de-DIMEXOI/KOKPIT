"use client";

import clsx from "clsx";

// ===== COLOR MAP =====
// Map Tailwind bgColor classes to gradient hex values
const gradientMap: Record<string, { from: string; to: string; shadow: string }> = {
  "bg-cockpit-yellow":  { from: "#F4B400", to: "#D9A000", shadow: "rgba(244, 180, 0, 0.30)" },
  "bg-cockpit-info":    { from: "#03C3EC", to: "#0299C4", shadow: "rgba(3, 195, 236, 0.30)" },
  "bg-cockpit-success": { from: "#71DD37", to: "#5AC42D", shadow: "rgba(113, 221, 55, 0.30)" },
  "bg-cockpit-warning": { from: "#FFAB00", to: "#E09600", shadow: "rgba(255, 171, 0, 0.30)" },
  "bg-cockpit-danger":  { from: "#FF3E1D", to: "#E03417", shadow: "rgba(255, 62, 29, 0.30)" },
  "bg-[#71DD37]":       { from: "#71DD37", to: "#5AC42D", shadow: "rgba(113, 221, 55, 0.30)" },
  "bg-[#F59E0B]":       { from: "#F59E0B", to: "#D97706", shadow: "rgba(245, 158, 11, 0.30)" },
  "bg-[#60A5FA]":       { from: "#60A5FA", to: "#3B82F6", shadow: "rgba(96, 165, 250, 0.30)" },
  "bg-[#34D399]":       { from: "#34D399", to: "#10B981", shadow: "rgba(52, 211, 153, 0.30)" },
  "bg-[#EF4444]":       { from: "#EF4444", to: "#DC2626", shadow: "rgba(239, 68, 68, 0.30)" },
};

const fallback = { from: "#F4B400", to: "#D9A000", shadow: "rgba(244, 180, 0, 0.30)" };

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
