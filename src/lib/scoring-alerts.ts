/**
 * Vérifie le scoring d'un contact et envoie une alerte si le contact passe en Chaud ou Brûlant.
 * À appeler après toute action qui peut faire évoluer le score (nouveau devis, nouvelle vente, nouveau lead).
 */

import { prisma } from "@/lib/prisma";
import { calculatePriority, type PriorityLevel } from "@/lib/contact-priority";

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";
const SENDER = { name: "KOKPIT", email: "laurence.payet@dimexoi.fr" };

const ALERT_RECIPIENTS = [
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
  return "#E65100";
}

async function sendScoringAlert(
  contact: { nom: string; prenom: string; email: string },
  level: PriorityLevel,
  score: number,
  reasons: string[]
) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return;

  const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#F5F6F7;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F6F7;"><tr><td align="center" style="padding:24px 16px;">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
  <tr><td style="background:linear-gradient(135deg,${levelColor(level)},${level === "burning" ? "#B71C1C" : "#D32F2F"});padding:24px 32px;">
    <h1 style="margin:0;color:#fff;font-size:18px;font-weight:700;">${levelLabel(level)} — ${contact.prenom} ${contact.nom}</h1>
    <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">Score : ${score}/100</p>
  </td></tr>
  <tr><td style="padding:24px 32px;">
    <p style="margin:0 0 16px;font-size:14px;color:#374151;">Ce contact vient de passer en <strong>${levelLabel(level)}</strong> et mérite une attention prioritaire.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E5E7EB;border-radius:8px;overflow:hidden;margin-bottom:20px;">
      <tr style="background:#F9FAFB;">
        <td style="padding:10px 16px;font-size:12px;color:#6B7280;font-weight:600;text-transform:uppercase;">Contact</td>
        <td style="padding:10px 16px;font-size:13px;color:#1F2937;font-weight:600;">${contact.prenom} ${contact.nom}</td>
      </tr>
      <tr>
        <td style="padding:10px 16px;font-size:12px;color:#6B7280;font-weight:600;text-transform:uppercase;border-top:1px solid #F3F4F6;">Email</td>
        <td style="padding:10px 16px;font-size:13px;color:#374151;border-top:1px solid #F3F4F6;">${contact.email}</td>
      </tr>
      <tr>
        <td style="padding:10px 16px;font-size:12px;color:#6B7280;font-weight:600;text-transform:uppercase;border-top:1px solid #F3F4F6;">Niveau</td>
        <td style="padding:10px 16px;border-top:1px solid #F3F4F6;">
          <span style="background:${levelColor(level)};color:#fff;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:700;">${levelLabel(level)} — ${score} pts</span>
        </td>
      </tr>
      <tr>
        <td style="padding:10px 16px;font-size:12px;color:#6B7280;font-weight:600;text-transform:uppercase;border-top:1px solid #F3F4F6;">Raisons</td>
        <td style="padding:10px 16px;font-size:13px;color:#374151;border-top:1px solid #F3F4F6;">${reasons.join(" · ")}</td>
      </tr>
    </table>
    <p style="margin:0;font-size:11px;color:#9CA3AF;text-align:center;">Email automatique KOKPIT — <a href="https://kokpit-kappa.vercel.app/contacts" style="color:#E65100;">Voir les contacts</a></p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;

  const res = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json", "api-key": apiKey },
    body: JSON.stringify({
      sender: SENDER,
      to: ALERT_RECIPIENTS,
      subject: `${levelLabel(level)} — ${contact.prenom} ${contact.nom} (${score} pts)`,
      htmlContent: html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Brevo error: ${res.status} ${err}`);
  }
}

/**
 * Calcule le score du contact et envoie une alerte si le contact vient de passer en Chaud ou Brûlant.
 * Fire-and-forget : les erreurs sont loggées sans bloquer l'appelant.
 */
export async function checkAndNotifyScoring(contactId: string): Promise<void> {
  try {
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
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
          select: { dateDemande: true, createdAt: true },
        },
      },
    });

    if (!contact) return;

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

    const isNowHot = currentLevel === "hot" || currentLevel === "burning";
    const wasHot = prevLevel === "hot" || prevLevel === "burning";

    // Mettre à jour lastScoringLevel si changé
    if (currentLevel !== prevLevel) {
      await prisma.contact.update({
        where: { id: contactId },
        data: { lastScoringLevel: currentLevel },
      });
    }

    // Notifier seulement si transition vers chaud/brûlant
    if (isNowHot && !wasHot) {
      await sendScoringAlert(
        { nom: contact.nom, prenom: contact.prenom, email: contact.email },
        currentLevel,
        result.score,
        result.reasons
      );
    }
  } catch (err) {
    console.error(`[scoring-alerts] Erreur pour contact ${contactId}:`, err);
  }
}
