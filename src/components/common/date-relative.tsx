"use client";

import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { useState } from "react";

interface DateRelativeProps {
  date: Date;
  showFull?: boolean;
}

export function DateRelative({ date, showFull = false }: DateRelativeProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const relativeTime = formatDistanceToNow(new Date(date), {
    addSuffix: true,
    locale: fr,
  });

  const fullDate = new Date(date).toLocaleString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  if (showFull) {
    return <span className="text-gray-900 text-sm">{fullDate}</span>;
  }

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span className="text-gray-900 text-sm cursor-help hover:text-yellow-cockpit transition-colors">
        {relativeTime}
      </span>

      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap z-10 pointer-events-none">
          {fullDate}
        </div>
      )}
    </div>
  );
}
