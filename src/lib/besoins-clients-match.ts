import { prisma } from "@/lib/prisma";
import { cleanLigne, classifyLignes } from "@/lib/reservoir-lignes";

// Catégorie déduite d'un item d'après ses lignes (évite qu'un arrivage SDB
// taggue un besoin « lit »/« buffet » via des mots de finition partagés).
function inferItemCategorie(text: string, lignes: any[]): string | null {
  if (/salle de bain|\bsdb\b|vasque|colonne sdb/i.test(text)) return "SDB";
  const cls = classifyLignes(lignes as any);
  if (cls.isCuisine) return "CUISINE";
  if (cls.isDressing) return "DRESSING";
  if (/outdoor|ext[eé]rieur|jardin|transat|bain de soleil/i.test(text)) return "EXTERIEUR";
  if (/\blit\b|matelas|sommier|t[eê]te de lit|chevet/i.test(text)) return "CHAMBRE";
  return null;
}

// Commande interne / stock magasin d'après le nom du client (aligné sur le réservoir).
function isStockClient(client: string | null): boolean {
  if (!client) return false;
  return /^(STOCK|ORDER\s*(FOR\s*SHOP|DIMEXOI)|DIMEXOI|EXHIBITION)/i.test(client.trim());
}

type Ligne = { ref?: string | null; desc?: string; qty?: number };

// Mots trop génériques (présents dans quasiment tout un réappro) → non discriminants.
const STOPWORDS = new Set([
  "meuble", "meubles", "salle", "bain", "bains", "sdb", "avec", "sur", "sous", "pour",
  "les", "des", "une", "del", "que", "tiroir", "tiroirs", "porte", "portes", "deco",
  "déco", "max", "min", "pieds", "pied", "principalement", "avant", "voir", "commande",
  "modele", "modèle", "preference", "préférence",
]);
const FINISHES = ["miel", "brut", "cérusé", "cerusé", "cérusée", "blanc", "noir"];

/** Nombres 40–300 (largeurs plausibles) présents dans un texte. */
function widths(text: string): number[] {
  return Array.from(new Set((text.match(/\d{2,3}/g) || []).map(Number).filter((n) => n >= 40 && n <= 300)));
}
/** Largeur(s) d'une ligne produit = 1re dimension de chaque triplet NxNxN
 *  (évite de confondre une hauteur de colonne, ex. 40x35x160, avec une largeur). */
function lineWidths(text: string): number[] {
  const trip = [...text.matchAll(/(\d{2,3})\s*[x×]\s*\d{2,3}\s*[x×]\s*\d{2,3}/gi)].map((m) => Number(m[1]));
  const src = trip.length ? trip : (text.match(/\d{2,3}/g) || []).map(Number);
  return Array.from(new Set(src.filter((n) => n >= 20 && n <= 300)));
}
/** Tokens discriminants d'un besoin : modèles/attributs (≥4 lettres, hors stopwords, sans chiffre). */
function distinctiveTokens(text: string): string[] {
  return Array.from(
    new Set(
      text.toLowerCase().split(/[^a-zàâäéèêëïîôöùûüç]+/i)
        .filter((w) => w.length >= 4 && !STOPWORDS.has(w) && !FINISHES.includes(w))
    )
  );
}

/**
 * Recalcule les correspondances entre besoins clients actifs et meubles stock
 * présents sur des IMP « en mer » (partis, pas encore arrivés). Upsert les
 * BesoinMatch et renvoie les correspondances NOUVELLES (jamais notifiées).
 */
export async function computeBesoinMatches(): Promise<
  Array<{ besoinId: string; nomClient: string; bcdi: string; imp: string; descMeuble: string; dateArrivee: Date | null; matchId: string }>
> {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  // Besoins actifs avec des mots-clés exploitables
  const besoins = await prisma.besoinClient.findMany({
    where: { statut: "EN_ATTENTE" },
    select: { id: true, nomClient: true, motsCles: true, recherche: true, categorie: true },
  });
  if (besoins.length === 0) return [];

  // Stock en mer : IMP partis (dateArrivee null ou future) avec détail de lignes.
  const expeditions = await prisma.impExpedition.findMany({
    where: { OR: [{ dateArrivee: null }, { dateArrivee: { gte: today } }] },
    select: { bcdi: true, imp: true, client: true, lignes: true, dateArrivee: true },
  });
  const stock = expeditions.filter((e) => e.lignes != null && isStockClient(e.client));
  if (stock.length === 0) return [];

  const fresh: Array<{ besoinId: string; nomClient: string; bcdi: string; imp: string; descMeuble: string; dateArrivee: Date | null; matchId: string }> = [];

  for (const b of besoins) {
    const need = `${b.motsCles || ""} ${b.recherche}`;
    const bWidths = widths(need);
    const bTokens = distinctiveTokens(need);
    const bFinishes = FINISHES.filter((f) => need.toLowerCase().includes(f));

    for (const s of stock) {
      const lignes = (Array.isArray(s.lignes) ? s.lignes : []) as Ligne[];
      const fullText = lignes.map((l) => `${l.ref || ""} ${cleanLigne(l.desc || "")}`).join(" ").toLowerCase();
      if (!fullText) continue;
      // Verrou de catégorie : si les deux catégories sont connues et diffèrent, on saute.
      const itemCat = inferItemCategorie(fullText, lignes);
      if (b.categorie && itemCat && b.categorie !== itemCat) continue;

      // Cherche LA ligne la plus proche : largeur (fort) + modèle/attribut + finition.
      let best = { score: 0, desc: "" };
      for (const l of lignes) {
        const t = `${l.ref || ""} ${cleanLigne(l.desc || "")}`.toLowerCase();
        const nums = lineWidths(t);
        const widthMatch = bWidths.length > 0 && bWidths.some((w) => nums.includes(w));
        const modelHits = bTokens.filter((k) => t.includes(k)).length;
        const finishHits = bFinishes.filter((f) => t.includes(f)).length;
        const ligneScore = (widthMatch ? 5 : 0) + modelHits * 3 + finishHits;
        if (ligneScore > best.score) best = { score: ligneScore, desc: cleanLigne(l.desc || "") };
      }
      // Si le besoin précise une largeur mais aucune ligne ne l'a → pas assez précis.
      if (bWidths.length > 0 && !bWidths.some((w) => lineWidths(fullText).includes(w))) continue;
      // Il faut au moins un signal discriminant (largeur, modèle ou finition).
      if (best.score === 0) continue;

      const total = best.score + 1; // +1 baseline (même catégorie)
      const descMeuble = (best.desc || cleanLigne(lignes[0]?.desc || s.bcdi)).slice(0, 300);

      const existing = await prisma.besoinMatch.findUnique({
        where: { besoinId_bcdi: { besoinId: b.id, bcdi: s.bcdi } },
      });
      if (existing) continue; // déjà connu (suggéré/confirmé/ignoré) → on ne réécrase pas

      const created = await prisma.besoinMatch.create({
        data: { besoinId: b.id, bcdi: s.bcdi, imp: s.imp, descMeuble, score: total, dateArrivee: s.dateArrivee, statut: "SUGGERE" },
      });
      fresh.push({ besoinId: b.id, nomClient: b.nomClient, bcdi: s.bcdi, imp: s.imp, descMeuble, dateArrivee: s.dateArrivee, matchId: created.id });
    }
  }

  return fresh;
}
