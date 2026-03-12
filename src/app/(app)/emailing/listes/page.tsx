"use client";

import { useState, useEffect, useCallback } from "react";
import {
  List,
  Plus,
  Loader2,
  Users,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
} from "lucide-react";
import clsx from "clsx";

interface BrevoList {
  id: number;
  name: string;
  totalSubscribers: number;
  totalBlacklisted: number;
}

interface CreateResult {
  success: boolean;
  listId: number;
  listName: string;
  contactsMatched: number;
  contactsAdded: number;
}

export default function ListesPage() {
  const [listes, setListes] = useState<BrevoList[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createResult, setCreateResult] = useState<CreateResult | null>(null);
  const [error, setError] = useState("");

  // Form state
  const [listName, setListName] = useState("");
  const [stage, setStage] = useState("");
  const [hasDevis, setHasDevis] = useState(false);
  const [hasVente, setHasVente] = useState(false);
  const [createdAfter, setCreatedAfter] = useState("");

  const fetchListes = useCallback(async () => {
    try {
      const res = await fetch("/api/marketing/brevo/listes");
      if (res.ok) {
        const data = await res.json();
        setListes(data.listes || []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchListes();
  }, [fetchListes]);

  const handleCreate = async () => {
    if (!listName.trim()) return;
    setCreating(true);
    setError("");
    setCreateResult(null);

    try {
      const criteria: any = {};
      if (stage) criteria.stage = stage;
      if (hasDevis) criteria.hasDevis = true;
      if (hasVente) criteria.hasVente = true;
      if (createdAfter) criteria.createdAfter = createdAfter;

      const res = await fetch("/api/marketing/brevo/listes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: listName, criteria }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCreateResult(data);
        fetchListes();
      } else {
        setError(data.error || "Erreur lors de la création");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setListName("");
    setStage("");
    setHasDevis(false);
    setHasVente(false);
    setCreatedAfter("");
    setCreateResult(null);
    setError("");
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-cockpit-heading mb-1">
            Listes Brevo
          </h1>
          <p className="text-cockpit-secondary text-sm">
            {listes.length} liste{listes.length > 1 ? "s" : ""} disponible{listes.length > 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setLoading(true); fetchListes(); }}
            className="flex items-center gap-1.5 bg-cockpit-card border border-cockpit px-3 py-2 rounded-lg text-xs font-medium hover:bg-cockpit-dark transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="flex items-center gap-2 bg-cockpit-yellow text-cockpit-bg px-4 py-2 rounded-lg font-semibold text-sm hover:opacity-90"
          >
            <Plus className="w-4 h-4" /> Nouvelle liste
          </button>
        </div>
      </div>

      {/* Lists grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-cockpit-yellow" />
        </div>
      ) : listes.length === 0 ? (
        <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg p-8 text-center">
          <List className="w-12 h-12 mx-auto mb-4 text-cockpit-secondary opacity-50" />
          <h3 className="text-base font-semibold text-cockpit-heading mb-2">Aucune liste</h3>
          <p className="text-cockpit-secondary text-sm mb-4">Crée ta première liste dynamique pour segmenter tes contacts</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {listes.map((liste) => (
            <div key={liste.id} className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg p-4 sm:p-5">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="w-10 h-10 rounded-lg bg-cockpit-info/10 flex items-center justify-center flex-shrink-0">
                  <List className="w-5 h-5 text-cockpit-info" />
                </div>
                <span className="text-[10px] bg-cockpit-success/10 text-cockpit-success px-2 py-0.5 rounded-full font-semibold">
                  Active
                </span>
              </div>
              <h3 className="text-sm font-semibold text-cockpit-heading truncate mb-1">
                {liste.name}
              </h3>
              <div className="flex items-center gap-3 text-xs text-cockpit-secondary">
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" /> {liste.totalSubscribers} contact{liste.totalSubscribers > 1 ? "s" : ""}
                </span>
                {liste.totalBlacklisted > 0 && (
                  <span className="text-red-400">{liste.totalBlacklisted} blacklisté{liste.totalBlacklisted > 1 ? "s" : ""}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-cockpit-card border border-cockpit rounded-2xl shadow-cockpit-lg w-full max-w-lg">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-cockpit">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cockpit-yellow/10 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-cockpit-yellow" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-cockpit-heading">Nouvelle liste</h2>
                  <p className="text-xs text-cockpit-secondary">Créer une liste dynamique Brevo</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-cockpit-dark rounded-lg">
                <X className="w-5 h-5 text-cockpit-secondary" />
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-4 space-y-4">
              {createResult ? (
                <div className="text-center py-4">
                  <CheckCircle2 className="w-12 h-12 text-cockpit-success mx-auto mb-3" />
                  <h3 className="text-base font-semibold text-cockpit-heading mb-2">
                    Liste &quot;{createResult.listName}&quot; créée
                  </h3>
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="bg-cockpit-dark rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-cockpit-info">{createResult.contactsMatched}</p>
                      <p className="text-[10px] text-cockpit-secondary">Contacts trouvés</p>
                    </div>
                    <div className="bg-cockpit-dark rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-cockpit-success">{createResult.contactsAdded}</p>
                      <p className="text-[10px] text-cockpit-secondary">Ajoutés à Brevo</p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Name */}
                  <div>
                    <label className="text-xs font-semibold text-cockpit-heading mb-1 block">Nom de la liste</label>
                    <input
                      type="text"
                      value={listName}
                      onChange={(e) => setListName(e.target.value)}
                      placeholder="Ex: Prospects 2024"
                      className="w-full px-3 py-2.5 border border-cockpit-input rounded-input bg-cockpit-input text-cockpit-primary text-sm"
                    />
                  </div>

                  {/* Criteria */}
                  <div>
                    <label className="text-xs font-semibold text-cockpit-heading mb-2 block">Critères de sélection</label>
                    <div className="space-y-3">
                      <select
                        value={stage}
                        onChange={(e) => setStage(e.target.value)}
                        className="w-full bg-cockpit-input border border-cockpit-input px-3 py-2.5 rounded-input text-xs text-cockpit-primary"
                      >
                        <option value="">Tous les stages</option>
                        <option value="PROSPECT">Prospects</option>
                        <option value="LEAD">Leads</option>
                        <option value="CLIENT">Clients</option>
                        <option value="INACTIF">Inactifs</option>
                      </select>

                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-xs text-cockpit-primary cursor-pointer">
                          <input type="checkbox" checked={hasDevis} onChange={(e) => setHasDevis(e.target.checked)}
                            className="rounded border-cockpit accent-cockpit-yellow" />
                          Avec devis
                        </label>
                        <label className="flex items-center gap-2 text-xs text-cockpit-primary cursor-pointer">
                          <input type="checkbox" checked={hasVente} onChange={(e) => setHasVente(e.target.checked)}
                            className="rounded border-cockpit accent-cockpit-yellow" />
                          Avec commande
                        </label>
                      </div>

                      <div>
                        <label className="text-[10px] text-cockpit-secondary block mb-1">Créés après</label>
                        <input
                          type="date"
                          value={createdAfter}
                          onChange={(e) => setCreatedAfter(e.target.value)}
                          className="w-full bg-cockpit-input border border-cockpit-input px-3 py-2 rounded-input text-xs text-cockpit-primary"
                        />
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                      <p className="text-xs text-red-400">{error}</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-cockpit">
              <button onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-medium border border-cockpit text-cockpit-primary hover:bg-cockpit-dark">
                Fermer
              </button>
              {!createResult && (
                <button onClick={handleCreate} disabled={creating || !listName.trim()}
                  className="flex items-center gap-2 bg-cockpit-yellow text-cockpit-bg px-4 py-2 rounded-lg text-xs font-semibold hover:opacity-90 disabled:opacity-50">
                  {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Créer et exporter
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
