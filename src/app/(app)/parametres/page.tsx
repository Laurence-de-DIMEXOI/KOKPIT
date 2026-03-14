"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Save, Loader2, CheckCircle, Lock } from "lucide-react";

const integrations = [
  {
    name: "Sellsy",
    desc: "CRM & Facturation — Devis, commandes, contacts",
    envKey: "SELLSY_CLIENT_ID",
    connected: true,
  },
  {
    name: "Brevo",
    desc: "Emails transactionnels — Notifications demandes",
    envKey: "BREVO_API_KEY",
    connected: true,
  },
  {
    name: "Open-Meteo",
    desc: "Météo locale — Ambiance visuelle La Réunion",
    envKey: null,
    connected: true,
  },
  {
    name: "Supabase",
    desc: "Base de données PostgreSQL",
    envKey: "DATABASE_URL",
    connected: true,
  },
  {
    name: "Vercel",
    desc: "Hébergement & Déploiement — Plan Hobby",
    envKey: null,
    connected: true,
  },
  {
    name: "NextAuth",
    desc: "Authentification — Sessions sécurisées",
    envKey: "NEXTAUTH_SECRET",
    connected: true,
  },
  {
    name: "Meta Ads",
    desc: "Suivi campagnes publicitaires Facebook / Instagram",
    envKey: "META_ACCESS_TOKEN",
    connected: true,
  },
  {
    name: "Google Sheets",
    desc: "Import données Google Ads",
    envKey: "GOOGLE_ADS_SHEET_ID",
    connected: true,
  },
];

export default function ParametresPage() {
  const { data: session, update: updateSession } = useSession();
  const [activeTab, setActiveTab] = useState("account");
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (session?.user) {
      setPrenom(session.user.prenom || "");
      setNom(session.user.nom || "");
    }
  }, [session?.user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prenom.trim() || !nom.trim()) {
      setError("Prénom et nom obligatoires");
      return;
    }
    setSaving(true);
    setError("");
    setSaved(false);

    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prenom: prenom.trim(), nom: nom.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erreur lors de la sauvegarde");
        return;
      }
      setSaved(true);
      // Rafraîchir la session pour refléter le changement dans la topbar
      await updateSession();
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Erreur de connexion");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-cockpit-heading mb-1 sm:mb-2">
          Mon Profil
        </h1>
        <p className="text-cockpit-secondary text-sm">
          Gérez vos informations personnelles et vos intégrations
        </p>
      </div>

      <div className="border-b border-cockpit overflow-x-auto">
        <div className="flex gap-4 sm:gap-8 min-w-max">
          <button
            onClick={() => setActiveTab("account")}
            className={`px-3 sm:px-4 py-3 sm:py-4 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "account"
                ? "border-cockpit-yellow text-cockpit-heading"
                : "border-transparent text-cockpit-secondary hover:text-cockpit-heading"
            }`}
          >
            Mon compte
          </button>
          <button
            onClick={() => setActiveTab("integrations")}
            className={`px-3 sm:px-4 py-3 sm:py-4 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "integrations"
                ? "border-cockpit-yellow text-cockpit-heading"
                : "border-transparent text-cockpit-secondary hover:text-cockpit-heading"
            }`}
          >
            Intégrations
          </button>
        </div>
      </div>

      {activeTab === "account" && (
        <form onSubmit={handleSave} className="space-y-6 lg:space-y-8">
          <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg p-4 sm:p-6 lg:p-12">
            <h2 className="text-base sm:text-lg font-bold text-cockpit-heading mb-4 sm:mb-8">
              Informations personnelles
            </h2>
            <div className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-semibold text-cockpit-heading mb-2">Prénom</label>
                  <input
                    type="text"
                    value={prenom}
                    onChange={(e) => setPrenom(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-cockpit-input rounded-input bg-cockpit-input text-cockpit-primary focus:outline-none focus:border-cockpit-yellow text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-cockpit-heading mb-2">Nom</label>
                  <input
                    type="text"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-cockpit-input rounded-input bg-cockpit-input text-cockpit-primary focus:outline-none focus:border-cockpit-yellow text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-cockpit-heading mb-2">
                  Email
                  <Lock className="w-3 h-3 inline ml-1.5 text-cockpit-secondary" />
                </label>
                <input
                  type="email"
                  defaultValue={session?.user?.email || ""}
                  disabled
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-cockpit-input rounded-input bg-cockpit-dark text-cockpit-secondary cursor-not-allowed text-sm"
                />
                <p className="text-xs text-cockpit-secondary mt-1">L&apos;email ne peut pas être modifié</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-cockpit-heading mb-2">Rôle</label>
                <input
                  type="text"
                  defaultValue={session?.user?.role || ""}
                  disabled
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-cockpit-input rounded-input bg-cockpit-dark text-cockpit-secondary cursor-not-allowed text-sm"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="bg-cockpit-yellow text-cockpit-bg px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity text-sm sm:text-base flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Enregistrer
            </button>
            {saved && (
              <span className="text-sm text-green-600 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                Modifications enregistrées
              </span>
            )}
          </div>
        </form>
      )}

      {activeTab === "integrations" && (
        <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg p-4 sm:p-6 lg:p-12">
          <h2 className="text-base sm:text-lg font-bold text-cockpit-heading mb-4 sm:mb-8">
            Intégrations actives
          </h2>
          <p className="text-cockpit-secondary text-sm mb-4 sm:mb-8">
            Services connectés à votre instance KOKPIT.
          </p>
          <div className="space-y-3 sm:space-y-4">
            {integrations.map((service) => (
              <div
                key={service.name}
                className="border border-cockpit rounded-card p-4 sm:p-6 flex items-center justify-between hover:bg-cockpit-dark transition-colors gap-3"
              >
                <div className="min-w-0">
                  <h3 className="font-semibold text-cockpit-heading text-sm sm:text-base">
                    {service.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-cockpit-secondary">
                    {service.desc}
                  </p>
                </div>
                <span
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 ${
                    service.connected
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "bg-gray-50 text-gray-500 border border-gray-200"
                  }`}
                >
                  {service.connected ? "✓ Connecté" : "Non connecté"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
