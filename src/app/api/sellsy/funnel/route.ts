import { NextRequest, NextResponse } from "next/server";
import { listCompanies, listAllEstimates, listAllOrders } from "@/lib/sellsy";

// GET /api/sellsy/funnel - Funnel marketing: contacts → devis → commandes
// Params: months (nombre de mois à analyser, défaut 12)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const monthsBack = parseInt(searchParams.get("months") || "12", 10);

    // Récupérer TOUS les devis et commandes (pagination complète)
    const [allEstimates, allOrders] = await Promise.all([
      listAllEstimates("2024-01-01"),
      listAllOrders("2024-01-01"),
    ]);

    // Tenter de récupérer les companies — fallback si erreur
    let companies: Array<{ id: number; name: string; created: string; email: string }> = [];
    let totalCompaniesFromAPI = 0;
    try {
      const companiesRes = await listCompanies({ limit: 100, order: "created", direction: "desc" });
      companies = companiesRes.data.map((c) => ({
        id: c.id,
        name: c.name,
        created: c.created,
        email: c.email || "",
      }));
      totalCompaniesFromAPI = companiesRes.pagination.total;
    } catch (err) {
      console.warn("Companies API non disponible, extraction depuis devis/commandes");
    }

    // Exclure les annulés
    const isCancelled = (status?: string) => {
      if (!status) return false;
      const s = status.toLowerCase();
      return s === "cancelled" || s.includes("annul");
    };

    const activeEstimates = allEstimates.filter((e) => !isCancelled(e.status));
    const activeOrders = allOrders.filter((o) => !isCancelled(o.status));

    // Si pas de companies API, reconstruire depuis devis/commandes
    if (companies.length === 0) {
      const contactMap = new Map<string, { name: string; created: string }>();

      for (const e of activeEstimates) {
        if (e.company_name) {
          const key = e.company_name.toLowerCase();
          if (!contactMap.has(key)) {
            contactMap.set(key, { name: e.company_name, created: e.created });
          }
        }
      }
      for (const o of activeOrders) {
        if (o.company_name) {
          const key = o.company_name.toLowerCase();
          if (!contactMap.has(key)) {
            contactMap.set(key, { name: o.company_name, created: o.created });
          }
        }
      }

      let idx = 1;
      contactMap.forEach((val) => {
        companies.push({ id: idx++, name: val.name, created: val.created, email: "" });
      });
      totalCompaniesFromAPI = companies.length;
    }

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
      month: string;
      label: string;
      contacts: number;
      devis: number;
      commandes: number;
      devisAmount: number;
      commandesAmount: number;
      conversionDevis: number;
      conversionCommande: number;
      conversionGlobale: number;
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
        if (!c.created) return false;
        const created = new Date(c.created);
        return created.getFullYear() === year && created.getMonth() === month;
      });

      // Devis créés ce mois
      const monthEstimates = activeEstimates.filter((e) => {
        const created = new Date(e.date || e.created);
        return created.getFullYear() === year && created.getMonth() === month;
      });

      // Commandes créées ce mois
      const monthOrders = activeOrders.filter((o) => {
        const created = new Date(o.date || o.created);
        return created.getFullYear() === year && created.getMonth() === month;
      });

      const contactCount = monthContacts.length;
      const devisCount = monthEstimates.length;
      const commandeCount = monthOrders.length;

      // Montants HT
      const devisAmount = monthEstimates.reduce((sum, e) => {
        const amt = e.amounts?.total_excl_tax || e.amounts?.total_raw_excl_tax || 0;
        return sum + (typeof amt === "string" ? parseFloat(amt) : amt);
      }, 0);

      const commandesAmount = monthOrders.reduce((sum, o) => {
        const amt = o.amounts?.total_excl_tax || o.amounts?.total_raw_excl_tax || 0;
        return sum + (typeof amt === "string" ? parseFloat(amt) : amt);
      }, 0);

      monthlyFunnel.push({
        month: monthKey,
        label,
        contacts: contactCount,
        devis: devisCount,
        commandes: commandeCount,
        devisAmount: Math.round(devisAmount * 100) / 100,
        commandesAmount: Math.round(commandesAmount * 100) / 100,
        conversionDevis: contactCount > 0 ? Math.min(Math.round((devisCount / contactCount) * 100), 100) : 0,
        conversionCommande: devisCount > 0 ? Math.min(Math.round((commandeCount / devisCount) * 100), 100) : 0,
        conversionGlobale: contactCount > 0 ? Math.min(Math.round((commandeCount / contactCount) * 100), 100) : 0,
      });
    }

    // ===== KPIs globaux =====
    const totalContacts = totalCompaniesFromAPI;
    const totalWithEstimate = companiesWithEstimate.size;
    const totalWithOrder = companiesWithOrder.size;

    const globalConversionDevis =
      totalContacts > 0 ? Math.round((totalWithEstimate / totalContacts) * 100) : 0;
    const globalConversionCommande =
      totalWithEstimate > 0 ? Math.round((totalWithOrder / totalWithEstimate) * 100) : 0;
    const globalConversionGlobale =
      totalContacts > 0 ? Math.round((totalWithOrder / totalContacts) * 100) : 0;

    // ===== Contacts récents sans devis (à traiter) =====
    const contactsSansDevis = companies
      .filter((c) => !companiesWithEstimate.has(c.name.toLowerCase()))
      .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())
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
        totalContacts,
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
