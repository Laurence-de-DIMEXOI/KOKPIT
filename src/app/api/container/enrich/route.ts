import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sellsyFetch, listStaffs, type SellsyOrder } from "@/lib/sellsy";

/**
 * GET /api/container/enrich?bcdis=BCDI-05057,BCDI-05123,...
 *
 * Pour chaque numéro de BCDI, renvoie :
 *  - client : nom du client
 *  - commercial : "Prénom Nom" (depuis order.owner_id → staff Sellsy)
 *
 * Stratégie :
 *  1. Vente locale (rapide, mais ne couvre que les BDC récents synchronisés).
 *  2. Fallback Sellsy live : POST /orders/search { filters: { number } } embed owner.
 *
 * Cache mémoire 30 min (le contenu d'un container en transit ne bouge pas).
 */

interface EnrichEntry {
  client: string | null;
  commercial: string | null;
  source: "local" | "sellsy" | "none";
}

let cache: { data: Record<string, EnrichEntry>; expires: number } | null = null;
const TTL_MS = 30 * 60 * 1000;

function clientFromVente(v: {
  contact: { nom: string; prenom: string | null } | null;
}): string | null {
  if (!v.contact) return null;
  const name = `${v.contact.prenom || ""} ${v.contact.nom}`.trim();
  return name || null;
}

function clientFromOrder(o: SellsyOrder): string | null {
  const embedContact = o._embed?.contact;
  if (embedContact) {
    const name = `${embedContact.first_name || ""} ${embedContact.last_name || ""}`.trim();
    if (name) return name;
  }
  if (o._embed?.company?.name) return o._embed.company.name;
  if (o.company_name) return o.company_name;
  return null;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const bcdisParam = url.searchParams.get("bcdis") || "";
  const fresh = url.searchParams.get("fresh") === "true";
  const bcdis = Array.from(
    new Set(
      bcdisParam
        .split(",")
        .map((b) => b.trim())
        .filter((b) => b && b.toUpperCase().startsWith("BCDI"))
    )
  );

  if (bcdis.length === 0) return NextResponse.json({ enrich: {} });

  if (!fresh && cache && Date.now() < cache.expires) {
    const subset: Record<string, EnrichEntry> = {};
    for (const b of bcdis) if (cache.data[b]) subset[b] = cache.data[b];
    if (Object.keys(subset).length === bcdis.length) {
      return NextResponse.json({ enrich: subset, cached: true });
    }
  }

  let staffMap = new Map<number, string>();
  try {
    const staffs = await listStaffs();
    staffMap = new Map(
      staffs.map((s) => [s.id, `${s.firstname} ${s.lastname}`.trim()])
    );
  } catch (e) {
    console.warn("[container/enrich] staffs ko:", e);
  }

  const ventes = await prisma.vente.findMany({
    where: { numero: { in: bcdis, mode: "insensitive" } },
    select: {
      numero: true,
      sellsyInvoiceId: true,
      contact: { select: { nom: true, prenom: true } },
    },
  });
  const ventesByBcdi = new Map<string, (typeof ventes)[number]>();
  for (const v of ventes) {
    if (v.numero) ventesByBcdi.set(v.numero.toUpperCase(), v);
  }

  const result: Record<string, EnrichEntry> = {};
  const toSellsy: string[] = [];

  for (const bcdi of bcdis) {
    const v = ventesByBcdi.get(bcdi.toUpperCase());
    if (!v) {
      toSellsy.push(bcdi);
      continue;
    }

    let commercial: string | null = null;
    const client = clientFromVente(v);

    if (v.sellsyInvoiceId) {
      try {
        const res = await sellsyFetch<{ data: SellsyOrder }>(
          `/orders/${v.sellsyInvoiceId}?embed[]=owner`
        );
        const ownerId = res.data?.owner_id ?? res.data?.owner?.id ?? null;
        if (ownerId && staffMap.has(ownerId)) commercial = staffMap.get(ownerId)!;
      } catch {
        /* fallback to Sellsy search ci-dessous */
      }
    }

    if (client && commercial) {
      result[bcdi] = { client, commercial, source: "local" };
    } else {
      // Fallback Sellsy search pour récupérer l'info manquante (souvent le commercial)
      if (client) result[bcdi] = { client, commercial: null, source: "local" };
      toSellsy.push(bcdi);
    }
  }

  // Fallback Sellsy live pour les BCDIs non synchronisés ou incomplets
  // (cap 8 en parallèle pour ménager l'API)
  const CONCURRENCY = 8;
  for (let i = 0; i < toSellsy.length; i += CONCURRENCY) {
    const batch = toSellsy.slice(i, i + CONCURRENCY);
    await Promise.all(
      batch.map(async (bcdi) => {
        try {
          const res = await sellsyFetch<{ data: SellsyOrder[] }>(
            `/orders/search?limit=1&embed[]=owner&embed[]=contact&embed[]=company`,
            {
              method: "POST",
              body: JSON.stringify({ filters: { number: bcdi } }),
            }
          );
          const order = res.data?.[0];
          if (!order) {
            if (!result[bcdi]) {
              result[bcdi] = { client: null, commercial: null, source: "none" };
            }
            return;
          }
          const ownerId = order.owner_id ?? order.owner?.id ?? null;
          const commercial =
            ownerId && staffMap.has(ownerId) ? staffMap.get(ownerId)! : null;
          const prev = result[bcdi];
          result[bcdi] = {
            client: prev?.client || clientFromOrder(order),
            commercial,
            source: "sellsy",
          };
        } catch {
          result[bcdi] = { client: null, commercial: null, source: "none" };
        }
      })
    );
  }

  cache = {
    data: { ...(cache?.data || {}), ...result },
    expires: Date.now() + TTL_MS,
  };

  return NextResponse.json({ enrich: result, cached: false });
}
