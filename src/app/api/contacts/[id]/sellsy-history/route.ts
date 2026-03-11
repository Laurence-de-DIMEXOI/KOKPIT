import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { searchEstimates, searchOrders } from "@/lib/sellsy";

// GET — Historique Sellsy live pour un contact
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const contact = await prisma.contact.findUnique({
      where: { id },
      select: { sellsyContactId: true, email: true, nom: true },
    });

    if (!contact) {
      return NextResponse.json({ error: "Contact non trouvé" }, { status: 404 });
    }

    if (!contact.sellsyContactId) {
      return NextResponse.json({
        estimates: [],
        orders: [],
        linked: false,
      });
    }

    const contactId = parseInt(contact.sellsyContactId, 10);
    if (isNaN(contactId)) {
      return NextResponse.json({
        estimates: [],
        orders: [],
        linked: false,
      });
    }

    const [estimatesRes, ordersRes] = await Promise.all([
      searchEstimates({
        filters: { contact_id: contactId },
        limit: 50,
        order: "created",
        direction: "desc",
      }),
      searchOrders({
        filters: { contact_id: contactId },
        limit: 50,
        order: "created",
        direction: "desc",
      }),
    ]);

    return NextResponse.json({
      estimates: (estimatesRes.data || []).map((e) => ({
        id: e.id,
        number: e.number,
        subject: e.subject,
        status: e.status,
        date: e.date,
        created: e.created,
        company_name: e.company_name,
        amounts: e.amounts,
        pdf_link: (e as any).pdf_link,
      })),
      orders: (ordersRes.data || []).map((o) => ({
        id: o.id,
        number: o.number,
        subject: o.subject,
        status: o.status,
        date: o.date,
        created: o.created,
        company_name: o.company_name,
        amounts: o.amounts,
        pdf_link: (o as any).pdf_link,
      })),
      linked: true,
    });
  } catch (error: any) {
    console.error("GET /api/contacts/[id]/sellsy-history error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}
