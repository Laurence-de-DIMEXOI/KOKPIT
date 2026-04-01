"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Tags, AlertTriangle, ChevronUp, ChevronDown, Minus, Loader2, X } from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

interface LigneTarif {
  sellsyItemId: number;
  reference: string;
  designation: string;
  prixAvant: number;
  prixApres: number;
  diff: number;
}

interface SimulationResult {
  sessionId: string;
  coefficient: number;
  nbReferences: number;
  totalAvant: number;
  totalApres: number;
  lignes: LigneTarif[];
}

interface SessionHistorique {
  id: string;
  coefficient: number;
  nbReferences: number;
  statut: string;
  appliqueLeAt: string | null;
  annuleLeAt: string | null;
  createdAt: string;
  createdBy: { prenom: string; nom: string };
}

// ============================================================================
// HELPERS
// ============================================================================

const ACHAT_COLOR = "#CBA1D4";
const ACHAT_GRADIENT = {
  from: "#CBA1D4",
  to: "#a855f7",
  shadow: "#CBA1D440",
};

const fmtEuro = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

const fmtPct = (coeff: number) => {
  const pct = (coeff - 1) * 100;
  return pct >= 0 ? `+${pct.toFixed(1)}%` : `${pct.toFixed(1)}%`;
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const DELAI_ROLLBACK_MS = 24 * 60 * 60 * 1000;

function statutBadge(statut: string, appliqueLeAt: string | null) {
  if (statut === "SIMULE") return <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">Simulé</span>;
  if (statut === "ANNULE") return <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">Annulé</span>;
  if (statut === "ERREUR") return <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-medium">Erreur</span>;
  if (statut === "APPLIQUE") {
    const expired = appliqueLeAt && Date.now() - new Date(appliqueLeAt).getTime() > DELAI_ROLLBACK_MS;
    return <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">{expired ? "✅ Appliqué" : "✅ Appliqué"}</span>;
  }
  return null;
}

// ============================================================================
// PAGE
// ============================================================================

export default function TarifsCataloguePage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role as string | undefined;
  const isAuthorized = role === "ADMIN" || role === "DIRECTION";

  const [coefficient, setCoefficient] = useState("1.05");
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [applying, setApplying] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showRollbackModal, setShowRollbackModal] = useState<string | null>(null);
  const [historique, setHistorique] = useState<SessionHistorique[]>([]);
  const [histLoading, setHistLoading] = useState(false);
  const [sort, setSort] = useState<{ key: keyof LigneTarif; dir: "asc" | "desc" }>({
    key: "reference",
    dir: "asc",
  });

  useEffect(() => {
    if (isAuthorized) loadHistorique();
  }, [isAuthorized]);

  const loadHistorique = async () => {
    setHistLoading(true);
    try {
      const res = await fetch("/api/achat/tarifs/historique");
      if (res.ok) {
        const data = await res.json();
        setHistorique(data.sessions || []);
      }
    } catch { /* silencieux */ }
    setHistLoading(false);
  };

  const handleSimuler = async () => {
    setError(null);
    setSimulation(null);
    const coeff = parseFloat(coefficient.replace(",", "."));
    if (isNaN(coeff) || coeff <= 0) {
      setError("Coefficient invalide");
      return;
    }
    setSimulating(true);
    try {
      const res = await fetch("/api/achat/tarifs/simuler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coefficient: coeff }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur simulation");
      setSimulation(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    }
    setSimulating(false);
  };

  const handleAppliquer = async () => {
    if (!simulation) return;
    setShowModal(false);
    setApplying(true);
    setError(null);
    try {
      const res = await fetch("/api/achat/tarifs/appliquer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: simulation.sessionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur application");
      if (!data.success && data.errors?.length > 0) {
        setError(`${data.errors.length} erreur(s) lors de l'application. ${data.applied}/${data.total} références mises à jour.`);
      }
      setSimulation(null);
      loadHistorique();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    }
    setApplying(false);
  };

  const handleAnnuler = async (sessionId: string) => {
    setShowRollbackModal(null);
    setCancelling(true);
    setError(null);
    try {
      const res = await fetch("/api/achat/tarifs/annuler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur annulation");
      loadHistorique();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    }
    setCancelling(false);
  };

  const handleSort = (key: keyof LigneTarif) => {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" }
    );
  };

  const sortedLignes = simulation
    ? [...simulation.lignes].sort((a, b) => {
        const va = a[sort.key];
        const vb = b[sort.key];
        const cmp = typeof va === "string" ? va.localeCompare(vb as string) : (va as number) - (vb as number);
        return sort.dir === "asc" ? cmp : -cmp;
      })
    : [];

  const coeff = parseFloat(coefficient.replace(",", "."));
  const pctLabel = !isNaN(coeff) && coeff > 0 ? fmtPct(coeff) : "";

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-cockpit-heading font-semibold">Accès refusé</p>
          <p className="text-cockpit-secondary text-sm mt-1">Réservé aux rôles ADMIN et DIRECTION</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
          style={{
            background: `linear-gradient(135deg, ${ACHAT_GRADIENT.from} 0%, ${ACHAT_GRADIENT.to} 100%)`,
            boxShadow: `0 4px 15px ${ACHAT_GRADIENT.shadow}`,
          }}
        >
          <Tags className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-cockpit-heading">Mise à jour des tarifs catalogue</h1>
          <p className="text-sm text-cockpit-secondary">
            Les modifications sont appliquées directement dans Sellsy
          </p>
        </div>
      </div>

      {/* Avertissement */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          <p className="font-semibold">Action irréversible sans rollback</p>
          <p className="mt-0.5 text-amber-700">
            Simulez d&apos;abord pour vérifier les nouveaux prix. La confirmation modifie le catalogue Sellsy.
            Un rollback est possible dans les 24h suivant l&apos;application.
          </p>
        </div>
      </div>

      {/* Formulaire */}
      <div className="bg-white border border-cockpit rounded-xl p-6">
        <h2 className="font-semibold text-cockpit-heading mb-4">Paramètres</h2>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-medium text-cockpit-secondary mb-1">
              Coefficient multiplicateur
            </label>
            <input
              type="text"
              value={coefficient}
              onChange={(e) => setCoefficient(e.target.value)}
              className="border border-cockpit rounded-lg px-3 py-2 text-sm w-28 text-center font-mono"
              placeholder="1.05"
            />
          </div>
          {pctLabel && (
            <div className="pb-2">
              <span
                className={`text-lg font-bold ${
                  coeff > 1 ? "text-green-600" : coeff < 1 ? "text-red-600" : "text-gray-400"
                }`}
              >
                {pctLabel}
              </span>
              <p className="text-xs text-cockpit-secondary mt-0.5">
                ex: 1.05 = +5% · 0.95 = -5% · 1.10 = +10%
              </p>
            </div>
          )}
          <button
            onClick={handleSimuler}
            disabled={simulating || applying}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
            style={{
              background: `linear-gradient(135deg, ${ACHAT_GRADIENT.from} 0%, ${ACHAT_GRADIENT.to} 100%)`,
            }}
          >
            {simulating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Tags className="w-4 h-4" />}
            {simulating ? "Simulation en cours…" : "Simuler les modifications"}
          </button>
        </div>
        {error && (
          <div className="mt-3 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}
      </div>

      {/* Résultat simulation */}
      {simulation && (
        <div className="bg-white border border-cockpit rounded-xl overflow-hidden">
          {/* Résumé */}
          <div className="p-5 border-b border-cockpit bg-gray-50">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-cockpit-heading">
                  Résultat simulation — {simulation.nbReferences} références
                </h3>
                <p className="text-sm text-cockpit-secondary mt-1">
                  Total catalogue :{" "}
                  <span className="font-medium text-cockpit-primary">{fmtEuro(simulation.totalAvant)}</span>
                  {" → "}
                  <span className="font-medium text-green-600">{fmtEuro(simulation.totalApres)}</span>
                  <span className="text-cockpit-secondary ml-1">
                    ({simulation.totalApres - simulation.totalAvant >= 0 ? "+" : ""}
                    {fmtEuro(simulation.totalApres - simulation.totalAvant)})
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSimulation(null)}
                  className="px-3 py-1.5 rounded-lg text-sm text-cockpit-secondary border border-cockpit hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={() => setShowModal(true)}
                  disabled={applying}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                  style={{
                    background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
                  }}
                >
                  {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  ✓ Confirmer et appliquer dans Sellsy
                </button>
              </div>
            </div>
          </div>

          {/* Tableau */}
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50 border-b border-cockpit">
                <tr>
                  {(
                    [
                      { key: "reference", label: "Référence" },
                      { key: "designation", label: "Désignation" },
                      { key: "prixAvant", label: "Prix avant (HT)" },
                      { key: "prixApres", label: "Prix après (HT)" },
                      { key: "diff", label: "Différence" },
                    ] as { key: keyof LigneTarif; label: string }[]
                  ).map(({ key, label }) => (
                    <th
                      key={key}
                      className="px-4 py-2.5 text-left text-xs font-semibold text-cockpit-secondary cursor-pointer hover:text-cockpit-primary select-none"
                      onClick={() => handleSort(key)}
                    >
                      <span className="flex items-center gap-1">
                        {label}
                        {sort.key === key ? (
                          sort.dir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                        ) : (
                          <Minus className="w-3 h-3 opacity-30" />
                        )}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedLignes.map((ligne, i) => (
                  <tr key={ligne.sellsyItemId} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                    <td className="px-4 py-2 font-mono text-xs text-cockpit-secondary">{ligne.reference}</td>
                    <td className="px-4 py-2 text-cockpit-primary max-w-[280px] truncate">{ligne.designation}</td>
                    <td className="px-4 py-2 text-right font-medium">{fmtEuro(ligne.prixAvant)}</td>
                    <td className="px-4 py-2 text-right font-medium text-green-700">{fmtEuro(ligne.prixApres)}</td>
                    <td className="px-4 py-2 text-right">
                      <span
                        className={`font-medium ${
                          ligne.diff > 0 ? "text-green-600" : ligne.diff < 0 ? "text-red-600" : "text-gray-400"
                        }`}
                      >
                        {ligne.diff > 0 ? "+" : ""}
                        {fmtEuro(ligne.diff)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Historique */}
      <div className="bg-white border border-cockpit rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-cockpit">
          <h2 className="font-semibold text-cockpit-heading text-sm">Historique des modifications</h2>
        </div>
        {histLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-cockpit-secondary" />
          </div>
        ) : historique.length === 0 ? (
          <p className="text-sm text-cockpit-secondary text-center py-8">Aucune modification enregistrée</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-cockpit">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-cockpit-secondary">Date</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-cockpit-secondary">Coeff</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-cockpit-secondary">Références</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-cockpit-secondary">Par</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-cockpit-secondary">Statut</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-cockpit-secondary">Action</th>
                </tr>
              </thead>
              <tbody>
                {historique.map((s, i) => {
                  const canRollback =
                    s.statut === "APPLIQUE" &&
                    s.appliqueLeAt &&
                    Date.now() - new Date(s.appliqueLeAt).getTime() < DELAI_ROLLBACK_MS;
                  const heuresRestantes = s.appliqueLeAt
                    ? Math.max(
                        0,
                        Math.round(
                          (DELAI_ROLLBACK_MS - (Date.now() - new Date(s.appliqueLeAt).getTime())) / 3600000
                        )
                      )
                    : 0;
                  return (
                    <tr key={s.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                      <td className="px-4 py-2.5 text-cockpit-secondary text-xs">{fmtDate(s.createdAt)}</td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`font-mono text-xs font-medium ${
                            s.coefficient > 1 ? "text-green-700" : s.coefficient < 1 ? "text-red-600" : "text-gray-500"
                          }`}
                        >
                          ×{s.coefficient} ({fmtPct(s.coefficient)})
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-cockpit-primary">{s.nbReferences}</td>
                      <td className="px-4 py-2.5 text-cockpit-secondary text-xs">
                        {s.createdBy.prenom} {s.createdBy.nom}
                      </td>
                      <td className="px-4 py-2.5">{statutBadge(s.statut, s.appliqueLeAt)}</td>
                      <td className="px-4 py-2.5">
                        {canRollback ? (
                          <button
                            onClick={() => setShowRollbackModal(s.id)}
                            disabled={cancelling}
                            className="text-xs text-red-600 hover:text-red-800 underline disabled:opacity-50"
                          >
                            Annuler ({heuresRestantes}h restantes)
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal confirmation application */}
      {showModal && simulation && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-cockpit-heading">Confirmer la mise à jour</h3>
                <p className="text-sm text-cockpit-secondary mt-1">
                  Vous allez modifier{" "}
                  <strong>{simulation.nbReferences} références</strong> dans Sellsy avec un coefficient de{" "}
                  <strong>×{simulation.coefficient}</strong> ({fmtPct(simulation.coefficient)}).
                </p>
                <p className="text-sm text-amber-700 mt-2 font-medium">
                  Un rollback sera possible pendant 24h.
                </p>
                <p className="text-sm text-cockpit-secondary mt-1">
                  Durée estimée : ~{Math.ceil(simulation.nbReferences * 0.1 / 60)} min
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg text-sm border border-cockpit text-cockpit-secondary hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleAppliquer}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)" }}
              >
                ✓ Confirmer et appliquer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmation rollback */}
      {showRollbackModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <h3 className="font-semibold text-cockpit-heading">Annuler les modifications</h3>
              </div>
              <button onClick={() => setShowRollbackModal(null)}>
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <p className="text-sm text-cockpit-secondary mb-4">
              Vous allez restaurer les prix originaux dans Sellsy. Cette opération peut prendre quelques minutes.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowRollbackModal(null)}
                className="px-4 py-2 rounded-lg text-sm border border-cockpit text-cockpit-secondary hover:bg-gray-50"
              >
                Garder les modifications
              </button>
              <button
                onClick={() => handleAnnuler(showRollbackModal)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700"
              >
                ↩ Restaurer les prix originaux
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
