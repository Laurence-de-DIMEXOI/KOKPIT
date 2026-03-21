import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/club/stats
 *
 * Retourne les statistiques du Club Tectona :
 * - Total membres
 * - Répartition par niveau
 * - Dernier sync
 * - Total CA membres
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const activeFilter = { exclu: false };

    const [totalMembres, parNiveau, dernierSyncResult, totalCA, sansEmail] =
      await Promise.all([
        prisma.clubMembre.count({ where: activeFilter }),
        prisma.clubMembre.groupBy({
          by: ["niveau"],
          where: activeFilter,
          _count: { id: true },
          orderBy: { niveau: "asc" },
        }),
        prisma.clubMembre.findFirst({
          where: activeFilter,
          orderBy: { dernierSync: "desc" },
          select: { dernierSync: true },
        }),
        prisma.clubMembre.aggregate({
          where: activeFilter,
          _sum: { totalMontant: true },
        }),
        prisma.clubMembre.count({
          where: { ...activeFilter, email: "" },
        }),
      ]);

    const niveauxStats = [1, 2, 3, 4, 5].map((niv) => {
      const found = parNiveau.find((p) => p.niveau === niv);
      return { niveau: niv, count: found?._count?.id || 0 };
    });

    return NextResponse.json({
      totalMembres,
      parNiveau: niveauxStats,
      dernierSync: dernierSyncResult?.dernierSync || null,
      totalCA: totalCA._sum.totalMontant || 0,
      sansEmail,
    });
  } catch (error: any) {
    console.error("[Club Stats] Erreur:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors du chargement des stats" },
      { status: 500 }
    );
  }
}
