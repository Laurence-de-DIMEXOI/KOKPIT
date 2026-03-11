import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET — Liste tous les liens utiles, triés par catégorie puis position
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const liens = await prisma.lienUtile.findMany({
      orderBy: [{ categorie: "asc" }, { position: "asc" }],
    });
    return NextResponse.json({ liens });
  } catch (error: any) {
    console.error("GET /api/liens-utiles error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}

// POST — Créer un nouveau lien
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { nom, url, description, categorie, iconeUrl } = body;

    if (!nom || !url || !categorie) {
      return NextResponse.json(
        { error: "nom, url et categorie sont requis" },
        { status: 400 }
      );
    }

    // Position = max+1 dans cette catégorie
    const maxPos = await prisma.lienUtile.aggregate({
      where: { categorie },
      _max: { position: true },
    });
    const position = (maxPos._max.position ?? -1) + 1;

    const lien = await prisma.lienUtile.create({
      data: { nom, url, description, categorie, iconeUrl, position },
    });

    return NextResponse.json({ lien }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/liens-utiles error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}
