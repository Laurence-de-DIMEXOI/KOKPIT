import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  searchContactByEmail,
  searchEstimates,
  searchOrders,
} from "@/lib/sellsy";

/**
 * POST /api/demandes/sync-sellsy
 *
 * Pour chaque demande avec un lead en statut NOUVEAU ou EN_COURS,
 * vérifie dans Sellsy (via l'email du contact) si un devis ou un BDC existe.
 *   - Devis trouvé → statut = DEVIS
 *   - BDC trouvé   → statut = VENTE
 *
 * Retourne les stats mises à jour.
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    // 1. Récupérer toutes les demandes avec lead NOUVEAU ou EN_COURS
    const demandes = await prisma.demandePrix.findMany({
      where: {
        contact: {
          leads: {
            some: {
              statut: { in: ["NOUVEAU", "EN_COURS"] },
            },
          },
        },
      },
      include: {
        contact: {
          include: {
            leads: {
              where: { statut: { in: ["NOUVEAU", "EN_COURS"] } },
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        },
      },
    });

    const updates: { leadId: string; email: string; oldStatut: string; newStatut: string; sellsyContactId?: number }[] = [];
    const errors: { email: string; error: string }[] = [];

    // 2. Pour chaque demande, chercher dans Sellsy par email
    for (const demande of demandes) {
      const email = demande.contact.email;
      const lead = demande.contact.leads[0];
      if (!email || !lead) continue;

      try {
        // Chercher le contact Sellsy par email
        const sellsyContact = await searchContactByEmail(email);
        if (!sellsyContact) continue; // Pas de contact Sellsy → reste en NOUVEAU

        const contactId = sellsyContact.id;

        // Chercher les BDC (priorité haute — si BDC existe → VENTE)
        const ordersRes = await searchOrders({
          filters: { contact_id: contactId },
          limit: 1,
        });

        if (ordersRes.data && ordersRes.data.length > 0) {
          // BDC trouvé → statut VENTE
          await prisma.lead.update({
            where: { id: lead.id },
            data: { statut: "VENTE" },
          });
          updates.push({
            leadId: lead.id,
            email,
            oldStatut: lead.statut,
            newStatut: "VENTE",
            sellsyContactId: contactId,
          });
          continue;
        }

        // Chercher les devis
        const estimatesRes = await searchEstimates({
          filters: { contact_id: contactId },
          limit: 1,
        });

        if (estimatesRes.data && estimatesRes.data.length > 0) {
          // Devis trouvé → statut DEVIS
          await prisma.lead.update({
            where: { id: lead.id },
            data: { statut: "DEVIS" },
          });
          updates.push({
            leadId: lead.id,
            email,
            oldStatut: lead.statut,
            newStatut: "DEVIS",
            sellsyContactId: contactId,
          });
          continue;
        }

        // Rien trouvé → on ne change pas le statut
      } catch (err: any) {
        errors.push({ email, error: err.message || "Erreur Sellsy" });
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
