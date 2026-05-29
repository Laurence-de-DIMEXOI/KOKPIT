import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifierTransitionProjet } from "@/lib/sur-mesure-notifications";
import { z } from "zod";

const schema = z.object({
  nom: z.string().min(1),
  type: z.enum(["photo", "croquis", "inspiration", "plan_3d", "autre"]),
  url: z.string().url(),
  path: z.string().min(1),
  estCouverture: z.boolean().optional(),
});

/**
 * POST /api/sur-mesure/[id]/documents
 * Enregistre un document déjà uploadé sur Supabase Storage (URL + path fournis par le client).
 * Si type = plan_3d → notifie l'équipe (plans ajoutés).
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const userId = (session.user as { id?: string }).id;
  if (!userId) return NextResponse.json({ error: "Session invalide" }, { status: 401 });
  const { id } = await params;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  const d = parsed.data;

  const projet = await prisma.projetSurMesure.findFirst({
    where: { id, deletedAt: null },
    include: { proprietaire: { select: { email: true } } },
  });
  if (!projet) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  // Si on marque comme couverture, retirer le flag des autres
  if (d.estCouverture) {
    await prisma.documentProjetSurMesure.updateMany({
      where: { projetId: id, estCouverture: true },
      data: { estCouverture: false },
    });
  }

  const document = await prisma.documentProjetSurMesure.create({
    data: {
      projetId: id,
      nom: d.nom,
      type: d.type,
      url: d.url,
      path: d.path,
      estCouverture: d.estCouverture || false,
      uploadedById: userId,
    },
    include: { uploadedBy: { select: { prenom: true, nom: true } } },
  });

  // Plan 3D ajouté → notif + journal
  if (d.type === "plan_3d") {
    notifierTransitionProjet({
      projetId: projet.id,
      numero: projet.numero,
      titre: projet.titre,
      transition: "PLANS_AJOUTES",
      proprietaireEmail: projet.proprietaire?.email,
    }).catch(() => {});
    if (projet.contactId) {
      await prisma.evenement.create({
        data: {
          contactId: projet.contactId,
          type: "DESSIN_AJOUTE",
          description: `Plan 3D ajouté sur ${projet.numero} : ${d.nom}`,
          metadata: { projetId: projet.id, documentNom: d.nom },
        },
      }).catch(() => {});
    }
  }

  return NextResponse.json({ document }, { status: 201 });
}

/** DELETE /api/sur-mesure/[id]/documents?documentId=xxx — soft delete */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  await params;
  const documentId = req.nextUrl.searchParams.get("documentId");
  if (!documentId) return NextResponse.json({ error: "documentId requis" }, { status: 400 });

  await prisma.documentProjetSurMesure.update({
    where: { id: documentId },
    data: { deletedAt: new Date() },
  });
  return NextResponse.json({ success: true });
}
