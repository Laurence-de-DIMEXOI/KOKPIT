import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/achat/previsionnel/override
 *   body { bcdi, impCode, action, note?, restePayerHT?, totalHT? }
 *
 * Actions :
 *  - "to-stock" : convertit en stock potentiel
 *  - "set-amount" : saisie manuelle reste à payer HT (et/ou total HT)
 *  - "set-note" : note libre attachée au BDC
 *  - "restore" : supprime l'override
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id || null;

  const body = await request.json();
  const { bcdi, impCode, action, note, restePayerHT, totalHT } = body as {
    bcdi?: string;
    impCode?: string;
    action?: string;
    note?: string | null;
    restePayerHT?: number | null;
    totalHT?: number | null;
  };

  if (!bcdi || !impCode || !action) {
    return NextResponse.json(
      { error: "bcdi, impCode et action requis" },
      { status: 400 }
    );
  }

  if (action === "restore") {
    await prisma.previsionnelBcdiOverride.delete({ where: { bcdi } }).catch(() => {});
    return NextResponse.json({ ok: true, restored: true });
  }

  if (!["to-stock", "set-amount", "set-note"].includes(action)) {
    return NextResponse.json({ error: "action inconnue" }, { status: 400 });
  }

  // Fusionne avec l'override existant (on garde les autres champs)
  const existing = await prisma.previsionnelBcdiOverride.findUnique({
    where: { bcdi },
  });

  const data = {
    bcdi,
    impCode,
    action,
    updatedBy: userId,
    note: note !== undefined ? note : existing?.note ?? null,
    restePayerHTOverride:
      restePayerHT !== undefined
        ? restePayerHT === null
          ? null
          : restePayerHT
        : existing?.restePayerHTOverride ?? null,
    totalHTOverride:
      totalHT !== undefined
        ? totalHT === null
          ? null
          : totalHT
        : existing?.totalHTOverride ?? null,
  };

  await prisma.previsionnelBcdiOverride.upsert({
    where: { bcdi },
    create: data,
    update: data,
  });
  return NextResponse.json({ ok: true, action });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const impCode = url.searchParams.get("imp");
  const where = impCode ? { impCode } : {};
  const all = await prisma.previsionnelBcdiOverride.findMany({ where });
  return NextResponse.json({ overrides: all });
}
