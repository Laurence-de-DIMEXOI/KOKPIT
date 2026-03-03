import { NextResponse } from "next/server";
import { testConnection } from "@/lib/hubspot";

/**
 * GET /api/hubspot
 * Test de connexion HubSpot
 */
export async function GET() {
  try {
    const result = await testConnection();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
