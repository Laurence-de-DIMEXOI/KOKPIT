"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { useSession } from "next-auth/react";
import {
  Calculator,
  Save,
  Loader2,
  Plus,
  Trash2,
  Copy,
  Download,
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

const formatEUR = (n: number) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);

// ============================================================================
// TYPES
// ============================================================================

interface ConfigCalculateur {
  changeIndo: number;
  coeffRevient: number;
  coeffMarge: number;
}

interface MultiRow {
  id: string;
  base: number | "";
}

interface CalcResult {
  minimum: number;
  affiche: number;
  arrondi: number;
  cuisine: number;
}

// ============================================================================
// HELPERS
// ============================================================================

function calcPrix(
  base: number,
  changeIndo: number,
  coeffRevient: number,
  coeffMarge: number
): CalcResult {
  if (!base || !changeIndo) {
    return { minimum: 0, affiche: 0, arrondi: 0, cuisine: 0 };
  }
  const minimum = (base / changeIndo) * coeffRevient * coeffMarge * 1.085 * 1.2;
  const affiche = minimum * 1.2;
  const arrondi = Math.round(affiche / 10) * 10 - 1;
  const cuisine = Math.round((affiche * 1.35) / 10) * 10;
  return { minimum, affiche, arrondi, cuisine };
}

// ============================================================================
// PAGE
// ============================================================================

