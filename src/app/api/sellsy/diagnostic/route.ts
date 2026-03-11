/**
 * API Route de diagnostic temporaire — Sellsy embed related
 *
 * Teste si l'API Sellsy v2 expose le lien devis → commande.
 * Stratégie : récupère des IDs via search (sans embed),
 * puis GET individuel avec différents embeds.
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

// Appel direct Sellsy pour tester les embeds sur GET individuel
const SELLSY_BASE_URL = "https://api.sellsy.com/v2";
const SELLSY_TOKEN_URL = "https://login.sellsy.com/oauth2/access-tokens";

async function getToken(): Promise<string> {
  const res = await fetch(SELLSY_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.SELLSY_CLIENT_ID || "",
      client_secret: process.env.SELLSY_CLIENT_SECRET || "",
    }),
  });
  const data = await res.json();
  return data.access_token;
}

async function rawSellsyGet(path: string, token: string): Promise<unknown> {
  const res = await fetch(`${SELLSY_BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    const body = await res.text();
    return { error: res.status, body };
  }
  return res.json();
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const results: Record<string, unknown> = {};

  try {
    const token = await getToken();

    // Étape 1: Récupérer quelques commandes (sans embed)
    const orders = await searchOrders({
      filters: { date: { start: "2025-01-01" } },
      limit: 3,
    });
    results.orders_count = orders.pagination.total;

    if (orders.data.length > 0) {
      const orderId = orders.data[0].id;
      results.first_order_id = orderId;
      results.first_order_keys = Object.keys(orders.data[0]);
      results.first_order_full = orders.data[0];

      // Étape 2: GET /orders/{id} avec différents embeds
      results.order_no_embed = await rawSellsyGet(`/orders/${orderId}`, token);
      results.order_embed_related = await rawSellsyGet(`/orders/${orderId}?embed[]=related`, token);
      results.order_embed_invoices = await rawSellsyGet(`/orders/${orderId}?embed[]=invoices`, token);
      results.order_embed_estimates = await rawSellsyGet(`/orders/${orderId}?embed[]=estimates`, token);
    }

    // Étape 3: Récupérer quelques devis
    const estimates = await searchEstimates({
      filters: { date: { start: "2025-01-01" } },
      limit: 3,
    });
    results.estimates_count = estimates.pagination.total;

    if (estimates.data.length > 0) {
      const estimateId = estimates.data[0].id;
      results.first_estimate_id = estimateId;
      results.first_estimate_keys = Object.keys(estimates.data[0]);
      results.first_estimate_full = estimates.data[0];

      // Étape 4: GET /estimates/{id} avec différents embeds
      results.estimate_no_embed = await rawSellsyGet(`/estimates/${estimateId}`, token);
      results.estimate_embed_related = await rawSellsyGet(`/estimates/${estimateId}?embed[]=related`, token);
      results.estimate_embed_orders = await rawSellsyGet(`/estimates/${estimateId}?embed[]=orders`, token);
    }

    return NextResponse.json({
      success: true,
      diagnostic: results,
    });
  } catch (error: any) {
    console.error("Erreur diagnostic:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
