"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import clsx from "clsx";

interface ErrorStateProps {
  message?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  message = "Impossible de charger les données",
  description,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={clsx(
        "bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg p-8 text-center",
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
        <AlertTriangle className="w-6 h-6 text-red-500" />
      </div>
      <p className="text-cockpit-heading font-semibold mb-1">{message}</p>
      {description && (
        <p className="text-cockpit-secondary text-sm mb-4">{description}</p>
      )}
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 bg-cockpit-card border border-cockpit px-4 py-2 rounded-lg text-sm font-medium text-cockpit-heading hover:bg-cockpit-dark transition-colors mt-2"
        >
          <RefreshCw className="w-4 h-4" />
          Réessayer
        </button>
      )}
    </div>
  );
}
