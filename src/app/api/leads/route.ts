import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { leadSchema, contactSchema } from "@/lib/validators";
import { calculateSlaDeadline } from "@/lib/sla";
import { parseUtmParams, parseMetaClickId, parseGclid } from "@/lib/utm";
import { z } from "zod";

// Validation schemas
const leadFilterSchema = z.object({
  statut: z.enum(["NOUVEAU", "EN_COURS", "DEVIS", "VENTE", "PERDU"]).optional(),
  source: z.string().optional(),
  showroomId: z.string().uuid().optional(),
  commercialId: z.string().uuid().optional(),
  search: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  page: z.coerce.number().positive().default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

const createLeadSchema = z.object({
  contactId: z.string().uuid().optional(),
  contact: contactSchema.optional(),
  source: z.string(),
  showroomId: z.string().uuid().optional(),
  produitsDemandes: z.any().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  utmContent: z.string().optional(),
  utmTerm: z.string().optional(),
  gclid: z.string().optional(),
  fbclid: z.string().optional(),
  notes: z.string().optional(),
});

// GET - List leads with filters and pagination
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
    const filters = leadFilterSchema.parse({
      statut: searchParams.get("statut"),
      source: searchParams.get("source"),
      showroomId: searchParams.get("showroomId"),
      commercialId: searchParams.get("commercialId"),
      search: searchParams.get("search"),
      dateFrom: searchParams.get("dateFrom"),
      dateTo: searchParams.get("dateTo"),
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
    });

    // Build where clause
    const where: any = {};

    if (filters.statut) where.statut = filters.statut;
    if (filters.source) where.source = filters.source;
    if (filters.showroomId) where.showroomId = filters.showroomId;
    if (filters.commercialId) where.commercialId = filters.commercialId;

    if (filters.search) {
      where.OR = [
        { contact: { prenom: { contains: filters.search, mode: "insensitive" } } },
        { contact: { nom: { contains: filters.search, mode: "insensitive" } } },
        { contact: { email: { contains: filters.search, mode: "insensitive" } } },
        { contact: { telephone: { contains: filters.search, mode: "insensitive" } } },
      ];
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.createdAt.lte = new Date(filters.dateTo);
      }
    }

    // Get paginated leads
    const skip = (filters.page - 1) * filters.limit;
    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        include: {
          contact: true,
          showroom: true,
          commercial: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: filters.limit,
      }),
      prisma.lead.count({ where }),
    ]);

    const totalPages = Math.ceil(total / filters.limit);

    return NextResponse.json({
      leads,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des leads:", error);
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

// POST - Create new lead
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const session = await getServerSession(authOptions);

    // Allow creation without auth (for external forms) or with auth
    let contactId = body.contactId;

    if (!contactId && !body.contact) {
      return NextResponse.json(
        { error: "contactId ou données de contact requises" },
        { status: 400 }
      );
    }

    // Create or find contact if contact data provided
    if (!contactId && body.contact) {
      const contactData = contactSchema.parse(body.contact);

      // Check if contact exists by email
      let contact = await prisma.contact.findUnique({
        where: { email: contactData.email },
      });

      if (contact) {
        // Update existing contact with new data
        contact = await prisma.contact.update({
          where: { email: contactData.email },
          data: {
            telephone: contactData.telephone || contact.telephone,
            nom: contactData.nom || contact.nom,
            prenom: contactData.prenom || contact.prenom,
            adresse: contactData.adresse || contact.adresse,
            ville: contactData.ville || contact.ville,
            codePostal: contactData.codePostal || contact.codePostal,
          },
        });
      } else {
        // Create new contact
        contact = await prisma.contact.create({
          data: {
            email: contactData.email,
            telephone: contactData.telephone,
            nom: contactData.nom,
            prenom: contactData.prenom,
            adresse: contactData.adresse,
            ville: contactData.ville,
            codePostal: contactData.codePostal,
            showroomId: body.showroomId,
            rgpdEmailConsent: body.rgpdEmailConsent || false,
            rgpdSmsConsent: body.rgpdSmsConsent || false,
            lifecycleStage: "PROSPECT",
          },
        });

        // Log contact creation event
        await prisma.evenement.create({
          data: {
            contactId: contact.id,
            type: "CREATION_LEAD",
            description: `Contact créé via formulaire`,
            auteurId: session?.user?.id,
          },
        });
      }

      contactId = contact.id;
    }

    // Parse lead data
    const leadData = {
      contactId,
      source: body.source || "FORMULAIRE",
      showroomId: body.showroomId,
      produitsDemandes: body.produitsDemandes,
      utmSource: body.utmSource,
      utmMedium: body.utmMedium,
      utmCampaign: body.utmCampaign,
      utmContent: body.utmContent,
      utmTerm: body.utmTerm,
      gclid: body.gclid,
      metaClickId: body.fbclid,
      notes: body.notes,
    };

    // Calculate SLA deadline (72 business hours)
    const slaDeadline = calculateSlaDeadline(new Date());

    // Auto-route to showroom if not provided
    let showroomId = body.showroomId;
    if (!showroomId) {
      const contact = await prisma.contact.findUnique({
        where: { id: contactId },
      });
      showroomId = contact?.showroomId;
    }

    // Auto-assign commercial (round-robin by showroom)
    let commercialId = null;
    if (showroomId) {
      const commercials = await prisma.user.findMany({
        where: {
          showroomId,
          role: "COMMERCIAL",
          actif: true,
        },
        select: { id: true },
        orderBy: { createdAt: "asc" },
      });

      if (commercials.length > 0) {
        // Simple round-robin: get the one with the least leads
        const commercialStats = await Promise.all(
          commercials.map(async (c) => ({
            id: c.id,
            leadCount: await prisma.lead.count({
              where: { commercialId: c.id },
            }),
          }))
        );

        const assigned = commercialStats.reduce((prev, current) =>
          current.leadCount < prev.leadCount ? current : prev
        );

        commercialId = assigned.id;
      }
    }

    // Create lead
    const lead = await prisma.lead.create({
      data: {
        ...leadData,
        showroomId,
        commercialId,
        slaDeadline,
        statut: "NOUVEAU",
      },
      include: {
        contact: true,
        showroom: true,
        commercial: true,
      },
    });

    // Log CREATION_LEAD event
    await prisma.evenement.create({
      data: {
        leadId: lead.id,
        contactId: lead.contactId,
        type: "CREATION_LEAD",
        description: `Lead créé - Source: ${lead.source}`,
        auteurId: session?.user?.id,
        metadata: {
          utm: {
            source: lead.utmSource,
            medium: lead.utmMedium,
            campaign: lead.utmCampaign,
          },
        },
      },
    });

    // Trigger nurturing workflow (async)
    // In production, queue this as a job
    // await triggerNurturingWorkflow(lead.id);

    return NextResponse.json(lead, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de la création du lead:", error);
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
