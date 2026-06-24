import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getEstimate } from "@/lib/sellsy";
import {
  getUniversByCategoryId,
  getUniversFromDescription,
  computeDevisUnivers,
} from "@/data/univers-produit";

export const maxDuration = 800;
export const dynamic = "force-dynamic";

const BATCH_SIZE = 20;
const PAUSE_MS = 200;
const TIME_BUDGET_MS = 12 * 60 * 1000;

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

async function resolveCategory(sellsyItemId: number | null | undefined): Promise<number | null> {
  if (!sellsyItemId) return null;
  const cached = await prisma.$queryRawUnsafe<{ categoryId: number | null }[]>(
    `SELECT "categoryId" FROM sellsy_item_cache WHERE id = $1 LIMIT 1`,
    sellsyItemId
  );
  return cached[0]?.categoryId ?? null;
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const cronHeader = request.headers.get("authorization");
  const isCron =
    cronHeader === `Bearer ${process.env.CRON_API_SECRET}` ||
    request.headers.get("user-agent")?.includes("vercel-cron");

  if (!isCron && session?.user?.role !== "ADMIN" && session?.user?.role !== "DIRECTION") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const startOffset = parseInt(searchParams.get("startOffset") || "0", 10);
  const limit = parseInt(searchParams.get("limit") || "500", 10);

  const startTime = Date.now();
  let processed = 0;
  let enriched = 0;
  let errors = 0;
  let skipped = 0;

  const devisList = await prisma.devis.findMany({
    where: {
      sellsyQuoteId: { not: null },
      lignes: { none: {} },
    },
    select: { id: true, sellsyQuoteId: true },
    orderBy: { createdAt: "desc" },
    skip: startOffset,
    take: limit,
  });

  if (devisList.length === 0) {
    return NextResponse.json({
      success: true,
      message: "Aucun devis à enrichir",
      processed: 0,
      enriched: 0,
    });
  }

  for (let i = 0; i < devisList.length; i += BATCH_SIZE) {
    if (Date.now() - startTime > TIME_BUDGET_MS) {
      return NextResponse.json({
        success: true,
        partial: true,
        processed,
        enriched,
        errors,
        skipped,
        nextOffset: startOffset + processed,
        remaining: devisList.length - processed,
      });
    }

    const batch = devisList.slice(i, i + BATCH_SIZE);

    for (const devis of batch) {
      try {
        const sellsyId = parseInt(devis.sellsyQuoteId!, 10);
        if (isNaN(sellsyId)) {
          skipped++;
          processed++;
          continue;
        }

        const result = await getEstimate(sellsyId);
        const estimate = result as any;
        const rows = estimate?.rows || [];

        if (rows.length === 0) {
          skipped++;
          processed++;
          continue;
        }

        const lignesData: {
          devisId: string;
          sellsyRowId: number | null;
          reference: string | null;
          description: string;
          quantite: number;
          prixUnitaireHT: number;
          montantTTC: number;
          sellsyItemId: number | null;
          categoryId: number | null;
          univers: string | null;
        }[] = [];

        for (const row of rows) {
          if (row.type !== "catalog") continue;

          const sellsyItemId = row.related?.id ?? null;
          const categoryId = await resolveCategory(sellsyItemId);
          const desc = stripHtml(row.description);
          const univers =
            getUniversByCategoryId(categoryId) ??
            getUniversFromDescription(desc);

          lignesData.push({
            devisId: devis.id,
            sellsyRowId: row.id,
            reference: row.reference || null,
            description: desc,
            quantite: parseFloat(row.quantity) || 1,
            prixUnitaireHT: parseFloat(row.unit_amount) || 0,
            montantTTC: parseFloat(row.amount_tax_inc) || 0,
            sellsyItemId,
            categoryId,
            univers,
          });
        }

        if (lignesData.length > 0) {
          const devisUnivers = computeDevisUnivers(lignesData.map((l) => l.univers));

          await prisma.$transaction([
            prisma.devisLigne.createMany({ data: lignesData }),
            prisma.devis.update({
              where: { id: devis.id },
              data: { univers: devisUnivers },
            }),
          ]);

          enriched++;
        } else {
          skipped++;
        }

        processed++;
      } catch (err: any) {
        console.error(`Erreur enrichissement devis ${devis.id}:`, err.message);
        errors++;
        processed++;
      }
    }

    if (i + BATCH_SIZE < devisList.length) {
      await new Promise((r) => setTimeout(r, PAUSE_MS));
    }
  }

  return NextResponse.json({
    success: true,
    processed,
    enriched,
    errors,
    skipped,
    nextOffset: processed < limit ? null : startOffset + processed,
  });
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN" && session?.user?.role !== "DIRECTION") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const [total, enrichis, sansSellsy] = await Promise.all([
    prisma.devis.count(),
    prisma.devis.count({ where: { univers: { not: null } } }),
    prisma.devis.count({ where: { sellsyQuoteId: null } }),
  ]);

  const aEnrichir = await prisma.devis.count({
    where: { sellsyQuoteId: { not: null }, lignes: { none: {} } },
  });

  const universStats = await prisma.devisLigne.groupBy({
    by: ["univers"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
  });

  return NextResponse.json({
    total,
    enrichis,
    aEnrichir,
    sansSellsy,
    universStats: universStats.map((u) => ({
      univers: u.univers || "INCONNU",
      count: u._count.id,
    })),
  });
}
