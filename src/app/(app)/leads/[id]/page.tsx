'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, Clock, User, Home, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { useUpdateLead } from '@/hooks/use-leads';

interface LeadDetail {
  id: string;
  contact: {
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
  };
  statut: string;
  source: string;
  showroom: string;
  commercial_id: string;
  commercial_name: string;
  sla_deadline: string;
  produits_demandes: string;
  created_at: string;
  updated_at: string;
}

interface Timeline {
  id: string;
  type: string;
  description: string;
  created_at: string;
  user_name?: string;
}

const statutLabels: Record<string, string> = {
  NOUVEAU: 'Nouveau',
  EN_COURS: 'En cours',
  DEVIS: 'Devis',
  VENTE: 'Vente',
  PERDU: 'Perdu',
};

const statutColors: Record<string, string> = {
  NOUVEAU: 'bg-blue-100 text-blue-700',
  EN_COURS: 'bg-purple-100 text-purple-700',
  DEVIS: 'bg-yellow-100 text-yellow-700',
  VENTE: 'bg-green-100 text-green-700',
  PERDU: 'bg-red-100 text-red-700',
};

export default function LeadDetailPage() {
  const params = useParams();
  const leadId = params.id as string;

  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [timeline, setTimeline] = useState<Timeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [note, setNote] = useState('');
  const { update } = useUpdateLead();

  useEffect(() => {
    const fetchLead = async () => {
      try {
        const response = await fetch(`/api/leads/${leadId}`);
        if (response.ok) {
          const data = await response.json();
          setLead(data);
          setSelectedStatus(data.statut);

          // Fetch timeline
          const timelineResponse = await fetch(`/api/leads/${leadId}/timeline`);
          if (timelineResponse.ok) {
            const timelineData = await timelineResponse.json();
            setTimeline(timelineData);
          }
        }
      } catch (err) {
        console.error('Error fetching lead:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLead();
  }, [leadId]);

  const handleStatusChange = async () => {
    if (!lead || selectedStatus === lead.statut) return;
    try {
      await update(lead.id, { statut: selectedStatus });
      setLead({ ...lead, statut: selectedStatus });
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleAddNote = async () => {
    if (!lead || !note.trim()) return;
    try {
      await update(lead.id, { notes: note });
      setNote('');
      // Refresh timeline
      const timelineResponse = await fetch(`/api/leads/${leadId}/timeline`);
      if (timelineResponse.ok) {
        const timelineData = await timelineResponse.json();
        setTimeline(timelineData);
      }
    } catch (err) {
      console.error('Erreur lors de l\'ajout de la note:', err);
    }
  };

  const calculateSLA = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));

    if (diffHours < 0) return { text: 'Dépassé', color: 'text-red-600' };
    if (diffHours < 24) return { text: `${diffHours}h restantes`, color: 'text-red-600' };
    if (diffHours < 72) return { text: `${Math.ceil(diffHours / 24)}j restants`, color: 'text-yellow-600' };
    return { text: `${Math.ceil(diffHours / 24)}j restants`, color: 'text-green-600' };
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-1/3 mb-6" />
          <div className="h-64 bg-gray-700 rounded" />
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 text-lg">Demande introuvable</p>
        <Link href="/leads" className="text-yellow-400 hover:text-yellow-500 font-medium mt-4 inline-block">
          Retour aux demandes
        </Link>
      </div>
    );
  }

  const slaInfo = calculateSLA(lead.sla_deadline);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 sm:gap-4">
        <Link
          href="/leads"
          className="text-gray-400 hover:text-gray-200 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </Link>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white truncate">
          {lead.contact.prenom} {lead.contact.nom}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left: Lead Details */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Lead Info Card */}
          <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Informations</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Statut</p>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      statutColors[lead.statut]
                    }`}
                  >
                    {statutLabels[lead.statut] || lead.statut}
                  </span>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-yellow-400"
                  >
                    <option value="NOUVEAU">Nouveau</option>
                    <option value="EN_COURS">En cours</option>
                    <option value="DEVIS">Devis</option>
                    <option value="VENTE">Vente</option>
                    <option value="PERDU">Perdu</option>
                  </select>
                  {selectedStatus !== lead.statut && (
                    <button
                      onClick={handleStatusChange}
                      className="text-xs bg-yellow-400 text-gray-900 px-2 py-1 rounded font-medium hover:bg-yellow-500"
                    >
                      Mettre à jour
                    </button>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Source</p>
                <p className="font-medium text-gray-900">{lead.source}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Showroom</p>
                <p className="font-medium text-gray-900">{lead.showroom}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Commercial</p>
                <p className="font-medium text-gray-900">{lead.commercial_name}</p>
              </div>
            </div>
          </div>

          {/* Contact Card */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Nom</p>
                  <p className="font-medium text-gray-900">
                    {lead.contact.prenom} {lead.contact.nom}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <a
                    href={`mailto:${lead.contact.email}`}
                    className="font-medium text-yellow-600 hover:text-yellow-700"
                  >
                    {lead.contact.email}
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Home className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Téléphone</p>
                  <a
                    href={`tel:${lead.contact.telephone}`}
                    className="font-medium text-gray-900"
                  >
                    {lead.contact.telephone || 'Non fourni'}
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Products */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Produits demandés</h2>
            <p className="text-gray-700">{lead.produits_demandes}</p>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h2>
            <div className="flex gap-3">
              <button className="flex-1 px-4 py-2 bg-yellow-400 text-gray-900 font-medium rounded-lg hover:bg-yellow-500 transition-colors">
                Envoyer un email
              </button>
              <button className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors">
                Ajouter un devis
              </button>
            </div>
          </div>
        </div>

        {/* Right: Timeline & SLA */}
        <div className="space-y-6">
          {/* SLA Card */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-gray-400" />
              <h3 className="font-semibold text-gray-900">SLA</h3>
            </div>
            <p className={`text-2xl font-bold ${slaInfo.color}`}>{slaInfo.text}</p>
            <p className="text-xs text-gray-500 mt-2">
              {new Date(lead.sla_deadline).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>

          {/* Add Note */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-3">Ajouter une note</h3>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Écrivez une note..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 text-sm mb-2"
            />
            <button
              onClick={handleAddNote}
              disabled={!note.trim()}
              className="w-full px-4 py-2 bg-yellow-400 text-gray-900 font-medium rounded-lg hover:bg-yellow-500 transition-colors disabled:opacity-50"
            >
              Ajouter
            </button>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">Historique</h3>
            <div className="space-y-4">
              {timeline.slice(0, 8).map((event) => (
                <div key={event.id} className="flex gap-3 pb-4 border-b border-gray-100 last:border-0">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{event.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(event.created_at).toLocaleDateString('fr-FR', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
