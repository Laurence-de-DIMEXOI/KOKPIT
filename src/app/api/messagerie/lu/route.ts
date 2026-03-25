import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PUT - Mark channel as read
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  const body = await request.json();
  const { canalId } = body;

  if (!canalId) {
    return NextResponse.json(
      { error: "canalId est requis" },
      { status: 400 }
    );
  }

  await prisma.canalMembre.update({
    where: {
      canalId_userId: {
        canalId,
        userId: session.user.id,
      },
    },
    data: {
      dernierLu: new Date(),
    },
  });

  return NextResponse.json({ success: true });
}
