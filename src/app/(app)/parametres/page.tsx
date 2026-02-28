"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

export default function ParametresPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("account");

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-cockpit-heading mb-1 sm:mb-2">
          Paramètres
        </h1>
        <p className="text-cockpit-secondary text-sm">
          Gérez vos préférences et configurations
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
        <form className="space-y-6 lg:space-y-8">
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
                    defaultValue={session?.user?.prenom || ""}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-cockpit-input rounded-input bg-cockpit-input text-cockpit-primary focus:outline-none focus:border-cockpit-yellow text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-cockpit-heading mb-2">Nom</label>
                  <input
                    type="text"
                    defaultValue={session?.user?.nom || ""}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-cockpit-input rounded-input bg-cockpit-input text-cockpit-primary focus:outline-none focus:border-cockpit-yellow text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-cockpit-heading mb-2">Email</label>
                <input
                  type="email"
                  defaultValue={session?.user?.email || ""}
                  disabled
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-cockpit-input rounded-input bg-cockpit-dark text-cockpit-secondary cursor-not-allowed text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-cockpit-heading mb-2">Téléphone</label>
                <input
                  type="tel"
                  placeholder="+262 XXX XX XX XX"
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-cockpit-input rounded-input bg-cockpit-input text-cockpit-primary focus:outline-none focus:border-cockpit-yellow text-sm"
                />
              </div>
            </div>
          </div>
          <button
            type="submit"
            className="bg-cockpit-yellow text-cockpit-bg px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity text-sm sm:text-base w-full sm:w-auto"
          >
            Enregistrer les modifications
          </button>
        </form>
      )}

      {activeTab === "integrations" && (
        <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg p-4 sm:p-6 lg:p-12">
          <h2 className="text-base sm:text-lg font-bold text-cockpit-heading mb-4 sm:mb-8">
            Intégrations
          </h2>
          <p className="text-cockpit-secondary text-sm mb-4 sm:mb-8">
            Connectez vos services externes pour automatiser vos workflows.
          </p>
          <div className="space-y-3 sm:space-y-4">
            {[
              { name: "Resend", desc: "Envoi d'emails" },
              { name: "Twilio", desc: "Envoi de SMS" },
              { name: "Slack", desc: "Notifications" },
              { name: "Sellsy", desc: "CRM & Facturation" },
            ].map((service) => (
              <div key={service.name} className="border border-cockpit rounded-card p-4 sm:p-6 flex items-center justify-between hover:bg-cockpit-dark transition-colors gap-3">
                <div className="min-w-0">
                  <h3 className="font-semibold text-cockpit-heading text-sm sm:text-base">{service.name}</h3>
                  <p className="text-xs sm:text-sm text-cockpit-secondary">{service.desc}</p>
                </div>
                <button className="bg-cockpit-yellow text-cockpit-bg px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold hover:opacity-90 text-xs sm:text-sm flex-shrink-0">
                  Connecter
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
