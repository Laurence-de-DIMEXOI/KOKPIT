"use client";

import { useState, useEffect, useRef } from "react";
import { Post, PostStatut, PostLabel, COLUMNS } from "./types";
import LabelPicker from "./label-picker";
import PostChecklist from "./post-checklist";
import { X, Trash2, CalendarDays, Upload, ImageIcon, Loader2 } from "lucide-react";

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
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError("");
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/planning/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        setCoverImage(data.url);
      } else {
        setUploadError(data.error || "Erreur lors de l'upload");
      }
    } catch (err: any) {
      setUploadError(err.message || "Erreur réseau");
    }

    setUploading(false);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveImage = () => {
    setCoverImage("");
  };

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
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[calc(100vh-5rem)] flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-xl shrink-0">
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

        <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1 min-h-0">
          {/* Image de couverture */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              <ImageIcon className="w-4 h-4 inline mr-1" />
              Image de couverture
            </label>

            {coverImage ? (
              /* Preview de l'image */
              <div className="relative group rounded-lg overflow-hidden border border-gray-200">
                <img
                  src={coverImage}
                  alt="Couverture"
                  className="w-full h-44 object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="opacity-0 group-hover:opacity-100 px-3 py-1.5 bg-white text-gray-700 text-xs font-medium rounded-lg shadow transition-opacity"
                  >
                    Changer
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="opacity-0 group-hover:opacity-100 px-3 py-1.5 bg-red-500 text-white text-xs font-medium rounded-lg shadow transition-opacity"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ) : (
              /* Zone d'upload */
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full border-2 border-dashed border-gray-300 rounded-lg py-8 flex flex-col items-center gap-2 text-gray-400 hover:border-cockpit-yellow hover:text-cockpit-yellow transition-colors cursor-pointer disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <span className="text-sm">Upload en cours...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8" />
                    <span className="text-sm font-medium">Cliquez pour choisir une image</span>
                    <span className="text-xs">JPG, PNG, WebP ou GIF — 5 Mo max</span>
                  </>
                )}
              </button>
            )}

            {uploadError && (
              <p className="text-xs text-red-500 mt-1">{uploadError}</p>
            )}

            {/* Input file caché */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

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

          {/* Colonne (statut) + Date côte à côte */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Colonne</label>
              <select
                value={statut}
                onChange={(e) => setStatut(e.target.value as PostStatut)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cockpit-yellow/50 focus:border-cockpit-yellow bg-white"
              >
                {COLUMNS.map((col) => (
                  <option key={col.statut} value={col.statut}>
                    {col.label}
                  </option>
                ))}
              </select>
            </div>
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
          </div>

          {/* Labels */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Labels</label>
            <LabelPicker selected={labels} onChange={setLabels} />
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
        <div className="bg-white border-t border-gray-100 px-6 py-4 flex justify-end gap-3 rounded-b-xl shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim() || saving || uploading}
            className="px-5 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-40 transition-colors hover:opacity-90"
            style={{ backgroundColor: 'var(--color-active)' }}
          >
            {saving ? "Enregistrement..." : post ? "Enregistrer" : "Créer le post"}
          </button>
        </div>
      </div>
    </div>
  );
}
