import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { genererNumeroProjet } from "@/lib/projet-sur-mesure-numero";
import { notifierTransitionProjet } from "@/lib/sur-mesure-notifications";
import { z } from "zod";

const STATUTS_ACTIFS = [
  "DEMANDE", "DESSIN_DEMANDE", "RDV_CLIENT", "DESSIN_EN_COURS",
  "PLANS_PRETS", "NEED_PRICE", "PRIX_RECU", "PRESENTE_CLIENT",
];

/**
 * GET /api/sur-mesure — liste projets + filtres + KPIs.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const { searchParams } = req.nextUrl;
    const search = searchParams.get("search") || "";
    const statut = searchParams.get("statut") || "";
    const type = searchParams.get("type") || "";
    const assigneId = searchParams.get("assigneId") || "";
    const priorite = searchParams.get("priorite") || "";
    const montantMin = searchParams.get("montantMin");
    const nonConverti = searchParams.get("nonConverti") === "true";

    const where: Record<string, unknown> = { deletedAt: null };
    if (statut) where.statut = statut;
    if (type) where.typeProjet = type;
    if (assigneId) where.assigneId = assigneId;
    if (priorite) where.priorite = priorite;
    if (montantMin) where.montantSellsy = { gte: parseFloat(montantMin) };
    if (nonConverti) {
      // Sur-mesure > seuil non converti en BDC
      where.typeSellsy = "DEVIS";
      where.OR = [
        { statutConversion: null },
        { statutConversion: { not: "converti" } },
      ];
    }
    if (search) {
      where.OR = [
        { numero: { contains: search, mode: "insensitive" } },
        { titre: { contains: search, mode: "insensitive" } },
        { numeroSellsy: { contains: search, mode: "insensitive" } },
        { contact: { is: { nom: { contains: search, mode: "insensitive" } } } },
      ];
    }

    const projets = await prisma.projetSurMesure.findMany({
      where,
      include: {
        contact: { select: { id: true, nom: true, prenom: true } },
        proprietaire: { select: { id: true, prenom: true, nom: true } },
        assigne: { select: { id: true, prenom: true, nom: true } },
        documents: {
          where: { deletedAt: null },
          select: { id: true, estCouverture: true, url: true, type: true },
        },
        _count: { select: { commentaires: true, documents: true } },
      },
      orderBy: [{ priorite: "desc" }, { updatedAt: "desc" }],
    });

    // KPIs
    const tous = await prisma.projetSurMesure.findMany({
      where: { deletedAt: null },
      select: {
        statut: true, typeSellsy: true, montantSellsy: true,
        createdAt: true,
      },
    });
    const enCours = tous.filter((p) => STATUTS_ACTIFS.includes(p.statut)).length;
    const gagnes = tous.filter((p) => p.statut === "GAGNE" && p.typeSellsy === "DEVIS").length;
    const perdus = tous.filter((p) => p.statut === "PERDU" && p.typeSellsy === "DEVIS").length;
    const tauxConversion = gagnes + perdus > 0 ? Math.round((gagnes / (gagnes + perdus)) * 100) : 0;
    const valeurPipeline = tous
      .filter((p) => STATUTS_ACTIFS.includes(p.statut))
      .reduce((s, p) => s + (p.montantSellsy || 0), 0);
    const parStatut: Record<string, number> = {};
    for (const p of tous) parStatut[p.statut] = (parStatut[p.statut] || 0) + 1;

    return NextResponse.json({
      projets,
      kpis: {
        enCours,
        tauxConversion,
        valeurPipeline: Math.round(valeurPipeline),
        parStatut,
        total: tous.length,
      },
    });
  } catch (e) {
    console.error("[sur-mesure GET]", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

const createSchema = z.object({
  titre: z.string().min(1),
  typeProjet: z.enum(["CUISINE", "DRESSING", "SDB", "MOBILIER", "AMENAGEMENT_COLLECTIVITE", "AUTRE"]),
  briefTechnique: z.string().optional().nullable(),
  priorite: z.enum(["NORMAL", "URGENT"]).optional(),
  contactId: z.string().optional().nullable(),
  numeroSellsy: z.string().optional().nullable(),
  assigneId: z.string().optional().nullable(),
  echeance: z.string().datetime().optional().nullable(),
});

/**
 * POST /api/sur-mesure — création projet (par le commercial).
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const userId = (session.user as { id?: string }).id;
  if (!userId) return NextResponse.json({ error: "Session invalide" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Paramètres invalides", details: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;

  // Détection type Sellsy depuis le préfixe
  let typeSellsy: "DEVIS" | "BON_COMMANDE" | undefined;
  if (d.numeroSellsy) {
    const up = d.numeroSellsy.toUpperCase();
    if (up.startsWith("BCDI")) typeSellsy = "BON_COMMANDE";
    else if (up.startsWith("DEPI")) typeSellsy = "DEVIS";
  }
  // BCDI = commande signée → entre directement à DESSIN_DEMANDE
  const statutInitial = "DESSIN_DEMANDE";

  try {
    const numero = await genererNumeroProjet();
    const projet = await prisma.projetSurMesure.create({
      data: {
        numero,
        titre: d.titre,
        typeProjet: d.typeProjet,
        statut: statutInitial,
        priorite: d.priorite || "NORMAL",
        briefTechnique: d.briefTechnique || null,
        contactId: d.contactId || null,
        numeroSellsy: d.numeroSellsy || null,
        typeSellsy: typeSellsy || null,
        proprietaireId: userId,
        assigneId: d.assigneId || null,
        echeance: d.echeance ? new Date(d.echeance) : null,
      },
      include: {
        contact: { select: { id: true, nom: true, prenom: true } },
        proprietaire: { select: { id: true, prenom: true, nom: true, email: true } },
      },
    });

    // Journal Evenement
    if (projet.contactId) {
      await prisma.evenement.create({
        data: {
          contactId: projet.contactId,
          type: "PROJET_CREE",
          description: `Projet sur-mesure créé : ${projet.numero} — ${projet.titre}`,
          metadata: { projetId: projet.id, numero: projet.numero },
        },
      }).catch(() => {});
    }

    // Notification équipe
    notifierTransitionProjet({
      projetId: projet.id,
      numero: projet.numero,
      titre: projet.titre,
      transition: "DESSIN_DEMANDE",
      proprietaireEmail: projet.proprietaire?.email,
    }).catch(() => {});

    return NextResponse.json({ projet }, { status: 201 });
  } catch (e) {
    console.error("[sur-mesure POST]", e);
    return NextResponse.json({ error: "Erreur création" }, { status: 500 });
  }
}
