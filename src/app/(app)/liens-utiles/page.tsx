"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Link2,
  Plus,
  ExternalLink,
  Pencil,
  Trash2,
  GripVertical,
  Loader2,
  X,
  Globe,
} from "lucide-react";
import clsx from "clsx";

interface LienUtile {
  id: string;
  nom: string;
  url: string;
  description: string | null;
  categorie: string;
  iconeUrl: string | null;
  position: number;
}

const CATEGORIES = [
  "CRM",
  "Réseaux sociaux",
  "CMS",
  "Outils internes",
  "Analytics",
  "Autre",
];

function getFaviconUrl(url: string): string {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch {
    return "";
  }
}

export default function LiensUtilesPage() {
  const [liens, setLiens] = useState<LienUtile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLien, setEditingLien] = useState<LienUtile | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formNom, setFormNom] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCategorie, setFormCategorie] = useState(CATEGORIES[0]);
  const [formIconeUrl, setFormIconeUrl] = useState("");

  // Drag state
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const fetchLiens = useCallback(async () => {
    try {
      const res = await fetch("/api/liens-utiles");
      const data = await res.json();
      setLiens(data.liens || []);
    } catch (err) {
      console.error("Erreur chargement liens:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLiens();
  }, [fetchLiens]);

  // Group by category
  const grouped = liens.reduce<Record<string, LienUtile[]>>((acc, lien) => {
    if (!acc[lien.categorie]) acc[lien.categorie] = [];
    acc[lien.categorie].push(lien);
    return acc;
  }, {});

  const openCreateModal = () => {
    setEditingLien(null);
    setFormNom("");
    setFormUrl("");
    setFormDescription("");
    setFormCategorie(CATEGORIES[0]);
    setFormIconeUrl("");
    setShowModal(true);
  };

  const openEditModal = (lien: LienUtile) => {
    setEditingLien(lien);
    setFormNom(lien.nom);
    setFormUrl(lien.url);
    setFormDescription(lien.description || "");
    setFormCategorie(lien.categorie);
    setFormIconeUrl(lien.iconeUrl || "");
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formNom || !formUrl || !formCategorie) return;
    setSaving(true);

    try {
      const payload = {
        nom: formNom,
        url: formUrl,
        description: formDescription || null,
        categorie: formCategorie,
        iconeUrl: formIconeUrl || null,
      };

      if (editingLien) {
        await fetch(`/api/liens-utiles/${editingLien.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/liens-utiles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      setShowModal(false);
      fetchLiens();
    } catch (err) {
      console.error("Erreur sauvegarde:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce lien ?")) return;
    try {
      await fetch(`/api/liens-utiles/${id}`, { method: "DELETE" });
      fetchLiens();
    } catch (err) {
      console.error("Erreur suppression:", err);
    }
  };

  // Drag & drop within same category
  const handleDragStart = (id: string) => {
    setDragId(id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    setDragOverId(id);
  };

  const handleDrop = async (targetId: string) => {
    if (!dragId || dragId === targetId) {
      setDragId(null);
      setDragOverId(null);
      return;
    }

    const dragItem = liens.find((l) => l.id === dragId);
    const targetItem = liens.find((l) => l.id === targetId);
    if (!dragItem || !targetItem || dragItem.categorie !== targetItem.categorie)
      return;

    const cat = dragItem.categorie;
    const catItems = [...(grouped[cat] || [])];
    const fromIdx = catItems.findIndex((l) => l.id === dragId);
    const toIdx = catItems.findIndex((l) => l.id === targetId);

    catItems.splice(fromIdx, 1);
    catItems.splice(toIdx, 0, dragItem);

    const reordered = catItems.map((item, i) => ({
      ...item,
      position: i,
    }));

    // Optimistic update
    setLiens((prev) =>
      prev.map((l) => {
        const updated = reordered.find((r) => r.id === l.id);
        return updated || l;
      })
    );

    setDragId(null);
    setDragOverId(null);

    try {
      await fetch("/api/liens-utiles/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: reordered.map((r) => ({ id: r.id, position: r.position })),
        }),
      });
    } catch (err) {
      console.error("Erreur réordonnancement:", err);
      fetchLiens();
    }
  };

  // Auto-fetch favicon when URL changes
  useEffect(() => {
    if (formUrl && !formIconeUrl) {
      const favicon = getFaviconUrl(formUrl);
      if (favicon) setFormIconeUrl(favicon);
    }
  }, [formUrl, formIconeUrl]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#E36887]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E36887]/15 flex items-center justify-center">
            <Link2 className="w-5 h-5 text-[#E36887]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-cockpit-heading">
              Liens utiles
            </h1>
            <p className="text-sm text-cockpit-secondary">
              Accès rapide à vos outils et plateformes
            </p>
          </div>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-gray-900 font-medium text-sm hover:opacity-90 transition-colors"
          style={{ backgroundColor: 'var(--color-active)' }}
        >
          <Plus className="w-4 h-4" />
          Ajouter un lien
        </button>
      </div>

      {/* Links by category */}
      {Object.keys(grouped).length === 0 ? (
        <div className="bg-cockpit-card rounded-card border border-cockpit p-12 text-center">
          <Globe className="w-12 h-12 text-cockpit-secondary/40 mx-auto mb-3" />
          <p className="text-cockpit-secondary">Aucun lien pour le moment.</p>
          <button
            onClick={openCreateModal}
            className="mt-4 text-[#E36887] font-medium text-sm hover:underline"
          >
            Ajouter votre premier lien
          </button>
        </div>
      ) : (
        Object.entries(grouped).map(([categorie, catLiens]) => (
          <div key={categorie}>
            <h2 className="text-sm font-semibold text-cockpit-secondary uppercase tracking-wider mb-3">
              {categorie}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {catLiens.map((lien) => (
                <div
                  key={lien.id}
                  draggable
                  onDragStart={() => handleDragStart(lien.id)}
                  onDragOver={(e) => handleDragOver(e, lien.id)}
                  onDrop={() => handleDrop(lien.id)}
                  onDragEnd={() => {
                    setDragId(null);
                    setDragOverId(null);
                  }}
                  className={clsx(
                    "group bg-cockpit-card rounded-card border border-cockpit p-4 hover:shadow-cockpit-lg transition-all cursor-grab active:cursor-grabbing",
                    dragOverId === lien.id &&
                      dragId !== lien.id &&
                      "border-[#E36887]/50 bg-[#E36887]/5"
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* Grip handle */}
                    <div className="mt-0.5 text-cockpit-secondary/30 group-hover:text-cockpit-secondary/60 transition-colors">
                      <GripVertical className="w-4 h-4" />
                    </div>

                    {/* Favicon */}
                    <div className="w-8 h-8 rounded-lg bg-cockpit-dark/50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {lien.iconeUrl ? (
                        <img
                          src={lien.iconeUrl}
                          alt=""
                          className="w-5 h-5"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              "none";
                          }}
                        />
                      ) : (
                        <Globe className="w-4 h-4 text-cockpit-secondary" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-cockpit-heading truncate">
                        {lien.nom}
                      </h3>
                      {lien.description && (
                        <p className="text-xs text-cockpit-secondary mt-0.5 line-clamp-2">
                          {lien.description}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a
                        href={lien.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-md hover:bg-cockpit-dark/80 text-cockpit-secondary hover:text-[#E8899F] transition-colors"
                        title="Ouvrir"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <button
                        onClick={() => openEditModal(lien)}
                        className="p-1.5 rounded-md hover:bg-cockpit-dark/80 text-cockpit-secondary hover:text-cockpit-heading transition-colors"
                        title="Modifier"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(lien.id)}
                        className="p-1.5 rounded-md hover:bg-cockpit-danger/10 text-cockpit-secondary hover:text-cockpit-danger transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Modal Add/Edit */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-cockpit shrink-0">
              <h2 className="text-lg font-bold text-cockpit-heading">
                {editingLien ? "Modifier le lien" : "Ajouter un lien"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-md hover:bg-cockpit-dark/80 text-cockpit-secondary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1 min-h-0">
              {/* Nom */}
              <div>
                <label className="block text-sm font-medium text-cockpit-heading mb-1.5">
                  Nom
                </label>
                <input
                  type="text"
                  value={formNom}
                  onChange={(e) => setFormNom(e.target.value)}
                  placeholder="Ex: Sellsy CRM"
                  className="w-full px-3 py-2.5 rounded-lg border border-cockpit bg-cockpit-card text-cockpit-heading text-sm focus:outline-none focus:ring-2 focus:ring-[#E36887]/30 focus:border-[#E36887]"
                />
              </div>

              {/* URL */}
              <div>
                <label className="block text-sm font-medium text-cockpit-heading mb-1.5">
                  URL
                </label>
                <input
                  type="url"
                  value={formUrl}
                  onChange={(e) => {
                    setFormUrl(e.target.value);
                    setFormIconeUrl("");
                  }}
                  placeholder="https://..."
                  className="w-full px-3 py-2.5 rounded-lg border border-cockpit bg-cockpit-card text-cockpit-heading text-sm focus:outline-none focus:ring-2 focus:ring-[#E36887]/30 focus:border-[#E36887]"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-cockpit-heading mb-1.5">
                  Description{" "}
                  <span className="text-cockpit-secondary font-normal">
                    (optionnel)
                  </span>
                </label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Courte description..."
                  className="w-full px-3 py-2.5 rounded-lg border border-cockpit bg-cockpit-card text-cockpit-heading text-sm focus:outline-none focus:ring-2 focus:ring-[#E36887]/30 focus:border-[#E36887]"
                />
              </div>

              {/* Catégorie */}
              <div>
                <label className="block text-sm font-medium text-cockpit-heading mb-1.5">
                  Catégorie
                </label>
                <select
                  value={formCategorie}
                  onChange={(e) => setFormCategorie(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-cockpit bg-cockpit-card text-cockpit-heading text-sm focus:outline-none focus:ring-2 focus:ring-[#E36887]/30 focus:border-[#E36887]"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Favicon preview */}
              {formIconeUrl && (
                <div className="flex items-center gap-2 text-sm text-cockpit-secondary">
                  <img
                    src={formIconeUrl}
                    alt="favicon"
                    className="w-5 h-5"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                  <span>Favicon auto-détecté</span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-5 border-t border-cockpit shrink-0">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2.5 rounded-lg border border-cockpit text-cockpit-primary text-sm font-medium hover:bg-cockpit-dark/80 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving || !formNom || !formUrl}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-gray-900 text-sm font-medium hover:opacity-90 transition-colors disabled:opacity-50"
                style={{ backgroundColor: 'var(--color-active)' }}
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingLien ? "Enregistrer" : "Ajouter"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
