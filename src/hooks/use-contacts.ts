import { useState, useCallback } from 'react';

export interface Contact {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  lifecycleStage: 'PROSPECT' | 'LEAD' | 'CLIENT' | 'INACTIF';
  showroomId?: string;
  rgpdEmailConsent: boolean;
  rgpdSmsConsent: boolean;
  scoreRfm?: number;
  createdAt: string;
  updatedAt: string;
  leadCount?: number;
  venteCount?: number;
  sellsyContactId?: string;
}

export interface ContactFilters {
  lifecycleStage?: string;
  showroomId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ContactsResponse {
  contacts: Contact[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ContactDetail extends Contact {
  leads?: Array<{ id: string; statut: string; createdAt: string }>;
  devis?: Array<{ id: string; montant: number; statut: string }>;
  evenements?: Array<{ id: string; type: string; description: string; createdAt: string }>;
}

export function useContacts(filters?: ContactFilters) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters) {
        if (filters.lifecycleStage) params.append('lifecycleStage', filters.lifecycleStage);
        if (filters.showroomId) params.append('showroomId', filters.showroomId);
        if (filters.search) params.append('search', filters.search);
        if (filters.page) params.append('page', String(filters.page));
        if (filters.limit) params.append('limit', String(filters.limit));
      }

      const response = await fetch(`/api/contacts?${params.toString()}`);
      if (!response.ok) throw new Error('Erreur lors de la récupération des contacts');
      const data: ContactsResponse = await response.json();
      setContacts(data.contacts);
      setTotal(data.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  return { contacts, total, loading, error, refetch };
}

export function useContact(id?: string) {
  const [contact, setContact] = useState<ContactDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/contacts/${id}`);
      if (!response.ok) throw new Error('Erreur lors de la récupération du contact');
      const data: ContactDetail = await response.json();
      setContact(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  }, [id]);

  return { contact, loading, error, refetch };
}
