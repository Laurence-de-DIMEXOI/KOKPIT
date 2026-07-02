import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeBesoinMatches } from "@/lib/besoins-clients-match";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * Recalcule les correspondances « besoins clients » × meubles stock en mer,
 * puis envoie un email digest des nouvelles correspondances.
 * Auth : session, ou Bearer CRON_API_SECRET / UA vercel-cron.
 */
async function run(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const ua = req.headers.get("user-agent") || "";
  const cronSecret = process.env.CRON_API_SECRET;
  const isCron = ua.includes("vercel-cron") || (!!cronSecret && auth === `Bearer ${cronSecret}`);
  if (!isCron) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const fresh = await computeBesoinMatches();

  // Email digest des nouvelles correspondances (jamais notifiées)
  if (fresh.length > 0 && process.env.BREVO_API_KEY) {
    try {
      const rows = fresh
        .map(
          (m) =>
            `<li><b>${escapeHtml(m.nomClient)}</b> — ${escapeHtml(m.descMeuble)} <span style="color:#888">(${m.bcdi} · ${m.imp}${m.dateArrivee ? " · arrivée " + m.dateArrivee.toISOString().slice(0, 10) : ""})</span></li>`
        )
        .join("");
      const html = `<p>Des meubles en stock arrivent et correspondent à des besoins clients en attente :</p><ul>${rows}</ul><p>À vérifier et rappeler depuis <a href="https://kokpit.dimexoi.fr/commercial/besoins-clients">Besoins clients</a>.</p>`;
      await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: { accept: "application/json", "content-type": "application/json", "api-key": process.env.BREVO_API_KEY },
        body: JSON.stringify({
          sender: { name: "KOKPIT", email: "laurence.payet@dimexoi.fr" },
          to: [{ email: "laurence.payet@dimexoi.fr" }],
          subject: `Besoins clients — ${fresh.length} arrivage(s) correspondant(s)`,
          htmlContent: html,
        }),
      });
      await prisma.besoinMatch.updateMany({
        where: { id: { in: fresh.map((m) => m.matchId) } },
        data: { notifiedAt: new Date() },
      });
    } catch (e) {
      console.error("Email digest besoins-clients:", e);
    }
  }

  return NextResponse.json({ ok: true, nouvellesCorrespondances: fresh.length });
}

export async function GET(req: NextRequest) {
  return run(req);
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
