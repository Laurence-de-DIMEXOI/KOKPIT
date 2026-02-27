'use client';

import { useState } from 'react';
import { MessageSquare, Mail, FileText, UserCheck, TrendingUp } from 'lucide-react';

interface TimelineEvent {
  id: string;
  type: string;
  description: string;
  created_at: string;
  user_name?: string;
}

interface ContactTimelineProps {
  events: TimelineEvent[];
  onLoadMore?: () => void;
  hasMore?: boolean;
}

const eventIcons: Record<string, React.ReactNode> = {
  NOTE: <MessageSquare className="w-4 h-4" />,
  EMAIL: <Mail className="w-4 h-4" />,
  DEVIS: <FileText className="w-4 h-4" />,
  VENTE: <TrendingUp className="w-4 h-4" />,
  CALL: <UserCheck className="w-4 h-4" />,
};

const eventColors: Record<string, string> = {
  NOTE: 'bg-blue-100 text-blue-700',
  EMAIL: 'bg-purple-100 text-purple-700',
  DEVIS: 'bg-yellow-100 text-yellow-700',
  VENTE: 'bg-green-100 text-green-700',
  CALL: 'bg-orange-100 text-orange-700',
};

export function ContactTimeline({ events, onLoadMore, hasMore = false }: ContactTimelineProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (events.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 text-sm">Aucun événement pour le moment</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-6 top-8 bottom-0 w-0.5 bg-gradient-to-b from-yellow-400 to-yellow-300" />

        {/* Events */}
        <div className="space-y-6">
          {events.map((event, index) => (
            <div key={event.id} className="relative pl-20">
              {/* Timeline dot */}
              <div
                className={`absolute left-0 top-1.5 w-4 h-4 rounded-full border-4 border-white ${
                  eventColors[event.type] || 'bg-gray-300'
                }`}
              />

              {/* Event card */}
              <div
                onClick={() => setExpanded(expanded === event.id ? null : event.id)}
                className="bg-gray-50 rounded-lg p-3 cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                          eventColors[event.type] || 'bg-gray-200'
                        }`}
                      >
                        {eventIcons[event.type]}
                      </span>
                      <p className="text-sm font-medium text-gray-900">{event.description}</p>
                    </div>
                    <p className="text-xs text-gray-500 ml-8">{formatDate(event.created_at)}</p>
                    {event.user_name && (
                      <p className="text-xs text-gray-600 ml-8">par {event.user_name}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Load More */}
      {hasMore && (
        <button
          onClick={onLoadMore}
          className="w-full py-2 text-sm font-medium text-yellow-600 hover:text-yellow-700 transition-colors border border-yellow-200 rounded-lg hover:bg-yellow-50"
        >
          Voir plus
        </button>
      )}
    </div>
  );
}
