import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get messages for a channel
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const canalId = searchParams.get("canalId");
  const after = searchParams.get("after");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);

  if (!canalId) {
    return NextResponse.json(
      { error: "canalId est requis" },
      { status: 400 }
    );
  }

  // Verify user is a member of this channel
  const membership = await prisma.canalMembre.findUnique({
    where: {
      canalId_userId: {
        canalId,
        userId: session.user.id,
      },
    },
  });

  if (!membership) {
    return NextResponse.json(
      { error: "Acces refuse a ce canal" },
      { status: 403 }
    );
  }

  const whereClause: Record<string, unknown> = { canalId };

  if (after) {
    // Polling mode: get messages after the given timestamp
    whereClause.createdAt = { gt: new Date(after) };
  }

  const messages = await prisma.messageChat.findMany({
    where: whereClause,
    take: after ? undefined : limit,
    orderBy: { createdAt: after ? "asc" : "desc" },
    include: {
      expediteur: {
        select: { id: true, nom: true, prenom: true, couleur: true },
      },
    },
  });

  // For initial load (no after), we fetched in DESC order to get latest, now reverse to ASC
  const sortedMessages = after ? messages : messages.reverse();

  return NextResponse.json({ messages: sortedMessages, canalId });
}

// POST - Send a message
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  const body = await request.json();
  const { canalId, contenu, fichierUrl, fichierNom } = body;

  if (!canalId || !contenu) {
    return NextResponse.json(
      { error: "canalId et contenu sont requis" },
      { status: 400 }
    );
  }

  // Verify user is a member of this channel
  const membership = await prisma.canalMembre.findUnique({
    where: {
      canalId_userId: {
        canalId,
        userId: session.user.id,
      },
    },
  });

  if (!membership) {
    return NextResponse.json(
      { error: "Acces refuse a ce canal" },
      { status: 403 }
    );
  }

  const message = await prisma.messageChat.create({
    data: {
      canalId,
      expediteurId: session.user.id,
      contenu,
      fichierUrl: fichierUrl || null,
      fichierNom: fichierNom || null,
    },
    include: {
      expediteur: {
        select: { id: true, nom: true, prenom: true, couleur: true },
      },
    },
  });

  return NextResponse.json(message, { status: 201 });
}
