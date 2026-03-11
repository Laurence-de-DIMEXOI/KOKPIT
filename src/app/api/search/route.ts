import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/search?q=terme — Recherche globale contacts + tâches
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ contacts: [], tasks: [] });
  }

  const searchTerm = `%${q}%`;

  try {
    const [contacts, tasks] = await Promise.all([
      // Contacts : nom, prenom, email, telephone ILIKE
      prisma.contact.findMany({
        where: {
          OR: [
            { nom: { contains: q, mode: "insensitive" } },
            { prenom: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { telephone: { contains: q, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          nom: true,
          prenom: true,
          email: true,
          lifecycleStage: true,
        },
        take: 5,
        orderBy: { updatedAt: "desc" },
      }),

      // Tâches : titre, description
      prisma.task.findMany({
        where: {
          OR: [
            { titre: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          titre: true,
          statut: true,
          echeance: true,
          assigneA: { select: { id: true, nom: true, prenom: true } },
        },
        take: 5,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return NextResponse.json({ contacts, tasks });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    console.error("GET /api/search error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
