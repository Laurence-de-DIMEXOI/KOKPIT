import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET — Article complet par slug
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { slug } = await params;

  try {
    const article = await prisma.docArticle.findUnique({
      where: { slug },
    });

    if (!article) {
      return NextResponse.json(
        { error: "Article non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(article);
  } catch (error: any) {
    console.error("GET /api/docs/[slug] error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}

// PUT — Modifier un article (ADMIN uniquement)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { slug } = await params;

  try {
    const body = await request.json();
    const { titre, contenu, categorie, position, publie } = body;

    const article = await prisma.docArticle.update({
      where: { slug },
      data: {
        ...(titre !== undefined && { titre }),
        ...(contenu !== undefined && { contenu }),
        ...(categorie !== undefined && { categorie }),
        ...(position !== undefined && { position }),
        ...(publie !== undefined && { publie }),
      },
    });

    return NextResponse.json(article);
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Article non trouvé" },
        { status: 404 }
      );
    }
    console.error("PUT /api/docs/[slug] error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}

// DELETE — Supprimer un article (ADMIN uniquement)
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { slug } = await params;

  try {
    await prisma.docArticle.delete({
      where: { slug },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Article non trouvé" },
        { status: 404 }
      );
    }
    console.error("DELETE /api/docs/[slug] error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}
