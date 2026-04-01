import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";
const SENDER = { name: "KOKPIT", email: "laurence.payet@dimexoi.fr" };

function fmtEuro(n: number | null | undefined): string {
  if (!n) return "—";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

async function sendPrixRecuEmail(np: any, demandeur: { prenom: string; nom: string; email: string }) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return;

  const ref = np.refDevis ? `${np.reference} — ${np.refDevis}` : np.reference;

  const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#F5F6F7;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F6F7;"><tr><td align="center" style="padding:24px 16px;">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
  <tr><td style="background:linear-gradient(135deg,#CBA1D4,#a855f7);padding:24px 32px;">
    <h1 style="margin:0;color:#fff;font-size:18px;font-weight:700;">💰 Prix reçu — ${ref}</h1>
    <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">Client : ${np.nomClient || "—"}</p>
  </td></tr>
  <tr><td style="padding:24px 32px;">
    <p style="margin:0 0 16px;font-size:14px;color:#374151;">Bonjour ${demandeur.prenom},</p>
    <p style="margin:0 0 20px;font-size:14px;color:#374151;">Le prix pour la demande suivante est disponible :</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E5E7EB;border-radius:8px;overflow:hidden;margin-bottom:20px;">
      <tr style="background:#F9FAFB;">
        <td style="padding:10px 16px;font-size:12px;color:#6B7280;font-weight:600;text-transform:uppercase;">Article</td>
        <td style="padding:10px 16px;font-size:13px;color:#1F2937;font-weight:600;">${np.denomination}</td>
      </tr>
      <tr>
        <td style="padding:10px 16px;font-size:12px;color:#6B7280;font-weight:600;text-transform:uppercase;border-top:1px solid #F3F4F6;">Prix de vente</td>
        <td style="padding:10px 16px;font-size:18px;font-weight:700;color:#10B981;border-top:1px solid #F3F4F6;">${fmtEuro(np.prixVente)}</td>
      </tr>
      <tr>
        <td style="padding:10px 16px;font-size:12px;color:#6B7280;font-weight:600;text-transform:uppercase;border-top:1px solid #F3F4F6;">Prix minimum</td>
        <td style="padding:10px 16px;font-size:14px;color:#374151;border-top:1px solid #F3F4F6;">${fmtEuro(np.prixMinimum)}</td>
      </tr>
      ${np.notes ? `<tr>
        <td style="padding:10px 16px;font-size:12px;color:#6B7280;font-weight:600;text-transform:uppercase;border-top:1px solid #F3F4F6;">Notes</td>
        <td style="padding:10px 16px;font-size:13px;color:#374151;border-top:1px solid #F3F4F6;white-space:pre-line;">${np.notes}</td>
      </tr>` : ""}
    </table>
    <p style="margin:0;font-size:11px;color:#9CA3AF;text-align:center;">Email automatique KOKPIT — <a href="https://kokpit-kappa.vercel.app/achat/need-price" style="color:#a855f7;">Voir dans KOKPIT</a></p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;

  const res = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: { "accept": "application/json", "content-type": "application/json", "api-key": apiKey },
    body: JSON.stringify({
      sender: SENDER,
      to: [{ email: demandeur.email, name: `${demandeur.prenom} ${demandeur.nom}` }],
      subject: `💰 Prix reçu — ${ref} — ${np.nomClient || ""}`.trim(),
      htmlContent: html,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Brevo error: ${res.status} ${err}`);
  }
}

// GET - Return single NeedPrice by id
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const needPrice = await prisma.needPrice.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { nom: true, prenom: true },
        },
      },
    });

    if (!needPrice) {
      return NextResponse.json(
        { error: "Demande de prix non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json(needPrice);
  } catch (error) {
    console.error("Erreur lors de la récupération du NeedPrice:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// PUT - Update NeedPrice by id (ACHAT or ADMIN only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    const existing = await prisma.needPrice.findUnique({
      where: { id },
      include: { createdBy: { select: { nom: true, prenom: true, email: true } } },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Demande de prix non trouvée" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { statut, prixFournisseur, prixVente, prixMinimum, typePrix, notes, refDevis } = body;

    const data: any = {};
    if (statut !== undefined) data.statut = statut;
    if (prixFournisseur !== undefined) data.prixFournisseur = prixFournisseur;
    if (prixVente !== undefined) data.prixVente = prixVente;
    if (prixMinimum !== undefined) data.prixMinimum = prixMinimum;
    if (typePrix !== undefined) data.typePrix = typePrix;
    if (notes !== undefined) data.notes = notes;
    if (refDevis !== undefined) data.refDevis = refDevis;

    const updated = await prisma.needPrice.update({
      where: { id },
      data,
      include: {
        createdBy: {
          select: { nom: true, prenom: true, email: true },
        },
      },
    });

    // Notifier le demandeur quand le statut passe à PRIX_RECU
    if (statut === "PRIX_RECU" && existing.statut !== "PRIX_RECU") {
      try {
        const demandeur = existing.createdBy as { prenom: string; nom: string; email: string };
        if (demandeur?.email) {
          await sendPrixRecuEmail(updated, demandeur);
        }
      } catch (emailErr) {
        console.error("Erreur envoi notif prix reçu:", emailErr);
        // Ne pas bloquer la réponse si l'email échoue
      }
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erreur lors de la mise à jour du NeedPrice:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// DELETE - Delete NeedPrice (ACHAT or ADMIN only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }
    if (!["ACHAT", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }
    const { id } = await params;
    await prisma.needPrice.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur suppression NeedPrice:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
