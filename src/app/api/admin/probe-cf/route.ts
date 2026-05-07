import { NextResponse } from "next/server";
import { sellsyFetch } from "@/lib/sellsy";

export const dynamic = "force-dynamic";

// Probe : liste les custom fields d'un BDC pour debug nom exact "Sur-mesure"
export async function GET() {
  // BDC 53369116 (Alain ALIAMUS, plus grosse vente avril 2026)
  const data = await sellsyFetch<{ data: any[] }>(`/orders/53369116/custom-fields?limit=100`);
  const fields = (data.data || []).map((cf) => ({
    code: cf.code,
    name: cf.name,
    label: cf.label,
    value: cf.value,
    parameters: cf.parameters,
  }));
  return NextResponse.json({ count: fields.length, fields });
}
