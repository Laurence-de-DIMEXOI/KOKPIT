import type { Session } from "next-auth";

/**
 * Extended NextAuth Session with custom user data
 */
export interface ExtendedSession extends Session {
  user: {
    id: string;
    email: string;
    nom: string;
    prenom: string;
    role: string;
    showroomId: string | null;
    moduleAccessOverrides: Record<string, boolean> | null;
  };
}

/**
 * Dashboard statistics
 */
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
}

/**
 * Lead with associated contact information
 */
export interface LeadWithContact {
  id: string;
  contactId: string;
  contact: {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    telephone?: string;
    adresse?: string;
    ville?: string;
    codePostal?: string;
  };
  source: string;
  statut: string;
  produitsDemandes?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  notes?: string;
  campaigneId?: string;
  showroomId?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Contact with related data
 */
export interface ContactWithRelations {
  id: string;
  email: string;
  telephone?: string;
  nom: string;
  prenom: string;
  adresse?: string;
  ville?: string;
  codePostal?: string;
  showroomId?: string;
  sellsyContactId?: string;
  rgpdEmailConsent: boolean;
  rgpdSmsConsent: boolean;
  scoreRfm?: number;
  recence?: number;
  frequence?: number;
  montant?: number;
  leads?: LeadWithContact[];
  ventes?: {
    id: string;
    montant: number;
    dateVente: Date;
  }[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Timeline event for lead or contact history
 */
export interface TimelineEvent {
  id: string;
  type: "LEAD_CREATED" | "EMAIL_SENT" | "SMS_SENT" | "CALL_LOGGED" | "NOTE_ADDED" | "STATUS_CHANGED" | "VENTE_CREATED" | "DEVIS_SENT";
  entityId: string;
  entityType: "LEAD" | "CONTACT" | "VENTE";
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  createdBy?: string;
}

/**
 * KPI data for analytics
 */
export interface KpiData {
  kpiId: string;
  label: string;
  value: number;
  target?: number;
  unit?: string;
  trend?: "up" | "down" | "flat";
  trendPercentage?: number;
  period: "day" | "week" | "month" | "quarter" | "year";
  timestamp: Date;
}

/**
 * Campaign performance metrics
 */
export interface CampaignMetrics {
  campaigneId: string;
  nom: string;
  plateforme: string;
  impressions: number;
  clicks: number;
  ctr: number; // Click-through rate
  conversions: number;
  conversionRate: number;
  coutTotal: number;
  cpa: number; // Cost per acquisition
  roi: number; // Return on investment
  revenue: number;
}

/**
 * Lead qualification score
 */
export interface LeadScore {
  leadId: string;
  score: number; // 0-100
  factors: {
    recency: number; // 0-20
    engagementLevel: number; // 0-20
    productInterest: number; // 0-20
    budgetIndicator: number; // 0-20
    competitorPresence: number; // 0-20
  };
}

/**
 * Showroom/Location data
 */
export interface Showroom {
  id: string;
  nom: string;
  adresse: string;
  codePostal: string;
  ville: string;
  telephone?: string;
  email?: string;
  horaires?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Email template for campaigns
 */
export interface EmailTemplate {
  id: string;
  nom: string;
  subject: string;
  contenuHtml: string;
  contenuTexte?: string;
  variables?: string[]; // Placeholders like {{firstName}}, {{email}}
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}
