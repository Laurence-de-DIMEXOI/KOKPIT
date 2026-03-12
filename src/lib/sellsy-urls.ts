// ===== SELLSY URL BUILDER =====
// Centralise tous les liens vers l'interface Sellsy pour éviter les URLs hardcodées
// Format réel : https://www.sellsy.com/?_f=estimateOverview&id=53368710

type SellsyDocType = 'estimate' | 'order' | 'invoice' | 'contact' | 'product';

const SELLSY_BASE = 'https://www.sellsy.com';

const TYPE_CONFIG: Record<SellsyDocType, { _f: string; extra?: string }> = {
  estimate: { _f: 'estimateOverview' },
  order: { _f: 'orderOverview' },
  invoice: { _f: 'invoiceOverview' },
  contact: { _f: 'prospectOverview' },
  product: { _f: 'catalogueitem', extra: '&type=item' },
};

export function getSellsyUrl(type: SellsyDocType, id: string | number): string {
  const cfg = TYPE_CONFIG[type];
  return `${SELLSY_BASE}/?_f=${cfg._f}&id=${id}${cfg.extra || ''}`;
}
