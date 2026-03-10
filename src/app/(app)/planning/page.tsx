"use client";

import { useState, useEffect, useCallback } from "react";
import { CalendarDays, Plus, Loader2 } from "lucide-react";
import KanbanBoard from "@/components/planning/kanban-board";
import { Post } from "@/components/planning/types";

export default function PlanningPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch("/api/planning");
      const data = await res.json();
      if (data.success) {
        setPosts(data.posts);
      } else {
        setError(data.error || "Erreur chargement");
      }
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cockpit-yellow/10">
            <CalendarDays className="w-6 h-6 text-cockpit-yellow" />
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
        </div>
      </div>

      {/* Board */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-cockpit-yellow animate-spin" />
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 mb-2">{error}</p>
            <button
              onClick={() => { setLoading(true); setError(null); fetchPosts(); }}
              className="text-sm text-cockpit-yellow hover:underline"
            >
              Réessayer
            </button>
          </div>
        </div>
      ) : (
        <KanbanBoard posts={posts} onRefresh={fetchPosts} />
      )}
    </div>
  );
}
