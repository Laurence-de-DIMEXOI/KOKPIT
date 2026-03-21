import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  const user = session.user as { id: string; role?: string };
  const isAdminOrDirection = user.role === "ADMIN" || user.role === "DIRECTION";

  if (!isAdminOrDirection) {
    return NextResponse.json(
      { error: "Seuls les ADMIN/DIRECTION peuvent modifier le statut d'un conge." },
      { status: 403 }
    );
  }

  const { id } = await params;
  const body = await req.json();
  const { statut, commentaire } = body;

  const validStatuts = ["approuve", "modifie", "refuse"];
  if (!statut || !validStatuts.includes(statut)) {
    return NextResponse.json(
      { error: `Statut invalide. Valeurs acceptees : ${validStatuts.join(", ")}` },
      { status: 400 }
    );
  }

  const conge = await prisma.conge.findUnique({ where: { id } });
  if (!conge) {
    return NextResponse.json({ error: "Conge introuvable." }, { status: 404 });
  }

  const updated = await prisma.conge.update({
    where: { id },
    data: {
      statut,
      commentaire: commentaire || null,
      approuveParId: user.id,
      approuveLe: new Date(),
    },
  });

  return NextResponse.json({ conge: updated });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  const { id } = await params;
  const user = session.user as { id: string; role?: string };

  const conge = await prisma.conge.findUnique({ where: { id } });
  if (!conge) {
    return NextResponse.json({ error: "Conge introuvable." }, { status: 404 });
  }

  if (conge.statut !== "en_attente") {
    return NextResponse.json(
      { error: "Seuls les conges en attente peuvent etre supprimes." },
      { status: 400 }
    );
  }

  const isCreator = conge.userId === user.id;
  const isAdmin = user.role === "ADMIN";

  if (!isCreator && !isAdmin) {
    return NextResponse.json(
      { error: "Vous ne pouvez supprimer que vos propres conges en attente." },
      { status: 403 }
    );
  }

  await prisma.conge.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
