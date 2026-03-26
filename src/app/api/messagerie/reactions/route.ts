import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/messagerie/reactions
 * Toggle une réaction (ajoute si absente, supprime si déjà présente)
 * Body: { messageId, emoji }
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const body = await req.json();
  const { messageId, emoji } = body;

  if (!messageId || !emoji) {
    return NextResponse.json({ error: "messageId et emoji requis" }, { status: 400 });
  }

  // Vérifier que le message existe
  const message = await prisma.messageChat.findUnique({ where: { id: messageId } });
  if (!message) {
    return NextResponse.json({ error: "Message introuvable" }, { status: 404 });
  }

  // Toggle : si la réaction existe, la supprimer ; sinon, la créer
  const existing = await prisma.reactionMessage.findUnique({
    where: { messageId_userId_emoji: { messageId, userId, emoji } },
  });

  if (existing) {
    await prisma.reactionMessage.delete({ where: { id: existing.id } });
    return NextResponse.json({ action: "removed", emoji });
  } else {
    await prisma.reactionMessage.create({
      data: { messageId, userId, emoji },
    });
    return NextResponse.json({ action: "added", emoji });
  }
}
