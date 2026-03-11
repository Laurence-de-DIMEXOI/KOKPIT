import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PUT — Modifier un lien
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { nom, url, description, categorie, iconeUrl } = body;

    const lien = await prisma.lienUtile.update({
      where: { id },
      data: {
        ...(nom !== undefined && { nom }),
        ...(url !== undefined && { url }),
        ...(description !== undefined && { description }),
        ...(categorie !== undefined && { categorie }),
        ...(iconeUrl !== undefined && { iconeUrl }),
      },
    });

    return NextResponse.json({ lien });
  } catch (error: any) {
    console.error("PUT /api/liens-utiles/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}

// DELETE — Supprimer un lien
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const { id } = await params;
    await prisma.lienUtile.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/liens-utiles/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}
