"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import {
  Radar,
  Settings,
  RefreshCw,
  Loader2,
  Activity,
  Sparkles,
  AlertTriangle,
  Clock,
  ExternalLink,
  Search,
  X,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/toast";

// ============================================================================
// TYPES
// ============================================================================

interface Concurrent {
  id: string;
  nom: string;
  categorie: string | null;
  pageId: string | null;
  derniereSync: string | null;
}

interface Pub {
  id: string;
  adArchiveId: string;
  snapshotUrl: string;
  texte: string | null;
  titre: string | null;
  caption: string | null;
  plateformes: string[];
  dateDebut: string;
  dateFin: string | null;
  active: boolean;
  recupereLe: string;
  concurrent: { id: string; nom: string; categorie: string | null };
}

interface Mot {
  mot: string;
  count: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MKT_GRADIENT = {
  from: "var(--color-active)",
  to: "#9C1449",
  shadow: "rgba(194,24,91,0.30)",
};

// ============================================================================
// HELPERS
// ============================================================================

function formatDateShort(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function formatRelative(iso: string | null): string {
  if (!iso) return "jamais";
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "à l'instant";
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "hier";
  if (days < 30) return `il y a ${days}j`;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

// ============================================================================
// WORD CLOUD
// ============================================================================

function NuageMotsCles({
  mots,
  onClick,
  activeWord,
}: {
  mots: Mot[];
  onClick: (mot: string) => void;
  activeWord: string | null;
}) {
  if (mots.length === 0) {
    return (
      <p className="text-center text-sm text-cockpit-secondary py-6">
        Pas encore assez de pubs pour extraire des mots-clés.
      </p>
    );
  }

  const max = mots[0]?.count || 1;
  const min = mots[mots.length - 1]?.count || 1;
  const range = Math.max(max - min, 1);

  return (
    <div className="flex flex-wrap gap-2 justify-center items-center">
      {mots.map(({ mot, count }) => {
        const weight = (count - min) / range; // 0..1
        const fontSize = 11 + weight * 18; // 11px..29px
        const opacity = 0.55 + weight * 0.45; // 0.55..1
        const isActive = activeWord === mot;
        return (
          <button
            key={mot}
            onClick={() => onClick(mot)}
            className={`px-2 py-0.5 rounded-md transition-all ${
              isActive
                ? "text-white"
                : "text-cockpit-primary hover:scale-105"
            }`}
            style={{
              fontSize: `${fontSize}px`,
              fontWeight: 500 + Math.round(weight * 4) * 100,
              opacity: isActive ? 1 : opacity,
              background: isActive
                ? `linear-gradient(135deg, ${MKT_GRADIENT.from}, ${MKT_GRADIENT.to})`
                : undefined,
              boxShadow: isActive
                ? `0 4px 14px ${MKT_GRADIENT.shadow}`
                : undefined,
              lineHeight: 1.2,
            }}
            title={`${count} occurrence${count > 1 ? "s" : ""}`}
          >
            {mot}
            <span className="ml-1 text-[9px] align-top opacity-70">{count}</span>
          </button>
        );
      })}
    </div>
  );
}

// ============================================================================
// PUB CARD (Pinterest style)
// ============================================================================

function PubCard({ pub }: { pub: Pub }) {
  const [imgOk, setImgOk] = useState(true);
  const snapshotHref = pub.snapshotUrl;

  return (
    <div className="break-inside-avoid mb-4 rounded-xl overflow-hidden bg-cockpit-card border border-cockpit shadow-cockpit-lg hover:-translate-y-0.5 transition-transform duration-200">
      {/* Snapshot — iframe Facebook */}
      {imgOk ? (
        <div className="relative bg-cockpit-dark" style={{ aspectRatio: "3 / 4" }}>
          <iframe
            src={snapshotHref}
            className="absolute inset-0 w-full h-full border-0"
            loading="lazy"
            sandbox="allow-scripts allow-same-origin"
            title={`Pub ${pub.adArchiveId}`}
            onError={() => setImgOk(false)}
          />
        </div>
      ) : (
        <div className="bg-cockpit-dark p-6 text-center text-xs text-cockpit-secondary">
          Aperçu indisponible
        </div>
      )}

      {/* Meta */}
      <div className="p-3 space-y-2">
        {/* Concurrent + date */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span
            className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full text-white"
            style={{
              background: `linear-gradient(135deg, ${MKT_GRADIENT.from}, ${MKT_GRADIENT.to})`,
            }}
          >
            {pub.concurrent.nom}
          </span>
          <span className="text-[10px] text-cockpit-secondary flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDateShort(pub.dateDebut)}
            {pub.dateFin && ` → ${formatDateShort(pub.dateFin)}`}
          </span>
        </div>

        {/* Titre */}
        {pub.titre && (
          <p className="text-sm font-semibold text-cockpit-primary line-clamp-2">
            {pub.titre}
          </p>
        )}

        {/* Texte */}
        {pub.texte && (
          <p className="text-xs text-cockpit-secondary line-clamp-4 whitespace-pre-wrap">
            {pub.texte}
          </p>
        )}

        {/* Footer : plateformes + active + lien */}
        <div className="flex items-center justify-between pt-1 border-t border-cockpit/50">
          <div className="flex items-center gap-1 flex-wrap">
            {pub.active && (
              <span className="inline-flex items-center gap-1 text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active
              </span>
            )}
            {pub.plateformes.map((p) => (
              <span
                key={p}
                className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-cockpit-dark text-cockpit-secondary capitalize"
              >
                {p.toLowerCase()}
              </span>
            ))}
          </div>
          <a
            href={snapshotHref}
            target="_blank"
            rel="noopener noreferrer"
            className="text-cockpit-secondary hover:text-cockpit-primary transition-colors"
            title="Ouvrir sur Facebook"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// PAGE
// ============================================================================

export default function VeillePage() {
  const { data: session } = useSession();
  const { addToast } = useToast();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const isAdmin = role === "ADMIN" || role === "MARKETING" || role === "DIRECTION";

  const [concurrents, setConcurrents] = useState<Concurrent[]>([]);
  const [pubs, setPubs] = useState<Pub[]>([]);
  const [mots, setMots] = useState<Mot[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [lastSync, setLastSync] = useState<string | null>(null);

  // Filtres
  const [fConcurrent, setFConcurrent] = useState<string>("");
  const [fPlateforme, setFPlateforme] = useState<string>("");
  const [fActive, setFActive] = useState<"all" | "active">("active");
  const [fSearch, setFSearch] = useState<string>("");

  const loadMoreRef = useRef<HTMLDivElement>(null);
  const LIMIT = 24;

  // ========= Fetch =========
  const buildQuery = useCallback(
    (extra: Record<string, string | number | undefined> = {}) => {
      const qp = new URLSearchParams();
      if (fConcurrent) qp.set("concurrentId", fConcurrent);
      if (fPlateforme) qp.set("plateforme", fPlateforme);
      if (fActive === "active") qp.set("active", "true");
      if (fSearch.trim()) qp.set("search", fSearch.trim());
      qp.set("limit", String(LIMIT));
      for (const [k, v] of Object.entries(extra)) {
        if (v !== undefined) qp.set(k, String(v));
      }
      return qp.toString();
    },
    [fConcurrent, fPlateforme, fActive, fSearch],
  );

  const fetchPubs = useCallback(
    async (reset: boolean) => {
      const q = buildQuery({ offset: reset ? 0 : offset });
      const res = await fetch(`/api/veille/pubs?${q}`);
      if (!res.ok) return;
      const data = await res.json();
      setConcurrents(data.concurrents || []);
      if (reset) {
        setPubs(data.pubs || []);
        setOffset((data.pubs || []).length);
      } else {
        setPubs((prev) => [...prev, ...(data.pubs || [])]);
        setOffset((prev) => prev + (data.pubs || []).length);
      }
      setTotal(data.total || 0);
      setHasMore(!!data.pagination?.hasMore);
      const mostRecentSync = (data.concurrents as Concurrent[])
        .map((c) => c.derniereSync)
        .filter(Boolean)
        .sort()
        .reverse()[0];
      setLastSync(mostRecentSync || null);
    },
    [buildQuery, offset],
  );

  const fetchMots = useCallback(async () => {
    const res = await fetch(`/api/veille/mots-cles?days=90&limit=40`);
    if (!res.ok) return;
    const data = await res.json();
    setMots(data.mots || []);
  }, []);

  // Initial load + refetch quand filtres changent
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setOffset(0);
      await Promise.all([fetchPubs(true), fetchMots()]);
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fConcurrent, fPlateforme, fActive, fSearch]);

  // Infinite scroll
  useEffect(() => {
    if (!hasMore || loadingMore || loading) return;
    const el = loadMoreRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      async (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !loadingMore) {
          setLoadingMore(true);
          await fetchPubs(false);
          setLoadingMore(false);
        }
      },
      { rootMargin: "400px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, fetchPubs]);

  // ========= Actions =========
  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/veille/sync");
      const data = await res.json();
      if (res.ok && data.success) {
        addToast(
          `Sync OK — ${data.pubsNew} nouvelle${data.pubsNew > 1 ? "s" : ""} pub${
            data.pubsNew > 1 ? "s" : ""
          }, ${data.pubsUpdated} mise${data.pubsUpdated > 1 ? "s" : ""} à jour`,
          "success",
        );
        setOffset(0);
        await Promise.all([fetchPubs(true), fetchMots()]);
      } else {
        addToast(data.error || "Erreur de synchronisation", "error");
      }
    } catch {
      addToast("Erreur de connexion", "error");
    }
    setSyncing(false);
  };

  // ========= KPIs =========
  const kpis = useMemo(() => {
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const pubsActives = pubs.filter((p) => p.active).length;
    const nouveaux7j = pubs.filter(
      (p) => new Date(p.dateDebut).getTime() >= sevenDaysAgo,
    ).length;
    const dormants = concurrents.filter((c) => {
      if (!c.derniereSync) return true;
      return new Date(c.derniereSync).getTime() < thirtyDaysAgo;
    }).length;
    return {
      pubsActives,
      nouveaux7j,
      dormants,
      derniereSync: lastSync,
    };
  }, [pubs, concurrents, lastSync]);

  // Plateformes uniques pour le filtre
  const plateformesAvailable = useMemo(() => {
    const set = new Set<string>();
    pubs.forEach((p) => p.plateformes.forEach((pl) => set.add(pl)));
    return Array.from(set).sort();
  }, [pubs]);

  const activeWord = fSearch.trim().toLowerCase() || null;

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* ================================================================ */}
      {/* HEADER                                                           */}
      {/* ================================================================ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: `linear-gradient(135deg, ${MKT_GRADIENT.from}, ${MKT_GRADIENT.to})`,
              boxShadow: `0 4px 14px ${MKT_GRADIENT.shadow}`,
            }}
          >
            <Radar className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-cockpit-primary">
              Veille concurrentielle
            </h1>
            <p className="text-xs sm:text-sm text-cockpit-secondary">
              Pubs Meta Ad Library des concurrents DIMEXOI
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-cockpit-card border border-cockpit text-cockpit-primary hover:border-cockpit-info/20 disabled:opacity-50 transition-all"
          >
            {syncing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {syncing ? "Sync…" : "Synchroniser"}
          </button>
          {isAdmin && (
            <Link
              href="/marketing/veille/concurrents"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{
                background: `linear-gradient(135deg, ${MKT_GRADIENT.from}, ${MKT_GRADIENT.to})`,
                boxShadow: `0 4px 14px ${MKT_GRADIENT.shadow}`,
              }}
            >
              <Settings className="w-4 h-4" />
              Gérer les concurrents
            </Link>
          )}
        </div>
      </div>

      {/* ================================================================ */}
      {/* KPIs                                                             */}
      {/* ================================================================ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          {
            icon: Activity,
            label: "Pubs actives",
            value: String(kpis.pubsActives),
            sub: `sur ${total} total`,
          },
          {
            icon: Sparkles,
            label: "Nouvelles (7j)",
            value: String(kpis.nouveaux7j),
            sub: "derniers 7 jours",
          },
          {
            icon: AlertTriangle,
            label: "Sans activité",
            value: String(kpis.dormants),
            sub: "+ de 30j sans sync",
          },
          {
            icon: Clock,
            label: "Dernière sync",
            value: formatRelative(kpis.derniereSync),
            sub: concurrents.length
              ? `${concurrents.length} concurrent${concurrents.length > 1 ? "s" : ""}`
              : "—",
          },
        ].map((kpi, idx) => (
          <div
            key={idx}
            className="rounded-xl p-3 sm:p-4 flex items-center gap-3 transition-transform duration-200 hover:-translate-y-0.5"
            style={{
              background: `linear-gradient(135deg, ${MKT_GRADIENT.from} 0%, ${MKT_GRADIENT.to} 100%)`,
              boxShadow: `0 4px 14px ${MKT_GRADIENT.shadow}`,
            }}
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
              <kpi.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/75 text-[10px] sm:text-xs font-medium truncate">
                {kpi.label}
              </p>
              <p className="text-lg sm:text-xl font-bold text-white truncate">
                {kpi.value}
              </p>
              <p className="text-white/60 text-[10px] sm:text-xs truncate">
                {kpi.sub}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ================================================================ */}
      {/* WORD CLOUD                                                       */}
      {/* ================================================================ */}
      {!loading && (
        <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-cockpit-primary mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4" style={{ color: MKT_GRADIENT.from }} />
            Mots-clés des 90 derniers jours
            <span className="text-[10px] font-normal text-cockpit-secondary ml-1">
              — clique pour filtrer
            </span>
          </h2>
          <NuageMotsCles
            mots={mots}
            activeWord={activeWord}
            onClick={(mot) =>
              setFSearch((prev) =>
                prev.trim().toLowerCase() === mot ? "" : mot,
              )
            }
          />
        </div>
      )}

      {/* ================================================================ */}
      {/* FILTRES                                                          */}
      {/* ================================================================ */}
      <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 flex-wrap">
        {/* Recherche */}
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cockpit-secondary" />
          <input
            type="text"
            value={fSearch}
            onChange={(e) => setFSearch(e.target.value)}
            placeholder="Rechercher dans le texte des pubs…"
            className="w-full pl-9 pr-9 py-2 rounded-lg bg-cockpit-input border border-cockpit text-sm text-cockpit-primary placeholder:text-cockpit-secondary focus:outline-none focus:ring-2 focus:ring-[#E36887]/30"
          />
          {fSearch && (
            <button
              onClick={() => setFSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-cockpit-secondary hover:text-cockpit-primary"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Concurrent */}
        <select
          value={fConcurrent}
          onChange={(e) => setFConcurrent(e.target.value)}
          className="bg-cockpit-input border border-cockpit rounded-lg px-3 py-2 text-sm text-cockpit-primary focus:outline-none focus:ring-2 focus:ring-[#E36887]/30 min-w-[140px]"
        >
          <option value="">Tous les concurrents</option>
          {concurrents.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nom}
            </option>
          ))}
        </select>

        {/* Plateforme */}
        <select
          value={fPlateforme}
          onChange={(e) => setFPlateforme(e.target.value)}
          className="bg-cockpit-input border border-cockpit rounded-lg px-3 py-2 text-sm text-cockpit-primary focus:outline-none focus:ring-2 focus:ring-[#E36887]/30 min-w-[120px]"
        >
          <option value="">Toutes plateformes</option>
          {plateformesAvailable.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        {/* Active toggle */}
        <div className="flex items-center gap-1 bg-cockpit-dark rounded-lg p-0.5">
          {[
            { v: "active" as const, l: "Actives" },
            { v: "all" as const, l: "Toutes" },
          ].map((o) => (
            <button
              key={o.v}
              onClick={() => setFActive(o.v)}
              className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                fActive === o.v
                  ? "text-white"
                  : "text-cockpit-secondary hover:text-cockpit-primary"
              }`}
              style={
                fActive === o.v
                  ? {
                      background: `linear-gradient(135deg, ${MKT_GRADIENT.from}, ${MKT_GRADIENT.to})`,
                    }
                  : undefined
              }
            >
              {o.l}
            </button>
          ))}
        </div>
      </div>

      {/* ================================================================ */}
      {/* GALLERY                                                          */}
      {/* ================================================================ */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2
            className="w-6 h-6 animate-spin"
            style={{ color: MKT_GRADIENT.from }}
          />
        </div>
      ) : pubs.length === 0 ? (
        <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg p-10 text-center">
          <Radar className="w-10 h-10 text-cockpit-secondary mx-auto mb-3" />
          <p className="text-sm text-cockpit-primary font-medium mb-1">
            Aucune pub trouvée
          </p>
          <p className="text-xs text-cockpit-secondary">
            {total === 0
              ? "Lance une synchronisation pour récupérer les pubs des concurrents."
              : "Essaie d'élargir les filtres."}
          </p>
        </div>
      ) : (
        <>
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
            {pubs.map((p) => (
              <PubCard key={p.id} pub={p} />
            ))}
          </div>

          {/* Infinite scroll trigger */}
          {hasMore && (
            <div
              ref={loadMoreRef}
              className="flex items-center justify-center py-8"
            >
              {loadingMore && (
                <Loader2
                  className="w-5 h-5 animate-spin"
                  style={{ color: MKT_GRADIENT.from }}
                />
              )}
            </div>
          )}

          {!hasMore && pubs.length > 0 && (
            <p className="text-center text-xs text-cockpit-secondary py-4">
              {pubs.length} pub{pubs.length > 1 ? "s" : ""} affichée
              {pubs.length > 1 ? "s" : ""} sur {total}
            </p>
          )}
        </>
      )}
    </div>
  );
}
