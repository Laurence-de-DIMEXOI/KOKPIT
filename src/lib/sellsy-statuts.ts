/**
 * Traduction des statuts Sellsy API V2 en français.
 * Utilisé sur les pages traçabilité, pipeline, commandes.
 */

const statutsFR: Record<string, string> = {
  // Devis (estimates)
  draft: 'Brouillon',
  sent: 'Envoyé',
  read: 'Lu',
  accepted: 'Accepté',
  advanced: 'Acompte versé',
  refused: 'Refusé',
  cancelled: 'Annulé',
  invoiced: 'Facturé',
  partialinvoiced: 'Facturé partiellement',
  expired: 'Expiré',

  // Commandes (orders)
  in_progress: 'En cours',
  delivered: 'Livré',
  partial: 'Livraison partielle',

  // Factures (invoices)
  due: 'À régler',
  paid: 'Payé',
  late: 'En retard',

  // Générique
  active: 'Actif',
  inactive: 'Inactif',
  archived: 'Archivé',
  pending: 'En attente',
  completed: 'Terminé',
};

/**
 * Traduit un statut Sellsy API en français.
 * Retourne le statut original si aucune traduction n'est trouvée.
 */
export function traduireStatut(status: string | undefined | null): string {
  if (!status) return 'Inconnu';
  const key = status.toLowerCase().trim();
  return statutsFR[key] || status;
}

export default statutsFR;
