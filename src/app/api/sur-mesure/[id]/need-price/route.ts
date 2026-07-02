import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/resend";
import { notifierTransitionProjet } from "@/lib/sur-mesure-notifications";
import { syncProjetSellsy } from "@/lib/sur-mesure-sellsy";

/**
 * POST /api/sur-mesure/[id]/need-price
 *
 * Need Price simplifié pour les sur-mesure de Laurent : on envoie juste
 *   - la référence DEPI- (numeroSellsy du projet)
 *   - le dernier PDF plan 3D uploadé
 * à Elaury (structure du webhook Need Price existant).
 *
 * Crée un NeedPrice (NP-2026-XXX) lié au projet + email Elaury/CC + passe en NEED_PRICE.
 * Déclenchable à tout moment.
 */

const NEED_PRICE_DESTINATAIRES = ["dimexoidepi@gmail.com"]; // Elaury
const NEED_PRICE_CC = ["bernard@dimexoi.fr", "michelle.perrot@dimexoi.fr", "commercial@dimexoi.fr"];

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const userId = (session.user as { id?: string }).id;
  if (!userId) return NextResponse.json({ error: "Session invalide" }, { status: 401 });
  const { id } = await params;

  const projet = await prisma.projetSurMesure.findFirst({
    where: { id, deletedAt: null },
    include: {
      contact: { select: { nom: true, prenom: true } },
      proprietaire: { select: { email: true } },
      documents: {
        where: { deletedAt: null, type: "plan_3d" },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!projet) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  // Pré-requis : DEPI + au moins un plan 3D
  const refDevis = projet.numeroSellsy?.trim() || "";
  if (!refDevis.toUpperCase().startsWith("DEPI")) {
    return NextResponse.json({ error: "Un numéro de devis DEPI- est requis (onglet Sellsy)." }, { status: 400 });
  }
  const plan3d = projet.documents[0];
  if (!plan3d) {
    return NextResponse.json({ error: "Aucun plan 3D PDF n'a été ajouté (onglet Plans 3D)." }, { status: 400 });
  }

  // Génère NP-YYYY-XXX
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

  const attachments = [
    { url: plan3d.url, type: "application/pdf", filename: plan3d.nom, size: 0 },
  ];

  const needPrice = await prisma.needPrice.create({
    data: {
      reference,
      refDevis,
      nomClient,
      denomination: projet.titre, // libellé projet (sur-mesure Laurent)
      attachments: attachments as never,
      notes: `Sur-mesure ${projet.numero} — plan 3D joint : ${plan3d.nom}`,
      createdById: userId,
    },
  });

  // Lier + passer en NEED_PRICE
  await prisma.projetSurMesure.update({
    where: { id },
    data: { needPriceId: needPrice.id, statut: "NEED_PRICE" },
  });

  // Dès qu'un Need Price existe → lie/rafraîchit automatiquement Sellsy (montant + statut).
  await syncProjetSellsy(id).catch(() => {});

  // Email Elaury + CC (lien vers le PDF plan 3D)
  if (process.env.BREVO_API_KEY) {
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <h2 style="color:#0E6973">Need Price ${reference} — ${refDevis}</h2>
        <p><strong>Client :</strong> ${nomClient}</p>
        <p><strong>Projet sur-mesure :</strong> ${projet.numero} — ${projet.titre}</p>
        <p style="margin:16px 0">
          <a href="${plan3d.url}" target="_blank" style="background:#0E6973;color:#fff;padding:10px 18px;text-decoration:none;border-radius:6px;display:inline-block;font-weight:600;">📐 Voir le plan 3D (${plan3d.nom})</a>
        </p>
        <p style="color:#94a3b8;font-size:12px;margin-top:24px">Demande de prix générée depuis le module Sur-Mesure KOKPIT.</p>
      </div>`;
    try {
      await sendEmail({
        to: [...NEED_PRICE_DESTINATAIRES, ...NEED_PRICE_CC],
        subject: `Need Price ${reference} — ${refDevis} — ${nomClient}`,
        html,
      });
    } catch (e) {
      console.warn("[need-price projet] email:", (e as Error).message);
    }
  }

  // Notif équipe + journal
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
        description: `Need Price ${reference} envoyé pour ${projet.numero} (plan 3D : ${plan3d.nom})`,
        metadata: { projetId: projet.id, needPriceRef: reference, refDevis },
      },
    }).catch(() => {});
  }

  return NextResponse.json({ needPrice, reference }, { status: 201 });
}
