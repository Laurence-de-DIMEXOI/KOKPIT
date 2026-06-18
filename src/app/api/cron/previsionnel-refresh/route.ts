import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { IMPORTS } from "@/lib/imports-config";
import { refreshBcdiSnapshots } from "@/lib/previsionnel-fetch";

export const maxDuration = 800;
export const dynamic = "force-dynamic";

/**
 * Cron : refresh des snapshots Prévisionnel pour tous les imports.
 * Auth : Bearer CRON_API_SECRET ou UA `vercel-cron`.
 * Query :
 *  - imp=IMP-XXX : limite à un IMP
 *  - force=true : refetch même les snapshots récents
 */
async function run(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const ua = req.headers.get("user-agent") || "";
  const cronSecret = process.env.CRON_API_SECRET;
  const isVercelCron = ua.includes("vercel-cron");
  const isBearerOk = !!cronSecret && auth === `Bearer ${cronSecret}`;
  if (!isVercelCron && !isBearerOk) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const url = new URL(req.url);
  const impFilter = url.searchParams.get("imp");
  const force = url.searchParams.get("force") === "true";

  const started = Date.now();
  const perImp: Record<string, unknown> = {};

  const targets = IMPORTS.filter((i) => !impFilter || i.code === impFilter);
  for (const imp of targets) {
    try {
      const fp = path.join(process.cwd(), "public", "data", imp.dataFile);
      // En local le cwd est ok ; en prod Vercel ça sera /var/task/public/data
      // Fallback HTTP si lecture FS échoue (le cron tourne aussi côté serveur)
      let packing: { items: Array<{ bcdi: string }> };
      try {
        const raw = await fs.readFile(fp, "utf-8");
        packing = JSON.parse(raw);
      } catch {
        const origin = new URL(req.url).origin;
        const r = await fetch(`${origin}/data/${imp.dataFile}`, { cache: "no-store" });
        packing = await r.json();
      }
      const bcdis = Array.from(
        new Set(packing.items.map((i) => i.bcdi).filter((b) => b.startsWith("BCDI")))
      );
      const result = await refreshBcdiSnapshots(bcdis, {
        forceAll: force,
        maxAgeMs: 30 * 60 * 1000,
      });
      perImp[imp.code] = { totalBcdis: bcdis.length, ...result };
    } catch (e) {
      perImp[imp.code] = { error: (e as Error).message };
    }
  }

  return NextResponse.json({
    ok: true,
    elapsedMs: Date.now() - started,
    perImp,
  });
}

export async function GET(req: NextRequest) {
  return run(req);
}

export async function POST(req: NextRequest) {
  return run(req);
}
