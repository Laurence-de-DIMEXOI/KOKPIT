import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TRELLO_READY_LISTS } from "@/lib/reservoir";

export const dynamic = "force-dynamic";

const DEFAULT_IMP = "IMP-619";

/**
 * GET  /api/achat/reservoir/prep?imp=IMP-619
 *   → liste des BCDI dans le container en préparation (joints au réservoir).
 * POST /api/achat/reservoir/prep  { imp?, bcdi, action: "add" | "remove" }
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const imp = new URL(req.url).searchParams.get("imp") || DEFAULT_IMP;
  const prep = await prisma.prepContainerItem.findMany({ where: { impCode: imp } });
  const bcdis = prep.map((p) => p.bcdi);

  const resvByBcdi = new Map(
    (await prisma.reservoirBcdi.findMany({ where: { bcdi: { in: bcdis.length ? bcdis : ["__none__"] } } }))
      .map((r) => [r.bcdi, r])
  );

  const items = prep
    .map((p) => {
      const r = resvByBcdi.get(p.bcdi);
      return {
        bcdi: p.bcdi,
        addedAt: p.addedAt.toISOString(),
        client: r?.client ?? null,
        dateCommande: r?.dateCommande ? r.dateCommande.toISOString() : null,
        montantHT: r?.montantHT != null ? Number(r.montantHT) : null,
        trelloStatut: r?.trelloStatut ?? null,
        pret: r?.trelloStatut ? TRELLO_READY_LISTS.includes(r.trelloStatut) : false,
      };
    })
    .sort((a, b) => (a.dateCommande || "").localeCompare(b.dateCommande || ""));

  return NextResponse.json({
    imp,
    items,
    nb: items.length,
    prets: items.filter((i) => i.pret).length,
    totalHT: Number(items.reduce((s, i) => s + (i.montantHT || 0), 0).toFixed(2)),
    bcdis,
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const userId = (session.user as { id?: string }).id || null;

  const body = await req.json();
  const { bcdi, action } = body as { imp?: string; bcdi?: string; action?: string };
  const imp = body.imp || DEFAULT_IMP;
  if (!bcdi || !["add", "remove"].includes(action || "")) {
    return NextResponse.json({ error: "bcdi et action (add|remove) requis" }, { status: 400 });
  }

  if (action === "add") {
    await prisma.prepContainerItem.upsert({
      where: { impCode_bcdi: { impCode: imp, bcdi } },
      create: { impCode: imp, bcdi, addedBy: userId },
      update: {},
    });
  } else {
    await prisma.prepContainerItem
      .delete({ where: { impCode_bcdi: { impCode: imp, bcdi } } })
      .catch(() => {});
  }
  return NextResponse.json({ ok: true, imp, bcdi, action });
}
