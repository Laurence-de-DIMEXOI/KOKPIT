import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// GET /api/contacts — Liste des contacts avec pagination, recherche, filtres
const filterSchema = z.object({
  search: z.string().optional(),
  stage: z.enum(["PROSPECT", "LEAD", "CLIENT", "INACTIF"]).optional(),
  showroomId: z.string().optional(),
  sort: z.enum(["derniere_demande", "dernier_devis", "dernier_bdc", "nom", "date_creation"]).optional().default("derniere_demande"),
  page: z.coerce.number().positive().default(1),
  limit: z.coerce.number().min(1).max(100).default(25),
});

export async function GET(request: NextRequest) {
  try {
    const params = Object.fromEntries(request.nextUrl.searchParams);
    const filters = filterSchema.parse(params);

    const where: any = {};

    if (filters.search) {
      where.OR = [
        { nom: { contains: filters.search, mode: "insensitive" } },
        { prenom: { contains: filters.search, mode: "insensitive" } },
        { email: { contains: filters.search, mode: "insensitive" } },
        { telephone: { contains: filters.search } },
      ];
    }

    if (filters.stage) {
      where.lifecycleStage = filters.stage;
    }

    if (filters.showroomId) {
      where.showroomId = filters.showroomId;
    }

    const [contacts, total, kpiData] = await Promise.all([
      prisma.contact.findMany({
        where,
        include: {
          showroom: { select: { id: true, nom: true } },
          demandesPrix: {
            orderBy: { dateDemande: "desc" },
          },
          devis: {
            select: {
              id: true,
              sellsyQuoteId: true,
              montant: true,
              statut: true,
              dateEnvoi: true,
              createdAt: true,
            },
            orderBy: { createdAt: "desc" },
          },
          ventes: {
            select: {
              id: true,
              sellsyInvoiceId: true,
              montant: true,
              dateVente: true,
              createdAt: true,
            },
            orderBy: { dateVente: "desc" },
          },
          _count: {
            select: { demandesPrix: true, leads: true, devis: true, ventes: true },
          },
        },
        orderBy: filters.sort === "nom"
          ? [{ nom: "asc" as const }]
          : filters.sort === "date_creation"
          ? [{ createdAt: "desc" as const }]
          : [{ updatedAt: "desc" as const }],
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      prisma.contact.count({ where }),
      // KPIs globaux
      prisma.$transaction([
        prisma.contact.count({ where: { sellsyContactId: { not: null } } }),
        prisma.contact.count({ where: { ventes: { some: {} } } }),
        prisma.vente.aggregate({ _sum: { montant: true } }),
        prisma.devis.count(),
        prisma.vente.count(),
      ]),
    ]);

    // Tri côté serveur pour les colonnes nécessitant un accès aux relations
    if (filters.sort === "derniere_demande") {
      contacts.sort((a: any, b: any) => {
        const dateA = a.demandesPrix?.[0]?.dateDemande;
        const dateB = b.demandesPrix?.[0]?.dateDemande;
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });
    } else if (filters.sort === "dernier_devis") {
      contacts.sort((a: any, b: any) => {
        const dateA = a.devis?.[0]?.createdAt || a.devis?.[0]?.dateEnvoi;
        const dateB = b.devis?.[0]?.createdAt || b.devis?.[0]?.dateEnvoi;
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });
    } else if (filters.sort === "dernier_bdc") {
      contacts.sort((a: any, b: any) => {
        const dateA = a.ventes?.[0]?.dateVente;
        const dateB = b.ventes?.[0]?.dateVente;
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });
    }

    return NextResponse.json({
      contacts,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit),
      },
      kpis: {
        totalContacts: total,
        totalLinkedSellsy: kpiData[0],
        totalAvecBDC: kpiData[1],
        totalCABDC: kpiData[2]._sum.montant || 0,
        totalDevis: kpiData[3],
        totalVentes: kpiData[4],
      },
    });
  } catch (error: any) {
    console.error("GET /api/contacts error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}

// POST /api/contacts — Créer un nouveau contact
const createSchema = z.object({
  email: z.string().email(),
  nom: z.string().min(1),
  prenom: z.string().default(""),
  telephone: z.string().optional(),
  showroomId: z.string().optional(),
  lifecycleStage: z.enum(["PROSPECT", "LEAD", "CLIENT", "INACTIF"]).default("PROSPECT"),
  consentOffre: z.boolean().default(false),
  consentNewsletter: z.boolean().default(false),
  consentInvitation: z.boolean().default(false),
  consentDevis: z.boolean().default(false),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = createSchema.parse(body);

    // Vérifier si l'email existe déjà
    const existing = await prisma.contact.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Un contact avec cet email existe déjà" },
        { status: 409 }
      );
    }

    const contact = await prisma.contact.create({
      data,
      include: {
        showroom: { select: { id: true, nom: true } },
        demandesPrix: true,
        _count: {
          select: { demandesPrix: true, leads: true, devis: true },
        },
      },
    });

    return NextResponse.json(contact, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }
    console.error("POST /api/contacts error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}
