"use client";

import { useState, useEffect, useRef } from "react";
import { Post, PostStatut, PostLabel, COLUMNS } from "./types";
import LabelPicker from "./label-picker";
import PostChecklist from "./post-checklist";
import FormatSignatureSelector from "./FormatSignatureSelector";
import { X, Trash2, CalendarDays, Upload, ImageIcon, Loader2, CircleCheckBig, Clock, AlertCircle } from "lucide-react";

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
  const [scheduledDate, setScheduledDate] = useState(
    post?.scheduledDate ? new Date(post.scheduledDate).toISOString().slice(0, 10) : ""
  );
  const [coverImage, setCoverImage] = useState(post?.coverImage || "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [formatToast, setFormatToast] = useState("");
  // Facebook scheduling
  const [fbPublishing, setFbPublishing] = useState(false);
  const [fbError, setFbError] = useState("");
  const [fbSuccess, setFbSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Déterminer si un label Anti-IA est actif
  const activeAntiIALabel = labels.includes("VIDEO_REEL" as any)
    ? ("VIDEO_REEL" as const)
    : labels.includes("STORY" as any)
      ? ("STORY" as const)
      : null;

  const handleFormatApply = (titreSuggere: string, descriptionSuggeree: string) => {
    const hasContent = title.trim() || description.trim();
    if (hasContent) {
      const ok = confirm("Écraser le titre et la description existants ?");
      if (!ok) return;
    }
    setTitle(titreSuggere);
    setDescription(descriptionSuggeree);
    setFormatToast("Format appliqué — tu peux modifier le titre");
    setTimeout(() => setFormatToast(""), 3000);
    // Focus sur le titre pour édition immédiate
    setTimeout(() => titleInputRef.current?.focus(), 100);
  };

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  // Compression image via Canvas (réduit à max 1920px, qualité 0.82, max 3MB)
  // Vercel limite les bodies serverless à 4.5MB — on vise 3MB pour avoir de la marge
  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const MAX_PX = 1920;
      const MAX_BYTES = 3 * 1024 * 1024;
      const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";

      // GIF : pas de compression canvas (on laisse passer tel quel)
      if (file.type === "image/gif") return resolve(file);

      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        let { width, height } = img;

        // Réduire si trop grand
        if (width > MAX_PX || height > MAX_PX) {
          const ratio = Math.min(MAX_PX / width, MAX_PX / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, width, height);

        // Qualité progressive si toujours trop lourd
        const tryQuality = (q: number) => {
          canvas.toBlob(
            (blob) => {
              if (!blob) return resolve(file);
              if (blob.size <= MAX_BYTES || q <= 0.4) {
                resolve(new File([blob], `upload.${outputType === "image/png" ? "png" : "jpg"}`, { type: outputType }));
              } else {
                tryQuality(Math.round((q - 0.1) * 10) / 10);
              }
            },
            outputType,
            q
          );
        };
        tryQuality(0.82);
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
      img.src = url;
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError("");
    setUploading(true);

    try {
      // Compression client-side avant upload
      const compressed = await compressImage(file);

      const formData = new FormData();
      formData.append("file", compressed);

      const res = await fetch("/api/planning/upload", {
        method: "POST",
        body: formData,
      });

      // Vérifier le content-type avant de parser en JSON
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const text = await res.text();
        if (res.status === 413 || text.toLowerCase().includes("too large") || text.toLowerCase().includes("entity")) {
          throw new Error("Image trop volumineuse même après compression. Essaie avec une image plus petite.");
        }
        throw new Error(`Erreur serveur (${res.status})`);
      }

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
        scheduledDate: scheduledDate || null,
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

  // Facebook — conditions d'affichage
  // Le post doit être sauvegardé (pour éviter une race condition avec scheduledDate non encore enregistrée)
  const savedScheduledDate = post?.scheduledDate ? new Date(post.scheduledDate) : null;
  const canScheduleToFacebook =
    !!post &&
    !!savedScheduledDate &&
    savedScheduledDate.getTime() > Date.now() + 10 * 60 * 1000 &&
    !!post.description?.trim() &&
    !post.fbPostId;

  const alreadyScheduledOnFb = !!post?.fbPostId;

  const handlePublishFacebook = async () => {
    if (!post || fbPublishing) return;
    setFbError("");
    setFbPublishing(true);
    try {
      const res = await fetch(`/api/planning/${post.id}/publish-facebook`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        setFbSuccess(true);
        onRefresh();
      } else {
        setFbError(data.error || "Erreur lors de la programmation sur Facebook");
      }
    } catch (err: unknown) {
      setFbError(err instanceof Error ? err.message : "Erreur réseau");
    }
    setFbPublishing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-start justify-center sm:pt-16 px-0 sm:px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal — bottom sheet mobile, two-column desktop */}
      <div className="relative bg-white rounded-t-2xl sm:rounded-xl shadow-2xl w-full max-w-2xl lg:max-w-5xl max-h-[85dvh] sm:max-h-[calc(100vh-5rem)] flex flex-col">
        {/* Poignée mobile */}
        <div className="sm:hidden flex justify-center pt-2 pb-0">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between rounded-t-xl shrink-0">
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

        <div className="overflow-y-auto flex-1 min-h-0">
          <div className="flex flex-col lg:flex-row">
            {/* Colonne gauche — Formulaire */}
            <div className="flex-1 px-4 sm:px-6 py-4 sm:py-5 space-y-4 sm:space-y-5 lg:overflow-y-auto lg:min-h-0">

              {/* Image de couverture — visible uniquement sur mobile */}
              <div className="lg:hidden">
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  <ImageIcon className="w-4 h-4 inline mr-1" />
                  Image de couverture
                </label>

                {coverImage ? (
                  <div className="relative group rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                    <img
                      src={coverImage}
                      alt="Couverture"
                      className="w-full max-h-[40vh] object-contain"
                    />
                    <div className="absolute bottom-0 inset-x-0 p-2 flex justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/50 to-transparent">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 bg-white text-gray-700 text-xs font-medium rounded-lg shadow"
                      >
                        Changer
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="px-3 py-1.5 bg-red-500 text-white text-xs font-medium rounded-lg shadow"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full border-2 border-dashed border-gray-300 rounded-lg py-8 flex flex-col items-center gap-2 text-gray-400 hover:border-[var(--color-active)] hover:text-[var(--color-active)] transition-colors cursor-pointer disabled:opacity-50"
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
                        <span className="text-xs">JPG, PNG, WebP — compressé automatiquement</span>
                      </>
                    )}
                  </button>
                )}

                {uploadError && (
                  <p className="text-xs text-red-500 mt-1">{uploadError}</p>
                )}
              </div>

              {/* Titre */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Titre</label>
                <input
                  ref={titleInputRef}
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Post Instagram - Nouvelle collection"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-active)]/50 focus:border-[var(--color-active)]"
                  autoFocus
                />
              </div>

              {/* Colonne + Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Colonne</label>
                  <select
                    value={statut}
                    onChange={(e) => setStatut(e.target.value as PostStatut)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-active)]/50 focus:border-[var(--color-active)] bg-white"
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
                    Date publication
                  </label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-active)]/50 focus:border-[var(--color-active)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Échéance
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-active)]/50 focus:border-[var(--color-active)]"
                  />
                </div>
              </div>

              {/* Labels */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Labels</label>
                <LabelPicker selected={labels} onChange={setLabels} />
              </div>

              {/* Format signature Anti-IA — conditionnel */}
              {activeAntiIALabel && (
                <FormatSignatureSelector
                  labelActif={activeAntiIALabel}
                  onApply={handleFormatApply}
                />
              )}

              {/* Toast format appliqué */}
              {formatToast && (
                <div className="text-xs text-[var(--color-active)] bg-[var(--color-active-light)] border border-[var(--color-active)]/20 rounded-lg px-3 py-2 transition-all duration-200">
                  {formatToast}
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Notes, briefing, texte du post..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-active)]/50 focus:border-[var(--color-active)] resize-y"
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

              {/* Programmation Facebook */}
              {post && (
                <div className="border border-gray-100 rounded-xl p-4 space-y-3 bg-gray-50">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                    {/* Logo Facebook — SVG inline */}
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="#1877F2">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Facebook
                  </p>

                  {alreadyScheduledOnFb || fbSuccess ? (
                    <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2.5">
                      <CircleCheckBig className="w-4 h-4 shrink-0" />
                      <span className="font-medium">Programmé sur Facebook</span>
                      {post.fbScheduledAt && (
                        <span className="text-xs text-green-500 ml-auto">
                          {new Date(post.fbScheduledAt).toLocaleDateString("fr-FR")}
                        </span>
                      )}
                    </div>
                  ) : (
                    <>
                      {/* Message d'aide si conditions non remplies */}
                      {!canScheduleToFacebook && (
                        <p className="text-xs text-gray-400 flex items-start gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          {!post.description?.trim()
                            ? "Ajoute une description et enregistre le post pour pouvoir programmer sur Facebook."
                            : !post.scheduledDate
                            ? "Définis une date de publication et enregistre le post avant de programmer sur Facebook."
                            : "La date de publication doit être au moins 10 minutes dans le futur (enregistre le post après modification)."}
                        </p>
                      )}

                      <button
                        type="button"
                        onClick={handlePublishFacebook}
                        disabled={!canScheduleToFacebook || fbPublishing}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        style={{ backgroundColor: canScheduleToFacebook ? "#1877F2" : "#9CA3AF" }}
                      >
                        {fbPublishing ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Programmation en cours...
                          </>
                        ) : (
                          <>
                            <Clock className="w-4 h-4" />
                            Programmer sur Facebook
                          </>
                        )}
                      </button>

                      {fbError && (
                        <p className="text-xs text-red-500 flex items-start gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          {fbError}
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Colonne droite — Image (desktop uniquement) */}
            <div className="hidden lg:flex lg:flex-col lg:w-[45%] lg:border-l lg:border-gray-100 p-5">
              <label className="block text-sm font-medium text-gray-600 mb-2">
                <ImageIcon className="w-4 h-4 inline mr-1" />
                Image de couverture
              </label>

              {coverImage ? (
                <div className="relative group rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex-1 flex items-center justify-center">
                  <img
                    src={coverImage}
                    alt="Couverture"
                    className="w-full h-full object-contain max-h-[60vh]"
                  />
                  <div className="absolute bottom-0 inset-x-0 p-3 flex justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/50 to-transparent">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-white text-gray-700 text-xs font-medium rounded-lg shadow hover:bg-gray-50"
                    >
                      Changer
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="px-3 py-1.5 bg-red-500 text-white text-xs font-medium rounded-lg shadow hover:bg-red-600"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex-1 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-[var(--color-active)] hover:text-[var(--color-active)] transition-colors cursor-pointer disabled:opacity-50 min-h-[200px]"
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
                <p className="text-xs text-red-500 mt-2">{uploadError}</p>
              )}
            </div>
          </div>
        </div>

        {/* Input file caché (partagé mobile/desktop) */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Footer */}
        <div className="bg-white border-t border-gray-100 px-4 sm:px-6 py-3 sm:py-4 flex justify-end gap-3 rounded-b-xl shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim() || saving || uploading}
            className="px-5 py-2 text-sm font-medium text-gray-900 rounded-lg disabled:opacity-40 transition-colors hover:opacity-90"
            style={{ backgroundColor: 'var(--color-active)' }}
          >
            {saving ? "Enregistrement..." : post ? "Enregistrer" : "Créer le post"}
          </button>
        </div>
      </div>
    </div>
  );
}
