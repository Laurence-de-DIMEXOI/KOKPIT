import { NextRequest, NextResponse } from "next/server";
import { listAllEstimates, listAllOrders, listStaffs } from "@/lib/sellsy";

// GET /api/sellsy/performance - Performance commerciaux par période
// Params: period (week|month|year), year (défaut: année courante)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = (searchParams.get("period") || "month") as "week" | "month" | "year";
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()), 10);

    // Calculer la plage de dates selon la période
    const now = new Date();
    let startDate: string;
    let endDate: string;
    let periodLabel: string;

    if (period === "week") {
      // Semaine en cours (lundi → dimanche)
      const dayOfWeek = now.getDay() || 7; // Dimanche = 7
      const monday = new Date(now);
      monday.setDate(now.getDate() - dayOfWeek + 1);
      monday.setHours(0, 0, 0, 0);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);
      startDate = monday.toISOString().split("T")[0];
      endDate = sunday.toISOString().split("T")[0];
      periodLabel = `Semaine du ${monday.toLocaleDateString("fr-FR")}`;
    } else if (period === "month") {
      // Mois en cours
      const firstDay = new Date(year, now.getMonth(), 1);
      const lastDay = new Date(year, now.getMonth() + 1, 0);
      startDate = firstDay.toISOString().split("T")[0];
      endDate = lastDay.toISOString().split("T")[0];
      const monthNames = [
        "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
        "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
      ];
      periodLabel = `${monthNames[now.getMonth()]} ${year}`;
    } else {
      // Année complète
      startDate = `${year}-01-01`;
      endDate = `${year}-12-31`;
      periodLabel = `Année ${year}`;
    }

    // Fetch en parallèle : devis, commandes et staffs
    const [allEstimates, allOrders, staffs] = await Promise.all([
      listAllEstimates(startDate),
      listAllOrders(startDate),
      listStaffs(),
    ]);

    // Map des staffs pour résolution owner_id → nom
    const staffMap = new Map<number, string>();
    staffs.forEach((s) => {
      staffMap.set(s.id, `${s.first_name} ${s.last_name}`.trim());
    });

    // Filtrer par période (les listAll récupèrent depuis startDate mais peuvent avoir des dates hors range)
    const isCancelled = (status?: string) => {
      if (!status) return false;
      const s = status.toLowerCase();
      return s === "cancelled" || s.includes("annul");
    };

    const inRange = (dateStr: string) => {
      const d = dateStr.split("T")[0];
      return d >= startDate && d <= endDate;
    };

    const periodEstimates = allEstimates.filter(
      (e) => !isCancelled(e.status) && inRange(e.date || e.created)
    );
    const periodOrders = allOrders.filter(
      (o) => !isCancelled(o.status) && inRange(o.date || o.created)
    );

    // Agrégation par owner
    const ownerStats = new Map<
      number | string,
      {
        ownerName: string;
        devisCount: number;
        devisTotal: number;
        commandesCount: number;
        commandesTotal: number;
      }
    >();

    const getOrCreate = (ownerId: number | string, ownerName: string) => {
      if (!ownerStats.has(ownerId)) {
        ownerStats.set(ownerId, {
          ownerName,
          devisCount: 0,
          devisTotal: 0,
          commandesCount: 0,
          commandesTotal: 0,
        });
      }
      return ownerStats.get(ownerId)!;
    };

    // Agréger devis par owner
    for (const e of periodEstimates) {
      const ownerId = e.owner_id || 0;
      const ownerName = staffMap.get(ownerId) || "Non assigné";
      const stats = getOrCreate(ownerId, ownerName);
      stats.devisCount++;
      const amt = e.amounts?.total_excl_tax || e.amounts?.total_raw_excl_tax || 0;
      stats.devisTotal += typeof amt === "string" ? parseFloat(amt) : amt;
    }

    // Agréger commandes par owner
    for (const o of periodOrders) {
      const ownerId = o.owner_id || 0;
      const ownerName = staffMap.get(ownerId) || "Non assigné";
      const stats = getOrCreate(ownerId, ownerName);
      stats.commandesCount++;
      const amt = o.amounts?.total_excl_tax || o.amounts?.total_raw_excl_tax || 0;
      stats.commandesTotal += typeof amt === "string" ? parseFloat(amt) : amt;
    }

    // Construire le tableau de résultats
    const performance = Array.from(ownerStats.entries())
      .map(([ownerId, stats]) => ({
        ownerId,
        ownerName: stats.ownerName,
        devisCount: stats.devisCount,
        devisTotal: Math.round(stats.devisTotal * 100) / 100,
        commandesCount: stats.commandesCount,
        commandesTotal: Math.round(stats.commandesTotal * 100) / 100,
        conversionRate:
          stats.devisCount > 0
            ? Math.round((stats.commandesCount / stats.devisCount) * 100)
            : 0,
      }))
      .sort((a, b) => b.commandesTotal - a.commandesTotal);

    // Totaux
    const totals = {
      devisCount: performance.reduce((s, p) => s + p.devisCount, 0),
      devisTotal: Math.round(performance.reduce((s, p) => s + p.devisTotal, 0) * 100) / 100,
      commandesCount: performance.reduce((s, p) => s + p.commandesCount, 0),
      commandesTotal: Math.round(performance.reduce((s, p) => s + p.commandesTotal, 0) * 100) / 100,
      conversionRate: 0,
    };
    totals.conversionRate =
      totals.devisCount > 0
        ? Math.round((totals.commandesCount / totals.devisCount) * 100)
        : 0;

    return NextResponse.json({
      success: true,
      period,
      periodLabel,
      startDate,
      endDate,
      performance,
      totals,
    });
  } catch (error: any) {
    console.error("Erreur performance:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
