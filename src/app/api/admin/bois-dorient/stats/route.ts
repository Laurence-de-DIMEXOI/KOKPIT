import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    // Total clients BDO
    const totalClients = await prisma.clientBoisDOrient.count();

    // Count par statut
    const countByStatut = await prisma.clientBoisDOrient.groupBy({
      by: ["statut"],
      _count: { id: true },
    });

    const statutStats = countByStatut.reduce(
      (acc, item) => {
        acc[item.statut] = item._count.id;
        return acc;
      },
      {} as Record<string, number>
    );

    // Total CA (somme de totalCA)
    const caResult = await prisma.clientBoisDOrient.aggregate({
      _sum: { totalCA: true },
    });
    const totalCA = caResult._sum.totalCA ?? 0;

    // Total documents
    const totalDocuments = await prisma.documentBoisDOrient.count();

    // Count par type de document (factures/commandes/devis)
    const countByType = await prisma.documentBoisDOrient.groupBy({
      by: ["type"],
      _count: { id: true },
    });

    const documentStats = countByType.reduce(
      (acc, item) => {
        acc[item.type] = item._count.id;
        return acc;
      },
      {} as Record<string, number>
    );

    // Dernier import
    const latestImport = await prisma.importBoisDOrient.findFirst({
      orderBy: { dateImport: "desc" },
    });

    return NextResponse.json({
      totalContacts: totalClients,
      matches: (statutStats["MATCH_EMAIL"] || 0) + (statutStats["MATCH_MANUEL"] || 0),
      aVerifier: statutStats["A_VERIFIER"] || 0,
      nouveaux: statutStats["NOUVEAU"] || 0,
      caTotal: totalCA,
      documentsCount: totalDocuments,
      statutStats,
      documentStats,
      dernierImport: latestImport?.dateImport || null,
      dernierImportStatut: latestImport?.statut || null,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des stats BDO:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
