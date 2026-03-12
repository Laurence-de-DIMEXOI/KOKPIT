// ===== SELLSY URL BUILDER =====
// Centralise tous les liens vers l'interface Sellsy pour éviter les URLs hardcodées

type SellsyDocType = 'estimate' | 'order' | 'invoice' | 'contact' | 'product';

const SELLSY_BASE = 'https://go.sellsy.com';

const PATH_MAP: Record<SellsyDocType, string> = {
  estimate: '/document/estimate',
  order: '/document/order',
  invoice: '/document/invoice',
  contact: '/people',
  product: '/catalog/product',
};

export function getSellsyUrl(type: SellsyDocType, id: string | number): string {
  return `${SELLSY_BASE}${PATH_MAP[type]}/${id}`;
}
