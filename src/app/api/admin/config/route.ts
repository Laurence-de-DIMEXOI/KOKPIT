import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/config — Récupérer la config
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (!["ADMIN", "DIRECTION"].includes(role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const config = await prisma.configApp.findFirst({ where: { id: "default" } });

  // Récupérer les rôles et modules pour l'affichage
  const users = await prisma.user.findMany({
    where: { actif: true },
    select: { id: true, nom: true, prenom: true, role: true, email: true },
    orderBy: { nom: "asc" },
  });

  return NextResponse.json({ config, users });
}

// PUT /api/admin/config — Mettre à jour la config
export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (!["ADMIN", "DIRECTION"].includes(role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const body = await req.json();
  const { slaHeures, pointageHeuresJour, pointagePauseDefaut } = body;

  const data: any = {};
  if (slaHeures !== undefined) data.slaHeures = Math.max(1, Math.min(168, parseInt(slaHeures)));
  if (pointageHeuresJour !== undefined) data.pointageHeuresJour = Math.max(1, Math.min(12, parseFloat(pointageHeuresJour)));
  if (pointagePauseDefaut !== undefined) data.pointagePauseDefaut = Math.max(0, Math.min(3, parseFloat(pointagePauseDefaut)));

  const config = await prisma.configApp.upsert({
    where: { id: "default" },
    update: data,
    create: { id: "default", ...data },
  });

  return NextResponse.json(config);
}
