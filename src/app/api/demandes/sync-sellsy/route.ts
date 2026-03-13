import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/demandes/sync-sellsy
 *
 * Vérifie les statuts leads en croisant avec les données LOCALES (Prisma).
 * Plus d'appels API Sellsy séquentiels — tout est en base.
 *
 * Logique :
 *   - Contact a un BDC (Vente) créé APRÈS la demande → VENTE
 *   - Contact a un Devis créé APRÈS la demande → DEVIS
 *   - Sinon → NOUVEAU (correction des faux positifs)
 *   - Statut PERDU = manuel, jamais touché
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    // 1. Récupérer TOUTES les demandes avec un lead (sauf PERDU = statut manuel)
    const demandes = await prisma.demandePrix.findMany({
      where: {
        contact: {
          leads: {
            some: {
              statut: { in: ["NOUVEAU", "EN_COURS", "DEVIS", "VENTE"] },
            },
          },
        },
      },
      select: {
        id: true,
        contactId: true,
        createdAt: true,
        contact: {
          select: {
            email: true,
            leads: {
              where: { statut: { in: ["NOUVEAU", "EN_COURS", "DEVIS", "VENTE"] } },
              orderBy: { createdAt: "desc" as const },
              take: 1,
              select: { id: true, statut: true },
            },
            // Devis et Ventes depuis la base locale (déjà syncés)
            devis: {
              select: { id: true, createdAt: true },
              orderBy: { createdAt: "desc" as const },
            },
            ventes: {
              select: { id: true, createdAt: true },
              orderBy: { createdAt: "desc" as const },
            },
          },
        },
      },
    });

    const updates: { leadId: string; email: string; oldStatut: string; newStatut: string }[] = [];

    // 2. Pour chaque demande, vérifier le statut avec les données locales
    for (const demande of demandes) {
      const contact = demande.contact;
      const lead = contact.leads[0];
      if (!lead) continue;

      const demandeTs = demande.createdAt.getTime();

      // Chercher un BDC (Vente) créé APRÈS la demande
      const recentVente = contact.ventes.find(
        (v) => v.createdAt.getTime() >= demandeTs
      );

      // Chercher un Devis créé APRÈS la demande
      const recentDevis = contact.devis.find(
        (d) => d.createdAt.getTime() >= demandeTs
      );

      // Déterminer le statut correct
      const correctStatut = recentVente
        ? "VENTE" as const
        : recentDevis
          ? "DEVIS" as const
          : "NOUVEAU" as const;

      // Mettre à jour seulement si le statut est différent
      if (lead.statut !== correctStatut) {
        await prisma.lead.update({
          where: { id: lead.id },
          data: { statut: correctStatut },
        });
        updates.push({
          leadId: lead.id,
          email: contact.email || "",
          oldStatut: lead.statut,
          newStatut: correctStatut,
        });
      }
    }

    // 3. Recompter les stats
    const demandesAvecLeads = await prisma.demandePrix.findMany({
      where: {
        contact: {
          leads: { some: {} },
        },
      },
      select: {
        contact: {
          select: {
            leads: {
              orderBy: { createdAt: "desc" as const },
              take: 1,
              select: { statut: true },
            },
          },
        },
      },
    });

    const statsMap: Record<string, number> = {
      NOUVEAU: 0, EN_COURS: 0, DEVIS: 0, VENTE: 0, PERDU: 0,
    };
    for (const d of demandesAvecLeads) {
      const statut = d.contact.leads[0]?.statut || "NOUVEAU";
      statsMap[statut] = (statsMap[statut] || 0) + 1;
    }

    const stats = {
      total: demandesAvecLeads.length,
      nouveau: statsMap["NOUVEAU"],
      enCours: statsMap["EN_COURS"],
      devis: statsMap["DEVIS"],
      vente: statsMap["VENTE"],
      perdu: statsMap["PERDU"],
    };

    return NextResponse.json({
      success: true,
      updates,
      stats,
      _syncedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("POST /api/demandes/sync-sellsy error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}
