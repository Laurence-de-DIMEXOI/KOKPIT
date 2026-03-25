import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET — Liste tous les users actifs avec leurs overrides
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const role = (session.user as any).role;
  const email = session.user?.email;
  if (email !== "laurence.payet@dimexoi.fr" && email !== "admin@kokpit.re" && !["DIRECTION"].includes(role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    where: { actif: true },
    select: {
      id: true,
      nom: true,
      prenom: true,
      role: true,
      moduleAccessOverrides: true,
    },
    orderBy: { nom: "asc" },
  });

  return NextResponse.json(users);
}
