import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/contacts/sellsy-sync/confirm
 *
 * Valide une suggestion de liaison : écrit le sellsyContactId en base.
 * Body : { contactId: string, sellsyContactId: number }
 */
export async function POST(request: NextRequest) {
  try {
    const { contactId, sellsyContactId } = await request.json();

    if (!contactId || !sellsyContactId) {
      return NextResponse.json(
        { success: false, error: "contactId et sellsyContactId requis" },
        { status: 400 }
      );
    }

    const contact = await prisma.contact.update({
      where: { id: contactId },
      data: { sellsyContactId: String(sellsyContactId) },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        sellsyContactId: true,
      },
    });

    return NextResponse.json({
      success: true,
      contact,
    });
  } catch (error: any) {
    console.error("POST /api/contacts/sellsy-sync/confirm error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
