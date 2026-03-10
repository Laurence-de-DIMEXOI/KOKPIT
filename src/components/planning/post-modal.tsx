"use client";

import { useState, useEffect } from "react";
import { Post, PostStatut, PostLabel, COLUMNS } from "./types";
import LabelPicker from "./label-picker";
import PostChecklist from "./post-checklist";
import { X, Trash2, CalendarDays } from "lucide-react";

interface PostModalProps {
  post: Post | null; // null = création
  defaultStatut?: PostStatut;
  onClose: () => void;
  onSave: (data: Partial<Post>) => Promise<void>;
  onDelete?: (postId: string) => Promise<void>;
  onRefresh: () => void;
}

export default function PostModal({
  post,
  defaultStatut,
  onClose,
  onSave,
  onDelete,
  onRefresh,
}: PostModalProps) {
  const [title, setTitle] = useState(post?.title || "");
  const [description, setDescription] = useState(post?.description || "");
  const [statut, setStatut] = useState<PostStatut>(post?.statut || defaultStatut || "IDEE");
  const [labels, setLabels] = useState<PostLabel[]>(post?.labels || []);
  const [dueDate, setDueDate] = useState(
    post?.dueDate ? new Date(post.dueDate).toISOString().slice(0, 10) : ""
  );
  const [coverImage, setCoverImage] = useState(post?.coverImage || "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const handleSave = async () => {
    if (!title.trim() || saving) return;
    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim() || null,
        statut,
        labels,
        dueDate: dueDate || null,
        coverImage: coverImage.trim() || null,
      });
      onClose();
    } catch (err) {
      console.error("Erreur sauvegarde:", err);
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!post || !onDelete || deleting) return;
    if (!confirm("Supprimer ce post ?")) return;
    setDeleting(true);
    try {
      await onDelete(post.id);
      onClose();
    } catch (err) {
      console.error("Erreur suppression:", err);
    }
    setDeleting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-xl z-10">
          <h2 className="text-lg font-bold text-gray-800">
            {post ? "Modifier le post" : "Nouveau post"}
          </h2>
          <div className="flex items-center gap-2">
            {post && onDelete && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                title="Supprimer"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Titre */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Titre</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Post Instagram - Nouvelle collection"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cockpit-yellow/50 focus:border-cockpit-yellow"
              autoFocus
            />
          </div>

          {/* Colonne (statut) */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Colonne</label>
            <select
              value={statut}
              onChange={(e) => setStatut(e.target.value as PostStatut)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cockpit-yellow/50 focus:border-cockpit-yellow bg-white"
            >
              {COLUMNS.map((col) => (
                <option key={col.statut} value={col.statut}>
                  {col.emoji} {col.label}
                </option>
              ))}
            </select>
          </div>

          {/* Labels */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Plateformes / Labels</label>
            <LabelPicker selected={labels} onChange={setLabels} />
          </div>

          {/* Date + Cover side by side */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                <CalendarDays className="w-4 h-4 inline mr-1" />
                Date d&apos;échéance
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cockpit-yellow/50 focus:border-cockpit-yellow"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Image couverture (URL)
              </label>
              <input
                type="url"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="https://..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cockpit-yellow/50 focus:border-cockpit-yellow"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Notes, briefing, texte du post..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cockpit-yellow/50 focus:border-cockpit-yellow resize-y"
            />
          </div>

          {/* Checklist (only for existing posts) */}
          {post && (
            <PostChecklist
              postId={post.id}
              items={post.checklist}
              onUpdate={onRefresh}
            />
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-end gap-3 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim() || saving}
            className="px-5 py-2 text-sm font-medium text-white bg-cockpit-yellow hover:bg-yellow-500 rounded-lg disabled:opacity-40 transition-colors"
          >
            {saving ? "Enregistrement..." : post ? "Enregistrer" : "Créer le post"}
          </button>
        </div>
      </div>
    </div>
  );
}
