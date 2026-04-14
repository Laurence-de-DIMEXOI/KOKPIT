"use client";

import { useState, useEffect } from "react";
import { KPICard } from "@/components/dashboard/kpi-card";
import {
  Mail,
  BarChart3,
  MousePointerClick,
  Users,
  RefreshCw,
  Loader2,
  ExternalLink,
  Clock,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Calendar,
  FileEdit,
} from "lucide-react";
// Loader2 kept for the refresh spinner

interface Campaign {
  id: number;
  nom: string;
  dateEnvoi: string;
  destinataires: number;
  tauxOuverture: number;
  tauxClic: number;
  desabonnements: number;
  bounces: number;
  statsIndisponibles?: boolean;
}

interface CampagneEnCours {
  id: number;
  nom: string;
  status: string;
  dateCreation: string;
  scheduledAt?: string;
}

interface BrevoStats {
  contacts: { total: number };
  dernieresCampagnes: Campaign[];
  campagnesEnCours?: CampagneEnCours[];
  moyennes: {
    tauxOuvertureMoyen: number;
    tauxClicMoyen: number;
  };
  _cache: { generatedAt: string } | null;
  error?: string;
}

function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "À l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h}h`;
  return `il y a ${Math.floor(h / 24)}j`;
}

interface SyncResult {
  success: boolean;
  segmentId: string;
  nbContacts: number;
  listeBrevoId?: number;
  listeName?: string;
  error?: string;
}

interface SyncLog {
  id: string;
  segmentNom: string;
  nbContacts: number;
  statut: string;
  erreur?: string;
  createdAt: string;
  createdBy?: { prenom: string; nom: string };
}

const SEGMENTS = [
  // ── Acquisition & relance ──────────────────────────────────────────────────
  {
    id: "devis-sans-suite",
    categorie: "Acquisition & relance",
    nom: "Devis sans suite (> 30j)",
    description: "Devis non converti, créé il y a plus de 30 jours",
    icon: AlertTriangle,
  },
  {
    id: "devis-expirant",
    categorie: "Acquisition & relance",
    nom: "Devis expirant bientôt",
    description: "Expire dans les 7 prochains jours, sans commande",
    icon: AlertCircle,
  },
  {
    id: "demande-sans-devis",
    categorie: "Acquisition & relance",
    nom: "Demande sans devis",
    description: "Lead reçu, aucun devis créé",
    icon: Mail,
  },
  // ── Cycle de vie client ────────────────────────────────────────────────────
  {
    id: "acheteurs-recents",
    categorie: "Cycle de vie client",
    nom: "Acheteurs récents (< 60j)",
    description: "Commande dans les 60 derniers jours",
    icon: CheckCircle2,
  },
  {
    id: "clients-inactifs",
    categorie: "Cycle de vie client",
    nom: "Clients inactifs (> 12 mois)",
    description: "Dernière commande il y a plus de 12 mois",
    icon: Users,
  },
  {
    id: "multi-commandes",
    categorie: "Cycle de vie client",
    nom: "Acheteurs multi-commandes",
    description: "Au moins 2 commandes passées",
    icon: CheckCircle2,
  },
  {
    id: "gros-panier-unique",
    categorie: "Cycle de vie client",
    nom: "Gros panier unique (> 5 000€)",
    description: "1 commande > 5 000 €, pas de 2e achat",
    icon: AlertTriangle,
  },
  // ── Téléchargements ────────────────────────────────────────────────────────
  {
    id: "guide-sdb",
    categorie: "Téléchargements",
    nom: "Guide SDB teck",
    description: "Contacts ayant téléchargé le guide",
    icon: Mail,
  },
];

