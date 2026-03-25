"use client";

import { useState, useEffect } from "react";

function useCountUp(target: number, duration = 600): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (target === 0) { setValue(0); return; }
    const start = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress >= 1) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return value;
}

// ===== COMPONENT =====

interface KPICardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    direction: "up" | "down";
  };
  icon?: React.ReactNode;
  bgColor?: string; // kept for compatibility but ignored — uses var(--color-active)
}

export function KPICard({
  title,
  value,
  change,
  icon,
}: KPICardProps) {
  const numericValue = typeof value === "number" ? value : parseInt(String(value), 10);
  const isAnimatable = typeof value === "number" || (!isNaN(numericValue) && !String(value).includes("%"));
  const animatedValue = useCountUp(isAnimatable ? numericValue : 0);
  const displayValue = isAnimatable ? animatedValue : value;

  return (
    <div
      className="rounded-xl overflow-hidden transition-transform duration-200 hover:-translate-y-0.5 bg-white border border-cockpit"
    >
      {/* Top gradient stripe */}
      <div
        className="h-1.5"
        style={{ background: 'linear-gradient(90deg, var(--color-active), #FEEB9C)' }}
      />
      <div className="p-3 sm:p-4 flex items-center gap-3">
        {icon && (
          <div
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'var(--color-active-light)' }}
          >
            <div style={{ color: 'var(--color-active)' }} className="[&>svg]:w-4 [&>svg]:h-4 sm:[&>svg]:w-5 sm:[&>svg]:h-5">
              {icon}
            </div>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-cockpit-secondary text-[10px] sm:text-xs font-medium truncate">
            {title}
          </p>
          <p className="text-lg sm:text-xl font-bold truncate" style={{ color: 'var(--color-active)' }}>
            {displayValue}
          </p>
          {change && (
            <div className="flex items-center gap-1">
              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                style={{
                  backgroundColor: 'var(--color-active-light)',
                  color: 'var(--color-active)'
                }}
              >
                {change.direction === "up" ? "+" : ""}{change.value}%
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
