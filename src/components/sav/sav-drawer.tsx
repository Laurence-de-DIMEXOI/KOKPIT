"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  FileText,
  Mail,
  Phone,
  Archive,
  Image,
  Paperclip,
  Plus,
  Send,
  Loader2,
  ExternalLink,
  User as UserIcon,
  Pencil,
  Check,
  X,
  StickyNote,
  MessageSquare,
  UploadCloud,
  CreditCard,
  Link2,
} from "lucide-react";
import clsx from "clsx";
import { Drawer } from "@/components/layout/drawer";
import { useToast } from "@/components/ui/toast";
import {
  TYPES_SAV,
  STATUTS_SAV,
  TYPES_DOCUMENT_SAV,
  TYPES_COMMENTAIRE_SAV,
  getTypeLabel,
  getStatutConfig,
  getDocTypeConfig,
  getCommentaireTypeConfig,
} from "@/data/sav-config";
import { getSellsyUrl } from "@/lib/sellsy-urls";

// ── Types ───────────────────────────────────────────────────────────

interface SAVDocument {
  id: string;
  nom: string;
  type: string;
  contenu: string | null;
  url: string | null;
  ajoutePar: string | null; // userId
  ajoute?: { prenom: string; nom: string } | null;
  createdAt: string;
}

interface SAVCommentaire {
  id: string;
  contenu: string;
  type?: string;
  auteurId: string;
  auteur?: { prenom: string; nom: string } | null;
  createdAt: string;
}

interface SAVDossierDetail {
  id: string;
  numero: string;
  titre: string;
  contactNom: string | null;
  sellsyBdcRef: string | null;
  sellsyBdcId: string | null;
  type: string;
  statut: string;
  description: string | null;
  assigneAId: string | null;
  assigneA?: { id: string; prenom: string; nom: string } | null;
  createdAt: string;
  updatedAt: string;
  documents: SAVDocument[];
  commentaires: SAVCommentaire[];
}

interface SellsyResolution {
  bcdis: Array<{
    ref: string;
    found: boolean;
    orderId?: number;
    status?: string;
    statutLabel?: string;
    totalTTC?: number;
    url?: string;
  }>;
  avoirs: Array<{
    number: string;
    solde: boolean;
    statut: string | null;
    date: string | null;
    montantTTC: number;
    apresOuverture: boolean;
    linkedBcdi: string | null;
    matchesSav: boolean;
  }>;
  refundDetected: boolean;
  suggestedTraite: boolean;
}

interface SAVDrawerProps {
  open: boolean;
  onClose: () => void;
  dossierId: string | null;
  onRefresh: () => void;
}

// ── Icon mapping ────────────────────────────────────────────────────

const DOC_ICONS: Record<string, React.ElementType> = {
  FileText,
  Mail,
  Phone,
  FileArchive: Archive,
  Image,
  Paperclip,
  StickyNote,
  MessageSquare,
};

function getDocIcon(type: string) {
  const config = getDocTypeConfig(type);
  const IconComponent = DOC_ICONS[config.icone] || Paperclip;
  return { Icon: IconComponent, couleur: config.couleur };
}

function getCommentIcon(type: string) {
  const config = getCommentaireTypeConfig(type);
  const IconComponent = DOC_ICONS[config.icone] || StickyNote;
  return { Icon: IconComponent, couleur: config.couleur, label: config.label };
}

// ── Relative time ───────────────────────────────────────────────────

function tempsRelatif(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffJ = Math.floor(diffH / 24);

  if (diffMin < 1) return "a l'instant";
  if (diffMin < 60) return `il y a ${diffMin}min`;
  if (diffH < 24) return `il y a ${diffH}h`;
  if (diffJ === 1) return "hier";
  if (diffJ < 7) return `il y a ${diffJ}j`;
  return date.toLocaleDateString("fr-FR");
}

// ── Main component ──────────────────────────────────────────────────

