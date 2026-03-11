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
  Upload,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

interface Campaign {
  id: number;
  nom: string;
  dateEnvoi: string;
  destinataires: number;
  tauxOuverture: number;
  tauxClic: number;
  desabonnements: number;
  bounces: number;
}

interface BrevoStats {
  contacts: { total: number };
  dernieresCampagnes: Campaign[];
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
  {
    id: "tous-contacts",
    nom: "Tous les contacts actifs",
    description: "Tous les contacts KOKPIT non archivés",
    icon: Users,
  },
  {
    id: "clients-90j",
    nom: "Clients récents (90 jours)",
    description: "Contacts ayant une commande récente",
    icon: CheckCircle2,
  },
  {
    id: "prospects-devis",
    nom: "Prospects — devis sans commande",
    description: "Contacts avec devis mais sans BDC",
    icon: AlertTriangle,
  },
  {
    id: "contacts-sans-achat",
    nom: "Contacts sans achat",
    description: "Contacts sans aucune commande",
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
            <div className="h-8 w-40 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-4 w-56 bg-gray-200 rounded mt-2 animate-pulse" />
          </div>
          <div className="h-10 w-44 bg-gray-200 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-24 bg-white rounded-xl border border-gray-200 animate-pulse p-4"
            >
              <div className="h-3 w-24 bg-gray-200 rounded mb-3" />
              <div className="h-6 w-16 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="px-6 py-4 border-b border-gray-100 flex gap-4 animate-pulse"
            >
              <div className="h-4 w-48 bg-gray-200 rounded" />
              <div className="h-4 w-16 bg-gray-200 rounded" />
              <div className="h-4 w-16 bg-gray-200 rounded" />
              <div className="h-4 w-16 bg-gray-200 rounded ml-auto" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const campagnes = data?.dernieresCampagnes || [];
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
          bgColor="bg-cockpit-yellow"
        />
        <KPICard
          title="Taux ouverture moy."
          value={`${data?.moyennes?.tauxOuvertureMoyen || 0}%`}
          icon={<BarChart3 className="w-7 h-7" />}
          bgColor="bg-cockpit-info"
        />
        <KPICard
          title="Taux clic moy."
          value={`${data?.moyennes?.tauxClicMoyen || 0}%`}
          icon={<MousePointerClick className="w-7 h-7" />}
          bgColor="bg-cockpit-warning"
        />
        <KPICard
          title="Dernière campagne"
          value={derniereCampagne}
          icon={<Mail className="w-7 h-7" />}
          bgColor="bg-cockpit-success"
        />
      </div>

      {/* Tableau des 5 dernières campagnes */}
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
                        <p className="text-sm font-medium text-cockpit-primary truncate max-w-[280px]">
                          {c.nom}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-semibold text-cockpit-heading">
                          {c.destinataires.toLocaleString("fr-FR")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1.5 bg-cockpit-dark rounded-full overflow-hidden">
                            <div
                              className="h-full bg-cockpit-info rounded-full"
                              style={{
                                width: `${Math.min(c.tauxOuverture, 100)}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium text-cockpit-info w-12 text-right">
                            {c.tauxOuverture}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1.5 bg-cockpit-dark rounded-full overflow-hidden">
                            <div
                              className="h-full bg-cockpit-warning rounded-full"
                              style={{
                                width: `${Math.min(c.tauxClic * 3, 100)}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium text-cockpit-warning w-12 text-right">
                            {c.tauxClic}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right hidden lg:table-cell">
                        <span className="text-xs text-cockpit-secondary">
                          {c.bounces}
                        </span>
                      </td>
                      <td className="px-4 lg:px-6 py-3 text-right">
                        <span className="text-xs text-cockpit-secondary">
                          {new Date(c.dateEnvoi).toLocaleDateString("fr-FR")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                      <p className="font-medium text-cockpit-primary text-sm truncate">
                        {c.nom}
                      </p>
                      <p className="text-cockpit-secondary text-xs mt-0.5">
                        {new Date(c.dateEnvoi).toLocaleDateString("fr-FR")} •{" "}
                        {c.destinataires.toLocaleString("fr-FR")} envoyés
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] text-cockpit-secondary mb-1">
                        Ouverture
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-cockpit-dark rounded-full overflow-hidden">
                          <div
                            className="h-full bg-cockpit-info rounded-full"
                            style={{
                              width: `${Math.min(c.tauxOuverture, 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-cockpit-info">
                          {c.tauxOuverture}%
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] text-cockpit-secondary mb-1">
                        Clic
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-cockpit-dark rounded-full overflow-hidden">
                          <div
                            className="h-full bg-cockpit-warning rounded-full"
                            style={{
                              width: `${Math.min(c.tauxClic * 3, 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-cockpit-warning">
                          {c.tauxClic}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Section Sync Sellsy → Brevo */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-cockpit-heading">
            Synchronisation Sellsy → Brevo
          </h2>
          <button
            onClick={syncAll}
            disabled={syncAllRunning || !!syncingSegment}
            className="flex items-center gap-2 bg-cockpit-yellow text-cockpit-bg px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {syncAllRunning ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            Tout synchroniser
          </button>
        </div>

        <p className="text-xs text-cockpit-secondary mb-4">
          Les contacts sont synchronisés en lecture seule depuis Sellsy vers les listes Brevo.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SEGMENTS.map((seg) => {
            const result = syncResults[seg.id];
            const Icon = seg.icon;
            const isSyncing = syncingSegment === seg.id;

            // Find last sync log for this segment
            const lastLog = syncLogs.find((l) => l.segmentNom === seg.nom);

            return (
              <div
                key={seg.id}
                className="bg-cockpit-card rounded-xl border border-cockpit p-4 flex flex-col gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-cockpit-info/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4.5 h-4.5 text-cockpit-info" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-cockpit-heading">
                      {seg.nom}
                    </p>
                    <p className="text-[10px] text-cockpit-secondary mt-0.5">
                      {seg.description}
                    </p>
                  </div>
                </div>

                {/* Last sync info */}
                {lastLog && (
                  <div className="flex items-center gap-2 text-[10px] text-cockpit-secondary">
                    <Clock className="w-3 h-3" />
                    <span>
                      Dernière synchro : {timeAgo(lastLog.createdAt)} ·{" "}
                      {lastLog.nbContacts} contacts
                    </span>
                    {lastLog.statut === "error" && (
                      <span className="text-red-400">(erreur)</span>
                    )}
                  </div>
                )}

                {/* Result */}
                {result && (
                  <div
                    className={`text-xs px-2 py-1 rounded ${
                      result.success
                        ? "bg-cockpit-success/10 text-cockpit-success"
                        : "bg-red-500/10 text-red-400"
                    }`}
                  >
                    {result.success
                      ? `${result.nbContacts} contacts synchronisés`
                      : result.error || "Erreur"}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => syncSegment(seg.id)}
                    disabled={isSyncing || syncAllRunning}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cockpit text-cockpit-primary text-xs font-medium hover:bg-cockpit-dark transition-colors disabled:opacity-50"
                  >
                    {isSyncing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5" />
                    )}
                    Synchroniser
                  </button>
                  {result?.listeBrevoId && (
                    <a
                      href={`https://app.brevo.com/contact/list/id/${result.listeBrevoId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-cockpit-info hover:underline"
                    >
                      Voir dans Brevo
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
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
                            ? "bg-cockpit-success/10 text-cockpit-success"
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
          className="flex items-center gap-2 text-sm text-cockpit-info hover:underline"
        >
          Créer une campagne dans Brevo
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
