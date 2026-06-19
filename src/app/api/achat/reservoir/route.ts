import { NextRequest, NextResponse } from "next/server";
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

  const rows = await prisma.reservoirBcdi.findMany({
    orderBy: { dateCommande: "asc" },
  });

  const sinceDate = new Date(since);
  const nowKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;

  const buckets = new Map<string, ResItem[]>();
  const sansDate: ResItem[] = [];
  const horsScope: ResItem[] = []; // datés mais avant `since` (vieux/stale)

  for (const r of rows) {
    const item: ResItem = {
      bcdi: r.bcdi,
      client: r.client,
      dateCommande: r.dateCommande ? r.dateCommande.toISOString() : null,
      montantHT: r.montantHT != null ? Number(r.montantHT) : null,
      trelloStatut: r.trelloStatut,
      pret: r.trelloStatut ? TRELLO_READY_LISTS.includes(r.trelloStatut) : false,
      found: r.found,
    };
    if (!r.dateCommande) { sansDate.push(item); continue; }
    if (r.dateCommande < sinceDate) { horsScope.push(item); continue; }
    const key = moisChargementKey(r.dateCommande, params);
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(item);
  }

  const months = Array.from(buckets.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, items]) => {
      items.sort((x, y) => {
        if (x.pret !== y.pret) return x.pret ? -1 : 1; // prêts d'abord
        return (x.dateCommande || "").localeCompare(y.dateCommande || ""); // puis plus ancien
      });
      return {
        key,
        nb: items.length,
        prets: items.filter((i) => i.pret).length,
        totalHT: Number(items.reduce((s, i) => s + (i.montantHT || 0), 0).toFixed(2)),
        enRetard: key <= nowKey,
        items,
      };
    });

  return NextResponse.json({
    params,
    nowKey,
    months,
    sansDate,
    horsScopeCount: horsScope.length,
    total: rows.length,
  });
}
