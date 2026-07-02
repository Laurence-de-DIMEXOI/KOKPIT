import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const CATEGORIES = ["CUISINE", "DRESSING", "SDB", "SALON", "CHAMBRE", "EXTERIEUR", "AUTRE"];
const WRITE_ROLES = ["ADMIN", "DIRECTION", "MARKETING", "COMMERCIAL"];

// GET — liste des besoins clients (filtres statut/search + pagination)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }

    const sp = request.nextUrl.searchParams;
    const statut = sp.get("statut");
    const search = sp.get("search");
    const page = Math.max(1, Number(sp.get("page")) || 1);
    const limit = Math.min(100, Math.max(1, Number(sp.get("limit")) || 20));

    const where: any = {};
    if (statut && statut !== "ALL") where.statut = statut;
    if (search) {
      where.OR = [
        { nomClient: { contains: search, mode: "insensitive" } },
        { recherche: { contains: search, mode: "insensitive" } },
        { motsCles: { contains: search, mode: "insensitive" } },
        { reference: { contains: search, mode: "insensitive" } },
        { telephone: { contains: search, mode: "insensitive" } },
      ];
    }

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      prisma.besoinClient.findMany({
        where,
        include: {
          createdBy: { select: { nom: true, prenom: true } },
          matches: { orderBy: { score: "desc" } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.besoinClient.count({ where }),
    ]);

    return NextResponse.json({
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Erreur GET besoins-clients:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST — créer un besoin client
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }
    if (!WRITE_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const body = await request.json();
    const nomClient = (body.nomClient || "").toString().trim();
    const recherche = (body.recherche || "").toString().trim();
    if (!nomClient) return NextResponse.json({ error: "Le nom du client est obligatoire" }, { status: 400 });
    if (!recherche) return NextResponse.json({ error: "La description du besoin est obligatoire" }, { status: 400 });

    const categorie = CATEGORIES.includes((body.categorie || "").toString().toUpperCase())
      ? (body.categorie as string).toUpperCase()
      : null;

    // Référence auto BES-NNN (séquentielle, sans année → pas un « bon de commande »)
    const last = await prisma.besoinClient.findFirst({
      where: { reference: { startsWith: "BES-" } },
      orderBy: { reference: "desc" },
    });
    let next = 1;
    if (last) {
      const n = parseInt(last.reference.split("-")[1], 10);
      if (!isNaN(n)) next = n + 1;
    }
    const reference = `BES-${String(next).padStart(3, "0")}`;

    const created = await prisma.besoinClient.create({
      data: {
        reference,
        nomClient,
        telephone: (body.telephone || "").toString().trim() || null,
        email: (body.email || "").toString().trim() || null,
        contactId: (body.contactId || "").toString().trim() || null,
        recherche,
        motsCles: (body.motsCles || "").toString().trim() || null,
        categorie,
        delai: (body.delai || "").toString().trim() || null,
        notes: (body.notes || "").toString().trim() || null,
        createdById: session.user.id,
      },
      include: { createdBy: { select: { nom: true, prenom: true } }, matches: true },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Erreur POST besoins-clients:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
