import { NextResponse } from "next/server";
import { getOrderRaw } from "@/lib/sellsy";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getOrderRaw(53369183);
  return NextResponse.json(data);
}
