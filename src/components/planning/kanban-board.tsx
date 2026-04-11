"use client";

import { useState, useCallback, useMemo } from "react";
import { Post, PostStatut, COLUMNS } from "./types";
import KanbanColumn from "./kanban-column";
import PostModal from "./post-modal";

interface KanbanBoardProps {
  posts: Post[];
  onRefresh: () => void;
}

export default function KanbanBoard({ posts, onRefresh }: KanbanBoardProps) {
  const [dragOverStatut, setDragOverStatut] = useState<PostStatut | null>(null);
  const [draggedPostId, setDraggedPostId] = useState<string | null>(null);
  const [modalPost, setModalPost] = useState<Post | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [createStatut, setCreateStatut] = useState<PostStatut>("IDEE");

  // Group posts by column — memoized
  const postsByColumn = useMemo(() =>
    COLUMNS.reduce((acc, col) => {
      acc[col.statut] = posts
        .filter((p) => p.statut === col.statut)
        .sort((a, b) => {
          // Tri par date de publication décroissante (les plus récentes en haut)
          // Les cartes sans date vont en bas
          const da = a.scheduledDate ? new Date(a.scheduledDate).getTime() : 0;
          const db = b.scheduledDate ? new Date(b.scheduledDate).getTime() : 0;
          if (db !== da) return db - da;
          // Fallback : date de création décroissante
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
      return acc;
    }, {} as Record<PostStatut, Post[]>),
    [posts]);

  // Drag handlers
  const handleDragStart = useCallback((e: React.DragEvent, postId: string) => {
    e.dataTransfer.setData("text/plain", postId);
    e.dataTransfer.effectAllowed = "move";
    setDraggedPostId(postId);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent, targetStatut: PostStatut) => {
      e.preventDefault();
      setDragOverStatut(null);
      setDraggedPostId(null);

      const postId = e.dataTransfer.getData("text/plain");
      if (!postId) return;

      const post = posts.find((p) => p.id === postId);
      if (!post || post.statut === targetStatut) return;

      // Calculate new position (end of target column)
      const targetPosts = postsByColumn[targetStatut] || [];
      const maxPos = targetPosts.length > 0
        ? Math.max(...targetPosts.map((p) => p.position))
        : 0;
      const newPosition = maxPos + 1000;

      try {
        await fetch("/api/planning/reorder", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postId, newStatut: targetStatut, newPosition }),
        });
        onRefresh();
      } catch (err) {
        console.error("Erreur déplacement:", err);
      }
    },
    [posts, postsByColumn, onRefresh]
  );

  const handleDragEnter = useCallback((statut: PostStatut) => {
    setDragOverStatut(statut);
  }, []);

  // Card click → edit modal
  const handleCardClick = useCallback((post: Post) => {
    setModalPost(post);
    setModalOpen(true);
  }, []);

  // Add card in specific column
  const handleAddCard = useCallback((statut: PostStatut) => {
    setModalPost(null);
    setCreateStatut(statut);
    setModalOpen(true);
  }, []);

  // Save (create or update)
  const handleSave = useCallback(
    async (data: Partial<Post>) => {
      if (modalPost) {
        // Update
        await fetch(`/api/planning/${modalPost.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      } else {
        // Create
        await fetch("/api/planning", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...data, statut: data.statut || createStatut }),
        });
      }
      onRefresh();
    },
    [modalPost, createStatut, onRefresh]
  );

  // Delete
  const handleDelete = useCallback(
    async (postId: string) => {
      await fetch(`/api/planning/${postId}`, { method: "DELETE" });
      onRefresh();
    },
    [onRefresh]
  );

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-220px)]">
        {COLUMNS.map((col) => (
          <div
            key={col.statut}
            onDragEnter={() => handleDragEnter(col.statut)}
            onDragLeave={() => {
              if (dragOverStatut === col.statut) setDragOverStatut(null);
            }}
          >
            <KanbanColumn
              statut={col.statut}
              label={col.label}
              icon={col.icon}
              color={col.color}
              posts={postsByColumn[col.statut] || []}
              onCardClick={handleCardClick}
              onAddCard={handleAddCard}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              isDragOver={dragOverStatut === col.statut && draggedPostId !== null}
            />
          </div>
        ))}
      </div>

      {/* Modal */}
      {modalOpen && (
        <PostModal
          post={modalPost}
          defaultStatut={createStatut}
          onClose={() => {
            setModalOpen(false);
            setModalPost(null);
          }}
          onSave={handleSave}
          onDelete={modalPost ? handleDelete : undefined}
          onRefresh={onRefresh}
        />
      )}
    </>
  );
}
