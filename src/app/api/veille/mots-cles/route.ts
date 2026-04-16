import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = new Set(["ADMIN", "MARKETING", "DIRECTION"]);

// Stop-words FR — liste courte maintenue à la main.
// Pas besoin de librairie : ~60 mots couvrent l'essentiel des pubs courtes.
const STOP_WORDS = new Set<string>([
  // articles + déterminants
  "le","la","les","l","un","une","des","du","de","d",
  "ce","cet","cette","ces","mon","ma","mes","ton","ta","tes","son","sa","ses",
  "notre","nos","votre","vos","leur","leurs",
  // pronoms
  "je","tu","il","elle","on","nous","vous","ils","elles","ça","ce","se","s","qui","que","qu","quoi","dont","où",
  // prépositions courantes
  "à","au","aux","en","dans","sur","sous","pour","par","avec","sans","chez","vers","contre","entre","après","avant","depuis","jusqu","jusque","selon",
  // conjonctions
  "et","ou","mais","donc","or","ni","car","si","comme","quand","lorsque","puisque","parce",
  // verbes auxiliaires/communs
  "est","sont","était","étaient","sera","seront","été","être","a","ai","as","ont","avait","avaient","aura","auront","eu","avoir",
  "fait","faire","peut","peuvent","va","vont","allait",
  // adverbes
  "pas","plus","très","trop","bien","tout","tous","toute","toutes","aussi","encore","déjà","jamais","toujours","ici","là","oui","non","ne",
  // chiffres écrits
  "un","deux","trois",
  // bruit pub typique
  "www","http","https","com","fr","jpg","png",
]);

// GET /api/veille/mots-cles?days=90&limit=50
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const role = (session.user as { role?: string }).role;
  if (!role || !ALLOWED_ROLES.has(role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const days = Math.max(1, Math.min(parseInt(req.nextUrl.searchParams.get("days") || "90", 10), 365));
  const limit = Math.max(10, Math.min(parseInt(req.nextUrl.searchParams.get("limit") || "50", 10), 200));

  const dateMin = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const pubs = await prisma.pubConcurrent.findMany({
    where: { dateDebut: { gte: dateMin } },
    select: { texte: true, titre: true, caption: true },
  });

  const counts = new Map<string, number>();
  for (const p of pubs) {
    const raw = [p.texte, p.titre, p.caption].filter(Boolean).join(" ");
    if (!raw) continue;
    const tokens = tokenize(raw);
    for (const t of tokens) counts.set(t, (counts.get(t) ?? 0) + 1);
  }

  const mots = Array.from(counts.entries())
    .filter(([, n]) => n >= 2) // au moins 2 occurrences pour être listé
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([mot, count]) => ({ mot, count }));

  return NextResponse.json({
    success: true,
    mots,
    totalPubs: pubs.length,
    periodeJours: days,
  });
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    // normalise accents composés
    .normalize("NFC")
    // remplace toute ponctuation/espace par un séparateur
    .replace(/[^a-zàâäéèêëïîôöùûüç-]+/gi, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => {
      if (w.length < 3) return false;          // trop court
      if (/^\d+$/.test(w)) return false;       // chiffres purs
      if (STOP_WORDS.has(w)) return false;
      return true;
    });
}
