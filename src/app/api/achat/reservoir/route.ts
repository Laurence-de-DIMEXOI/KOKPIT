import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_RESERVOIR_PARAMS,
  moisChargementKey,
  dateChargement,
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

// Contenu de l'IMP-618 (parti le 14 juin 2026) — lu depuis le packing JSON
// enrichi (client / montant / date via Sellsy, généré hors-ligne une fois).
// Repli sur le JSON brut (bcdi + qty) si l'enrichi est absent.
async function loadImp618(origin: string): Promise<ResItem[]> {
  const readJson = async (file: string): Promise<any | null> => {
    try {
      const fp = path.join(process.cwd(), "public", "data", file);
      try { return JSON.parse(await fs.readFile(fp, "utf-8")); }
      catch { return JSON.parse(await (await fetch(`${origin}/data/${file}`, { cache: "no-store" })).text()); }
    } catch { return null; }
  };
  const mk = (o: Partial<ResItem> & { bcdi: string; nbMeubles: number }): ResItem => ({
    client: null, dateCommande: null, montantHT: null, trelloStatut: "Sent", pret: true,
    found: true, etatProduit: null, isStock: false, forcedStock: false, isSav: false,
    bdoBcNumber: null, moisTheorique: null, retard: false, ...o,
  });

  const enr = await readJson("container-caau9910103-enriched.json");
  if (enr?.items?.length) {
    return enr.items.map((it: { bcdi: string; nbMeubles?: number; client?: string | null; montantHT?: number | null; dateCommande?: string | null; bdoBcNumber?: string | null }) =>
      mk({ bcdi: it.bcdi, nbMeubles: it.nbMeubles && it.nbMeubles > 0 ? it.nbMeubles : 1, client: it.client ?? null, montantHT: it.montantHT ?? null, dateCommande: it.dateCommande ?? null, bdoBcNumber: it.bdoBcNumber ?? null }));
  }
  // Repli : JSON brut agrégé par BCDI
  const json = await readJson("container-caau9910103.json");
  if (!json?.items) return [];
  const byBcdi = new Map<string, number>();
  for (const it of json.items as Array<{ bcdi?: string; qty?: number }>) {
    if (!it.bcdi) continue;
    byBcdi.set(it.bcdi.toUpperCase(), (byBcdi.get(it.bcdi.toUpperCase()) || 0) + (Number(it.qty ?? 1) || 1));
  }
  return [...byBcdi.entries()].map(([bcdi, nb]) => mk({ bcdi, nbMeubles: nb }));
}

/**
 * GET /api/achat/reservoir?delaiTotal=9&delaiBateau=1.5&capacite=130
 *
 * Réservoir = pipeline Trello (table reservoir_bcdi). Onglet 0 = IMP-618 (parti
 * le 14 juin, depuis le packing JSON). Onglets suivants = départs futurs (40ft
 * HC / 6 sem) remplis FIFO ≤ capacité meubles, sans couper de commande.
 * COMMANDE MAGASIN = section stock à part.
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

  const [rows, expeditions, imp618Items] = await Promise.all([
    prisma.reservoirBcdi.findMany({ orderBy: { dateCommande: "asc" } }),
    prisma.impExpedition.findMany({ select: { bcdi: true } }),
    loadImp618(url.origin),
  ]);
  const shipped = new Set(expeditions.map((e) => e.bcdi.toUpperCase()));

  const now = new Date();

  // 1) Items du réservoir (calendrier vs stock magasin)
  const calendarItems: ResItem[] = [];
  const stockItems: ResItem[] = [];
  const sansDate: ResItem[] = [];
  let dejaExpedies = 0;

  for (const r of rows) {
    const etat = (r.etatProduit || "").trim().toUpperCase();
    const isSav = etat === "SAV";
    // Filet de sécurité : déjà parti dans un IMP (reçu) et pas un SAV → exclu
    if (!isSav && shipped.has(r.bcdi.toUpperCase())) { dejaExpedies++; continue; }
    const forcedStock = r.forcedType === "stock";
    const isStock = etat === "COMMANDE MAGASIN" || forcedStock;
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
      retard: false, // calculé après affectation au départ (retard projeté)
      nbMeubles: r.nbMeubles != null && r.nbMeubles > 0 ? r.nbMeubles : 1,
    };
    if (isStock) { stockItems.push(item); continue; }
    if (!r.dateCommande) { sansDate.push(item); }
    calendarItems.push(item);
  }

  // 2) FIFO : plus ancienne commande d'abord (sans date → en fin)
  calendarItems.sort((a, b) => (a.dateCommande || "9999").localeCompare(b.dateCommande || "9999"));

  // 3) Calendrier : slot 0 = IMP-618 (14 juin, parti) ; slots suivants = futurs
  const totalMeubles = calendarItems.reduce((s, i) => s + i.nbMeubles, 0);
  const horizon = Math.max(4, Math.ceil(totalMeubles / capacite) + 3);
  const deps = departures(horizon + 2); // [0] = 14 juin = IMP-618
  interface Slot { date: Date; items: ResItem[]; meubles: number; isImp618?: boolean }
  const slots: Slot[] = deps.map((d) => ({ date: d, items: [], meubles: 0 }));
  slots[0].items = imp618Items;
  slots[0].meubles = imp618Items.reduce((s, i) => s + i.nbMeubles, 0);
  slots[0].isImp618 = true;

  let si = 1;
  for (const it of calendarItems) {
    if (!slots[si]) slots.push({ date: deps[deps.length - 1], items: [], meubles: 0 });
    if (slots[si].items.length > 0 && slots[si].meubles + it.nbMeubles > capacite) {
      si++;
      if (!slots[si]) {
        const more = departures(deps.length + (si - deps.length) + 2);
        slots.push({ date: more[more.length - 1], items: [], meubles: 0 });
      }
    }
    // Retard projeté : la commande sera-t-elle chargée APRÈS sa date limite ?
    // (date départ assigné > date commande + délai cible de chargement)
    if (it.dateCommande) {
      const limite = dateChargement(new Date(it.dateCommande), params);
      it.retard = slots[si].date.getTime() > limite.getTime();
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
      isImp618: !!s.isImp618,
      parti: s.date.getTime() < nowTime,
      capacite,
      nbMeubles: s.meubles,
      nb: s.items.length,
      prets: s.items.filter((i) => i.pret).length,
      retards: s.items.filter((i) => i.retard).length,
      totalHT: Number(s.items.reduce((sum, i) => sum + (i.montantHT || 0), 0).toFixed(2)),
      items: s.items,
    }));

  stockItems.sort((a, b) => (a.dateCommande || "9999").localeCompare(b.dateCommande || "9999"));

  return NextResponse.json({
    params,
    capacite,
    departs: departsOut,
    stock: stockItems,
    stockMeubles: stockItems.reduce((s, i) => s + i.nbMeubles, 0),
    sansDate,
    horsScopeCount: 0,
    dejaExpedies,
    total: rows.length,
  });
}
