"use client";

import { useState, useEffect, useCallback } from "react";
import { Target, Pencil, Check, X, Loader2 } from "lucide-react";
import clsx from "clsx";

function formatCurrency(amount: number): string {
  return amount.toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

const MONTH_NAMES = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

interface SalesObjectiveProps {
  currentAmount: number; // CA commandes réalisé sur le mois en cours
}

export function SalesObjective({ currentAmount }: SalesObjectiveProps) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const [objective, setObjective] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchObjective = useCallback(async () => {
    try {
      const res = await fetch(`/api/commercial/objectifs?month=${month}&year=${year}`);
      const data = await res.json();
      if (data.success && data.objectif) {
        setObjective(data.objectif.amount);
      }
    } catch (err) {
      console.error("Erreur fetch objectif:", err);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    fetchObjective();
  }, [fetchObjective]);

  const saveObjective = async () => {
    const amount = parseFloat(editValue.replace(/\s/g, "").replace(",", "."));
    if (isNaN(amount) || amount <= 0) return;

    setSaving(true);
    try {
      const res = await fetch("/api/commercial/objectifs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month, year, amount }),
      });
      const data = await res.json();
      if (data.success) {
        setObjective(data.objectif.amount);
        setEditing(false);
      }
    } catch (err) {
      console.error("Erreur save objectif:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg p-4 sm:p-6">
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-cockpit-info" />
        </div>
      </div>
    );
  }

  const progress = objective ? Math.min((currentAmount / objective) * 100, 100) : 0;
  const progressColor =
    progress >= 80
      ? "bg-cockpit-success"
      : progress >= 50
        ? "bg-cockpit-warning"
        : "bg-cockpit-danger";
  const progressTextColor =
    progress >= 80
      ? "text-cockpit-success"
      : progress >= 50
        ? "text-cockpit-warning"
        : "text-cockpit-danger";

  // Jours restants dans le mois
  const daysInMonth = new Date(year, month, 0).getDate();
  const dayOfMonth = now.getDate();
  const daysLeft = daysInMonth - dayOfMonth;

  return (
    <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cockpit-yellow/10 flex items-center justify-center">
            <Target className="w-5 h-5 text-cockpit-yellow" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-cockpit-heading">
              Objectif {MONTH_NAMES[month - 1]} {year}
            </h3>
            <p className="text-xs text-cockpit-secondary">
              {daysLeft} jour{daysLeft > 1 ? "s" : ""} restant{daysLeft > 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {!editing && objective !== null && (
          <button
            onClick={() => {
              setEditValue(String(Math.round(objective)));
              setEditing(true);
            }}
            className="text-cockpit-secondary hover:text-cockpit-primary transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </button>
        )}
      </div>

      {objective === null && !editing ? (
        <div className="text-center py-3">
          <p className="text-sm text-cockpit-secondary mb-3">
            Aucun objectif défini pour ce mois
          </p>
          <button
            onClick={() => {
              setEditValue("50000");
              setEditing(true);
            }}
            className="px-4 py-2 bg-cockpit-info/15 text-cockpit-info rounded-lg text-sm font-semibold hover:bg-cockpit-info/25 transition-colors"
          >
            Définir un objectif
          </button>
        </div>
      ) : editing ? (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder="Ex: 50000"
            className="flex-1 px-3 py-2 rounded-lg border border-cockpit-input bg-cockpit-input text-sm text-cockpit-primary focus:outline-none focus:border-cockpit-info"
            onKeyDown={(e) => e.key === "Enter" && saveObjective()}
            autoFocus
          />
          <span className="text-xs text-cockpit-secondary">€ HT</span>
          <button
            onClick={saveObjective}
            disabled={saving}
            className="p-2 text-cockpit-success hover:bg-cockpit-success/10 rounded-lg transition-colors"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => setEditing(false)}
            className="p-2 text-cockpit-secondary hover:bg-cockpit-dark rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-2xl sm:text-3xl font-bold text-cockpit-heading">
              {formatCurrency(currentAmount)}
            </span>
            <span className="text-sm text-cockpit-secondary">
              / {formatCurrency(objective!)}
            </span>
          </div>

          {/* Barre de progression */}
          <div className="w-full h-3 bg-cockpit-dark rounded-full overflow-hidden mb-2">
            <div
              className={clsx("h-full rounded-full transition-all duration-700", progressColor)}
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className={clsx("text-sm font-bold", progressTextColor)}>
              {Math.round(progress)}%
            </span>
            {objective && currentAmount < objective && daysLeft > 0 && (
              <span className="text-xs text-cockpit-secondary">
                {formatCurrency(Math.ceil((objective - currentAmount) / daysLeft))}/jour nécessaire
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
