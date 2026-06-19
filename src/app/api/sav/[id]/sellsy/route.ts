import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sellsyFetch, sellsyV1Call } from "@/lib/sellsy";
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

// ── Chaîne documentaire : remonter un avoir jusqu'à son BCDI ────────
// L'avoir est rattaché au client en V2, mais la chaîne Sellsy le relie au BCDI :
//   avoir (creditnote) → facture (FAPJ) → [BDL] → commande (BCDI).
// On remonte via parentid (V1 Document.getOne), en biaisant le doctype d'après
// le préfixe d'ident pour limiter les appels. Cache mémoire (docs immuables).
const docNodeCache = new Map<string, { ident: string; parentid: string | null } | null>();

function parentDoctypes(ident: string): string[] {
  const i = ident.toUpperCase();
  if (i.startsWith("AVR")) return ["invoice"];
  if (i.startsWith("FAPJ") || i.startsWith("FACT")) return ["order", "delivery"];
  if (i.startsWith("BDL") || i.startsWith("BL")) return ["order"];
  if (i.startsWith("BCDI")) return []; // déjà la commande
  return ["order", "invoice", "delivery", "estimate"];
}

async function getDocNode(
  id: string,
  doctypes: string[]
): Promise<{ ident: string; parentid: string | null } | null> {
  if (docNodeCache.has(id)) return docNodeCache.get(id)!;
  for (const dt of doctypes) {
    try {
      const v1 = (await sellsyV1Call("Document.getOne", { doctype: dt, docid: id })) as {
        ident?: string;
        parentid?: string | number;
      };
      if (v1 && v1.ident) {
        const node = {
          ident: v1.ident,
          parentid: v1.parentid && Number(v1.parentid) > 0 ? String(v1.parentid) : null,
        };
        docNodeCache.set(id, node);
        return node;
      }
    } catch {
      /* mauvais doctype → suivant */
    }
  }
  docNodeCache.set(id, null);
  return null;
}

/** Remonte la chaîne depuis un avoir et renvoie le n° de BCDI racine (ou null). */
async function avoirToBcdi(avoirId: string): Promise<string | null> {
  // 1er niveau : l'avoir lui-même (creditnote)
  let node = await getDocNode(avoirId, ["creditnote"]);
  let hops = 0;
  while (node && hops < 6) {
    if (/^BCDI-/i.test(node.ident)) return node.ident.toUpperCase();
    if (!node.parentid) return null;
    node = await getDocNode(node.parentid, parentDoctypes(node.ident));
    hops++;
  }
  return null;
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

  // 2) Avoirs du client (= remboursement), puis confirmation par la chaîne BCDI
  const refsSet = new Set(refs.map((r) => r.toUpperCase()));
  let avoirs: Array<{
    number: string;
    solde: boolean;
    statut: string | null;
    date: string | null;
    montantTTC: number;
    apresOuverture: boolean;
    linkedBcdi: string | null;
    matchesSav: boolean;
  }> = [];
  if (clientIds.size > 0) {
    try {
      const all = await getAllAvoirs();
      const candidates = all
        .filter((a) => (a.related || []).some((r) => clientIds.has(r.id)))
        .sort((x, y) => (y.created || y.date || "").localeCompare(x.created || x.date || ""));
      avoirs = await Promise.all(
        candidates.map(async (a) => {
          const dateStr = a.created || a.date || null;
          const date = dateStr ? new Date(dateStr) : null;
          // Remonte la chaîne pour relier l'avoir au BCDI exact (si possible)
          let linkedBcdi: string | null = null;
          try {
            linkedBcdi = await avoirToBcdi(String(a.id));
          } catch {
            /* tolère */
          }
          return {
            number: a.number || `AVR-${a.id}`,
            solde: (a.status || "").toLowerCase() === "spent",
            statut: a.status || null,
            date: dateStr,
            montantTTC: Number(a.amounts?.total_incl_tax || 0),
            apresOuverture: !!date && date >= new Date(dossier.createdAt),
            linkedBcdi,
            matchesSav: !!linkedBcdi && refsSet.has(linkedBcdi),
          };
        })
      );
      // Avoirs reliés à un BCDI du SAV en premier
      avoirs.sort((x, y) => Number(y.matchesSav) - Number(x.matchesSav));
    } catch {
      /* tolère */
    }
  }

  const refundDetected = avoirs.length > 0;
  // Suggestion forte si un avoir est relié à un BCDI de ce SAV ; sinon faible (client + après ouverture)
  const suggestedTraite =
    avoirs.some((a) => a.matchesSav) || avoirs.some((a) => a.apresOuverture);

  return NextResponse.json({
    bcdis,
    avoirs,
    refundDetected,
    suggestedTraite,
    clientIdsCount: clientIds.size,
  });
}
