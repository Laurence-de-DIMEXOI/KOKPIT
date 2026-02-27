"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

export default function ParametresPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("account");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-cockpit-heading mb-2">
          Paramètres
        </h1>
        <p className="text-cockpit-secondary">
          Gérez vos préférences et configurations
        </p>
      </div>

      <div className="border-b border-cockpit">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab("account")}
            className={`px-4 py-4 font-medium border-b-2 transition-colors ${
              activeTab === "account"
                ? "border-cockpit-yellow text-cockpit-heading"
                : "border-transparent text-cockpit-secondary hover:text-cockpit-heading"
            }`}
          >
            Mon compte
          </button>
          <button
            onClick={() => setActiveTab("integrations")}
            className={`px-4 py-4 font-medium border-b-2 transition-colors ${
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
        <form className="space-y-8">
          <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg p-12">
            <h2 className="text-lg font-bold text-cockpit-heading mb-8">
              Informations personnelles
            </h2>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-cockpit-heading mb-2">
                    Prénom
                  </label>
                  <input
                    type="text"
                    defaultValue={session?.user?.prenom || ""}
                    className="w-full px-4 py-3 border border-cockpit-input rounded-input bg-cockpit-input text-cockpit-primary focus:outline-none focus:border-cockpit-yellow"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-cockpit-heading mb-2">
                    Nom
                  </label>
                  <input
                    type="text"
                    defaultValue={session?.user?.nom || ""}
                    className="w-full px-4 py-3 border border-cockpit-input rounded-input bg-cockpit-input text-cockpit-primary focus:outline-none focus:border-cockpit-yellow"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-cockpit-heading mb-2">
                  Email
                </label>
                <input
                  type="email"
                  defaultValue={session?.user?.email || ""}
                  disabled
                  className="w-full px-4 py-3 border border-cockpit-input rounded-input bg-cockpit-dark text-cockpit-secondary cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-cockpit-heading mb-2">
                  Téléphone
                </label>
                <input
                  type="tel"
                  placeholder="+262 XXX XX XX XX"
                  className="w-full px-4 py-3 border border-cockpit-input rounded-input bg-cockpit-input text-cockpit-primary focus:outline-none focus:border-cockpit-yellow"
                />
              </div>
            </div>
          </div>
          <button
            type="submit"
            className="bg-cockpit-yellow text-cockpit-bg px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
          >
            Enregistrer les modifications
          </button>
        </form>
      )}

      {activeTab === "integrations" && (
        <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg p-12">
          <h2 className="text-lg font-bold text-cockpit-heading mb-8">
            Intégrations
          </h2>
          <p className="text-cockpit-secondary mb-8">
            Connectez vos services externes pour automatiser vos workflows.
          </p>
          <div className="space-y-4">
            <div className="border border-cockpit rounded-card p-6 flex items-center justify-between hover:bg-cockpit-dark transition-colors">
              <div>
                <h3 className="font-semibold text-cockpit-heading">Resend</h3>
                <p className="text-sm text-cockpit-secondary">Envoi d'emails</p>
              </div>
              <button className="bg-cockpit-yellow text-cockpit-bg px-4 py-2 rounded-lg font-semibold hover:opacity-90">
                Connecter
              </button>
            </div>
            <div className="border border-cockpit rounded-card p-6 flex items-center justify-between hover:bg-cockpit-dark transition-colors">
              <div>
                <h3 className="font-semibold text-cockpit-heading">Twilio</h3>
                <p className="text-sm text-cockpit-secondary">Envoi de SMS</p>
              </div>
              <button className="bg-cockpit-yellow text-cockpit-bg px-4 py-2 rounded-lg font-semibold hover:opacity-90">
                Connecter
              </button>
            </div>
            <div className="border border-cockpit rounded-card p-6 flex items-center justify-between hover:bg-cockpit-dark transition-colors">
              <div>
                <h3 className="font-semibold text-cockpit-heading">Slack</h3>
                <p className="text-sm text-cockpit-secondary">Notifications</p>
              </div>
              <button className="bg-cockpit-yellow text-cockpit-bg px-4 py-2 rounded-lg font-semibold hover:opacity-90">
                Connecter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
