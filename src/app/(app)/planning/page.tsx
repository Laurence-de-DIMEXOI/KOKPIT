"use client";

import { useState, useEffect, useCallback } from "react";
import { CalendarDays, LayoutList, Loader2 } from "lucide-react";
import KanbanBoard from "@/components/planning/kanban-board";
import { CalendrierView } from "@/components/planning/CalendrierView";
import PostModal from "@/components/planning/post-modal";
import type { Post } from "@/components/planning/types";

type PlanningVue = "kanban" | "calendrier";

function getInitialView(): PlanningVue {
  if (typeof window === "undefined") return "calendrier";
  return (localStorage.getItem("kokpit_planning_vue") as PlanningVue) || "calendrier";
}

export default function PlanningPage() {
  const [vue, setVue] = useState<PlanningVue>("calendrier");
  const [posts, setPosts] = useState<Post[]>([]);
  const [calendarPosts, setCalendarPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentCalMonth, setCurrentCalMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  // Drawer state for calendar card clicks
  const [modalPost, setModalPost] = useState<Post | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Initialize view from localStorage
  useEffect(() => {
    setVue(getInitialView());
  }, []);

  const switchVue = (v: PlanningVue) => {
    setVue(v);
    localStorage.setItem("kokpit_planning_vue", v);
  };

  // Fetch all posts (for kanban)
  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch("/api/planning");
      const data = await res.json();
      if (data.success) {
        setPosts(data.posts);
      } else {
        setError(data.error || "Erreur chargement");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur réseau");
    }
    setLoading(false);
  }, []);

  // Fetch calendar posts (filtered by month)
  const fetchCalendarPosts = useCallback(async (year: number, month: number) => {
    setCalendarLoading(true);
    setCurrentCalMonth({ year, month });
    try {
      const mois = `${year}-${String(month + 1).padStart(2, "0")}`;
      const res = await fetch(`/api/planning?mois=${mois}`);
      const data = await res.json();
      if (data.success) {
        setCalendarPosts(data.posts);
      }
    } catch (err) {
      console.error("Erreur chargement calendrier:", err);
    }
    setCalendarLoading(false);
  }, []);

  useEffect(() => {
    fetchPosts();
    const now = new Date();
    fetchCalendarPosts(now.getFullYear(), now.getMonth());
  }, [fetchPosts, fetchCalendarPosts]);

  // Auto-passage en POSTE : si un post est programmé sur Facebook et que sa date est passée
  useEffect(() => {
    if (!posts.length) return;
    const now = new Date();
    const toPromote = posts.filter(
      (p) =>
        p.fbPostId &&
        p.scheduledDate &&
        new Date(p.scheduledDate) < now &&
        p.statut !== "POSTE"
    );
    if (!toPromote.length) return;

    Promise.all(
      toPromote.map((p) =>
        fetch(`/api/planning/${p.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ statut: "POSTE" }),
        })
      )
    ).then(() => fetchPosts());
  }, [posts, fetchPosts]);

  const handleCalendarCardClick = (post: Post) => {
    setModalPost(post);
    setModalOpen(true);
  };

  const handleModalSave = async (data: Partial<Post>) => {
    if (!modalPost) return;
    await fetch(`/api/planning/${modalPost.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    await fetchPosts();
    await fetchCalendarPosts(currentCalMonth.year, currentCalMonth.month);
  };

  const handleModalDelete = async (postId: string) => {
    await fetch(`/api/planning/${postId}`, { method: "DELETE" });
    await fetchPosts();
    await fetchCalendarPosts(currentCalMonth.year, currentCalMonth.month);
  };

  const handleRefreshAll = async () => {
    await fetchPosts();
    await fetchCalendarPosts(currentCalMonth.year, currentCalMonth.month);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl" style={{ backgroundColor: "var(--color-active-light)" }}>
            <CalendarDays className="w-6 h-6" style={{ color: "var(--color-active)" }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Planning Réseaux Sociaux</h1>
            <p className="text-sm text-gray-500">
              Planifiez et suivez vos publications sur tous vos réseaux
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">
            {posts.length} post{posts.length > 1 ? "s" : ""}
          </span>

          {/* Toggle vue */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            <button
              onClick={() => switchVue("kanban")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                vue === "kanban"
                  ? "text-white"
                  : "text-gray-500 hover:text-gray-700 bg-white"
              }`}
              style={vue === "kanban" ? { backgroundColor: "var(--color-active)" } : undefined}
            >
              <LayoutList className="w-3.5 h-3.5" />
              Kanban
            </button>
            <button
              onClick={() => switchVue("calendrier")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                vue === "calendrier"
                  ? "text-white"
                  : "text-gray-500 hover:text-gray-700 bg-white"
              }`}
              style={vue === "calendrier" ? { backgroundColor: "var(--color-active)" } : undefined}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              Calendrier
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading && vue === "kanban" ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--color-active)" }} />
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 mb-2">{error}</p>
            <button
              onClick={() => {
                setLoading(true);
                setError(null);
                fetchPosts();
              }}
              className="text-sm hover:underline"
              style={{ color: "var(--color-active)" }}
            >
              Réessayer
            </button>
          </div>
        </div>
      ) : vue === "kanban" ? (
        <KanbanBoard posts={posts} onRefresh={fetchPosts} />
      ) : (
        <CalendrierView
          posts={calendarPosts}
          loading={calendarLoading}
          onCardClick={handleCalendarCardClick}
          onMonthChange={fetchCalendarPosts}
        />
      )}

      {/* Modal for calendar card clicks */}
      {modalOpen && (
        <PostModal
          post={modalPost}
          onClose={() => {
            setModalOpen(false);
            setModalPost(null);
          }}
          onSave={handleModalSave}
          onDelete={handleModalDelete}
          onRefresh={handleRefreshAll}
        />
      )}
    </div>
  );
}
