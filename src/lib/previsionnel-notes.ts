/**
 * Interprétation des notes libres « contact client » du Prévisionnel.
 *
 * Format harmonisé recommandé (généré par les boutons rapides du drawer) :
 *   📞 Appelé · 13/06/2026 · Daniella
 *
 * Le parser tolère aussi les formats libres du tableau Michelle :
 *   "appelé le 13/06 (Daniella)"
 *   "MESSAGERIE LE 13/06/2026. (Daniella)"
 *   "ENVOIE FAPJ 40% LE 13/06/2026. (Daniella)"
 *   "PAS DE MESSAGERIE POUR INFORMER LA CLIENTE..."
 */

export type ClientAction =
  | "appel"
  | "sms"
  | "mvocal"
  | "messagerie"
  | "mail"
  | "fapj"
  | "no-reach"
  | "informed";

export interface ActionMeta {
  label: string;
  emoji: string;
  color: string; // texte
  bg: string; // fond pastille
  border: string;
}

export const ACTION_LABELS: Record<ClientAction, ActionMeta> = {
  appel: {
    label: "Appelé",
    emoji: "📞",
    color: "#065F46",
    bg: "#D1FAE5",
    border: "#A7F3D0",
  },
  sms: {
    label: "SMS",
    emoji: "💬",
    color: "#1E40AF",
    bg: "#DBEAFE",
    border: "#BFDBFE",
  },
  mvocal: {
    label: "Msg vocal",
    emoji: "🎙",
    color: "#92400E",
    bg: "#FEF3C7",
    border: "#FDE68A",
  },
  messagerie: {
    label: "Messagerie",
    emoji: "📨",
    color: "#92400E",
    bg: "#FEF3C7",
    border: "#FDE68A",
  },
  mail: {
    label: "Mail",
    emoji: "✉️",
    color: "#1E40AF",
    bg: "#DBEAFE",
    border: "#BFDBFE",
  },
  fapj: {
    label: "FAPJ envoyée",
    emoji: "📄",
    color: "#5B21B6",
    bg: "#EDE9FE",
    border: "#DDD6FE",
  },
  "no-reach": {
    label: "Pas joint",
    emoji: "❌",
    color: "#991B1B",
    bg: "#FEE2E2",
    border: "#FECACA",
  },
  informed: {
    label: "Informé",
    emoji: "✅",
    color: "#065F46",
    bg: "#D1FAE5",
    border: "#A7F3D0",
  },
};

export const ACTION_ORDER: ClientAction[] = [
  "appel",
  "sms",
  "mvocal",
  "messagerie",
  "mail",
  "fapj",
  "no-reach",
  "informed",
];

export interface ParsedAction {
  action: ClientAction;
  date: string | null; // forme « 13/06 » ou « 13/06/2026 »
  by: string | null;
  line: string; // la ligne d'origine
}

/**
 * Détecte la dernière action client à partir d'un texte libre.
 * Renvoie null si rien n'est interprétable.
 */
export function parseClientNote(note: string | null | undefined): ParsedAction | null {
  if (!note) return null;
  // On itère ligne par ligne, on garde la dernière action détectée (la plus à jour
  // dans notre convention : les nouvelles lignes sont prepend en haut).
  const lines = note.split(/\r?\n/);
  for (const line of lines) {
    const action = detectAction(line);
    if (action) {
      return {
        action,
        date: extractDate(line),
        by: extractBy(line),
        line: line.trim(),
      };
    }
  }
  return null;
}

function detectAction(line: string): ClientAction | null {
  const l = line.toLowerCase();
  // L'ordre des tests compte (plus spécifique d'abord).
  if (/pas de messagerie|impossible.{0,15}joindre|inj?o[iy]gnable/.test(l))
    return "no-reach";
  if (/(envoie|envoi)e?.{0,8}(fapj|fact)|envoy(é|e|er).{0,8}(fapj|fact)/.test(l))
    return "fapj";
  if (/messagerie/.test(l)) return "messagerie";
  if (/msg.{0,2}vocal|message.{0,2}vocal/.test(l)) return "mvocal";
  // « msg » seul (sans « vocal ») = SMS — convention Bernard
  if (/\bmsg\b|\bsms\b/.test(l)) return "sms";
  if (/informer.{0,5}par.{0,5}mail|par.{0,2}mail|envoy(é|e|er).{0,8}mail/.test(l))
    return "mail";
  if (/appel[eé]|appell[eé]/.test(l)) return "appel";
  if (/informer.{0,5}par.{0,5}tel|inform(é|e|er).{0,10}t[eé]l/.test(l))
    return "appel";
  if (/informer|inform[eé]/.test(l)) return "informed";
  return null;
}

function extractDate(line: string): string | null {
  const m = line.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/);
  if (!m) return null;
  // On renvoie la version trouvée telle quelle
  return m[0];
}

function extractBy(line: string): string | null {
  const m = line.match(/\(([^)]{2,40})\)/);
  return m ? m[1].trim() : null;
}

/**
 * Génère une ligne harmonisée pour une action client.
 * Format : "📞 Appelé · 14/06/2026 · Daniella"
 */
export function formatActionLine(
  action: ClientAction,
  date: Date,
  by: string | null
): string {
  const meta = ACTION_LABELS[action];
  const d = date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const tail = by ? ` · ${by}` : "";
  return `${meta.emoji} ${meta.label} · ${d}${tail}`;
}

/**
 * Préfixe la note d'une nouvelle ligne (plus récente en premier).
 */
export function prependLine(
  existingNote: string | null | undefined,
  newLine: string
): string {
  const existing = (existingNote || "").trim();
  if (!existing) return newLine;
  return `${newLine}\n${existing}`;
}
