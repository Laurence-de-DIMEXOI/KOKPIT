import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  searchEstimates,
  listOrders,
} from "@/lib/sellsy";

/**
 * POST /api/demandes/sync-sellsy
 *
 * 1. Micro-refresh : importe les devis/BDC Sellsy des 14 derniers jours (2 appels API max)
 * 2. Vérifie les statuts leads en croisant avec les données locales Prisma
 *
 * Logique statuts :
 *   - Contact a un BDC (Vente) créé APRÈS la demande → VENTE
 *   - Contact a un Devis créé APRÈS la demande → DEVIS
 *   - Sinon → NOUVEAU (correction des faux positifs)
 *   - Statut PERDU = manuel, jamais touché
 */

function mapEstimateStatus(
  status: string
): "EN_ATTENTE" | "ENVOYE" | "ACCEPTE" | "REFUSE" | "EXPIRE" {
  const statusMap: Record<
    string,
    "EN_ATTENTE" | "ENVOYE" | "ACCEPTE" | "REFUSE" | "EXPIRE"
  > = {
    draft: "EN_ATTENTE",
    sent: "ENVOYE",
    read: "ENVOYE",
    accepted: "ACCEPTE",
    refused: "REFUSE",
    expired: "EXPIRE",
    cancelled: "REFUSE",
    invoiced: "ACCEPTE",
    partialinvoiced: "ACCEPTE",
    advanced: "ACCEPTE",
  };
  return statusMap[status?.toLowerCase()] || "EN_ATTENTE";
}

// Pas de mapOrderStatus — le modèle Vente n'a pas de champ statut

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    // ── ÉTAPE 0 : Micro-refresh Sellsy (devis + BDC des 14 derniers jours) ──
    // 2 appels API seulement — pas N×3 comme avant
    const since14j = new Date();
    since14j.setDate(since14j.getDate() - 14);
    const sinceStr = since14j.toISOString().split("T")[0]; // "2026-03-01"

    let freshDevis = 0;
    let freshVentes = 0;

    // Map sellsyContactId → kokpitContactId pour le matching
    const contactsBySellsyId = new Map<string, string>();
    const contactsByEmail = new Map<string, string>();
    const kokpitContacts = await prisma.contact.findMany({
      select: { id: true, email: true, sellsyContactId: true },
    });
    for (const c of kokpitContacts) {
      if (c.sellsyContactId) {
        // sellsyContactId peut contenir plusieurs IDs séparés par des virgules
        for (const sid of c.sellsyContactId.split(",")) {
          contactsBySellsyId.set(sid.trim(), c.id);
        }
      }
      if (c.email) contactsByEmail.set(c.email.toLowerCase().trim(), c.id);
    }

    // Fetch recent estimates (1 appel API)
    try {
      const estRes = await searchEstimates({
        filters: { date: { start: sinceStr } },
        limit: 100,
        offset: 0,
        order: "created",
        direction: "desc",
      });

      for (const est of estRes.data || []) {
        // Trouver le contact KOKPIT via related[] ou contact_id
        const relatedIds = (est.related || []).map((r) => String(r.id));
        let kokpitContactId =
          relatedIds.map((rid) => contactsBySellsyId.get(rid)).find(Boolean) ||
          (est.contact_id
            ? contactsBySellsyId.get(String(est.contact_id))
            : undefined);

        if (!kokpitContactId) continue;

        try {
          await prisma.devis.upsert({
            where: { sellsyQuoteId: String(est.id) },
            update: {
              statut: mapEstimateStatus(est.status),
              montant: Number(est.amounts?.total_excl_tax) || 0,
              dateEnvoi:
                est.status === "sent" ? new Date(est.date) : undefined,
            },
            create: {
              contactId: kokpitContactId,
              sellsyQuoteId: String(est.id),
              montant: Number(est.amounts?.total_excl_tax) || 0,
              statut: mapEstimateStatus(est.status),
              dateEnvoi:
                est.status === "sent" ? new Date(est.date) : undefined,
            },
          });
          freshDevis++;
        } catch {
          // Ignore individual upsert errors
        }
      }
    } catch (err) {
      console.warn("Micro-refresh estimates skipped:", err);
    }

    // Fetch recent orders (1 appel API)
    try {
      const ordRes = await listOrders({
        limit: 100,
        offset: 0,
        order: "created",
        direction: "desc",
      });

      // Filtrer manuellement les orders des 14 derniers jours
      const recentOrders = (ordRes.data || []).filter(
        (o) => new Date(o.created) >= since14j
      );

      for (const ord of recentOrders) {
        const relatedIds = (ord.related || []).map((r) => String(r.id));
        let kokpitContactId =
          relatedIds
            .map((rid) => contactsBySellsyId.get(rid))
            .find(Boolean) ||
          (ord.contact_id
            ? contactsBySellsyId.get(String(ord.contact_id))
            : undefined);

        if (!kokpitContactId) continue;

        try {
          await prisma.vente.upsert({
            where: { sellsyInvoiceId: String(ord.id) },
            update: {
              montant: Number(ord.amounts?.total_excl_tax) || 0,
            },
            create: {
              contactId: kokpitContactId,
              sellsyInvoiceId: String(ord.id),
              montant: Number(ord.amounts?.total_excl_tax) || 0,
              dateVente: new Date(ord.date || ord.created),
            },
          });
          freshVentes++;
        } catch {
          // Ignore individual upsert errors
        }
      }
    } catch (err) {
      console.warn("Micro-refresh orders skipped:", err);
    }

    console.log(
      `Micro-refresh: ${freshDevis} devis, ${freshVentes} ventes (since ${sinceStr})`
    );

    // ── ÉTAPE 1 : Récupérer les demandes avec leads ──
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
              where: {
                statut: { in: ["NOUVEAU", "EN_COURS", "DEVIS", "VENTE"] },
              },
              orderBy: { createdAt: "desc" as const },
              take: 1,
              select: { id: true, statut: true },
            },
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

    const updates: {
      leadId: string;
      email: string;
      oldStatut: string;
      newStatut: string;
    }[] = [];

    // ── ÉTAPE 2 : Vérifier les statuts avec les données locales ──
    for (const demande of demandes) {
      const contact = demande.contact;
      const lead = contact.leads[0];
      if (!lead) continue;

      const demandeTs = demande.createdAt.getTime();

      const recentVente = contact.ventes.find(
        (v) => v.createdAt.getTime() >= demandeTs
      );
      const recentDevis = contact.devis.find(
        (d) => d.createdAt.getTime() >= demandeTs
      );

      const correctStatut = recentVente
        ? ("VENTE" as const)
        : recentDevis
          ? ("DEVIS" as const)
          : ("NOUVEAU" as const);

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

    // ── ÉTAPE 3 : Recompter les stats ──
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
      NOUVEAU: 0,
      EN_COURS: 0,
      DEVIS: 0,
      VENTE: 0,
      PERDU: 0,
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
      _microRefresh: { freshDevis, freshVentes, since: sinceStr },
      _syncedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("POST /api/demandes/sync-sellsy error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 },
    );
  }
}
