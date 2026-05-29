import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifierTransitionProjet } from "@/lib/sur-mesure-notifications";
import { z } from "zod";

/**
 * GET /api/sur-mesure/[id] — détail complet d'un projet.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;

  const projet = await prisma.projetSurMesure.findFirst({
    where: { id, deletedAt: null },
    include: {
      contact: { select: { id: true, nom: true, prenom: true, email: true, telephone: true } },
      proprietaire: { select: { id: true, prenom: true, nom: true, email: true } },
      assigne: { select: { id: true, prenom: true, nom: true } },
      needPrice: true,
      documents: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        include: { uploadedBy: { select: { prenom: true, nom: true } } },
      },
      commentaires: {
        where: { deletedAt: null },
        orderBy: { createdAt: "asc" },
        include: { auteur: { select: { prenom: true, nom: true } } },
      },
      rendezVous: { orderBy: { dateDebut: "desc" } },
    },
  });
  if (!projet) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  // Journal d'activité (Evenement liés au contact + projetId en metadata)
  let activite: unknown[] = [];
  if (projet.contactId) {
    activite = await prisma.evenement.findMany({
      where: { contactId: projet.contactId },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: { type: true, description: true, createdAt: true, metadata: true },
    });
  }

  return NextResponse.json({ projet, activite });
}

const updateSchema = z.object({
  titre: z.string().min(1).optional(),
  typeProjet: z.enum(["CUISINE", "DRESSING", "SDB", "MOBILIER", "AMENAGEMENT_COLLECTIVITE", "AUTRE"]).optional(),
  statut: z.enum(["DEMANDE", "DESSIN_DEMANDE", "RDV_CLIENT", "DESSIN_EN_COURS", "PLANS_PRETS", "NEED_PRICE", "PRIX_RECU", "PRESENTE_CLIENT", "GAGNE", "PERDU"]).optional(),
  priorite: z.enum(["NORMAL", "URGENT"]).optional(),
  briefTechnique: z.string().optional().nullable(),
  contactId: z.string().optional().nullable(),
  numeroSellsy: z.string().optional().nullable(),
  assigneId: z.string().optional().nullable(),
  echeance: z.string().datetime().optional().nullable(),
});

/**
 * PATCH /api/sur-mesure/[id] — mise à jour champs + transitions de statut (+ notifs).
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  }
  const d = parsed.data;

  const existing = await prisma.projetSurMesure.findFirst({
    where: { id, deletedAt: null },
    include: { proprietaire: { select: { email: true } } },
  });
  if (!existing) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  // Re-détecter typeSellsy si numéro change
  let typeSellsy = existing.typeSellsy;
  if (d.numeroSellsy !== undefined && d.numeroSellsy) {
    const up = d.numeroSellsy.toUpperCase();
    if (up.startsWith("BCDI")) typeSellsy = "BON_COMMANDE";
    else if (up.startsWith("DEPI")) typeSellsy = "DEVIS";
  }

  const projet = await prisma.projetSurMesure.update({
    where: { id },
    data: {
      ...(d.titre !== undefined ? { titre: d.titre } : {}),
      ...(d.typeProjet !== undefined ? { typeProjet: d.typeProjet } : {}),
      ...(d.statut !== undefined ? { statut: d.statut } : {}),
      ...(d.priorite !== undefined ? { priorite: d.priorite } : {}),
      ...(d.briefTechnique !== undefined ? { briefTechnique: d.briefTechnique } : {}),
      ...(d.contactId !== undefined ? { contactId: d.contactId } : {}),
      ...(d.numeroSellsy !== undefined ? { numeroSellsy: d.numeroSellsy, typeSellsy } : {}),
      ...(d.assigneId !== undefined ? { assigneId: d.assigneId } : {}),
      ...(d.echeance !== undefined ? { echeance: d.echeance ? new Date(d.echeance) : null } : {}),
    },
    include: { proprietaire: { select: { email: true } } },
  });

  // Transitions notifiées
  if (d.statut && d.statut !== existing.statut) {
    const map: Record<string, "PLANS_AJOUTES" | "PRIX_RECU" | "VENTE_CONCLUE" | null> = {
      PLANS_PRETS: "PLANS_AJOUTES",
      PRIX_RECU: "PRIX_RECU",
      GAGNE: "VENTE_CONCLUE",
    };
    const transition = map[d.statut];
    if (transition) {
      notifierTransitionProjet({
        projetId: projet.id,
        numero: projet.numero,
        titre: projet.titre,
        transition,
        proprietaireEmail: projet.proprietaire?.email,
      }).catch(() => {});
    }
    // Journal
    if (projet.contactId) {
      const evtType =
        d.statut === "GAGNE" ? "PROJET_GAGNE"
        : d.statut === "PERDU" ? "PROJET_PERDU"
        : d.statut === "PRIX_RECU" ? "PRIX_RECU"
        : "CHANGEMENT_STATUT";
      await prisma.evenement.create({
        data: {
          contactId: projet.contactId,
          type: evtType as never,
          description: `Sur-mesure ${projet.numero} : ${existing.statut} → ${d.statut}`,
          metadata: { projetId: projet.id, ancienStatut: existing.statut, nouveauStatut: d.statut },
        },
      }).catch(() => {});
    }
  }

  return NextResponse.json({ projet });
}

/**
 * DELETE /api/sur-mesure/[id] — soft delete (ADMIN ou propriétaire).
 */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;
  const userId = (session.user as { id?: string }).id;
  const role = (session.user as { role?: string }).role || "";

  const existing = await prisma.projetSurMesure.findFirst({ where: { id, deletedAt: null } });
  if (!existing) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const peutSupprimer = ["ADMIN", "DIRECTION"].includes(role) || existing.proprietaireId === userId;
  if (!peutSupprimer) {
    return NextResponse.json({ error: "Suppression réservée au propriétaire ou ADMIN" }, { status: 403 });
  }

  await prisma.projetSurMesure.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  return NextResponse.json({ success: true });
}
