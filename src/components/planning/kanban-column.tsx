"use client";

import { Post, PostStatut } from "./types";
import KanbanCard from "./kanban-card";
import { Plus } from "lucide-react";

interface KanbanColumnProps {
  statut: PostStatut;
  label: string;
  emoji: string;
  posts: Post[];
  onCardClick: (post: Post) => void;
  onAddCard: (statut: PostStatut) => void;
  onDragStart: (e: React.DragEvent, postId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, statut: PostStatut) => void;
  isDragOver: boolean;
}

export default function KanbanColumn({
  statut,
  label,
  emoji,
  posts,
  onCardClick,
  onAddCard,
  onDragStart,
  onDragOver,
  onDrop,
  isDragOver,
}: KanbanColumnProps) {
  return (
    <div
      className={`flex flex-col min-w-[280px] max-w-[280px] rounded-xl transition-colors ${
        isDragOver ? "bg-yellow-50 ring-2 ring-cockpit-yellow" : "bg-[#F4F5F7]"
      }`}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, statut)}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-base">{emoji}</span>
          <h3 className="text-sm font-semibold text-gray-700">{label}</h3>
          <span className="text-xs font-medium text-gray-400 bg-gray-200 rounded-full px-2 py-0.5">
            {posts.length}
          </span>
        </div>
        <button
          onClick={() => onAddCard(statut)}
          className="p-1 rounded-md hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
          title={`Ajouter dans ${label}`}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-2 px-2 pb-2 overflow-y-auto flex-1 min-h-[100px]">
        {posts.map((post) => (
          <KanbanCard
            key={post.id}
            post={post}
            onClick={() => onCardClick(post)}
            onDragStart={onDragStart}
          />
        ))}
      </div>
    </div>
  );
}
