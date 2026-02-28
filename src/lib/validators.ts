import { z } from "zod";

export enum LeadSource {
  META_ADS = "META_ADS",
  GOOGLE_ADS = "GOOGLE_ADS",
  SITE_WEB = "SITE_WEB",
  GLIDE = "GLIDE",
  SALON = "SALON",
  FORMULAIRE = "FORMULAIRE",
  DIRECT = "DIRECT",
}

export enum Plateforme {
  META = "META",
  GOOGLE = "GOOGLE",
  EMAIL = "EMAIL",
  SMS = "SMS",
  SALON = "SALON",
  AUTRE = "AUTRE",
}

export enum DevisStatut {
  EN_ATTENTE = "EN_ATTENTE",
  ENVOYE = "ENVOYE",
  ACCEPTE = "ACCEPTE",
  REFUSE = "REFUSE",
  EXPIRE = "EXPIRE",
}

// Auth
export const loginSchema = z.object({
  email: z
    .string()
    .email("Email invalide")
    .min(1, "Email requis"),
  password: z
    .string()
    .min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// Contact
export const contactSchema = z.object({
  email: z
    .string()
    .email("Email invalide")
    .min(1, "Email requis"),
  telephone: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/im.test(val),
      "Numéro de téléphone invalide"
    ),
  nom: z
    .string()
    .min(1, "Nom requis")
    .max(100, "Nom trop long"),
  prenom: z
    .string()
    .min(1, "Prénom requis")
    .max(100, "Prénom trop long"),
  adresse: z
    .string()
    .optional()
    .refine((val) => !val || val.length <= 255, "Adresse trop longue"),
  ville: z
    .string()
    .optional()
    .refine((val) => !val || val.length <= 100, "Ville trop longue"),
  codePostal: z
    .string()
    .optional()
    .refine((val) => !val || /^[0-9]{5}$/.test(val), "Code postal invalide"),
  showroomId: z
    .string()
    .uuid()
    .optional(),
  rgpdEmailConsent: z
    .boolean()
    .default(false),
  rgpdSmsConsent: z
    .boolean()
    .default(false),
});

export type ContactInput = z.infer<typeof contactSchema>;

// Lead
export const leadSchema = z.object({
  contactId: z
    .string()
    .uuid(),
  source: z
    .nativeEnum(LeadSource),
  showroomId: z
    .string()
    .uuid()
    .optional(),
  produitsDemandes: z
    .string()
    .optional(),
  utmSource: z
    .string()
    .optional(),
  utmMedium: z
    .string()
    .optional(),
  utmCampaign: z
    .string()
    .optional(),
  utmContent: z
    .string()
    .optional(),
  utmTerm: z
    .string()
    .optional(),
  notes: z
    .string()
    .optional(),
});

export type LeadInput = z.infer<typeof leadSchema>;

// Campaign
export const campagneSchema = z.object({
  nom: z
    .string()
    .min(1, "Nom requis")
    .max(255, "Nom trop long"),
  plateforme: z
    .nativeEnum(Plateforme),
  coutTotal: z
    .number()
    .min(0, "Le coût doit être positif"),
  dateDebut: z
    .date()
    .optional(),
  dateFin: z
    .date()
    .optional(),
});

export type CampagneInput = z.infer<typeof campagneSchema>;

// Email Campaign
export const emailCampaignSchema = z.object({
  nom: z
    .string()
    .min(1, "Nom requis")
    .max(255, "Nom trop long"),
  objet: z
    .string()
    .min(1, "Objet requis")
    .max(255, "Objet trop long"),
  contenuHtml: z
    .string()
    .min(1, "Contenu requis"),
  segmentFilter: z
    .object({})
    .optional(),
  dateEnvoiPlanifie: z
    .date()
    .optional(),
});

export type EmailCampaignInput = z.infer<typeof emailCampaignSchema>;

// CSV Import
export const importCsvSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.type === "text/csv", "Le fichier doit être un CSV"),
  mappingColumns: z.record(z.string()),
  showroomId: z
    .string()
    .uuid()
    .optional(),
});

export type ImportCsvInput = z.infer<typeof importCsvSchema>;

// Devis (Quote)
export const devisSchema = z.object({
  leadId: z
    .string()
    .uuid()
    .optional(),
  contactId: z
    .string()
    .uuid(),
  montant: z
    .number()
    .positive("Le montant doit être positif"),
  statut: z
    .nativeEnum(DevisStatut)
    .default(DevisStatut.EN_ATTENTE),
});

export type DevisInput = z.infer<typeof devisSchema>;
