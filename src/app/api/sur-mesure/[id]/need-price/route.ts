import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/resend";
import { notifierTransitionProjet } from "@/lib/sur-mesure-notifications";
import { z } from "zod";

const ligneSchema = z.object({
  denomination: z.string().min(1),
  dimensions: z.string().min(1),
  finitions: z.string().optional().nullable(),
});

const schema = z.object({
  lignes: z.array(ligneSchema).min(1),
  notes: z.string().optional().nullable(),
});

// Destinataires Need Price (équipe achat + CC, comme le module need-price existant)
const NEED_PRICE_DESTINATAIRES = [
  "dimexoidepi@gmail.com", // Elaury
];
const NEED_PRICE_CC = ["bernard@dimexoi.fr", "michelle.perrot@dimexoi.fr", "commercial@dimexoi.fr"];

/**
 * POST /api/sur-mesure/[id]/need-price
 * Crée un NeedPrice (NP-2026-XXX) pré-rempli depuis le projet, le lie au projet,
 * notifie Elaury + équipe, et passe le projet en statut NEED_PRICE.
 * Déclenchable à tout moment (pas verrouillé à une étape).
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const userId = (session.user as { id?: string }).id;
  if (!userId) return NextResponse.json({ error: "Session invalide" }, { status: 401 });
  const { id } = await params;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Au moins un meuble (dénomination + dimensions) requis" }, { status: 400 });
  }
  const { lignes, notes } = parsed.data;

  const projet = await prisma.projetSurMesure.findFirst({
    where: { id, deletedAt: null },
    include: {
      contact: { select: { nom: true, prenom: true } },
      proprietaire: { select: { email: true } },
    },
  });
  if (!projet) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  // Génère la référence NP-YYYY-XXX
  const year = new Date().getFullYear();
  const last = await prisma.needPrice.findFirst({
    where: { reference: { startsWith: `NP-${year}-` } },
    orderBy: { reference: "desc" },
  });
  let next = 1;
  if (last) {
    const n = parseInt(last.reference.split("-")[2], 10);
    if (!isNaN(n)) next = n + 1;
  }
  const reference = `NP-${year}-${String(next).padStart(3, "0")}`;

  const nomClient = projet.contact
    ? `${projet.contact.prenom || ""} ${projet.contact.nom || ""}`.trim()
    : projet.titre;
  const refDevis = projet.numeroSellsy || "";
  const first = lignes[0];

  const needPrice = await prisma.needPrice.create({
    data: {
      reference,
      refDevis,
      nomClient,
      denomination: first.denomination,
      dimensions: first.dimensions,
      finitions: first.finitions || null,
      lignes: lignes as never,
      notes: notes || `Généré depuis le projet sur-mesure ${projet.numero}`,
      createdById: userId,
    },
  });

  // Lier au projet + passer en NEED_PRICE
  await prisma.projetSurMesure.update({
    where: { id },
    data: { needPriceId: needPrice.id, statut: "NEED_PRICE" },
  });

  // Email à Elaury + CC (texte, pas de pièces jointes ici — ajout possible dans /achat/need-price)
  if (process.env.BREVO_API_KEY) {
    const lignesText = lignes
      .map((l, i) => `${i + 1}. ${l.denomination} — ${l.dimensions}${l.finitions ? ` — ${l.finitions}` : ""}`)
      .join("<br>");
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <h2 style="color:#0E6973">Need Price ${reference}${refDevis ? ` — ${refDevis}` : ""}</h2>
        <p><strong>Client :</strong> ${nomClient}</p>
        <p><strong>Projet sur-mesure :</strong> ${projet.numero} — ${projet.titre}</p>
        <div style="background:#f8fafc;border-left:4px solid #0E6973;padding:12px 16px;margin:16px 0;border-radius:4px">
          ${lignesText}
        </div>
        ${notes ? `<p><strong>Notes :</strong> ${notes}</p>` : ""}
        <p style="color:#94a3b8;font-size:12px;margin-top:24px">Demande de prix générée depuis le module Sur-Mesure KOKPIT.</p>
      </div>`;
    try {
      await sendEmail({
        to: [...NEED_PRICE_DESTINATAIRES, ...NEED_PRICE_CC],
        subject: `Need Price ${reference} — ${nomClient}`,
        html,
      });
    } catch (e) {
      console.warn("[need-price projet] email:", (e as Error).message);
    }
  }

  // Notif équipe sur-mesure + journal
  notifierTransitionProjet({
    projetId: projet.id,
    numero: projet.numero,
    titre: projet.titre,
    transition: "NEED_PRICE_ENVOYE",
    proprietaireEmail: projet.proprietaire?.email,
  }).catch(() => {});

  if (projet.contactId) {
    await prisma.evenement.create({
      data: {
        contactId: projet.contactId,
        type: "NEED_PRICE_ENVOYE",
        description: `Need Price ${reference} envoyé pour ${projet.numero}`,
        metadata: { projetId: projet.id, needPriceRef: reference },
      },
    }).catch(() => {});
  }

  return NextResponse.json({ needPrice, reference }, { status: 201 });
}
