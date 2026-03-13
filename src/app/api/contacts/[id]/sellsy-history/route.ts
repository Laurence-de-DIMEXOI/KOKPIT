import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { findSellsyContact, findDocumentsByRelated } from "@/lib/sellsy";

// GET — Historique Sellsy live pour un contact
// Cherche dans individuals (B2C) puis contacts (B2B)
// Filtre les documents par le champ `related` (les filtres Sellsy V2 sont cassés)
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
      select: { email: true, nom: true, prenom: true, telephone: true },
    });

    if (!contact) {
      return NextResponse.json({ error: "Contact non trouvé" }, { status: 404 });
    }

    // 1. Trouver le tiers Sellsy (individual ou company)
    const match = await findSellsyContact({
      email: contact.email,
      telephone: contact.telephone,
      nom: contact.nom,
      prenom: contact.prenom,
    });

    if (!match?.thirdId) {
      return NextResponse.json({
        estimates: [],
        orders: [],
        linked: false,
        resolvedVia: null,
      });
    }

    // 2. Chercher les documents par le champ `related` (filtrage côté serveur)
    //    Les filtres Sellsy V2 (third_ids, contact_id, individual_ids) sont TOUS cassés.
    const { estimates, orders } = await findDocumentsByRelated(match.thirdId);

    return NextResponse.json({
      estimates: estimates.map((e) => ({
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
      orders: orders.map((o) => ({
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
      resolvedVia: match.resolvedVia,
      entityType: match.entityType,
    });
  } catch (error: any) {
    console.error("GET /api/contacts/[id]/sellsy-history error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}
