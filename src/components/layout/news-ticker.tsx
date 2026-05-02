"use client";

import { useEffect, useState } from "react";

interface NewsItem {
  icon: string;
  text: string;
  color?: string;
}

/**
 * Banderole d'actus internes en topbar — défile en continu.
 * Items fournis par /api/news (statiques + dynamiques).
 *
 * Anim : CSS keyframes `news-marquee` (déclarée inline) — translation -50%
 * en N secondes, où N s'adapte au nombre d'items pour garder une vitesse confort.
 */
export function NewsTicker() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let alive = true;
    const fetchNews = async () => {
      try {
        const res = await fetch("/api/news");
        if (!res.ok) return;
        const data = await res.json();
        if (alive && Array.isArray(data.items)) {
          setItems(data.items);
        }
      } catch {
        /* silencieux */
      }
    };
    fetchNews();
    // Refresh toutes les 10 min (suit le TTL serveur)
    const interval = setInterval(fetchNews, 10 * 60 * 1000);
    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, []);

  if (hidden || items.length === 0) return null;

  // Vitesse : ~6s par item, min 25s, max 90s
  const durationSec = Math.max(25, Math.min(90, items.length * 8));

  // On duplique la liste pour un défilement fluide en boucle (-50% translateX)
  const renderItems = (key: string) =>
    items.map((it, i) => (
      <span
        key={`${key}-${i}`}
        className="inline-flex items-center gap-1.5 px-6 py-1 whitespace-nowrap"
      >
        <span className="text-base leading-none">{it.icon}</span>
        <span className={`text-[12px] font-medium ${it.color || "text-white"}`}>
          {it.text}
        </span>
        <span className="text-white/30 select-none px-2">•</span>
      </span>
    ));

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 h-7 overflow-hidden border-b border-white/10 shadow-sm flex items-center"
      style={{
        background:
          "linear-gradient(90deg, #1e293b 0%, #334155 50%, #1e293b 100%)",
      }}
    >
      <style jsx>{`
        @keyframes news-marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .news-marquee-track {
          display: inline-flex;
          animation: news-marquee ${durationSec}s linear infinite;
        }
        .news-marquee-track:hover {
          animation-play-state: paused;
        }
      `}</style>
      <div className="news-marquee-track">
        {renderItems("a")}
        {renderItems("b")}
      </div>
      {/* Close button */}
      <button
        onClick={() => setHidden(true)}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-white/50 hover:text-white text-xs px-1.5 leading-none bg-slate-800/80 rounded"
        title="Masquer la barre d'actus pour cette session"
      >
        ✕
      </button>
    </div>
  );
}
