"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { useSession } from "next-auth/react";
import {
  Tag,
  Plus,
  Search,
  Filter,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";

// ============================================================================
// CONSTANTS
// ============================================================================

const ACHAT_GRADIENT = {
  from: "#CBA1D4",
  to: "#FEEB9C",
  shadow: "rgba(203,161,212,0.25)",
};

const STATUT_BADGE: Record<string, { label: string; cls: string }> = {
  DEMANDE: { label: "En attente", cls: "bg-yellow-100 text-yellow-800" },
  PRIX_RECU: { label: "Prix reçu", cls: "bg-green-100 text-green-800" },
  ANNULE: { label: "Annulé", cls: "bg-gray-100 text-gray-500" },
};

const PAGE_SIZE = 20;

// ============================================================================
// TYPES
// ============================================================================

interface NeedPrice {
  id: string;
  reference: string;
  refDevis: string | null;
  nomClient: string | null;
  denomination: string;
  dimensions: string;
  finitions: string | null;
  photoUrl: string | null;
  notes: string | null;
  statut: "DEMANDE" | "PRIX_RECU" | "ANNULE";
  prixFournisseur: number | null;
  prixVente: number | null;
  prixMinimum: number | null;
  typePrix: string | null;
  createdBy: { nom: string; prenom: string };
  createdAt: string;
}

interface NeedPriceData {
  items: NeedPrice[];
  total: number;
  stats: {
    total: number;
    enAttente: number;
    prixRecus: number;
    annulees: number;
  };
}

// ============================================================================
// DRAWER
// ============================================================================

function NeedPriceDrawer({
  item,
  onClose,
  onUpdate,
}: {
  item: NeedPrice;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const { data: session } = useSession();
  const isAchat = session?.user?.role === "ACHAT";
  const { addToast } = useToast();
  const [prixInput, setPrixInput] = useState(item.prixFournisseur?.toString() || "");
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const badge = STATUT_BADGE[item.statut] || STATUT_BADGE.DEMANDE;

  const handlePrixRecu = async () => {
    if (!prixInput) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/achat/need-price/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          statut: "PRIX_RECU",
          prixFournisseur: Number(prixInput),
        }),
      });
      if (res.ok) {
        addToast("Prix fournisseur enregistré", "success");
        onUpdate();
        onClose();
      } else {
        const d = await res.json();
        addToast(d.error || "Erreur", "error");
      }
    } catch {
      addToast("Erreur de connexion", "error");
    }
    setSubmitting(false);
  };

  const handleSupprimer = async () => {
    if (!confirm("Supprimer définitivement cette demande ?")) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/achat/need-price/${item.id}`, { method: "DELETE" });
      if (res.ok) {
        addToast("Demande supprimée", "success");
        onUpdate();
        onClose();
      } else {
        addToast("Erreur lors de la suppression", "error");
      }
    } catch {
      addToast("Erreur de connexion", "error");
    }
    setSubmitting(false);
  };

  const handleAnnuler = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/achat/need-price/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut: "ANNULE" }),
      });
      if (res.ok) {
        addToast("Demande annulée", "success");
        onUpdate();
        onClose();
      } else {
        const d = await res.json();
        addToast(d.error || "Erreur", "error");
      }
    } catch {
      addToast("Erreur de connexion", "error");
    }
    setSubmitting(false);
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-lg bg-cockpit-card border-l border-cockpit shadow-cockpit-lg overflow-y-auto animate-slide-in-right">
        {/* Header */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between px-5 py-4"
          style={{
            background: `linear-gradient(135deg, ${ACHAT_GRADIENT.from}, ${ACHAT_GRADIENT.to})`,
          }}
        >
          <h3 className="text-white font-semibold text-base truncate pr-4">
            {item.denomination}
          </h3>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Statut */}
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badge.cls}`}
            >
              {badge.label}
            </span>
            {item.refDevis && (
              <span className="text-xs text-cockpit-secondary">
                Devis: {item.refDevis}
              </span>
            )}
          </div>

          {/* Photo */}
          {item.photoUrl && (
            <div className="rounded-lg overflow-hidden border border-cockpit">
              <img
                src={item.photoUrl}
                alt={item.denomination}
                className="w-full h-48 object-cover"
              />
            </div>
          )}

          {/* Fields */}
          <div className="space-y-3">
            <Field label="Référence DEPI" value={item.refDevis || "—"} />
            <Field label="Dénomination" value={item.denomination} />
            <Field label="Dimensions" value={item.dimensions} />
            <Field label="Finitions" value={item.finitions || "—"} />
            <Field label="Notes" value={item.notes || "—"} />
            <Field
              label="Créé par"
              value={`${item.createdBy.prenom} ${item.createdBy.nom}`}
            />
            <Field
              label="Date de création"
              value={new Date(item.createdAt).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            />
          </div>

          {/* Prix reçus */}
          {/* Prix reçus — vue commerciaux : juste le prix de vente */}
          {item.statut === "PRIX_RECU" && !isAchat && (
            <div className="space-y-3 pt-3 border-t border-cockpit">
              {item.notes && item.notes.includes(":") ? (
                <div>
                  <p className="text-xs font-medium text-cockpit-secondary mb-2">Prix</p>
                  <div className="space-y-1.5">
                    {item.notes.split("\n").filter(Boolean).map((line, i) => {
                      const parts = line.split(":");
                      const nom = parts[0]?.trim();
                      const prix = parts.slice(1).join(":").trim()
                        .replace(/Min /g, "").replace(/ — Arrondi /g, " - ");
                      return (
                        <div key={i} className="flex items-center justify-between bg-cockpit-dark rounded-lg px-3 py-2">
                          <span className="text-sm text-cockpit-primary font-medium">{nom}</span>
                          <span className="text-sm font-bold" style={{ color: "var(--color-active)" }}>{prix}</span>
                        </div>
                      );
                    })}
                  </div>
                  {item.prixMinimum != null && item.prixVente != null && (
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-cockpit">
                      <span className="text-xs font-semibold text-cockpit-secondary">Total</span>
                      <span className="text-sm font-bold" style={{ color: "var(--color-active)" }}>
                        {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(item.prixMinimum)} - {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(item.prixVente)}
                      </span>
                    </div>
                  )}
                </div>
              ) : item.prixMinimum != null && item.prixVente != null ? (
                <Field
                  label="Prix"
                  value={`${new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(item.prixMinimum)} - ${new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(item.prixVente)}`}
                />
              ) : item.prixVente != null ? (
                <Field
                  label="Prix"
                  value={new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(item.prixVente)}
                />
              ) : null}
            </div>
          )}

          {/* Prix reçus — vue Elaury : tout + modifier */}
          {item.statut === "PRIX_RECU" && isAchat && !editing && (
            <div className="space-y-3 pt-3 border-t border-cockpit">
              <Field
                label="Prix fournisseur"
                value={item.prixFournisseur != null ? new Intl.NumberFormat("fr-FR").format(item.prixFournisseur) : "—"}
              />
              {item.prixMinimum != null && item.prixVente != null ? (
                <Field
                  label="Prix"
                  value={`${new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(item.prixMinimum)} - ${new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(item.prixVente)}`}
                />
              ) : item.prixVente != null ? (
                <Field
                  label="Prix"
                  value={new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(item.prixVente)}
                />
              ) : null}
              {item.notes && (
                <div>
                  <p className="text-xs font-medium text-cockpit-secondary mb-1">Détail prix</p>
                  <pre className="text-xs text-cockpit-primary bg-cockpit-dark rounded-lg p-3 whitespace-pre-wrap">{item.notes}</pre>
                </div>
              )}
              <button
                onClick={() => setEditing(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border border-cockpit text-cockpit-secondary hover:text-[var(--color-active)] hover:border-[var(--color-active)]/30 transition-colors"
              >
                Modifier le prix fournisseur
              </button>
            </div>
          )}

          {/* Actions — saisie prix (ACHAT uniquement : DEMANDE ou édition) */}
          {isAchat && (item.statut === "DEMANDE" || editing) && (
            <div className="space-y-3 pt-3 border-t border-cockpit">
              <div>
                <label className="block text-xs font-medium text-cockpit-secondary mb-1.5">
                  Prix fournisseur (IDR)
                </label>
                <input
                  type="number"
                  value={prixInput}
                  onChange={(e) => setPrixInput(e.target.value)}
                  placeholder="Base fournisseur en IDR"
                  min="0"
                  className="w-full bg-cockpit-dark border border-cockpit rounded-lg px-3 py-2.5 text-sm text-cockpit-primary placeholder:text-cockpit-secondary focus:outline-none focus:ring-2 focus:ring-[var(--color-active)]/40"
                />
              </div>
              <button
                onClick={handlePrixRecu}
                disabled={submitting || !prixInput}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{
                  background: `linear-gradient(135deg, ${ACHAT_GRADIENT.from}, ${ACHAT_GRADIENT.to})`,
                  boxShadow: `0 4px 14px ${ACHAT_GRADIENT.shadow}`,
                }}
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                {editing ? "Mettre à jour le prix" : "Marquer prix reçu"}
              </button>
              {editing && (
                <button
                  onClick={() => setEditing(false)}
                  className="w-full text-xs text-cockpit-secondary hover:text-cockpit-primary transition-colors"
                >
                  Annuler la modification
                </button>
              )}
              {item.statut === "DEMANDE" && (
                <button
                  onClick={handleAnnuler}
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border border-cockpit text-cockpit-secondary hover:text-red-500 hover:border-red-500/30 transition-colors disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  Annuler la demande
                </button>
              )}
            </div>
          )}

          {/* Supprimer — ACHAT/ADMIN uniquement */}
          {isAchat && (
            <div className="pt-3 border-t border-cockpit">
              <button
                onClick={handleSupprimer}
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                Supprimer cette demande
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-cockpit-secondary mb-0.5">
        {label}
      </p>
      <p className="text-sm text-cockpit-primary">{value}</p>
    </div>
  );
}

// ============================================================================
// MODAL - Nouvelle demande
// ============================================================================

function NouvellDemandeModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { addToast } = useToast();
  const [referenceDepi, setReferenceDepi] = useState("");
  const [nomClient, setNomClient] = useState("");
  const [denomination, setDenomination] = useState("");
  const [dimensions, setDimensions] = useState("");
  const [finitions, setFinitions] = useState("");
  const [photo, setPhoto] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!denomination.trim() || !dimensions.trim()) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("refDevis", referenceDepi.trim());
      formData.append("nomClient", nomClient.trim());
      formData.append("denomination", denomination.trim());
      formData.append("dimensions", dimensions.trim());
      formData.append("finitions", finitions.trim());
      formData.append("notes", notes.trim());
      if (photoFile) {
        formData.append("photo", photoFile);
      }
      const res = await fetch("/api/achat/need-price", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        addToast("Demande créée avec succès", "success");
        onSuccess();
        onClose();
      } else {
        const d = await res.json();
        addToast(d.error || "Erreur lors de la création", "error");
      }
    } catch {
      addToast("Erreur de connexion", "error");
    }
    setSubmitting(false);
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-cockpit-card border border-cockpit rounded-xl shadow-cockpit-lg overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between px-5 py-4"
          style={{
            background: `linear-gradient(135deg, ${ACHAT_GRADIENT.from}, ${ACHAT_GRADIENT.to})`,
          }}
        >
          <h3 className="text-white font-semibold text-base">
            Nouvelle demande de prix
          </h3>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Référence DEPI */}
          <div>
            <label className="block text-xs font-medium text-cockpit-secondary mb-1.5">
              Référence DEPI{" "}
              <span className="text-cockpit-secondary/60">(optionnel)</span>
            </label>
            <input
              type="text"
              value={referenceDepi}
              onChange={(e) => setReferenceDepi(e.target.value)}
              placeholder="Ex: DEPI-2024-001"
              className="w-full bg-cockpit-dark border border-cockpit rounded-lg px-3 py-2.5 text-sm text-cockpit-primary placeholder:text-cockpit-secondary focus:outline-none focus:ring-2 focus:ring-[var(--color-active)]/40"
            />
          </div>

          {/* Nom Client */}
          <div>
            <label className="block text-xs font-medium text-cockpit-secondary mb-1.5">
              Nom du client{" "}
              <span className="text-cockpit-secondary/60">(optionnel)</span>
            </label>
            <input
              type="text"
              value={nomClient}
              onChange={(e) => setNomClient(e.target.value)}
              placeholder="Ex: M. Dupont"
              className="w-full bg-cockpit-dark border border-cockpit rounded-lg px-3 py-2.5 text-sm text-cockpit-primary placeholder:text-cockpit-secondary focus:outline-none focus:ring-2 focus:ring-[var(--color-active)]/40"
            />
          </div>

          {/* Dénomination */}
          <div>
            <label className="block text-xs font-medium text-cockpit-secondary mb-1.5">
              Dénomination <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={denomination}
              onChange={(e) => setDenomination(e.target.value)}
              placeholder="Nom du produit en anglais (ex: Wardrobe 3 doors)"
              className="w-full bg-cockpit-dark border border-cockpit rounded-lg px-3 py-2.5 text-sm text-cockpit-primary placeholder:text-cockpit-secondary focus:outline-none focus:ring-2 focus:ring-[var(--color-active)]/40"
              required
            />
          </div>

          {/* Dimensions */}
          <div>
            <label className="block text-xs font-medium text-cockpit-secondary mb-1.5">
              Dimensions <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={dimensions}
              onChange={(e) => setDimensions(e.target.value)}
              placeholder="Ex: L 200 x l 100 x H 75 cm"
              className="w-full bg-cockpit-dark border border-cockpit rounded-lg px-3 py-2.5 text-sm text-cockpit-primary placeholder:text-cockpit-secondary focus:outline-none focus:ring-2 focus:ring-[var(--color-active)]/40"
              required
            />
          </div>

          {/* Finitions */}
          <div>
            <label className="block text-xs font-medium text-cockpit-secondary mb-1.5">
              Finitions{" "}
              <span className="text-cockpit-secondary/60">(optionnel)</span>
            </label>
            <select
              value={finitions}
              onChange={(e) => setFinitions(e.target.value)}
              className="w-full bg-cockpit-dark border border-cockpit rounded-lg px-3 py-2.5 text-sm text-cockpit-primary focus:outline-none focus:ring-2 focus:ring-[var(--color-active)]/40"
            >
              <option value="">Sélectionner une finition</option>
              <option value="Natural">Natural</option>
              <option value="Raw">Raw</option>
              <option value="WW">WW</option>
              <option value="BW">BW</option>
              <option value="Antic">Antic</option>
            </select>
          </div>

          {/* Photo upload */}
          <div>
            <label className="block text-xs font-medium text-cockpit-secondary mb-1.5">
              Photo / PDF{" "}
              <span className="text-cockpit-secondary/60">(optionnel)</span>
            </label>
            <input
              type="file"
              accept="image/*,.pdf"
              id="photo-upload"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setPhotoFile(file);
                setPhoto(file ? file.name : "");
              }}
            />
            <button
              type="button"
              onClick={() => document.getElementById("photo-upload")?.click()}
              className="w-full flex items-center gap-2 bg-cockpit-dark border border-cockpit rounded-lg px-3 py-2.5 text-sm text-cockpit-secondary hover:border-[var(--color-active)]/40 transition-colors"
            >
              <ImageIcon className="w-4 h-4" />
              {photoFile ? photoFile.name : "Ajouter une photo / PDF"}
            </button>
            {photoFile && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-cockpit-secondary truncate flex-1">
                  {photoFile.name} ({(photoFile.size / 1024).toFixed(0)} Ko)
                </span>
                <button
                  type="button"
                  onClick={() => { setPhotoFile(null); setPhoto(""); }}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Supprimer
                </button>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-cockpit-secondary mb-1.5">
              Notes{" "}
              <span className="text-cockpit-secondary/60">(optionnel)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Informations complémentaires..."
              rows={3}
              className="w-full bg-cockpit-dark border border-cockpit rounded-lg px-3 py-2.5 text-sm text-cockpit-primary placeholder:text-cockpit-secondary focus:outline-none focus:ring-2 focus:ring-[var(--color-active)]/40 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border border-cockpit text-cockpit-secondary hover:text-cockpit-primary hover:border-[var(--color-active)]/20 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting || !denomination.trim() || !dimensions.trim()}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              style={{
                background: `linear-gradient(135deg, ${ACHAT_GRADIENT.from}, ${ACHAT_GRADIENT.to})`,
                boxShadow: `0 4px 14px ${ACHAT_GRADIENT.shadow}`,
              }}
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Créer la demande
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

