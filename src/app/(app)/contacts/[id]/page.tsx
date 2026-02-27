"use client";

import { useState } from "react";
import { contactsData } from "@/data/contacts";
import { contactDetailsData } from "@/data/contact-details";
import { ArrowLeft, CheckCircle2, Circle } from "lucide-react";
import Link from "next/link";

interface ContactDetailsPageProps {
  params: { id: string };
}

export default function ContactDetailsPage({ params }: ContactDetailsPageProps) {
  const contact = contactsData.find(c => c.id === params.id);
  const details = contact ? contactDetailsData[contact.email] : null;

  if (!contact) {
    return (
      <div className="space-y-4">
        <Link href="/contacts" className="flex items-center gap-2 text-cockpit-yellow hover:opacity-80">
          <ArrowLeft className="w-5 h-5" /> Retour aux contacts
        </Link>
        <div className="text-center py-12">
          <p className="text-cockpit-secondary">Contact non trouvé</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Link href="/contacts" className="flex items-center gap-2 text-cockpit-yellow hover:opacity-80">
        <ArrowLeft className="w-5 h-5" /> Retour aux contacts
      </Link>

      <div>
        <h1 className="text-4xl font-bold text-cockpit-heading mb-2">{contact.nom}</h1>
        <p className="text-cockpit-secondary">{contact.demandes} demande{contact.demandes > 1 ? 's' : ''} de prix</p>
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg p-8">
          <h2 className="text-lg font-bold text-cockpit-heading mb-6">Informations personnelles</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-cockpit-secondary">Email</label>
              <p className="text-cockpit-primary break-all">{contact.email}</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-cockpit-secondary">Téléphone</label>
              <p className="text-cockpit-primary">{contact.telephone || "-"}</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-cockpit-secondary">Showroom</label>
              <p className="text-cockpit-primary">{contact.showroom}</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-cockpit-secondary">Stage</label>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-cockpit-info/10 text-cockpit-info mt-2">
                {contact.stage}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg p-8">
          <h2 className="text-lg font-bold text-cockpit-heading mb-6">Consentements</h2>
          {details?.consents ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {details.consents.offre ? (
                  <CheckCircle2 className="w-5 h-5 text-cockpit-success" />
                ) : (
                  <Circle className="w-5 h-5 text-cockpit-secondary" />
                )}
                <span className={details.consents.offre ? "text-cockpit-primary" : "text-cockpit-secondary"}>Offre</span>
              </div>
              <div className="flex items-center gap-3">
                {details.consents.newsletter ? (
                  <CheckCircle2 className="w-5 h-5 text-cockpit-success" />
                ) : (
                  <Circle className="w-5 h-5 text-cockpit-secondary" />
                )}
                <span className={details.consents.newsletter ? "text-cockpit-primary" : "text-cockpit-secondary"}>Newsletter</span>
              </div>
              <div className="flex items-center gap-3">
                {details.consents.invitation ? (
                  <CheckCircle2 className="w-5 h-5 text-cockpit-success" />
                ) : (
                  <Circle className="w-5 h-5 text-cockpit-secondary" />
                )}
                <span className={details.consents.invitation ? "text-cockpit-primary" : "text-cockpit-secondary"}>Invitation</span>
              </div>
              <div className="flex items-center gap-3">
                {details.consents.devis ? (
                  <CheckCircle2 className="w-5 h-5 text-cockpit-success" />
                ) : (
                  <Circle className="w-5 h-5 text-cockpit-secondary" />
                )}
                <span className={details.consents.devis ? "text-cockpit-primary" : "text-cockpit-secondary"}>Devis</span>
              </div>
            </div>
          ) : (
            <p className="text-cockpit-secondary">Aucune donnée disponible</p>
          )}
        </div>
      </div>

      {details?.requests && details.requests.length > 0 && (
        <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg p-8">
          <h2 className="text-lg font-bold text-cockpit-heading mb-6">Meubles demandés ({details.requests.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-cockpit-dark border-b border-cockpit">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-cockpit-heading">MEUBLE</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-cockpit-heading">DATE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cockpit">
                {details.requests.map((req, idx) => (
                  <tr key={idx} className="hover:bg-cockpit-dark transition-colors">
                    <td className="px-6 py-4 text-cockpit-primary font-medium">{req.meuble || "-"}</td>
                    <td className="px-6 py-4 text-cockpit-secondary text-sm">{req.date || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-cockpit-card rounded-card border border-cockpit shadow-cockpit-lg p-8">
        <h2 className="text-lg font-bold text-cockpit-heading mb-6">Actions</h2>
        <button className="bg-cockpit-yellow text-cockpit-bg px-6 py-3 rounded-lg font-semibold hover:opacity-90">
          Créer une demande de devis
        </button>
      </div>
    </div>
  );
}
