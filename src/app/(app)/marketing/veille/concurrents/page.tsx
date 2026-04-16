"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Radar,
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  RefreshCw,
  Check,
  X,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/toast";

// ============================================================================
// TYPES
// ============================================================================

interface Concurrent {
  id: string;
  nom: string;
  pageId: string | null;
  pageUrl: string;
  categorie: string | null;
  actif: boolean;
  derniereSync: string | null;
  pubCount: number;
  createdAt: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MKT_GRADIENT = {
  from: "var(--color-active)",
  to: "#9C1449",
  shadow: "rgba(194,24,91,0.30)",
};

// ============================================================================
// HELPERS
// ============================================================================

function formatDate(iso: string | null): string {
  if (!iso) return "Jamais";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ============================================================================
// PAGE
// ============================================================================

export default function VeilleConcurrentsPage() {
  const { data: session } = useSession();
  const { addToast } = useToast();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const isAdmin = role === "ADMIN" || role === "MARKETING" || role === "DIRECTION";

  const [concurrents, setConcurrents] = useState<Concurrent[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{
    nom: string;
    pageUrl: string;
    pageId: string;
    categorie: string;
    actif: boolean;
  } | null>(null);

  // Add form
  const [showAdd, setShowAdd] = useState(false);
  const [addNom, setAddNom] = useState("");
  const [addUrl, setAddUrl] = useState("");
  const [addCategorie, setAddCategorie] = useState("");
  const [adding, setAdding] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/veille/concurrents");
      if (res.ok) {
        const data = await res.json();
        setConcurrents(data.concurrents || []);
      }
    } catch {
      addToast("Erreur de chargement", "error");
    }
    setLoading(false);
  }, [addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ========= Add =========
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addNom.trim() || !addUrl.trim()) return;
    setAdding(true);
    try {
      const res = await fetch("/api/veille/concurrents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: addNom.trim(),
          pageUrl: addUrl.trim(),
          categorie: addCategorie.trim() || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        addToast(data.message || "Concurrent ajouté", data.resolved ? "success" : "info");
        setAddNom("");
        setAddUrl("");
        setAddCategorie("");
        setShowAdd(false);
        await fetchData();
      } else {
        addToast(data.error || "Erreur lors de l'ajout", "error");
      }
    } catch {
      addToast("Erreur de connexion", "error");
    }
    setAdding(false);
  };

  // ========= Edit =========
  const startEdit = (c: Concurrent) => {
    setEditingId(c.id);
    setEditDraft({
      nom: c.nom,
      pageUrl: c.pageUrl,
      pageId: c.pageId || "",
      categorie: c.categorie || "",
      actif: c.actif,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft(null);
  };

  const saveEdit = async (id: string) => {
    if (!editDraft) return;
    try {
      const res = await fetch(`/api/veille/concurrents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: editDraft.nom.trim(),
          pageUrl: editDraft.pageUrl.trim(),
          pageId: editDraft.pageId.trim() || null,
          categorie: editDraft.categorie.trim() || null,
          actif: editDraft.actif,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        addToast("Mise à jour enregistrée", "success");
        cancelEdit();
        await fetchData();
      } else {
        addToast(data.error || "Erreur lors de la mise à jour", "error");
      }
    } catch {
      addToast("Erreur de connexion", "error");
    }
  };

  const resolvePageId = async (id: string, pageUrl: string) => {
    try {
      const res = await fetch(`/api/veille/concurrents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageUrl, resolve: true }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.concurrent?.pageId) {
          addToast(`Page ID résolu : ${data.concurrent.pageId}`, "success");
        } else {
          addToast("Impossible de résoudre automatiquement — renseigner manuellement", "info");
        }
        await fetchData();
      } else {
        addToast(data.error || "Erreur", "error");
      }
    } catch {
      addToast("Erreur de connexion", "error");
    }
  };

  // ========= Sync =========
  const handleSync = async (id: string) => {
    setSyncingId(id);
    try {
      const res = await fetch(`/api/veille/sync?id=${id}`);
      const data = await res.json();
      if (res.ok && data.success) {
        const errs = (data.errors ?? []) as Array<{ concurrent: string; error: string }>;
        if (errs.length > 0) {
          console.warn("[veille sync] erreurs :", errs);
          addToast(`Erreur Meta : ${errs[0].error.slice(0, 220)}`, "error", 10000);
        } else {
          addToast(
            `Sync OK — ${data.pubsNew} nouvelle${data.pubsNew > 1 ? "s" : ""} pub${
              data.pubsNew > 1 ? "s" : ""
            }, ${data.pubsUpdated} mise${data.pubsUpdated > 1 ? "s" : ""} à jour`,
            "success",
          );
        }
        await fetchData();
      } else {
        addToast(data.error || "Erreur de synchronisation", "error");
      }
    } catch {
      addToast("Erreur de connexion", "error");
    }
    setSyncingId(null);
  };

