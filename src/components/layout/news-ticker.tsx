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
    const fetchNews = async (forceFresh = false) => {
      try {
        const url = forceFresh ? "/api/news?fresh=true" : "/api/news";
        const res = await fetch(url);
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
    // Refresh toutes les 2 min (suit le TTL serveur)
    const interval = setInterval(() => fetchNews(false), 2 * 60 * 1000);
    // Force refresh quand le dashboard ou autre page émet un événement global
    const handler = () => fetchNews(true);
    window.addEventListener("kokpit:refresh-news", handler);
    return () => {
      alive = false;
      clearInterval(interval);
      window.removeEventListener("kokpit:refresh-news", handler);
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
        <span className="text-[12px] font-medium text-white">{it.text}</span>
        <span className="text-white/30 select-none px-2">•</span>
      </span>
    ));

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 h-7 overflow-hidden border-b border-white/10 shadow-sm flex items-center"
      style={{
        background:
          "linear-gradient(90deg, #0f172a 0%, #1e3a8a 30%, #1e293b 70%, #0f172a 100%)",
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
      {/* Fade gauche/droite pour faire propre + bouton close */}
      <div className="absolute left-0 top-0 bottom-0 w-12 pointer-events-none"
        style={{ background: "linear-gradient(90deg, #0f172a, transparent)" }} />
      <div className="absolute right-10 top-0 bottom-0 w-12 pointer-events-none"
        style={{ background: "linear-gradient(-90deg, #0f172a, transparent)" }} />
      <button
        onClick={() => setHidden(true)}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-white/70 hover:text-white text-sm w-6 h-6 leading-none bg-slate-900/90 hover:bg-slate-800 rounded-full flex items-center justify-center shadow-md"
        title="Masquer la barre d'actus pour cette session"
      >
        ✕
      </button>
    </div>
  );
}
