import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET — Documents d'un client BDO spécifique
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

    const clientBdoId = request.nextUrl.searchParams.get("clientBdoId");

    if (!clientBdoId) {
      return NextResponse.json(
        { error: "clientBdoId est requis" },
        { status: 400 }
      );
    }

    // Vérifier que le client existe
    const client = await prisma.clientBoisDOrient.findUnique({
      where: { id: clientBdoId },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Client BDO introuvable" },
        { status: 404 }
      );
    }

    const documents = await prisma.documentBoisDOrient.findMany({
      where: { clientBdoId },
      orderBy: { date: "desc" },
    });

    const mapped = documents.map((d) => ({
      id: d.id,
      type: d.type,
      reference: d.reference || d.sellsyDocId,
      date: d.date,
      montant: d.montantTTC,
      pdfUrl: d.pdfUrl,
    }));

    return NextResponse.json({ documents: mapped });
  } catch (error) {
    console.error("Erreur lors de la récupération des documents BDO:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
