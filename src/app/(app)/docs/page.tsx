"use client";

import { useState, useEffect, useMemo } from "react";
import {
  BookOpen,
  Search,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  Loader2,
  FileText,
  Briefcase,
  BarChart3,
  Building2,
  Rocket,
  Sparkles,
} from "lucide-react";
import clsx from "clsx";

interface DocArticleSummary {
  id: string;
  titre: string;
  slug: string;
  categorie: string;
  position: number;
  updatedAt: string;
}

interface DocArticleFull {
  id: string;
  titre: string;
  slug: string;
  contenu: string;
  categorie: string;
  position: number;
  updatedAt: string;
}

// Icônes et couleurs par catégorie
const CATEGORY_CONFIG: Record<
  string,
  { icon: React.ComponentType<{ className?: string }>; color: string; bg: string }
> = {
  "Prise en main": {
    icon: Rocket,
    color: "text-cockpit-yellow",
    bg: "bg-cockpit-yellow/10",
  },
  Commercial: {
    icon: Briefcase,
    color: "text-cockpit-info",
    bg: "bg-cockpit-info/10",
  },
  Marketing: {
    icon: BarChart3,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
  Administration: {
    icon: Building2,
    color: "text-cockpit-success",
    bg: "bg-cockpit-success/10",
  },
};

// Ordre des catégories
const CATEGORY_ORDER = [
  "Prise en main",
  "Commercial",
  "Marketing",
  "Administration",
];

// Rendu Markdown simplifié (pas de dépendance externe)
function renderMarkdown(md: string): string {
  let html = md
    // Headers
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-bold text-[#1F2937] mt-6 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold text-[#1F2937] mt-8 mb-3">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold text-[#1F2937] mt-8 mb-4">$1</h1>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-[#1F2937]">$1</strong>')
    // Lists
    .replace(/^- (.+)$/gm, '<li class="ml-4 text-[#4B5563] leading-relaxed">$1</li>')
    // Numbered lists
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 text-[#4B5563] leading-relaxed"><span class="font-semibold text-[#1F2937]">$1.</span> $2</li>')
    // Paragraphs (lines that aren't already HTML)
    .replace(/^(?!<[hl]|<li)(.+)$/gm, '<p class="text-[#4B5563] leading-relaxed mb-3">$1</p>')
    // Wrap consecutive <li> in <ul>
    .replace(/(<li[^>]*>.*?<\/li>\n?)+/g, (match) => `<ul class="space-y-1.5 mb-4 list-disc">${match}</ul>`);

  return html;
}

export default function DocsPage() {
  const [articles, setArticles] = useState<DocArticleSummary[]>([]);
  const [categories, setCategories] = useState<Record<string, DocArticleSummary[]>>({});
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [currentArticle, setCurrentArticle] = useState<DocArticleFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [articleLoading, setArticleLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set(CATEGORY_ORDER));
  const [seeding, setSeeding] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Fetch articles list
  const fetchArticles = async () => {
    try {
      const res = await fetch("/api/docs");
      const data = await res.json();
      setArticles(data.articles || []);
      setCategories(data.categories || {});
    } catch (err) {
      console.error("Erreur chargement docs:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch single article
  const fetchArticle = async (slug: string) => {
    setArticleLoading(true);
    setMobileSidebarOpen(false);
    try {
      const res = await fetch(`/api/docs/${slug}`);
      const data = await res.json();
      setCurrentArticle(data);
      setSelectedSlug(slug);
    } catch (err) {
      console.error("Erreur chargement article:", err);
    } finally {
      setArticleLoading(false);
    }
  };

  // Seed articles
  const handleSeed = async () => {
    setSeeding(true);
    try {
      await fetch("/api/docs/seed", { method: "POST" });
      await fetchArticles();
    } catch (err) {
      console.error("Erreur seed:", err);
    } finally {
      setSeeding(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  // Auto-select first article
  useEffect(() => {
    if (articles.length > 0 && !selectedSlug) {
      fetchArticle(articles[0].slug);
    }
  }, [articles, selectedSlug]);

  // Filter articles by search
  const filteredCategories = useMemo(() => {
    if (!search.trim()) return categories;

    const q = search.toLowerCase();
    const filtered: Record<string, DocArticleSummary[]> = {};

    for (const [cat, arts] of Object.entries(categories)) {
      const matching = arts.filter(
        (a) =>
          a.titre.toLowerCase().includes(q) ||
          cat.toLowerCase().includes(q)
      );
      if (matching.length > 0) {
        filtered[cat] = matching;
      }
    }

    return filtered;
  }, [categories, search]);

  // Sorted categories
  const sortedCategories = useMemo(() => {
    return Object.keys(filteredCategories).sort(
      (a, b) =>
        (CATEGORY_ORDER.indexOf(a) === -1 ? 99 : CATEGORY_ORDER.indexOf(a)) -
        (CATEGORY_ORDER.indexOf(b) === -1 ? 99 : CATEGORY_ORDER.indexOf(b))
    );
  }, [filteredCategories]);

  // Toggle category
  const toggleCategory = (cat: string) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  };

  // Breadcrumb
  const breadcrumb = currentArticle
    ? [
        { label: "Documentation", action: () => {} },
        { label: currentArticle.categorie, action: () => {} },
        { label: currentArticle.titre, action: null },
      ]
    : [];

  // Skeleton
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-4 w-64 bg-gray-200 rounded mt-2 animate-pulse" />
          </div>
        </div>
        <div className="flex gap-6">
          <div className="w-72 flex-shrink-0 space-y-3">
            <div className="h-10 bg-gray-200 rounded-lg animate-pulse" />
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-8 bg-gray-200 rounded animate-pulse"
              />
            ))}
          </div>
          <div className="flex-1 space-y-4">
            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (articles.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-cockpit-heading mb-1">
            Documentation
          </h1>
          <p className="text-cockpit-secondary text-sm">
            Aide et guides d&apos;utilisation KOKPIT
          </p>
        </div>
        <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg p-12 text-center">
          <BookOpen className="w-12 h-12 text-cockpit-secondary mx-auto mb-4 opacity-40" />
          <p className="text-cockpit-heading font-semibold mb-2">
            Aucun article de documentation
          </p>
          <p className="text-cockpit-secondary text-sm mb-6">
            Les articles d&apos;aide ne sont pas encore configures.
          </p>
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="inline-flex items-center gap-2 bg-cockpit-yellow text-gray-900 px-6 py-2.5 rounded-lg font-semibold hover:bg-cockpit-yellow/90 transition-colors disabled:opacity-50"
          >
            {seeding ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Initialiser la documentation
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-cockpit-heading mb-1">
            Documentation
          </h1>
          <p className="text-cockpit-secondary text-sm">
            {articles.length} article{articles.length > 1 ? "s" : ""} d&apos;aide
          </p>
        </div>
        {/* Mobile sidebar toggle */}
        <button
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="sm:hidden flex items-center gap-2 bg-cockpit-card border border-cockpit px-4 py-2.5 rounded-lg font-semibold text-sm"
        >
          <BookOpen className="w-4 h-4" />
          Sommaire
        </button>
      </div>

      {/* Breadcrumb */}
      {breadcrumb.length > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-cockpit-secondary">
          {breadcrumb.map((item, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight className="w-3 h-3" />}
              <span
                className={clsx(
                  i < breadcrumb.length - 1
                    ? "hover:text-cockpit-heading cursor-pointer"
                    : "text-cockpit-heading font-medium"
                )}
              >
                {item.label}
              </span>
            </span>
          ))}
        </div>
      )}

      {/* Main layout */}
      <div className="flex gap-6">
        {/* Sidebar — categories + articles */}
        <aside
          className={clsx(
            "flex-shrink-0 w-full sm:w-72",
            // Mobile: toggle
            mobileSidebarOpen ? "block" : "hidden sm:block"
          )}
        >
          <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg p-4 sticky top-6">
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cockpit-secondary" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-cockpit border border-cockpit rounded-lg text-sm text-cockpit-heading placeholder:text-cockpit-secondary focus:outline-none focus:ring-2 focus:ring-cockpit-yellow/30 focus:border-cockpit-yellow"
              />
            </div>

            {/* Categories */}
            <nav className="space-y-1">
              {sortedCategories.map((cat) => {
                const config = CATEGORY_CONFIG[cat] || {
                  icon: FileText,
                  color: "text-cockpit-secondary",
                  bg: "bg-gray-100",
                };
                const CatIcon = config.icon;
                const isExpanded = expandedCats.has(cat);
                const catArticles = filteredCategories[cat] || [];

                return (
                  <div key={cat}>
                    <button
                      onClick={() => toggleCategory(cat)}
                      className="flex items-center gap-2 w-full px-2 py-2 rounded-lg hover:bg-cockpit-dark/80 transition-colors text-left"
                    >
                      <div
                        className={clsx(
                          "w-6 h-6 rounded flex items-center justify-center flex-shrink-0",
                          config.bg
                        )}
                      >
                        <CatIcon className={clsx("w-3.5 h-3.5", config.color)} />
                      </div>
                      <span className="text-sm font-semibold text-[#1F2937] flex-1">
                        {cat}
                      </span>
                      <span className="text-[10px] text-cockpit-secondary bg-cockpit px-1.5 py-0.5 rounded-full">
                        {catArticles.length}
                      </span>
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5 text-cockpit-secondary" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-cockpit-secondary" />
                      )}
                    </button>

                    {isExpanded && (
                      <ul className="ml-3 border-l border-cockpit pl-3 space-y-0.5 pb-2">
                        {catArticles.map((article) => (
                          <li key={article.slug}>
                            <button
                              onClick={() => fetchArticle(article.slug)}
                              className={clsx(
                                "w-full text-left px-2 py-1.5 rounded text-sm transition-colors",
                                selectedSlug === article.slug
                                  ? "bg-cockpit-yellow/10 text-cockpit-yellow font-medium"
                                  : "text-[#4B5563] hover:text-[#1F2937] hover:bg-cockpit-dark/60"
                              )}
                            >
                              {article.titre}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Article content */}
        <main className={clsx(
          "flex-1 min-w-0",
          mobileSidebarOpen && "hidden sm:block"
        )}>
          {articleLoading ? (
            <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg p-8">
              <div className="animate-pulse space-y-4">
                <div className="h-7 w-2/3 bg-gray-200 rounded" />
                <div className="h-4 w-full bg-gray-200 rounded" />
                <div className="h-4 w-5/6 bg-gray-200 rounded" />
                <div className="h-4 w-3/4 bg-gray-200 rounded" />
                <div className="h-6 w-1/3 bg-gray-200 rounded mt-6" />
                <div className="h-4 w-full bg-gray-200 rounded" />
                <div className="h-4 w-4/5 bg-gray-200 rounded" />
              </div>
            </div>
          ) : currentArticle ? (
            <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg p-6 sm:p-8">
              {/* Article header */}
              <div className="mb-6 pb-4 border-b border-cockpit">
                <div className="flex items-center gap-2 mb-2">
                  {(() => {
                    const config =
                      CATEGORY_CONFIG[currentArticle.categorie] || {
                        icon: FileText,
                        color: "text-cockpit-secondary",
                        bg: "bg-gray-100",
                      };
                    const CatIcon = config.icon;
                    return (
                      <span
                        className={clsx(
                          "inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full",
                          config.bg,
                          config.color
                        )}
                      >
                        <CatIcon className="w-3 h-3" />
                        {currentArticle.categorie}
                      </span>
                    );
                  })()}
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-[#1F2937]">
                  {currentArticle.titre}
                </h1>
                <p className="text-xs text-cockpit-secondary mt-2">
                  Mis a jour le{" "}
                  {new Date(currentArticle.updatedAt).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>

              {/* Article body */}
              <div
                className="prose-kokpit"
                dangerouslySetInnerHTML={{
                  __html: renderMarkdown(currentArticle.contenu),
                }}
              />
            </div>
          ) : (
            <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg p-12 text-center">
              <BookOpen className="w-10 h-10 text-cockpit-secondary mx-auto mb-3 opacity-40" />
              <p className="text-cockpit-secondary text-sm">
                Selectionnez un article dans le menu
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
