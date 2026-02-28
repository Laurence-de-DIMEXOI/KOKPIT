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
    <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg p-4 sm:p-6 lg:p-12 flex flex-col gap-3 sm:gap-4 lg:gap-6">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-cockpit-secondary text-xs sm:text-sm font-medium mb-1 sm:mb-3 truncate">
            {title}
          </p>
          <p className="text-2xl sm:text-3xl lg:text-5xl font-bold text-cockpit-heading truncate">
            {value}
          </p>
          {change && (
            <p
              className={clsx(
                "text-xs sm:text-sm font-medium mt-1 sm:mt-3",
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
              "w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl",
              "flex items-center justify-center",
              "flex-shrink-0",
              bgColor,
              "bg-opacity-15"
            )}
          >
            <div className={clsx(bgColor, "text-white [&>svg]:w-5 [&>svg]:h-5 sm:[&>svg]:w-6 sm:[&>svg]:h-6 lg:[&>svg]:w-7 lg:[&>svg]:h-7")}>
              {icon}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
