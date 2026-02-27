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
    <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg p-12 flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-cockpit-secondary text-sm font-medium mb-3">
            {title}
          </p>
          <p className="text-5xl font-bold text-cockpit-heading">
            {value}
          </p>
          {change && (
            <p
              className={clsx(
                "text-sm font-medium mt-3",
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
        {icon && (
          <div
            className={clsx(
              "w-14 h-14 rounded-2xl",
              "flex items-center justify-center",
              "flex-shrink-0",
              bgColor,
              "bg-opacity-15"
            )}
          >
            <div className={clsx(bgColor, "text-white")}>
              {icon}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
