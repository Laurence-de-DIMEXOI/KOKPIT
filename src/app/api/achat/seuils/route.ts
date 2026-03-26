import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const role = (session.user as any).role;
  if (!["ACHAT", "ADMIN", "DIRECTION"].includes(role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const seuils = await prisma.seuilStockAchat.findMany({
    include: { updatedBy: { select: { nom: true, prenom: true } } },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(seuils);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const role = (session.user as any).role;
  if (!["ACHAT", "ADMIN", "DIRECTION"].includes(role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const body = await req.json();
  const { sellsyRefId, seuilAlerte, classeABC, note } = body;

  if (!sellsyRefId || seuilAlerte == null) {
    return NextResponse.json({ error: "sellsyRefId et seuilAlerte requis" }, { status: 400 });
  }

  const seuil = await prisma.seuilStockAchat.upsert({
    where: { sellsyRefId },
    create: {
      sellsyRefId,
      seuilAlerte: Number(seuilAlerte),
      classeABC: classeABC || "A",
      note: note || null,
      updatedById: (session.user as any).id,
    },
    update: {
      seuilAlerte: Number(seuilAlerte),
      classeABC: classeABC || undefined,
      note: note || null,
      updatedById: (session.user as any).id,
    },
  });

  return NextResponse.json(seuil);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const role = (session.user as any).role;
  if (!["ACHAT", "ADMIN", "DIRECTION"].includes(role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const sellsyRefId = req.nextUrl.searchParams.get("sellsyRefId");
  if (!sellsyRefId) {
    return NextResponse.json({ error: "sellsyRefId requis" }, { status: 400 });
  }

  await prisma.seuilStockAchat.delete({ where: { sellsyRefId } });
  return NextResponse.json({ success: true });
}
