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
import { extractBcNumber, getOrderBcMap, lookupBoAmountsLocal } from "@/lib/previsionnel-fetch";

export const maxDuration = 800;
export const dynamic = "force-dynamic";

/**
 * Reconstruit le réservoir à partir du PIPELINE TRELLO (source de vérité de ce
 * qui n'est pas encore expédié — la colonne bouge dans le workflow quotidien).
 *
 * Réservoir = cartes Trello hors "Sent"/"Cancelled". Pour chaque carte on croise
 * Sellsy par n° BCDI (date / montant / nb meubles / statut) + résolution Bois
 * d'Orient. On enrichit avec l'état produit Sellsy (tag SAV / stock magasin) et
 * on EXCLUT les BCDI déjà partis dans un IMP (packing lists), sauf les SAV.
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

  // 1) Cartes du pipeline Trello (hors Sent/Cancelled), une par BCDI (étape max)
  const lists: Array<{ id: string; name: string }> = await (
    await fetch(`https://api.trello.com/1/boards/${BOARD}/lists?${tAuth}&fields=name`)
  ).json();
  const reservoirLists = lists.filter(
    (l) => TRELLO_RESERVOIR_LISTS.includes(l.name) && !TRELLO_EXCLUDED_LISTS.includes(l.name)
  );
  interface Card { bcdi: string; client: string; trelloCardId: string; trelloStatut: string; trelloStep: number }
  const byBcdi = new Map<string, Card>();
  for (const l of reservoirLists) {
    const step = TRELLO_RESERVOIR_LISTS.indexOf(l.name);
    const cards: Array<{ id: string; name: string }> = await (
      await fetch(`https://api.trello.com/1/lists/${l.id}/cards?${tAuth}&fields=name`)
    ).json();
    for (const c of cards) {
      const { bcdi, client } = parseTrelloCard(c.name);
      if (!bcdi) continue;
      const prev = byBcdi.get(bcdi);
      if (!prev || step > prev.trelloStep) byBcdi.set(bcdi, { bcdi, client, trelloCardId: c.id, trelloStatut: l.name, trelloStep: step });
    }
  }
  const uniqueCards = Array.from(byBcdi.values());

  // 2) Enrichissements locaux : état produit + client Sellsy (tag) + BCDI expédiés
  const [ventes, expeditions] = await Promise.all([
    prisma.vente.findMany({
      where: { sellsyInvoiceId: { not: null } },
      select: { sellsyInvoiceId: true, etatProduit: true, contact: { select: { nom: true, prenom: true } } },
    }),
    prisma.impExpedition.findMany({ select: { bcdi: true } }),
  ]);
  const etatByOrderId = new Map<string, string | null>();
  const clientByOrderId = new Map<string, string>();
  for (const v of ventes) {
    if (!v.sellsyInvoiceId) continue;
    etatByOrderId.set(v.sellsyInvoiceId, v.etatProduit);
    const cn = [v.contact?.prenom, v.contact?.nom].filter(Boolean).join(" ").trim();
    if (cn) clientByOrderId.set(v.sellsyInvoiceId, cn);
  }
  const shipped = new Set(expeditions.map((e) => e.bcdi.toUpperCase()));
  const SINCE = new Date("2025-01-01"); // on ne garde que les commandes Sellsy depuis 2025

  // 3) Résolution Sellsy par n° BCDI
  const concurrency = 8;
  let resolved = 0;
  let exclusDejaExpedies = 0;
  let exclusVieux = 0;
  const seen: string[] = [];
  for (let i = 0; i < uniqueCards.length; i += concurrency) {
    await Promise.all(
      uniqueCards.slice(i, i + concurrency).map(async (c) => {
        let sellsyOrderId: bigint | null = null;
        let dateCommande: Date | null = null;
        let montantHT: number | null = null;
        let statutSellsy: string | null = null;
        let clientName: string | null = c.client || null;
        let bdoBcNumber: string | null = null;
        let nbMeubles: number | null = null;
        let etatProduit: string | null = null;
        try {
          const search = await sellsyFetch<{ data: Array<{ id: number; date?: string; created?: string; status?: string; subject?: string; company_name?: string; amounts?: { total_excl_tax?: string }; rows?: Array<{ quantity?: string | number }> }> }>(
            `/orders/search?limit=1`,
            { method: "POST", body: JSON.stringify({ filters: { number: c.bcdi } }) }
          );
          const o = search.data?.[0];
          if (o) {
            sellsyOrderId = BigInt(o.id);
            etatProduit = etatByOrderId.get(String(o.id)) ?? null;
            // Client = Sellsy (raison sociale, sinon contact) — prioritaire sur la carte Trello
            const sc = (o.company_name || "").trim() || clientByOrderId.get(String(o.id)) || null;
            if (sc) clientName = sc;
            const ds = o.date || o.created || null;
            dateCommande = ds ? new Date(ds) : null;
            montantHT = o.amounts?.total_excl_tax != null ? Number(o.amounts.total_excl_tax) : null;
            statutSellsy = o.status || null;
            try {
              let rows = o.rows;
              if (!rows) rows = (await sellsyFetch<{ rows?: Array<{ quantity?: string | number }> }>(`/orders/${o.id}`)).rows;
              if (rows) nbMeubles = rows.reduce((s, r) => s + (Number(r.quantity ?? 0) || 0), 0);
            } catch { /* tolère */ }
            if (montantHT == null || montantHT <= 0) {
              let bc = extractBcNumber(o.subject);
              if (!bc) { const map = await getOrderBcMap(); bc = map.get(o.id) || null; }
              if (bc) {
                bdoBcNumber = bc;
                const bo = await lookupBoAmountsLocal(bc);
                if (bo) { montantHT = bo.totalHT; bdoBcNumber = bo.bcNumber; if (!clientName && bo.client) clientName = bo.client; }
              }
            }
          }
        } catch { /* Trello indicatif — on garde la carte sans Sellsy */ }

        // On ne garde que les commandes Sellsy depuis 2025 (date connue et antérieure → exclue)
        if (dateCommande && dateCommande < SINCE) { exclusVieux++; return; }
        // Déjà parti dans un IMP (reçu) et pas un SAV → exclu
        if ((etatProduit || "").trim().toUpperCase() !== "SAV" && shipped.has(c.bcdi.toUpperCase())) {
          exclusDejaExpedies++;
          return;
        }
        seen.push(c.bcdi);
        const data = {
          trelloCardId: c.trelloCardId,
          trelloStatut: c.trelloStatut,
          trelloStep: c.trelloStep,
          client: clientName,
          sellsyOrderId,
          dateCommande,
          montantHT,
          nbMeubles,
          statutSellsy,
          etatProduit,
          bdoBcNumber,
          found: sellsyOrderId != null,
          computedAt: new Date(),
        };
        await prisma.reservoirBcdi
          .upsert({ where: { bcdi: c.bcdi }, create: { bcdi: c.bcdi, ...data }, update: data })
          .then(() => { resolved++; })
          .catch(() => {});
      })
    );
  }

  // 4) Purge des BCDI qui ne sont plus dans le pipeline (passés en Sent, etc.)
  const deleted = await prisma.reservoirBcdi.deleteMany({
    where: { bcdi: { notIn: seen.length ? seen : ["__none__"] } },
  });

  return NextResponse.json({
    ok: true,
    source: "trello:pipeline",
    listesReservoir: reservoirLists.map((l) => l.name),
    cartes: uniqueCards.length,
    resolusSellsy: resolved,
    exclusDejaExpedies,
    exclusVieux,
    purges: deleted.count,
  });
}

export async function GET(req: NextRequest) {
  return run(req);
}
export async function POST(req: NextRequest) {
  return run(req);
}
