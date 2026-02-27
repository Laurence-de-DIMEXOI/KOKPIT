import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// GET /api/contacts/[id] — Détails complets d'un contact
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const contact = await prisma.contact.findUnique({
      where: { id },
      include: {
        showroom: { select: { id: true, nom: true } },
        demandesPrix: {
          orderBy: { dateDemande: "desc" },
        },
        leads: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            commercial: { select: { id: true, nom: true, prenom: true } },
          },
        },
        devis: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        evenements: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        _count: {
          select: { demandesPrix: true, leads: true, devis: true, ventes: true },
        },
      },
    });

    if (!contact) {
      return NextResponse.json(
        { error: "Contact non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(contact);
  } catch (error: any) {
    console.error("GET /api/contacts/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}

// PUT /api/contacts/[id] — Mettre à jour un contact
const updateSchema = z.object({
  nom: z.string().min(1).optional(),
  prenom: z.string().optional(),
  email: z.string().email().optional(),
  telephone: z.string().optional().nullable(),
  showroomId: z.string().optional().nullable(),
  lifecycleStage: z.enum(["PROSPECT", "LEAD", "CLIENT", "INACTIF"]).optional(),
  consentOffre: z.boolean().optional(),
  consentNewsletter: z.boolean().optional(),
  consentInvitation: z.boolean().optional(),
  consentDevis: z.boolean().optional(),
  rgpdEmailConsent: z.boolean().optional(),
  rgpdSmsConsent: z.boolean().optional(),
  notes: z.string().optional().nullable(),
  adresse: z.string().optional().nullable(),
  ville: z.string().optional().nullable(),
  codePostal: z.string().optional().nullable(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = updateSchema.parse(body);

    const contact = await prisma.contact.update({
      where: { id },
      data,
      include: {
        showroom: { select: { id: true, nom: true } },
        demandesPrix: {
          orderBy: { dateDemande: "desc" },
        },
        _count: {
          select: { demandesPrix: true, leads: true, devis: true },
        },
      },
    });

    return NextResponse.json(contact);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Contact non trouvé" },
        { status: 404 }
      );
    }
    console.error("PUT /api/contacts/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}

// DELETE /api/contacts/[id] — Supprimer un contact
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.contact.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Contact non trouvé" },
        { status: 404 }
      );
    }
    console.error("DELETE /api/contacts/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}
