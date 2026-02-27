import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const cronSchema = z.object({
  job: z.enum(["sla-check", "relance", "cross-sell"]),
});

// POST - Execute scheduled jobs
export async function POST(request: NextRequest) {
  try {
    // Verify API secret from header
    const authHeader = request.headers.get("authorization");
    const apiSecret = process.env.CRON_API_SECRET;

    if (!apiSecret) {
      console.warn("CRON_API_SECRET not configured");
      return NextResponse.json(
        { error: "Service non configuré" },
        { status: 500 }
      );
    }

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7);
    if (token !== apiSecret) {
      return NextResponse.json(
        { error: "Token invalide" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const jobParam = searchParams.get("job");

    if (!jobParam) {
      return NextResponse.json(
        { error: "Paramètre job requis" },
        { status: 400 }
      );
    }

    const { job } = cronSchema.parse({ job: jobParam });

    // Execute job
    switch (job) {
      case "sla-check":
        return await slaCheck();
      case "relance":
        return await relanceJob();
      case "cross-sell":
        return await crossSellJob();
      default:
        return NextResponse.json(
          { error: "Job invalide" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Erreur lors de l'exécution du cron:", error);
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

// SLA Check: Find leads past deadline without action
async function slaCheck() {
  try {
    const now = new Date();

    // Find leads past SLA deadline without first action
    const slaExceeded = await prisma.lead.findMany({
      where: {
        slaDeadline: {
          lt: now,
        },
        premiereActionAt: null,
      },
      include: {
        contact: true,
        showroom: true,
        commercial: true,
      },
    });

    // Create alerts for each exceeded SLA
    const alertCount = slaExceeded.length;

    for (const lead of slaExceeded) {
      // Create alert event
      await prisma.evenement.create({
        data: {
          leadId: lead.id,
          contactId: lead.contactId,
          type: "NOTE",
          description: `SLA dépassé - Aucune action depuis ${Math.floor(
            (now.getTime() - lead.slaDeadline.getTime()) / (1000 * 60 * 60)
          )} heures`,
          metadata: {
            alertType: "SLA_EXCEEDED",
            slaDeadline: lead.slaDeadline,
            hoursOverdue: Math.floor(
              (now.getTime() - lead.slaDeadline.getTime()) / (1000 * 60 * 60)
            ),
          },
        },
      });

      // Send notification to commercial if assigned
      if (lead.commercial?.id) {
        // In production, send via email/SMS/notification service
        console.log(
          `Alerte SLA: Lead ${lead.id} dépassé pour ${lead.commercial.prenom} ${lead.commercial.nom}`
        );
      }
    }

    return NextResponse.json({
      job: "sla-check",
      status: "completed",
      alertCount,
      message: `${alertCount} SLA dépassés détectés`,
    });
  } catch (error) {
    console.error("Erreur lors du SLA check:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'exécution du SLA check" },
      { status: 500 }
    );
  }
}

// Relance: Find inactive leads (7+ days) and trigger workflow
async function relanceJob() {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Find leads inactive for 7+ days
    const inactiveLeads = await prisma.lead.findMany({
      where: {
        statut: {
          in: ["NOUVEAU", "EN_COURS"],
        },
        createdAt: {
          lt: sevenDaysAgo,
        },
        evenements: {
          none: {
            createdAt: {
              gte: sevenDaysAgo,
            },
          },
        },
      },
      include: {
        contact: true,
        commercial: true,
      },
    });

    // Create relance event for each inactive lead
    const relanceCount = inactiveLeads.length;

    for (const lead of inactiveLeads) {
      // Create relance event
      await prisma.evenement.create({
        data: {
          leadId: lead.id,
          contactId: lead.contactId,
          type: "RELANCE",
          description: "Lead inactif depuis 7 jours - Relance automatique",
          metadata: {
            lastActivityDays: 7,
            triggerType: "LEAD_INACTIF",
          },
        },
      });

      // Trigger relance workflow if exists
      // In production, query for LEAD_INACTIF workflows and execute them
      console.log(`Relance programmée pour lead ${lead.id}`);
    }

    return NextResponse.json({
      job: "relance",
      status: "completed",
      relanceCount,
      message: `${relanceCount} leads inactifs mis en relance`,
    });
  } catch (error) {
    console.error("Erreur lors de la relance:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'exécution de la relance" },
      { status: 500 }
    );
  }
}

// Cross-sell: Find recent sales (2 days ago) and trigger workflow
async function crossSellJob() {
  try {
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    // Find ventes created 2-3 days ago
    const recentSales = await prisma.vente.findMany({
      where: {
        dateVente: {
          gte: threeDaysAgo,
          lte: twoDaysAgo,
        },
      },
      include: {
        contact: true,
        devis: {
          include: {
            lead: true,
          },
        },
      },
    });

    const crossSellCount = recentSales.length;

    for (const vente of recentSales) {
      // Create cross-sell event
      await prisma.evenement.create({
        data: {
          contactId: vente.contactId,
          leadId: vente.devis?.lead?.id,
          type: "VENTE",
          description: `Cross-sell trigger - Vente ${vente.montant}€ réalisée il y a 2 jours`,
          metadata: {
            triggerType: "POST_ACHAT",
            venteId: vente.id,
            montant: vente.montant,
          },
        },
      });

      // Trigger cross-sell workflow if exists
      // In production, query for POST_ACHAT workflows and execute them
      console.log(`Cross-sell programmée pour contact ${vente.contactId}`);
    }

    return NextResponse.json({
      job: "cross-sell",
      status: "completed",
      crossSellCount,
      message: `${crossSellCount} cross-sell programmées`,
    });
  } catch (error) {
    console.error("Erreur lors du cross-sell:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'exécution du cross-sell" },
      { status: 500 }
    );
  }
}

// GET - Health check
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: "ok",
    availableJobs: ["sla-check", "relance", "cross-sell"],
    message: "Cron endpoint is ready. Use POST with job parameter.",
  });
}
