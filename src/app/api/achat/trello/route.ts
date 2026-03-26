import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const TRELLO_KEY = process.env.TRELLO_API_KEY || "";
const TRELLO_TOKEN = process.env.TRELLO_TOKEN || "";
const TRELLO_BOARD_ID = process.env.TRELLO_BOARD_ID || "";

// Cache 5 minutes
let cache: { data: any; ts: number } | null = null;
const CACHE_MS = 5 * 60 * 1000;

// Ordre des colonnes pour le suivi (du début à la fin)
const COLUMN_ORDER = [
  "BCDI",
  "Questions Asked",
  "Check 1 @Carpenter",
  "Check 2 @Carpenter",
  "Check 3 @Carpenter",
  "In Warehouse",
  "Finishing",
  "Ready to Sent",
  "Sent",
];

const COLUMN_STYLES: Record<string, { color: string; bg: string }> = {
  "BCDI": { color: "#6B7280", bg: "#F3F4F6" },
  "Questions Asked": { color: "#D97706", bg: "#FEF3C7" },
  "Check 1 @Carpenter": { color: "#2563EB", bg: "#DBEAFE" },
  "Check 2 @Carpenter": { color: "#2563EB", bg: "#DBEAFE" },
  "Check 3 @Carpenter": { color: "#2563EB", bg: "#DBEAFE" },
  "In Warehouse": { color: "#7C3AED", bg: "#EDE9FE" },
  "Finishing": { color: "#D97706", bg: "#FEF3C7" },
  "Ready to Sent": { color: "#059669", bg: "#D1FAE5" },
  "Sent": { color: "#059669", bg: "#D1FAE5" },
  "Cancelled BCDI": { color: "#DC2626", bg: "#FEE2E2" },
  "Problems on furniture": { color: "#DC2626", bg: "#FEE2E2" },
  "Pending BCDI": { color: "#6B7280", bg: "#F3F4F6" },
};

/**
 * GET /api/achat/trello?search=DUPONT
 * Lecture seule — récupère les cartes du tableau BCDI avec cache 5min.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  if (!TRELLO_KEY || !TRELLO_TOKEN || !TRELLO_BOARD_ID) {
    return NextResponse.json({ error: "Trello non configuré" }, { status: 500 });
  }

  const search = req.nextUrl.searchParams.get("search")?.toLowerCase().trim();

  // Vérifier le cache
  if (!cache || Date.now() - cache.ts > CACHE_MS) {
    const base = `https://api.trello.com/1/boards/${TRELLO_BOARD_ID}`;
    const auth = `key=${TRELLO_KEY}&token=${TRELLO_TOKEN}`;

    const [listsRes, cardsRes] = await Promise.all([
      fetch(`${base}/lists?${auth}&fields=name`),
      fetch(`${base}/cards?${auth}&fields=name,idList,labels,due,dateLastActivity&limit=500`),
    ]);

    if (!listsRes.ok || !cardsRes.ok) {
      return NextResponse.json({ error: "Erreur API Trello" }, { status: 502 });
    }

    const lists = await listsRes.json();
    const cards = await cardsRes.json();

    // Map list ID → name
    const listMap = new Map<string, string>();
    for (const l of lists) listMap.set(l.id, l.name);

    // Enrichir les cartes
    const enriched = cards.map((c: any) => {
      const listName = listMap.get(c.idList) || "Inconnu";
      const style = COLUMN_STYLES[listName] || { color: "#6B7280", bg: "#F3F4F6" };
      const step = COLUMN_ORDER.indexOf(listName);

      // Extraire réf BCDI et nom client depuis le nom de la carte
      const match = c.name.match(/^(BCDI-\d+)\s+(.+)$/i);
      const ref = match?.[1] || c.name;
      const client = match?.[2] || "";

      return {
        id: c.id,
        name: c.name,
        ref,
        client,
        statut: listName,
        step: step >= 0 ? step : -1,
        maxSteps: COLUMN_ORDER.length,
        style,
        due: c.due,
        lastActivity: c.dateLastActivity,
      };
    });

    cache = { data: { lists: Array.from(listMap.entries()).map(([id, name]) => ({ id, name })), cards: enriched }, ts: Date.now() };
  }

  let cards = cache.data.cards;

  // Filtre recherche
  if (search) {
    cards = cards.filter((c: any) =>
      c.name.toLowerCase().includes(search) ||
      c.ref.toLowerCase().includes(search) ||
      c.client.toLowerCase().includes(search)
    );
  }

  return NextResponse.json({
    total: cards.length,
    cards,
    lists: cache.data.lists,
    cachedAt: new Date(cache.ts).toISOString(),
  });
}
