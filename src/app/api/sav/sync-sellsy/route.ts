import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sellsyFetch } from "@/lib/sellsy";
import { genererNumeroDossier } from "@/lib/sav-numero";

/**
 * Mapping statuts Sellsy → statuts SAV KOKPIT
 */
function mapSellsyStatut(sellsyStatus: string): string {
  switch (sellsyStatus?.toLowerCase()) {
    case "draft":
      return "A_TRAITER";
    case "sent":
    case "awaiting":
    case "awaiting_validation":
      return "EN_ATTENTE";
    case "confirmed":
    case "accepted":
    case "in_progress":
    case "partially_delivered":
      return "EN_COURS";
    case "delivered":
    case "invoiced":
    case "completed":
    case "billed":
      return "TRAITE";
    case "cancelled":
    case "expired":
    case "refused":
    case "rejected":
      return "CLOTURE";
    default:
      return "A_TRAITER";
  }
}

/**
 * POST /api/sav/sync-sellsy
 * Synchronise les bons de commande Sellsy ayant le champ personnalisé "SAV" défini.
 * Crée les DossierSAV manquants et met à jour le statut des existants.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    // ── Étape 1 : Trouver l'ID du champ personnalisé "SAV" sur les commandes ──
    let savFieldId: number | null = null;
    try {
      const cfRes = await sellsyFetch<{ data: any[] }>("/custom-fields?type=order&limit=200");
      const savField = cfRes.data?.find(
        (f: any) =>
          f.name?.toLowerCase() === "sav" ||
          f.code?.toLowerCase() === "sav" ||
          f.label?.toLowerCase() === "sav"
      );
      if (savField) savFieldId = savField.id;
    } catch {
      // Silencieux — on continuera sans filtrage par champ
    }

    // ── Étape 2 : Récupérer les commandes Sellsy avec le champ SAV ──
    let orders: any[] = [];

    // Essayer la recherche filtrée si on a l'ID du champ
    if (savFieldId) {
      try {
        const res = await sellsyFetch<{ data: any[]; pagination?: any }>(
          `/orders/search?limit=200`,
          {
            method: "POST",
            body: JSON.stringify({
              filters: { custom_fields: [{ id: savFieldId }] },
              embed: ["custom_field_values"],
            }),
          }
        );
        orders = res.data || [];
      } catch {
        savFieldId = null; // Forcer le fallback
      }
    }

    // Fallback : récupérer toutes les commandes récentes et filtrer côté serveur
    if (!savFieldId || orders.length === 0) {
      try {
        // Récupération paginée (max 3 pages de 100)
        let allOrders: any[] = [];
        for (let offset = 0; offset < 300; offset += 100) {
          const res = await sellsyFetch<{ data: any[]; pagination?: any }>(
            `/orders/search?limit=100&offset=${offset}`,
            {
              method: "POST",
              body: JSON.stringify({ embed: ["custom_field_values"] }),
            }
          );
          const batch = res.data || [];
          allOrders = [...allOrders, ...batch];
          if (batch.length < 100) break;
        }

        // Filtrer ceux qui ont un champ "SAV" avec une valeur
        orders = allOrders.filter((order: any) => {
          const cfv: any[] =
            order.custom_field_values ||
            order._embed?.custom_field_values ||
            order.customFieldValues ||
            [];
          return cfv.some(
            (cf: any) =>
              (cf.name?.toLowerCase() === "sav" ||
                cf.code?.toLowerCase() === "sav" ||
                cf.label?.toLowerCase() === "sav") &&
              cf.value != null &&
              cf.value !== "" &&
              cf.value !== false &&
              cf.value !== 0
          );
        });
      } catch (err) {
        console.error("[SAV sync] Erreur récupération commandes Sellsy:", err);
        return NextResponse.json(
          { error: "Impossible de récupérer les commandes Sellsy" },
          { status: 502 }
        );
      }
    }

    // ── Étape 3 : Upsert DossierSAV pour chaque commande ──
    let created = 0;
    let updated = 0;

    for (const order of orders) {
      const bdcId = String(order.id);
      const bdcRef = order.number || order.reference || bdcId;
      const sellsyStatus = order.status || order.order_status || "draft";
      const statut = mapSellsyStatut(sellsyStatus);
      const contactName =
        order.company_name ||
        (order._embed?.contact
          ? `${order._embed.contact.first_name || ""} ${order._embed.contact.last_name || ""}`.trim()
          : null) ||
        null;
      const titre = order.subject || `BDC ${bdcRef}`;

      // Chercher un dossier existant par sellsyBdcId
      const existing = await prisma.dossierSAV.findFirst({
        where: { sellsyBdcId: bdcId, deletedAt: null },
      });

      if (existing) {
        // Mettre à jour le statut Sellsy et infos BDC (ne pas écraser statut KOKPIT si modifié manuellement)
        await prisma.dossierSAV.update({
          where: { id: existing.id },
          data: {
            sellsyStatut: sellsyStatus,
            sellsyBdcRef: bdcRef,
            contactNom: contactName || existing.contactNom,
          },
        });
        updated++;
      } else {
        // Créer un nouveau dossier SAV
        const numero = await genererNumeroDossier();
        await prisma.dossierSAV.create({
          data: {
            numero,
            titre,
            type: "AUTRE",
            statut,
            sellsyBdcId: bdcId,
            sellsyBdcRef: bdcRef,
            sellsyStatut: sellsyStatus,
            contactNom: contactName,
            creePar: userId,
          },
        });
        created++;
      }
    }

    return NextResponse.json({
      success: true,
      found: orders.length,
      created,
      updated,
    });
  } catch (error: any) {
    console.error("[SAV sync] Erreur:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la synchronisation" },
      { status: 500 }
    );
  }
}
