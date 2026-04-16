/**
 * Seed idempotent des concurrents initiaux de la veille concurrentielle.
 * À lancer avec : npx tsx prisma/seed-concurrents.ts
 *
 * ⚠️ Ne pas ajouter dans prisma/seed.ts qui lui fait un deleteMany() global.
 * Ce script utilise upsert par `nom` — safe à relancer, met à jour les URLs/cat.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CONCURRENTS_INITIAUX = [
  { nom: "80 La Boutique",                        pageUrl: "https://www.facebook.com/80laboutique",     categorie: "déco" },
  { nom: "La Case Déco",                          pageUrl: "https://www.facebook.com/lacasedeco974",    categorie: "déco" },
  { nom: "Tikamoon",                              pageUrl: "https://www.facebook.com/tikamoon",         categorie: "mobilier bois" },
  { nom: "Happy Wood",                            pageUrl: "https://www.facebook.com/happywoodreunion", categorie: "teck" },
  { nom: "IDMR - Meubles tecks et agencements",   pageUrl: "https://www.facebook.com/IDMR974",          categorie: "teck" },
  { nom: "Iemanja",                               pageUrl: "https://www.facebook.com/iemanja974",       categorie: "mobilier bois" },
] as const;

async function main() {
  console.log(`🌱 Seed veille concurrentielle — ${CONCURRENTS_INITIAUX.length} concurrents`);
  for (const c of CONCURRENTS_INITIAUX) {
    const res = await prisma.concurrent.upsert({
      where: { nom: c.nom },
      create: { nom: c.nom, pageUrl: c.pageUrl, categorie: c.categorie, actif: true },
      update: { pageUrl: c.pageUrl, categorie: c.categorie },
    });
    console.log(`  ✓ ${res.nom}${res.pageId ? ` (pageId: ${res.pageId})` : " — pageId à résoudre"}`);
  }
  const total = await prisma.concurrent.count();
  console.log(`\n✅ ${total} concurrent(s) en base. Résoudre les Page IDs via l'UI admin /marketing/veille/concurrents.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
