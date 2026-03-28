import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ count: 0 });

    const count = await prisma.lead.count({
      where: {
        slaDeadline: { lt: new Date() },
        premiereActionAt: null,
        statut: { notIn: ["VENTE", "PERDU"] },
      },
    });

    return NextResponse.json({ count });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
