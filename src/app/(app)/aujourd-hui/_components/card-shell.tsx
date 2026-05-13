"use client";

import { ReactNode } from "react";

interface Props {
  icon: ReactNode;
  iconColor: string;
  title: string;
  badge?: ReactNode;
  children: ReactNode;
}

/**
 * Coquille commune des 4 blocs Daily Briefing : header avec icône + titre + badge,
 * fond carte, border `border-cockpit`, shadow `shadow-cockpit-lg`.
 */
export function CardShell({ icon, iconColor, title, badge, children }: Props) {
  return (
    <div className="bg-cockpit-card rounded-xl border border-cockpit shadow-cockpit-lg overflow-hidden">
      <div
        className="h-1.5"
        style={{
          background: `linear-gradient(90deg, ${iconColor}, #FEEB9C)`,
        }}
      />
      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold text-cockpit-heading flex items-center gap-2">
            <span style={{ color: iconColor }}>{icon}</span>
            {title}
          </h3>
          {badge && <div className="flex-shrink-0">{badge}</div>}
        </div>
        {children}
      </div>
    </div>
  );
}
