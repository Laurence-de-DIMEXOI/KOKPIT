import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
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
  isStock: boolean;
  forcedStock: boolean;
  isSav: boolean;
  dansImp618: boolean;
  bdoBcNumber: string | null;
  moisTheorique: string | null;
  retard: boolean;
  nbMeubles: number;
}

// Commande "stock magasin" (pas urgente) : client interne.
function isStockClient(client: string | null): boolean {
  if (!client) return false;
  const c = client.trim().toUpperCase();
  return /^(STOCK|ORDER\s+FOR\s+SHOP|ORDER\s+DIMEXOI|DIMEXOI|EXHIBITION)/.test(c);
}

// BCDI déjà chargés dans l'IMP-618 (container en mer) — lus depuis le packing JSON.
async function loadImp618Bcdis(origin: string): Promise<Set<string>> {
  const set = new Set<string>();
  try {
    let raw: string;
    const fp = path.join(process.cwd(), "public", "data", "container-caau9910103.json");
    try {
      raw = await fs.readFile(fp, "utf-8");
    } catch {
      raw = await (await fetch(`${origin}/data/container-caau9910103.json`, { cache: "no-store" })).text();
    }
    const json = JSON.parse(raw) as { items?: Array<{ bcdi?: string }> };
    for (const it of json.items || []) {
      if (it.bcdi) set.add(it.bcdi.toUpperCase());
    }
  } catch {
    /* tolère */
  }
  return set;
}

/**
 * GET /api/achat/reservoir?delaiTotal=6&delaiBateau=1.5&since=2024-01-01
 *
 * Renvoie le réservoir (reservoir_bcdi) regroupé par MOIS DE CHARGEMENT
 * (= date commande + (délai total − bateau)). Les paramètres de délai sont
 * ajustables via query. Tri : prêts d'abord, puis plus ancienne commande.
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
  const since = url.searchParams.get("since") || "2024-01-01";

  const [rows, imp618] = await Promise.all([
    prisma.reservoirBcdi.findMany({ orderBy: { dateCommande: "asc" } }),
    loadImp618Bcdis(url.origin),
  ]);

  // etatProduit depuis la table Vente (jointure par id de commande Sellsy)
  const orderIds = rows.map((r) => r.sellsyOrderId).filter(Boolean).map((id) => String(id));
  const etatByOrderId = new Map<string, string | null>();
  if (orderIds.length) {
    const ventes = await prisma.vente.findMany({
      where: { sellsyInvoiceId: { in: orderIds } },
      select: { sellsyInvoiceId: true, etatProduit: true },
    });
    for (const v of ventes) if (v.sellsyInvoiceId) etatByOrderId.set(v.sellsyInvoiceId, v.etatProduit);
  }

  const sinceDate = new Date(since);
  const nowKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
  const capacite = Number(url.searchParams.get("capacite")) || CONTAINER_CAPACITY_MEUBLES;

  // 1) Construit tous les items (avec nb meubles, flags)
  const imp618Items: ResItem[] = [];
  const clientItems: ResItem[] = [];
  const stockItems: ResItem[] = [];
  const sansDate: ResItem[] = [];
  let horsScopeCount = 0;

  for (const r of rows) {
    const forcedStock = r.forcedType === "stock";
    const etat = r.sellsyOrderId ? etatByOrderId.get(String(r.sellsyOrderId)) ?? null : null;
    const dansImp618 = imp618.has(r.bcdi.toUpperCase());
    const moisTheorique = r.dateCommande ? moisChargementKey(r.dateCommande, params) : null;
    const isStock = isStockClient(r.client) || forcedStock;
    const item: ResItem = {
      bcdi: r.bcdi,
      client: r.client,
      dateCommande: r.dateCommande ? r.dateCommande.toISOString() : null,
      montantHT: r.montantHT != null ? Number(r.montantHT) : null,
      trelloStatut: r.trelloStatut,
      pret: r.trelloStatut ? TRELLO_READY_LISTS.includes(r.trelloStatut) : false,
      found: r.found,
      isStock,
      forcedStock,
      isSav: (etat || "").toUpperCase().includes("SAV"),
      dansImp618,
      bdoBcNumber: r.bdoBcNumber,
      moisTheorique,
      retard: !!moisTheorique && moisTheorique < nowKey && !dansImp618,
      nbMeubles: r.nbMeubles != null && r.nbMeubles > 0 ? r.nbMeubles : 1,
    };
    if (dansImp618) { imp618Items.push(item); continue; }
    if (!r.dateCommande) { sansDate.push(item); continue; }
    if (r.dateCommande < sinceDate) { horsScopeCount++; continue; }
    if (isStock) { stockItems.push(item); continue; }
    clientItems.push(item);
  }

  // 2) Tri prioritaire : plus ancienne commande d'abord (FIFO)
  clientItems.sort((a, b) => (a.dateCommande || "").localeCompare(b.dateCommande || ""));

  // 3) Distribution dans le calendrier de départs (40ft HC /6 sem), ~capacité
  //    meubles par container, sans couper un BCDI.
  const slotCount = Math.max(2, Math.ceil(
    clientItems.reduce((s, i) => s + i.nbMeubles, 0) / capacite
  ) + 2);
  const deps = departures(slotCount + 1); // +1 = slot 0 (IMP-618 déjà parti)
  interface Slot { date: Date; items: ResItem[]; meubles: number }
  const slots: Slot[] = deps.map((d) => ({ date: d, items: [], meubles: 0 }));
  slots[0].items = imp618Items; // IMP-618 (14 juin) = déjà parti
  slots[0].meubles = imp618Items.reduce((s, i) => s + i.nbMeubles, 0);

  let si = 1;
  for (const it of clientItems) {
    // si le BCDI ne tient pas dans le slot courant (et qu'il n'est pas vide) → slot suivant
    if (slots[si].items.length > 0 && slots[si].meubles + it.nbMeubles > capacite) {
      si++;
      if (!slots[si]) slots.push({ date: departures(si + 1)[si], items: [], meubles: 0 });
    }
    slots[si].items.push(it);
    slots[si].meubles += it.nbMeubles;
  }

  const nowTime = Date.now();
  const departsOut = slots
    .filter((s) => s.items.length > 0)
    .map((s, idx) => {
      const isImp618 = idx === 0 && s.items.every((i) => i.dansImp618);
      return {
        key: departureKey(s.date),
        date: s.date.toISOString(),
        isImp618,
        parti: s.date.getTime() < nowTime,
        capacite,
        nbMeubles: s.meubles,
        nb: s.items.length,
        prets: s.items.filter((i) => i.pret).length,
        retards: s.items.filter((i) => i.retard).length,
        totalHT: Number(s.items.reduce((sum, i) => sum + (i.montantHT || 0), 0).toFixed(2)),
        items: s.items,
      };
    });

  // Stock magasin : à part (ne compte pas dans les 130 client)
  stockItems.sort((a, b) => (a.dateCommande || "").localeCompare(b.dateCommande || ""));

  return NextResponse.json({
    params,
    capacite,
    departs: departsOut,
    stock: stockItems,
    stockMeubles: stockItems.reduce((s, i) => s + i.nbMeubles, 0),
    sansDate,
    horsScopeCount,
    total: rows.length,
  });
}
