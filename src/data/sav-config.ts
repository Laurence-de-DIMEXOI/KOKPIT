/**
 * SAV / Litiges — Configuration
 */

export const TYPES_SAV = [
  { value: "DEFAUT_PRODUIT", label: "Défaut produit" },
  { value: "LIVRAISON", label: "Livraison" },
  { value: "LITIGE_COMMERCIAL", label: "Litige commercial" },
  { value: "RETOUR", label: "Retour" },
  { value: "INSATISFACTION", label: "Insatisfaction" },
  { value: "AUTRE", label: "Autre" },
] as const;

export const STATUTS_SAV = [
  { value: "A_TRAITER", label: "À traiter", couleur: "bg-red-500/15 text-red-500", dot: "bg-red-500" },
  { value: "EN_COURS", label: "En cours", couleur: "bg-yellow-500/15 text-yellow-600", dot: "bg-yellow-500" },
  { value: "EN_ATTENTE", label: "En attente", couleur: "bg-gray-500/15 text-gray-500", dot: "bg-gray-400" },
  { value: "TRAITE", label: "Traité", couleur: "bg-green-500/15 text-green-600", dot: "bg-green-500" },
  { value: "CLOTURE", label: "Clôturé", couleur: "bg-blue-500/15 text-blue-500", dot: "bg-blue-500" },
] as const;

export const TYPES_DOCUMENT_SAV = [
  { value: "PDF", label: "PDF", icone: "FileText", couleur: "text-red-500" },
  { value: "EMAIL", label: "Email", icone: "Mail", couleur: "text-blue-500" },
  { value: "APPEL", label: "Appel", icone: "Phone", couleur: "text-green-500" },
  { value: "COURRIER", label: "Courrier", icone: "FileArchive", couleur: "text-amber-500" },
  { value: "PHOTO", label: "Photo", icone: "Image", couleur: "text-purple-500" },
  { value: "AUTRE", label: "Autre", icone: "Paperclip", couleur: "text-gray-500" },
] as const;

export function getTypeLabel(type: string): string {
  return TYPES_SAV.find((t) => t.value === type)?.label || type;
}

export function getStatutConfig(statut: string) {
  return STATUTS_SAV.find((s) => s.value === statut) || STATUTS_SAV[0];
}

export function getDocTypeConfig(type: string) {
  return TYPES_DOCUMENT_SAV.find((t) => t.value === type) || TYPES_DOCUMENT_SAV[5];
}
