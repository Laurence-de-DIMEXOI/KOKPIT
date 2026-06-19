import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_RESERVOIR_PARAMS,
  moisChargementKey,
  TRELLO_READY_LISTS,
  departures,
  departureKey,
  CONTAINER_CAPACITY_MEUBLES,
} from "@/lib/reservoir";

export const dynamic = "force-dynamic";

interface ResItem {
  bcdi: string;
  client: string | null;
  dateCommande: string | null;
  montantHT: number | null;
  trelloStatut: string | null;
  pret: boolean;
  found: boolean;
  etatProduit: string | null;
  isStock: boolean;
  forcedStock: boolean;
  isSav: boolean;
  bdoBcNumber: string | null;
  moisTheorique: string | null;
  retard: boolean;
  nbMeubles: number;
}

/**
 * GET /api/achat/reservoir?delaiTotal=9&delaiBateau=1.5&capacite=130
 *
 * Réservoir = commandes Sellsy "SUR COMMANDE" / "SAV" / "COMMANDE MAGASIN"
 * (table reservoir_bcdi, alimentée depuis Sellsy). SUR COMMANDE + SAV sont
 * planifiés dans le calendrier de départs (40ft HC / 6 sem, ~capacité meubles,
 * FIFO sans couper de commande). COMMANDE MAGASIN = section stock à part.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const url = new URL(req.url);
  const delaiTotal = Number(url.searchParams.get("delaiTotal")) || DEFAULT_RESERVOIR_PARAMS.delaiTotalMois;
  const delaiBateau = Number(url.searchParams.get("delaiBateau"));
  const params = {
    delaiTotalMois: delaiTotal,
    delaiBateauMois: Number.isFinite(delaiBateau) && url.searchParams.get("delaiBateau") !== null
      ? delaiBateau
      : DEFAULT_RESERVOIR_PARAMS.delaiBateauMois,
  };
  const capacite = Number(url.searchParams.get("capacite")) || CONTAINER_CAPACITY_MEUBLES;

  const rows = await prisma.reservoirBcdi.findMany({ orderBy: { dateCommande: "asc" } });

  const now = new Date();
  const nowKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // 1) Construit les items (calendrier = SUR COMMANDE + SAV, stock = COMMANDE MAGASIN)
  const calendarItems: ResItem[] = [];
  const stockItems: ResItem[] = [];
  const sansDate: ResItem[] = [];

  for (const r of rows) {
    const etat = (r.etatProduit || "").trim().toUpperCase();
    const forcedStock = r.forcedType === "stock";
    const isStock = etat === "COMMANDE MAGASIN" || forcedStock;
    const isSav = etat === "SAV";
    const moisTheorique = r.dateCommande ? moisChargementKey(r.dateCommande, params) : null;
    const item: ResItem = {
      bcdi: r.bcdi,
      client: r.client,
      dateCommande: r.dateCommande ? r.dateCommande.toISOString() : null,
      montantHT: r.montantHT != null ? Number(r.montantHT) : null,
      trelloStatut: r.trelloStatut,
      pret: r.trelloStatut ? TRELLO_READY_LISTS.includes(r.trelloStatut) : false,
      found: r.found,
      etatProduit: r.etatProduit,
      isStock,
      forcedStock,
      isSav,
      bdoBcNumber: r.bdoBcNumber,
      moisTheorique,
      retard: !!moisTheorique && moisTheorique < nowKey,
      nbMeubles: r.nbMeubles != null && r.nbMeubles > 0 ? r.nbMeubles : 1,
    };
    if (!r.dateCommande) { sansDate.push(item); continue; }
    if (isStock) { stockItems.push(item); continue; }
    calendarItems.push(item);
  }

  // 2) FIFO : plus ancienne commande d'abord
  calendarItems.sort((a, b) => (a.dateCommande || "").localeCompare(b.dateCommande || ""));

  // 3) Calendrier de départs FUTURS (le 1er départ planifiable est le prochain ≥ aujourd'hui)
  const totalMeubles = calendarItems.reduce((s, i) => s + i.nbMeubles, 0);
  const horizon = Math.max(4, Math.ceil(totalMeubles / capacite) + 3);
  const allDeps = departures(horizon + 12);
  const futureDeps = allDeps.filter((d) => d.getTime() >= now.getTime() - 3 * 24 * 3600 * 1000);

  interface Slot { date: Date; items: ResItem[]; meubles: number }
  const slots: Slot[] = futureDeps.map((d) => ({ date: d, items: [], meubles: 0 }));

  let si = 0;
  for (const it of calendarItems) {
    if (!slots[si]) slots.push({ date: futureDeps[si] || allDeps[allDeps.length - 1], items: [], meubles: 0 });
    // si le BCDI ne tient pas dans le slot courant (non vide) → slot suivant
    if (slots[si].items.length > 0 && slots[si].meubles + it.nbMeubles > capacite) {
      si++;
      if (!slots[si]) {
        const next = departures(allDeps.length + (si - futureDeps.length) + 2);
        slots.push({ date: next[next.length - 1], items: [], meubles: 0 });
      }
    }
    slots[si].items.push(it);
    slots[si].meubles += it.nbMeubles;
  }

  const nowTime = now.getTime();
  const departsOut = slots
    .filter((s) => s.items.length > 0)
    .map((s) => ({
      key: departureKey(s.date),
      date: s.date.toISOString(),
      parti: s.date.getTime() < nowTime,
      capacite,
      nbMeubles: s.meubles,
      nb: s.items.length,
      prets: s.items.filter((i) => i.pret).length,
      retards: s.items.filter((i) => i.retard).length,
      totalHT: Number(s.items.reduce((sum, i) => sum + (i.montantHT || 0), 0).toFixed(2)),
      items: s.items,
    }));

  stockItems.sort((a, b) => (a.dateCommande || "").localeCompare(b.dateCommande || ""));

  return NextResponse.json({
    params,
    capacite,
    departs: departsOut,
    stock: stockItems,
    stockMeubles: stockItems.reduce((s, i) => s + i.nbMeubles, 0),
    sansDate,
    horsScopeCount: 0,
    total: rows.length,
  });
}
