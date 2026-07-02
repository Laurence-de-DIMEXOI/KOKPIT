import { prisma } from "@/lib/prisma";
import { cleanLigne } from "@/lib/reservoir-lignes";

// Commande interne / stock magasin d'après le nom du client (aligné sur le réservoir).
function isStockClient(client: string | null): boolean {
  if (!client) return false;
  return /^(STOCK|ORDER\s*(FOR\s*SHOP|DIMEXOI)|DIMEXOI|EXHIBITION)/i.test(client.trim());
}

type Ligne = { ref?: string | null; desc?: string; qty?: number };

/** Mots-clés d'un besoin → liste normalisée (minuscules, longueur ≥ 3). */
function keywords(motsCles: string | null, recherche: string): string[] {
  const raw = `${motsCles || ""} ${motsCles ? "" : recherche}`;
  return Array.from(
    new Set(
      raw
        .toLowerCase()
        .split(/[,;\n]+|\s+/)
        .map((w) => w.trim())
        .filter((w) => w.length >= 3)
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
    const kws = keywords(b.motsCles, b.recherche);
    if (kws.length === 0) continue;
    const need = Math.max(1, Math.ceil(kws.length / 2));

    for (const s of stock) {
      const lignes = (Array.isArray(s.lignes) ? s.lignes : []) as Ligne[];
      const text = lignes.map((l) => `${l.ref || ""} ${cleanLigne(l.desc || "")}`).join(" ").toLowerCase();
      if (!text) continue;
      const hits = kws.filter((k) => text.includes(k));
      if (hits.length < need) continue;

      const descMeuble = (lignes.find((l) => hits.some((h) => `${l.ref || ""} ${cleanLigne(l.desc || "")}`.toLowerCase().includes(h)))?.desc)
        ? cleanLigne(lignes.find((l) => hits.some((h) => `${l.ref || ""} ${cleanLigne(l.desc || "")}`.toLowerCase().includes(h)))!.desc || "")
        : cleanLigne(lignes[0]?.desc || s.bcdi);

      const existing = await prisma.besoinMatch.findUnique({
        where: { besoinId_bcdi: { besoinId: b.id, bcdi: s.bcdi } },
      });
      if (existing) continue; // déjà connu (suggéré/confirmé/ignoré) → on ne réécrase pas

      const created = await prisma.besoinMatch.create({
        data: {
          besoinId: b.id,
          bcdi: s.bcdi,
          imp: s.imp,
          descMeuble: descMeuble.slice(0, 300),
          score: hits.length,
          dateArrivee: s.dateArrivee,
          statut: "SUGGERE",
        },
      });
      fresh.push({ besoinId: b.id, nomClient: b.nomClient, bcdi: s.bcdi, imp: s.imp, descMeuble, dateArrivee: s.dateArrivee, matchId: created.id });
    }
  }

  return fresh;
}
