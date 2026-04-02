import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculatePriority, type PriorityLevel } from "@/lib/contact-priority";

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";
const SENDER = { name: "KOKPIT", email: "laurence.payet@dimexoi.fr" };

const RECIPIENTS = [
  { email: "michelle.perrot@dimexoi.fr", name: "Michelle Perrot" },
  { email: "bernard@dimexoi.fr", name: "Bernard Robert" },
  { email: "commercial@dimexoi.fr", name: "Daniella Folio" },
];

function levelLabel(level: PriorityLevel): string {
  if (level === "burning") return "Brûlant 🔥";
  if (level === "hot") return "Chaud 🟠";
  return level;
}

function levelColor(level: PriorityLevel): string {
  if (level === "burning") return "#D32F2F";
  if (level === "hot") return "#E65100";
  return "#888";
}

async function sendScoringAlertEmail(
  contacts: Array<{ id: string; nom: string; prenom: string; email: string; level: PriorityLevel; score: number; reasons: string[] }>
) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return;

  const rows = contacts.map((c) => `
    <tr>
      <td style="padding:10px 16px;font-size:13px;color:#1F2937;border-top:1px solid #F3F4F6;">${c.prenom} ${c.nom}</td>
      <td style="padding:10px 16px;font-size:12px;color:#6B7280;border-top:1px solid #F3F4F6;">${c.email}</td>
      <td style="padding:10px 16px;border-top:1px solid #F3F4F6;">
        <span style="background:${levelColor(c.level)};color:#fff;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:700;">${levelLabel(c.level)}</span>
      </td>
      <td style="padding:10px 16px;font-size:13px;font-weight:700;color:${levelColor(c.level)};border-top:1px solid #F3F4F6;">${c.score} pts</td>
      <td style="padding:10px 16px;font-size:12px;color:#6B7280;border-top:1px solid #F3F4F6;">${c.reasons.slice(0, 2).join(" · ")}</td>
    </tr>`).join("");

  const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#F5F6F7;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F6F7;"><tr><td align="center" style="padding:24px 16px;">
<table width="680" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
  <tr><td style="background:linear-gradient(135deg,#E65100,#D32F2F);padding:24px 32px;">
    <h1 style="margin:0;color:#fff;font-size:18px;font-weight:700;">🔥 Contacts chauds — Alerte scoring</h1>
    <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">${contacts.length} contact${contacts.length > 1 ? "s" : ""} passé${contacts.length > 1 ? "s" : ""} en Chaud ou Brûlant</p>
  </td></tr>
  <tr><td style="padding:24px 32px;">
    <p style="margin:0 0 16px;font-size:14px;color:#374151;">Les contacts suivants ont atteint un niveau de priorité élevé :</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E5E7EB;border-radius:8px;overflow:hidden;margin-bottom:20px;">
      <tr style="background:#F9FAFB;">
        <td style="padding:10px 16px;font-size:11px;color:#6B7280;font-weight:600;text-transform:uppercase;">Contact</td>
        <td style="padding:10px 16px;font-size:11px;color:#6B7280;font-weight:600;text-transform:uppercase;">Email</td>
        <td style="padding:10px 16px;font-size:11px;color:#6B7280;font-weight:600;text-transform:uppercase;">Niveau</td>
        <td style="padding:10px 16px;font-size:11px;color:#6B7280;font-weight:600;text-transform:uppercase;">Score</td>
        <td style="padding:10px 16px;font-size:11px;color:#6B7280;font-weight:600;text-transform:uppercase;">Raisons</td>
      </tr>
      ${rows}
    </table>
    <p style="margin:0;font-size:11px;color:#9CA3AF;text-align:center;">Email automatique KOKPIT — <a href="https://kokpit-kappa.vercel.app/contacts" style="color:#E65100;">Voir les contacts</a></p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;

  const res = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: { "accept": "application/json", "content-type": "application/json", "api-key": apiKey },
    body: JSON.stringify({
      sender: SENDER,
      to: RECIPIENTS,
      subject: `🔥 ${contacts.length} contact${contacts.length > 1 ? "s" : ""} chaud${contacts.length > 1 ? "s" : ""} — Alerte scoring KOKPIT`,
      htmlContent: html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Brevo error: ${res.status} ${err}`);
  }
}

export async function GET(request: NextRequest) {
  // Vérifier le secret cron
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Charger tous les contacts avec leurs relations
    const contacts = await prisma.contact.findMany({
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        lifecycleStage: true,
        createdAt: true,
        lastScoringLevel: true,
        devis: {
          select: { statut: true, montant: true, dateEnvoi: true, createdAt: true },
        },
        ventes: {
          select: { montant: true, dateVente: true, createdAt: true },
        },
        leads: {
          select: { createdAt: true },
        },
      },
    });

    const newHotContacts: Array<{
      id: string;
      nom: string;
      prenom: string;
      email: string;
      level: PriorityLevel;
      score: number;
      reasons: string[];
    }> = [];

    const updates: Array<{ id: string; level: PriorityLevel }> = [];

    for (const contact of contacts) {
      const result = calculatePriority(
        { lifecycleStage: contact.lifecycleStage, createdAt: contact.createdAt.toISOString() },
        contact.devis.map((d) => ({
          statut: d.statut,
          montant: d.montant ?? undefined,
          dateEnvoi: d.dateEnvoi?.toISOString() ?? null,
          createdAt: d.createdAt.toISOString(),
        })),
        contact.ventes.map((v) => ({
          montant: v.montant ?? undefined,
          dateVente: v.dateVente?.toISOString() ?? null,
          createdAt: v.createdAt.toISOString(),
        })),
        contact.leads.map((l) => ({
          dateDemande: l.dateDemande?.toISOString() ?? null,
          createdAt: l.createdAt.toISOString(),
        }))
      );

      const currentLevel = result.level;
      const prevLevel = contact.lastScoringLevel as PriorityLevel | null;

      // Détecter la transition vers chaud ou brûlant
      const isNowHot = currentLevel === "hot" || currentLevel === "burning";
      const wasHot = prevLevel === "hot" || prevLevel === "burning";

      if (isNowHot && !wasHot) {
        newHotContacts.push({
          id: contact.id,
          nom: contact.nom,
          prenom: contact.prenom,
          email: contact.email,
          level: currentLevel,
          score: result.score,
          reasons: result.reasons,
        });
      }

      // Mettre à jour si le niveau a changé
      if (currentLevel !== prevLevel) {
        updates.push({ id: contact.id, level: currentLevel });
      }
    }

    // Mettre à jour lastScoringLevel pour tous les contacts dont le niveau a changé
    for (const u of updates) {
      await prisma.contact.update({
        where: { id: u.id },
        data: { lastScoringLevel: u.level },
      });
    }

    // Envoyer l'email si des contacts sont passés en chaud/brûlant
    if (newHotContacts.length > 0) {
      await sendScoringAlertEmail(newHotContacts);
    }

    return NextResponse.json({
      checked: contacts.length,
      updated: updates.length,
      newHot: newHotContacts.length,
      notified: newHotContacts.map((c) => `${c.prenom} ${c.nom} (${c.level})`),
    });
  } catch (error) {
    console.error("Erreur cron scoring-alerts:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
