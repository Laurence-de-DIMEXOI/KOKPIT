import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sellsyFetch } from "@/lib/sellsy";

/**
 * GET /api/sav/sync-sellsy/probe
 *
 * Test exploratoire — n'écrit RIEN en base. Essaie 5 stratégies différentes
 * pour appeler /orders/search côté Sellsy avec custom fields, et renvoie
 * pour chacune : status (ok/échec), code HTTP, et un échantillon du premier
 * BDC retourné (si succès) avec ses champs perso.
 *
 * Permet de savoir quel format Sellsy V2 accepte avant de toucher au sync.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  type ProbeResult = {
    label: string;
    request: { url: string; method: string; body?: unknown };
    ok: boolean;
    error?: string;
    response?: unknown;
  };

  // /orders/search ne retourne PAS les custom fields → tester d'autres endpoints
  // BDC test : 53369099 (BCDI-05741)
  const orderId = 53369099;
  const strategies: Array<{ label: string; url: string; method: "GET" | "POST"; body?: unknown }> = [
    {
      label: "A. GET /orders/{id} — détail single order",
      url: `/orders/${orderId}`,
      method: "GET",
    },
    {
      label: "B. GET /orders/{id}/customfields",
      url: `/orders/${orderId}/customfields`,
      method: "GET",
    },
    {
      label: "C. GET /orders/{id}/custom-fields",
      url: `/orders/${orderId}/custom-fields`,
      method: "GET",
    },
    {
      label: "D. GET /orders/{id}?embed[]=customfields",
      url: `/orders/${orderId}?embed[]=customfields`,
      method: "GET",
    },
    {
      label: "E. GET /custom-fields list",
      url: `/custom-fields?limit=100`,
      method: "GET",
    },
    {
      label: "F. POST /custom-fields/values/search par order id",
      url: `/custom-fields/values/search`,
      method: "POST",
      body: { filters: { related: [{ id: orderId, type: "order" }] } },
    },
    {
      label: "G. POST /search/customfields/values par order id",
      url: `/search/customfields/values`,
      method: "POST",
      body: { filters: { related: [{ id: orderId, type: "order" }] } },
    },
  ];

  // Truncate response payload pour éviter spam dans le JSON
  function summarize(payload: unknown): unknown {
    if (!payload || typeof payload !== "object") return payload;
    const obj = payload as any;
    if (Array.isArray(obj.data)) {
      return {
        ...obj,
        data: obj.data.slice(0, 3),
        pagination: obj.pagination,
        _truncated: obj.data.length > 3,
        _itemKeys: obj.data[0] ? Object.keys(obj.data[0]) : [],
      };
    }
    return obj;
  }

  const results: ProbeResult[] = [];
  for (const s of strategies) {
    try {
      const res = await sellsyFetch<unknown>(s.url, {
        method: s.method,
        ...(s.body ? { body: JSON.stringify(s.body) } : {}),
      });
      results.push({
        label: s.label,
        request: { url: s.url, method: s.method, body: s.body },
        ok: true,
        response: summarize(res),
      });
    } catch (e) {
      results.push({
        label: s.label,
        request: { url: s.url, method: s.method, body: s.body },
        ok: false,
        error: (e as Error).message,
      });
    }
  }

  return NextResponse.json({
    probedAt: new Date().toISOString(),
    strategies: results,
    hint: "Identifier la stratégie qui retourne ok=true ET cfArrayCount > 0 — c'est celle à utiliser dans sync-sellsy",
  });
}
