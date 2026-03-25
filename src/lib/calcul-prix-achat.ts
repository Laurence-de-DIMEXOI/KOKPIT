export interface ConfigPrix {
  changeIndo: number;   // ex: 15
  coeffRevient: number; // ex: 1.6
  coeffMarge: number;   // ex: 2.5
}

export interface ResultatPrix {
  minimum: number;
  affiche: number;
  arrondi: number;
  cuisine: number;
}

export function calculerPrix(base: number, config: ConfigPrix): ResultatPrix {
  const minimum = (base / config.changeIndo) * config.coeffRevient * config.coeffMarge * 1.085 * 1.2;
  const affiche = minimum * 1.2;
  const arrondi = Math.round(affiche / 10) * 10 - 1;
  const cuisine = Math.round(affiche * 1.35 / 10) * 10;
  return {
    minimum: Math.round(minimum),
    affiche: Math.round(affiche),
    arrondi,
    cuisine,
  };
}

export function formatEuro(n: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}
