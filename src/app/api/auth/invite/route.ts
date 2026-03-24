import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

const BREVO_API_URL = "https://api.brevo.com/v3";
const SENDER = { name: "KOKPIT", email: "laurence.payet@dimexoi.fr" };
const APP_URL = process.env.NEXTAUTH_URL || "https://kokpit-kappa.vercel.app";

/**
 * POST /api/auth/invite
 * Envoie un email d'invitation avec un lien pour définir son mot de passe.
 * Body: { userId } — ADMIN uniquement
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (!["ADMIN", "DIRECTION"].includes(role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const body = await req.json();
  const { userId } = body;

  if (!userId) {
    return NextResponse.json({ error: "userId requis" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, prenom: true, nom: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }

  // Générer un token unique valable 24h
  const token = randomBytes(32).toString("hex");
  const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: userId },
    data: { resetToken: token, resetTokenExpiry: expiry },
  });

  // Construire le lien
  const link = `${APP_URL}/set-password?token=${token}`;

  // Envoyer l'email
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "BREVO_API_KEY manquante" }, { status: 500 });
  }

  const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#F5F6F7;font-family:'Inter',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F6F7;">
<tr><td align="center" style="padding:32px 16px;">
<table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;background:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">

  <tr>
    <td style="background:linear-gradient(135deg,#F4B400,#E5A800);padding:24px 32px;text-align:center;">
      <h1 style="margin:0;color:#FFFFFF;font-size:22px;font-weight:700;">KOKPIT</h1>
      <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">Le SaaS Péï</p>
    </td>
  </tr>

  <tr>
    <td style="padding:32px;">
      <p style="font-size:16px;color:#1F2937;margin:0 0 8px;">Bonjour ${user.prenom},</p>
      <p style="font-size:14px;color:#374151;line-height:1.6;margin:0 0 24px;">
        Votre compte KOKPIT est prêt ! Cliquez sur le bouton ci-dessous pour définir votre mot de passe et accéder à votre espace.
      </p>

      <div style="text-align:center;margin:24px 0;">
        <a href="${link}" style="display:inline-block;padding:14px 32px;background:#F4B400;color:#FFFFFF;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;">
          Définir mon mot de passe
        </a>
      </div>

      <p style="font-size:12px;color:#9CA3AF;line-height:1.5;margin:24px 0 0;">
        Ce lien est valable 24 heures. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.
      </p>

      <hr style="border:none;border-top:1px solid #E5E7EB;margin:24px 0 16px;"/>

      <p style="font-size:12px;color:#9CA3AF;margin:0;">
        <strong>Votre email de connexion :</strong> ${user.email}<br/>
        <strong>Lien KOKPIT :</strong> <a href="${APP_URL}" style="color:#F4B400;">${APP_URL}</a>
      </p>
    </td>
  </tr>

</table>
</td></tr></table>
</body></html>`;

  const res = await fetch(`${BREVO_API_URL}/smtp/email`, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: SENDER,
      to: [{ email: user.email, name: `${user.prenom} ${user.nom}` }],
      subject: "KOKPIT — Définissez votre mot de passe",
      htmlContent: html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: `Erreur envoi: ${err}` }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: `Email d'invitation envoyé à ${user.email}`,
  });
}
