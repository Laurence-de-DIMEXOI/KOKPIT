import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sellsyFetch } from "@/lib/sellsy";
import {
  TRELLO_RESERVOIR_LISTS,
  TRELLO_EXCLUDED_LISTS,
  parseTrelloCard,
} from "@/lib/reservoir";

export const maxDuration = 800;
export const dynamic = "force-dynamic";

/**
 * Reconstruit le réservoir : cartes Trello (hors "Sent"/"Cancelled") croisées
 * avec Sellsy (date commande / montant) par n° BCDI. Upsert dans reservoir_bcdi.
 * Auth : session, ou Bearer CRON_API_SECRET / UA vercel-cron.
 */
async function run(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const ua = req.headers.get("user-agent") || "";
  const cronSecret = process.env.CRON_API_SECRET;
  const isCron = ua.includes("vercel-cron") || (!!cronSecret && auth === `Bearer ${cronSecret}`);
  if (!isCron) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const KEY = process.env.TRELLO_API_KEY;
  const TOK = process.env.TRELLO_TOKEN;
  const BOARD = process.env.TRELLO_BOARD_ID;
  if (!KEY || !TOK || !BOARD) {
    return NextResponse.json({ error: "Trello non configuré" }, { status: 500 });
  }
  const tAuth = `key=${KEY}&token=${TOK}`;

  // 1) Listes du board → ids des listes réservoir
  const lists: Array<{ id: string; name: string }> = await (
    await fetch(`https://api.trello.com/1/boards/${BOARD}/lists?${tAuth}&fields=name`)
  ).json();
  const reservoirLists = lists.filter(
    (l) => TRELLO_RESERVOIR_LISTS.includes(l.name) && !TRELLO_EXCLUDED_LISTS.includes(l.name)
  );

  // 2) Cartes de chaque liste réservoir (par liste → évite le plafond global 1000)
  interface Card { bcdi: string; client: string; trelloCardId: string; trelloStatut: string; trelloStep: number }
  const cards: Card[] = [];
  for (const l of reservoirLists) {
    const step = TRELLO_RESERVOIR_LISTS.indexOf(l.name);
    const listCards: Array<{ id: string; name: string }> = await (
      await fetch(`https://api.trello.com/1/lists/${l.id}/cards?${tAuth}&fields=name`)
    ).json();
    for (const c of listCards) {
      const { bcdi, client } = parseTrelloCard(c.name);
      if (!bcdi) continue;
      cards.push({ bcdi, client, trelloCardId: c.id, trelloStatut: l.name, trelloStep: step });
    }
  }
  // dédoublonne par BCDI (garde l'étape la plus avancée)
  const byBcdi = new Map<string, Card>();
  for (const c of cards) {
    const prev = byBcdi.get(c.bcdi);
    if (!prev || c.trelloStep > prev.trelloStep) byBcdi.set(c.bcdi, c);
  }
  const uniqueCards = Array.from(byBcdi.values());

  // 3) Résolution Sellsy par numéro (date / montant / statut)
  const concurrency = 8;
  let resolved = 0;
  const seen: string[] = [];
  for (let i = 0; i < uniqueCards.length; i += concurrency) {
    const batch = uniqueCards.slice(i, i + concurrency);
    await Promise.all(
      batch.map(async (c) => {
        seen.push(c.bcdi);
        let sellsyOrderId: bigint | null = null;
        let dateCommande: Date | null = null;
        let montantHT: number | null = null;
        let statutSellsy: string | null = null;
        try {
          const search = await sellsyFetch<{ data: Array<{ id: number; date?: string; created?: string; status?: string; amounts?: { total_excl_tax?: string } }> }>(
            `/orders/search?limit=1`,
            { method: "POST", body: JSON.stringify({ filters: { number: c.bcdi } }) }
          );
          const o = search.data?.[0];
          if (o) {
            sellsyOrderId = BigInt(o.id);
            const ds = o.date || o.created || null;
            dateCommande = ds ? new Date(ds) : null;
            montantHT = o.amounts?.total_excl_tax != null ? Number(o.amounts.total_excl_tax) : null;
            statutSellsy = o.status || null;
          }
        } catch {
          /* tolère — Trello indicatif, on garde la carte sans Sellsy */
        }
        const data = {
          trelloCardId: c.trelloCardId,
          trelloStatut: c.trelloStatut,
          trelloStep: c.trelloStep,
          client: c.client || null,
          sellsyOrderId,
          dateCommande,
          montantHT,
          statutSellsy,
          found: sellsyOrderId != null,
          computedAt: new Date(),
        };
        await prisma.reservoirBcdi
          .upsert({ where: { bcdi: c.bcdi }, create: { bcdi: c.bcdi, ...data }, update: data })
          .then(() => { if (sellsyOrderId != null) resolved++; })
          .catch(() => {});
      })
    );
  }

  // 4) Purge des BCDI qui ne sont plus dans le réservoir (ex: passés en "Sent")
  const deleted = await prisma.reservoirBcdi.deleteMany({
    where: { bcdi: { notIn: seen.length ? seen : ["__none__"] } },
  });

  return NextResponse.json({
    ok: true,
    listesReservoir: reservoirLists.map((l) => l.name),
    cartes: uniqueCards.length,
    resolusSellsy: resolved,
    purges: deleted.count,
  });
}

export async function GET(req: NextRequest) {
  return run(req);
}
export async function POST(req: NextRequest) {
  return run(req);
}
