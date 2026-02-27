'use client';

import { Lead } from '@/hooks/use-leads';

interface LeadPipelineProps {
  leads: Lead[];
  onCardClick: (lead: Lead) => void;
}

type StatutType = 'NOUVEAU' | 'EN_COURS' | 'DEVIS' | 'VENTE' | 'PERDU';

const statuts: StatutType[] = ['NOUVEAU', 'EN_COURS', 'DEVIS', 'VENTE', 'PERDU'];
const statutLabels: Record<StatutType, string> = {
  NOUVEAU: 'Nouveau',
  EN_COURS: 'En cours',
  DEVIS: 'Devis',
  VENTE: 'Vente',
  PERDU: 'Perdu',
};

const statutColors: Record<StatutType, string> = {
  NOUVEAU: 'bg-blue-50 border-blue-200',
  EN_COURS: 'bg-purple-50 border-purple-200',
  DEVIS: 'bg-yellow-50 border-yellow-200',
  VENTE: 'bg-green-50 border-green-200',
  PERDU: 'bg-red-50 border-red-200',
};

const cardColors: Record<StatutType, string> = {
  NOUVEAU: 'border-blue-300 hover:border-blue-400 bg-white',
  EN_COURS: 'border-purple-300 hover:border-purple-400 bg-white',
  DEVIS: 'border-yellow-300 hover:border-yellow-400 bg-white',
  VENTE: 'border-green-300 hover:border-green-400 bg-white',
  PERDU: 'border-red-300 hover:border-red-400 bg-white',
};

const sourceColors: Record<string, string> = {
  META: 'bg-gray-900 text-white text-xs',
  GOOGLE: 'bg-blue-100 text-blue-700 text-xs',
  DIRECT: 'bg-yellow-100 text-yellow-700 text-xs',
  REFERRAL: 'bg-purple-100 text-purple-700 text-xs',
  ORGANIC: 'bg-green-100 text-green-700 text-xs',
};

export function LeadPipeline({ leads, onCardClick }: LeadPipelineProps) {
  const calculateSLAColor = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));

    if (diffHours < 0) return 'text-red-600';
    if (diffHours < 24) return 'text-red-600';
    if (diffHours < 72) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {statuts.map((statut) => {
        const columnLeads = leads.filter((l) => l.statut === statut);
        return (
          <div
            key={statut}
            className={`rounded-lg p-4 border ${statutColors[statut]}`}
          >
            <div className="mb-4">
              <h3 className="font-semibold text-gray-900">{statutLabels[statut]}</h3>
              <p className="text-sm text-gray-500">{columnLeads.length} demande(s)</p>
            </div>

            <div className="space-y-3">
              {columnLeads.map((lead) => (
                <div
                  key={lead.id}
                  onClick={() => onCardClick(lead)}
                  className={`p-3 rounded border-2 cursor-pointer transition-all ${cardColors[statut]}`}
                >
                  <div className="mb-2">
                    <p className="text-sm font-medium text-gray-900">
                      {lead.contact?.prenom} {lead.contact?.nom}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{lead.contact?.email}</p>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`px-2 py-1 rounded-full font-semibold ${sourceColors[lead.source]}`}
                    >
                      {lead.source}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-medium ${calculateSLAColor(lead.sla_deadline)}`}>
                      SLA
                    </span>
                    <span className="text-gray-500">{lead.commercial_name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
