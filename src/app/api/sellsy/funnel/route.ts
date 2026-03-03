import { NextRequest, NextResponse } from "next/server";
import { listCompanies, listEstimates, listOrders } from "@/lib/sellsy";

// GET /api/sellsy/funnel - Funnel marketing: contacts → devis → commandes
// Calcule par mois les étapes de conversion
// Params: months (nombre de mois à analyser, défaut 6)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const monthsBack = parseInt(searchParams.get("months") || "6", 10);

    // Récupérer les données en parallèle (limit 100 pour éviter timeout Vercel)
    const [companiesRes, estimatesRes, ordersRes] = await Promise.all([
      listCompanies({ limit: 100, order: "created", direction: "desc" }),
      listEstimates({ limit: 100, order: "created", direction: "desc" }),
      listOrders({ limit: 100, order: "created", direction: "desc" }),
    ]);

    const companies = companiesRes.data;
    const estimates = estimatesRes.data;
    const orders = ordersRes.data;

    // Exclure les annulés
    const isCancelled = (status?: string) => {
      if (!status) return false;
      const s = status.toLowerCase();
      return s === "cancelled" || s.includes("annul");
    };

    const activeEstimates = estimates.filter((e) => !isCancelled(e.status));
    const activeOrders = orders.filter((o) => !isCancelled(o.status));

    // Sets des company_name ayant un devis / une commande
    const companiesWithEstimate = new Set<string>();
    activeEstimates.forEach((e) => {
      if (e.company_name) companiesWithEstimate.add(e.company_name.toLowerCase());
    });

    const companiesWithOrder = new Set<string>();
    activeOrders.forEach((o) => {
      if (o.company_name) companiesWithOrder.add(o.company_name.toLowerCase());
    });

    // ===== Funnel par mois =====
    const now = new Date();
    const monthlyFunnel: Array<{
      month: string; // "2026-03"
      label: string; // "Mars 2026"
      contacts: number;
      devis: number;
      commandes: number;
      conversionDevis: number; // % contacts→devis
      conversionCommande: number; // % devis→commande
      conversionGlobale: number; // % contacts→commande
    }> = [];

    const monthNames = [
      "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
      "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
    ];

    for (let i = monthsBack - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth();
      const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;
      const label = `${monthNames[month]} ${year}`;

      // Contacts créés ce mois
      const monthContacts = companies.filter((c) => {
        const created = new Date(c.created);
        return created.getFullYear() === year && created.getMonth() === month;
      });

      // Devis créés ce mois
      const monthEstimates = activeEstimates.filter((e) => {
        const created = new Date(e.created);
        return created.getFullYear() === year && created.getMonth() === month;
      });

      // Commandes créées ce mois
      const monthOrders = activeOrders.filter((o) => {
        const created = new Date(o.created);
        return created.getFullYear() === year && created.getMonth() === month;
      });

      const contactCount = monthContacts.length;
      const devisCount = monthEstimates.length;
      const commandeCount = monthOrders.length;

      monthlyFunnel.push({
        month: monthKey,
        label,
        contacts: contactCount,
        devis: devisCount,
        commandes: commandeCount,
        conversionDevis: contactCount > 0 ? Math.round((devisCount / contactCount) * 100) : 0,
        conversionCommande: devisCount > 0 ? Math.round((commandeCount / devisCount) * 100) : 0,
        conversionGlobale: contactCount > 0 ? Math.round((commandeCount / contactCount) * 100) : 0,
      });
    }

    // ===== KPIs globaux =====
    const totalCompanies = companiesRes.pagination.total;
    const totalWithEstimate = companiesWithEstimate.size;
    const totalWithOrder = companiesWithOrder.size;

    const globalConversionDevis =
      totalCompanies > 0
        ? Math.round((totalWithEstimate / totalCompanies) * 100)
        : 0;
    const globalConversionCommande =
      totalWithEstimate > 0
        ? Math.round((totalWithOrder / totalWithEstimate) * 100)
        : 0;
    const globalConversionGlobale =
      totalCompanies > 0
        ? Math.round((totalWithOrder / totalCompanies) * 100)
        : 0;

    // ===== Contacts récents sans devis (à traiter) =====
    const contactsSansDevis = companies
      .filter((c) => !companiesWithEstimate.has(c.name.toLowerCase()))
      .slice(0, 10)
      .map((c) => ({
        id: c.id,
        name: c.name,
        created: c.created,
        email: c.email || "",
      }));

    return NextResponse.json({
      success: true,
      kpis: {
        totalContacts: totalCompanies,
        totalWithEstimate,
        totalWithOrder,
        globalConversionDevis,
        globalConversionCommande,
        globalConversionGlobale,
      },
      monthlyFunnel,
      contactsSansDevis,
    });
  } catch (error: any) {
    console.error("Erreur funnel:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