export default function CalculateurPage() {
  const { data: session } = useSession();
  const { addToast } = useToast();
  const userRole = (session?.user as { role?: string } | undefined)?.role;
  const canEdit = userRole === "ACHAT" || userRole === "ADMIN";

  // --- Config state ---
  const [config, setConfig] = useState<ConfigCalculateur>({
    changeIndo: 17000,
    coeffRevient: 2.5,
    coeffMarge: 1.8,
  });
  const [configLoading, setConfigLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // --- Simple calc state ---
  const [baseSimple, setBaseSimple] = useState<number | "">("");

  // --- Ajouter à une demande ---
  const [showAddToDemande, setShowAddToDemande] = useState(false);
  const [demandes, setDemandes] = useState<{ id: string; reference: string; denomination: string; nomClient: string | null }[]>([]);
  const [selectedDemande, setSelectedDemande] = useState("");
  const [selectedTypePrix, setSelectedTypePrix] = useState<"ARRONDI" | "CUISINE">("ARRONDI");
  const [addingToDemande, setAddingToDemande] = useState(false);

  // --- Multi calc state ---
  const [rows, setRows] = useState<MultiRow[]>([
    { id: crypto.randomUUID(), base: "" },
  ]);

  // ========================================================================
  // LOAD CONFIG
  // ========================================================================

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch("/api/achat/config-calculateur");
      if (res.ok) {
        const data = await res.json();
        setConfig({
          changeIndo: data.changeIndo ?? 17000,
          coeffRevient: data.coeffRevient ?? 2.5,
          coeffMarge: data.coeffMarge ?? 1.8,
        });
      }
    } catch (err) {
      console.error("Erreur chargement config:", err);
    } finally {
      setConfigLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // ========================================================================
  // SAVE CONFIG
  // ========================================================================

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/achat/config-calculateur", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        addToast("Paramètres enregistrés avec succès", "success");
      } else {
        const d = await res.json();
        addToast(d.error || "Erreur lors de la sauvegarde", "error");
      }
    } catch {
      addToast("Erreur de connexion", "error");
    }
    setSaving(false);
  };

  // ========================================================================
  // AJOUTER À UNE DEMANDE
  // ========================================================================

  useEffect(() => {
    if (showAddToDemande && demandes.length === 0) {
      fetch("/api/achat/need-price?statut=DEMANDE&limit=100")
        .then((r) => r.json())
        .then((data) => setDemandes(data.items || []))
        .catch(() => {});
    }
  }, [showAddToDemande]);

  const handleAddToDemande = async () => {
    if (!selectedDemande || !simpleResult) return;
    setAddingToDemande(true);
    const prix = selectedTypePrix === "ARRONDI" ? simpleResult.arrondi : simpleResult.cuisine;
    try {
      const res = await fetch(`/api/achat/need-price/${selectedDemande}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prixFournisseur: typeof baseSimple === "number" ? baseSimple : 0,
          prixVente: prix,
          typePrix: selectedTypePrix,
          statut: "PRIX_RECU",
        }),
      });
      if (res.ok) {
        addToast(`Prix ${formatEUR(prix)} ajouté à la demande`, "success");
        setShowAddToDemande(false);
        setSelectedDemande("");
        setDemandes([]);
      } else {
        addToast("Erreur lors de l'ajout", "error");
      }
    } catch {
      addToast("Erreur de connexion", "error");
    }
    setAddingToDemande(false);
  };

  // ========================================================================
  // SIMPLE CALC
  // ========================================================================

  const simpleResult = useMemo(() => {
    if (baseSimple === "" || baseSimple === 0) return null;
    return calcPrix(baseSimple, config.changeIndo, config.coeffRevient, config.coeffMarge);
  }, [baseSimple, config]);

  // ========================================================================
  // MULTI CALC
  // ========================================================================

  const multiResults = useMemo(() => {
    return rows.map((row) => {
      if (row.base === "" || row.base === 0) return null;
      return calcPrix(row.base, config.changeIndo, config.coeffRevient, config.coeffMarge);
    });
  }, [rows, config]);

  const addRow = () => {
    setRows((prev) => [...prev, { id: crypto.randomUUID(), base: "" }]);
  };

  const removeRow = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const updateRowBase = (id: string, value: number | "") => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, base: value } : r))
    );
  };

  // ========================================================================
  // COPY / EXPORT
  // ========================================================================

  const handleCopyTable = () => {
    const header = "Base (IDR)\tMinimum\tAffiché\tArrondi\tCuisine";
    const lines = rows
      .map((row, i) => {
        const r = multiResults[i];
        const base = row.base === "" ? "" : String(row.base);
        if (!r) return `${base}\t—\t—\t—\t—`;
        return `${base}\t${formatEUR(r.minimum)}\t${formatEUR(r.affiche)}\t${formatEUR(r.arrondi)}\t${formatEUR(r.cuisine)}`;
      })
      .join("\n");
    navigator.clipboard.writeText(`${header}\n${lines}`);
    addToast("Tableau copié dans le presse-papiers", "success");
  };

  const handleExportCSV = () => {
    const header = "Base (IDR);Minimum;Affiché;Arrondi;Cuisine";
    const lines = rows
      .map((row, i) => {
        const r = multiResults[i];
        const base = row.base === "" ? "" : String(row.base);
        if (!r) return `${base};—;—;—;—`;
        return `${base};${formatEUR(r.minimum)};${formatEUR(r.affiche)};${formatEUR(r.arrondi)};${formatEUR(r.cuisine)}`;
      })
      .join("\n");
    const csv = `${header}\n${lines}`;
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `calculateur-prix-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addToast("Fichier CSV téléchargé", "success");
  };

  // ========================================================================
  // KPI CARD (simple calc)
  // ========================================================================

  const KpiCard = ({ label, value }: { label: string; value: string }) => (
    <div className="bg-cockpit-card border border-cockpit rounded-xl p-4 text-center">
      <p className="text-xs font-medium text-cockpit-secondary mb-1">{label}</p>
      <p
        className="text-xl sm:text-2xl font-bold"
        style={{ color: "var(--color-active)" }}
      >
        {value}
      </p>
    </div>
  );

  // ========================================================================
  // RENDER
  // ========================================================================

  // Role gate: only ACHAT and ADMIN can access
  if (!canEdit) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Calculator className="w-12 h-12 text-cockpit-secondary mx-auto opacity-40" />
          <h2 className="text-lg font-semibold text-cockpit-heading">
            Accès réservé au service Achat
          </h2>
          <p className="text-sm text-cockpit-secondary">
            Vous n&apos;avez pas les permissions nécessaires pour accéder au calculateur.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* ================================================================ */}
      {/* HEADER                                                          */}
      {/* ================================================================ */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: `linear-gradient(135deg, ${ACHAT_GRADIENT.from}, ${ACHAT_GRADIENT.to})`,
            boxShadow: `0 4px 14px ${ACHAT_GRADIENT.shadow}`,
          }}
        >
          <Calculator className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-cockpit-primary">
            Calculateur de prix
          </h1>
          <p className="text-xs sm:text-sm text-cockpit-secondary">
            Calcul des tarifs depuis les bases fournisseur
          </p>
        </div>
      </div>

      {/* ================================================================ */}
      {/* SECTION 1 - Paramètres globaux                                  */}
      {/* ================================================================ */}
      {canEdit && (
        <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg p-5">
          <h2 className="text-sm font-semibold text-cockpit-heading mb-4">
            Paramètres globaux
          </h2>

          {configLoading ? (
            <div className="flex items-center gap-2 text-cockpit-secondary text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Chargement des paramètres...
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                {/* Change Indo */}
                <div>
                  <label className="block text-xs font-medium text-cockpit-secondary mb-1.5">
                    Change Indo
                  </label>
                  <input
                    type="number"
                    value={config.changeIndo}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        changeIndo: Number(e.target.value),
                      }))
                    }
                    className="w-full bg-cockpit-dark border border-cockpit rounded-lg px-3 py-2.5 text-sm text-cockpit-primary focus:outline-none focus:ring-2 focus:ring-[var(--color-active)]/40"
                  />
                </div>

                {/* Coeff revient */}
                <div>
                  <label className="block text-xs font-medium text-cockpit-secondary mb-1.5">
                    Coeff revient
                  </label>
                  <input
                    type="number"
                    step={0.1}
                    value={config.coeffRevient}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        coeffRevient: Number(e.target.value),
                      }))
                    }
                    className="w-full bg-cockpit-dark border border-cockpit rounded-lg px-3 py-2.5 text-sm text-cockpit-primary focus:outline-none focus:ring-2 focus:ring-[var(--color-active)]/40"
                  />
                </div>

                {/* Coeff marge */}
                <div>
                  <label className="block text-xs font-medium text-cockpit-secondary mb-1.5">
                    Coeff marge
                  </label>
                  <input
                    type="number"
                    step={0.1}
                    value={config.coeffMarge}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        coeffMarge: Number(e.target.value),
                      }))
                    }
                    className="w-full bg-cockpit-dark border border-cockpit rounded-lg px-3 py-2.5 text-sm text-cockpit-primary focus:outline-none focus:ring-2 focus:ring-[var(--color-active)]/40"
                  />
                </div>
              </div>

              <button
                onClick={handleSaveConfig}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{
                  background: `linear-gradient(135deg, ${ACHAT_GRADIENT.from}, ${ACHAT_GRADIENT.to})`,
                  boxShadow: `0 4px 14px ${ACHAT_GRADIENT.shadow}`,
                }}
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Enregistrer
              </button>
            </>
          )}
        </div>
      )}

      {/* ================================================================ */}
      {/* SECTION 2 - Calcul simple                                       */}
      {/* ================================================================ */}
      <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg p-5">
        <h2 className="text-sm font-semibold text-cockpit-heading mb-4">
          Calcul simple
        </h2>

        <div className="mb-5">
          <label className="block text-xs font-medium text-cockpit-secondary mb-1.5">
            Base fournisseur (IDR)
          </label>
          <input
            type="number"
            value={baseSimple}
            onChange={(e) =>
              setBaseSimple(e.target.value === "" ? "" : Number(e.target.value))
            }
            placeholder="Saisir le prix de base en IDR"
            className="w-full sm:w-80 bg-cockpit-dark border border-cockpit rounded-lg px-4 py-3 text-lg text-cockpit-primary placeholder:text-cockpit-secondary focus:outline-none focus:ring-2 focus:ring-[var(--color-active)]/40 font-mono"
          />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <KpiCard
            label="Tarif minimum"
            value={simpleResult ? formatEUR(simpleResult.minimum) : "—"}
          />
          <KpiCard
            label="Tarif affiché"
            value={simpleResult ? formatEUR(simpleResult.affiche) : "—"}
          />
          <KpiCard
            label="Arrondi"
            value={simpleResult ? formatEUR(simpleResult.arrondi) : "—"}
          />
          <KpiCard
            label="Cuisine"
            value={simpleResult ? formatEUR(simpleResult.cuisine) : "—"}
          />
        </div>

        {/* Bouton ajouter à une demande */}
        {simpleResult && typeof baseSimple === "number" && baseSimple > 0 && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setShowAddToDemande(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90"
              style={{ background: `linear-gradient(135deg, ${ACHAT_GRADIENT.from}, ${ACHAT_GRADIENT.to})` }}
            >
              <Plus className="w-4 h-4" />
              Ajouter à une demande
            </button>
          </div>
        )}
      </div>

      {/* ================================================================ */}
      {/* SECTION 3 - Calcul multiple                                     */}
      {/* ================================================================ */}
      <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 className="text-sm font-semibold text-cockpit-heading">
            Calcul multiple
          </h2>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleCopyTable}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-cockpit text-cockpit-secondary hover:text-cockpit-primary hover:border-[var(--color-active)]/30 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              Copier le tableau
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-cockpit text-cockpit-secondary hover:text-cockpit-primary hover:border-[var(--color-active)]/30 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Exporter CSV
            </button>
            <button
              onClick={addRow}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90"
              style={{
                background: `linear-gradient(135deg, ${ACHAT_GRADIENT.from}, ${ACHAT_GRADIENT.to})`,
                boxShadow: `0 4px 14px ${ACHAT_GRADIENT.shadow}`,
              }}
            >
              <Plus className="w-3.5 h-3.5" />
              Ajouter une ligne
            </button>
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-cockpit">
                <th className="text-left text-xs font-semibold text-cockpit-secondary uppercase tracking-wider p-3">
                  Base (IDR)
                </th>
                <th className="text-right text-xs font-semibold text-cockpit-secondary uppercase tracking-wider p-3">
                  Minimum
                </th>
                <th className="text-right text-xs font-semibold text-cockpit-secondary uppercase tracking-wider p-3">
                  Affiché
                </th>
                <th className="text-right text-xs font-semibold text-cockpit-secondary uppercase tracking-wider p-3">
                  Arrondi
                </th>
                <th className="text-right text-xs font-semibold text-cockpit-secondary uppercase tracking-wider p-3">
                  Cuisine
                </th>
                <th className="w-10 p-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-cockpit">
              {rows.map((row, i) => {
                const r = multiResults[i];
                return (
                  <tr key={row.id} className="hover:bg-cockpit-dark/50 transition-colors">
                    <td className="p-3">
                      <input
                        type="number"
                        value={row.base}
                        onChange={(e) =>
                          updateRowBase(
                            row.id,
                            e.target.value === "" ? "" : Number(e.target.value)
                          )
                        }
                        placeholder="0"
                        className="w-full bg-cockpit-dark border border-cockpit rounded-lg px-3 py-2 text-sm text-cockpit-primary font-mono placeholder:text-cockpit-secondary focus:outline-none focus:ring-2 focus:ring-[var(--color-active)]/40"
                      />
                    </td>
                    <td className="p-3 text-right text-sm font-semibold text-cockpit-heading">
                      {r ? formatEUR(r.minimum) : "—"}
                    </td>
                    <td className="p-3 text-right text-sm font-semibold text-cockpit-heading">
                      {r ? formatEUR(r.affiche) : "—"}
                    </td>
                    <td
                      className="p-3 text-right text-sm font-bold"
                      style={{ color: "var(--color-active)" }}
                    >
                      {r ? formatEUR(r.arrondi) : "—"}
                    </td>
                    <td className="p-3 text-right text-sm font-semibold text-cockpit-heading">
                      {r ? formatEUR(r.cuisine) : "—"}
                    </td>
                    <td className="p-3">
                      {rows.length > 1 && (
                        <button
                          onClick={() => removeRow(row.id)}
                          className="p-1.5 rounded hover:bg-red-500/10 text-cockpit-secondary hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-3">
          {rows.map((row, i) => {
            const r = multiResults[i];
            return (
              <div
                key={row.id}
                className="bg-cockpit-dark/50 rounded-lg border border-cockpit p-4 space-y-3"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={row.base}
                    onChange={(e) =>
                      updateRowBase(
                        row.id,
                        e.target.value === "" ? "" : Number(e.target.value)
                      )
                    }
                    placeholder="Base IDR"
                    className="flex-1 bg-cockpit-dark border border-cockpit rounded-lg px-3 py-2 text-sm text-cockpit-primary font-mono placeholder:text-cockpit-secondary focus:outline-none focus:ring-2 focus:ring-[var(--color-active)]/40"
                  />
                  {rows.length > 1 && (
                    <button
                      onClick={() => removeRow(row.id)}
                      className="p-1.5 rounded hover:bg-red-500/10 text-cockpit-secondary hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-cockpit-secondary">Minimum</span>
                    <p className="font-semibold text-cockpit-heading">
                      {r ? formatEUR(r.minimum) : "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-cockpit-secondary">Affiché</span>
                    <p className="font-semibold text-cockpit-heading">
                      {r ? formatEUR(r.affiche) : "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-cockpit-secondary">Arrondi</span>
                    <p className="font-bold" style={{ color: "var(--color-active)" }}>
                      {r ? formatEUR(r.arrondi) : "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-cockpit-secondary">Cuisine</span>
                    <p className="font-semibold text-cockpit-heading">
                      {r ? formatEUR(r.cuisine) : "—"}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* ================================================================ */}
      {/* MODALE - Ajouter à une demande                                */}
      {/* ================================================================ */}
      {showAddToDemande && simpleResult && typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setShowAddToDemande(false)}
          >
            <div
              className="bg-cockpit-card border border-cockpit rounded-card shadow-cockpit-lg w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="px-5 py-4 border-b border-cockpit"
                style={{ background: `linear-gradient(135deg, ${ACHAT_GRADIENT.from}, ${ACHAT_GRADIENT.to})` }}
              >
                <h3 className="text-white font-semibold">Ajouter le prix à une demande</h3>
              </div>
              <div className="p-5 space-y-4">
                {/* Sélection demande */}
                <div>
                  <label className="block text-xs font-medium text-cockpit-secondary mb-1.5">
                    Demande Need Price
                  </label>
                  <select
                    value={selectedDemande}
                    onChange={(e) => setSelectedDemande(e.target.value)}
                    className="w-full bg-cockpit-dark border border-cockpit rounded-lg px-3 py-2.5 text-sm text-cockpit-primary focus:outline-none"
                  >
                    <option value="">Sélectionner une demande...</option>
                    {demandes.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.reference} — {d.denomination} {d.nomClient ? `(${d.nomClient})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Choix type prix */}
                <div>
                  <label className="block text-xs font-medium text-cockpit-secondary mb-1.5">
                    Type de prix
                  </label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setSelectedTypePrix("ARRONDI")}
                      className={`flex-1 px-4 py-3 rounded-lg border-2 text-center transition-all ${
                        selectedTypePrix === "ARRONDI"
                          ? "border-[var(--color-active)] bg-[var(--color-active)]/10"
                          : "border-cockpit hover:border-[var(--color-active)]/50"
                      }`}
                    >
                      <p className="text-xs text-cockpit-secondary">Arrondi</p>
                      <p className="text-lg font-bold text-cockpit-heading">{formatEUR(simpleResult.arrondi)}</p>
                    </button>
                    <button
                      onClick={() => setSelectedTypePrix("CUISINE")}
                      className={`flex-1 px-4 py-3 rounded-lg border-2 text-center transition-all ${
                        selectedTypePrix === "CUISINE"
                          ? "border-[var(--color-active)] bg-[var(--color-active)]/10"
                          : "border-cockpit hover:border-[var(--color-active)]/50"
                      }`}
                    >
                      <p className="text-xs text-cockpit-secondary">Cuisine</p>
                      <p className="text-lg font-bold text-cockpit-heading">{formatEUR(simpleResult.cuisine)}</p>
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-cockpit">
                <button
                  onClick={() => setShowAddToDemande(false)}
                  className="px-4 py-2 text-sm text-cockpit-secondary hover:text-cockpit-primary"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddToDemande}
                  disabled={!selectedDemande || addingToDemande}
                  className="px-4 py-2 text-sm font-medium rounded-lg text-white hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                  style={{ background: `linear-gradient(135deg, ${ACHAT_GRADIENT.from}, ${ACHAT_GRADIENT.to})` }}
                >
                  {addingToDemande && <Loader2 className="w-4 h-4 animate-spin" />}
                  Ajouter le prix
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
