import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sellsyFetch } from "@/lib/sellsy";
import { getSellsyUrl } from "@/lib/sellsy-urls";
import { parseBcdiRefs } from "@/lib/sav-bcdi";
import { traduireStatut } from "@/lib/sellsy-statuts";

/**
 * GET /api/sav/[id]/sellsy
 *
 * Résout à la volée les liens Sellsy d'un dossier SAV :
 *  - parse les BCDI du champ `sellsyBdcRef` (texte libre, tolérant)
 *  - cherche chaque commande Sellsy (par numéro) → statut + client
 *  - détecte les AVOIRS (notes de crédit) du client (= remboursement).
 *    ⚠ Un avoir est rattaché au CLIENT (individual/contact), pas au BCDI.
 *    On signale → la mise en « traité » reste un clic manuel (semi-auto).
 */

interface SellsyOrderLite {
  id: number;
  number: string;
  status: string;
  amounts?: { total_incl_tax?: string };
  contact_id?: number;
  related?: Array<{ id: number; type: string }>;
  _embed?: { company?: { id: number }; contact?: { id: number } };
}

interface SellsyCreditNote {
  id: number;
  number?: string;
  status?: string;
  created?: string;
  date?: string;
  amounts?: { total_incl_tax?: string };
  related?: Array<{ id: number; type: string }>;
}

// Cache mémoire des avoirs (scan global — filtres Sellsy non fiables)
let avoirsCache: { data: SellsyCreditNote[]; expires: number } | null = null;
const AVOIRS_TTL_MS = 10 * 60 * 1000;

async function getAllAvoirs(): Promise<SellsyCreditNote[]> {
  if (avoirsCache && Date.now() < avoirsCache.expires) return avoirsCache.data;
  const all: SellsyCreditNote[] = [];
  const PAGE = 100;
  let offset = 0;
  let total = Infinity;
  let pages = 0;
  while (offset < total && pages < 20) {
    const res = await sellsyFetch<{ data: SellsyCreditNote[]; pagination?: { total?: number } }>(
      `/credit-notes/search?limit=${PAGE}&offset=${offset}`,
      { method: "POST", body: JSON.stringify({ filters: {} }) }
    );
    total = res.pagination?.total ?? 0;
    all.push(...(res.data || []));
    if (!res.data || res.data.length === 0) break;
    offset += PAGE;
    pages++;
  }
  avoirsCache = { data: all, expires: Date.now() + AVOIRS_TTL_MS };
  return all;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const dossier = await prisma.dossierSAV.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, sellsyBdcRef: true, sellsyContactId: true, createdAt: true },
  });
  if (!dossier) return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 });

  const refs = parseBcdiRefs(dossier.sellsyBdcRef);

  // 1) Résolution des commandes par numéro + collecte des ids client
  const clientIds = new Set<number>();
  if (dossier.sellsyContactId) {
    for (const part of dossier.sellsyContactId.split(",")) {
      const n = Number(part.trim());
      if (Number.isFinite(n)) clientIds.add(n);
    }
  }

  const bcdis = await Promise.all(
    refs.map(async (ref) => {
      try {
        const search = await sellsyFetch<{ data: SellsyOrderLite[] }>(
          `/orders/search?limit=1&embed[]=contact&embed[]=company`,
          { method: "POST", body: JSON.stringify({ filters: { number: ref } }) }
        );
        const order = search.data?.[0];
        if (!order) return { ref, found: false as const };
        if (order.contact_id) clientIds.add(order.contact_id);
        if (order._embed?.contact?.id) clientIds.add(order._embed.contact.id);
        if (order._embed?.company?.id) clientIds.add(order._embed.company.id);
        for (const r of order.related || []) clientIds.add(r.id);
        return {
          ref,
          found: true as const,
          orderId: order.id,
          status: order.status,
          statutLabel: traduireStatut(order.status),
          totalTTC: Number(order.amounts?.total_incl_tax || 0),
          url: getSellsyUrl("order", order.id),
        };
      } catch {
        return { ref, found: false as const };
      }
    })
  );

  // 2) Avoirs du client (= remboursement)
  let avoirs: Array<{ number: string; solde: boolean; statut: string | null; date: string | null; montantTTC: number; apresOuverture: boolean }> = [];
  if (clientIds.size > 0) {
    try {
      const all = await getAllAvoirs();
      avoirs = all
        .filter((a) => (a.related || []).some((r) => clientIds.has(r.id)))
        .map((a) => {
          const dateStr = a.created || a.date || null;
          const date = dateStr ? new Date(dateStr) : null;
          return {
            number: a.number || `AVR-${a.id}`,
            solde: (a.status || "").toLowerCase() === "spent",
            statut: a.status || null,
            date: dateStr,
            montantTTC: Number(a.amounts?.total_incl_tax || 0),
            apresOuverture: !!date && date >= new Date(dossier.createdAt),
          };
        })
        .sort((x, y) => (y.date || "").localeCompare(x.date || ""));
    } catch {
      /* tolère */
    }
  }

  const refundDetected = avoirs.length > 0;
  const suggestedTraite = avoirs.some((a) => a.apresOuverture);

  return NextResponse.json({
    bcdis,
    avoirs,
    refundDetected,
    suggestedTraite,
    clientIdsCount: clientIds.size,
  });
}
