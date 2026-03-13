import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  findSellsyContact,
  findDocumentsByRelated,
} from "@/lib/sellsy";

/**
 * POST /api/demandes/sync-sellsy
 *
 * Re-vérifie TOUS les leads (sauf PERDU) dans Sellsy via le champ `related`.
 *   - BDC trouvé   → statut = VENTE
 *   - Devis trouvé → statut = DEVIS
 *   - Rien trouvé  → statut = NOUVEAU (correction des faux positifs)
 *
 * IMPORTANT : Les filtres Sellsy V2 (third_ids, contact_id) sont CASSÉS.
 * On utilise `findDocumentsByRelated` qui filtre par `related[].id`.
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
      include: {
        contact: {
          select: {
            email: true,
            telephone: true,
            nom: true,
            prenom: true,
            leads: {
              where: { statut: { in: ["NOUVEAU", "EN_COURS", "DEVIS", "VENTE"] } },
              orderBy: { createdAt: "desc" as const },
              take: 1,
            },
          },
        },
      },
    });

    const updates: { leadId: string; email: string; oldStatut: string; newStatut: string; thirdId?: number }[] = [];
    const errors: { email: string; error: string }[] = [];

    // 2. Pour chaque demande, vérifier dans Sellsy et corriger le statut
    for (const demande of demandes) {
      const contact = demande.contact;
      const lead = contact.leads[0];
      if (!lead) continue;

      // Date de la demande = on ne compte que les docs Sellsy créés APRÈS
      const demandeTs = demande.createdAt.getTime();

      try {
        // Trouver le tiers Sellsy (individual ou company)
        const match = await findSellsyContact({
          email: contact.email,
          telephone: contact.telephone,
          nom: contact.nom,
          prenom: contact.prenom,
        });

        // Pas trouvé dans Sellsy → remettre en NOUVEAU si ce n'était pas déjà le cas
        if (!match?.thirdId) {
          if (lead.statut !== "NOUVEAU" && lead.statut !== "EN_COURS") {
            await prisma.lead.update({
              where: { id: lead.id },
              data: { statut: "NOUVEAU" },
            });
            updates.push({
              leadId: lead.id,
              email: contact.email || "",
              oldStatut: lead.statut,
              newStatut: "NOUVEAU",
            });
          }
          continue;
        }

        // Chercher les documents par `related` (filtrage côté serveur)
        const { estimates, orders } = await findDocumentsByRelated(match.thirdId);

        // Filtrer par date (créés APRÈS la demande)
        const recentOrder = orders.find(
          (o) => new Date(o.created).getTime() >= demandeTs
        );
        const recentEstimate = estimates.find(
          (e) => new Date(e.created).getTime() >= demandeTs
        );

        // Déterminer le statut correct
        const correctStatut = recentOrder
          ? "VENTE" as const
          : recentEstimate
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
            thirdId: match.thirdId,
          });
        }
      } catch (err: any) {
        errors.push({ email: contact.email || "", error: err.message || "Erreur Sellsy" });
      }
    }

    // 3. Recompter les stats — uniquement les leads liés à des DemandePrix
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
      errors: errors.length > 0 ? errors : undefined,
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
