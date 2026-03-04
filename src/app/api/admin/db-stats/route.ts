import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const [contacts, leads, demandes] = await Promise.all([
    prisma.contact.count(),
    prisma.lead.count(),
    prisma.demandePrix.count(),
  ]);

  // Leads detail
  const leadsDetail = await prisma.lead.findMany({
    select: {
      id: true,
      statut: true,
      source: true,
      createdAt: true,
      contact: { select: { nom: true, prenom: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return NextResponse.json({
    counts: { contacts, leads, demandes },
    recentLeads: leadsDetail,
  });
}
