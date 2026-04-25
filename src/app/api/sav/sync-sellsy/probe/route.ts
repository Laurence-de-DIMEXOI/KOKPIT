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
    request: { url: string; body: unknown };
    ok: boolean;
    error?: string;
    sampleOrder?: {
      id: number;
      number: string;
      cfArrayCount: number;
      cfFieldsSample: Array<{ id?: number; cf_id?: number; code?: string; name?: string; label?: string; value?: unknown }>;
      keys: string[];
    };
  };

  const strategies: Array<{ label: string; url: string; body: unknown }> = [
    {
      label: "1. embed dans body : ['customfields']",
      url: "/orders/search?limit=3&order=created&direction=desc",
      body: { filters: {}, embed: ["customfields"] },
    },
    {
      label: "2. embed dans body : ['custom_fields']",
      url: "/orders/search?limit=3&order=created&direction=desc",
      body: { filters: {}, embed: ["custom_fields"] },
    },
    {
      label: "3. embed dans body : ['custom_field_values']",
      url: "/orders/search?limit=3&order=created&direction=desc",
      body: { filters: {}, embed: ["custom_field_values"] },
    },
    {
      label: "4. embed en query string : ?embed[]=customfields",
      url: "/orders/search?limit=3&order=created&direction=desc&embed[]=customfields",
      body: { filters: {} },
    },
    {
      label: "5. SANS embed (baseline)",
      url: "/orders/search?limit=3&order=created&direction=desc",
      body: { filters: {} },
    },
  ];

  const results: ProbeResult[] = [];

  for (const s of strategies) {
    try {
      const res = await sellsyFetch<{ data: any[] }>(s.url, {
        method: "POST",
        body: JSON.stringify(s.body),
      });
      const first = (res.data || [])[0];
      if (first) {
        const cfArr =
          (first as any).custom_fields_values ||
          (first as any).custom_field_values ||
          (first as any).customfields ||
          (first as any)._embed?.custom_fields_values ||
          (first as any)._embed?.customfields ||
          [];
        results.push({
          label: s.label,
          request: { url: s.url, body: s.body },
          ok: true,
          sampleOrder: {
            id: first.id,
            number: first.number,
            cfArrayCount: Array.isArray(cfArr) ? cfArr.length : 0,
            cfFieldsSample: Array.isArray(cfArr)
              ? cfArr.slice(0, 5).map((cf: any) => ({
                  id: cf.id,
                  cf_id: cf.cf_id,
                  code: cf.code,
                  name: cf.name,
                  label: cf.label,
                  value: cf.value,
                }))
              : [],
            keys: Object.keys(first),
          },
        });
      } else {
        results.push({
          label: s.label,
          request: { url: s.url, body: s.body },
          ok: true,
          error: "Aucun BDC retourné",
        });
      }
    } catch (e) {
      results.push({
        label: s.label,
        request: { url: s.url, body: s.body },
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
