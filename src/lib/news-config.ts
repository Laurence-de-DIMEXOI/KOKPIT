/**
 * Items statiques de la barre d'actus interne (NewsTicker dans la topbar).
 * Édite cette liste pour mettre à jour les infos affichées en continu.
 *
 * Format : { icon, text, color? } — icon = emoji unicode, color = couleur tailwind / hex.
 *
 * Items dynamiques (CA mois-ci, anniversaires) sont calculés côté serveur dans
 * `src/app/api/news/route.ts` et fusionnés à cette liste.
 */

export interface NewsItem {
  icon: string;
  text: string;
  color?: string; // optional tailwind text color class (ex: "text-rose-300")
}

export const STATIC_NEWS: NewsItem[] = [
  {
    icon: "☕",
    text: "Semaine de Liliane pour la machine à café", // ← modifie chaque semaine
    color: "text-amber-300",
  },
  {
    icon: "🎉",
    text: "Opération Teck Days en cours du 1er au 10 mai 2026",
    color: "text-rose-300",
  },
  {
    icon: "🚢",
    text: "Pas de départ container prévu",
    color: "text-sky-300",
  },
];
