export type PostStatut =
  | "IDEE"
  | "PRE_PRODUCTION"
  | "VISUEL_OK"
  | "TEXTE_OK"
  | "PRET_A_POSTER"
  | "POSTE"
  | "INSPIRATIONS"
  | "COUVERTURES_FB";

export type PostLabel =
  | "INSTAGRAM"
  | "FACEBOOK"
  | "LINKEDIN"
  | "TIKTOK"
  | "SITE_WEB"
  | "NEWSLETTER"
  | "PROMO"
  | "AUTRE";

export interface ChecklistItem {
  id: string;
  postId: string;
  text: string;
  checked: boolean;
  position: number;
}

export interface PostAttachment {
  id: string;
  postId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  createdAt: string;
}

export interface Post {
  id: string;
  title: string;
  description: string | null;
  statut: PostStatut;
  position: number;
  dueDate: string | null;
  labels: PostLabel[];
  coverImage: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  createdBy: { id: string; nom: string; prenom: string };
  checklist: ChecklistItem[];
  attachments: PostAttachment[];
}

export const COLUMNS: { statut: PostStatut; label: string; emoji: string }[] = [
  { statut: "IDEE", label: "Boîte à idées", emoji: "💡" },
  { statut: "PRE_PRODUCTION", label: "Pré-production", emoji: "✍️" },
  { statut: "VISUEL_OK", label: "Visuel Ok", emoji: "📸" },
  { statut: "TEXTE_OK", label: "Texte Ok", emoji: "📝" },
  { statut: "PRET_A_POSTER", label: "Prêt à poster", emoji: "📬" },
  { statut: "POSTE", label: "Posté", emoji: "🎉" },
  { statut: "INSPIRATIONS", label: "Inspirations", emoji: "♡" },
  { statut: "COUVERTURES_FB", label: "Couvertures Facebook", emoji: "📘" },
];

export const LABEL_CONFIG: Record<PostLabel, { name: string; color: string; bg: string }> = {
  INSTAGRAM: { name: "Instagram", color: "#E1306C", bg: "#FCE4EC" },
  FACEBOOK: { name: "Facebook", color: "#1877F2", bg: "#E3F2FD" },
  LINKEDIN: { name: "LinkedIn", color: "#0A66C2", bg: "#E8EAF6" },
  TIKTOK: { name: "TikTok", color: "#010101", bg: "#F5F5F5" },
  SITE_WEB: { name: "Site Web", color: "#10B981", bg: "#E8F5E9" },
  NEWSLETTER: { name: "Newsletter", color: "#F59E0B", bg: "#FFF8E1" },
  PROMO: { name: "Promo", color: "#EF4444", bg: "#FFEBEE" },
  AUTRE: { name: "Autre", color: "#6B7280", bg: "#F3F4F6" },
};
