import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/marketing/canaux/[id] — update canal
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { nom, couleur, actif } = body;

  const canal = await prisma.canalMarketing.update({
    where: { id },
    data: {
      ...(nom !== undefined && { nom: nom.trim() }),
      ...(couleur !== undefined && { couleur }),
      ...(actif !== undefined && { actif }),
    },
  });

  return NextResponse.json({ canal });
}
