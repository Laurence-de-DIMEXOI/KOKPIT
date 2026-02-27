import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { emailCampaignSchema } from "@/lib/validators";
import { z } from "zod";

const filterSchema = z.object({
  page: z.coerce.number().positive().default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

const sendCampaignSchema = z.object({
  id: z.string().uuid(),
  action: z.literal("send"),
});

// GET - List email campaigns with stats
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
    }

    // Check authorization
    if (!["MARKETING", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Autorisation insuffisante" },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const filters = filterSchema.parse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
    });

    const skip = (filters.page - 1) * filters.limit;

    const [campaigns, total] = await Promise.all([
      prisma.emailCampaign.findMany({
        include: {
          emailLogs: {
            select: { id: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: filters.limit,
      }),
      prisma.emailCampaign.count(),
    ]);

    const campaignsWithStats = campaigns.map((c) => ({
      ...c,
      emailLogs: undefined,
      stats: {
        totalEnvoyes: c.nbEnvoyes,
        totalOuverts: c.nbOuverts,
        totalClics: c.nbClics,
        tauxOuverture: c.nbEnvoyes > 0 ? ((c.nbOuverts / c.nbEnvoyes) * 100).toFixed(2) : "0.00",
        tauxClic: c.nbEnvoyes > 0 ? ((c.nbClics / c.nbEnvoyes) * 100).toFixed(2) : "0.00",
      },
    }));

    const totalPages = Math.ceil(total / filters.limit);

    return NextResponse.json({
      campaigns: campaignsWithStats,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des campagnes email:", error);
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

// POST - Create email campaign (draft) or send campaign
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
    }

    // Check authorization
    if (!["MARKETING", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Autorisation insuffisante" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Check if this is a send request
    const sendSchema = sendCampaignSchema.safeParse(body);
    if (sendSchema.success) {
      return await sendEmailCampaign(sendSchema.data.id);
    }

    // Otherwise create new campaign
    const campaignData = emailCampaignSchema.parse(body);

    const campaign = await prisma.emailCampaign.create({
      data: {
        ...campaignData,
        statut: "BROUILLON",
      },
    });

    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de la création/envoi de campagne email:", error);
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

// Helper function to send email campaign
async function sendEmailCampaign(campaignId: string) {
  try {
    const campaign = await prisma.emailCampaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campagne non trouvée" },
        { status: 404 }
      );
    }

    if (campaign.statut !== "BROUILLON") {
      return NextResponse.json(
        { error: "Seules les campagnes en brouillon peuvent être envoyées" },
        { status: 400 }
      );
    }

    // Find contacts matching segment filter
    let where: any = {};
    if (campaign.segmentFilter) {
      // Apply segment filters (lifecycle stage, showroom, etc.)
      const filter = campaign.segmentFilter as Record<string, any>;
      if (filter.lifecycleStage) {
        where.lifecycleStage = filter.lifecycleStage;
      }
      if (filter.showroomId) {
        where.showroomId = filter.showroomId;
      }
      if (filter.rgpdEmailConsent !== false) {
        where.rgpdEmailConsent = true;
      }
    } else {
      // Default: only contacts with email consent
      where.rgpdEmailConsent = true;
    }

    const contacts = await prisma.contact.findMany({
      where,
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
      },
    });

    if (contacts.length === 0) {
      return NextResponse.json(
        { error: "Aucun contact ne correspond aux critères de segmentation" },
        { status: 400 }
      );
    }

    // Send emails via Resend API
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      return NextResponse.json(
        { error: "Service email non configuré" },
        { status: 500 }
      );
    }

    let sentCount = 0;
    const errors: Array<{ email: string; error: string }> = [];

    for (const contact of contacts) {
      try {
        // Send via Resend
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM_EMAIL || "noreply@kokpit.fr",
            to: contact.email,
            subject: campaign.objet,
            html: campaign.contenuHtml,
            reply_to: process.env.RESEND_REPLY_TO,
          }),
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(error);
        }

        const resendData = await response.json();

        // Log email send
        await prisma.emailLog.create({
          data: {
            contactId: contact.id,
            campaignId: campaign.id,
            objet: campaign.objet,
            statut: "ENVOYE",
            resendId: resendData.id,
            sentAt: new Date(),
          },
        });

        sentCount++;
      } catch (error) {
        console.error(`Erreur lors de l'envoi à ${contact.email}:`, error);
        errors.push({
          email: contact.email,
          error: error instanceof Error ? error.message : "Erreur inconnue",
        });
      }
    }

    // Update campaign stats
    const updatedCampaign = await prisma.emailCampaign.update({
      where: { id: campaignId },
      data: {
        statut: "TERMINE",
        nbEnvoyes: sentCount,
        dateEnvoiPlanifie: new Date(),
      },
    });

    return NextResponse.json({
      message: "Campagne envoyée",
      campaign: updatedCampaign,
      sentCount,
      totalContacts: contacts.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Erreur lors de l'envoi de la campagne email:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi" },
      { status: 500 }
    );
  }
}

// PATCH - Update campaign or trigger send
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
    }

    // Check authorization
    if (!["MARKETING", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Autorisation insuffisante" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, action, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID de campagne requis" },
        { status: 400 }
      );
    }

    // If action is send, trigger send
    if (action === "send") {
      return await sendEmailCampaign(id);
    }

    // Otherwise update campaign
    const validatedData = emailCampaignSchema.partial().parse(updateData);

    const campaign = await prisma.emailCampaign.update({
      where: { id },
      data: validatedData,
    });

    return NextResponse.json(campaign);
  } catch (error) {
    console.error("Erreur lors de la mise à jour de campagne email:", error);
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
