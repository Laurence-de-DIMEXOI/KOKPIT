"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useSession } from "next-auth/react";
import {
  Sparkles,
  Plus,
  RefreshCw,
  Loader2,
  Search,
  X,
  MoreVertical,
  Copy,
  Trash2,
  Eye,
  Pencil,
  Image as ImageIcon,
  FileText,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Upload,
  Download,
  ZoomIn,
  Settings,
  FileDown,
  ExternalLink,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface CanalMarketing {
  id: string;
  nom: string;
  couleur: string | null;
  actif: boolean;
}

interface OperationFichier {
  id: string;
  nom: string;
  storagePath: string;
  mimeType: string;
  taille: number;
  type: string;
  ordre: number;
}

interface Operation {
  id: string;
  date: string;
  titre: string;
  type: OpType;
  description: string | null;
  canalId: string | null;
  canal: CanalMarketing | null;
  notes: string | null;
  statut: StatutOp;
  fichiers: OperationFichier[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  source?: "operation" | "planning";
  coverImage?: string | null;
}

type OpType =
  | "POST_FACEBOOK"
  | "POST_INSTAGRAM"
  | "CAMPAGNE_META_ADS"
  | "CAMPAGNE_GOOGLE_ADS"
  | "NEWSLETTER"
  | "SMS"
  | "CATALOGUE"
  | "PLV"
  | "EVENEMENT"
  | "ARTICLE_BLOG"
  | "AUTRE";

type StatutOp = "BROUILLON" | "PLANIFIE" | "EN_COURS" | "TERMINE";

const OP_TYPE_LABELS: Record<OpType, string> = {
  POST_FACEBOOK: "Post Facebook",
  POST_INSTAGRAM: "Story Instagram",
  CAMPAGNE_META_ADS: "Meta Ads",
  CAMPAGNE_GOOGLE_ADS: "Google Ads",
  NEWSLETTER: "Newsletter",
  SMS: "SMS",
  CATALOGUE: "Catalogue",
  PLV: "PLV",
  EVENEMENT: "Evénement",
  ARTICLE_BLOG: "Article Blog",
  AUTRE: "Autre",
};

const OP_TYPE_COLORS: Record<OpType, string> = {
  POST_FACEBOOK: "#4267B2",
  POST_INSTAGRAM: "#E1306C",
  CAMPAGNE_META_ADS: "#1877F2",
  CAMPAGNE_GOOGLE_ADS: "#34A853",
  NEWSLETTER: "#0B996E",
  SMS: "#8B5CF6",
  CATALOGUE: "#0EA5E9",
  PLV: "#C2410C",
  EVENEMENT: "#F59E0B",
  ARTICLE_BLOG: "#6366F1",
  AUTRE: "#6B7280",
};

const STATUT_LABELS: Record<StatutOp, string> = {
  BROUILLON: "Brouillon",
  PLANIFIE: "Planifié",
  EN_COURS: "En cours",
  TERMINE: "Terminé",
};

const STATUT_COLORS: Record<StatutOp, string> = {
  BROUILLON: "bg-cockpit-dark text-cockpit-secondary",
  PLANIFIE: "bg-blue-500/10 text-blue-400",
  EN_COURS: "bg-amber-500/10 text-amber-400",
  TERMINE: "bg-emerald-500/10 text-emerald-400",
};

// ─── Storage URL ───────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";

function getPublicUrl(storagePath: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/op-marketing/${storagePath}`;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

function getWeekLabel(iso: string) {
  const d = new Date(iso);
  const startOfWeek = new Date(d);
  startOfWeek.setDate(d.getDate() - d.getDay() + 1);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  return `${startOfWeek.toLocaleDateString("fr-FR", opts)} - ${endOfWeek.toLocaleDateString("fr-FR", opts)}`;
}

function getWeekKey(iso: string) {
  const d = new Date(iso);
  const startOfWeek = new Date(d);
  startOfWeek.setDate(d.getDate() - d.getDay() + 1);
  return startOfWeek.toISOString().slice(0, 10);
}

function groupByWeek(ops: Operation[]): { weekKey: string; label: string; ops: Operation[] }[] {
  const map = new Map<string, { label: string; ops: Operation[] }>();
  for (const op of ops) {
    const key = getWeekKey(op.date);
    if (!map.has(key)) {
      map.set(key, { label: getWeekLabel(op.date), ops: [] });
    }
    map.get(key)!.ops.push(op);
  }
  return Array.from(map.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([weekKey, v]) => ({ weekKey, ...v }));
}

function monthLabel(year: number, month: number) {
  return new Date(year, month, 1).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function OperationsMarketingPage() {
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const canEdit = userRole === "MARKETING" || userRole === "ADMIN" || userRole === "DIRECTION";

  const [operations, setOperations] = useState<Operation[]>([]);
  const [canaux, setCanaux] = useState<CanalMarketing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filtres
  const [periode, setPeriode] = useState<"ce_mois" | "mois_dernier" | "mois">("ce_mois");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}`;
  });
  const [filterTypes, setFilterTypes] = useState<OpType[]>([]);
  const [filterCanaux, setFilterCanaux] = useState<string[]>([]);
  const [filterStatuts, setFilterStatuts] = useState<StatutOp[]>([]);
  const [search, setSearch] = useState("");

  // Formulaire
  const [showForm, setShowForm] = useState(false);
  const [editingOp, setEditingOp] = useState<Operation | null>(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    titre: "",
    type: "" as OpType | "",
    description: "",
    canalId: "",
    notes: "",
    statut: "PLANIFIE" as StatutOp,
  });
  const [saving, setSaving] = useState(false);

  // Upload fichiers
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  // Détail
  const [detailOp, setDetailOp] = useState<Operation | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);

  // Gestion canaux
  const [showCanaux, setShowCanaux] = useState(false);
  const [allCanaux, setAllCanaux] = useState<CanalMarketing[]>([]);
  const [newCanalNom, setNewCanalNom] = useState("");
  const [newCanalCouleur, setNewCanalCouleur] = useState("#6B7280");
  const [savingCanal, setSavingCanal] = useState(false);

  // Menu contextuel
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  // ─── Fetch ──────────────────────────────────────────────────────────────

  const fetchCanaux = useCallback(async () => {
    try {
      const res = await fetch("/api/marketing/canaux");
      const json = await res.json();
      setCanaux(json.canaux || []);
    } catch {}
  }, []);

  // Mapper labels planning → OpType
  const mapPlanningLabelsToType = (labels: string[]): OpType => {
    if (labels.includes("CANAL_META")) return "POST_FACEBOOK";
    if (labels.includes("CANAL_STORY") || labels.includes("STORY")) return "POST_INSTAGRAM";
    if (labels.includes("CANAL_GOOGLE")) return "CAMPAGNE_GOOGLE_ADS";
    if (labels.includes("CONTEXTE_NEWSLETTER") || labels.includes("EMAIL_BREVO")) return "NEWSLETTER";
    if (labels.includes("BLOG_SEO")) return "ARTICLE_BLOG";
    if (labels.includes("VIDEO_REEL")) return "POST_INSTAGRAM";
    if (labels.includes("CONTEXTE_PUBLICITE")) return "CAMPAGNE_META_ADS";
    return "AUTRE";
  };

  const mapPlanningStatut = (statut: string): StatutOp => {
    if (statut === "POSTE") return "TERMINE";
    return "PLANIFIE";
  };

  const fetchOperations = useCallback(
    async (fresh = false) => {
      if (fresh) setRefreshing(true);
      try {
        const params = new URLSearchParams();
        if (periode === "mois") {
          params.set("periode", "mois");
          params.set("mois", selectedMonth);
        } else {
          params.set("periode", periode);
        }
        filterTypes.forEach((t) => params.append("type", t));
        filterCanaux.forEach((c) => params.append("canalId", c));
        filterStatuts.forEach((s) => params.append("statut", s));
        if (search.trim()) params.set("search", search.trim());

        // Mois pour le planning
        let planningMonth: string;
        if (periode === "mois") {
          planningMonth = selectedMonth;
        } else if (periode === "mois_dernier") {
          const n = new Date();
          const d = new Date(n.getFullYear(), n.getMonth() - 1, 1);
          planningMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        } else {
          const n = new Date();
          planningMonth = `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}`;
        }

        const [opsRes, planningRes] = await Promise.all([
          fetch(`/api/marketing/operations?${params}`),
          fetch(`/api/planning?mois=${planningMonth}`),
        ]);

        const opsJson = await opsRes.json();
        const planningJson = await planningRes.json();

        const ops: Operation[] = (opsJson.operations || []).map((o: Operation) => ({
          ...o,
          source: "operation" as const,
        }));

        // Mapper les posts planning PRET_A_POSTER / POSTE
        const planningPosts: Operation[] = ((planningJson.posts || []) as any[])
          .filter((p: any) => p.statut === "PRET_A_POSTER" || p.statut === "POSTE")
          .filter((p: any) => p.scheduledDate)
          .map((p: any) => {
            const type = mapPlanningLabelsToType(p.labels || []);
            const statut = mapPlanningStatut(p.statut);
            if (filterTypes.length > 0 && !filterTypes.includes(type)) return null;
            if (filterStatuts.length > 0 && !filterStatuts.includes(statut)) return null;
            if (search.trim()) {
              const s = search.trim().toLowerCase();
              if (!p.title.toLowerCase().includes(s) && !(p.description || "").toLowerCase().includes(s)) return null;
            }
            return {
              id: `planning-${p.id}`,
              date: p.scheduledDate,
              titre: p.title,
              type,
              description: p.description || null,
              canalId: null,
              canal: null,
              notes: null,
              statut,
              fichiers: [],
              createdBy: p.createdById,
              createdAt: p.createdAt,
              updatedAt: p.updatedAt,
              source: "planning" as const,
              coverImage: p.coverImage || null,
            } as Operation;
          })
          .filter(Boolean) as Operation[];

        const merged = [...ops, ...planningPosts].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        setOperations(merged);
      } catch (err) {
        console.error("Erreur fetch ops:", err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [periode, selectedMonth, filterTypes, filterCanaux, filterStatuts, search]
  );

  useEffect(() => {
    fetchCanaux();
  }, [fetchCanaux]);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => fetchOperations(), 300);
    return () => clearTimeout(t);
  }, [fetchOperations]);

  // ─── CRUD ───────────────────────────────────────────────────────────────

  const openCreateForm = () => {
    setEditingOp(null);
    setPendingFiles([]);
    setFormData({
      date: new Date().toISOString().slice(0, 10),
      titre: "",
      type: "",
      description: "",
      canalId: "",
      notes: "",
      statut: "PLANIFIE",
    });
    setShowForm(true);
  };

  const openEditForm = (op: Operation) => {
    setEditingOp(op);
    setPendingFiles([]);
    setFormData({
      date: op.date.slice(0, 10),
      titre: op.titre,
      type: op.type,
      description: op.description || "",
      canalId: op.canalId || "",
      notes: op.notes || "",
      statut: op.statut,
    });
    setShowForm(true);
  };

  const saveOperation = async () => {
    if (!formData.titre.trim() || !formData.type || !formData.date) return;
    setSaving(true);
    try {
      const url = editingOp
        ? `/api/marketing/operations/${editingOp.id}`
        : "/api/marketing/operations";
      const method = editingOp ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      const opId = editingOp?.id || json.operation?.id;

      // Upload fichiers en attente
      if (opId && pendingFiles.length > 0) {
        await uploadFiles(opId);
      }

      setShowForm(false);
      fetchOperations(true);
    } catch (err) {
      console.error("Erreur save:", err);
    } finally {
      setSaving(false);
    }
  };

  const deleteOperation = async (id: string) => {
    if (!confirm("Supprimer cette opération ?")) return;
    await fetch(`/api/marketing/operations/${id}`, { method: "DELETE" });
    fetchOperations(true);
  };

  const duplicateOperation = async (id: string) => {
    await fetch(`/api/marketing/operations/${id}/duplicate`, { method: "POST" });
    fetchOperations(true);
  };

  // ─── Période navigation ─────────────────────────────────────────────────

  const navigateMonth = (dir: -1 | 1) => {
    const [y, m] = selectedMonth.split("-").map(Number);
    const d = new Date(y, m - 1 + dir, 1);
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    setPeriode("mois");
  };

  // ─── Upload fichiers ────────────────────────────────────────────────────

  const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 Mo
  const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  const ACCEPTED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".pdf"];

  const getMimeFromName = (name: string): string => {
    const ext = name.toLowerCase().split(".").pop();
    const map: Record<string, string> = {
      jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
      webp: "image/webp", pdf: "application/pdf",
    };
    return map[ext || ""] || "";
  };

  const addFiles = (files: FileList | File[]) => {
    const arr = Array.from(files).filter((f) => {
      const mime = f.type || getMimeFromName(f.name);
      const ext = "." + (f.name.toLowerCase().split(".").pop() || "");
      if (!ACCEPTED_TYPES.includes(mime) && !ACCEPTED_EXTENSIONS.includes(ext)) return false;
      if (f.size > MAX_FILE_SIZE) return false;
      return true;
    });
    setPendingFiles((prev) => [...prev, ...arr]);
  };

  const removePendingFile = (idx: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const uploadFiles = async (operationId: string) => {
    if (pendingFiles.length === 0) return;
    setUploading(true);
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

    try {
      for (const file of pendingFiles) {
        const mime = file.type || getMimeFromName(file.name);
        const slug = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const uid = crypto.randomUUID();
        const storagePath = `${operationId}/${uid}-${slug}`;

        // Upload direct vers Supabase Storage (pas de limite 4.5 Mo Vercel)
        const uploadRes = await fetch(
          `${supabaseUrl}/storage/v1/object/op-marketing/${storagePath}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${supabaseKey}`,
              apikey: supabaseKey,
              "Content-Type": mime,
              "x-upsert": "true",
            },
            body: file,
          }
        );

        if (!uploadRes.ok) {
          console.error("Erreur upload Supabase:", await uploadRes.text());
          continue;
        }

        // Enregistrer les métadonnées via l'API
        await fetch(`/api/marketing/operations/${operationId}/fichiers/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nom: file.name,
            storagePath,
            mimeType: mime,
            taille: file.size,
          }),
        });
      }
    } catch (err) {
      console.error("Erreur upload:", err);
    } finally {
      setUploading(false);
      setPendingFiles([]);
    }
  };

  const openDetail = (op: Operation) => {
    setDetailOp(op);
  };

  const deleteFile = async (opId: string, fichierId: string) => {
    setDeletingFileId(fichierId);
    try {
      await fetch(`/api/marketing/operations/${opId}/fichiers/${fichierId}`, {
        method: "DELETE",
      });
      // Mettre à jour l'opération détail
      setDetailOp((prev) =>
        prev ? { ...prev, fichiers: prev.fichiers.filter((f) => f.id !== fichierId) } : null
      );
      // Refresh operations list
      fetchOperations(true);
    } catch (err) {
      console.error("Erreur suppression fichier:", err);
    } finally {
      setDeletingFileId(null);
    }
  };

  // ─── Gestion canaux ─────────────────────────────────────────────────────

  const openCanaux = async () => {
    setShowCanaux(true);
    try {
      const res = await fetch("/api/marketing/canaux?inclureInactifs=true");
      const json = await res.json();
      setAllCanaux(json.canaux || []);
    } catch {}
  };

  const toggleCanal = async (canal: CanalMarketing) => {
    await fetch(`/api/marketing/canaux/${canal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actif: !canal.actif }),
    });
    setAllCanaux((prev) =>
      prev.map((c) => (c.id === canal.id ? { ...c, actif: !c.actif } : c))
    );
    fetchCanaux(); // refresh active canaux list
  };

  const createCanal = async () => {
    if (!newCanalNom.trim()) return;
    setSavingCanal(true);
    try {
      const res = await fetch("/api/marketing/canaux", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom: newCanalNom.trim(), couleur: newCanalCouleur }),
      });
      const json = await res.json();
      if (json.canal) {
        setAllCanaux((prev) => [...prev, json.canal]);
        setNewCanalNom("");
        setNewCanalCouleur("#6B7280");
        fetchCanaux();
      }
    } catch {}
    setSavingCanal(false);
  };

  // ─── Export PDF ─────────────────────────────────────────────────────────

  const [exporting, setExporting] = useState(false);

  const exportPdf = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (periode === "mois") {
        params.set("periode", "mois");
        params.set("mois", selectedMonth);
      } else {
        params.set("periode", periode);
      }
      filterTypes.forEach((t) => params.append("type", t));
      filterStatuts.forEach((s) => params.append("statut", s));

      const res = await fetch(`/api/marketing/operations/export?${params}`);
      if (!res.ok) throw new Error("Export échoué");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `operations-marketing.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Erreur export:", err);
    } finally {
      setExporting(false);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────

  const weeks = groupByWeek(operations);
  const currentMonthLabel =
    periode === "ce_mois"
      ? monthLabel(new Date().getFullYear(), new Date().getMonth())
      : periode === "mois_dernier"
        ? monthLabel(new Date().getFullYear(), new Date().getMonth() - 1)
        : (() => {
            const [y, m] = selectedMonth.split("-").map(Number);
            return monthLabel(y, m - 1);
          })();

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-56 bg-cockpit-dark rounded-lg animate-pulse" />
            <div className="h-4 w-40 bg-cockpit-dark rounded mt-2 animate-pulse" />
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-cockpit-card rounded-card border border-cockpit animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-cockpit-heading mb-1 flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-[var(--color-active)]" />
            Operations marketing
          </h1>
          <p className="text-cockpit-secondary text-sm capitalize">{currentMonthLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportPdf}
            disabled={exporting}
            className="flex items-center gap-2 bg-cockpit-card border border-cockpit px-3 py-2 rounded-lg hover:bg-cockpit-dark transition-colors text-sm text-cockpit-secondary disabled:opacity-50"
            title="Exporter PDF"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
          </button>
          {canEdit && (
            <button
              onClick={openCanaux}
              className="flex items-center gap-2 bg-cockpit-card border border-cockpit px-3 py-2 rounded-lg hover:bg-cockpit-dark transition-colors text-sm text-cockpit-secondary"
              title="Gérer les canaux"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => fetchOperations(true)}
            disabled={refreshing}
            className="flex items-center gap-2 bg-cockpit-card border border-cockpit px-3 py-2 rounded-lg hover:bg-cockpit-dark transition-colors disabled:opacity-50 text-sm"
          >
            {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          </button>
          {canEdit && (
            <button
              onClick={openCreateForm}
              className="flex items-center gap-2 bg-[var(--color-active)] text-white px-4 py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity text-sm"
            >
              <Plus className="w-4 h-4" />
              Nouvelle opération
            </button>
          )}
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-cockpit-card rounded-card border border-cockpit p-3 sm:p-4 space-y-3">
        {/* Ligne 1 : Période + recherche */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Période */}
          <div className="flex items-center bg-cockpit-dark rounded-lg overflow-hidden text-xs">
            <button
              onClick={() => navigateMonth(-1)}
              className="px-2 py-1.5 hover:bg-cockpit-card transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            {(["ce_mois", "mois_dernier", "mois"] as const).map((p) => (
              <button
                key={p}
                onClick={() => {
                  setPeriode(p);
                  if (p === "ce_mois") {
                    const n = new Date();
                    setSelectedMonth(`${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}`);
                  } else if (p === "mois_dernier") {
                    const n = new Date();
                    const d = new Date(n.getFullYear(), n.getMonth() - 1, 1);
                    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
                  }
                }}
                className={`px-3 py-1.5 transition-colors whitespace-nowrap ${
                  periode === p
                    ? "bg-[var(--color-active)] text-white"
                    : "hover:bg-cockpit-card text-cockpit-secondary"
                }`}
              >
                {p === "ce_mois" ? "Ce mois" : p === "mois_dernier" ? "Mois dernier" : selectedMonth.replace("-", "/")}
              </button>
            ))}
            <button
              onClick={() => navigateMonth(1)}
              className="px-2 py-1.5 hover:bg-cockpit-card transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Recherche */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-cockpit-secondary" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-cockpit-dark border border-cockpit rounded-lg text-xs text-cockpit-primary placeholder:text-cockpit-secondary focus:outline-none focus:ring-1 focus:ring-[var(--color-active)]"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2">
                <X className="w-3.5 h-3.5 text-cockpit-secondary" />
              </button>
            )}
          </div>
        </div>

        {/* Ligne 2 : Types + Canaux + Statuts */}
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(OP_TYPE_LABELS) as OpType[]).map((t) => (
            <button
              key={t}
              onClick={() =>
                setFilterTypes((prev) =>
                  prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
                )
              }
              className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-all border ${
                filterTypes.includes(t)
                  ? "border-transparent text-white"
                  : "border-cockpit text-cockpit-secondary hover:border-cockpit-secondary"
              }`}
              style={
                filterTypes.includes(t)
                  ? { backgroundColor: OP_TYPE_COLORS[t] }
                  : {}
              }
            >
              {OP_TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      {operations.length === 0 ? (
        <div className="bg-cockpit-card rounded-card border border-cockpit p-8 text-center">
          <Sparkles className="w-10 h-10 text-cockpit-secondary mx-auto mb-3 opacity-40" />
          <p className="text-cockpit-secondary text-sm">Aucune opération pour cette période</p>
          <button
            onClick={openCreateForm}
            className="mt-3 text-[var(--color-active)] text-sm font-medium hover:underline"
          >
            + Créer une opération
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {weeks.map((week) => (
            <div key={week.weekKey}>
              {/* Semaine header */}
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-cockpit-secondary" />
                <span className="text-xs font-semibold text-cockpit-secondary uppercase tracking-wider">
                  {week.label}
                </span>
                <span className="text-[10px] text-cockpit-secondary bg-cockpit-dark px-2 py-0.5 rounded-full">
                  {week.ops.length}
                </span>
              </div>

              {/* Cartes */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {week.ops.map((op) => (
                  <div
                    key={op.id}
                    className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg hover:border-[var(--color-active)]/30 transition-all cursor-pointer group relative overflow-hidden"
                    onClick={() => openDetail(op)}
                  >
                    {/* Thumbnail ou vignette couleur */}
                    {(() => {
                      const firstImg = op.fichiers.find((f) => f.mimeType?.startsWith("image/"));
                      const imgUrl = op.coverImage || (firstImg ? getPublicUrl(firstImg.storagePath) : null);
                      if (imgUrl) {
                        return (
                          <div className="w-full bg-cockpit-dark relative overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={imgUrl} alt="" className="w-full h-auto object-contain" />
                          </div>
                        );
                      }
                      return (
                        <div className="h-2 rounded-t-card" style={{ backgroundColor: OP_TYPE_COLORS[op.type] }} />
                      );
                    })()}

                    <div className="p-4">
                      {/* Top row : date + statut + menu */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-cockpit-secondary font-medium">
                            {formatDateShort(op.date)}
                          </span>
                          {op.source === "planning" && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-400 font-medium">
                              Planning
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUT_COLORS[op.statut]}`}>
                            {STATUT_LABELS[op.statut]}
                          </span>
                          {op.source !== "planning" && canEdit && (
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setMenuOpenId(menuOpenId === op.id ? null : op.id);
                              }}
                              className="p-1 rounded hover:bg-cockpit-dark transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <MoreVertical className="w-3.5 h-3.5 text-cockpit-secondary" />
                            </button>
                            {menuOpenId === op.id && (
                              <div
                                className="absolute right-0 top-full mt-1 bg-cockpit-card border border-cockpit rounded-lg shadow-cockpit-lg z-20 py-1 min-w-[140px]"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  className="w-full px-3 py-1.5 text-xs text-cockpit-primary hover:bg-cockpit-dark flex items-center gap-2 transition-colors"
                                  onClick={() => { openDetail(op); setMenuOpenId(null); }}
                                >
                                  <Eye className="w-3.5 h-3.5" /> Voir
                                </button>
                                <button
                                  className="w-full px-3 py-1.5 text-xs text-cockpit-primary hover:bg-cockpit-dark flex items-center gap-2 transition-colors"
                                  onClick={() => { openEditForm(op); setMenuOpenId(null); }}
                                >
                                  <Pencil className="w-3.5 h-3.5" /> Modifier
                                </button>
                                <button
                                  className="w-full px-3 py-1.5 text-xs text-cockpit-primary hover:bg-cockpit-dark flex items-center gap-2 transition-colors"
                                  onClick={() => { duplicateOperation(op.id); setMenuOpenId(null); }}
                                >
                                  <Copy className="w-3.5 h-3.5" /> Dupliquer
                                </button>
                                <button
                                  className="w-full px-3 py-1.5 text-xs text-red-400 hover:bg-cockpit-dark flex items-center gap-2 transition-colors"
                                  onClick={() => { deleteOperation(op.id); setMenuOpenId(null); }}
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Supprimer
                                </button>
                              </div>
                            )}
                          </div>
                          )}
                        </div>
                      </div>

                      {/* Badges */}
                      <div className="flex flex-wrap gap-1 mb-2">
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full font-medium text-white"
                          style={{ backgroundColor: OP_TYPE_COLORS[op.type] }}
                        >
                          {OP_TYPE_LABELS[op.type]}
                        </span>
                        {op.canal && (
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full font-medium text-white"
                            style={{ backgroundColor: op.canal.couleur || "#6B7280" }}
                          >
                            {op.canal.nom}
                          </span>
                        )}
                      </div>

                      {/* Titre */}
                      <h3 className="text-sm font-semibold text-cockpit-heading truncate mb-1">
                        {op.titre}
                      </h3>

                      {/* Description tronquée */}
                      {op.description && (
                        <p className="text-xs text-cockpit-secondary line-clamp-2">
                          {op.description}
                        </p>
                      )}

                      {/* Fichiers indicator */}
                      {op.fichiers.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-2">
                          {op.fichiers.some((f) => f.mimeType?.startsWith("image/")) && (
                            <span className="flex items-center gap-1 text-[10px] text-cockpit-secondary">
                              <ImageIcon className="w-3 h-3" />
                              {op.fichiers.filter((f) => f.mimeType?.startsWith("image/")).length}
                            </span>
                          )}
                          {op.fichiers.some((f) => f.mimeType === "application/pdf") && (
                            <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 font-medium">
                              <FileText className="w-3 h-3" />
                              PDF
                            </span>
                          )}
                          {op.fichiers.some((f) => !f.mimeType?.startsWith("image/") && f.mimeType !== "application/pdf") && (
                            <span className="flex items-center gap-1 text-[10px] text-cockpit-secondary">
                              <FileText className="w-3 h-3" />
                              {op.fichiers.filter((f) => !f.mimeType?.startsWith("image/") && f.mimeType !== "application/pdf").length}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Drawer Formulaire ──────────────────────────────────────────────── */}
      {showForm && createPortal(
        <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setShowForm(false)}>
          <div
            className="absolute top-0 right-0 h-full w-full max-w-lg bg-cockpit-card border-l border-cockpit shadow-cockpit-lg overflow-y-auto animate-slide-in-right"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-cockpit-heading">
                  {editingOp ? "Modifier l'opération" : "Nouvelle opération"}
                </h2>
                <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-cockpit-dark rounded-lg transition-colors">
                  <X className="w-5 h-5 text-cockpit-secondary" />
                </button>
              </div>

              {/* Date */}
              <div>
                <label className="text-xs font-medium text-cockpit-secondary mb-1 block">Date *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 bg-cockpit-dark border border-cockpit rounded-lg text-sm text-cockpit-primary focus:outline-none focus:ring-1 focus:ring-[var(--color-active)]"
                />
              </div>

              {/* Titre */}
              <div>
                <label className="text-xs font-medium text-cockpit-secondary mb-1 block">Titre *</label>
                <input
                  type="text"
                  value={formData.titre}
                  onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                  placeholder="Ex: Post promo été..."
                  className="w-full px-3 py-2 bg-cockpit-dark border border-cockpit rounded-lg text-sm text-cockpit-primary placeholder:text-cockpit-secondary focus:outline-none focus:ring-1 focus:ring-[var(--color-active)]"
                />
              </div>

              {/* Type */}
              <div>
                <label className="text-xs font-medium text-cockpit-secondary mb-1 block">Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as OpType })}
                  className="w-full px-3 py-2 bg-cockpit-dark border border-cockpit rounded-lg text-sm text-cockpit-primary focus:outline-none focus:ring-1 focus:ring-[var(--color-active)]"
                >
                  <option value="">Choisir un type</option>
                  {(Object.keys(OP_TYPE_LABELS) as OpType[]).map((t) => (
                    <option key={t} value={t}>{OP_TYPE_LABELS[t]}</option>
                  ))}
                </select>
              </div>

              {/* Canal */}
              <div>
                <label className="text-xs font-medium text-cockpit-secondary mb-1 block">Canal</label>
                <select
                  value={formData.canalId}
                  onChange={(e) => setFormData({ ...formData, canalId: e.target.value })}
                  className="w-full px-3 py-2 bg-cockpit-dark border border-cockpit rounded-lg text-sm text-cockpit-primary focus:outline-none focus:ring-1 focus:ring-[var(--color-active)]"
                >
                  <option value="">Aucun canal</option>
                  {canaux.map((c) => (
                    <option key={c.id} value={c.id}>{c.nom}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-medium text-cockpit-secondary mb-1 block">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 bg-cockpit-dark border border-cockpit rounded-lg text-sm text-cockpit-primary placeholder:text-cockpit-secondary focus:outline-none focus:ring-1 focus:ring-[var(--color-active)] resize-none"
                  placeholder="Détails de l'opération..."
                />
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-medium text-cockpit-secondary mb-1 block">Notes internes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 bg-cockpit-dark border border-cockpit rounded-lg text-sm text-cockpit-primary placeholder:text-cockpit-secondary focus:outline-none focus:ring-1 focus:ring-[var(--color-active)] resize-none"
                  placeholder="Notes pour l'équipe..."
                />
              </div>

              {/* Statut */}
              <div>
                <label className="text-xs font-medium text-cockpit-secondary mb-1 block">Statut</label>
                <div className="flex gap-2">
                  {(Object.keys(STATUT_LABELS) as StatutOp[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => setFormData({ ...formData, statut: s })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        formData.statut === s
                          ? STATUT_COLORS[s]
                          : "bg-cockpit-dark text-cockpit-secondary hover:bg-cockpit-dark/80"
                      }`}
                    >
                      {STATUT_LABELS[s]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fichiers — Dropzone */}
              <div>
                <label className="text-xs font-medium text-cockpit-secondary mb-1 block">
                  Fichiers (images JPG/PNG/WebP, PDF — max 20 Mo)
                </label>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                    dragOver
                      ? "border-[var(--color-active)] bg-[var(--color-active)]/5"
                      : "border-cockpit hover:border-cockpit-secondary"
                  }`}
                >
                  <Upload className="w-6 h-6 text-cockpit-secondary mx-auto mb-1" />
                  <p className="text-xs text-cockpit-secondary">
                    Glisser-déposer ou <span className="text-[var(--color-active)] font-medium">parcourir</span>
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.webp,.pdf"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) addFiles(e.target.files);
                      e.target.value = "";
                    }}
                  />
                </div>

                {/* Preview fichiers en attente */}
                {pendingFiles.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {pendingFiles.map((f, i) => (
                      <div key={`${f.name}-${i}`} className="flex items-center gap-2 bg-cockpit-dark rounded-lg p-2 text-xs">
                        {f.type.startsWith("image/") ? (
                          <ImageIcon className="w-4 h-4 text-cockpit-secondary flex-shrink-0" />
                        ) : (
                          <FileText className="w-4 h-4 text-cockpit-secondary flex-shrink-0" />
                        )}
                        <span className="text-cockpit-primary truncate flex-1">{f.name}</span>
                        <span className="text-cockpit-secondary">{(f.size / 1024).toFixed(0)} Ko</span>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removePendingFile(i); }}
                          className="p-0.5 hover:bg-cockpit-card rounded transition-colors"
                        >
                          <X className="w-3.5 h-3.5 text-cockpit-secondary" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Fichiers existants (en mode édition) */}
                {editingOp && editingOp.fichiers.length > 0 && (
                  <div className="mt-2">
                    <p className="text-[10px] text-cockpit-secondary mb-1">Fichiers existants :</p>
                    <div className="space-y-1">
                      {editingOp.fichiers.map((f) => (
                        <div key={f.id} className="flex items-center gap-2 bg-cockpit-dark/60 rounded-lg p-2 text-xs">
                          {f.mimeType.startsWith("image/") ? (
                            <ImageIcon className="w-3.5 h-3.5 text-cockpit-secondary flex-shrink-0" />
                          ) : (
                            <FileText className="w-3.5 h-3.5 text-cockpit-secondary flex-shrink-0" />
                          )}
                          <span className="text-cockpit-secondary truncate flex-1">{f.nom}</span>
                          <span className="text-cockpit-secondary text-[10px]">{(f.taille / 1024).toFixed(0)} Ko</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 bg-cockpit-dark border border-cockpit rounded-lg text-sm font-medium text-cockpit-primary hover:bg-cockpit-dark/80 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={saveOperation}
                  disabled={saving || !formData.titre.trim() || !formData.type || !formData.date}
                  className="flex-1 px-4 py-2 bg-[var(--color-active)] text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {saving && pendingFiles.length > 0 ? "Upload..." : editingOp ? "Enregistrer" : "Créer"}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ─── Drawer Détail ──────────────────────────────────────────────────── */}
      {detailOp && createPortal(
        <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setDetailOp(null)}>
          <div
            className="absolute top-0 right-0 h-full w-full max-w-lg bg-cockpit-card border-l border-cockpit shadow-cockpit-lg overflow-y-auto animate-slide-in-right"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-medium text-white"
                      style={{ backgroundColor: OP_TYPE_COLORS[detailOp.type] }}
                    >
                      {OP_TYPE_LABELS[detailOp.type]}
                    </span>
                    {detailOp.canal && (
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-medium text-white"
                        style={{ backgroundColor: detailOp.canal.couleur || "#6B7280" }}
                      >
                        {detailOp.canal.nom}
                      </span>
                    )}
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUT_COLORS[detailOp.statut]}`}>
                      {STATUT_LABELS[detailOp.statut]}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-cockpit-heading">{detailOp.titre}</h2>
                  <p className="text-xs text-cockpit-secondary mt-0.5">
                    {new Date(detailOp.date).toLocaleDateString("fr-FR", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <button onClick={() => setDetailOp(null)} className="p-1 hover:bg-cockpit-dark rounded transition-colors">
                  <X className="w-5 h-5 text-cockpit-secondary" />
                </button>
              </div>

              {/* Description */}
              {detailOp.description && (
                <div>
                  <h4 className="text-xs font-semibold text-cockpit-secondary mb-1">Description</h4>
                  <p className="text-sm text-cockpit-primary whitespace-pre-wrap">{detailOp.description}</p>
                </div>
              )}

              {/* Notes */}
              {detailOp.notes && (
                <div>
                  <h4 className="text-xs font-semibold text-cockpit-secondary mb-1">Notes internes</h4>
                  <p className="text-sm text-cockpit-primary whitespace-pre-wrap bg-cockpit-dark rounded-lg p-3">{detailOp.notes}</p>
                </div>
              )}

              {/* Cover image (posts Planning) */}
              {detailOp.coverImage && (
                <div>
                  <h4 className="text-xs font-semibold text-cockpit-secondary mb-2">Visuel</h4>
                  <div
                    className="rounded-lg overflow-hidden cursor-pointer border border-cockpit"
                    onClick={() => setLightboxUrl(detailOp.coverImage!)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={detailOp.coverImage}
                      alt={detailOp.titre}
                      className="w-full max-h-64 object-contain bg-cockpit-dark"
                    />
                  </div>
                </div>
              )}

              {/* Fichiers — Galerie */}
              {detailOp.fichiers.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-cockpit-secondary mb-2">
                    Fichiers ({detailOp.fichiers.length})
                  </h4>

                  {/* Images */}
                  {detailOp.fichiers.some((f) => f.mimeType.startsWith("image/")) && (
                    <div className="space-y-2 mb-3">
                      {detailOp.fichiers
                        .filter((f) => f.mimeType.startsWith("image/"))
                        .map((f) => (
                          <div
                            key={f.id}
                            className="relative group rounded-lg overflow-hidden bg-cockpit-dark cursor-pointer border border-cockpit hover:border-[var(--color-active)]/40 transition-colors"
                            onClick={() => setLightboxUrl(getPublicUrl(f.storagePath))}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={getPublicUrl(f.storagePath)}
                              alt={f.nom}
                              className="w-full h-auto max-h-[400px] object-contain mx-auto"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                              <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            {canEdit && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm("Supprimer ce fichier ?")) deleteFile(detailOp.id, f.id);
                              }}
                              disabled={deletingFileId === f.id}
                              className="absolute top-1 right-1 p-1 bg-black/60 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
                            >
                              {deletingFileId === f.id ? (
                                <Loader2 className="w-3 h-3 text-white animate-spin" />
                              ) : (
                                <Trash2 className="w-3 h-3 text-white" />
                              )}
                            </button>
                            )}
                          </div>
                        ))}
                    </div>
                  )}

                  {/* PDF — aperçu intégré */}
                  {detailOp.fichiers
                    .filter((f) => f.mimeType === "application/pdf")
                    .map((f) => (
                      <div key={f.id} className="mb-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2 text-xs">
                            <FileText className="w-4 h-4 text-red-400" />
                            <span className="text-cockpit-primary font-medium truncate">{f.nom}</span>
                            <span className="text-cockpit-secondary text-[10px]">
                              {f.taille >= 1024 * 1024
                                ? `${(f.taille / (1024 * 1024)).toFixed(1)} Mo`
                                : `${(f.taille / 1024).toFixed(0)} Ko`}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => window.open(getPublicUrl(f.storagePath), "_blank")}
                              className="px-2.5 py-1 bg-[var(--color-active)]/10 text-[var(--color-active)] rounded-lg text-[10px] font-medium hover:bg-[var(--color-active)]/20 transition-colors flex items-center gap-1"
                            >
                              <ExternalLink className="w-3 h-3" /> Ouvrir le PDF
                            </button>
                            {canEdit && (
                            <button
                              onClick={() => {
                                if (confirm("Supprimer ce fichier ?")) deleteFile(detailOp.id, f.id);
                              }}
                              disabled={deletingFileId === f.id}
                              className="p-1 hover:bg-red-500/20 rounded transition-colors"
                            >
                              {deletingFileId === f.id ? (
                                <Loader2 className="w-3.5 h-3.5 text-cockpit-secondary animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                              )}
                            </button>
                            )}
                          </div>
                        </div>
                        {/* Embed PDF */}
                        <div className="rounded-lg overflow-hidden border border-cockpit bg-white">
                          <iframe
                            src={getPublicUrl(f.storagePath)}
                            className="w-full h-64"
                            title={f.nom}
                          />
                        </div>
                      </div>
                    ))}

                  {/* Autres fichiers (non-image, non-PDF) */}
                  {detailOp.fichiers
                    .filter((f) => !f.mimeType.startsWith("image/") && f.mimeType !== "application/pdf")
                    .map((f) => (
                      <div
                        key={f.id}
                        className="flex items-center gap-2 bg-cockpit-dark rounded-lg p-2.5 text-xs mb-1.5 group"
                      >
                        <FileText className="w-4 h-4 text-cockpit-secondary flex-shrink-0" />
                        <span className="text-cockpit-primary truncate flex-1">{f.nom}</span>
                        <span className="text-cockpit-secondary text-[10px]">
                          {f.taille >= 1024 * 1024
                            ? `${(f.taille / (1024 * 1024)).toFixed(1)} Mo`
                            : `${(f.taille / 1024).toFixed(0)} Ko`}
                        </span>
                        <button
                          onClick={() => window.open(getPublicUrl(f.storagePath), "_blank")}
                          className="p-1 hover:bg-cockpit-card rounded transition-colors opacity-0 group-hover:opacity-100"
                          title="Ouvrir"
                        >
                          <Download className="w-3.5 h-3.5 text-cockpit-secondary" />
                        </button>
                        {canEdit && (
                        <button
                          onClick={() => {
                            if (confirm("Supprimer ce fichier ?")) deleteFile(detailOp.id, f.id);
                          }}
                          disabled={deletingFileId === f.id}
                          className="p-1 hover:bg-red-500/20 rounded transition-colors opacity-0 group-hover:opacity-100"
                        >
                          {deletingFileId === f.id ? (
                            <Loader2 className="w-3.5 h-3.5 text-cockpit-secondary animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          )}
                        </button>
                        )}
                      </div>
                    ))}
                </div>
              )}

              {/* Actions */}
              {detailOp.source === "planning" ? (
                <div className="pt-2">
                  <p className="text-[10px] text-cockpit-secondary text-center mb-2">
                    Ce contenu provient du Planning. Il n'est pas modifiable ici.
                  </p>
                </div>
              ) : canEdit ? (
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => { openEditForm(detailOp); setDetailOp(null); }}
                    className="flex-1 px-4 py-2 bg-cockpit-dark border border-cockpit rounded-lg text-sm font-medium text-cockpit-primary hover:bg-cockpit-dark/80 transition-colors flex items-center justify-center gap-2"
                  >
                    <Pencil className="w-4 h-4" /> Modifier
                  </button>
                  <button
                    onClick={() => { duplicateOperation(detailOp.id); setDetailOp(null); }}
                    className="px-4 py-2 bg-cockpit-dark border border-cockpit rounded-lg text-sm font-medium text-cockpit-primary hover:bg-cockpit-dark/80 transition-colors flex items-center justify-center gap-2"
                  >
                    <Copy className="w-4 h-4" /> Dupliquer
                  </button>
                  <button
                    onClick={() => { deleteOperation(detailOp.id); setDetailOp(null); }}
                    className="px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="pt-2">
                  <p className="text-[10px] text-cockpit-secondary text-center">
                    Consultation uniquement
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ─── Modale Canaux ───────────────────────────────────────────────── */}
      {showCanaux && createPortal(
        <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setShowCanaux(false)}>
          <div
            className="absolute top-0 right-0 h-full w-full max-w-sm bg-cockpit-card border-l border-cockpit shadow-cockpit-lg overflow-y-auto animate-slide-in-right"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-cockpit-heading">Gérer les canaux</h2>
                <button onClick={() => setShowCanaux(false)} className="p-1 hover:bg-cockpit-dark rounded transition-colors">
                  <X className="w-4 h-4 text-cockpit-secondary" />
                </button>
              </div>

              {/* Liste des canaux */}
              <div className="space-y-1.5">
                {allCanaux.map((c) => (
                  <div key={c.id} className="flex items-center gap-2 bg-cockpit-dark rounded-lg p-2.5">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: c.couleur || "#6B7280" }}
                    />
                    <span className={`text-sm flex-1 ${c.actif ? "text-cockpit-primary" : "text-cockpit-secondary line-through"}`}>
                      {c.nom}
                    </span>
                    <button
                      onClick={() => toggleCanal(c)}
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium transition-colors ${
                        c.actif
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-cockpit-card text-cockpit-secondary"
                      }`}
                    >
                      {c.actif ? "Actif" : "Inactif"}
                    </button>
                  </div>
                ))}
                {allCanaux.length === 0 && (
                  <p className="text-xs text-cockpit-secondary text-center py-3">Aucun canal</p>
                )}
              </div>

              {/* Nouveau canal */}
              <div className="border-t border-cockpit pt-3">
                <p className="text-xs font-medium text-cockpit-secondary mb-2">Nouveau canal</p>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={newCanalCouleur}
                    onChange={(e) => setNewCanalCouleur(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border border-cockpit bg-transparent flex-shrink-0"
                  />
                  <input
                    type="text"
                    value={newCanalNom}
                    onChange={(e) => setNewCanalNom(e.target.value)}
                    placeholder="Nom du canal..."
                    className="flex-1 px-3 py-1.5 bg-cockpit-dark border border-cockpit rounded-lg text-sm text-cockpit-primary placeholder:text-cockpit-secondary focus:outline-none focus:ring-1 focus:ring-[var(--color-active)]"
                    onKeyDown={(e) => e.key === "Enter" && createCanal()}
                  />
                  <button
                    onClick={createCanal}
                    disabled={savingCanal || !newCanalNom.trim()}
                    className="px-3 py-1.5 bg-[var(--color-active)] text-white rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50 flex-shrink-0"
                  >
                    {savingCanal ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Lightbox */}
      {lightboxUrl && createPortal(
        <div
          className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
            onClick={() => setLightboxUrl(null)}
          >
            <X className="w-6 h-6 text-white" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxUrl}
            alt="Aperçu"
            className="max-w-full max-h-[90vh] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>,
        document.body
      )}

      {/* Close menu on outside click */}
      {menuOpenId && (
        <div className="fixed inset-0 z-10" onClick={() => setMenuOpenId(null)} />
      )}
    </div>
  );
}
