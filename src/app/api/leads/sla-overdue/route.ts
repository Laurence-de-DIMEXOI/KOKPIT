import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ count: 0 });

    // SLA 48h = une NOUVELLE demande sans première réponse. Dès qu'elle passe
    // En cours / Devis / Vente / Perdu, une action a eu lieu → plus « en retard ».
    const count = await prisma.lead.count({
      where: {
        statut: "NOUVEAU",
        slaDeadline: { lt: new Date() },
        premiereActionAt: null,
      },
    });

    return NextResponse.json({ count });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
