import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sellsyFetch } from "@/lib/sellsy";
import { normalizeBcdiKey, RESERVOIR_ETATS } from "@/lib/reservoir";
import { extractBcNumber, getOrderBcMap, lookupBoAmountsLocal } from "@/lib/previsionnel-fetch";

export const maxDuration = 800;
export const dynamic = "force-dynamic";

/**
 * Reconstruit le réservoir à partir de SELLSY (source de vérité).
 *
 * Source = commandes (table Vente) dont le custom field "Etat des produit" est
 * SUR COMMANDE / SAV / COMMANDE MAGASIN — c.-à-d. encore à fabriquer / pas
 * encore dans un IMP (EN STOCK = reçu, ARRIVAGE M+x = déjà sur un container →
 * exclus). Trello ne sert plus que de lookup du statut de production (par n°).
 *
 * Pour chaque commande on récupère le n° (BCDI) + nb de meubles (somme des
 * lignes) via l'API Sellsy. Incrémental : on ne re-fetch que les commandes pas
 * encore en cache (sauf ?full=1). Auth : session, ou Bearer CRON_API_SECRET /
 * UA vercel-cron.
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

  const url = new URL(req.url);
  const since = new Date(url.searchParams.get("since") || "2024-01-01");
  const full = url.searchParams.get("full") === "1";

  // 1) Commandes Sellsy à planifier : Vente avec etatProduit dans le périmètre
  const ventesRaw = await prisma.vente.findMany({
    where: { dateVente: { gte: since }, sellsyInvoiceId: { not: null }, etatProduit: { not: null } },
    select: {
      sellsyInvoiceId: true,
      montant: true,
      dateVente: true,
      etatProduit: true,
      contact: { select: { nom: true, prenom: true } },
    },
  });
  const ventes = ventesRaw.filter((v) => RESERVOIR_ETATS.includes((v.etatProduit || "").trim().toUpperCase()));

  // 2) Lookup statut Trello par n° normalisé (indicatif — saisie manuelle Indonésie)
  const trelloByKey = new Map<string, { statut: string; cardId: string }>();
  const KEY = process.env.TRELLO_API_KEY;
  const TOK = process.env.TRELLO_TOKEN;
  const BOARD = process.env.TRELLO_BOARD_ID;
  if (KEY && TOK && BOARD) {
    const tAuth = `key=${KEY}&token=${TOK}`;
    try {
      const lists: Array<{ id: string; name: string }> = await (
        await fetch(`https://api.trello.com/1/boards/${BOARD}/lists?${tAuth}&fields=name`)
      ).json();
      for (const l of lists) {
        const listCards: Array<{ id: string; name: string }> = await (
          await fetch(`https://api.trello.com/1/lists/${l.id}/cards?${tAuth}&fields=name`)
        ).json();
        for (const c of listCards) {
          const k = normalizeBcdiKey(c.name);
          if (k) trelloByKey.set(k, { statut: l.name, cardId: c.id });
        }
      }
    } catch {
      /* Trello indisponible → statut nul, on continue */
    }
  }

  // 3) Cache existant (par order id) pour éviter de re-fetch les lignes
  const existing = await prisma.reservoirBcdi.findMany({
    where: { sellsyOrderId: { not: null } },
    select: { bcdi: true, sellsyOrderId: true, nbMeubles: true, montantHT: true, dateCommande: true, bdoBcNumber: true },
  });
  const cacheByOrderId = new Map<string, (typeof existing)[number]>();
  for (const e of existing) if (e.sellsyOrderId != null) cacheByOrderId.set(String(e.sellsyOrderId), e);

  // 4) Résolution par commande (n° + nb meubles depuis l'API)
  const concurrency = 8;
  let resolved = 0;
  let fetched = 0;
  const seen: string[] = [];
  for (let i = 0; i < ventes.length; i += concurrency) {
    const batch = ventes.slice(i, i + concurrency);
    await Promise.all(
      batch.map(async (v) => {
        const orderId = String(v.sellsyInvoiceId);
        const etatProduit = (v.etatProduit || "").trim().toUpperCase();
        const cached = cacheByOrderId.get(orderId);
        const clientName =
          [v.contact?.prenom, v.contact?.nom].filter(Boolean).join(" ").trim() || null;

        let bcdi = cached?.bcdi || null;
        let nbMeubles: number | null = cached?.nbMeubles ?? null;
        let montantHT: number | null = cached?.montantHT != null ? Number(cached.montantHT) : null;
        let dateCommande: Date | null = cached?.dateCommande ?? v.dateVente;
        let bdoBcNumber: string | null = cached?.bdoBcNumber || null;
        let statutSellsy: string | null = null;

        const needFetch = full || !cached || cached.nbMeubles == null || !bcdi;
        if (needFetch) {
          try {
            const o = await sellsyFetch<{
              id: number; number?: string; date?: string; created?: string; status?: string; subject?: string;
              amounts?: { total_excl_tax?: string }; company_name?: string;
              rows?: Array<{ type?: string; quantity?: string | number }>;
            }>(`/orders/${orderId}`);
            fetched++;
            bcdi = o.number || bcdi || `ORDER-${orderId}`;
            statutSellsy = o.status || null;
            const ds = o.date || o.created;
            if (ds) dateCommande = new Date(ds);
            const amt = o.amounts?.total_excl_tax;
            montantHT = amt != null ? Number(amt) : (v.montant ?? null);
            if (o.rows) nbMeubles = o.rows.reduce((s, r) => s + (Number(r.quantity ?? 0) || 0), 0);
            // Bois d'Orient : commande DIMEXOI à 0€ dont le BC est dans l'objet / un commentaire
            if (montantHT == null || montantHT <= 0) {
              let bc = extractBcNumber(o.subject);
              if (!bc) {
                const map = await getOrderBcMap();
                bc = map.get(o.id) || null;
              }
              if (bc) {
                bdoBcNumber = bc;
                const bo = await lookupBoAmountsLocal(bc);
                if (bo) { montantHT = bo.totalHT; bdoBcNumber = bo.bcNumber; }
              }
            }
          } catch {
            bcdi = bcdi || `ORDER-${orderId}`;
            montantHT = montantHT ?? (v.montant ?? null);
          }
        }
        if (!bcdi) bcdi = `ORDER-${orderId}`;
        seen.push(bcdi);

        const trello = trelloByKey.get(normalizeBcdiKey(bcdi) || "__none__");
        const data = {
          trelloCardId: trello?.cardId || null,
          trelloStatut: trello?.statut || null,
          client: clientName,
          sellsyOrderId: BigInt(orderId),
          dateCommande,
          montantHT,
          nbMeubles,
          statutSellsy,
          etatProduit,
          bdoBcNumber,
          found: true,
          computedAt: new Date(),
        };
        await prisma.reservoirBcdi
          .upsert({ where: { bcdi }, create: { bcdi, ...data }, update: data })
          .then(() => { resolved++; })
          .catch(() => {});
      })
    );
  }

  // 5) Purge des commandes qui ne sont plus dans le périmètre (reçues, arrivage, hors set…)
  const deleted = await prisma.reservoirBcdi.deleteMany({
    where: { bcdi: { notIn: seen.length ? seen : ["__none__"] } },
  });

  return NextResponse.json({
    ok: true,
    source: "sellsy:etatProduit",
    etats: RESERVOIR_ETATS,
    since: since.toISOString().slice(0, 10),
    commandes: ventes.length,
    resolus: resolved,
    fetchSellsy: fetched,
    statutsTrello: trelloByKey.size,
    purges: deleted.count,
  });
}

export async function GET(req: NextRequest) {
  return run(req);
}
export async function POST(req: NextRequest) {
  return run(req);
}
