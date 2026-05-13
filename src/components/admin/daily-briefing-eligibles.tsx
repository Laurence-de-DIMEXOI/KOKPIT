"use client";

import { useEffect, useState, useCallback } from "react";
import { Sunrise, Loader2 } from "lucide-react";

interface EligibleUser {
  id: string;
  nom: string;
  prenom: string;
  role: string;
  email: string;
  dailyBriefingEligible: boolean;
}

/**
 * Section admin pour gérer les utilisateurs éligibles au Daily Briefing.
 * À inclure dans `/administration/parametres`.
 */
export function DailyBriefingEligibles() {
  const [users, setUsers] = useState<EligibleUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/daily-briefing-eligible");
      if (res.ok) {
        const json = await res.json();
        setUsers(json.users || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = async (userId: string, eligible: boolean) => {
    setSaving(userId);
    // Optimistic update
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, dailyBriefingEligible: eligible } : u
      )
    );
    try {
      const res = await fetch("/api/admin/daily-briefing-eligible", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, eligible }),
      });
      if (!res.ok) throw new Error("save failed");
    } catch {
      // Rollback
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, dailyBriefingEligible: !eligible } : u
        )
      );
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="bg-cockpit-card rounded-xl border border-cockpit shadow-cockpit-lg p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Sunrise className="w-5 h-5 text-yellow-500" />
        <h3 className="text-base font-bold text-cockpit-heading">
          Daily Briefing — Utilisateurs éligibles
        </h3>
      </div>
      <p className="text-xs text-cockpit-secondary mb-4">
        Les commerciaux cochés verront la page <code>/aujourd-hui</code> dans
        leur sidebar (vue filtrée sur leurs leads/devis/ventes/tâches).
        ADMIN/DIRECTION/MARKETING y ont accès en mode agrégé avec toggle.
      </p>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-cockpit-secondary">
          <Loader2 className="w-4 h-4 animate-spin" /> Chargement…
        </div>
      ) : users.length === 0 ? (
        <p className="text-sm text-cockpit-secondary">
          Aucun utilisateur COMMERCIAL/MARKETING actif.
        </p>
      ) : (
        <ul className="divide-y divide-cockpit">
          {users.map((u) => (
            <li
              key={u.id}
              className="flex items-center justify-between py-2.5"
            >
              <div>
                <div className="text-sm font-semibold text-cockpit-primary">
                  {u.prenom} {u.nom}
                </div>
                <div className="text-xs text-cockpit-secondary">
                  {u.role} · {u.email}
                </div>
              </div>
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={u.dailyBriefingEligible}
                  disabled={saving === u.id}
                  onChange={(e) => toggle(u.id, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="relative w-10 h-5 bg-cockpit-dark rounded-full peer peer-checked:bg-yellow-500 peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
