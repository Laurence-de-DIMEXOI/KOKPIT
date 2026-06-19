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

/** Mois courant + 1 → prochaine échéance de chargement par défaut (YYYY-MM). */
function defaultMoisCible(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
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
  // Mois cible = prochaine échéance de chargement. Tous les mois théoriques
  // <= moisCible sont consolidés dans ce tab (rattrapage du backlog).
  const moisCible = url.searchParams.get("moisCible") || defaultMoisCible();

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
  const IMP618_MONTH = "2026-06"; // IMP-618 est parti en juin 2026

  const buckets = new Map<string, ResItem[]>();
  const sansDate: ResItem[] = [];
  const horsScope: ResItem[] = []; // datés mais avant `since` (vieux/stale)

  for (const r of rows) {
    const forcedStock = r.forcedType === "stock";
    const etat = r.sellsyOrderId ? etatByOrderId.get(String(r.sellsyOrderId)) ?? null : null;
    const dansImp618 = imp618.has(r.bcdi.toUpperCase());
    const moisTheorique = r.dateCommande ? moisChargementKey(r.dateCommande, params) : null;
    const item: ResItem = {
      bcdi: r.bcdi,
      client: r.client,
      dateCommande: r.dateCommande ? r.dateCommande.toISOString() : null,
      montantHT: r.montantHT != null ? Number(r.montantHT) : null,
      trelloStatut: r.trelloStatut,
      pret: r.trelloStatut ? TRELLO_READY_LISTS.includes(r.trelloStatut) : false,
      found: r.found,
      isStock: isStockClient(r.client) || forcedStock,
      forcedStock,
      isSav: (etat || "").toUpperCase().includes("SAV"),
      dansImp618,
      bdoBcNumber: r.bdoBcNumber,
      moisTheorique,
      // en retard = mois de chargement théorique déjà passé, et pas encore parti
      retard: !!moisTheorique && moisTheorique < nowKey && !dansImp618,
    };
    if (!r.dateCommande) { sansDate.push(item); continue; }
    if (r.dateCommande < sinceDate) { horsScope.push(item); continue; }
    // Déjà sur l'IMP-618 (parti en juin 2026) → onglet juin 2026 dédié.
    // Sinon : tout ce qui devait charger <= moisCible est consolidé dans moisCible.
    const key = dansImp618
      ? IMP618_MONTH
      : moisTheorique! <= moisCible ? moisCible : moisTheorique!;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(item);
  }

  const months = Array.from(buckets.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, items]) => {
      items.sort((x, y) => {
        // stock en dernier (pas urgent), sinon prêts d'abord, puis plus ancien
        if (x.isStock !== y.isStock) return x.isStock ? 1 : -1;
        if (x.pret !== y.pret) return x.pret ? -1 : 1;
        return (x.dateCommande || "").localeCompare(y.dateCommande || "");
      });
      const imp618Tab = items.length > 0 && items.every((i) => i.dansImp618);
      return {
        key,
        nb: items.length,
        prets: items.filter((i) => i.pret).length,
        urgents: items.filter((i) => !i.isStock).length,
        stock: items.filter((i) => i.isStock).length,
        retards: items.filter((i) => i.retard).length,
        totalHT: Number(items.reduce((s, i) => s + (i.montantHT || 0), 0).toFixed(2)),
        enRetard: key <= nowKey && !imp618Tab,
        rattrapage: key === moisCible && !imp618Tab, // contient le backlog consolidé
        imp618: imp618Tab,
        items,
      };
    });

  return NextResponse.json({
    params,
    nowKey,
    moisCible,
    months,
    sansDate,
    horsScopeCount: horsScope.length,
    total: rows.length,
  });
}
