"use client";

import { useState } from "react";
import { ChecklistItem } from "./types";
import { Plus, Trash2 } from "lucide-react";

interface PostChecklistProps {
  postId: string;
  items: ChecklistItem[];
  onUpdate: () => void;
}

export default function PostChecklist({ postId, items, onUpdate }: PostChecklistProps) {
  const [newText, setNewText] = useState("");
  const [loading, setLoading] = useState(false);

  const addItem = async () => {
    if (!newText.trim() || loading) return;
    setLoading(true);
    try {
      await fetch(`/api/planning/${postId}/checklist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newText.trim() }),
      });
      setNewText("");
      onUpdate();
    } catch (err) {
      console.error("Erreur ajout checklist:", err);
    }
    setLoading(false);
  };

  const toggleItem = async (item: ChecklistItem) => {
    try {
      await fetch(`/api/planning/${postId}/checklist`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.id, checked: !item.checked }),
      });
      onUpdate();
    } catch (err) {
      console.error("Erreur toggle checklist:", err);
    }
  };

  const deleteItem = async (itemId: string) => {
    try {
      await fetch(`/api/planning/${postId}/checklist?itemId=${itemId}`, {
        method: "DELETE",
      });
      onUpdate();
    } catch (err) {
      console.error("Erreur suppression checklist:", err);
    }
  };

  const checkedCount = items.filter((i) => i.checked).length;
  const progress = items.length > 0 ? Math.round((checkedCount / items.length) * 100) : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-700">Checklist</h4>
        {items.length > 0 && (
          <span className="text-xs text-gray-500">{checkedCount}/{items.length}</span>
        )}
      </div>

      {/* Progress bar */}
      {items.length > 0 && (
        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              progress === 100 ? "bg-green-500" : "bg-[#C2185B]"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Items */}
      <div className="space-y-1">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-2 group">
            <input
              type="checkbox"
              checked={item.checked}
              onChange={() => toggleItem(item)}
              className="w-4 h-4 rounded border-gray-300 text-[#C2185B] focus:ring-[#C2185B] cursor-pointer"
            />
            <span
              className={`flex-1 text-sm ${
                item.checked ? "line-through text-gray-400" : "text-gray-700"
              }`}
            >
              {item.text}
            </span>
            <button
              onClick={() => deleteItem(item.id)}
              className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Add item */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addItem()}
          placeholder="Ajouter un élément..."
          className="flex-1 text-sm border border-gray-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#C2185B]"
        />
        <button
          onClick={addItem}
          disabled={!newText.trim() || loading}
          className="p-1.5 rounded-md bg-[#C2185B] text-white hover:bg-[#A01248] disabled:opacity-40 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
