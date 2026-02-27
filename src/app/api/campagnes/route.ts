import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { campagneSchema } from "@/lib/validators";
import { z } from "zod";

const filterSchema = z.object({
  page: z.coerce.number().positive().default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  plateforme: z.string().optional(),
});

// GET - List campaigns with computed metrics
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
    const filters = filterSchema.parse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      plateforme: searchParams.get("plateforme"),
    });

    // Build where clause
    const where: any = {};
    if (filters.plateforme) {
      where.plateforme = filters.plateforme;
    }

    const skip = (filters.page - 1) * filters.limit;

    // Get campaigns with leads count
    const [campagnes, total] = await Promise.all([
      prisma.campagne.findMany({
        where,
        include: {
          leads: {
            select: { id: true },
          },
          coutsOffline: {
            select: { montant: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: filters.limit,
      }),
      prisma.campagne.count({ where }),
    ]);

    // Compute metrics for each campaign
    const campaignesWithMetrics = await Promise.all(
      campagnes.map(async (campagne) => {
        const leadCount = campagne.leads.length;

        // Count devis and ventes linked to leads in this campaign
        const devisCount = await prisma.devis.count({
          where: {
            lead: {
              campagneId: campagne.id,
            },
          },
        });

        const venteCount = await prisma.vente.count({
          where: {
            devis: {
              lead: {
                campagneId: campagne.id,
              },
            },
          },
        });

        // Get total sales revenue
        const ventes = await prisma.vente.findMany({
          where: {
            devis: {
              lead: {
                campagneId: campagne.id,
              },
            },
          },
          select: { montant: true },
        });

        const caTotal = ventes.reduce((sum, v) => sum + v.montant, 0);

        // Calculate CPL (Cost Per Lead)
        const cpl = leadCount > 0 ? campagne.coutTotal / leadCount : 0;

        // Calculate ROI
        const costTotal = campagne.coutTotal + (campagne.coutsOffline.reduce((sum, c) => sum + c.montant, 0) || 0);
        const roi = costTotal > 0 ? ((caTotal - costTotal) / costTotal) * 100 : 0;

        return {
          ...campagne,
          leads: undefined,
          coutsOffline: undefined,
          metrics: {
            leadCount,
            devisCount,
            venteCount,
            caTotal,
            cpl: cpl.toFixed(2),
            roi: roi.toFixed(2),
          },
        };
      })
    );

    const totalPages = Math.ceil(total / filters.limit);

    return NextResponse.json({
      campagnes: campaignesWithMetrics,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des campagnes:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Paramètres invalides", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// POST - Create campaign
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
    }

    // Check authorization - MARKETING or ADMIN
    if (!["MARKETING", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Autorisation insuffisante" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const campaignData = campagneSchema.parse(body);

    const campagne = await prisma.campagne.create({
      data: {
        ...campaignData,
        actif: true,
      },
      include: {
        leads: {
          select: { id: true },
        },
      },
    });

    return NextResponse.json(
      {
        ...campagne,
        leads: undefined,
        metrics: {
          leadCount: 0,
          devisCount: 0,
          venteCount: 0,
          caTotal: 0,
          cpl: "0.00",
          roi: "0.00",
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur lors de la création de la campagne:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// PATCH - Update campaign
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
    }

    // Check authorization - MARKETING or ADMIN
    if (!["MARKETING", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Autorisation insuffisante" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID de campagne requis" },
        { status: 400 }
      );
    }

    // Validate update data
    const validatedData = campagneSchema.partial().parse(updateData);

    const campagne = await prisma.campagne.update({
      where: { id },
      data: validatedData,
      include: {
        leads: {
          select: { id: true },
        },
        coutsOffline: {
          select: { montant: true },
        },
      },
    });

    // Compute metrics
    const leadCount = campagne.leads.length;
    const devisCount = await prisma.devis.count({
      where: {
        lead: {
          campagneId: campagne.id,
        },
      },
    });

    const ventes = await prisma.vente.findMany({
      where: {
        devis: {
          lead: {
            campagneId: campagne.id,
          },
        },
      },
      select: { montant: true },
    });

    const venteCount = ventes.length;
    const caTotal = ventes.reduce((sum, v) => sum + v.montant, 0);
    const costTotal = campagne.coutTotal + (campagne.coutsOffline.reduce((sum, c) => sum + c.montant, 0) || 0);
    const cpl = leadCount > 0 ? costTotal / leadCount : 0;
    const roi = costTotal > 0 ? ((caTotal - costTotal) / costTotal) * 100 : 0;

    return NextResponse.json({
      ...campagne,
      leads: undefined,
      coutsOffline: undefined,
      metrics: {
        leadCount,
        devisCount,
        venteCount,
        caTotal,
        cpl: cpl.toFixed(2),
        roi: roi.toFixed(2),
      },
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la campagne:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
