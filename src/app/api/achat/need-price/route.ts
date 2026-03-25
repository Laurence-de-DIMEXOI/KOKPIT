import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - List NeedPrice with pagination and filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const statut = searchParams.get("statut");
    const search = searchParams.get("search");
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 20));

    // Build where clause
    const where: any = {};

    if (statut) {
      where.statut = statut;
    }

    if (search) {
      where.OR = [
        { denomination: { contains: search, mode: "insensitive" } },
        { reference: { contains: search, mode: "insensitive" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.needPrice.findMany({
        where,
        include: {
          createdBy: {
            select: { nom: true, prenom: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.needPrice.count({ where }),
    ]);

    return NextResponse.json({
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des NeedPrice:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// POST - Create a new NeedPrice
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { refDevis, denomination, dimensions, finitions, photoUrl, notes } = body;

    if (!denomination || !dimensions) {
      return NextResponse.json(
        { error: "denomination et dimensions sont requis" },
        { status: 400 }
      );
    }

    // Auto-generate reference: NP-{year}-{number padded to 3}
    const currentYear = new Date().getFullYear();
    const lastNeedPrice = await prisma.needPrice.findFirst({
      where: {
        reference: { startsWith: `NP-${currentYear}-` },
      },
      orderBy: { reference: "desc" },
    });

    let nextNumber = 1;
    if (lastNeedPrice) {
      const parts = lastNeedPrice.reference.split("-");
      const lastNumber = parseInt(parts[2], 10);
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }

    const reference = `NP-${currentYear}-${String(nextNumber).padStart(3, "0")}`;

    // Create NeedPrice
    const needPrice = await prisma.needPrice.create({
      data: {
        reference,
        refDevis,
        denomination,
        dimensions,
        finitions,
        photoUrl,
        notes,
        createdById: session.user.id,
      },
      include: {
        createdBy: {
          select: { nom: true, prenom: true },
        },
      },
    });

    // Send email notification to Elaury via Brevo
    try {
      const htmlContent = `
        <h2>Nouvelle demande de prix</h2>
        <table style="border-collapse:collapse;width:100%">
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Référence</td><td style="padding:8px;border:1px solid #ddd">${reference}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Dénomination</td><td style="padding:8px;border:1px solid #ddd">${denomination}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Dimensions</td><td style="padding:8px;border:1px solid #ddd">${dimensions}</td></tr>
          ${finitions ? `<tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Finitions</td><td style="padding:8px;border:1px solid #ddd">${finitions}</td></tr>` : ""}
          ${refDevis ? `<tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Réf. Devis</td><td style="padding:8px;border:1px solid #ddd">${refDevis}</td></tr>` : ""}
          ${notes ? `<tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Notes</td><td style="padding:8px;border:1px solid #ddd">${notes}</td></tr>` : ""}
          ${photoUrl ? `<tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Photo</td><td style="padding:8px;border:1px solid #ddd"><a href="${photoUrl}">Voir la photo</a></td></tr>` : ""}
        </table>
        <p style="margin-top:16px;color:#666">Demandé par ${needPrice.createdBy.prenom} ${needPrice.createdBy.nom}</p>
      `;

      await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "accept": "application/json",
          "content-type": "application/json",
          "api-key": process.env.BREVO_API_KEY!,
        },
        body: JSON.stringify({
          sender: { name: "KOKPIT", email: "laurence.payet@dimexoi.fr" },
          to: [{ email: "elaury.decaunes@dimexoi.fr" }],
          subject: `[${reference}] Nouvelle demande de prix — ${denomination}`,
          htmlContent,
        }),
      });
    } catch (emailError) {
      console.error("Erreur lors de l'envoi de l'email Brevo:", emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json(needPrice, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de la création du NeedPrice:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
