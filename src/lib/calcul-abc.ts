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
