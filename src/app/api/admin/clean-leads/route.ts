import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/clean-leads
 * Supprime tous les Leads et événements CREATION_LEAD.
 * Les DemandePrix et Contacts restent intacts.
 */
export async function GET() {
  try {
    const leadsBefore = await prisma.lead.count();

    await prisma.evenement.deleteMany({ where: { type: "CREATION_LEAD" } });
    const deleted = await prisma.lead.deleteMany();

    return NextResponse.json({
      success: true,
      message: `${deleted.count} leads supprimés. DemandePrix et contacts intacts.`,
      leadsBefore,
      leadsAfter: 0,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
