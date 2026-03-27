/**
 * Classification ABC — Pareto 80/20
 *
 * 20% des références font 80% du CA.
 * Calcul à la volée, jamais stocké.
 */

export interface RefABC {
  sellsyRefId: string;
  designation: string;
  reference: string;
  caAnnuel: number;
  nbCommandes: number;
  quantiteVendue: number;
  stockActuel: number | null;
}

export type ClasseABC = "A" | "B" | "C";

export interface RefClassee extends RefABC {
  classe: ClasseABC;
  caPourcentage: number;
  caCumule: number;
}

export function calculerClassificationABC(
  refs: RefABC[],
  seuilA: number = 80,
  seuilB: number = 95
): RefClassee[] {
  // Trier par CA décroissant
  const triees = [...refs].sort((a, b) => b.caAnnuel - a.caAnnuel);

  // CA total
  const caTotal = triees.reduce((sum, r) => sum + r.caAnnuel, 0);
  if (caTotal === 0) {
    return triees.map((r) => ({
      ...r,
      classe: "C" as ClasseABC,
      caPourcentage: 0,
      caCumule: 0,
    }));
  }

  // Attribuer classe selon % cumulé
  let caCumule = 0;
  return triees.map((ref) => {
    const cumulAvant = (caCumule / caTotal) * 100;
    caCumule += ref.caAnnuel;
    const caPourcentage = Math.round((ref.caAnnuel / caTotal) * 10000) / 100;
    const caCumulePct = Math.round((caCumule / caTotal) * 10000) / 100;

    let classe: ClasseABC;
    if (cumulAvant < seuilA) classe = "A";
    else if (cumulAvant < seuilB) classe = "B";
    else classe = "C";

    return { ...ref, classe, caPourcentage, caCumule: caCumulePct };
  });
}

/**
 * Agrège les lignes de commande Sellsy en RefABC par référence.
 */
export function agregerParReference(
  rows: {
    reference: string;
    description: string;
    amount_tax_exc: string | number;
    quantity: string | number;
    orderId: number;
  }[]
): RefABC[] {
  const map = new Map<
    string,
    { designation: string; ca: number; cmds: Set<number>; qty: number }
  >();

  for (const row of rows) {
    if (!row.reference) continue;
    const ref = row.reference.trim();
    const montant = Number(row.amount_tax_exc) || 0;
    const qty = Number(row.quantity) || 0;

    const existing = map.get(ref);
    if (existing) {
      existing.ca += montant;
      existing.cmds.add(row.orderId);
      existing.qty += qty;
    } else {
      const designation = (row.description || ref)
        .replace(/<[^>]+>/g, "")
        .trim()
        .slice(0, 120);
      map.set(ref, {
        designation,
        ca: montant,
        cmds: new Set([row.orderId]),
        qty,
      });
    }
  }

  return Array.from(map.entries()).map(([reference, data]) => ({
    sellsyRefId: reference,
    reference,
    designation: data.designation,
    caAnnuel: Math.round(data.ca * 100) / 100,
    nbCommandes: data.cmds.size,
    quantiteVendue: Math.round(data.qty),
    stockActuel: null,
  }));
}
