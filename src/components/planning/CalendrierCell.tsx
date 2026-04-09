"use client";

import { useState } from "react";
import type { Post, PostLabel } from "./types";
import { LABEL_CONFIG } from "./types";

const ICONS: Partial<Record<PostLabel, string>> = {
  AVIS_CLIENTS: "★",
  FIDELISATION: "♦",
  TEASING_AVRIL: "◆",
  VIDEO_REEL: "▶",
  BLOG_SEO: "✎",
  EMAIL_BREVO: "✉",
  STORY: "◎",
};

interface CalendrierCellProps {
  day: number | null;
  isCurrentMonth: boolean;
  isToday: boolean;
  posts: Post[];
  onCardClick: (post: Post) => void;
}

const DONE_STATUTS = new Set(["PRET_A_POSTER", "POSTE"]);

function PostPill({ post, onClick }: { post: Post; onClick: () => void }) {
  const label = post.labels[0];
  const cfg = label ? LABEL_CONFIG[label] : null;
  const icon = label ? ICONS[label] : null;
  const done = DONE_STATUTS.has(post.statut);
  const checkColor = post.statut === "POSTE" ? "#22C55E" : "#10B981";

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="w-full text-left group"
    >
      {cfg && (
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold max-w-full"
          style={{ backgroundColor: cfg.bg, color: cfg.color }}
        >
          {icon} {cfg.name}
        </span>
      )}
      <p className="text-[11px] text-gray-700 truncate mt-0.5 group-hover:text-gray-900 flex items-center gap-1">
        {done && (
          <span style={{ color: checkColor }} className="flex-shrink-0 font-bold text-[10px]">✓</span>
        )}
        {post.title.length > 30 ? `${post.title.slice(0, 30)}…` : post.title}
      </p>
    </button>
  );
}

export function CalendrierCell({
  day,
  isCurrentMonth,
  isToday,
  posts,
  onCardClick,
}: CalendrierCellProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const visiblePosts = posts.slice(0, 2);
  const extraCount = posts.length - 2;

  if (day === null) {
    return <div className="min-h-[80px] p-1" />;
  }

  return (
    <div
      className={`min-h-[80px] p-1.5 rounded-lg transition-colors relative ${
        isCurrentMonth
          ? "bg-white border border-gray-100 hover:bg-[var(--color-active-light)]"
          : "bg-transparent"
      } ${isToday ? "ring-2 ring-[var(--color-active)]" : ""}`}
    >
      <span
        className={`text-xs font-medium ${
          isToday
            ? "text-[var(--color-active)] font-bold"
            : isCurrentMonth
            ? "text-gray-700"
            : "text-gray-300"
        }`}
      >
        {day}
      </span>

      {isCurrentMonth && posts.length > 0 && (
        <div className="mt-1 space-y-1">
          {visiblePosts.map((post) => (
            <PostPill
              key={post.id}
              post={post}
              onClick={() => onCardClick(post)}
            />
          ))}
          {extraCount > 0 && (
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setPopoverOpen(!popoverOpen);
                }}
                className="text-[10px] font-semibold text-[var(--color-active)] hover:underline"
              >
                +{extraCount} de plus
              </button>
              {popoverOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setPopoverOpen(false)}
                  />
                  <div className="absolute left-0 top-full mt-1 z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-2 min-w-[180px] space-y-1.5">
                    {posts.slice(2).map((post) => (
                      <PostPill
                        key={post.id}
                        post={post}
                        onClick={() => {
                          setPopoverOpen(false);
                          onCardClick(post);
                        }}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
