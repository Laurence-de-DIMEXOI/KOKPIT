"use client";

import type { PostLabel } from "./types";
import { LABEL_CONFIG } from "./types";

const CALENDAR_LABELS: PostLabel[] = [
  "AVIS_CLIENTS",
  "FIDELISATION",
  "TEASING_AVRIL",
  "VIDEO_REEL",
  "BLOG_SEO",
  "EMAIL_BREVO",
  "STORY",
];

const ICONS: Record<PostLabel, string> = {
  AVIS_CLIENTS: "★",
  FIDELISATION: "♦",
  TEASING_AVRIL: "◆",
  VIDEO_REEL: "▶",
  BLOG_SEO: "✎",
  EMAIL_BREVO: "✉",
  STORY: "◎",
} as Record<PostLabel, string>;

export function LegendLabels() {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      {CALENDAR_LABELS.map((label) => {
        const cfg = LABEL_CONFIG[label];
        return (
          <span
            key={label}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap flex-shrink-0"
            style={{ backgroundColor: cfg.bg, color: cfg.color }}
          >
            {ICONS[label]} {cfg.name}
          </span>
        );
      })}
    </div>
  );
}
