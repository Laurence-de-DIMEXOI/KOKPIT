export const emptyMessages = {
  pipeline: {
    message: "Pas de devis en cours",
    sousTitre: "Le calme avant la tempête 🌴",
  },
  leads: {
    message: "Aucune demande en attente",
    sousTitre: "L'équipe peut souffler.",
  },
  contacts: {
    message: "Aucun contact trouvé",
    sousTitre: "Essaie avec moins de filtres.",
  },
  taches: {
    message: "Tout est fait ✅",
    sousTitre: "Rare, mais ça arrive.",
  },
  tracabilite: {
    message: "Aucune liaison trouvée",
    sousTitre: "Sellsy n'a pas remonté de lien pour ce document.",
  },
  planning: {
    message: "Cette colonne est vide",
    sousTitre: "Glisse une carte ici pour commencer.",
  },
  activite: {
    message: "Aucune activité enregistrée",
    sousTitre: "Les actions sur ce contact apparaîtront ici.",
  },
  recherche: {
    message: "Aucun résultat",
    sousTitre: "Vérifie l'orthographe ou essaie un autre terme.",
  },
  default: {
    message: "Rien ici pour l'instant",
    sousTitre: "Les données apparaîtront dès qu'il y en aura.",
  },
} as const;

export type EmptyMessageKey = keyof typeof emptyMessages;
