import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const mergeSchema = z.object({
  secondaryContactId: z.string().min(1),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session?.user || !["ADMIN", "MARKETING", "DIRECTION"].includes(role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  try {
    const { id: primaryId } = await params;
    const body = await request.json();
    const { secondaryContactId } = mergeSchema.parse(body);

    if (primaryId === secondaryContactId) {
      return NextResponse.json(
        { error: "Les deux contacts sont identiques." },
        { status: 400 }
      );
    }

    // Vérifier existence des deux contacts
    const [primary, secondary] = await Promise.all([
      prisma.contact.findUnique({ where: { id: primaryId } }),
      prisma.contact.findUnique({ where: { id: secondaryContactId } }),
    ]);

    if (!primary) return NextResponse.json({ error: "Contact principal introuvable." }, { status: 404 });
    if (!secondary) return NextResponse.json({ error: "Contact secondaire introuvable." }, { status: 404 });

    // Fusionner dans une transaction atomique
    await prisma.$transaction(async (tx) => {
      // 1. Résoudre le sellsyContactId : le principal garde le sien, sinon hérite du secondaire
      const newSellsyId = primary.sellsyContactId ?? secondary.sellsyContactId ?? null;

      // 2. Gérer ClubMembre si les deux ont un sellsyContactId
      if (primary.sellsyContactId && secondary.sellsyContactId) {
        const [cmPrimary, cmSecondary] = await Promise.all([
          tx.clubMembre.findUnique({ where: { sellsyContactId: primary.sellsyContactId } }),
          tx.clubMembre.findUnique({ where: { sellsyContactId: secondary.sellsyContactId } }),
        ]);
        if (cmPrimary && cmSecondary) {
          // Garder le niveau le plus élevé
          if (cmSecondary.niveau > cmPrimary.niveau) {
            await tx.clubMembre.update({
              where: { sellsyContactId: primary.sellsyContactId },
              data: {
                niveau: cmSecondary.niveau,
                totalCommandes: cmPrimary.totalCommandes + cmSecondary.totalCommandes,
                totalMontant: cmPrimary.totalMontant + cmSecondary.totalMontant,
              },
            });
          } else {
            // Additionner les montants même si le niveau du principal est supérieur
            await tx.clubMembre.update({
              where: { sellsyContactId: primary.sellsyContactId },
              data: {
                totalCommandes: cmPrimary.totalCommandes + cmSecondary.totalCommandes,
                totalMontant: cmPrimary.totalMontant + cmSecondary.totalMontant,
              },
            });
          }
          // Supprimer le ClubMembre du secondaire
          await tx.clubMembre.delete({ where: { sellsyContactId: secondary.sellsyContactId } });
        }
      }

      // 3. Réassigner toutes les relations vers le contact principal
      const toP = { contactId: primaryId };
      await tx.lead.updateMany({ where: { contactId: secondaryContactId }, data: toP });
      await tx.devis.updateMany({ where: { contactId: secondaryContactId }, data: toP });
      await tx.vente.updateMany({ where: { contactId: secondaryContactId }, data: toP });
      await tx.evenement.updateMany({ where: { contactId: secondaryContactId }, data: toP });
      await tx.clickEvent.updateMany({ where: { contactId: secondaryContactId }, data: toP });
      await tx.emailLog.updateMany({ where: { contactId: secondaryContactId }, data: toP });
      await tx.smsLog.updateMany({ where: { contactId: secondaryContactId }, data: toP });
      await tx.demandePrix.updateMany({ where: { contactId: secondaryContactId }, data: toP });
      await tx.task.updateMany({ where: { contactId: secondaryContactId }, data: toP });
      await tx.dossierSAV.updateMany({ where: { contactId: secondaryContactId }, data: toP });
      await tx.rendezVous.updateMany({ where: { contactId: secondaryContactId }, data: toP });

      // 4. Mettre à jour le contact principal (hériter sellsyContactId si nécessaire)
      if (newSellsyId !== primary.sellsyContactId) {
        await tx.contact.update({
          where: { id: primaryId },
          data: { sellsyContactId: newSellsyId },
        });
      }

      // 5. Supprimer le contact secondaire (toutes ses FK ont été réassignées)
      await tx.contact.delete({ where: { id: secondaryContactId } });
    });

    return NextResponse.json({
      success: true,
      primaryContactId: primaryId,
      message: `Fusion réussie. Toutes les données de "${secondary.prenom || ""} ${secondary.nom}" ont été transférées.`,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Données invalides." }, { status: 400 });
    }
    console.error("[merge] Erreur:", error);
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 });
  }
}
