'use client';

import { useState } from 'react';
import { ChevronUp, ChevronDown, MessageSquare } from 'lucide-react';
import { Lead } from '@/hooks/use-leads';

interface LeadTableProps {
  leads: Lead[];
  total: number;
  loading: boolean;
  onRowClick: (lead: Lead) => void;
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  currentPage?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
}

const sourceLabels: Record<string, string> = {
  META: 'Meta',
  GOOGLE: 'Google',
  DIRECT: 'Direct',
  REFERRAL: 'Référence',
  ORGANIC: 'Organique',
};

const sourceColors: Record<string, string> = {
  META: 'bg-gray-900 text-white',
  GOOGLE: 'bg-blue-100 text-blue-700',
  DIRECT: 'bg-yellow-100 text-yellow-700',
  REFERRAL: 'bg-purple-100 text-purple-700',
  ORGANIC: 'bg-green-100 text-green-700',
};

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

const prioriteColors: Record<string, string> = {
  HAUTE: 'text-red-600',
  NORMALE: 'text-yellow-600',
  BASSE: 'text-green-600',
};

export function LeadTable({
  leads,
  total,
  loading,
  onRowClick,
  currentPage = 1,
  pageSize = 20,
  onPageChange,
}: LeadTableProps) {
  const [sortColumn, setSortColumn] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const SortHeader = ({ column, label }: { column: string; label: string }) => (
    <th
      onClick={() => handleSort(column)}
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50"
    >
      <div className="flex items-center gap-2">
        {label}
        {sortColumn === column && (
          sortDirection === 'asc' ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )
        )}
      </div>
    </th>
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `${diffDays}j`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}sem`;
    return date.toLocaleDateString('fr-FR');
  };

  const calculateSLAStatus = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));

    if (diffHours < 0) return { text: 'Dépassé', color: 'text-red-600' };
    if (diffHours < 24) return { text: `${diffHours}h`, color: 'text-red-600' };
    if (diffHours < 72) return { text: `${Math.ceil(diffHours / 24)}j`, color: 'text-yellow-600' };
    return { text: `${Math.ceil(diffHours / 24)}j`, color: 'text-green-600' };
  };

  const totalPages = Math.ceil(total / pageSize);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full">
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i} className="border-b border-gray-100 animate-pulse">
                <td className="px-6 py-4">
                  <div className="h-4 bg-gray-200 rounded w-32" />
                </td>
                <td className="px-6 py-4">
                  <div className="h-4 bg-gray-200 rounded w-24" />
                </td>
                <td className="px-6 py-4">
                  <div className="h-4 bg-gray-200 rounded w-20" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <SortHeader column="contact_name" label="Contact" />
            <SortHeader column="source" label="Source" />
            <SortHeader column="showroom" label="Showroom" />
            <SortHeader column="commercial_name" label="Commercial" />
            <SortHeader column="statut" label="Statut" />
            <SortHeader column="sla_deadline" label="SLA" />
            <SortHeader column="created_at" label="Date" />
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Priorité
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {leads.map((lead) => {
            const slaStatus = calculateSLAStatus(lead.sla_deadline);
            return (
              <tr
                key={lead.id}
                onClick={() => onRowClick(lead)}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">
                      {lead.contact?.prenom} {lead.contact?.nom}
                    </span>
                    <span className="text-xs text-gray-500">{lead.contact?.email}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2.5 py-1 rounded text-xs font-semibold ${
                      sourceColors[lead.source]
                    }`}
                  >
                    {sourceLabels[lead.source] || lead.source}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-medium text-gray-900">{lead.showroom}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600">{lead.commercial_name}</span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2.5 py-1 rounded text-xs font-semibold ${
                      statutColors[lead.statut]
                    }`}
                  >
                    {statutLabels[lead.statut] || lead.statut}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-sm font-medium ${slaStatus.color}`}>
                    {slaStatus.text}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600">{formatDate(lead.created_at)}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-sm font-medium ${prioriteColors[lead.priorite]}`}>
                    ●
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <span className="text-sm text-gray-600">
            Page {currentPage} sur {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange?.(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
            >
              Précédent
            </button>
            <button
              onClick={() => onPageChange?.(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
            >
              Suivant
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
