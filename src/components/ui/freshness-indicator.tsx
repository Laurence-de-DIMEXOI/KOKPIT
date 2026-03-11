"use client";

import { Clock, RefreshCw, Loader2 } from "lucide-react";
import clsx from "clsx";

interface FreshnessIndicatorProps {
  label?: string;
  cacheDate: string | null;
  onRefresh?: () => void;
  refreshing?: boolean;
  className?: string;
}

function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "à l'instant";
  const min = Math.floor(sec / 60);
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h}h`;
  return `il y a ${Math.floor(h / 24)}j`;
}

export function FreshnessIndicator({
  label = "Données Sellsy",
  cacheDate,
  onRefresh,
  refreshing,
  className,
}: FreshnessIndicatorProps) {
  if (!cacheDate) return null;

  return (
    <div
      className={clsx(
        "flex items-center gap-2 text-xs text-cockpit-secondary",
        className
      )}
    >
      <Clock className="w-3.5 h-3.5" />
      <span>
        {label} · Mis à jour {timeAgo(cacheDate)}
      </span>
      {onRefresh && (
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="p-1 rounded hover:bg-cockpit-dark/80 transition-colors disabled:opacity-50"
          title="Rafraîchir"
        >
          {refreshing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5" />
          )}
        </button>
      )}
    </div>
  );
}
