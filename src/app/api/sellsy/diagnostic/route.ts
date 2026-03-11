/**
 * API Route de diagnostic temporaire — Sellsy embed related
 *
 * Teste si l'API Sellsy v2 expose le lien devis → commande
 * via les embeds "related", "estimate", "orders"
 *
 * À SUPPRIMER après diagnostic
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  searchOrders,
  searchEstimates,
} from "@/lib/sellsy";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const results: Record<string, unknown> = {};

  try {
    // Test 1: Récupérer des commandes avec embed related
    console.log("=== DIAGNOSTIC SELLSY — embed related ===");

    const ordersWithRelated = await searchOrders({
      filters: { date: { start: "2025-01-01" } },
      limit: 3,
      embed: ["related"],
    });
    results.orders_with_related = ordersWithRelated.data.map((o) => ({
      id: o.id,
      number: o.number,
      company_name: o.company_name,
      _embed: (o as any)._embed,
      related: (o as any).related,
      parent_id: (o as any).parent_id,
      parent_type: (o as any).parent_type,
      estimate_id: (o as any).estimate_id,
      origin: (o as any).origin,
      source_document: (o as any).source_document,
      // Dump toutes les clés pour voir ce qui existe
      all_keys: Object.keys(o),
    }));

    // Test 2: Récupérer des devis avec embed related
    const estimatesWithRelated = await searchEstimates({
      filters: { date: { start: "2025-01-01" } },
      limit: 3,
      embed: ["related"],
    });
    results.estimates_with_related = estimatesWithRelated.data.map((e) => ({
      id: e.id,
      number: e.number,
      company_name: e.company_name,
      _embed: (e as any)._embed,
      related: (e as any).related,
      parent_id: (e as any).parent_id,
      orders: (e as any).orders,
      origin: (e as any).origin,
      all_keys: Object.keys(e),
    }));

    // Test 3: Dump complet du premier order pour voir TOUS les champs
    if (ordersWithRelated.data.length > 0) {
      results.full_order_dump = ordersWithRelated.data[0];
    }

    // Test 4: Dump complet du premier estimate
    if (estimatesWithRelated.data.length > 0) {
      results.full_estimate_dump = estimatesWithRelated.data[0];
    }

    console.log("=== RÉSULTAT DIAGNOSTIC ===");
    console.log(JSON.stringify(results, null, 2));

    return NextResponse.json({
      success: true,
      diagnostic: results,
      conclusion: "Voir les champs _embed, related, parent_id, estimate_id, origin dans les résultats",
    });
  } catch (error: any) {
    console.error("Erreur diagnostic:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
