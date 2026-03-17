"use client";

import { Post, LABEL_CONFIG } from "./types";
import { CalendarDays, CheckSquare, Paperclip, GripVertical } from "lucide-react";

interface KanbanCardProps {
  post: Post;
  onClick: () => void;
  onDragStart: (e: React.DragEvent, postId: string) => void;
}

function getDueDateInfo(dueDate: string | null) {
  if (!dueDate) return null;
  const due = new Date(dueDate);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  const formatted = due.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

  if (diffDays < 0) return { text: formatted, className: "text-red-600 bg-red-50" };
  if (diffDays <= 3) return { text: formatted, className: "text-orange-600 bg-orange-50" };
  return { text: formatted, className: "text-gray-500 bg-gray-100" };
}

export default function KanbanCard({ post, onClick, onDragStart }: KanbanCardProps) {
  const dueDateInfo = getDueDateInfo(post.dueDate);
  const checkedCount = post.checklist.filter((c) => c.checked).length;
  const totalChecklist = post.checklist.length;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, post.id)}
      onClick={onClick}
      className="bg-white rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow group"
    >
      {/* Cover image — affichage complet sans recadrage */}
      {post.coverImage && (
        <div className="w-full overflow-hidden rounded-t-lg bg-gray-50">
          <img
            src={post.coverImage}
            alt=""
            className="w-full object-contain max-h-48"
          />
        </div>
      )}

      <div className="p-3">
        {/* Labels */}
        {post.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {post.labels.map((label) => {
              const config = LABEL_CONFIG[label];
              return (
                <span
                  key={label}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ color: config.color, backgroundColor: config.bg }}
                >
                  {config.name}
                </span>
              );
            })}
          </div>
        )}

        {/* Title */}
        <div className="flex items-start gap-1">
          <GripVertical className="w-4 h-4 text-gray-300 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          <h4 className="text-sm font-medium text-gray-800 leading-snug flex-1">
            {post.title}
          </h4>
        </div>

        {/* Badges row */}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {/* Due date */}
          {dueDateInfo && (
            <span className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded ${dueDateInfo.className}`}>
              <CalendarDays className="w-3 h-3" />
              {dueDateInfo.text}
            </span>
          )}

          {/* Checklist badge */}
          {totalChecklist > 0 && (
            <span
              className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded ${
                checkedCount === totalChecklist
                  ? "text-green-600 bg-green-50"
                  : "text-gray-500 bg-gray-100"
              }`}
            >
              <CheckSquare className="w-3 h-3" />
              {checkedCount}/{totalChecklist}
            </span>
          )}

          {/* Attachments count */}
          {post.attachments.length > 0 && (
            <span className="inline-flex items-center gap-1 text-xs text-gray-400">
              <Paperclip className="w-3 h-3" />
              {post.attachments.length}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
