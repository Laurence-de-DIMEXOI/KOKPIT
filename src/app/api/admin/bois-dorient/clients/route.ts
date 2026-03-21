import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET — Liste paginée des clients BDO avec filtres
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
    }
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Accès réservé aux administrateurs" },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const statut = searchParams.get("statut");
    const search = searchParams.get("search");
    const sort = searchParams.get("sort");

    const where: any = {};

    if (statut) {
      where.statut = statut;
    }

    if (search) {
      where.OR = [
        { nom: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    // Déterminer le tri
    let orderBy: any = { createdAt: "desc" };
    if (sort === "nom") orderBy = { nom: "asc" };
    else if (sort === "totalCA") orderBy = { totalCA: "desc" };
    else if (sort === "statut") orderBy = { statut: "asc" };
    else if (sort === "updatedAt") orderBy = { updatedAt: "desc" };

    const [clients, total] = await Promise.all([
      prisma.clientBoisDOrient.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: {
            select: { documents: true },
          },
        },
      }),
      prisma.clientBoisDOrient.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    // Mapper les champs pour le frontend
    const mappedClients = clients.map((c) => ({
      id: c.id,
      nom: c.prenom ? `${c.prenom} ${c.nom}` : c.nom,
      email: c.email,
      caBdo: c.totalCA,
      factures: c.nbFactures,
      statut: c.statut,
      contactDimexoiId: c.contactDimexoiId,
      telephone: c.telephone,
      ville: c.ville,
      nbCommandes: c.nbCommandes,
      nbDevis: c.nbDevis,
      documentsCount: c._count.documents,
    }));

    return NextResponse.json({
      clients: mappedClients,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des clients BDO:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// PATCH — Actions manuelles sur un client BDO
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
    }
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Accès réservé aux administrateurs" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, action, contactDimexoiId } = body;

    if (!id || !action) {
      return NextResponse.json(
        { error: "id et action sont requis" },
        { status: 400 }
      );
    }

    const client = await prisma.clientBoisDOrient.findUnique({
      where: { id },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Client BDO introuvable" },
        { status: 404 }
      );
    }

    let updateData: any = {};

    switch (action) {
      case "confirmer":
        updateData = {
          statut: "MATCH_MANUEL",
          verifieLeAt: new Date(),
          verifieParId: session.user.id,
        };
        break;

      case "rejeter":
        updateData = {
          statut: "NOUVEAU",
          contactDimexoiId: null,
          verifieLeAt: new Date(),
          verifieParId: session.user.id,
        };
        break;

      case "matcher":
        if (!contactDimexoiId) {
          return NextResponse.json(
            { error: "contactDimexoiId requis pour l'action matcher" },
            { status: 400 }
          );
        }
        updateData = {
          statut: "MATCH_MANUEL",
          contactDimexoiId,
          verifieLeAt: new Date(),
          verifieParId: session.user.id,
        };
        break;

      default:
        return NextResponse.json(
          { error: "Action invalide. Actions possibles : confirmer, rejeter, matcher" },
          { status: 400 }
        );
    }

    const updated = await prisma.clientBoisDOrient.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ client: updated });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du client BDO:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
