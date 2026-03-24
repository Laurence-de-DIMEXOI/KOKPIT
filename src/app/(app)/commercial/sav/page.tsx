"use client";

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  Plus,
  Search,
  Filter,
  Loader2,
  FileText,
  ChevronLeft,
  ChevronRight,
  X,
  FolderOpen,
} from "lucide-react";
import clsx from "clsx";
import { useToast } from "@/components/ui/toast";
import {
  TYPES_SAV,
  STATUTS_SAV,
  getTypeLabel,
  getStatutConfig,
} from "@/data/sav-config";
import SAVDrawer from "@/components/sav/sav-drawer";

interface SAVDossier {
  id: string;
  numero: string;
  titre: string;
  contactNom: string | null;
  sellsyBdcRef: string | null;
  type: string;
  statut: string;
  description: string | null;
  assigneA?: { id: string; prenom: string; nom: string } | null;
  createdAt: string;
  updatedAt: string;
  _count?: { documents: number; commentaires: number };
}

interface UserOption {
  id: string;
  prenom: string;
  nom: string;
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── Relative time ──────────────────────────────────────────────────

function tempsRelatif(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffJ = Math.floor(diffH / 24);

  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `il y a ${diffMin}min`;
  if (diffH < 24) return `il y a ${diffH}h`;
  if (diffJ === 1) return "hier";
  if (diffJ < 7) return `il y a ${diffJ}j`;
  return date.toLocaleDateString("fr-FR");
}

// ── Main page ──────────────────────────────────────────────────────

export default function SAVPage() {
  const { addToast } = useToast();

  // Data
  const [dossiers, setDossiers] = useState<SAVDossier[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });

