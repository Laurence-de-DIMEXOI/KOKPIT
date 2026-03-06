import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH /api/workflows/template — Update email template
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, sujet, contenuHtml, contenuTexte, nom } = body;

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    const updateData: any = {};
    if (sujet) updateData.sujet = sujet;
    if (contenuHtml) updateData.contenuHtml = contenuHtml;
    if (contenuTexte !== undefined) updateData.contenuTexte = contenuTexte;
    if (nom) updateData.nom = nom;

    const template = await prisma.emailTemplate.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, template });
  } catch (error: any) {
    console.error("PATCH /api/workflows/template error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
