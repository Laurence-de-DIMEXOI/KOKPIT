import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/marketing/tunnel/lead/[id]
 *
 * Détail attribution pour UN lead : devis et BDC liés dans les fenêtres
 * d'attribution (7j / 30j), avec CA total attribué.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;

  const lead = await prisma.lead.findUnique({
    where: { id },
    select: {
      id: true,
      createdAt: true,
      source: true,
      utmSource: true,
      utmMedium: true,
      utmCampaign: true,
      contact: { select: { nom: true, prenom: true, email: true } },
      attributionsDevis: {
        select: {
          id: true,
          devisId: true,
          devisRef: true,
          devisCA: true,
          devisDate: true,
          joursApres: true,
        },
        orderBy: { devisDate: "asc" },
      },
      attributionsBDC: {
        select: {
          id: true,
          bdcId: true,
          bdcRef: true,
          bdcCA: true,
          bdcDate: true,
          joursApres: true,
        },
        orderBy: { bdcDate: "asc" },
      },
    },
  });

  if (!lead) {
    return NextResponse.json({ error: "Lead introuvable" }, { status: 404 });
  }

  const caTotalBDC = lead.attributionsBDC.reduce((s, a) => s + a.bdcCA, 0);
  const caTotalDevis = lead.attributionsDevis.reduce((s, a) => s + a.devisCA, 0);

  return NextResponse.json({
    lead: {
      id: lead.id,
      createdAt: lead.createdAt,
      source: lead.source,
      utmSource: lead.utmSource,
      utmMedium: lead.utmMedium,
      utmCampaign: lead.utmCampaign,
      contact: lead.contact,
    },
    attributionsDevis: lead.attributionsDevis,
    attributionsBDC: lead.attributionsBDC,
    caTotalDevis: Math.round(caTotalDevis * 100) / 100,
    caTotalBDC: Math.round(caTotalBDC * 100) / 100,
  });
}