export default function SAVDrawer({
  open,
  onClose,
  dossierId,
  onRefresh,
}: SAVDrawerProps) {
  const { addToast } = useToast();

  const [dossier, setDossier] = useState<SAVDossierDetail | null>(null);
  const [loading, setLoading] = useState(false);

  // Résolution Sellsy (BCDI liés + avoirs du client)
  const [sellsyInfo, setSellsyInfo] = useState<SellsyResolution | null>(null);

  // Statut edit
  const [editingStatut, setEditingStatut] = useState(false);
  const [statutValue, setStatutValue] = useState("");

  // Description edit
  const [editingDescription, setEditingDescription] = useState(false);
  const [descriptionValue, setDescriptionValue] = useState("");

  // New document form
  const [showDocForm, setShowDocForm] = useState(false);
  const [docForm, setDocForm] = useState<{ nom: string; type: string; url: string; contenu: string; taille: number | null }>({ nom: "", type: "PDF", url: "", contenu: "", taille: null });
  const [submittingDoc, setSubmittingDoc] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New comment
  const [commentValue, setCommentValue] = useState("");
  const [commentType, setCommentType] = useState<string>("NOTE");
  const [submittingComment, setSubmittingComment] = useState(false);

  // ── Fetch dossier detail ────────────────────────────────────────

  const fetchDossier = useCallback(async () => {
    if (!dossierId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/sav/${dossierId}`);
      if (!res.ok) throw new Error("Erreur chargement");
      const data = await res.json();
      setDossier(data);
      setStatutValue(data.statut);
      setDescriptionValue(data.description || "");
      // Résolution Sellsy en arrière-plan (non bloquant)
      setSellsyInfo(null);
      fetch(`/api/sav/${dossierId}/sellsy`)
        .then((r) => (r.ok ? r.json() : null))
        .then((info) => info && setSellsyInfo(info))
        .catch(() => {});
    } catch {
      addToast("Erreur lors du chargement du dossier", "error");
    } finally {
      setLoading(false);
    }
  }, [dossierId, addToast]);

  useEffect(() => {
    if (open && dossierId) {
      fetchDossier();
    }
    if (!open) {
      setDossier(null);
      setEditingStatut(false);
      setEditingDescription(false);
      setShowDocForm(false);
      setCommentValue("");
    }
  }, [open, dossierId, fetchDossier]);

  // ── Update statut ───────────────────────────────────────────────

  const handleStatutChange = async (newStatut: string) => {
    if (!dossier) return;
    try {
      const res = await fetch(`/api/sav/${dossier.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut: newStatut }),
      });
      if (!res.ok) throw new Error("Erreur");
      setStatutValue(newStatut);
      setDossier((prev) => prev ? { ...prev, statut: newStatut } : prev);
      setEditingStatut(false);
      addToast("Statut mis a jour", "success");
      onRefresh();
    } catch {
      addToast("Erreur lors de la mise a jour du statut", "error");
    }
  };

  // ── Update description ──────────────────────────────────────────

  const handleDescriptionSave = async () => {
    if (!dossier) return;
    try {
      const res = await fetch(`/api/sav/${dossier.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: descriptionValue }),
      });
      if (!res.ok) throw new Error("Erreur");
      setDossier((prev) =>
        prev ? { ...prev, description: descriptionValue } : prev
      );
      setEditingDescription(false);
      addToast("Description mise a jour", "success");
    } catch {
      addToast("Erreur lors de la mise a jour", "error");
    }
  };

  // ── Upload fichier (Supabase via /api/upload) ──────────────────
  const inferDocType = (filename: string): string => {
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    if (ext === "pdf") return "PDF";
    if (["jpg", "jpeg", "png", "gif", "webp", "heic"].includes(ext)) return "PHOTO";
    if (["eml", "msg"].includes(ext)) return "EMAIL";
    return "AUTRE";
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingDoc(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "sav");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Échec de l'upload");
      }
      const { url } = await res.json();
      setDocForm((prev) => ({
        ...prev,
        url,
        nom: prev.nom.trim() || file.name,
        type: prev.type === "PDF" ? inferDocType(file.name) : prev.type,
        taille: file.size,
      }));
      addToast("Fichier téléversé", "success");
    } catch (err: any) {
      addToast(err.message || "Échec de l'upload", "error");
    } finally {
      setUploadingDoc(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ── Add document ────────────────────────────────────────────────

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dossier || !docForm.nom.trim()) return;

    setSubmittingDoc(true);
    try {
      const res = await fetch(`/api/sav/${dossier.id}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: docForm.nom,
          type: docForm.type,
          url: docForm.url.trim() || null,
          contenu: docForm.contenu || null,
          taille: docForm.taille,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Erreur");
      }
      const newDoc = await res.json();
      setDossier((prev) =>
        prev
          ? { ...prev, documents: [...prev.documents, newDoc] }
          : prev
      );
      setDocForm({ nom: "", type: TYPES_DOCUMENT_SAV[0].value, url: "", contenu: "", taille: null });
      setShowDocForm(false);
      addToast("Document ajoute", "success");
      onRefresh();
    } catch (e: any) {
      addToast(e.message || "Erreur lors de l'ajout du document", "error");
    } finally {
      setSubmittingDoc(false);
    }
  };

  // ── Add comment ─────────────────────────────────────────────────

  const handleAddComment = async () => {
    if (!dossier || !commentValue.trim()) return;

    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/sav/${dossier.id}/commentaires`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contenu: commentValue, type: commentType }),
      });
      if (!res.ok) throw new Error("Erreur");
      const newComment = await res.json();
      setDossier((prev) =>
        prev
          ? { ...prev, commentaires: [...prev.commentaires, newComment] }
          : prev
      );
      setCommentValue("");
      setCommentType("NOTE");
      addToast("Commentaire ajoute", "success");
    } catch {
      addToast("Erreur lors de l'ajout du commentaire", "error");
    } finally {
      setSubmittingComment(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────

  const statutConfig = dossier ? getStatutConfig(dossier.statut) : null;

  return (
    <Drawer isOpen={open} onClose={onClose} title="Dossier SAV" width={560}>
      {loading || !dossier ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-cockpit-dark rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* ── Header ─────────────────────────────────────────── */}
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="text-xs font-mono font-bold text-white px-2.5 py-1 rounded-full bg-teal-600">
                {dossier.numero}
              </span>
              <span className="text-xs font-medium text-cockpit-primary bg-cockpit-dark px-2 py-1 rounded">
                {getTypeLabel(dossier.type)}
              </span>
              {statutConfig && (
                <span
                  className={clsx(
                    "inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full",
                    statutConfig.couleur
                  )}
                >
                  <span className={clsx("w-1.5 h-1.5 rounded-full", statutConfig.dot)} />
                  {statutConfig.label}
                </span>
              )}
            </div>
            <h3 className="text-lg font-semibold text-cockpit-heading">
              {dossier.titre}
            </h3>
          </div>

          {/* ── Client info ────────────────────────────────────── */}
          <div className="bg-cockpit-dark rounded-lg p-4 space-y-2">
            <p className="text-xs font-semibold text-cockpit-secondary uppercase tracking-wide">
              Client
            </p>
            <p className="text-sm font-medium text-cockpit-primary">
              {dossier.contactNom || "Non renseigne"}
            </p>
            {dossier.sellsyBdcRef && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-cockpit-secondary">BDC :</span>
                <a
                  href={dossier.sellsyBdcId ? getSellsyUrl("order", dossier.sellsyBdcId) : "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-teal-600 hover:text-teal-700 hover:underline inline-flex items-center gap-1"
                >
                  {dossier.sellsyBdcRef}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>

          {/* ── Description ────────────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-cockpit-secondary uppercase tracking-wide">
                Description
              </p>
              {!editingDescription && (
                <button
                  onClick={() => setEditingDescription(true)}
                  className="p-1 hover:bg-cockpit-dark rounded transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5 text-cockpit-secondary" />
                </button>
              )}
            </div>
            {editingDescription ? (
              <div className="space-y-2">
                <textarea
                  value={descriptionValue}
                  onChange={(e) => setDescriptionValue(e.target.value)}
                  rows={4}
                  className="w-full bg-cockpit-dark border border-cockpit rounded-lg px-3 py-2.5 text-sm text-cockpit-primary focus:outline-none focus:ring-2 focus:ring-teal-500/40 resize-none"
                />
                <div className="flex items-center gap-2 justify-end">
                  <button
                    onClick={() => {
                      setEditingDescription(false);
                      setDescriptionValue(dossier.description || "");
                    }}
                    className="p-1.5 hover:bg-cockpit-dark rounded transition-colors"
                  >
                    <X className="w-4 h-4 text-cockpit-secondary" />
                  </button>
                  <button
                    onClick={handleDescriptionSave}
                    className="p-1.5 hover:bg-teal-500/10 rounded transition-colors"
                  >
                    <Check className="w-4 h-4 text-teal-600" />
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-cockpit-primary leading-relaxed">
                {dossier.description || "Aucune description"}
              </p>
            )}
          </div>

          {/* ── Sellsy : commandes liées + remboursement (avoir) ── */}
          {sellsyInfo && (sellsyInfo.bcdis.length > 0 || sellsyInfo.refundDetected) && (
            <div className="space-y-2">
              {sellsyInfo.bcdis.length > 0 && (
                <>
                  <p className="text-xs font-semibold text-cockpit-secondary uppercase tracking-wide flex items-center gap-1.5">
                    <Link2 className="w-3.5 h-3.5" />
                    Commandes liées (auto)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {sellsyInfo.bcdis.map((b) =>
                      b.found ? (
                        <a
                          key={b.ref}
                          href={b.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg border border-cockpit bg-cockpit-dark hover:border-teal-500/50 transition-colors"
                        >
                          <span className="font-mono text-teal-600">{b.ref}</span>
                          <span className="text-cockpit-secondary">· {b.statutLabel}</span>
                          <ExternalLink className="w-3 h-3 text-cockpit-secondary" />
                        </a>
                      ) : (
                        <span
                          key={b.ref}
                          title="Commande introuvable dans Sellsy"
                          className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg border border-dashed border-cockpit text-cockpit-secondary"
                        >
                          <span className="font-mono">{b.ref}</span> · introuvable
                        </span>
                      )
                    )}
                  </div>
                </>
              )}

              {sellsyInfo.refundDetected && (
                <div className="rounded-lg border border-purple-300 bg-purple-50 p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <CreditCard className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 text-xs text-purple-900">
                      <p className="font-semibold">Remboursement détecté — avoir</p>
                      {sellsyInfo.avoirs.map((a) => (
                        <p key={a.number} className="mt-0.5">
                          <span className="font-mono">{a.number}</span>
                          {a.montantTTC > 0 && ` — ${a.montantTTC.toLocaleString("fr-FR")} €`}
                          {" · "}
                          <span className={a.solde ? "text-emerald-700 font-medium" : "text-amber-700 font-medium"}>
                            {a.solde ? "soldé" : "non soldé"}
                          </span>
                          {a.date && ` · ${new Date(a.date).toLocaleDateString("fr-FR")}`}
                          {a.matchesSav ? (
                            <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">
                              ✓ lié à {a.linkedBcdi}
                            </span>
                          ) : a.linkedBcdi ? (
                            <span className="ml-1 text-purple-700/70">(chaîne : {a.linkedBcdi})</span>
                          ) : null}
                        </p>
                      ))}
                      {!sellsyInfo.avoirs.some((a) => a.matchesSav) && (
                        <p className="mt-1 text-purple-700/70 text-[11px]">
                          Avoir rattaché au client (non relié à un BCDI de ce SAV — à vérifier).
                        </p>
                      )}
                    </div>
                  </div>
                  {dossier.statut !== "TRAITE" && dossier.statut !== "CLOTURE" && (
                    <button
                      onClick={() => handleStatutChange("TRAITE")}
                      className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-white rounded-lg py-1.5 bg-purple-600 hover:bg-purple-700 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Marquer ce SAV traité
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Statut change ──────────────────────────────────── */}
          <div>
            <p className="text-xs font-semibold text-cockpit-secondary uppercase tracking-wide mb-2">
              Changer le statut
            </p>
            {editingStatut ? (
              <div className="flex items-center gap-2">
                <select
                  value={statutValue}
                  onChange={(e) => setStatutValue(e.target.value)}
                  className="flex-1 bg-cockpit-dark border border-cockpit rounded-lg px-3 py-2 text-sm text-cockpit-primary focus:outline-none focus:ring-2 focus:ring-teal-500/40 appearance-none"
                >
                  {STATUTS_SAV.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => handleStatutChange(statutValue)}
                  className="p-2 hover:bg-teal-500/10 rounded-lg transition-colors"
                >
                  <Check className="w-4 h-4 text-teal-600" />
                </button>
                <button
                  onClick={() => {
                    setEditingStatut(false);
                    setStatutValue(dossier.statut);
                  }}
                  className="p-2 hover:bg-cockpit-dark rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-cockpit-secondary" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditingStatut(true)}
                className="flex items-center gap-2 bg-cockpit-dark border border-cockpit rounded-lg px-3 py-2 text-sm text-cockpit-primary hover:border-teal-500/40 transition-colors w-full"
              >
                {statutConfig && (
                  <span
                    className={clsx(
                      "inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full",
                      statutConfig.couleur
                    )}
                  >
                    <span className={clsx("w-1.5 h-1.5 rounded-full", statutConfig.dot)} />
                    {statutConfig.label}
                  </span>
                )}
                <Pencil className="w-3.5 h-3.5 text-cockpit-secondary ml-auto" />
              </button>
            )}
          </div>

          {/* ── Assigne ────────────────────────────────────────── */}
          <div className="bg-cockpit-dark rounded-lg p-4">
            <p className="text-xs font-semibold text-cockpit-secondary uppercase tracking-wide mb-2">
              Assigne a
            </p>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-teal-600/15 flex items-center justify-center">
                <UserIcon className="w-4 h-4 text-teal-600" />
              </div>
              <span className="text-sm font-medium text-cockpit-primary">
                {dossier.assigneA
                  ? `${dossier.assigneA.prenom} ${dossier.assigneA.nom}`
                  : "Non assigne"}
              </span>
            </div>
          </div>

          {/* ── Documents ──────────────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-cockpit-secondary uppercase tracking-wide">
                Documents ({dossier.documents.length})
              </p>
              <button
                onClick={() => setShowDocForm(!showDocForm)}
                className="flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-500 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Ajouter
              </button>
            </div>

            {/* Add doc form */}
            {showDocForm && (
              <form
                onSubmit={handleAddDocument}
                className="bg-cockpit-dark rounded-lg p-4 mb-3 space-y-3 border border-cockpit"
              >
                <input
                  type="text"
                  value={docForm.nom}
                  onChange={(e) =>
                    setDocForm((prev) => ({ ...prev, nom: e.target.value }))
                  }
                  placeholder="Nom du document"
                  required
                  className="w-full bg-cockpit-card border border-cockpit rounded-lg px-3 py-2 text-sm text-cockpit-primary placeholder:text-cockpit-secondary focus:outline-none focus:ring-2 focus:ring-teal-500/40"
                />
                <select
                  value={docForm.type}
                  onChange={(e) =>
                    setDocForm((prev) => ({ ...prev, type: e.target.value }))
                  }
                  className="w-full bg-cockpit-card border border-cockpit rounded-lg px-3 py-2 text-sm text-cockpit-primary focus:outline-none focus:ring-2 focus:ring-teal-500/40 appearance-none"
                >
                  {TYPES_DOCUMENT_SAV.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                {/* Upload fichier */}
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.heic,.eml,.msg,.doc,.docx,.xls,.xlsx"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingDoc}
                  className="w-full flex items-center justify-center gap-2 bg-cockpit-card border border-dashed border-cockpit rounded-lg px-3 py-2.5 text-sm text-cockpit-primary hover:border-teal-500/60 hover:text-teal-600 transition-colors disabled:opacity-50"
                >
                  {uploadingDoc ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <UploadCloud className="w-4 h-4" />
                  )}
                  {docForm.taille != null
                    ? `Fichier joint (${Math.round(docForm.taille / 1024)} Ko) — remplacer`
                    : uploadingDoc
                    ? "Téléversement…"
                    : "Téléverser un fichier (max 15 Mo)"}
                </button>
                <div className="flex items-center gap-2 text-[11px] text-cockpit-secondary">
                  <span className="flex-1 h-px bg-cockpit" />
                  ou coller un lien
                  <span className="flex-1 h-px bg-cockpit" />
                </div>
                <input
                  type="url"
                  value={docForm.url}
                  onChange={(e) =>
                    setDocForm((prev) => ({ ...prev, url: e.target.value, taille: null }))
                  }
                  placeholder="Lien (https://...) — optionnel"
                  className="w-full bg-cockpit-card border border-cockpit rounded-lg px-3 py-2 text-sm text-cockpit-primary placeholder:text-cockpit-secondary focus:outline-none focus:ring-2 focus:ring-teal-500/40"
                />
                <textarea
                  value={docForm.contenu}
                  onChange={(e) =>
                    setDocForm((prev) => ({ ...prev, contenu: e.target.value }))
                  }
                  placeholder="Notes / contenu..."
                  rows={2}
                  className="w-full bg-cockpit-card border border-cockpit rounded-lg px-3 py-2 text-sm text-cockpit-primary placeholder:text-cockpit-secondary focus:outline-none focus:ring-2 focus:ring-teal-500/40 resize-none"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDocForm(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-cockpit-secondary hover:bg-cockpit-card transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={submittingDoc}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all disabled:opacity-50"
                    style={{
                      background: "linear-gradient(135deg, var(--color-active), #FEEB9C)",
                    }}
                  >
                    {submittingDoc && <Loader2 className="w-3 h-3 animate-spin" />}
                    Ajouter
                  </button>
                </div>
              </form>
            )}

            {/* Doc list */}
            <div className="space-y-2">
              {dossier.documents.length === 0 ? (
                <p className="text-sm text-cockpit-secondary italic">
                  Aucun document
                </p>
              ) : (
                dossier.documents.map((doc) => {
                  const { Icon, couleur } = getDocIcon(doc.type);
                  const docTypeConfig = getDocTypeConfig(doc.type);
                  return (
                    <div
                      key={doc.id}
                      className="flex items-center gap-3 bg-cockpit-dark rounded-lg p-3 border border-cockpit"
                    >
                      <div
                        className={clsx(
                          "w-8 h-8 rounded-lg flex items-center justify-center bg-white/5",
                          couleur
                        )}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        {doc.url ? (
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-teal-600 hover:text-teal-700 hover:underline inline-flex items-center gap-1 truncate max-w-full"
                          >
                            <span className="truncate">{doc.nom}</span>
                            <ExternalLink className="w-3 h-3 flex-shrink-0" />
                          </a>
                        ) : (
                          <p className="text-sm font-medium text-cockpit-primary truncate">
                            {doc.nom}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-cockpit-secondary">
                          <span>{docTypeConfig.label}</span>
                          <span>-</span>
                          <span>{tempsRelatif(doc.createdAt)}</span>
                          {doc.ajoute && (
                            <>
                              <span>-</span>
                              <span>
                                {doc.ajoute.prenom} {doc.ajoute.nom}
                              </span>
                            </>
                          )}
                        </div>
                        {doc.contenu && (
                          <p className="text-xs text-cockpit-secondary mt-1 whitespace-pre-wrap">
                            {doc.contenu}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ── Commentaires ───────────────────────────────────── */}
          <div>
            <p className="text-xs font-semibold text-cockpit-secondary uppercase tracking-wide mb-3">
              Commentaires ({dossier.commentaires.length})
            </p>

            {/* Comment list */}
            <div className="space-y-3 mb-4">
              {dossier.commentaires.length === 0 ? (
                <p className="text-sm text-cockpit-secondary italic">
                  Aucun commentaire
                </p>
              ) : (
                dossier.commentaires.map((c) => {
                  const { Icon: CIcon, couleur: cCol, label: cLabel } = getCommentIcon(c.type || "NOTE");
                  return (
                    <div key={c.id} className="bg-cockpit-dark rounded-lg p-3 border border-cockpit">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span
                          className={clsx(
                            "inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-white/5",
                            cCol
                          )}
                        >
                          <CIcon className="w-3 h-3" />
                          {cLabel}
                        </span>
                        <span className="text-xs font-semibold text-cockpit-primary">
                          {c.auteur?.prenom || "Utilisateur"}
                        </span>
                        <span className="text-xs text-cockpit-secondary">
                          {tempsRelatif(c.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-cockpit-primary leading-relaxed whitespace-pre-wrap">
                        {c.contenu}
                      </p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Add comment */}
            <div className="space-y-2">
              {/* Type selector — pills */}
              <div className="flex flex-wrap gap-1.5">
                {TYPES_COMMENTAIRE_SAV.map((t) => {
                  const IconComponent = DOC_ICONS[t.icone] || StickyNote;
                  const active = commentType === t.value;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setCommentType(t.value)}
                      className={clsx(
                        "inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full border transition-colors",
                        active
                          ? "bg-teal-500/15 text-teal-600 border-teal-500/40"
                          : "bg-cockpit-dark text-cockpit-secondary border-cockpit hover:text-cockpit-primary"
                      )}
                    >
                      <IconComponent className="w-3 h-3" />
                      {t.label}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-end gap-2">
                <textarea
                  value={commentValue}
                  onChange={(e) => setCommentValue(e.target.value)}
                  placeholder="Ecrire un commentaire..."
                  rows={2}
                  className="flex-1 bg-cockpit-dark border border-cockpit rounded-lg px-3 py-2 text-sm text-cockpit-primary placeholder:text-cockpit-secondary focus:outline-none focus:ring-2 focus:ring-teal-500/40 resize-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      handleAddComment();
                    }
                  }}
                />
                <button
                  onClick={handleAddComment}
                  disabled={submittingComment || !commentValue.trim()}
                  className="p-2.5 rounded-lg text-white transition-all disabled:opacity-40"
                  style={{
                    background: "linear-gradient(135deg, var(--color-active), #FEEB9C)",
                  }}
                >
                  {submittingComment ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Drawer>
  );
}
