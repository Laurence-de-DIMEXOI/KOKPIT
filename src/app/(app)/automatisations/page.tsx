"use client";

import { useState, useEffect, useCallback } from "react";
import { KPICard } from "@/components/dashboard/kpi-card";
import {
  Zap, Activity, CheckCircle, AlertCircle, RefreshCw, Loader2,
  Mail, ChevronDown, ChevronUp, Clock, Power, PowerOff,
  Save, X, Eye, Send, Sparkles, ExternalLink, Upload, Download,
  Link2, Unlink,
} from "lucide-react";

// ===== TYPES =====

interface EmailTemplate {
  id: string;
  workflowId: string;
  nom: string;
  sujet: string;
  contenuHtml: string;
  contenuTexte: string | null;
  variables: string[] | null;
  brevoTemplateId: number | null;
}

interface WorkflowStats {
  executions30d: number;
  success30d: number;
  error30d: number;
  lastExecutedAt: string | null;
  lastStatus: string | null;
}

interface Workflow {
  id: string;
  nom: string;
  description: string | null;
  trigger: string;
  enabled: boolean;
  delaiMinutes: number;
  conditions: any;
  emailTemplate: EmailTemplate | null;
  stats: WorkflowStats;
  _count: { executions: number };
}

interface KPIs {
  total: number;
  actifs: number;
  executions30d: number;
  tauxReussite: number;
}

interface BrevoAccount {
  email: string;
  company: string;
  plan: { type: string; credits: number };
}

// ===== TRIGGER CONFIG =====

const triggerConfig: Record<string, { label: string; color: string; icon: string }> = {
  NOUVELLE_DEMANDE: { label: "Nouvelle demande", color: "bg-cockpit-yellow/10 text-cockpit-yellow", icon: "📥" },
  CONTACT_CREE: { label: "Nouveau contact", color: "bg-cockpit-info/10 text-cockpit-info", icon: "👤" },
  DEVIS_ENVOYE: { label: "Devis envoyé", color: "bg-blue-500/10 text-blue-400", icon: "📄" },
  DEVIS_SANS_REPONSE_3J: { label: "Relance J+3", color: "bg-cockpit-warning/10 text-cockpit-warning", icon: "⏰" },
  DEVIS_SANS_REPONSE_7J: { label: "Relance J+7", color: "bg-orange-500/10 text-orange-400", icon: "⏰" },
  VENTE_CONFIRMEE: { label: "Vente confirmée", color: "bg-cockpit-success/10 text-cockpit-success", icon: "🎉" },
  LEAD_STATUT_CHANGE: { label: "Statut changé", color: "bg-purple-500/10 text-purple-400", icon: "🔄" },
  MANUEL: { label: "Manuel", color: "bg-cockpit-secondary/10 text-cockpit-secondary", icon: "✋" },
  NOUVEAU_LEAD: { label: "Nouveau lead", color: "bg-cockpit-yellow/10 text-cockpit-yellow", icon: "📥" },
  LEAD_INACTIF: { label: "Lead inactif", color: "bg-red-500/10 text-red-400", icon: "💤" },
  DEVIS_NON_FACTURE: { label: "Devis non facturé", color: "bg-cockpit-warning/10 text-cockpit-warning", icon: "📄" },
  POST_ACHAT: { label: "Post-achat", color: "bg-cockpit-success/10 text-cockpit-success", icon: "🎉" },
  SLA_DEPASSE: { label: "SLA dépassé", color: "bg-red-500/10 text-red-400", icon: "🚨" },
};

// ===== COMPONENT =====

