import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/commercial/objectifs — Retourne l'objectif du mois/année
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const now = new Date();
    const month = parseInt(searchParams.get("month") || String(now.getMonth() + 1), 10);
    const year = parseInt(searchParams.get("year") || String(now.getFullYear()), 10);

    const objectif = await prisma.objectifCommercial.findUnique({
      where: { month_year: { month, year } },
    });

    return NextResponse.json({
      success: true,
      objectif: objectif || null,
      month,
      year,
    });
  } catch (error: any) {
    console.error("Erreur objectifs:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/commercial/objectifs — Crée ou met à jour l'objectif
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { month, year, amount } = body;

    if (!month || !year || amount === undefined) {
      return NextResponse.json(
        { success: false, error: "month, year et amount requis" },
        { status: 400 }
      );
    }

    const objectif = await prisma.objectifCommercial.upsert({
      where: { month_year: { month, year } },
      update: { amount, updatedAt: new Date() },
      create: { month, year, amount },
    });

    return NextResponse.json({ success: true, objectif });
  } catch (error: any) {
    console.error("Erreur save objectif:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
