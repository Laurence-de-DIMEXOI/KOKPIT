'use client';

import { Mail, MessageSquare, ExternalLink } from 'lucide-react';
import { getSellsyUrl } from '@/lib/sellsy-urls';
import { Contact } from '@/hooks/use-contacts';

interface ContactCardProps {
  contact: Contact;
}

const stageLabels: Record<string, string> = {
  NOUVEAU: 'Nouveau',
  PROSPECT: 'Prospect',
  CLIENT: 'Client',
  INACTIF: 'Inactif',
};

const stageColors: Record<string, string> = {
  NOUVEAU: 'bg-blue-100 text-blue-700',
  PROSPECT: 'bg-purple-100 text-purple-700',
  CLIENT: 'bg-green-100 text-green-700',
  INACTIF: 'bg-gray-100 text-gray-700',
};

export function ContactCard({ contact }: ContactCardProps) {
  const initials = `${contact.prenom[0]}${contact.nom[0]}`.toUpperCase();
  const rfmScore = contact.scoreRfm ? Math.round(contact.scoreRfm) : null;

  return (
    <div className="p-6 border-b border-gray-100">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center text-sm font-bold text-gray-900">
            {initials}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900">
              {contact.prenom} {contact.nom}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`px-2.5 py-1 rounded text-xs font-semibold ${
                  stageColors[contact.lifecycleStage]
                }`}
              >
                {stageLabels[contact.lifecycleStage] || contact.lifecycleStage}
              </span>
              {rfmScore && (
                <span className="px-2.5 py-1 rounded text-xs font-semibold bg-yellow-100 text-yellow-700">
                  RFM: {rfmScore}
                </span>
              )}
            </div>
          </div>
        </div>
        {contact.sellsyContactId && (
          <a
            href={getSellsyUrl('contact', contact.sellsyContactId!)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-yellow-400 transition-colors"
          >
            <ExternalLink className="w-5 h-5" />
          </a>
        )}
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Mail className="w-4 h-4 text-gray-400" />
          <a href={`mailto:${contact.email}`} className="text-yellow-600 hover:text-yellow-700">
            {contact.email}
          </a>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <MessageSquare className="w-4 h-4 text-gray-400" />
          <a href={`tel:${contact.telephone}`} className="text-gray-900 font-medium">
            {contact.telephone}
          </a>
        </div>
      </div>

      {/* RGPD Consent & Showroom */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-600">Email:</span>
            <span className={`text-lg ${contact.rgpdEmailConsent ? 'text-green-600' : 'text-gray-400'}`}>
              ✓
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-600">SMS:</span>
            <span className={`text-lg ${contact.rgpdSmsConsent ? 'text-green-600' : 'text-gray-400'}`}>
              ✓
            </span>
          </div>
        </div>
        <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-2.5 py-1 rounded">
          {contact.showroomId}
        </span>
      </div>
    </div>
  );
}