export default function EmailingPage() {
  const [data, setData] = useState<BrevoStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Sync state
  const [syncingSegment, setSyncingSegment] = useState<string | null>(null);
  const [syncResults, setSyncResults] = useState<Record<string, SyncResult>>({});
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [syncAllRunning, setSyncAllRunning] = useState(false);

  const fetchStats = async (fresh = false) => {
    if (fresh) setRefreshing(true);
    try {
      const res = await fetch(
        `/api/marketing/brevo/stats${fresh ? "?fresh=true" : ""}`
      );
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Erreur Brevo stats:", err);
      setData({
        contacts: { total: 0 },
        dernieresCampagnes: [],
        moyennes: { tauxOuvertureMoyen: 0, tauxClicMoyen: 0 },
        _cache: null,
        error: "Impossible de contacter l'API Brevo",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchSyncLogs();
  }, []);

  // Fetch sync logs
  const fetchSyncLogs = async () => {
    try {
      const res = await fetch("/api/marketing/brevo/listes");
      const json = await res.json();
      setSyncLogs(json.syncLogs || []);
    } catch {
      // silent
    }
  };

  // Sync one segment
  const syncSegment = async (segmentId: string) => {
    setSyncingSegment(segmentId);
    try {
      const res = await fetch("/api/marketing/brevo/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ segmentId }),
      });
      const json = await res.json();
      setSyncResults((prev) => ({ ...prev, [segmentId]: json }));
      fetchSyncLogs();
    } catch (err: any) {
      setSyncResults((prev) => ({
        ...prev,
        [segmentId]: { success: false, segmentId, nbContacts: 0, error: err.message },
      }));
    } finally {
      setSyncingSegment(null);
    }
  };

  // Sync all segments
  const syncAll = async () => {
    setSyncAllRunning(true);
    for (const seg of SEGMENTS) {
      await syncSegment(seg.id);
    }
    setSyncAllRunning(false);
  };

  // Skeleton loader
  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6 lg:space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="h-8 w-40 bg-cockpit-dark rounded-lg animate-pulse" />
            <div className="h-4 w-56 bg-cockpit-dark rounded mt-2 animate-pulse" />
          </div>
          <div className="h-10 w-44 bg-cockpit-dark rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-24 bg-cockpit-card rounded-card border border-cockpit animate-pulse p-4"
            >
              <div className="h-3 w-24 bg-cockpit-dark rounded mb-3" />
              <div className="h-6 w-16 bg-cockpit-dark rounded" />
            </div>
          ))}
        </div>
        <div className="bg-cockpit-card rounded-card border border-cockpit overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="px-6 py-4 border-b border-cockpit flex gap-4 animate-pulse"
            >
              <div className="h-4 w-48 bg-cockpit-dark rounded" />
              <div className="h-4 w-16 bg-cockpit-dark rounded" />
              <div className="h-4 w-16 bg-cockpit-dark rounded" />
              <div className="h-4 w-16 bg-cockpit-dark rounded ml-auto" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const campagnes = data?.dernieresCampagnes || [];
  const avertissement = (data as any)?._avertissement || null;
  const derniereCampagne =
    campagnes.length > 0
      ? new Date(campagnes[0].dateEnvoi).toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "—";

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-cockpit-heading mb-1">
            Emailing
          </h1>
          <p className="text-cockpit-secondary text-sm">
            Données Brevo en temps réel
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="https://app.brevo.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-cockpit-card border border-cockpit px-4 py-2.5 rounded-lg font-semibold hover:bg-cockpit-dark transition-colors text-sm text-cockpit-primary"
          >
            <ExternalLink className="w-4 h-4" />
            <span className="hidden sm:inline">Ouvrir Brevo</span>
          </a>
          <button
            onClick={() => fetchStats(true)}
            disabled={refreshing}
            className="flex items-center gap-2 bg-cockpit-card border border-cockpit px-4 py-2.5 rounded-lg font-semibold hover:bg-cockpit-dark transition-colors disabled:opacity-50 text-sm"
          >
            {refreshing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Rafraîchir</span>
          </button>
        </div>
      </div>

      {/* Erreur Brevo */}
      {data?.error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-400 mb-1">
              Données Brevo indisponibles
            </h3>
            <p className="text-sm text-red-300">{data.error}</p>
          </div>
        </div>
      )}

      {/* Avertissement stats à zéro */}
      {avertissement && (
        <div className="flex items-start gap-3 p-4 rounded-lg border bg-amber-500/10 border-amber-500/30">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-amber-400 mb-1 text-sm">Campagnes sans statistiques</h3>
            <p className="text-xs text-cockpit-secondary">{avertissement}</p>
            <p className="text-xs text-cockpit-secondary mt-1">
              Ces campagnes ont probablement été envoyées à des listes vides (avant synchronisation).
              Synchronisez vos contacts puis créez une nouvelle campagne dans Brevo.
            </p>
          </div>
        </div>
      )}

      {/* Badge fraîcheur */}
      {data?._cache && (
        <div className="flex items-center gap-2 text-xs text-cockpit-secondary">
          <Clock className="w-3.5 h-3.5" />
          <span>Mis à jour {timeAgo(data._cache.generatedAt)}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-8">
        <KPICard
          title="Contacts Brevo"
          value={data?.contacts?.total?.toLocaleString("fr-FR") || "0"}
          icon={<Users className="w-7 h-7" />}
          bgColor="bg-mk-lemon"
        />
        <KPICard
          title="Taux ouverture moy."
          value={`${data?.moyennes?.tauxOuvertureMoyen || 0}%`}
          icon={<BarChart3 className="w-7 h-7" />}
          bgColor="bg-mk-lime"
        />
        <KPICard
          title="Taux clic moy."
          value={`${data?.moyennes?.tauxClicMoyen || 0}%`}
          icon={<MousePointerClick className="w-7 h-7" />}
          bgColor="bg-mk-grapefruit"
        />
        <KPICard
          title="Dernière campagne"
          value={derniereCampagne}
          icon={<Mail className="w-7 h-7" />}
          bgColor="bg-mk-raspberry"
        />
      </div>

      {/* Tableau des campagnes */}
      <div>
        <h2 className="text-lg font-bold text-cockpit-heading mb-3">
          Dernières campagnes envoyées
        </h2>

        {campagnes.length === 0 && !data?.error ? (
          <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg p-8 text-center">
            <Mail className="w-10 h-10 text-cockpit-secondary mx-auto mb-3 opacity-40" />
            <p className="text-cockpit-secondary text-sm">
              Aucune campagne envoyée
            </p>
          </div>
        ) : (
          <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg overflow-hidden">
            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto">
              {(() => {
                const maxOuverture = Math.max(...campagnes.map((c) => c.tauxOuverture), 1);
                const maxClic = Math.max(...campagnes.map((c) => c.tauxClic), 1);
                return (
                  <table className="w-full">
                    <thead className="bg-cockpit-dark border-b border-cockpit">
                      <tr>
                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-cockpit-heading">
                          CAMPAGNE
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-cockpit-heading">
                          ENVOYÉS
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-cockpit-heading">
                          OUVERTURE
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-cockpit-heading">
                          CLIC
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-cockpit-heading hidden lg:table-cell">
                          DÉSABO.
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-cockpit-heading hidden lg:table-cell">
                          BOUNCES
                        </th>
                        <th className="px-4 lg:px-6 py-3 text-right text-xs font-semibold text-cockpit-heading">
                          DATE
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cockpit">
                      {campagnes.map((c) => (
                        <tr
                          key={c.id}
                          className="hover:bg-cockpit-dark/50 transition-colors"
                        >
                          <td className="px-4 lg:px-6 py-3">
                            <a
                              href={`https://app.brevo.com/campaign/email/${c.id}/report`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium text-cockpit-primary hover:text-[var(--color-active)] truncate max-w-[260px] block transition-colors"
                              title={c.nom}
                            >
                              {c.nom}
                            </a>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {c.statsIndisponibles || c.destinataires === 0 ? (
                              <span className="text-xs text-cockpit-secondary">—</span>
                            ) : (
                              <span className="text-sm font-semibold text-cockpit-heading">
                                {c.destinataires.toLocaleString("fr-FR")}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {c.statsIndisponibles || c.destinataires === 0 ? (
                              <span className="text-xs text-cockpit-secondary">—</span>
                            ) : (
                              <div className="flex items-center justify-end gap-2">
                                <div className="w-16 h-1.5 bg-cockpit-dark rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-[var(--color-active)] rounded-full"
                                    style={{ width: `${(c.tauxOuverture / maxOuverture) * 100}%` }}
                                  />
                                </div>
                                <span className="text-sm font-medium text-[var(--color-active)] w-12 text-right">
                                  {c.tauxOuverture}%
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {c.statsIndisponibles || c.destinataires === 0 ? (
                              <span className="text-xs text-cockpit-secondary">—</span>
                            ) : (
                              <div className="flex items-center justify-end gap-2">
                                <div className="w-16 h-1.5 bg-cockpit-dark rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-[var(--color-active)]/60 rounded-full"
                                    style={{ width: `${(c.tauxClic / maxClic) * 100}%` }}
                                  />
                                </div>
                                <span className="text-sm font-medium text-[var(--color-active)]/60 w-12 text-right">
                                  {c.tauxClic}%
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right hidden lg:table-cell">
                            <span className={`text-xs font-medium ${c.desabonnements > 0 ? "text-amber-400" : "text-cockpit-secondary"}`}>
                              {c.statsIndisponibles ? "—" : c.desabonnements > 0 ? `−${c.desabonnements}` : "0"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right hidden lg:table-cell">
                            <span className={`text-xs font-medium ${c.bounces > 0 ? "text-red-400" : "text-cockpit-secondary"}`}>
                              {c.statsIndisponibles ? "—" : c.bounces > 0 ? c.bounces : "0"}
                            </span>
                          </td>
                          <td className="px-4 lg:px-6 py-3 text-right">
                            <span className="text-xs text-cockpit-secondary whitespace-nowrap">
                              {new Date(c.dateEnvoi).toLocaleDateString("fr-FR")}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              })()}
            </div>

            {/* Mobile */}
            <div className="md:hidden divide-y divide-cockpit">
              {campagnes.map((c) => (
                <div
                  key={c.id}
                  className="p-4 hover:bg-cockpit-dark transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <a
                        href={`https://app.brevo.com/campaign/email/${c.id}/report`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-cockpit-primary text-sm truncate block hover:text-[var(--color-active)]"
                      >
                        {c.nom}
                      </a>
                      <p className="text-cockpit-secondary text-xs mt-0.5">
                        {new Date(c.dateEnvoi).toLocaleDateString("fr-FR")} •{" "}
                        {c.statsIndisponibles ? "stats non disponibles" : `${c.destinataires.toLocaleString("fr-FR")} envoyés`}
                      </p>
                    </div>
                  </div>
                  {!c.statsIndisponibles && c.destinataires > 0 && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] text-cockpit-secondary mb-1">Ouverture</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-cockpit-dark rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[var(--color-active)] rounded-full"
                            style={{ width: `${Math.min(c.tauxOuverture * 2, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-[var(--color-active)]">
                          {c.tauxOuverture}%
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] text-cockpit-secondary mb-1">Clic</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-cockpit-dark rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[var(--color-active)]/60 rounded-full"
                            style={{ width: `${Math.min(c.tauxClic * 5, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-[var(--color-active)]/60">
                          {c.tauxClic}%
                        </span>
                      </div>
                    </div>
                    {(c.desabonnements > 0 || c.bounces > 0) && (
                      <div className="col-span-2 flex items-center gap-4 pt-1">
                        {c.desabonnements > 0 && (
                          <span className="text-[10px] text-amber-400">
                            −{c.desabonnements} désabo.
                          </span>
                        )}
                        {c.bounces > 0 && (
                          <span className="text-[10px] text-red-400">
                            {c.bounces} bounce{c.bounces > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Campagnes en cours (draft / programmées) */}
      {(data?.campagnesEnCours ?? []).length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-cockpit-heading mb-3">
            Campagnes en préparation
          </h2>
          <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg overflow-hidden">
            <div className="divide-y divide-cockpit">
              {(data?.campagnesEnCours ?? []).map((c) => {
                const statusLabel =
                  c.status === "draft"
                    ? "Brouillon"
                    : c.status === "scheduled"
                    ? "Programmée"
                    : "En file";
                const statusColor =
                  c.status === "scheduled"
                    ? "bg-blue-500/10 text-blue-400"
                    : c.status === "queued"
                    ? "bg-amber-500/10 text-amber-400"
                    : "bg-cockpit-dark text-cockpit-secondary";
                const StatusIcon =
                  c.status === "scheduled" ? Calendar : FileEdit;

                return (
                  <div
                    key={c.id}
                    className="px-4 py-3 flex items-center gap-3 hover:bg-cockpit-dark/50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-cockpit-dark flex items-center justify-center flex-shrink-0">
                      <StatusIcon className="w-4 h-4 text-cockpit-secondary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-cockpit-primary truncate">
                        {c.nom}
                      </p>
                      {c.scheduledAt && (
                        <p className="text-[10px] text-cockpit-secondary mt-0.5">
                          Envoi prévu :{" "}
                          {new Date(c.scheduledAt).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      )}
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColor}`}
                    >
                      {statusLabel}
                    </span>
                    <a
                      href={`https://app.brevo.com/campaign/email/${c.id}/edit`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-[var(--color-active)] hover:underline flex items-center gap-0.5"
                    >
                      Éditer <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Section Sync KÒKPIT → Brevo */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-cockpit-heading">
            Segments KÒKPIT → Brevo
          </h2>
          <button
            onClick={syncAll}
            disabled={syncAllRunning || !!syncingSegment}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-cockpit hover:bg-cockpit-dark transition-colors disabled:opacity-50"
          >
            {syncAllRunning ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Upload className="w-3.5 h-3.5" />
            )}
            Tout synchroniser
          </button>
        </div>

        <p className="text-xs text-cockpit-secondary mb-4">
          Synchronise tes contacts vers des listes Brevo ciblées pour lancer des campagnes stratégiques.
        </p>

        {/* Segments groupés par catégorie */}
        {(() => {
          const categories = [...new Set(SEGMENTS.map((s) => s.categorie))];
          return categories.map((cat) => (
            <div key={cat} className="mb-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-cockpit-secondary mb-2 px-1">
                {cat}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SEGMENTS.filter((s) => s.categorie === cat).map((seg) => {
                  const result = syncResults[seg.id];
                  const Icon = seg.icon;
                  const isSyncing = syncingSegment === seg.id;
                  const lastLog = syncLogs.find((l) => l.segmentNom === seg.nom);

                  return (
                    <div
                      key={seg.id}
                      className="bg-cockpit-card rounded-xl border border-cockpit p-4 flex flex-col gap-3"
                    >
                      <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[var(--color-active)]/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-[var(--color-active)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-cockpit-heading">
                      {seg.nom}
                    </p>
                    <p className="text-[10px] text-cockpit-secondary mt-0.5">
                      {seg.description}
                    </p>
                  </div>
                  <button
                    onClick={() => syncSegment(seg.id)}
                    disabled={isSyncing || syncAllRunning}
                    className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-[var(--color-active)]/10 text-[var(--color-active)] hover:bg-[var(--color-active)]/20 transition-colors disabled:opacity-50 flex-shrink-0"
                  >
                    {isSyncing ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Upload className="w-3 h-3" />
                    )}
                    Sync
                  </button>
                </div>

                {/* Last sync info */}
                {lastLog && !result && (
                  <div className="flex items-center gap-2 text-[10px] text-cockpit-secondary">
                    <Clock className="w-3 h-3 flex-shrink-0" />
                    <span>
                      {timeAgo(lastLog.createdAt)} · {lastLog.nbContacts} contacts
                    </span>
                    {lastLog.statut === "error" && (
                      <span className="text-red-400 font-medium">(erreur)</span>
                    )}
                  </div>
                )}

                {/* Result */}
                {result && (
                  <div
                    className={`text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 ${
                      result.success
                        ? "bg-[var(--color-active)]/10 text-[var(--color-active)]"
                        : "bg-red-500/10 text-red-400"
                    }`}
                  >
                    {result.success ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                        {result.nbContacts} contacts synchronisés
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        {result.error || "Erreur"}
                      </>
                    )}
                  </div>
                )}

                {/* Lien Brevo */}
                {result?.listeBrevoId && (
                  <a
                    href={`https://app.brevo.com/contact/list/id/${result.listeBrevoId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-[var(--color-active)] hover:underline w-fit"
                  >
                    Voir dans Brevo
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            );
          })}
              </div>
            </div>
          ));
        })()}
      </div>

      {/* Historique sync */}
      {syncLogs.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-cockpit-heading mb-3">
            Historique des synchronisations
          </h2>
          <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-cockpit-dark border-b border-cockpit">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-cockpit-heading">
                    SEGMENT
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-cockpit-heading">
                    CONTACTS
                  </th>
                  <th className="px-4 py-2.5 text-center text-xs font-semibold text-cockpit-heading">
                    STATUT
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-cockpit-heading">
                    DATE
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cockpit">
                {syncLogs.slice(0, 10).map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-cockpit-dark/50 transition-colors"
                  >
                    <td className="px-4 py-2.5 text-sm text-cockpit-primary">
                      {log.segmentNom}
                    </td>
                    <td className="px-4 py-2.5 text-sm text-right font-medium text-cockpit-heading">
                      {log.nbContacts}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          log.statut === "success"
                            ? "bg-[var(--color-active)]/10 text-[var(--color-active)]"
                            : "bg-red-500/10 text-red-400"
                        }`}
                      >
                        {log.statut === "success" ? "OK" : "Erreur"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-cockpit-secondary text-right">
                      {new Date(log.createdAt).toLocaleDateString("fr-FR")}{" "}
                      {new Date(log.createdAt).toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Lien Brevo */}
      <div className="flex items-center justify-center">
        <a
          href="https://app.brevo.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-[var(--color-active)] hover:underline"
        >
          Créer une campagne dans Brevo
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
