"use client";

import clsx from "clsx";

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
  return (
    <div className="bg-cockpit-card rounded-xl border border-cockpit shadow-cockpit-lg p-3 sm:p-4 flex items-center gap-3">
      {icon && (
        <div
          className={clsx(
            "w-9 h-9 sm:w-10 sm:h-10 rounded-lg",
            "flex items-center justify-center flex-shrink-0",
            bgColor,
            "bg-opacity-15"
          )}
        >
          <div className={clsx(bgColor, "text-white [&>svg]:w-4 [&>svg]:h-4 sm:[&>svg]:w-5 sm:[&>svg]:h-5")}>
            {icon}
          </div>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-cockpit-secondary text-[10px] sm:text-xs font-medium truncate">
          {title}
        </p>
        <p className="text-lg sm:text-xl font-bold text-cockpit-heading truncate">
          {value}
        </p>
        {change && (
          <p
            className={clsx(
              "text-[10px] font-medium",
              change.direction === "up"
                ? "text-cockpit-success"
                : "text-cockpit-danger"
            )}
          >
            {change.direction === "up" ? "+" : ""}
            {change.value}%
          </p>
        )}
      </div>
    </div>
  );
}
