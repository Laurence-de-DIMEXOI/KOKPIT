import { useState, useCallback } from 'react';

export interface Lead {
  id: string;
  contactId: string;
  statut: 'NOUVEAU' | 'EN_COURS' | 'DEVIS' | 'VENTE' | 'PERDU';
  source: string;
  showroomId?: string;
  commercialId?: string;
  slaDeadline: string;
  produitsDemandes?: any;
  priorite: 'HAUTE' | 'NORMALE' | 'BASSE';
  createdAt: string;
  updatedAt: string;
  contact?: {
    nom: string;
    prenom: string;
    email: string;
    telephone?: string;
  };
  showroom?: {
    id: string;
    nom: string;
  };
  commercial?: {
    id: string;
    nom: string;
    prenom: string;
  };
}

export interface LeadFilters {
  statut?: string;
  source?: string;
  showroomId?: string;
  commercialId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface LeadsResponse {
  leads: Lead[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function useLeads(filters?: LeadFilters) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters) {
        if (filters.statut) params.append('statut', filters.statut);
        if (filters.source) params.append('source', filters.source);
        if (filters.showroomId) params.append('showroomId', filters.showroomId);
        if (filters.commercialId) params.append('commercialId', filters.commercialId);
        if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
        if (filters.dateTo) params.append('dateTo', filters.dateTo);
        if (filters.search) params.append('search', filters.search);
        if (filters.page) params.append('page', String(filters.page));
        if (filters.limit) params.append('limit', String(filters.limit));
      }

      const response = await fetch(`/api/leads?${params.toString()}`);
      if (!response.ok) throw new Error('Erreur lors de la récupération des demandes');
      const data: LeadsResponse = await response.json();
      setLeads(data.leads);
      setTotal(data.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  return { leads, total, loading, error, refetch };
}

export function useCreateLead() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(
    async (data: {
      nom: string;
      prenom: string;
      email: string;
      telephone?: string;
      showroomId?: string;
      source: string;
      produitsDemandes?: any;
      utmSource?: string;
      utmMedium?: string;
      utmCampaign?: string;
      rgpdEmailConsent?: boolean;
      rgpdSmsConsent?: boolean;
      notes?: string;
    }) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Erreur lors de la création');
        const result = await response.json();
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Une erreur est survenue';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { create, loading, error };
}

export function useUpdateLead() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = useCallback(
    async (
      id: string,
      data: Partial<{
        statut: string;
        commercialId: string;
        produitsDemandes: any;
        notes: string;
        priorite: string;
      }>
    ) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/leads/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Erreur lors de la mise à jour');
        const result = await response.json();
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Une erreur est survenue';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { update, loading, error };
}
