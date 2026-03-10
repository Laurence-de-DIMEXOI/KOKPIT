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
  | "PILIER_1_MATIERE"
  | "PARCOURS_DECOUVERTE"
  | "CONTEXTE_EVENEMENT"
  | "PILIER_2_COMPRENDRE"
  | "PARCOURS_PEDAGOGIE"
  | "CONTEXTE_NEWSLETTER"
  | "PARCOURS_PROJECTION"
  | "CANAL_META"
  | "PILIER_3_MAGASIN"
  | "CANAL_GOOGLE"
  | "PARCOURS_ACTION"
  | "CONTEXTE_PUBLICITE"
  | "PARCOURS_FIDELISATION"
  | "CANAL_STORY";

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

// Catégories de labels pour regrouper dans le picker
export type LabelCategory = "Piliers" | "Parcours" | "Contexte" | "Canal";

export interface LabelInfo {
  name: string;
  color: string;
  bg: string;
  category: LabelCategory;
}

export const LABEL_CONFIG: Record<PostLabel, LabelInfo> = {
  // ── Piliers (orange → olive → bleu foncé) ──
  PILIER_1_MATIERE:      { name: "Pilier 1 : Matière qui dure",       color: "#E67C00", bg: "#FFF3E0", category: "Piliers" },
  PILIER_2_COMPRENDRE:   { name: "Pilier 2 : Comprendre avant d'acheter", color: "#9E9D24", bg: "#F9FBE7", category: "Piliers" },
  PILIER_3_MAGASIN:      { name: "Pilier 3 : Le magasin comme destination", color: "#3949AB", bg: "#E8EAF6", category: "Piliers" },

  // ── Parcours (pêche → vert → teal → mauve → magenta) ──
  PARCOURS_DECOUVERTE:   { name: "Parcours : Découverte",    color: "#F4845F", bg: "#FBE9E7", category: "Parcours" },
  PARCOURS_PEDAGOGIE:    { name: "Parcours : Pédagogie",     color: "#43A047", bg: "#E8F5E9", category: "Parcours" },
  PARCOURS_PROJECTION:   { name: "Parcours : Projection",    color: "#00897B", bg: "#E0F2F1", category: "Parcours" },
  PARCOURS_ACTION:       { name: "Parcours : Action",        color: "#AB47BC", bg: "#F3E5F5", category: "Parcours" },
  PARCOURS_FIDELISATION: { name: "Parcours : Fidélisation",  color: "#D81B60", bg: "#FCE4EC", category: "Parcours" },

  // ── Contexte (jaune → vert clair → rose) ──
  CONTEXTE_EVENEMENT:    { name: "Contexte : Évènement",     color: "#F9A825", bg: "#FFFDE7", category: "Contexte" },
  CONTEXTE_NEWSLETTER:   { name: "Contexte : Newsletter",    color: "#66BB6A", bg: "#E8F5E9", category: "Contexte" },
  CONTEXTE_PUBLICITE:    { name: "Contexte : Publicité",     color: "#EC407A", bg: "#FCE4EC", category: "Contexte" },

  // ── Canal (bleu → violet → rouge) ──
  CANAL_META:            { name: "Canal : Meta",             color: "#1E88E5", bg: "#E3F2FD", category: "Canal" },
  CANAL_GOOGLE:          { name: "Canal : Google",           color: "#7E57C2", bg: "#EDE7F6", category: "Canal" },
  CANAL_STORY:           { name: "Canal : Story",            color: "#C62828", bg: "#FFEBEE", category: "Canal" },
};
