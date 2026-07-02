import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const WRITE_ROLES = ["ADMIN", "DIRECTION", "MARKETING", "COMMERCIAL"];
const MATCH_STATUTS = ["SUGGERE", "CONFIRME", "IGNORE"];

// PUT — confirmer / ignorer une correspondance suggérée
export async function PUT(request: NextRequest, { params }: { params: Promise<{ matchId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
  if (!WRITE_ROLES.includes(session.user.role)) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { matchId } = await params;
  const body = await request.json();
  if (!MATCH_STATUTS.includes(body.statut)) {
    return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
  }

  const updated = await prisma.besoinMatch.update({
    where: { id: matchId },
    data: { statut: body.statut },
  });
  return NextResponse.json(updated);
}
