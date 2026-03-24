import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const BREVO_API_URL = "https://api.brevo.com/v3";
const DESTINATAIRES = [
  { email: "laurence.payet@dimexoi.fr", name: "Laurence Payet" },
  { email: "michelle.perrot@dimexoi.fr", name: "Michelle Perrot" },
];
const SENDER = { name: "KOKPIT", email: "laurence.payet@dimexoi.fr" };

// ============================================================================
// Helpers
// ============================================================================

function formatDate(d: Date): string {
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Indian/Reunion",
  });
}

function formatEuro(n: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

function statutLabel(statut: string): string {
  const map: Record<string, string> = {
    NOUVEAU: "Nouveau",
    EN_COURS: "En cours",
    DEVIS: "Devis envoyé",
    VENTE: "Vente conclue",
    PERDU: "Perdu",
  };
  return map[statut] || statut;
}

function statutColor(statut: string): string {
  const map: Record<string, string> = {
    NOUVEAU: "#EF4444",
    EN_COURS: "#F59E0B",
    DEVIS: "#3B82F6",
    VENTE: "#10B981",
    PERDU: "#6B7280",
  };
  return map[statut] || "#6B7280";
}

// ============================================================================
// Build HTML email
// ============================================================================

interface DemandeRecap {
  clientNom: string;
  clientPrenom: string;
  email: string;
  telephone: string | null;
  meuble: string;
  leadStatut: string | null;
  commercialNom: string | null;
  devisRef: string | null;
  devisMontant: number | null;
  createdAt: Date;
}

function buildRecapEmail(
  demandes: DemandeRecap[],
  dateDebut: Date,
  dateFin: Date,
  kpis: { total: number; traitees: number; enAttente: number; caDevis: number }
): string {
  const demandesRows = demandes
    .map((d) => {
      const statut = d.leadStatut || "NOUVEAU";
      const devisCell = d.devisRef
        ? `<a href="https://www.sellsy.com/?_f=estimateOverview&id=${d.devisRef}" style="color:#0E6973;text-decoration:none;font-weight:600;">Devis #${d.devisRef}</a> (${formatEuro(d.devisMontant || 0)})`
        : '<span style="color:#9CA3AF;">—</span>';

      return `
        <tr style="border-bottom:1px solid #F3F4F6;">
          <td style="padding:12px 8px;font-size:13px;">
            <strong style="color:#1F2937;">${d.clientPrenom} ${d.clientNom}</strong><br/>
            <span style="color:#6B7280;font-size:11px;">${d.email}</span>
          </td>
          <td style="padding:12px 8px;font-size:12px;color:#374151;">${d.meuble.length > 50 ? d.meuble.substring(0, 50) + "..." : d.meuble}</td>
          <td style="padding:12px 8px;text-align:center;">
            <span style="background:${statutColor(statut)}20;color:${statutColor(statut)};font-size:11px;font-weight:600;padding:3px 10px;border-radius:12px;">${statutLabel(statut)}</span>
          </td>
          <td style="padding:12px 8px;font-size:12px;color:#374151;">${d.commercialNom || '<span style="color:#EF4444;">Non assigné</span>'}</td>
          <td style="padding:12px 8px;font-size:12px;">${devisCell}</td>
        </tr>`;
    })
    .join("");

  const tauxTraitement =
    kpis.total > 0 ? Math.round((kpis.traitees / kpis.total) * 100) : 0;

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width"/></head>
<body style="margin:0;padding:0;background:#F5F6F7;font-family:'Inter',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F6F7;">
<tr><td align="center" style="padding:24px 16px;">
<table width="640" cellpadding="0" cellspacing="0" style="max-width:640px;background:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">

  <!-- Header -->
  <tr>
    <td style="background:linear-gradient(135deg,#0E6973,#0A4F57);padding:24px 32px;">
      <h1 style="margin:0;color:#FFFFFF;font-size:20px;font-weight:700;">Récap Hebdomadaire</h1>
      <p style="margin:4px 0 0;color:rgba(255,255,255,0.7);font-size:13px;">${formatDate(dateDebut)} — ${formatDate(dateFin)}</p>
    </td>
  </tr>

  <!-- KPIs -->
  <tr>
    <td style="padding:24px 32px 8px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td width="25%" style="text-align:center;padding:12px;">
            <p style="margin:0;font-size:28px;font-weight:700;color:#0E6973;">${kpis.total}</p>
            <p style="margin:2px 0 0;font-size:11px;color:#6B7280;text-transform:uppercase;">Demandes</p>
          </td>
          <td width="25%" style="text-align:center;padding:12px;">
            <p style="margin:0;font-size:28px;font-weight:700;color:#10B981;">${kpis.traitees}</p>
            <p style="margin:2px 0 0;font-size:11px;color:#6B7280;text-transform:uppercase;">Traitées</p>
          </td>
          <td width="25%" style="text-align:center;padding:12px;">
            <p style="margin:0;font-size:28px;font-weight:700;color:${kpis.enAttente > 0 ? '#EF4444' : '#10B981'};">${kpis.enAttente}</p>
            <p style="margin:2px 0 0;font-size:11px;color:#6B7280;text-transform:uppercase;">En attente</p>
          </td>
          <td width="25%" style="text-align:center;padding:12px;">
            <p style="margin:0;font-size:28px;font-weight:700;color:#0E6973;">${tauxTraitement}%</p>
            <p style="margin:2px 0 0;font-size:11px;color:#6B7280;text-transform:uppercase;">Taux trait.</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  ${kpis.caDevis > 0 ? `
  <tr>
    <td style="padding:0 32px 16px;">
      <div style="background:#F0FDF4;border-radius:8px;padding:12px 16px;text-align:center;">
        <span style="font-size:13px;color:#166534;">CA Devis générés : <strong>${formatEuro(kpis.caDevis)}</strong></span>
      </div>
    </td>
  </tr>` : ""}

  <!-- Table -->
  <tr>
    <td style="padding:0 32px 24px;">
      ${demandes.length === 0 ? `
        <div style="text-align:center;padding:32px 0;">
          <p style="color:#9CA3AF;font-size:14px;">Aucune demande reçue cette semaine</p>
        </div>
      ` : `
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E5E7EB;border-radius:8px;overflow:hidden;">
          <tr style="background:#F9FAFB;">
            <th style="padding:10px 8px;text-align:left;font-size:11px;color:#6B7280;font-weight:600;text-transform:uppercase;">Client</th>
            <th style="padding:10px 8px;text-align:left;font-size:11px;color:#6B7280;font-weight:600;text-transform:uppercase;">Meuble</th>
            <th style="padding:10px 8px;text-align:center;font-size:11px;color:#6B7280;font-weight:600;text-transform:uppercase;">Statut</th>
            <th style="padding:10px 8px;text-align:left;font-size:11px;color:#6B7280;font-weight:600;text-transform:uppercase;">Commercial</th>
            <th style="padding:10px 8px;text-align:left;font-size:11px;color:#6B7280;font-weight:600;text-transform:uppercase;">Devis</th>
          </tr>
          ${demandesRows}
        </table>
      `}
    </td>
  </tr>

  <!-- Footer -->
  <tr>
    <td style="background:#F9FAFB;padding:16px 32px;border-top:1px solid #E5E7EB;">
      <p style="margin:0;font-size:11px;color:#9CA3AF;text-align:center;">
        Email automatique envoyé par KOKPIT chaque lundi matin — <a href="https://kokpit-kappa.vercel.app/leads" style="color:#0E6973;">Voir dans KOKPIT</a>
      </p>
    </td>
  </tr>

</table>
</td></tr></table>
</body></html>`;
}

// ============================================================================
// API
// ============================================================================

async function getRecapData(dateDebut: Date, dateFin: Date) {
  const demandes = await prisma.demandePrix.findMany({
    where: {
      createdAt: { gte: dateDebut, lt: dateFin },
    },
    include: {
      contact: {
        select: {
          nom: true,
          prenom: true,
          email: true,
          telephone: true,
          leads: {
            select: {
              statut: true,
              commercialId: true,
              commercial: { select: { nom: true, prenom: true } },
            },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
          devis: {
            where: { createdAt: { gte: dateDebut } },
            select: { sellsyQuoteId: true, montant: true },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const recapDemandes: DemandeRecap[] = demandes.map((d) => {
    const lead = d.contact.leads[0];
    const devis = d.contact.devis[0];
    return {
      clientNom: d.contact.nom,
      clientPrenom: d.contact.prenom,
      email: d.contact.email,
      telephone: d.contact.telephone,
      meuble: d.meuble,
      leadStatut: lead?.statut || null,
      commercialNom: lead?.commercial
        ? `${lead.commercial.prenom} ${lead.commercial.nom}`
        : null,
      devisRef: devis?.sellsyQuoteId || null,
      devisMontant: devis?.montant || null,
      createdAt: d.createdAt,
    };
  });

  const traitees = recapDemandes.filter(
    (d) => d.leadStatut && !["NOUVEAU"].includes(d.leadStatut)
  ).length;
  const caDevis = recapDemandes.reduce((s, d) => s + (d.devisMontant || 0), 0);

  return {
    demandes: recapDemandes,
    kpis: {
      total: recapDemandes.length,
      traitees,
      enAttente: recapDemandes.length - traitees,
      caDevis,
    },
  };
}

async function sendRecapEmail(html: string, dateDebut: Date, dateFin: Date) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error("BREVO_API_KEY manquante");

  const res = await fetch(`${BREVO_API_URL}/smtp/email`, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: SENDER,
      to: DESTINATAIRES,
      subject: `Récap KOKPIT — Semaine du ${formatDate(dateDebut)}`,
      htmlContent: html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Brevo send error: ${res.status} ${err}`);
  }

  return true;
}

