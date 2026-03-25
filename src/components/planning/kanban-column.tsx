"use client";

import { Post, PostStatut, ColumnIcon } from "./types";
import KanbanCard from "./kanban-card";
import {
  Plus,
  Lightbulb,
  PenLine,
  Camera,
  FileCheck,
  Send,
  CircleCheckBig,
  Sparkles,
  Image,
} from "lucide-react";

const ICON_MAP: Record<ColumnIcon, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  Lightbulb,
  PenLine,
  Camera,
  FileCheck,
  Send,
  CircleCheckBig,
  Sparkles,
  Image,
};

interface KanbanColumnProps {
  statut: PostStatut;
  label: string;
  icon: ColumnIcon;
  color: string;
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
  icon,
  color,
  posts,
  onCardClick,
  onAddCard,
  onDragStart,
  onDragOver,
  onDrop,
  isDragOver,
}: KanbanColumnProps) {
  const IconComponent = ICON_MAP[icon];

  return (
    <div
      className={`flex flex-col min-w-[280px] max-w-[280px] rounded-xl transition-colors ${
        isDragOver ? "bg-[#838F58]/5 ring-2 ring-[#838F58]" : "bg-[#F4F5F7]"
      }`}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, statut)}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center"
            style={{ backgroundColor: color + "18" }}
          >
            <IconComponent className="w-3.5 h-3.5" style={{ color }} />
          </div>
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