export default function AutomatisationsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [kpis, setKpis] = useState<KPIs>({ total: 0, actifs: 0, executions30d: 0, tauxReussite: 100 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [editSujet, setEditSujet] = useState("");
  const [editHtml, setEditHtml] = useState("");
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  // Brevo state
  const [brevoAccount, setBrevoAccount] = useState<BrevoAccount | null>(null);
  const [brevoConnected, setBrevoConnected] = useState(false);
  const [brevoLoading, setBrevoLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [pulling, setPulling] = useState<string | null>(null);

  const fetchWorkflows = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await fetch("/api/workflows");
      const data = await res.json();
      if (data.success) {
        setWorkflows(data.workflows || []);
        setKpis(data.kpis || { total: 0, actifs: 0, executions30d: 0, tauxReussite: 100 });
      }
    } catch (err) {
      console.error("Erreur chargement workflows:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Check Brevo connection
  const fetchBrevoStatus = useCallback(async () => {
    setBrevoLoading(true);
    try {
      const res = await fetch("/api/brevo");
      const data = await res.json();
      if (data.success) {
        setBrevoAccount(data.account);
        setBrevoConnected(true);
      } else {
        setBrevoConnected(false);
      }
    } catch {
      setBrevoConnected(false);
    } finally {
      setBrevoLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkflows();
    fetchBrevoStatus();
  }, [fetchWorkflows, fetchBrevoStatus]);

  // Toggle enabled
  const toggleWorkflow = async (id: string, currentEnabled: boolean) => {
    setToggling(id);
    try {
      const res = await fetch("/api/workflows", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, enabled: !currentEnabled }),
      });
      const data = await res.json();
      if (data.success) {
        setWorkflows((prev) =>
          prev.map((w) => (w.id === id ? { ...w, enabled: !currentEnabled } : w))
        );
        setKpis((prev) => ({
          ...prev,
          actifs: prev.actifs + (currentEnabled ? -1 : 1),
        }));
      }
    } catch (err) {
      console.error("Erreur toggle:", err);
    } finally {
      setToggling(null);
    }
  };

  // Start editing template
  const startEdit = (wf: Workflow) => {
    if (wf.emailTemplate) {
      setEditingTemplate(wf.emailTemplate.id);
      setEditSujet(wf.emailTemplate.sujet);
      setEditHtml(wf.emailTemplate.contenuHtml);
    }
  };

  // Save template
  const saveTemplate = async () => {
    if (!editingTemplate) return;
    setSaving(true);
    try {
      const res = await fetch("/api/workflows/template", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingTemplate, sujet: editSujet, contenuHtml: editHtml }),
      });
      const data = await res.json();
      if (data.success) {
        setWorkflows((prev) =>
          prev.map((w) => {
            if (w.emailTemplate?.id === editingTemplate) {
              return { ...w, emailTemplate: { ...w.emailTemplate!, sujet: editSujet, contenuHtml: editHtml } };
            }
            return w;
          })
        );
        setEditingTemplate(null);
      }
    } catch (err) {
      console.error("Erreur save template:", err);
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setEditingTemplate(null);
    setEditSujet("");
    setEditHtml("");
  };

  // Preview
  const showPreview = (html: string) => {
    const preview = html
      .replace(/\{\{prenom\}\}/g, "Jean")
      .replace(/\{\{nom\}\}/g, "Dupont")
      .replace(/\{\{email\}\}/g, "jean@example.com")
      .replace(/\{\{meuble\}\}/g, "Table basse en teck")
      .replace(/\{\{montant\}\}/g, "2 450")
      .replace(/\{\{showroom\}\}/g, "Saint-Denis");
    setPreviewHtml(preview);
  };

  // ===== BREVO ACTIONS =====

  // Push local template → Brevo
  const syncToBrevo = async (emailTemplateId: string) => {
    setSyncing(emailTemplateId);
    try {
      const res = await fetch("/api/brevo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailTemplateId }),
      });
      const data = await res.json();
      if (data.success && data.brevoTemplateId) {
        // Update local state with brevoTemplateId
        setWorkflows((prev) =>
          prev.map((w) => {
            if (w.emailTemplate?.id === emailTemplateId) {
              return {
                ...w,
                emailTemplate: { ...w.emailTemplate!, brevoTemplateId: data.brevoTemplateId },
              };
            }
            return w;
          })
        );
        // Open Brevo editor in new tab
        if (data.editorUrl) {
          window.open(data.editorUrl, "_blank");
        }
      }
    } catch (err) {
      console.error("Erreur sync Brevo:", err);
    } finally {
      setSyncing(null);
    }
  };

  // Pull Brevo template → local
  const pullFromBrevo = async (emailTemplateId: string, brevoTemplateId: number) => {
    setPulling(emailTemplateId);
    try {
      const res = await fetch("/api/brevo", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailTemplateId, brevoTemplateId }),
      });
      const data = await res.json();
      if (data.success && data.template) {
        setWorkflows((prev) =>
          prev.map((w) => {
            if (w.emailTemplate?.id === emailTemplateId) {
              return {
                ...w,
                emailTemplate: {
                  ...w.emailTemplate!,
                  sujet: data.template.sujet,
                  contenuHtml: data.template.contenuHtml,
                  brevoTemplateId: data.template.brevoTemplateId,
                },
              };
            }
            return w;
          })
        );
      }
    } catch (err) {
      console.error("Erreur pull Brevo:", err);
    } finally {
      setPulling(null);
    }
  };

  // Open Brevo editor
  const openBrevoEditor = (brevoTemplateId: number) => {
    window.open(`https://app.brevo.com/camp/template/${brevoTemplateId}/design`, "_blank");
  };

  // Format delay
  const formatDelay = (minutes: number) => {
    if (minutes === 0) return "Immédiat";
    if (minutes < 60) return `${minutes} min`;
    if (minutes < 1440) return `${Math.round(minutes / 60)}h`;
    return `${Math.round(minutes / 1440)} jour(s)`;
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-cockpit-heading mb-1">Automatisations</h1>
          <p className="text-cockpit-secondary text-sm">
            Workflows email · Templates Brevo · Activer/désactiver
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Brevo status badge */}
          {brevoLoading ? (
            <span className="flex items-center gap-1.5 px-2.5 py-1.5 bg-cockpit-card border border-cockpit rounded-lg text-xs text-cockpit-secondary">
              <Loader2 className="w-3 h-3 animate-spin" />
              Brevo...
            </span>
          ) : brevoConnected ? (
            <span className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-lg text-xs text-blue-400">
              <Link2 className="w-3 h-3" />
              Brevo connecté
              {brevoAccount && (
                <span className="text-blue-400/60 hidden sm:inline">· {brevoAccount.email}</span>
              )}
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400">
              <Unlink className="w-3 h-3" />
              Brevo non connecté
            </span>
          )}

          <button
            onClick={() => { fetchWorkflows(true); fetchBrevoStatus(); }}
            disabled={refreshing}
            className="flex items-center gap-2 bg-cockpit-card border border-cockpit px-3 py-2 rounded-lg font-medium hover:bg-cockpit-dark transition-colors disabled:opacity-50 text-sm"
          >
            {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Actualiser
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KPICard title="Workflows" value={kpis.total} icon={<Zap className="w-6 h-6" />} bgColor="bg-cockpit-yellow" />
        <KPICard title="Actifs" value={kpis.actifs} icon={<CheckCircle className="w-6 h-6" />} bgColor="bg-cockpit-success" />
        <KPICard title="Exéc. 30j" value={kpis.executions30d} icon={<Activity className="w-6 h-6" />} bgColor="bg-cockpit-info" />
        <KPICard title="Réussite" value={`${kpis.tauxReussite}%`} icon={<Sparkles className="w-6 h-6" />} bgColor="bg-cockpit-warning" />
      </div>

      {/* Workflow list */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-cockpit-card rounded-card border border-cockpit p-12 text-center">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
            <span className="text-cockpit-secondary text-sm">Chargement...</span>
          </div>
        ) : workflows.length === 0 ? (
          <div className="bg-cockpit-card rounded-card border border-cockpit p-12 text-center">
            <Zap className="w-8 h-8 mx-auto mb-3 text-cockpit-secondary" />
            <p className="text-cockpit-secondary">Aucun workflow configuré</p>
          </div>
        ) : (
          workflows.map((wf) => {
            const isExpanded = expandedId === wf.id;
            const tc = triggerConfig[wf.trigger] || triggerConfig.MANUEL;
            const isEditing = editingTemplate === wf.emailTemplate?.id;
            const hasBrevo = !!wf.emailTemplate?.brevoTemplateId;

            return (
              <div
                key={wf.id}
                className={`bg-cockpit-card rounded-card border transition-all ${
                  isExpanded ? "border-cockpit-yellow/50 shadow-cockpit-lg" : "border-cockpit hover:border-cockpit-yellow/30"
                }`}
              >
                {/* Row principal */}
                <div className="flex items-center gap-3 px-3 sm:px-4 py-3 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : wf.id)}>
                  {/* Toggle */}
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleWorkflow(wf.id, wf.enabled); }}
                    disabled={toggling === wf.id}
                    className={`flex-shrink-0 w-11 h-6 rounded-full transition-colors relative ${
                      wf.enabled ? "bg-cockpit-success" : "bg-cockpit-dark border border-cockpit"
                    }`}
                    title={wf.enabled ? "Désactiver" : "Activer"}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      wf.enabled ? "translate-x-5" : "translate-x-0.5"
                    }`}>
                      {toggling === wf.id && <Loader2 className="w-3 h-3 animate-spin absolute inset-0 m-auto text-cockpit-secondary" />}
                    </div>
                  </button>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-cockpit-primary text-sm truncate">{wf.nom}</span>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${tc.color}`}>
                        {tc.icon} {tc.label}
                      </span>
                      {hasBrevo && (
                        <span className="inline-block px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[9px] font-bold">
                          BREVO
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-cockpit-secondary truncate">{wf.description}</p>
                  </div>

                  {/* Délai */}
                  <div className="hidden sm:flex items-center gap-1 text-xs text-cockpit-secondary flex-shrink-0">
                    <Clock className="w-3 h-3" />
                    {formatDelay(wf.delaiMinutes)}
                  </div>

                  {/* Stats */}
                  <div className="hidden md:flex items-center gap-2 text-xs flex-shrink-0">
                    {wf.stats.executions30d > 0 ? (
                      <>
                        <span className="text-cockpit-success font-semibold">{wf.stats.success30d}</span>
                        {wf.stats.error30d > 0 && (
                          <span className="text-red-400 font-semibold">{wf.stats.error30d} err</span>
                        )}
                      </>
                    ) : (
                      <span className="text-cockpit-secondary">—</span>
                    )}
                  </div>

                  {/* Last exec */}
                  <span className="text-[10px] text-cockpit-secondary flex-shrink-0 hidden lg:block min-w-[90px] text-right">
                    {wf.stats.lastExecutedAt ? formatDate(wf.stats.lastExecutedAt) : "Jamais"}
                  </span>

                  {/* Expand */}
                  <div className="flex-shrink-0 text-cockpit-secondary">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>

                {/* Expanded — Template editor + Brevo */}
                {isExpanded && (
                  <div className="border-t border-cockpit px-3 sm:px-4 py-3 sm:py-4 space-y-4">
                    {wf.emailTemplate ? (
                      <>
                        {/* Template header + actions */}
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <h3 className="text-sm font-semibold text-cockpit-heading flex items-center gap-2">
                            <Mail className="w-4 h-4 text-cockpit-yellow" />
                            Template: {wf.emailTemplate.nom}
                          </h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            {!isEditing && (
                              <>
                                <button
                                  onClick={() => showPreview(wf.emailTemplate!.contenuHtml)}
                                  className="flex items-center gap-1 px-2.5 py-1 bg-cockpit-dark border border-cockpit rounded-lg text-xs text-cockpit-secondary hover:text-cockpit-primary transition-colors"
                                >
                                  <Eye className="w-3 h-3" />
                                  Aperçu
                                </button>
                                <button
                                  onClick={() => startEdit(wf)}
                                  className="flex items-center gap-1 px-2.5 py-1 bg-cockpit-yellow/10 border border-cockpit-yellow/30 rounded-lg text-xs text-cockpit-yellow hover:bg-cockpit-yellow/20 transition-colors"
                                >
                                  Modifier
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* ===== BREVO SECTION ===== */}
                        {brevoConnected && (
                          <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                                </svg>
                                <span className="text-xs font-semibold text-blue-400">Brevo</span>
                                {hasBrevo ? (
                                  <span className="text-[10px] text-blue-400/60">
                                    Template #{wf.emailTemplate.brevoTemplateId}
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-cockpit-secondary">Non synchronisé</span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5">
                                {/* Push to Brevo */}
                                <button
                                  onClick={() => syncToBrevo(wf.emailTemplate!.id)}
                                  disabled={syncing === wf.emailTemplate!.id}
                                  className="flex items-center gap-1 px-2 py-1 bg-blue-500/10 border border-blue-500/30 rounded text-[11px] text-blue-400 hover:bg-blue-500/20 transition-colors disabled:opacity-50"
                                  title={hasBrevo ? "Mettre à jour sur Brevo" : "Envoyer vers Brevo"}
                                >
                                  {syncing === wf.emailTemplate!.id ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Upload className="w-3 h-3" />
                                  )}
                                  {hasBrevo ? "Push" : "Créer sur Brevo"}
                                </button>

                                {/* Pull from Brevo (only if linked) */}
                                {hasBrevo && (
                                  <button
                                    onClick={() => pullFromBrevo(wf.emailTemplate!.id, wf.emailTemplate!.brevoTemplateId!)}
                                    disabled={pulling === wf.emailTemplate!.id}
                                    className="flex items-center gap-1 px-2 py-1 bg-blue-500/10 border border-blue-500/30 rounded text-[11px] text-blue-400 hover:bg-blue-500/20 transition-colors disabled:opacity-50"
                                    title="Récupérer depuis Brevo"
                                  >
                                    {pulling === wf.emailTemplate!.id ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <Download className="w-3 h-3" />
                                    )}
                                    Pull
                                  </button>
                                )}

                                {/* Open Brevo editor */}
                                {hasBrevo && (
                                  <button
                                    onClick={() => openBrevoEditor(wf.emailTemplate!.brevoTemplateId!)}
                                    className="flex items-center gap-1 px-2 py-1 bg-blue-600/20 border border-blue-500/40 rounded text-[11px] text-blue-300 font-semibold hover:bg-blue-600/30 transition-colors"
                                    title="Ouvrir l'éditeur drag & drop Brevo"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    Éditeur Brevo
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {isEditing ? (
                          /* Edit mode */
                          <div className="space-y-3">
                            <div>
                              <label className="text-xs text-cockpit-secondary mb-1 block">Sujet de l&apos;email</label>
                              <input
                                type="text"
                                value={editSujet}
                                onChange={(e) => setEditSujet(e.target.value)}
                                className="w-full px-3 py-2 border border-cockpit-input rounded-lg bg-cockpit-input text-cockpit-primary text-sm"
                                placeholder="Sujet..."
                              />
                            </div>
                            <div>
                              <label className="text-xs text-cockpit-secondary mb-1 block">
                                Contenu HTML
                                <span className="ml-2 text-cockpit-yellow">
                                  Variables: {(wf.emailTemplate.variables || []).map((v) => `{{${v}}}`).join(", ")}
                                </span>
                              </label>
                              <textarea
                                value={editHtml}
                                onChange={(e) => setEditHtml(e.target.value)}
                                rows={8}
                                className="w-full px-3 py-2 border border-cockpit-input rounded-lg bg-cockpit-input text-cockpit-primary text-sm font-mono"
                                placeholder="<h2>Bonjour {{prenom}},</h2>..."
                              />
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <button
                                onClick={saveTemplate}
                                disabled={saving}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-cockpit-success text-white rounded-lg text-xs font-semibold hover:bg-cockpit-success/90 transition-colors disabled:opacity-50"
                              >
                                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                Enregistrer
                              </button>
                              <button
                                onClick={() => showPreview(editHtml)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-cockpit-dark border border-cockpit rounded-lg text-xs text-cockpit-secondary hover:text-cockpit-primary transition-colors"
                              >
                                <Eye className="w-3 h-3" />
                                Aperçu
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-cockpit-dark border border-cockpit rounded-lg text-xs text-cockpit-secondary hover:text-cockpit-primary transition-colors"
                              >
                                <X className="w-3 h-3" />
                                Annuler
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* View mode */
                          <div className="space-y-2">
                            <div className="bg-cockpit-dark rounded-lg p-3 border border-cockpit">
                              <div className="text-[10px] text-cockpit-secondary mb-1">SUJET</div>
                              <p className="text-sm text-cockpit-primary">{wf.emailTemplate.sujet}</p>
                            </div>
                            <div className="bg-cockpit-dark rounded-lg p-3 border border-cockpit">
                              <div className="text-[10px] text-cockpit-secondary mb-1">CONTENU</div>
                              <div
                                className="text-sm text-cockpit-primary prose prose-invert prose-sm max-w-none [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mb-2 [&_p]:mb-1"
                                dangerouslySetInnerHTML={{ __html: wf.emailTemplate.contenuHtml }}
                              />
                            </div>
                            {wf.emailTemplate.variables && wf.emailTemplate.variables.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {(wf.emailTemplate.variables as string[]).map((v) => (
                                  <span key={v} className="px-2 py-0.5 bg-cockpit-yellow/10 text-cockpit-yellow text-[10px] font-mono rounded">
                                    {`{{${v}}}`}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Stats détaillées */}
                        <div className="flex items-center gap-4 pt-2 border-t border-cockpit text-xs text-cockpit-secondary">
                          <span>Total: <strong className="text-cockpit-primary">{wf._count.executions}</strong> exécutions</span>
                          <span>30j: <strong className="text-cockpit-success">{wf.stats.success30d}</strong> succès</span>
                          {wf.stats.error30d > 0 && (
                            <span><strong className="text-red-400">{wf.stats.error30d}</strong> erreurs</span>
                          )}
                          <span>Délai: <strong className="text-cockpit-primary">{formatDelay(wf.delaiMinutes)}</strong></span>
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-cockpit-secondary italic py-4 text-center">
                        Pas de template email configuré pour ce workflow
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Preview Modal */}
      {previewHtml && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-3 border-b">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Aperçu email
              </h3>
              <button onClick={() => setPreviewHtml(null)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </div>
            <div className="px-5 py-3 border-t flex justify-end">
              <button
                onClick={() => setPreviewHtml(null)}
                className="px-4 py-1.5 rounded-lg text-sm font-medium border text-gray-600 hover:bg-gray-50"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
