import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/webhooks/catalogue
 *
 * Reçoit les événements de tracking du popup catalogue dimexoi.fr
 *
 * JSON ATTENDU :
 * {
 *   "type": "view" | "click",
 *   "referrer": "https://...",
 *   "page": "/",
 *   "utmSource": "google",
 *   "utmMedium": "cpc",
 *   "utmCampaign": "..."
 * }
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const type = body.type === "click" ? "click" : "view";

    await prisma.catalogueStat.create({
      data: {
        type,
        referrer: body.referrer || null,
        page: body.page || null,
        utmSource: body.utmSource || null,
        utmMedium: body.utmMedium || null,
        utmCampaign: body.utmCampaign || null,
      },
    });

    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (error: any) {
    console.error("[catalogue webhook] Erreur:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}
