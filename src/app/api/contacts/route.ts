import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
// KPIs maintenant 100% Prisma — plus besoin d'appeler l'API Sellsy à chaque page load
import { calculatePriority } from "@/lib/contact-priority";

// GET /api/contacts — Liste des contacts avec pagination, recherche, filtres
const filterSchema = z.object({
  search: z.string().optional(),
  stage: z.enum(["PROSPECT", "LEAD", "CLIENT", "INACTIF"]).optional(),
  showroomId: z.string().optional(),
  sort: z.enum(["derniere_demande", "dernier_devis", "dernier_bdc", "nom", "date_creation", "priorite"]).optional().default("derniere_demande"),
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

    // Pour les tris par relation (derniere_demande, dernier_devis, dernier_bdc),
    // on récupère d'abord les IDs triés via raw SQL pour un tri correct AVANT pagination
    let sortedIds: string[] | null = null;

    if (filters.sort === "derniere_demande" || filters.sort === "dernier_devis" || filters.sort === "dernier_bdc") {
      // Construire la clause WHERE en SQL
      const whereClauses: string[] = [];
      const whereParams: any[] = [];
      let paramIdx = 1;

      if (filters.search) {
        whereClauses.push(`(c."nom" ILIKE $${paramIdx} OR c."prenom" ILIKE $${paramIdx} OR c."email" ILIKE $${paramIdx} OR c."telephone" LIKE $${paramIdx})`);
        whereParams.push(`%${filters.search}%`);
        paramIdx++;
      }
      if (filters.stage) {
        whereClauses.push(`c."lifecycleStage"::text = $${paramIdx}`);
        whereParams.push(filters.stage);
        paramIdx++;
      }

      const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

      let joinSQL = "";
      let orderSQL = "";

      if (filters.sort === "derniere_demande") {
        joinSQL = `LEFT JOIN (SELECT "contactId", MAX(COALESCE("dateDemande", "createdAt")) as last_date FROM "DemandePrix" GROUP BY "contactId") dp ON dp."contactId" = c."id"`;
        orderSQL = `ORDER BY dp.last_date DESC NULLS LAST, c."createdAt" DESC`;
      } else if (filters.sort === "dernier_devis") {
        joinSQL = `LEFT JOIN (SELECT "contactId", MAX(COALESCE("dateEnvoi", "createdAt")) as last_date FROM "Devis" GROUP BY "contactId") dv ON dv."contactId" = c."id"`;
        orderSQL = `ORDER BY dv.last_date DESC NULLS LAST, c."createdAt" DESC`;
      } else if (filters.sort === "dernier_bdc") {
        joinSQL = `LEFT JOIN (SELECT "contactId", MAX(COALESCE("dateVente", "createdAt")) as last_date FROM "Vente" GROUP BY "contactId") v ON v."contactId" = c."id"`;
        orderSQL = `ORDER BY v.last_date DESC NULLS LAST, c."createdAt" DESC`;
      }

      whereParams.push(filters.limit);
      whereParams.push((filters.page - 1) * filters.limit);

      const rawQuery = `SELECT c."id" FROM "Contact" c ${joinSQL} ${whereSQL} ${orderSQL} LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;

      const rawResult: any[] = await prisma.$queryRawUnsafe(rawQuery, ...whereParams);
      sortedIds = rawResult.map((r: any) => r.id);
    }

    // Récupérer les contacts et les compteurs depuis la base de données
    const [contacts, total, prismaKpis] = await Promise.all([
      prisma.contact.findMany({
        where: sortedIds ? { ...where, id: { in: sortedIds } } : where,
        include: {
          showroom: { select: { id: true, nom: true } },
          demandesPrix: {
            orderBy: { createdAt: "desc" },
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
        ...(sortedIds
          ? {} // Pas de orderBy/skip/take Prisma, on trie manuellement après
          : {
              orderBy: filters.sort === "nom"
                ? [{ nom: "asc" as const }]
                : filters.sort === "date_creation"
                ? [{ createdAt: "desc" as const }]
                : [{ updatedAt: "desc" as const }],
              skip: (filters.page - 1) * filters.limit,
              take: filters.limit,
            }),
      }),
      prisma.contact.count({ where }),
      // KPIs 100% Prisma (plus rapide et fiable que les filtres Sellsy V2 cassés)
      prisma.$transaction([
        prisma.contact.count({ where: { sellsyContactId: { not: null } } }),
        prisma.contact.count({ where: { ventes: { some: {} } } }),
        prisma.vente.aggregate({ _sum: { montant: true } }),
        prisma.devis.count(),
        prisma.vente.count(),
      ]),
    ]);

    // KPIs depuis la base de données (sync Sellsy → Prisma)
    const totalCABDC = prismaKpis[2]._sum.montant || 0;
    const totalDevisDB = prismaKpis[3] as number;
    const totalVentesDB = prismaKpis[4] as number;

    // Rétablir l'ordre des IDs triés par raw SQL
    let sortedContacts = contacts;
    if (sortedIds) {
      const idOrder = new Map(sortedIds.map((id, idx) => [id, idx]));
      sortedContacts = [...contacts].sort((a, b) => (idOrder.get(a.id) ?? 999) - (idOrder.get(b.id) ?? 999));
    }

    // Calculate priority for each contact (Intention + Historique + Fraîcheur)
    const contactsWithPriority = sortedContacts.map((c: any) => {
      const priority = calculatePriority(
        { lifecycleStage: c.lifecycleStage, createdAt: c.createdAt },
        (c.devis || []).map((d: any) => ({
          statut: d.statut,
          montant: d.montant,
          dateEnvoi: d.dateEnvoi,
          createdAt: d.createdAt,
        })),
        (c.ventes || []).map((v: any) => ({
          montant: v.montant,
          dateVente: v.dateVente,
          createdAt: v.createdAt,
        })),
        (c.demandesPrix || []).map((dp: any) => ({
          dateDemande: dp.dateDemande,
          createdAt: dp.createdAt,
        }))
      );
      return { ...c, priority };
    });

    // Sort by priority if requested
    let finalContacts = contactsWithPriority;
    if (filters.sort === "priorite") {
      finalContacts = [...contactsWithPriority].sort((a, b) => b.priority.score - a.priority.score);
    }

    return NextResponse.json({
      contacts: finalContacts,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit),
      },
      kpis: {
        totalContacts: total,
        totalLinkedSellsy: prismaKpis[0],
        totalAvecBDC: prismaKpis[1],
        totalCABDC,
        totalDevis: totalDevisDB,
        totalVentes: totalVentesDB,
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
