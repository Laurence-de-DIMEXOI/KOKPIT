import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendEmail } from "@/lib/resend";

/**
 * GET /api/admin/test-email-conge?email=xxx&statut=approuve|refuse|modifie
 * Envoie un email d'exemple. Auth : session ADMIN/DIRECTION/Laurence
 * OU header Authorization: Bearer CRON_API_SECRET
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_API_SECRET;
  const isCron = !!secret && auth === `Bearer ${secret}`;
  if (!isCron) {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    const userEmail = session?.user?.email;
    const allowed =
      userEmail === "laurence.payet@dimexoi.fr" ||
      userEmail === "admin@kokpit.re" ||
      ["ADMIN", "DIRECTION"].includes(role);
    if (!session?.user || !allowed) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
  }

  const url = new URL(req.url);
  const email = url.searchParams.get("email") || "laurence.payet@dimexoi.fr";
  const statut = (url.searchParams.get("statut") || "approuve") as
    | "approuve"
    | "refuse"
    | "modifie";

  const dateDebutFR = "vendredi 30 mai";
  const dateFinFR = "vendredi 30 mai";
  const statutLabel =
    statut === "approuve"
      ? "approuvée ✅"
      : statut === "refuse"
      ? "refusée ❌"
      : "modifiée 🔄";
  const commentaire = "Exemple : bon repos, à lundi !";
  const prenom = email.split(".")[0]?.split("@")[0] || "collaborateur";
  const prenomCap = prenom.charAt(0).toUpperCase() + prenom.slice(1);

  const result = await sendEmail({
    to: email,
    subject: `Votre demande de congé a été ${
      statut === "approuve" ? "approuvée" : statut === "refuse" ? "refusée" : "modifiée"
    } [TEST]`,
    html: `
      <p>Bonjour ${prenomCap},</p>
      <p>Votre demande de congé du <strong>${dateDebutFR}</strong> au <strong>${dateFinFR}</strong> a été <strong>${statutLabel}</strong>.</p>
      ${commentaire ? `<p><strong>Commentaire :</strong> ${commentaire}</p>` : ""}
      <p>Consultez le détail dans <a href="https://kokpit.dimexoi.fr/conges">Congés &amp; Absences</a>.</p>
      <hr/>
      <p style="font-size:11px;color:#888">Email d'exemple envoyé depuis KOKPIT pour test de rendu.</p>
    `,
  });

  return NextResponse.json({
    success: result.success,
    to: email,
    statut,
    messageId: result.messageId,
    error: result.error,
  });
}