// GET — Preview du récap (sans envoyer)
// POST — Envoyer le récap par email
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  // Semaine dernière : lundi à dimanche
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=dim, 1=lun
  const mondayThisWeek = new Date(now);
  mondayThisWeek.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
  mondayThisWeek.setHours(0, 0, 0, 0);

  const dateDebut = new Date(mondayThisWeek);
  dateDebut.setDate(dateDebut.getDate() - 7);
  const dateFin = new Date(mondayThisWeek);

  const { demandes, kpis } = await getRecapData(dateDebut, dateFin);

  return NextResponse.json({ dateDebut, dateFin, kpis, demandes });
}

export async function POST(req: NextRequest) {
  // Appelable par le cron ou manuellement (ADMIN)
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (authHeader === `Bearer ${cronSecret}`) {
    // Cron call — OK
  } else {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    const role = (session.user as any).role;
    if (!["ADMIN", "DIRECTION", "MARKETING"].includes(role)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }
  }

  try {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayThisWeek = new Date(now);
    mondayThisWeek.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
    mondayThisWeek.setHours(0, 0, 0, 0);

    const dateDebut = new Date(mondayThisWeek);
    dateDebut.setDate(dateDebut.getDate() - 7);
    const dateFin = new Date(mondayThisWeek);

    const { demandes, kpis } = await getRecapData(dateDebut, dateFin);
    const html = buildRecapEmail(demandes, dateDebut, dateFin, kpis);
    await sendRecapEmail(html, dateDebut, dateFin);

    return NextResponse.json({
      success: true,
      message: `Récap envoyé à ${DESTINATAIRES.map(d => d.email).join(", ")}`,
      kpis,
      demandes: demandes.length,
    });
  } catch (error: any) {
    console.error("Recap hebdo error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur envoi récap" },
      { status: 500 }
    );
  }
}
