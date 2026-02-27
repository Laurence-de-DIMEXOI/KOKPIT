import { useState, useCallback, useEffect } from 'react';

export interface DashboardStats {
  totalLeads: number;
  leadsThisMonth: number;
  totalContacts: number;
  convertedLeads: number;
  conversionRate: number;
  totalRevenue: number;
  averageOrderValue: number;
  slaComplianceRate: number;
  urgentLeads: number;
  leadsBySource?: Array<{ source: string; count: number }>;
  funnelData?: Array<{ stage: string; count: number; percentage: number }>;
  recentActivity?: Array<{
    id: string;
    contactName: string;
    action: string;
    timestamp: string;
  }>;
  slaAlerts?: Array<{
    id: string;
    contactName: string;
    commercialName: string;
    timeRemaining: string;
    status: 'URGENT' | 'ATTENTION';
  }>;
}

export function useDashboardStats(vue: 'marketing' | 'commercial' | 'direction') {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/dashboard/stats?vue=${vue}`);
      if (!response.ok) throw new Error('Erreur lors de la récupération des statistiques');
      const data: DashboardStats = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  }, [vue]);

  useEffect(() => {
    refetch();
    const interval = setInterval(refetch, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [refetch]);

  return { stats, loading, error, refetch };
}
