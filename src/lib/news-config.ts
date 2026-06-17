/**
 * Items statiques de la barre d'actus interne (NewsTicker dans la topbar).
 * Édite cette liste pour mettre à jour les infos affichées en continu.
 *
 * Format : { icon, text, color?, action?, cta? }
 *  - icon : emoji unicode
 *  - color : classe Tailwind (ex: "text-rose-300")
 *  - action : déclenche un comportement custom côté NewsTicker (ex: ouverture pop-up)
 *  - cta : libellé du bouton affiché à droite de l'item quand une action est définie
 *
 * Items dynamiques (CA mois-ci, anniversaires) sont calculés côté serveur dans
 * `src/app/api/news/route.ts` et fusionnés à cette liste.
 */

export type NewsAction = "open-container";

export interface NewsItem {
  icon: string;
  text: string;
  color?: string;
  action?: NewsAction;
  cta?: string;
}

export const STATIC_NEWS: NewsItem[] = [
  {
    icon: "🚢",
    text: "Container CAAU9910103 en transit — quitte l'Indonésie le 14 juin, arrivée prévue le 6 juillet à la Réunion",
    color: "text-sky-300",
    action: "open-container",
    cta: "Voir le contenu",
  },
];

// Rotation café : pas besoin de la dupliquer ici — la source de vérité est
// `src/data/cafe-planning.ts` (utilisée par le pop-up pointage et la banderole).
