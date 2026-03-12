import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { searchEstimates, searchOrders, searchContactByEmail, getContact } from "@/lib/sellsy";

// GET — Historique Sellsy live pour un contact
// Cherche par sellsyContactId, sinon fallback par email
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const contact = await prisma.contact.findUnique({
      where: { id },
      select: { sellsyContactId: true, email: true, nom: true, prenom: true },
    });

    if (!contact) {
      return NextResponse.json({ error: "Contact non trouvé" }, { status: 404 });
    }

    // Résoudre le contact_id Sellsy
    let sellsyContactId: number | null = null;
    let resolvedVia: "sellsy_id" | "email" | null = null;

    // 1. Essayer par sellsyContactId direct
    if (contact.sellsyContactId) {
      const parsed = parseInt(contact.sellsyContactId, 10);
      if (!isNaN(parsed)) {
        sellsyContactId = parsed;
        resolvedVia = "sellsy_id";
      }
    }

    // 2. Fallback : chercher le contact dans Sellsy par email
    if (!sellsyContactId && contact.email) {
      const sellsyContact = await searchContactByEmail(contact.email);
      if (sellsyContact) {
        sellsyContactId = sellsyContact.id;
        resolvedVia = "email";

        // Sauvegarder le sellsyContactId trouvé pour les prochaines fois
        await prisma.contact.update({
          where: { id },
          data: { sellsyContactId: String(sellsyContact.id) },
        }).catch(() => {}); // Ignorer si échec (pas bloquant)
      }
    }

    if (!sellsyContactId) {
      return NextResponse.json({
        estimates: [],
        orders: [],
        linked: false,
        resolvedVia: null,
      });
    }

    // Sellsy V2 /estimates/search ne filtre PAS par contact_id côté API.
    // On doit récupérer les documents et filtrer côté serveur.
    // Stratégie : chercher via l'entreprise liée au contact (third_id) + filtrage exact par contact_id.

    // 1. Récupérer les infos du contact Sellsy pour connaître son entreprise
    let companyId: number | null = null;
    try {
      const contactDetail = await getContact(sellsyContactId);
      companyId = contactDetail?.company_id || contactDetail?._embed?.company?.id || null;
    } catch {
      // Pas grave, on fera sans
    }

    // 2. Chercher les documents — si on a l'entreprise on filtre par third_id, sinon on prend les récents
    const searchFilters: Record<string, unknown> = {};
    if (companyId) {
      searchFilters.third_ids = [companyId];
    }
    // Toujours ajouter un filtre date pour limiter le volume (12 derniers mois)
    const sinceDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    searchFilters.date = { start: sinceDate };

    const [estimatesRes, ordersRes] = await Promise.all([
      searchEstimates({
        filters: searchFilters as any,
        limit: 100,
        order: "created",
        direction: "desc",
      }),
      searchOrders({
        filters: searchFilters as any,
        limit: 100,
        order: "created",
        direction: "desc",
      }),
    ]);

    // 3. Filtrage strict côté serveur — ne garder QUE les documents du bon contact
    const myEstimates = (estimatesRes.data || []).filter(
      (e) => e.contact_id === sellsyContactId
    );
    const myOrders = (ordersRes.data || []).filter(
      (o) => o.contact_id === sellsyContactId
    );

    return NextResponse.json({
      estimates: myEstimates.map((e) => ({
        id: e.id,
        number: e.number,
        subject: e.subject,
        status: e.status,
        date: e.date,
        created: e.created,
        company_name: e.company_name,
        amounts: e.amounts,
        pdf_link: (e as any).pdf_link,
      })),
      orders: myOrders.map((o) => ({
        id: o.id,
        number: o.number,
        subject: o.subject,
        status: o.status,
        date: o.date,
        created: o.created,
        company_name: o.company_name,
        amounts: o.amounts,
        pdf_link: (o as any).pdf_link,
      })),
      linked: true,
      resolvedVia,
      debug: {
        sellsyContactId,
        companyId,
        totalEstimatesFetched: estimatesRes.data?.length || 0,
        totalOrdersFetched: ordersRes.data?.length || 0,
        estimatesAfterFilter: myEstimates.length,
        ordersAfterFilter: myOrders.length,
      },
    });
  } catch (error: any) {
    console.error("GET /api/contacts/[id]/sellsy-history error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}
