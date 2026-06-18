import { NextRequest, NextResponse } from "next/server";
import { sellsyFetch } from "@/lib/sellsy";
import {
  upsertDocLink,
  upsertInvoicePaid,
  type SellsyDoc,
} from "@/lib/sellsy-webhook-handler";

export const maxDuration = 800;
export const dynamic = "force-dynamic";

/**
 * Cron : pré-remplit SellsyDocLink + SellsyInvoicePaid en scannant les factures
 * et BDL existants. À lancer **une fois** au démarrage du système (les webhooks
 * maintiennent ensuite). Peut être re-lancé pour rattraper d'éventuels gaps.
 *
 * Query params :
 *  - max=N        : nombre max de docs à fetcher par type (défaut 5000)
 *  - perPage=N    : pagination Sellsy (défaut 100)
 *  - kind=invoice : limite au type donné (invoice | delivery), sinon les deux
 *
 * Auth : Bearer CRON_API_SECRET ou UA `vercel-cron`.
 */
async function run(req: NextRequest) {
  const url = new URL(req.url);
  const max = Math.min(Number(url.searchParams.get("max") || 5000), 20000);
  const perPage = Math.min(Number(url.searchParams.get("perPage") || 100), 100);
  const kindParam = url.searchParams.get("kind");
  const auth = req.headers.get("authorization");
  const ua = req.headers.get("user-agent") || "";
  const cronSecret = process.env.CRON_API_SECRET;
  const isVercelCron = ua.includes("vercel-cron");
  const isBearerOk = !!cronSecret && auth === `Bearer ${cronSecret}`;
  if (!isVercelCron && !isBearerOk) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const started = Date.now();
  const counts: Record<string, number> = {};
  const errors: string[] = [];

  const kinds: Array<["invoice" | "delivery", string]> = [];
  if (!kindParam || kindParam === "invoice") {
    kinds.push(["invoice", "/invoices/search"]);
  }
  if (!kindParam || kindParam === "delivery") {
    kinds.push(["delivery", "/delivery-notes/search"]);
  }

  for (const [kind, searchPath] of kinds) {
    let offset: string | undefined;
    let processed = 0;
    let stop = false;
    while (!stop && processed < max) {
      const u = `${searchPath}?limit=${perPage}&order=created&direction=desc${offset ? `&offset=${encodeURIComponent(offset)}` : ""}`;
      try {
        const res = await sellsyFetch<{ data: SellsyDoc[]; pagination?: { offset?: string } }>(
          u,
          { method: "POST", body: JSON.stringify({ filters: {} }) }
        );
        const batch = res.data || [];
        if (batch.length === 0) break;
        for (const d of batch) {
          try {
            await upsertDocLink(kind, d);
            if (kind === "invoice") await upsertInvoicePaid(d);
            processed++;
          } catch (e) {
            errors.push(`${kind}:${d.id}: ${(e as Error).message.slice(0, 80)}`);
          }
        }
        offset = res.pagination?.offset;
        if (!offset || batch.length < perPage) stop = true;
      } catch (e) {
        errors.push(`${kind} fetch: ${(e as Error).message.slice(0, 80)}`);
        stop = true;
      }
    }
    counts[kind] = processed;
  }

  return NextResponse.json({
    ok: true,
    counts,
    errorsCount: errors.length,
    errorsSample: errors.slice(0, 10),
    elapsedMs: Date.now() - started,
  });
}

export async function GET(req: NextRequest) {
  return run(req);
}

export async function POST(req: NextRequest) {
  return run(req);
}
