"use client";

import { useState, useEffect, useCallback } from "react";
import {
  TreePine,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Loader2,
  Check,
  X,
  FileText,
  Download,
  Users,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  LinkIcon,
} from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

interface BdoStats {
  totalContacts: number;
  matches: number;
  aVerifier: number;
  nouveaux: number;
  caTotal: number;
  documentsCount: number;
  dernierImport: string | null;
  dernierImportStatut: string | null;
}

interface ClientBdo {
  id: string;
  nom: string;
  email: string | null;
  caBdo: number;
  factures: number;
  statut: "NOUVEAU" | "MATCH_EMAIL" | "MATCH_MANUEL" | "A_VERIFIER";
  contactDimexoiNom?: string | null;
  contactDimexoiEmail?: string | null;
  contactDimexoiId?: string | null;
}

interface ClientsData {
  clients: ClientBdo[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface DocumentBdo {
  id: string;
  type: string;
  reference: string;
  date: string;
  montant: number;
  pdfUrl: string | null;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const BDO_GRADIENT = {
  from: "#F17142",
  to: "#9A3F08",
  shadow: "rgba(209, 95, 18, 0.30)",
};

const STATUT_BADGES: Record<
  ClientBdo["statut"],
  { label: string; bg: string; text: string }
> = {
  NOUVEAU: { label: "Nouveau", bg: "rgba(107, 114, 128, 0.15)", text: "#6B7280" },
  MATCH_EMAIL: { label: "Match email", bg: "rgba(16, 185, 129, 0.15)", text: "#059669" },
  MATCH_MANUEL: { label: "Match manuel", bg: "rgba(59, 130, 246, 0.15)", text: "#2563EB" },
  A_VERIFIER: { label: "À vérifier", bg: "rgba(245, 158, 11, 0.15)", text: "#D97706" },
};

// ============================================================================
// HELPERS
// ============================================================================

function formatMontant(n: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateShort(d: string | null): string {
  if (!d) return "—";
  return (
    new Date(d).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
    }) +
    " " +
    new Date(d).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  );
}

// ============================================================================
// PAGE
// ============================================================================

export default function BoisDOrientPage() {
  // --- State ------------------------------------------------------------------
  const [stats, setStats] = useState<BdoStats | null>(null);
  const [clientsData, setClientsData] = useState<ClientsData | null>(null);
  const [aVerifierList, setAVerifierList] = useState<ClientBdo[]>([]);
  const [loading, setLoading] = useState(true);

  const [toast, setToast] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState<string>("");
  const [page, setPage] = useState(1);

  // Workflow buttons
  const [extracting, setExtracting] = useState(false);
  const [downloadingPdfs, setDownloadingPdfs] = useState(false);
  const [matching, setMatching] = useState(false);
  const [integrating, setIntegrating] = useState(false);

  // Expanded rows (documents)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [documentsCache, setDocumentsCache] = useState<
    Record<string, DocumentBdo[]>
  >({});
  const [loadingDocs, setLoadingDocs] = useState<Set<string>>(new Set());

  // --- Data loading -----------------------------------------------------------
  const loadStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/bois-dorient/stats");
      if (res.ok) setStats(await res.json());
    } catch (err) {
      console.error("Erreur chargement stats BDO:", err);
    }
  }, []);

  const loadClients = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (filterStatut) params.set("statut", filterStatut);
      if (search.trim()) params.set("search", search.trim());
      const res = await fetch(`/api/admin/bois-dorient/clients?${params}`);
      if (res.ok) setClientsData(await res.json());
    } catch (err) {
      console.error("Erreur chargement clients BDO:", err);
    }
  }, [page, filterStatut, search]);

  const loadAVerifier = useCallback(async () => {
    try {
      const res = await fetch(
        "/api/admin/bois-dorient/clients?statut=A_VERIFIER&limit=100"
      );
      if (res.ok) {
        const data = await res.json();
        setAVerifierList(data.clients || []);
      }
    } catch (err) {
      console.error("Erreur chargement à vérifier:", err);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      // Charger en parallèle mais ne pas bloquer si stats/aVerifier échouent
      await Promise.allSettled([loadStats(), loadClients(), loadAVerifier()]);
      setLoading(false);
    };
    init();
  }, [loadStats, loadClients, loadAVerifier]);

  // --- Toast ------------------------------------------------------------------
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  // --- Workflow actions -------------------------------------------------------
  const handleExtract = async () => {
    setExtracting(true);
    try {
      const res = await fetch("/api/admin/bois-dorient/extract", {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        showToast(
          `Extraction terminée — ${data.extracted ?? 0} contacts extraits`
        );
        await Promise.all([loadStats(), loadClients(), loadAVerifier()]);
      } else {
        showToast(`Erreur extraction : ${data.error}`);
      }
    } catch {
      showToast("Erreur de connexion");
    }
    setExtracting(false);
  };

  const handleDownloadPdfs = async () => {
    setDownloadingPdfs(true);
    try {
      let remaining = 1;
      let totalDownloaded = 0;
      while (remaining > 0) {
        const res = await fetch("/api/admin/bois-dorient/extract-pdfs", {
          method: "POST",
        });
        const data = await res.json();
        if (!res.ok) {
          showToast(`Erreur PDFs : ${data.error}`);
          break;
        }
        totalDownloaded += data.downloaded ?? 0;
        remaining = data.remaining ?? 0;
        if ((data.downloaded ?? 0) === 0) break;
      }
      showToast(`${totalDownloaded} PDFs téléchargés`);
      await loadStats();
    } catch {
      showToast("Erreur de connexion");
    }
    setDownloadingPdfs(false);
  };

  const handleMatch = async () => {
    setMatching(true);
    try {
      const res = await fetch("/api/admin/bois-dorient/match", {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        showToast(
          `Matching terminé — ${data.matched ?? 0} matchés, ${data.aVerifier ?? 0} à vérifier`
        );
        await Promise.all([loadStats(), loadClients(), loadAVerifier()]);
      } else {
        showToast(`Erreur matching : ${data.error}`);
      }
    } catch {
      showToast("Erreur de connexion");
    }
    setMatching(false);
  };

  const handleIntegrate = async () => {
    setIntegrating(true);
    try {
      const res = await fetch("/api/admin/bois-dorient/integrate", {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        showToast(
          `Intégration terminée — ${data.integrated ?? 0} contacts intégrés`
        );
        await Promise.all([loadStats(), loadClients(), loadAVerifier()]);
      } else {
        showToast(`Erreur intégration : ${data.error}`);
      }
    } catch {
      showToast("Erreur de connexion");
    }
    setIntegrating(false);
  };

  // --- A vérifier actions -----------------------------------------------------
  const handleVerifierAction = async (
    id: string,
    action: "confirmer" | "rejeter"
  ) => {
    try {
      const res = await fetch("/api/admin/bois-dorient/clients", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(
          action === "confirmer" ? "Match confirmé" : "Match rejeté"
        );
        await Promise.all([loadStats(), loadClients(), loadAVerifier()]);
      } else {
        showToast(`Erreur : ${data.error}`);
      }
    } catch {
      showToast("Erreur de connexion");
    }
  };

  // --- Expand row / load documents -------------------------------------------
  const toggleRow = async (clientId: string) => {
    const next = new Set(expandedRows);
    if (next.has(clientId)) {
      next.delete(clientId);
      setExpandedRows(next);
      return;
    }
    next.add(clientId);
    setExpandedRows(next);

    if (!documentsCache[clientId]) {
      setLoadingDocs((prev) => new Set(prev).add(clientId));
      try {
        const res = await fetch(
          `/api/admin/bois-dorient/documents?clientBdoId=${clientId}`
        );
        if (res.ok) {
          const data = await res.json();
          setDocumentsCache((prev) => ({
            ...prev,
            [clientId]: data.documents || [],
          }));
        }
      } catch (err) {
        console.error("Erreur chargement documents:", err);
      }
      setLoadingDocs((prev) => {
        const s = new Set(prev);
        s.delete(clientId);
        return s;
      });
    }
  };

  // --- Any workflow running? --------------------------------------------------
  const anyWorkflowRunning =
    extracting || downloadingPdfs || matching || integrating;

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Toast */}
      {toast && (
        <div
          className="fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm max-w-md text-white"
          style={{ backgroundColor: BDO_GRADIENT.from }}
        >
          {toast}
        </div>
      )}

      {/* ================================================================ */}
      {/* HEADER */}
      {/* ================================================================ */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${BDO_GRADIENT.from} 0%, ${BDO_GRADIENT.to} 100%)`,
            }}
          >
            <TreePine className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-cockpit-heading">
              Migration Bois d&apos;Orient
            </h1>
            <p className="text-cockpit-secondary text-xs sm:text-sm">
              {stats?.dernierImport
                ? `Dernier import : ${formatDateShort(stats.dernierImport)}${stats.dernierImportStatut ? ` · ${stats.dernierImportStatut}` : ""}`
                : "Aucun import effectué"}
            </p>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* KPI CARDS */}
      {/* ================================================================ */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="rounded-xl p-4 bg-cockpit-card animate-pulse h-20"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
          {/* Total contacts */}
          <div
            className="rounded-xl p-3 sm:p-4 flex items-center gap-3 transition-transform duration-200 hover:-translate-y-0.5"
            style={{
              background: `linear-gradient(135deg, ${BDO_GRADIENT.from} 0%, ${BDO_GRADIENT.to} 100%)`,
              boxShadow: `0 4px 14px ${BDO_GRADIENT.shadow}`,
            }}
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/75 text-[10px] sm:text-xs font-medium truncate">
                Contacts BDO
              </p>
              <p className="text-lg sm:text-xl font-bold text-white">
                {stats?.totalContacts ?? 0}
              </p>
            </div>
          </div>

          {/* Matchés */}
          <div
            className="rounded-xl p-3 sm:p-4 flex items-center gap-3 transition-transform duration-200 hover:-translate-y-0.5"
            style={{
              background: `linear-gradient(135deg, ${BDO_GRADIENT.from} 0%, ${BDO_GRADIENT.to} 100%)`,
              boxShadow: `0 4px 14px ${BDO_GRADIENT.shadow}`,
            }}
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
              <LinkIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/75 text-[10px] sm:text-xs font-medium truncate">
                Matchés
              </p>
              <p className="text-lg sm:text-xl font-bold text-white">
                {stats?.matches ?? 0}
              </p>
            </div>
          </div>

          {/* À vérifier */}
          <div
            className="rounded-xl p-3 sm:p-4 flex items-center gap-3 transition-transform duration-200 hover:-translate-y-0.5"
            style={{
              background: `linear-gradient(135deg, ${BDO_GRADIENT.from} 0%, ${BDO_GRADIENT.to} 100%)`,
              boxShadow: `0 4px 14px ${BDO_GRADIENT.shadow}`,
            }}
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/75 text-[10px] sm:text-xs font-medium truncate">
                À vérifier
              </p>
              <p className="text-lg sm:text-xl font-bold text-white">
                {stats?.aVerifier ?? 0}
              </p>
            </div>
          </div>

          {/* Nouveaux */}
          <div
            className="rounded-xl p-3 sm:p-4 flex items-center gap-3 transition-transform duration-200 hover:-translate-y-0.5"
            style={{
              background: `linear-gradient(135deg, ${BDO_GRADIENT.from} 0%, ${BDO_GRADIENT.to} 100%)`,
              boxShadow: `0 4px 14px ${BDO_GRADIENT.shadow}`,
            }}
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
              <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/75 text-[10px] sm:text-xs font-medium truncate">
                Nouveaux
              </p>
              <p className="text-lg sm:text-xl font-bold text-white">
                {stats?.nouveaux ?? 0}
              </p>
            </div>
          </div>

          {/* CA Total */}
          <div
            className="rounded-xl p-3 sm:p-4 flex items-center gap-3 transition-transform duration-200 hover:-translate-y-0.5"
            style={{
              background: `linear-gradient(135deg, ${BDO_GRADIENT.from} 0%, ${BDO_GRADIENT.to} 100%)`,
              boxShadow: `0 4px 14px ${BDO_GRADIENT.shadow}`,
            }}
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/75 text-[10px] sm:text-xs font-medium truncate">
                CA total
              </p>
              <p className="text-lg sm:text-xl font-bold text-white">
                {formatMontant(stats?.caTotal ?? 0)}
              </p>
            </div>
          </div>

          {/* Documents */}
          <div
            className="rounded-xl p-3 sm:p-4 flex items-center gap-3 transition-transform duration-200 hover:-translate-y-0.5"
            style={{
              background: `linear-gradient(135deg, ${BDO_GRADIENT.from} 0%, ${BDO_GRADIENT.to} 100%)`,
              boxShadow: `0 4px 14px ${BDO_GRADIENT.shadow}`,
            }}
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/75 text-[10px] sm:text-xs font-medium truncate">
                Documents
              </p>
              <p className="text-lg sm:text-xl font-bold text-white">
                {stats?.documentsCount ?? 0}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* WORKFLOW BUTTONS */}
      {/* ================================================================ */}
      <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg p-4 sm:p-5">
        <h2
          className="text-sm font-bold mb-3"
          style={{ color: BDO_GRADIENT.from }}
        >
          Pipeline de migration
        </h2>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {/* 1. Extraire */}
          <button
            onClick={handleExtract}
            disabled={anyWorkflowRunning}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: BDO_GRADIENT.from }}
          >
            {extracting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {extracting ? "Extraction…" : "1. Extraire de Sellsy"}
          </button>

          {/* 2. PDFs */}
          <button
            onClick={handleDownloadPdfs}
            disabled={anyWorkflowRunning}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: BDO_GRADIENT.from }}
          >
            {downloadingPdfs ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            {downloadingPdfs ? "Téléchargement PDFs…" : "2. Télécharger PDFs"}
          </button>

          {/* 3. Matching */}
          <button
            onClick={handleMatch}
            disabled={anyWorkflowRunning}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: BDO_GRADIENT.from }}
          >
            {matching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <LinkIcon className="w-4 h-4" />
            )}
            {matching ? "Matching…" : "3. Lancer le matching"}
          </button>

          {/* 4. Intégrer */}
          <button
            onClick={handleIntegrate}
            disabled={anyWorkflowRunning}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: BDO_GRADIENT.from }}
          >
            {integrating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Users className="w-4 h-4" />
            )}
            {integrating
              ? "Intégration…"
              : "4. Intégrer au Club Tectona"}
          </button>
        </div>
      </div>

      {/* ================================================================ */}
      {/* SECTION "À VÉRIFIER" */}
      {/* ================================================================ */}
      {aVerifierList.length > 0 && (
        <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg overflow-hidden">
          <div
            className="px-4 sm:px-6 py-3 border-b border-cockpit flex items-center gap-2"
            style={{ backgroundColor: "rgba(245, 158, 11, 0.08)" }}
          >
            <AlertTriangle
              className="w-4 h-4 flex-shrink-0"
              style={{ color: "#D97706" }}
            />
            <h2 className="text-sm font-bold" style={{ color: "#D97706" }}>
              À vérifier ({aVerifierList.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-cockpit bg-cockpit-dark">
                <tr>
                  <th className="text-left px-4 lg:px-6 py-3 text-xs font-semibold text-cockpit-secondary">
                    NOM BDO
                  </th>
                  <th className="text-left px-4 lg:px-6 py-3 text-xs font-semibold text-cockpit-secondary hidden sm:table-cell">
                    EMAIL BDO
                  </th>
                  <th className="text-left px-4 lg:px-6 py-3 text-xs font-semibold text-cockpit-secondary">
                    CONTACT DIMEXOI PROPOSÉ
                  </th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-cockpit-secondary w-28">
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cockpit">
                {aVerifierList.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-cockpit-dark transition-colors"
                  >
                    <td className="px-4 lg:px-6 py-3">
                      <span
                        className="font-medium text-sm"
                        style={{ color: BDO_GRADIENT.from }}
                      >
                        {c.nom}
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-3 text-cockpit-secondary text-xs truncate max-w-[200px] hidden sm:table-cell">
                      {c.email || "—"}
                    </td>
                    <td className="px-4 lg:px-6 py-3">
                      <div>
                        <span className="text-sm text-cockpit-primary font-medium">
                          {c.contactDimexoiNom || "—"}
                        </span>
                        {c.contactDimexoiEmail && (
                          <span className="block text-xs text-cockpit-secondary">
                            {c.contactDimexoiEmail}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() =>
                            handleVerifierAction(c.id, "confirmer")
                          }
                          className="p-1.5 rounded-md bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                          title="Confirmer le match"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            handleVerifierAction(c.id, "rejeter")
                          }
                          className="p-1.5 rounded-md bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                          title="Rejeter le match"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* SEARCH + FILTER */}
      {/* ================================================================ */}
      <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cockpit-secondary" />
            <input
              type="text"
              placeholder="Rechercher un client…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 border border-cockpit-input rounded-input bg-cockpit-input text-cockpit-primary text-sm focus:outline-none"
            />
          </div>
          <select
            value={filterStatut}
            onChange={(e) => {
              setFilterStatut(e.target.value);
              setPage(1);
            }}
            className="bg-cockpit-input border border-cockpit-input px-3 py-2.5 rounded-input text-xs text-cockpit-primary"
          >
            <option value="">Tous les statuts</option>
            <option value="NOUVEAU">Nouveau</option>
            <option value="MATCH_EMAIL">Match email</option>
            <option value="MATCH_MANUEL">Match manuel</option>
            <option value="A_VERIFIER">À vérifier</option>
          </select>
        </div>
      </div>

      {/* ================================================================ */}
      {/* TABLE — All clients */}
      {/* ================================================================ */}
      <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead
              className="border-b border-cockpit"
              style={{ backgroundColor: BDO_GRADIENT.from }}
            >
              <tr>
                <th className="text-left px-4 lg:px-6 py-3 text-xs font-semibold text-white w-8"></th>
                <th className="text-left px-4 lg:px-6 py-3 text-xs font-semibold text-white">
                  NOM
                </th>
                <th className="text-left px-4 lg:px-6 py-3 text-xs font-semibold text-white hidden md:table-cell">
                  EMAIL
                </th>
                <th className="text-right px-4 lg:px-6 py-3 text-xs font-semibold text-white">
                  CA BDO
                </th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-white hidden sm:table-cell">
                  FACTURES
                </th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-white">
                  STATUT
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cockpit">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-4 py-4">
                      <div className="h-4 rounded animate-pulse bg-cockpit-dark" />
                    </td>
                  </tr>
                ))
              ) : clientsData?.clients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <TreePine className="w-8 h-8 mx-auto mb-2 text-cockpit-secondary opacity-40" />
                    <p className="text-cockpit-primary font-medium">
                      Aucun client trouvé
                    </p>
                    <p className="text-cockpit-secondary text-xs mt-1">
                      Lancez une extraction Sellsy pour commencer
                    </p>
                  </td>
                </tr>
              ) : (
                clientsData?.clients.map((c) => {
                  const badge = STATUT_BADGES[c.statut];
                  const isExpanded = expandedRows.has(c.id);
                  const docs = documentsCache[c.id];
                  const isLoadingDocs = loadingDocs.has(c.id);

                  return (
                    <>
                      <tr
                        key={c.id}
                        className="hover:bg-cockpit-dark transition-colors cursor-pointer"
                        onClick={() => toggleRow(c.id)}
                      >
                        <td className="pl-4 lg:pl-6 py-3 w-8">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-cockpit-secondary" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-cockpit-secondary" />
                          )}
                        </td>
                        <td className="px-4 lg:px-6 py-3">
                          <span
                            className="font-medium text-sm"
                            style={{ color: BDO_GRADIENT.from }}
                          >
                            {c.nom}
                          </span>
                        </td>
                        <td className="px-4 lg:px-6 py-3 text-cockpit-secondary text-xs truncate max-w-[200px] hidden md:table-cell">
                          {c.email || "—"}
                        </td>
                        <td className="px-4 lg:px-6 py-3 text-right font-semibold text-sm text-cockpit-heading">
                          {formatMontant(c.caBdo)}
                        </td>
                        <td className="px-3 py-3 text-center hidden sm:table-cell text-sm font-medium text-cockpit-primary">
                          {c.factures}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span
                            className="inline-flex items-center text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: badge.bg,
                              color: badge.text,
                            }}
                          >
                            {badge.label}
                          </span>
                        </td>
                      </tr>

                      {/* Expanded row — documents */}
                      {isExpanded && (
                        <tr key={`${c.id}-docs`}>
                          <td
                            colSpan={6}
                            className="px-4 lg:px-10 py-3 bg-cockpit-dark"
                          >
                            {isLoadingDocs ? (
                              <div className="flex items-center gap-2 text-xs text-cockpit-secondary py-2">
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                Chargement des documents…
                              </div>
                            ) : docs && docs.length > 0 ? (
                              <div className="space-y-1.5">
                                <p className="text-xs font-semibold text-cockpit-secondary mb-2">
                                  Documents ({docs.length})
                                </p>
                                {docs.map((doc) => (
                                  <div
                                    key={doc.id}
                                    className="flex items-center gap-3 text-xs bg-cockpit-card rounded-lg px-3 py-2 border border-cockpit/50"
                                  >
                                    <FileText
                                      className="w-4 h-4 flex-shrink-0"
                                      style={{ color: BDO_GRADIENT.from }}
                                    />
                                    <span className="font-medium text-cockpit-primary flex-1 min-w-0 truncate">
                                      {doc.type} — {doc.reference}
                                    </span>
                                    <span className="text-cockpit-secondary flex-shrink-0">
                                      {new Date(doc.date).toLocaleDateString(
                                        "fr-FR"
                                      )}
                                    </span>
                                    <span className="font-semibold text-cockpit-heading flex-shrink-0">
                                      {formatMontant(doc.montant)}
                                    </span>
                                    {doc.pdfUrl && (
                                      <a
                                        href={doc.pdfUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="p-1 rounded hover:bg-cockpit-dark transition-colors flex-shrink-0"
                                        style={{ color: BDO_GRADIENT.from }}
                                        title="Voir le PDF"
                                      >
                                        <Download className="w-3.5 h-3.5" />
                                      </a>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-cockpit-secondary py-2">
                                Aucun document trouvé
                              </p>
                            )}
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {clientsData && clientsData.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 lg:px-6 py-3 border-t border-cockpit">
            <p className="text-xs text-cockpit-secondary">
              {clientsData.pagination.total} clients · Page {page}/
              {clientsData.pagination.totalPages}
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-md hover:bg-cockpit-dark disabled:opacity-30 transition-colors text-cockpit-primary"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() =>
                  setPage((p) =>
                    Math.min(clientsData.pagination.totalPages, p + 1)
                  )
                }
                disabled={page >= clientsData.pagination.totalPages}
                className="p-1.5 rounded-md hover:bg-cockpit-dark disabled:opacity-30 transition-colors text-cockpit-primary"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
