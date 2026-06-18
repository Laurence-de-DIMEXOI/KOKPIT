import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/achat/previsionnel/override
 *   body { bcdi, impCode, action: "to-stock" | "restore", note? }
 *
 * Convertit un BCDI client en stock potentiel (le client a annulé, l'arrivage
 * devient du stock à valoriser) ou restaure l'état normal.
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id || null;

  const body = await request.json();
  const { bcdi, impCode, action, note } = body as {
    bcdi?: string;
    impCode?: string;
    action?: string;
    note?: string;
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

  if (action === "to-stock") {
    await prisma.previsionnelBcdiOverride.upsert({
      where: { bcdi },
      create: { bcdi, impCode, action, note, updatedBy: userId },
      update: { impCode, action, note, updatedBy: userId },
    });
    return NextResponse.json({ ok: true, action: "to-stock" });
  }

  return NextResponse.json({ error: "action inconnue" }, { status: 400 });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const impCode = url.searchParams.get("imp");
  const where = impCode ? { impCode } : {};
  const all = await prisma.previsionnelBcdiOverride.findMany({ where });
  return NextResponse.json({ overrides: all });
}
