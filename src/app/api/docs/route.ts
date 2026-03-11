import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET — Liste des articles publiés, groupés par catégorie
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const articles = await prisma.docArticle.findMany({
      where: { publie: true },
      orderBy: [{ categorie: "asc" }, { position: "asc" }, { titre: "asc" }],
      select: {
        id: true,
        titre: true,
        slug: true,
        categorie: true,
        position: true,
        updatedAt: true,
      },
    });

    // Grouper par catégorie
    const categories: Record<string, typeof articles> = {};
    for (const article of articles) {
      if (!categories[article.categorie]) {
        categories[article.categorie] = [];
      }
      categories[article.categorie].push(article);
    }

    return NextResponse.json({ articles, categories });
  } catch (error: any) {
    console.error("GET /api/docs error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}

// POST — Créer un article (ADMIN uniquement)
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { titre, slug, contenu, categorie, position, publie } = body;

    if (!titre || !slug || !contenu || !categorie) {
      return NextResponse.json(
        { error: "Champs requis : titre, slug, contenu, categorie" },
        { status: 400 }
      );
    }

    const article = await prisma.docArticle.create({
      data: {
        titre,
        slug,
        contenu,
        categorie,
        position: position ?? 0,
        publie: publie ?? true,
      },
    });

    return NextResponse.json(article, { status: 201 });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Un article avec ce slug existe déjà" },
        { status: 409 }
      );
    }
    console.error("POST /api/docs error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}