  // ========= Delete =========
  const handleDelete = async (id: string, nom: string) => {
    if (!confirm(`Supprimer "${nom}" ? Toutes ses pubs seront effacées.`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/veille/concurrents/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        addToast("Concurrent supprimé", "success");
        await fetchData();
      } else {
        addToast(data.error || "Erreur lors de la suppression", "error");
      }
    } catch {
      addToast("Erreur de connexion", "error");
    }
    setDeletingId(null);
  };

  if (!isAdmin) {
    return (
      <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg p-8 text-center">
        <AlertCircle className="w-10 h-10 text-cockpit-secondary mx-auto mb-3" />
        <p className="text-sm text-cockpit-primary font-medium">Accès refusé</p>
        <p className="text-xs text-cockpit-secondary mt-1">
          Cette page est réservée aux rôles ADMIN, MARKETING ou DIRECTION.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* ================================================================ */}
      {/* HEADER                                                           */}
      {/* ================================================================ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/marketing/veille"
            className="p-2 rounded-lg text-cockpit-secondary hover:text-cockpit-primary hover:bg-cockpit-dark transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: `linear-gradient(135deg, ${MKT_GRADIENT.from}, ${MKT_GRADIENT.to})`,
              boxShadow: `0 4px 14px ${MKT_GRADIENT.shadow}`,
            }}
          >
            <Radar className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-cockpit-primary">
              Gérer les concurrents
            </h1>
            <p className="text-xs sm:text-sm text-cockpit-secondary">
              {concurrents.length} concurrent{concurrents.length > 1 ? "s" : ""} suivi
              {concurrents.length > 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAdd((s) => !s)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
          style={{
            background: `linear-gradient(135deg, ${MKT_GRADIENT.from}, ${MKT_GRADIENT.to})`,
            boxShadow: `0 4px 14px ${MKT_GRADIENT.shadow}`,
          }}
        >
          {showAdd ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showAdd ? "Annuler" : "Ajouter un concurrent"}
        </button>
      </div>

      {/* ================================================================ */}
      {/* ADD FORM                                                         */}
      {/* ================================================================ */}
      {showAdd && (
        <form
          onSubmit={handleAdd}
          className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg p-4 space-y-3"
        >
          <h2 className="text-sm font-semibold text-cockpit-primary">
            Nouveau concurrent
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-cockpit-secondary mb-1.5">
                Nom *
              </label>
              <input
                type="text"
                value={addNom}
                onChange={(e) => setAddNom(e.target.value)}
                placeholder="Ex: 80 La Boutique"
                required
                className="w-full bg-cockpit-input border border-cockpit rounded-lg px-3 py-2 text-sm text-cockpit-primary placeholder:text-cockpit-secondary focus:outline-none focus:ring-2 focus:ring-[#E36887]/30"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-cockpit-secondary mb-1.5">
                URL Facebook *
              </label>
              <input
                type="url"
                value={addUrl}
                onChange={(e) => setAddUrl(e.target.value)}
                placeholder="https://www.facebook.com/..."
                required
                className="w-full bg-cockpit-input border border-cockpit rounded-lg px-3 py-2 text-sm text-cockpit-primary placeholder:text-cockpit-secondary focus:outline-none focus:ring-2 focus:ring-[#E36887]/30"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-cockpit-secondary mb-1.5">
                Catégorie (optionnel)
              </label>
              <input
                type="text"
                value={addCategorie}
                onChange={(e) => setAddCategorie(e.target.value)}
                placeholder="Ex: Mobilier, Déco…"
                className="w-full bg-cockpit-input border border-cockpit rounded-lg px-3 py-2 text-sm text-cockpit-primary placeholder:text-cockpit-secondary focus:outline-none focus:ring-2 focus:ring-[#E36887]/30"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="px-3 py-2 rounded-lg text-sm font-medium border border-cockpit text-cockpit-secondary hover:text-cockpit-primary transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={adding || !addNom.trim() || !addUrl.trim()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50 transition-all hover:opacity-90"
              style={{
                background: `linear-gradient(135deg, ${MKT_GRADIENT.from}, ${MKT_GRADIENT.to})`,
                boxShadow: `0 4px 14px ${MKT_GRADIENT.shadow}`,
              }}
            >
              {adding && <Loader2 className="w-4 h-4 animate-spin" />}
              Ajouter
            </button>
          </div>
          <p className="text-[11px] text-cockpit-secondary">
            Le Page ID sera résolu automatiquement depuis l&apos;URL. Sinon, tu
            pourras le renseigner manuellement ensuite.
          </p>
        </form>
      )}

      {/* ================================================================ */}
      {/* TABLE                                                            */}
      {/* ================================================================ */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2
            className="w-6 h-6 animate-spin"
            style={{ color: MKT_GRADIENT.from }}
          />
        </div>
      ) : concurrents.length === 0 ? (
        <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg p-10 text-center">
          <Radar className="w-10 h-10 text-cockpit-secondary mx-auto mb-3" />
          <p className="text-sm text-cockpit-primary font-medium mb-1">
            Aucun concurrent
          </p>
          <p className="text-xs text-cockpit-secondary">
            Ajoute un premier concurrent pour commencer à suivre ses pubs.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden lg:block bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cockpit text-cockpit-secondary text-xs">
                  <th className="text-left px-4 py-3 font-medium">Nom</th>
                  <th className="text-left px-4 py-3 font-medium">Page ID</th>
                  <th className="text-left px-4 py-3 font-medium">Catégorie</th>
                  <th className="text-center px-4 py-3 font-medium">Actif</th>
                  <th className="text-right px-4 py-3 font-medium">Pubs</th>
                  <th className="text-left px-4 py-3 font-medium">Dernière sync</th>
                  <th className="text-center px-4 py-3 font-medium w-44">Actions</th>
                </tr>
              </thead>
              <tbody>
                {concurrents.map((c) => {
                  const isEdit = editingId === c.id;
                  return (
                    <tr
                      key={c.id}
                      className="border-b border-cockpit/50 hover:bg-cockpit-dark/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        {isEdit && editDraft ? (
                          <div className="space-y-1.5">
                            <input
                              type="text"
                              value={editDraft.nom}
                              onChange={(e) =>
                                setEditDraft({ ...editDraft, nom: e.target.value })
                              }
                              className="w-full bg-cockpit-input border border-cockpit rounded px-2 py-1 text-sm"
                            />
                            <input
                              type="url"
                              value={editDraft.pageUrl}
                              onChange={(e) =>
                                setEditDraft({
                                  ...editDraft,
                                  pageUrl: e.target.value,
                                })
                              }
                              className="w-full bg-cockpit-input border border-cockpit rounded px-2 py-1 text-xs"
                            />
                          </div>
                        ) : (
                          <div>
                            <p className="font-medium text-cockpit-primary">{c.nom}</p>
                            <a
                              href={c.pageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-cockpit-secondary hover:underline inline-flex items-center gap-1"
                            >
                              {c.pageUrl.replace(/^https?:\/\//, "").slice(0, 40)}
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isEdit && editDraft ? (
                          <input
                            type="text"
                            value={editDraft.pageId}
                            onChange={(e) =>
                              setEditDraft({
                                ...editDraft,
                                pageId: e.target.value,
                              })
                            }
                            placeholder="Ex: 123456789"
                            className="w-32 bg-cockpit-input border border-cockpit rounded px-2 py-1 text-xs"
                          />
                        ) : c.pageId ? (
                          <code className="text-[11px] text-cockpit-primary bg-cockpit-dark px-1.5 py-0.5 rounded">
                            {c.pageId}
                          </code>
                        ) : (
                          <button
                            onClick={() => resolvePageId(c.id, c.pageUrl)}
                            className="text-[11px] text-amber-500 hover:underline"
                          >
                            ⚠ Non résolu — résoudre
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isEdit && editDraft ? (
                          <input
                            type="text"
                            value={editDraft.categorie}
                            onChange={(e) =>
                              setEditDraft({
                                ...editDraft,
                                categorie: e.target.value,
                              })
                            }
                            className="w-28 bg-cockpit-input border border-cockpit rounded px-2 py-1 text-xs"
                          />
                        ) : (
                          <span className="text-xs text-cockpit-secondary">
                            {c.categorie || "—"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isEdit && editDraft ? (
                          <input
                            type="checkbox"
                            checked={editDraft.actif}
                            onChange={(e) =>
                              setEditDraft({
                                ...editDraft,
                                actif: e.target.checked,
                              })
                            }
                            className="w-4 h-4"
                          />
                        ) : c.actif ? (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-500">
                            <Check className="w-3 h-3" />
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-cockpit-dark text-cockpit-secondary">
                            <X className="w-3 h-3" />
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-cockpit-primary font-medium">
                        {c.pubCount}
                      </td>
                      <td className="px-4 py-3 text-xs text-cockpit-secondary">
                        {formatDate(c.derniereSync)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          {isEdit ? (
                            <>
                              <button
                                onClick={() => saveEdit(c.id)}
                                className="p-1.5 rounded hover:bg-emerald-500/10 text-emerald-500"
                                title="Sauvegarder"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="p-1.5 rounded hover:bg-cockpit-dark text-cockpit-secondary"
                                title="Annuler"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleSync(c.id)}
                                disabled={syncingId === c.id || !c.pageId}
                                className="p-1.5 rounded hover:bg-cockpit-dark text-cockpit-secondary hover:text-cockpit-primary disabled:opacity-30"
                                title={c.pageId ? "Synchroniser" : "Page ID requis"}
                              >
                                {syncingId === c.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <RefreshCw className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                onClick={() => startEdit(c)}
                                className="p-1.5 rounded hover:bg-cockpit-dark text-cockpit-secondary hover:text-cockpit-primary"
                                title="Éditer"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(c.id, c.nom)}
                                disabled={deletingId === c.id}
                                className="p-1.5 rounded hover:bg-red-500/10 text-cockpit-secondary hover:text-red-400 disabled:opacity-50"
                                title="Supprimer"
                              >
                                {deletingId === c.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="lg:hidden space-y-2">
            {concurrents.map((c) => {
              const isEdit = editingId === c.id;
              return (
                <div
                  key={c.id}
                  className="bg-cockpit-card rounded-lg border border-cockpit p-3 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      {isEdit && editDraft ? (
                        <input
                          type="text"
                          value={editDraft.nom}
                          onChange={(e) =>
                            setEditDraft({ ...editDraft, nom: e.target.value })
                          }
                          className="w-full bg-cockpit-input border border-cockpit rounded px-2 py-1 text-sm font-medium"
                        />
                      ) : (
                        <p className="font-medium text-cockpit-primary truncate">
                          {c.nom}
                        </p>
                      )}
                      <p className="text-[10px] text-cockpit-secondary mt-0.5">
                        {c.pubCount} pub{c.pubCount > 1 ? "s" : ""} · Sync:{" "}
                        {formatDate(c.derniereSync)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {isEdit ? (
                        <>
                          <button
                            onClick={() => saveEdit(c.id)}
                            className="p-1.5 rounded text-emerald-500"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="p-1.5 rounded text-cockpit-secondary"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleSync(c.id)}
                            disabled={syncingId === c.id || !c.pageId}
                            className="p-1.5 rounded text-cockpit-secondary disabled:opacity-30"
                          >
                            {syncingId === c.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <RefreshCw className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => startEdit(c)}
                            className="p-1.5 rounded text-cockpit-secondary"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(c.id, c.nom)}
                            disabled={deletingId === c.id}
                            className="p-1.5 rounded text-cockpit-secondary disabled:opacity-50"
                          >
                            {deletingId === c.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {c.pageId ? (
                      <code className="text-[10px] text-cockpit-primary bg-cockpit-dark px-1.5 py-0.5 rounded">
                        ID {c.pageId}
                      </code>
                    ) : (
                      <button
                        onClick={() => resolvePageId(c.id, c.pageUrl)}
                        className="text-[10px] text-amber-500 hover:underline"
                      >
                        ⚠ Page ID non résolu
                      </button>
                    )}
                    {c.categorie && (
                      <span className="text-[10px] text-cockpit-secondary">
                        · {c.categorie}
                      </span>
                    )}
                    {c.actif ? (
                      <span className="text-[10px] text-emerald-500">· Actif</span>
                    ) : (
                      <span className="text-[10px] text-cockpit-secondary">
                        · Inactif
                      </span>
                    )}
                  </div>

                  {isEdit && editDraft && (
                    <div className="space-y-1.5 pt-2 border-t border-cockpit">
                      <input
                        type="url"
                        value={editDraft.pageUrl}
                        onChange={(e) =>
                          setEditDraft({ ...editDraft, pageUrl: e.target.value })
                        }
                        placeholder="URL Facebook"
                        className="w-full bg-cockpit-input border border-cockpit rounded px-2 py-1 text-xs"
                      />
                      <input
                        type="text"
                        value={editDraft.pageId}
                        onChange={(e) =>
                          setEditDraft({ ...editDraft, pageId: e.target.value })
                        }
                        placeholder="Page ID"
                        className="w-full bg-cockpit-input border border-cockpit rounded px-2 py-1 text-xs"
                      />
                      <input
                        type="text"
                        value={editDraft.categorie}
                        onChange={(e) =>
                          setEditDraft({
                            ...editDraft,
                            categorie: e.target.value,
                          })
                        }
                        placeholder="Catégorie"
                        className="w-full bg-cockpit-input border border-cockpit rounded px-2 py-1 text-xs"
                      />
                      <label className="flex items-center gap-2 text-xs text-cockpit-secondary">
                        <input
                          type="checkbox"
                          checked={editDraft.actif}
                          onChange={(e) =>
                            setEditDraft({
                              ...editDraft,
                              actif: e.target.checked,
                            })
                          }
                        />
                        Actif
                      </label>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
