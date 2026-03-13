"use client";

import clsx from "clsx";

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={clsx(
        "bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg p-8 text-center",
        className
      )}
    >
      <Icon className="w-10 h-10 text-cockpit-secondary mx-auto mb-3 opacity-40" />
      <p className="text-cockpit-heading font-semibold mb-1">{title}</p>
      {description && (
        <p className="text-cockpit-secondary text-sm mb-4">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center gap-2 bg-cockpit-yellow text-gray-900 px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-cockpit-yellow/90 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