// ============================================================================
// PAGE
// ============================================================================

export default function NeedPricePage() {
  const { data: session } = useSession();
  const { addToast } = useToast();

  const [data, setData] = useState<NeedPriceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [drawerItem, setDrawerItem] = useState<NeedPrice | null>(null);

  // ========================================================================
  // FETCH
  // ========================================================================

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (statusFilter) params.set("statut", statusFilter);
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/achat/need-price?${params}`);
      if (res.ok) {
        setData(await res.json());
      }
    } catch (err) {
      console.error("Erreur chargement need-price:", err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  // ========================================================================
  // DERIVED
  // ========================================================================

  const stats = data?.stats || { total: 0, enAttente: 0, prixRecus: 0, annulees: 0 };
  const items = data?.items || [];
  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 1;

  // ========================================================================
  // KPI CARDS
  // ========================================================================

  const kpiCards = useMemo(
    () => [
      {
        label: "Total demandes",
        value: stats.total,
        icon: FileText,
      },
      {
        label: "En attente",
        value: stats.enAttente,
        icon: Clock,
      },
      {
        label: "Prix reçus",
        value: stats.prixRecus,
        icon: CheckCircle,
      },
      {
        label: "Annulées",
        value: stats.annulees,
        icon: XCircle,
      },
    ],
    [stats]
  );

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* ================================================================ */}
      {/* HEADER                                                          */}
      {/* ================================================================ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: `linear-gradient(135deg, ${ACHAT_GRADIENT.from}, ${ACHAT_GRADIENT.to})`,
              boxShadow: `0 4px 14px ${ACHAT_GRADIENT.shadow}`,
            }}
          >
            <Tag className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-cockpit-primary">
              Need Price
            </h1>
            <p className="text-xs sm:text-sm text-cockpit-secondary">
              Demandes de prix fournisseur
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
          style={{
            background: `linear-gradient(135deg, ${ACHAT_GRADIENT.from}, ${ACHAT_GRADIENT.to})`,
            boxShadow: `0 4px 14px ${ACHAT_GRADIENT.shadow}`,
          }}
        >
          <Plus className="w-4 h-4" />
          Nouvelle demande
        </button>
      </div>

      {/* ================================================================ */}
      {/* KPI CARDS                                                       */}
      {/* ================================================================ */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-xl p-4 bg-cockpit-card animate-pulse h-20"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {kpiCards.map((kpi) => (
            <div
              key={kpi.label}
              className="relative overflow-hidden rounded-xl p-4 bg-cockpit-card border border-cockpit"
            >
              <div
                className="absolute top-0 left-0 w-full h-1"
                style={{
                  background: `linear-gradient(90deg, ${ACHAT_GRADIENT.from}, ${ACHAT_GRADIENT.to})`,
                }}
              />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-cockpit-secondary mb-1">
                    {kpi.label}
                  </p>
                  <p
                    className="text-2xl font-bold"
                    style={{ color: "var(--color-active)" }}
                  >
                    {kpi.value}
                  </p>
                </div>
                <kpi.icon className="w-5 h-5 text-cockpit-secondary/40" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================================================================ */}
      {/* FILTERS                                                         */}
      {/* ================================================================ */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cockpit-secondary" />
          <input
            type="text"
            placeholder="Rechercher par dénomination, référence..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-cockpit-card border border-cockpit rounded-lg pl-10 pr-4 py-2.5 text-sm text-cockpit-primary placeholder:text-cockpit-secondary focus:outline-none focus:ring-2 focus:ring-[var(--color-active)]/40"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cockpit-secondary" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-cockpit-card border border-cockpit rounded-lg pl-10 pr-8 py-2.5 text-sm text-cockpit-primary focus:outline-none focus:ring-2 focus:ring-[var(--color-active)]/40 appearance-none"
          >
            <option value="">Tous les statuts</option>
            <option value="DEMANDE">En attente</option>
            <option value="PRIX_RECU">Prix reçu</option>
            <option value="ANNULE">Annulé</option>
          </select>
        </div>
      </div>

      {/* ================================================================ */}
      {/* DESKTOP TABLE                                                   */}
      {/* ================================================================ */}
      <div className="hidden md:block bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg overflow-hidden">
        {loading ? (
          <div className="p-8 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-cockpit-secondary" />
          </div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center">
            <Tag className="w-10 h-10 text-cockpit-secondary mx-auto mb-3 opacity-40" />
            <p className="text-cockpit-heading font-semibold mb-1">
              Aucune demande trouvée
            </p>
            <p className="text-cockpit-secondary text-sm">
              {search || statusFilter
                ? "Essayez avec d'autres filtres"
                : "Créez votre première demande de prix"}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-cockpit">
                <th className="text-left text-xs font-semibold text-cockpit-secondary uppercase tracking-wider p-4">
                  Réf
                </th>
                <th className="text-left text-xs font-semibold text-cockpit-secondary uppercase tracking-wider p-4">
                  Dénomination
                </th>
                <th className="text-left text-xs font-semibold text-cockpit-secondary uppercase tracking-wider p-4">
                  Devis lié
                </th>
                <th className="text-left text-xs font-semibold text-cockpit-secondary uppercase tracking-wider p-4">
                  Statut
                </th>
                <th className="text-left text-xs font-semibold text-cockpit-secondary uppercase tracking-wider p-4">
                  Créé par
                </th>
                <th className="text-right text-xs font-semibold text-cockpit-secondary uppercase tracking-wider p-4">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cockpit">
              {items.map((item) => {
                const badge = STATUT_BADGE[item.statut] || STATUT_BADGE.DEMANDE;
                return (
                  <tr
                    key={item.id}
                    className="hover:bg-cockpit-dark/50 transition-colors cursor-pointer"
                    onClick={() => setDrawerItem(item)}
                  >
                    <td className="p-4">
                      <p className="text-sm font-medium text-cockpit-primary">
                        {item.refDevis || "—"}
                      </p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-cockpit-primary font-medium">
                        {item.denomination}
                      </p>
                      <p className="text-xs text-cockpit-secondary">
                        {item.dimensions}
                      </p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-cockpit-secondary">
                        {item.refDevis || "—"}
                      </p>
                    </td>
                    <td className="p-4">
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badge.cls}`}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-cockpit-secondary">
                        {item.createdBy.prenom} {item.createdBy.nom}
                      </p>
                    </td>
                    <td className="p-4 text-right">
                      <span className="text-xs text-cockpit-secondary">
                        {new Date(item.createdAt).toLocaleDateString("fr-FR")}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ================================================================ */}
      {/* MOBILE CARDS                                                    */}
      {/* ================================================================ */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="p-8 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-cockpit-secondary" />
          </div>
        ) : items.length === 0 ? (
          <div className="bg-cockpit-card rounded-card border border-cockpit p-8 text-center">
            <Tag className="w-10 h-10 text-cockpit-secondary mx-auto mb-3 opacity-40" />
            <p className="text-cockpit-heading font-semibold mb-1">
              Aucune demande trouvée
            </p>
            <p className="text-cockpit-secondary text-sm">
              {search || statusFilter
                ? "Essayez avec d'autres filtres"
                : "Créez votre première demande de prix"}
            </p>
          </div>
        ) : (
          items.map((item) => {
            const badge = STATUT_BADGE[item.statut] || STATUT_BADGE.DEMANDE;
            return (
              <div
                key={item.id}
                className="bg-cockpit-card rounded-lg border border-cockpit p-4 cursor-pointer"
                onClick={() => setDrawerItem(item)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-cockpit-heading truncate">
                      {item.denomination}
                    </p>
                    <p className="text-xs text-cockpit-secondary">
                      {item.refDevis || item.dimensions}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ml-2 ${badge.cls}`}
                  >
                    {badge.label}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-cockpit text-xs text-cockpit-secondary">
                  <span>
                    {item.createdBy.prenom} {item.createdBy.nom}
                  </span>
                  <span>
                    {new Date(item.createdAt).toLocaleDateString("fr-FR")}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ================================================================ */}
      {/* PAGINATION                                                      */}
      {/* ================================================================ */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg border border-cockpit text-cockpit-secondary hover:text-cockpit-primary hover:border-[var(--color-active)]/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-cockpit-secondary px-3">
            Page {page} sur {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-lg border border-cockpit text-cockpit-secondary hover:text-cockpit-primary hover:border-[var(--color-active)]/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ================================================================ */}
      {/* MODALS / DRAWERS                                                */}
      {/* ================================================================ */}
      {showModal && (
        <NouvellDemandeModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            fetchData();
          }}
        />
      )}

      {drawerItem && (
        <NeedPriceDrawer
          item={drawerItem}
          onClose={() => setDrawerItem(null)}
          onUpdate={() => {
            fetchData();
          }}
        />
      )}
    </div>
  );
}