  // Filters
  const [search, setSearch] = useState("");
  const [statutFilter, setStatutFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [voirClotures, setVoirClotures] = useState(false);
  const [page, setPage] = useState(1);

  // Drawer
  const [selectedDossierId, setSelectedDossierId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Creation modal
  const [showModal, setShowModal] = useState(false);
  const [users, setUsers] = useState<UserOption[]>([]);

  // ── Fetch dossiers ────────────────────────────────────────────────

  const fetchDossiers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "20");
      if (search) params.set("search", search);
      if (statutFilter) params.set("statut", statutFilter);
      if (typeFilter) params.set("type", typeFilter);
      if (voirClotures) params.set("inclureClotures", "true");

      const res = await fetch(`/api/sav?${params}`);
      const data = await res.json();

      setDossiers(data.dossiers || []);
      if (data.pagination) setPagination(data.pagination);
    } catch {
      addToast("Erreur lors du chargement des dossiers", "error");
    } finally {
      setLoading(false);
    }
  }, [page, search, statutFilter, typeFilter, voirClotures, addToast]);

  useEffect(() => {
    fetchDossiers();
  }, [fetchDossiers]);

  // Debounced search
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  // ── Fetch users for creation modal ────────────────────────────────

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/conges/stats");
      const data = await res.json();
      const SAV_ASSIGNABLES = ["Michelle", "Daniella", "Bernard", "Elaury"];
      const allUsers = data.soldes || data.users || data.collaborateurs || [];
      const mapped = allUsers.map((u: any) => ({ id: u.userId || u.id, nom: u.nom, prenom: u.prenom }));
      const filtered = mapped.filter((u: any) =>
        SAV_ASSIGNABLES.some((name) => u.prenom?.toLowerCase() === name.toLowerCase())
      );
      setUsers(filtered.length > 0 ? filtered : mapped);
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    if (showModal && users.length === 0) fetchUsers();
  }, [showModal, users.length, fetchUsers]);

  // ── KPI ───────────────────────────────────────────────────────────

  const kpis = [
    {
      label: "Total dossiers",
      value: pagination.total,
    },
    {
      label: "A traiter",
      value: dossiers.filter((d) => d.statut === "A_TRAITER").length,
    },
    {
      label: "En cours",
      value: dossiers.filter((d) => d.statut === "EN_COURS" || d.statut === "EN_ATTENTE").length,
    },
    {
      label: "Traites",
      value: dossiers.filter((d) => d.statut === "TRAITE" || d.statut === "CLOTURE").length,
    },
  ];

  // ── Drawer handlers ───────────────────────────────────────────────

  function openDrawer(id: string) {
    setSelectedDossierId(id);
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setSelectedDossierId(null);
  }

  // ── Loading skeleton ──────────────────────────────────────────────

  if (loading && dossiers.length === 0) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="h-8 w-56 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-4 w-40 bg-gray-200 rounded mt-2 animate-pulse" />
          </div>
          <div className="h-10 w-40 bg-gray-200 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-10 w-full bg-gray-200 rounded-lg animate-pulse" />
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="px-4 py-3 border-b border-gray-100 flex gap-4 animate-pulse">
              <div className="h-4 w-20 bg-gray-200 rounded" />
              <div className="h-4 w-32 bg-gray-200 rounded" />
              <div className="h-4 w-24 bg-gray-200 rounded" />
              <div className="h-4 w-20 bg-gray-200 rounded ml-auto" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-cockpit-heading mb-1 flex items-center gap-2">
            <AlertTriangle className="w-7 h-7 text-teal-600" />
            SAV — Litiges
          </h1>
          <p className="text-cockpit-secondary text-sm">
            Suivi des dossiers clients
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 text-white font-semibold px-4 py-2.5 rounded-lg text-sm transition-all"
          style={{
            background: "linear-gradient(135deg, #0E6973, #0A4F57)",
            boxShadow: "0 4px 14px rgba(14,105,115,0.30)",
          }}
        >
          <Plus className="w-4 h-4" />
          Nouveau dossier
        </button>
      </div>

      {/* ── KPI Cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {kpis.map((kpi, i) => (
          <div
            key={i}
            className="rounded-xl p-4 text-white"
            style={{
              background: "linear-gradient(135deg, #0E6973, #0A4F57)",
              boxShadow: "0 4px 14px rgba(14,105,115,0.30)",
            }}
          >
            <p className="text-xs font-medium text-white/70 uppercase tracking-wide">
              {kpi.label}
            </p>
            <p className="text-2xl font-bold mt-1">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* ── Filters ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cockpit-secondary" />
          <input
            type="text"
            placeholder="Rechercher un dossier..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full bg-cockpit-card border border-cockpit rounded-lg pl-10 pr-4 py-2.5 text-sm text-cockpit-primary placeholder:text-cockpit-secondary focus:outline-none focus:ring-2 focus:ring-teal-500/40"
          />
        </div>

        {/* Statut */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cockpit-secondary" />
          <select
            value={statutFilter}
            onChange={(e) => {
              setStatutFilter(e.target.value);
              setPage(1);
            }}
            className="bg-cockpit-card border border-cockpit rounded-lg pl-10 pr-8 py-2.5 text-sm text-cockpit-primary focus:outline-none focus:ring-2 focus:ring-teal-500/40 appearance-none"
          >
            <option value="">Tous les statuts</option>
            {STATUTS_SAV.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Type */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cockpit-secondary" />
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="bg-cockpit-card border border-cockpit rounded-lg pl-10 pr-8 py-2.5 text-sm text-cockpit-primary focus:outline-none focus:ring-2 focus:ring-teal-500/40 appearance-none"
          >
            <option value="">Tous les types</option>
            {TYPES_SAV.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Toggle clotures */}
        <label className="flex items-center gap-2 text-sm text-cockpit-secondary cursor-pointer select-none whitespace-nowrap">
          <input
            type="checkbox"
            checked={voirClotures}
            onChange={(e) => {
              setVoirClotures(e.target.checked);
              setPage(1);
            }}
            className="rounded border-cockpit text-teal-600 focus:ring-teal-500/40"
          />
          Voir les clotures
        </label>
      </div>

      {/* ── Desktop Table ───────────────────────────────────────── */}
      <div className="hidden md:block bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-cockpit">
              {["#Numero", "Client", "BDC", "Type", "Statut", "Assigne", "Derniere action", "Docs"].map(
                (col) => (
                  <th
                    key={col}
                    className="text-left text-xs font-semibold text-cockpit-secondary uppercase tracking-wider p-4"
                  >
                    {col}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-cockpit">
            {dossiers.map((d) => {
              const statut = getStatutConfig(d.statut);
              return (
                <tr
                  key={d.id}
                  className="hover:bg-cockpit-dark/50 transition-colors cursor-pointer"
                  onClick={() => openDrawer(d.id)}
                >
                  <td className="p-4">
                    <span className="text-sm font-mono font-semibold text-teal-600">
                      {d.numero}
                    </span>
                  </td>
                  <td className="p-4">
                    <p className="text-sm text-cockpit-primary font-medium">
                      {d.contactNom || "—"}
                    </p>
                  </td>
                  <td className="p-4">
                    <p className="text-sm text-cockpit-secondary">
                      {d.sellsyBdcRef || "—"}
                    </p>
                  </td>
                  <td className="p-4">
                    <span className="text-xs font-medium text-cockpit-primary bg-cockpit-dark px-2 py-1 rounded">
                      {getTypeLabel(d.type)}
                    </span>
                  </td>
                  <td className="p-4">
                    <span
                      className={clsx(
                        "inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full",
                        statut.couleur
                      )}
                    >
                      <span className={clsx("w-1.5 h-1.5 rounded-full", statut.dot)} />
                      {statut.label}
                    </span>
                  </td>
                  <td className="p-4">
                    <p className="text-sm text-cockpit-secondary">
                      {d.assigneA
                        ? `${d.assigneA.prenom} ${d.assigneA.nom}`
                        : "—"}
                    </p>
                  </td>
                  <td className="p-4">
                    <p className="text-xs text-cockpit-secondary">
                      {tempsRelatif(d.updatedAt)}
                    </p>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1 text-xs text-cockpit-secondary">
                      <FileText className="w-3.5 h-3.5" />
                      {d._count?.documents ?? 0}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {dossiers.length === 0 && (
          <div className="p-8 text-center">
            <FolderOpen className="w-10 h-10 text-cockpit-secondary mx-auto mb-3 opacity-40" />
            <p className="text-cockpit-heading font-semibold mb-1">
              Aucun dossier trouve
            </p>
            <p className="text-cockpit-secondary text-sm">
              {search
                ? "Essayez avec d'autres termes de recherche"
                : "Aucun dossier SAV pour les filtres selectionnes"}
            </p>
          </div>
        )}
      </div>

      {/* ── Mobile Cards ────────────────────────────────────────── */}
      <div className="md:hidden space-y-3">
        {dossiers.map((d) => {
          const statut = getStatutConfig(d.statut);
          return (
            <div
              key={d.id}
              className="bg-cockpit-card rounded-lg border border-cockpit p-4 cursor-pointer hover:bg-cockpit-dark/30 transition-colors"
              onClick={() => openDrawer(d.id)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-semibold text-teal-600">
                      {d.numero}
                    </span>
                    <span
                      className={clsx(
                        "inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full",
                        statut.couleur
                      )}
                    >
                      <span className={clsx("w-1.5 h-1.5 rounded-full", statut.dot)} />
                      {statut.label}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-cockpit-heading truncate">
                    {d.titre}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-cockpit-secondary">
                <div className="flex items-center gap-3">
                  <span>{d.contactNom || "—"}</span>
                  <span className="bg-cockpit-dark px-1.5 py-0.5 rounded text-cockpit-primary">
                    {getTypeLabel(d.type)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    {d._count?.documents ?? 0}
                  </span>
                  <span>{tempsRelatif(d.updatedAt)}</span>
                </div>
              </div>
            </div>
          );
        })}

        {dossiers.length === 0 && (
          <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg p-8 text-center">
            <FolderOpen className="w-10 h-10 text-cockpit-secondary mx-auto mb-3 opacity-40" />
            <p className="text-cockpit-heading font-semibold mb-1">
              Aucun dossier trouve
            </p>
            <p className="text-cockpit-secondary text-sm">
              {search
                ? "Essayez avec d'autres termes"
                : "Aucun dossier SAV"}
            </p>
          </div>
        )}
      </div>

      {/* ── Pagination ──────────────────────────────────────────── */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="p-2 rounded-lg bg-cockpit-card border border-cockpit hover:bg-cockpit-dark disabled:opacity-40 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-cockpit-primary" />
          </button>
          <span className="text-sm text-cockpit-secondary">
            Page {page} / {pagination.totalPages}
          </span>
          <button
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            className="p-2 rounded-lg bg-cockpit-card border border-cockpit hover:bg-cockpit-dark disabled:opacity-40 transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-cockpit-primary" />
          </button>
        </div>
      )}

      {/* ── Drawer ──────────────────────────────────────────────── */}
      <SAVDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        dossierId={selectedDossierId}
        onRefresh={fetchDossiers}
      />

      {/* ── Creation Modal ──────────────────────────────────────── */}
      {showModal && <CreationModal
        onClose={() => setShowModal(false)}
        onSuccess={() => {
          setShowModal(false);
          addToast("Dossier SAV cree avec succes", "success");
          fetchDossiers();
        }}
        users={users}
      />}
    </div>
  );
}

// ── Creation Modal ──────────────────────────────────────────────────

interface CreationModalProps {
  onClose: () => void;
  onSuccess: () => void;
  users: UserOption[];
}

function CreationModal({ onClose, onSuccess, users }: CreationModalProps) {
  const { addToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    contactNom: "",
    sellsyBdcRef: "",
    titre: "",
    type: TYPES_SAV[0].value,
    description: "",
    assigneAId: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titre.trim()) {
      addToast("Le titre est requis", "warning");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/sav", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactNom: form.contactNom || null,
          sellsyBdcRef: form.sellsyBdcRef || null,
          titre: form.titre,
          type: form.type,
          description: form.description || null,
          assigneAId: form.assigneAId || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erreur lors de la creation");
      }

      onSuccess();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      addToast(message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  if (typeof window === "undefined") return null;

  return createPortal(
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-cockpit-card rounded-2xl border border-cockpit shadow-cockpit-lg w-full max-w-lg max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-cockpit">
            <h2 className="text-lg font-semibold text-cockpit-heading">
              Nouveau dossier SAV
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-cockpit-dark rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-cockpit-secondary" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Client */}
            <div>
              <label className="block text-xs font-semibold text-cockpit-secondary uppercase tracking-wide mb-1.5">
                Client
              </label>
              <input
                type="text"
                value={form.contactNom}
                onChange={(e) => updateField("contactNom", e.target.value)}
                placeholder="Nom du client"
                className="w-full bg-cockpit-dark border border-cockpit rounded-lg px-3 py-2.5 text-sm text-cockpit-primary placeholder:text-cockpit-secondary focus:outline-none focus:ring-2 focus:ring-teal-500/40"
              />
            </div>

            {/* BDC Sellsy */}
            <div>
              <label className="block text-xs font-semibold text-cockpit-secondary uppercase tracking-wide mb-1.5">
                BDC Sellsy ref
              </label>
              <input
                type="text"
                value={form.sellsyBdcRef}
                onChange={(e) => updateField("sellsyBdcRef", e.target.value)}
                placeholder="Reference du bon de commande"
                className="w-full bg-cockpit-dark border border-cockpit rounded-lg px-3 py-2.5 text-sm text-cockpit-primary placeholder:text-cockpit-secondary focus:outline-none focus:ring-2 focus:ring-teal-500/40"
              />
            </div>

            {/* Titre */}
            <div>
              <label className="block text-xs font-semibold text-cockpit-secondary uppercase tracking-wide mb-1.5">
                Titre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.titre}
                onChange={(e) => updateField("titre", e.target.value)}
                placeholder="Titre du dossier"
                required
                className="w-full bg-cockpit-dark border border-cockpit rounded-lg px-3 py-2.5 text-sm text-cockpit-primary placeholder:text-cockpit-secondary focus:outline-none focus:ring-2 focus:ring-teal-500/40"
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-xs font-semibold text-cockpit-secondary uppercase tracking-wide mb-1.5">
                Type
              </label>
              <select
                value={form.type}
                onChange={(e) => updateField("type", e.target.value)}
                className="w-full bg-cockpit-dark border border-cockpit rounded-lg px-3 py-2.5 text-sm text-cockpit-primary focus:outline-none focus:ring-2 focus:ring-teal-500/40 appearance-none"
              >
                {TYPES_SAV.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-cockpit-secondary uppercase tracking-wide mb-1.5">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                rows={3}
                placeholder="Description du probleme..."
                className="w-full bg-cockpit-dark border border-cockpit rounded-lg px-3 py-2.5 text-sm text-cockpit-primary placeholder:text-cockpit-secondary focus:outline-none focus:ring-2 focus:ring-teal-500/40 resize-none"
              />
            </div>

            {/* Assigne */}
            <div>
              <label className="block text-xs font-semibold text-cockpit-secondary uppercase tracking-wide mb-1.5">
                Assigne a
              </label>
              <select
                value={form.assigneAId}
                onChange={(e) => updateField("assigneAId", e.target.value)}
                className="w-full bg-cockpit-dark border border-cockpit rounded-lg px-3 py-2.5 text-sm text-cockpit-primary focus:outline-none focus:ring-2 focus:ring-teal-500/40 appearance-none"
              >
                <option value="">Non assigne</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.prenom} {u.nom}
                  </option>
                ))}
              </select>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-lg text-sm font-medium text-cockpit-secondary hover:bg-cockpit-dark border border-cockpit transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 text-white font-semibold px-4 py-2.5 rounded-lg text-sm transition-all disabled:opacity-50"
                style={{
                  background: "linear-gradient(135deg, #0E6973, #0A4F57)",
                  boxShadow: "0 4px 14px rgba(14,105,115,0.30)",
                }}
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Creer le dossier
              </button>
            </div>
          </form>
        </div>
      </div>
    </>,
    document.body
  );
}
