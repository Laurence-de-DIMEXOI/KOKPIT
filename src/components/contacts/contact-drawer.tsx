'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { ContactCard } from './contact-card';
import { ContactTimeline } from './contact-timeline';
import { Contact, ContactDetail } from '@/hooks/use-contacts';

interface ContactDrawerProps {
  contact: ContactDetail;
  onClose: () => void;
}

type TabType = 'informations' | 'timeline' | 'demandes' | 'devis';

const tabLabels: Record<TabType, string> = {
  informations: 'Informations',
  timeline: 'Activité',
  demandes: 'Demandes',
  devis: 'Devis',
};

export function ContactDrawer({ contact, onClose }: ContactDrawerProps) {
  const [activeTab, setActiveTab] = useState<TabType>('informations');

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-2xl bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {contact.prenom} {contact.nom}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Contact Card */}
        <ContactCard contact={contact} />

        {/* Tabs */}
        <div className="border-b border-gray-200 px-6">
          <div className="flex gap-8">
            {(Object.keys(tabLabels) as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab
                    ? 'border-yellow-400 text-yellow-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tabLabels[tab]}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'informations' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Informations de base</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">{contact.email}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Téléphone</p>
                    <p className="font-medium text-gray-900">{contact.telephone}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Showroom</p>
                    <p className="font-medium text-gray-900">{contact.showroomId}</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Consentements</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className={contact.rgpdEmailConsent ? 'text-green-600' : 'text-gray-400'}>
                      ✓
                    </span>
                    <span className="text-gray-700">Communications par email</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={contact.rgpdSmsConsent ? 'text-green-600' : 'text-gray-400'}>
                      ✓
                    </span>
                    <span className="text-gray-700">Communications par SMS</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'timeline' && (
            <ContactTimeline events={contact.evenements || []} />
          )}

          {activeTab === 'demandes' && (
            <div className="space-y-3">
              {contact.leads && contact.leads.length > 0 ? (
                contact.leads.map((lead) => (
                  <div key={lead.id} className="p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">Demande #{lead.id}</p>
                        <p className="text-xs text-gray-600 mt-1">{lead.statut}</p>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(lead.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">Aucune demande</p>
              )}
            </div>
          )}

          {activeTab === 'devis' && (
            <div className="space-y-3">
              {contact.devis && contact.devis.length > 0 ? (
                contact.devis.map((devis) => (
                  <div key={devis.id} className="p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">Devis #{devis.id}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          {new Intl.NumberFormat('fr-FR', {
                            style: 'currency',
                            currency: 'EUR',
                          }).format(devis.montant)}
                        </p>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${
                        devis.statut === 'ACCEPTE' ? 'bg-green-100 text-green-700' :
                        devis.statut === 'REFUS' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {devis.statut}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">Aucun devis</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
