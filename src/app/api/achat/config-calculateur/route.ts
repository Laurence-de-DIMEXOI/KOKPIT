import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Return current calculator config (first row)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
    }

    let config = await prisma.configCalculateur.findFirst();

    // Create default config if none exists
    if (!config) {
      config = await prisma.configCalculateur.create({
        data: {
          changeIndo: 15,
          coeffRevient: 1.6,
          coeffMarge: 2.5,
        },
      });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error("Erreur lors de la récupération de la config calculateur:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// PUT - Update calculator config (ACHAT or ADMIN only)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
    }

    if (!["ACHAT", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Accès réservé aux rôles ACHAT ou ADMIN" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { changeIndo, coeffRevient, coeffMarge } = body;

    if (changeIndo == null || coeffRevient == null || coeffMarge == null) {
      return NextResponse.json(
        { error: "changeIndo, coeffRevient et coeffMarge sont requis" },
        { status: 400 }
      );
    }

    // Get or create existing config
    let config = await prisma.configCalculateur.findFirst();

    if (config) {
      config = await prisma.configCalculateur.update({
        where: { id: config.id },
        data: {
          changeIndo,
          coeffRevient,
          coeffMarge,
          updatedById: session.user.id,
        },
      });
    } else {
      config = await prisma.configCalculateur.create({
        data: {
          changeIndo,
          coeffRevient,
          coeffMarge,
          updatedById: session.user.id,
        },
      });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la config calculateur:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
