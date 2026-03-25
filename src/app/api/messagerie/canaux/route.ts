import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - List channels + DMs for current user
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  const memberships = await prisma.canalMembre.findMany({
    where: { userId: session.user.id },
    include: {
      canal: {
        include: {
          messages: {
            take: 1,
            orderBy: { createdAt: "desc" },
            include: {
              expediteur: {
                select: { id: true, nom: true, prenom: true },
              },
            },
          },
          membres: {
            include: {
              user: {
                select: { id: true, nom: true, prenom: true },
              },
            },
          },
        },
      },
    },
  });

  const canaux = memberships.map((m) => {
    const canal = m.canal;
    const lastMessage = canal.messages[0] || null;
    const memberNames = canal.membres.map((mb) => ({
      id: mb.user.id,
      nom: mb.user.nom,
      prenom: mb.user.prenom,
    }));

    return {
      id: canal.id,
      nom: canal.nom,
      description: canal.description,
      type: canal.type,
      createdAt: canal.createdAt,
      dernierLu: m.dernierLu,
      lastMessage: lastMessage
        ? {
            id: lastMessage.id,
            contenu: lastMessage.contenu,
            createdAt: lastMessage.createdAt,
            expediteur: lastMessage.expediteur,
          }
        : null,
      membres: memberNames,
    };
  });

  // Sort: PUBLIC channels first (alphabetical), then DMs (by last message time desc)
  canaux.sort((a, b) => {
    if (a.type === "PUBLIC" && b.type === "DM") return -1;
    if (a.type === "DM" && b.type === "PUBLIC") return 1;

    if (a.type === "PUBLIC" && b.type === "PUBLIC") {
      return a.nom.localeCompare(b.nom);
    }

    // Both DMs: sort by last message time (most recent first)
    const aTime = a.lastMessage?.createdAt
      ? new Date(a.lastMessage.createdAt).getTime()
      : 0;
    const bTime = b.lastMessage?.createdAt
      ? new Date(b.lastMessage.createdAt).getTime()
      : 0;
    return bTime - aTime;
  });

  return NextResponse.json(canaux);
}

// POST - Create channel or DM
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  const body = await request.json();
  const { type, nom, description, destinataireId, membreIds } = body;

  if (type === "PUBLIC") {
    // Only ADMIN or DIRECTION can create public channels
    if (!["ADMIN", "DIRECTION"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Seuls les administrateurs peuvent creer des canaux publics" },
        { status: 403 }
      );
    }

    if (!nom) {
      return NextResponse.json(
        { error: "Le nom du canal est requis" },
        { status: 400 }
      );
    }

    const canal = await prisma.canal.create({
      data: {
        nom,
        description: description || null,
        type: "PUBLIC",
        membres: {
          create: [
            { userId: session.user.id },
            ...(membreIds || [])
              .filter((id: string) => id !== session.user.id)
              .map((id: string) => ({ userId: id })),
          ],
        },
      },
      include: {
        membres: {
          include: {
            user: { select: { id: true, nom: true, prenom: true } },
          },
        },
      },
    });

    return NextResponse.json(canal, { status: 201 });
  }

  if (type === "DM") {
    if (!destinataireId) {
      return NextResponse.json(
        { error: "Le destinataire est requis pour un DM" },
        { status: 400 }
      );
    }

    if (destinataireId === session.user.id) {
      return NextResponse.json(
        { error: "Impossible de creer un DM avec soi-meme" },
        { status: 400 }
      );
    }

    // Check if DM already exists between these two users
    const existingDM = await prisma.canal.findFirst({
      where: {
        type: "DM",
        AND: [
          { membres: { some: { userId: session.user.id } } },
          { membres: { some: { userId: destinataireId } } },
        ],
      },
      include: {
        membres: {
          include: {
            user: { select: { id: true, nom: true, prenom: true } },
          },
        },
      },
    });

    if (existingDM) {
      return NextResponse.json(existingDM);
    }

    // Create new DM
    const [id1, id2] = [session.user.id, destinataireId].sort();
    const canal = await prisma.canal.create({
      data: {
        nom: `dm-${id1}-${id2}`,
        type: "DM",
        membres: {
          create: [{ userId: session.user.id }, { userId: destinataireId }],
        },
      },
      include: {
        membres: {
          include: {
            user: { select: { id: true, nom: true, prenom: true } },
          },
        },
      },
    });

    return NextResponse.json(canal, { status: 201 });
  }

  return NextResponse.json(
    { error: "Type de canal invalide. Utilisez PUBLIC ou DM" },
    { status: 400 }
  );
}
