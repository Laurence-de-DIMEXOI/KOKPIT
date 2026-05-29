import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({ contenu: z.string().min(1) });

/** POST /api/sur-mesure/[id]/commentaires */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const userId = (session.user as { id?: string }).id;
  if (!userId) return NextResponse.json({ error: "Session invalide" }, { status: 401 });
  const { id } = await params;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Contenu requis" }, { status: 400 });

  const projet = await prisma.projetSurMesure.findFirst({ where: { id, deletedAt: null }, select: { id: true } });
  if (!projet) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const commentaire = await prisma.commentaireProjetSurMesure.create({
    data: { projetId: id, auteurId: userId, contenu: parsed.data.contenu },
    include: { auteur: { select: { prenom: true, nom: true } } },
  });
  return NextResponse.json({ commentaire }, { status: 201 });
}

/** DELETE /api/sur-mesure/[id]/commentaires?commentaireId=xxx — soft delete (auteur/admin) */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  await params;
  const userId = (session.user as { id?: string }).id;
  const role = (session.user as { role?: string }).role || "";
  const commentaireId = req.nextUrl.searchParams.get("commentaireId");
  if (!commentaireId) return NextResponse.json({ error: "commentaireId requis" }, { status: 400 });

  const c = await prisma.commentaireProjetSurMesure.findUnique({ where: { id: commentaireId } });
  if (!c) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  if (c.auteurId !== userId && !["ADMIN", "DIRECTION"].includes(role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  await prisma.commentaireProjetSurMesure.update({ where: { id: commentaireId }, data: { deletedAt: new Date() } });
  return NextResponse.json({ success: true });
}
