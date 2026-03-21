import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const maxDuration = 60;

// POST — Matching automatique des clients BDO avec les contacts DIMEXOI par email
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
    }
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Accès réservé aux administrateurs" },
        { status: 403 }
      );
    }

    // Charger les clients BDO avec statut NOUVEAU et email non vide
    const bdoClients = await prisma.clientBoisDOrient.findMany({
      where: {
        statut: "NOUVEAU",
        email: { not: null },
        NOT: { email: "" },
      },
    });

    // Charger tous les contacts DIMEXOI
    const contacts = await prisma.contact.findMany({
      select: {
        id: true,
        email: true,
        sellsyContactId: true,
      },
    });

    // Construire une map email → contact (lowercase, trim)
    const emailMap = new Map<string, { id: string; sellsyContactId: string | null }>();
    for (const contact of contacts) {
      const normalizedEmail = contact.email.toLowerCase().trim();
      if (normalizedEmail && contact.sellsyContactId) {
        emailMap.set(normalizedEmail, {
          id: contact.id,
          sellsyContactId: contact.sellsyContactId,
        });
      }
    }

    let matched = 0;
    let unmatched = 0;
    const total = bdoClients.length;

    // Pour chaque client BDO avec email : match exact
    for (const bdoClient of bdoClients) {
      const normalizedEmail = bdoClient.email!.toLowerCase().trim();
      const matchedContact = emailMap.get(normalizedEmail);

      if (matchedContact) {
        await prisma.clientBoisDOrient.update({
          where: { id: bdoClient.id },
          data: {
            statut: "MATCH_EMAIL",
            contactDimexoiId: matchedContact.sellsyContactId,
          },
        });
        matched++;
      } else {
        unmatched++;
      }
    }

    // Mettre à jour l'ImportBoisDOrient avec les stats de matching
    const latestImport = await prisma.importBoisDOrient.findFirst({
      orderBy: { dateImport: "desc" },
    });

    if (latestImport) {
      await prisma.importBoisDOrient.update({
        where: { id: latestImport.id },
        data: {
          nbMatchEmail: matched,
          nbNouveaux: unmatched,
        },
      });
    }

    return NextResponse.json({
      matched,
      unmatched,
      total,
    });
  } catch (error) {
    console.error("Erreur lors du matching BDO:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
