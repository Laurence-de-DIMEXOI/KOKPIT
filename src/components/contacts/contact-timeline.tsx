'use client';

import { useState } from 'react';
import { MessageSquare, Phone, RefreshCw, Mail, FileText, TrendingUp, Trash2 } from 'lucide-react';

interface TimelineEvent {
  id: string;
  type: string;
  description: string;
  createdAt: string;
  auteur?: { id: string; nom: string; prenom: string } | null;
  user_name?: string;
}

interface ContactTimelineProps {
  events: TimelineEvent[];
  onLoadMore?: () => void;
  hasMore?: boolean;
  onDelete?: (eventId: string) => void;
}

const eventIcons: Record<string, React.ReactNode> = {
  NOTE: <MessageSquare className="w-3.5 h-3.5" />,
  APPEL: <Phone className="w-3.5 h-3.5" />,
  RELANCE: <RefreshCw className="w-3.5 h-3.5" />,
  EMAIL_ENVOYE: <Mail className="w-3.5 h-3.5" />,
  DEVIS_CREE: <FileText className="w-3.5 h-3.5" />,
  VENTE: <TrendingUp className="w-3.5 h-3.5" />,
};

const eventColors: Record<string, { bg: string; text: string }> = {
  NOTE: { bg: 'bg-blue-100', text: 'text-blue-700' },
  APPEL: { bg: 'bg-orange-100', text: 'text-orange-700' },
  RELANCE: { bg: 'bg-purple-100', text: 'text-purple-700' },
  EMAIL_ENVOYE: { bg: 'bg-indigo-100', text: 'text-indigo-700' },
  DEVIS_CREE: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  VENTE: { bg: 'bg-green-100', text: 'text-green-700' },
};

const eventLabels: Record<string, string> = {
  NOTE: 'Note',
  APPEL: 'Appel',
  RELANCE: 'Relance',
  EMAIL_ENVOYE: 'Email',
  DEVIS_CREE: 'Devis',
  VENTE: 'Vente',
  CREATION_LEAD: 'Lead créé',
  SMS_ENVOYE: 'SMS',
  CHANGEMENT_STATUT: 'Statut',
  VISITE_WEB: 'Visite web',
};

export function ContactTimeline({ events, onLoadMore, hasMore = false, onDelete }: ContactTimelineProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getAuthorName = (event: TimelineEvent) => {
    if (event.auteur) return `${event.auteur.prenom} ${event.auteur.nom}`;
    if (event.user_name) return event.user_name;
    return null;
  };

  // Événements manuels supprimables
  const isDeletable = (type: string) => ['NOTE', 'APPEL', 'RELANCE'].includes(type);

  if (events.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-gray-400 text-sm">Aucune activité pour le moment</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-[15px] top-6 bottom-0 w-0.5 bg-gradient-to-b from-[#F4B400]/40 to-[#E8EAED]" />

        {/* Events */}
        <div className="space-y-3">
          {events.map((event) => {
            const colors = eventColors[event.type] || { bg: 'bg-gray-100', text: 'text-gray-600' };
            const icon = eventIcons[event.type] || <MessageSquare className="w-3.5 h-3.5" />;
            const label = eventLabels[event.type] || event.type;
            const author = getAuthorName(event);
            const isExpanded = expanded === event.id;

            return (
              <div key={event.id} className="relative pl-10">
                {/* Timeline dot */}
                <div className={`absolute left-1.5 top-2.5 w-[22px] h-[22px] rounded-full flex items-center justify-center ${colors.bg} ${colors.text}`}>
                  {icon}
                </div>

                {/* Event card */}
                <div
                  onClick={() => setExpanded(isExpanded ? null : event.id)}
                  className="bg-[#F5F6F7] rounded-lg px-3 py-2.5 cursor-pointer hover:bg-[#EDEEF0] transition-colors group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${colors.bg} ${colors.text}`}>
                          {label}
                        </span>
                        <span className="text-xs text-[#8592A3]">{formatDate(event.createdAt)}</span>
                      </div>
                      <p className={`text-sm text-[#32475C] ${isExpanded ? '' : 'line-clamp-2'}`}>
                        {event.description}
                      </p>
                      {author && (
                        <p className="text-[11px] text-[#8592A3] mt-0.5">par {author}</p>
                      )}
                    </div>
                    {onDelete && isDeletable(event.type) && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onDelete(event.id); }}
                        className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-50 transition-all"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-400 hover:text-red-600" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Load More */}
      {hasMore && (
        <button
          onClick={onLoadMore}
          className="w-full py-2 text-sm font-medium text-[#F4B400] hover:text-[#D4A000] transition-colors border border-[#F4B400]/30 rounded-lg hover:bg-[#F4B400]/5"
        >
          Voir plus
        </button>
      )}
    </div>
  );
}
