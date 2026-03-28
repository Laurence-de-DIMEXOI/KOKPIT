import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import {
  searchEstimates,
  listOrders,
  searchIndividuals,
} from "@/lib/sellsy";
import {
  syncClubCommandes,
  syncClubTags,
  syncClubEmails,
  syncClubBrevo,
} from "@/lib/club-sync";
import { sendEmail } from "@/lib/resend";

const cronSchema = z.object({
  job: z.enum(["sla-check", "relance", "cross-sell", "sync-sellsy", "sync-club"]),
});

// POST - Execute scheduled jobs
export async function POST(request: NextRequest) {
  try {
    // Verify API secret from header
    const authHeader = request.headers.get("authorization");
    const apiSecret = process.env.CRON_API_SECRET;

    if (!apiSecret) {
      console.warn("CRON_API_SECRET not configured");
      return NextResponse.json(
        { error: "Service non configuré" },
        { status: 500 }
      );
    }

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7);
    if (token !== apiSecret) {
      return NextResponse.json(
        { error: "Token invalide" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const jobParam = searchParams.get("job");

    if (!jobParam) {
      return NextResponse.json(
        { error: "Paramètre job requis" },
        { status: 400 }
      );
    }

    const { job } = cronSchema.parse({ job: jobParam });

    // Execute job
    switch (job) {
      case "sla-check":
        return await slaCheck();
      case "relance":
        return await relanceJob();
      case "cross-sell":
        return await crossSellJob();
      case "sync-sellsy":
        return await syncSellsyJob();
      case "sync-club":
        return await syncClubJob();
      default:
        return NextResponse.json(
          { error: "Job invalide" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Erreur lors de l'exécution du cron:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Paramètres invalides", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// SLA Check: Find leads past deadline without action
async function slaCheck() {
  try {
    const now = new Date();

    // Find leads past SLA deadline without first action
    const slaExceeded = await prisma.lead.findMany({
      where: {
        slaDeadline: {
          lt: now,
        },
        premiereActionAt: null,
      },
      include: {
        contact: true,
        showroom: true,
        commercial: { select: { id: true, prenom: true, nom: true, email: true } },
      },
    });

    // Create alerts for each exceeded SLA
    const alertCount = slaExceeded.length;

    for (const lead of slaExceeded) {
      // Create alert event
      await prisma.evenement.create({
        data: {
          leadId: lead.id,
          contactId: lead.contactId,
          type: "NOTE",
          description: `SLA dépassé - Aucune action depuis ${Math.floor(
            (now.getTime() - lead.slaDeadline.getTime()) / (1000 * 60 * 60)
          )} heures`,
          metadata: {
            alertType: "SLA_EXCEEDED",
            slaDeadline: lead.slaDeadline,
            hoursOverdue: Math.floor(
              (now.getTime() - lead.slaDeadline.getTime()) / (1000 * 60 * 60)
            ),
          },
        },
      });

      // Auto-tâche pour le commercial assigné
      if (lead.commercial?.id) {
        const clientNom = lead.contact
          ? `${lead.contact.prenom || ""} ${lead.contact.nom}`.trim()
          : "Client inconnu";
        const heuresRetard = Math.floor(
          (now.getTime() - lead.slaDeadline.getTime()) / (1000 * 60 * 60)
        );

        // Vérifier qu'une tâche de relance n'existe pas déjà pour ce lead
        const existingTask = await prisma.task.findFirst({
          where: {
            assigneAId: lead.commercial.id,
            titre: { contains: clientNom },
            statut: { not: "TERMINEE" },
          },
        });

        if (!existingTask) {
          await prisma.task.create({
            data: {
              titre: `Relancer ${clientNom}`,
              description: `SLA dépassé de ${heuresRetard}h — demande sans réponse. Contacter le client en priorité.`,
              assigneAId: lead.commercial.id,
              createdById: lead.commercial.id,
              echeance: new Date(),
            },
          });

          // Email au commercial — une seule fois (guard = pas de tâche existante)
          if (lead.commercial.email) {
            await sendEmail({
              to: lead.commercial.email,
              subject: `Relance SLA — ${clientNom}`,
              html: `
                <p>Bonjour ${lead.commercial.prenom},</p>
                <p>La demande de <strong>${clientNom}</strong> n'a reçu aucune réponse depuis <strong>${heuresRetard}h</strong> (SLA dépassé).</p>
                <p>Une tâche de relance a été créée dans <a href="https://kokpit.dimexoi.fr/leads">KOKPIT</a>.</p>
              `,
            });
          }
        }
      }
    }

    return NextResponse.json({
      job: "sla-check",
      status: "completed",
      alertCount,
      message: `${alertCount} SLA dépassés détectés`,
    });
  } catch (error) {
    console.error("Erreur lors du SLA check:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'exécution du SLA check" },
      { status: 500 }
    );
  }
}

// Relance: Find inactive leads (7+ days) and trigger workflow
async function relanceJob() {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Find leads inactive for 7+ days
    const inactiveLeads = await prisma.lead.findMany({
      where: {
        statut: {
          in: ["NOUVEAU", "EN_COURS"],
        },
        createdAt: {
          lt: sevenDaysAgo,
        },
        evenements: {
          none: {
            createdAt: {
              gte: sevenDaysAgo,
            },
          },
        },
      },
      include: {
        contact: true,
        commercial: true,
      },
    });

    // Create relance event for each inactive lead
    const relanceCount = inactiveLeads.length;

    for (const lead of inactiveLeads) {
      // Create relance event
      await prisma.evenement.create({
        data: {
          leadId: lead.id,
          contactId: lead.contactId,
          type: "RELANCE",
          description: "Lead inactif depuis 7 jours - Relance automatique",
          metadata: {
            lastActivityDays: 7,
            triggerType: "LEAD_INACTIF",
          },
        },
      });

      // Trigger relance workflow if exists
      // In production, query for LEAD_INACTIF workflows and execute them
      console.log(`Relance programmée pour lead ${lead.id}`);
    }

    return NextResponse.json({
      job: "relance",
      status: "completed",
      relanceCount,
      message: `${relanceCount} leads inactifs mis en relance`,
    });
  } catch (error) {
    console.error("Erreur lors de la relance:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'exécution de la relance" },
      { status: 500 }
    );
  }
}

// Cross-sell: Find recent sales (2 days ago) and trigger workflow
async function crossSellJob() {
  try {
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    // Find ventes created 2-3 days ago
    const recentSales = await prisma.vente.findMany({
      where: {
        dateVente: {
          gte: threeDaysAgo,
          lte: twoDaysAgo,
        },
      },
      include: {
        contact: true,
        devis: {
          include: {
            lead: true,
          },
        },
      },
    });

    const crossSellCount = recentSales.length;

    for (const vente of recentSales) {
      // Create cross-sell event
      await prisma.evenement.create({
        data: {
          contactId: vente.contactId,
          leadId: vente.devis?.lead?.id,
          type: "VENTE",
          description: `Cross-sell trigger - Vente ${vente.montant}€ réalisée il y a 2 jours`,
          metadata: {
            triggerType: "POST_ACHAT",
            venteId: vente.id,
            montant: vente.montant,
          },
        },
      });

      // Trigger cross-sell workflow if exists
      // In production, query for POST_ACHAT workflows and execute them
      console.log(`Cross-sell programmée pour contact ${vente.contactId}`);
    }

    return NextResponse.json({
      job: "cross-sell",
      status: "completed",
      crossSellCount,
      message: `${crossSellCount} cross-sell programmées`,
    });
  } catch (error) {
    console.error("Erreur lors du cross-sell:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'exécution du cross-sell" },
      { status: 500 }
    );
  }
}

// Sync Sellsy: Pre-link contacts + import devis/BDC + update lead statuses
async function syncSellsyJob() {
  try {
    // ── ÉTAPE 0 : Pré-lier les contacts sans sellsyContactId ──
    const unlinkeds = await prisma.contact.findMany({
      where: {
        sellsyContactId: null,
        leads: { some: { statut: { in: ["NOUVEAU", "EN_COURS"] } } },
      },
      select: { id: true, email: true },
    });

    let linked = 0;
    for (const c of unlinkeds) {
      if (!c.email) continue;
      try {
        const res = await searchIndividuals({ email: c.email.toLowerCase().trim() });
        const match = res.data?.[0];
        if (match) {
          await prisma.contact.update({
            where: { id: c.id },
            data: { sellsyContactId: String(match.id) },
          });
          linked++;
        }
      } catch { /* Skip rate limit */ }
    }

    // ── ÉTAPE 1 : Micro-refresh devis + BDC (14 derniers jours) ──
    const since14j = new Date();
    since14j.setDate(since14j.getDate() - 14);
    const sinceStr = since14j.toISOString().split("T")[0];

    let freshDevis = 0;
    let freshVentes = 0;

    // Map sellsyContactId → kokpitContactId
    const contactsBySellsyId = new Map<string, string>();
    const kokpitContacts = await prisma.contact.findMany({
      select: { id: true, sellsyContactId: true },
    });
    for (const c of kokpitContacts) {
      if (c.sellsyContactId) {
        for (const sid of c.sellsyContactId.split(",")) {
          contactsBySellsyId.set(sid.trim(), c.id);
        }
      }
    }

    // Fetch recent estimates
    try {
      const estRes = await searchEstimates({
        filters: { date: { start: sinceStr } },
        limit: 100, offset: 0, order: "created", direction: "desc",
      });
      for (const est of estRes.data || []) {
        const relatedIds = (est.related || []).map((r) => String(r.id));
        const kokpitContactId =
          relatedIds.map((rid) => contactsBySellsyId.get(rid)).find(Boolean) ||
          (est.contact_id ? contactsBySellsyId.get(String(est.contact_id)) : undefined);
        if (!kokpitContactId) continue;
        try {
          await prisma.devis.upsert({
            where: { sellsyQuoteId: String(est.id) },
            update: {
              statut: mapEstimateStatus(est.status),
              montant: Number(est.amounts?.total_excl_tax) || 0,
              numero: est.number || undefined,
              dateEnvoi: est.status === "sent" ? new Date(est.date) : undefined,
            },
            create: {
              contactId: kokpitContactId,
              sellsyQuoteId: String(est.id),
              numero: est.number || null,
              montant: Number(est.amounts?.total_excl_tax) || 0,
              statut: mapEstimateStatus(est.status),
              dateEnvoi: est.status === "sent" ? new Date(est.date) : undefined,
            },
          });
          freshDevis++;
        } catch { /* ignore */ }
      }
    } catch (err) {
      console.warn("Cron sync-sellsy: estimates skipped:", err);
    }

    // Fetch recent orders
    try {
      const ordRes = await listOrders({
        limit: 100, offset: 0, order: "created", direction: "desc",
      });
      const recentOrders = (ordRes.data || []).filter(
        (o) => new Date(o.created) >= since14j
      );
      for (const ord of recentOrders) {
        const relatedIds = (ord.related || []).map((r) => String(r.id));
        const kokpitContactId =
          relatedIds.map((rid) => contactsBySellsyId.get(rid)).find(Boolean) ||
          (ord.contact_id ? contactsBySellsyId.get(String(ord.contact_id)) : undefined);
        if (!kokpitContactId) continue;
        try {
          await prisma.vente.upsert({
            where: { sellsyInvoiceId: String(ord.id) },
            update: { montant: Number(ord.amounts?.total_excl_tax) || 0 },
            create: {
              contactId: kokpitContactId,
              sellsyInvoiceId: String(ord.id),
              montant: Number(ord.amounts?.total_excl_tax) || 0,
              dateVente: new Date(ord.date || ord.created),
            },
          });
          freshVentes++;
        } catch { /* ignore */ }
      }
    } catch (err) {
      console.warn("Cron sync-sellsy: orders skipped:", err);
    }

    // ── ÉTAPE 2 : Vérifier statuts leads ──
    const demandes = await prisma.demandePrix.findMany({
      where: {
        contact: {
          leads: { some: { statut: { in: ["NOUVEAU", "EN_COURS", "DEVIS", "VENTE"] } } },
        },
      },
      select: {
        id: true, contactId: true, createdAt: true,
        contact: {
          select: {
            leads: {
              where: { statut: { in: ["NOUVEAU", "EN_COURS", "DEVIS", "VENTE"] } },
              orderBy: { createdAt: "desc" as const },
              take: 1,
              select: { id: true, statut: true },
            },
            devis: { select: { id: true, createdAt: true }, orderBy: { createdAt: "desc" as const } },
            ventes: { select: { id: true, createdAt: true }, orderBy: { createdAt: "desc" as const } },
          },
        },
      },
    });

    let statusUpdates = 0;
    for (const demande of demandes) {
      const lead = demande.contact.leads[0];
      if (!lead) continue;
      const demandeTs = demande.createdAt.getTime();
      const recentVente = demande.contact.ventes.find((v) => v.createdAt.getTime() >= demandeTs);
      const recentDevis = demande.contact.devis.find((d) => d.createdAt.getTime() >= demandeTs);
      const correctStatut = recentVente ? "VENTE" : recentDevis ? "DEVIS" : lead.statut;
      if (lead.statut !== correctStatut) {
        await prisma.lead.update({ where: { id: lead.id }, data: { statut: correctStatut } });
        statusUpdates++;
      }
    }

    console.log(`Cron sync-sellsy: ${linked} linked, ${freshDevis} devis, ${freshVentes} ventes, ${statusUpdates} statuts mis à jour`);

    return NextResponse.json({
      job: "sync-sellsy",
      status: "completed",
      message: `Sync terminée: ${freshDevis} devis, ${freshVentes} ventes importés, ${statusUpdates} statuts corrigés`,
      details: { linked, freshDevis, freshVentes, statusUpdates, since: sinceStr },
    });
  } catch (error) {
    console.error("Cron sync-sellsy error:", error);
    return NextResponse.json(
      { error: "Erreur lors du sync-sellsy" },
      { status: 500 }
    );
  }
}

function mapEstimateStatus(
  status: string
): "EN_ATTENTE" | "ENVOYE" | "ACCEPTE" | "REFUSE" | "EXPIRE" {
  const statusMap: Record<string, "EN_ATTENTE" | "ENVOYE" | "ACCEPTE" | "REFUSE" | "EXPIRE"> = {
    draft: "EN_ATTENTE", sent: "ENVOYE", read: "ENVOYE",
    accepted: "ACCEPTE", refused: "REFUSE", expired: "EXPIRE",
    cancelled: "REFUSE", invoiced: "ACCEPTE", partialinvoiced: "ACCEPTE", advanced: "ACCEPTE",
  };
  return statusMap[status?.toLowerCase()] || "EN_ATTENTE";
}

// Sync Club Tectona: commandes → tags → emails → Brevo
async function syncClubJob() {
  try {
    console.log("[Cron sync-club] Debut sync Club Tectona…");

    // Etape 1 : Commandes
    const commandes = await syncClubCommandes();
    console.log(`[Cron sync-club] Commandes: ${commandes.synced} sync, ${commandes.nouveaux} nouveaux, ${commandes.upgraded} upgrades`);

    // Etape 2 : Tags Sellsy — boucle jusqu'a remaining=0
    let totalTagsSynced = 0;
    let totalTagsErrors = 0;
    let tagsResult = await syncClubTags();
    totalTagsSynced += tagsResult.synced;
    totalTagsErrors += tagsResult.errors;
    while (tagsResult.remaining > 0) {
      tagsResult = await syncClubTags();
      totalTagsSynced += tagsResult.synced;
      totalTagsErrors += tagsResult.errors;
    }
    console.log(`[Cron sync-club] Tags: ${totalTagsSynced} sync, ${totalTagsErrors} erreurs`);

    // Etape 3 : Emails — boucle jusqu'a remaining=0
    let totalEmailsFetched = 0;
    let totalEmailsErrors = 0;
    let emailsResult = await syncClubEmails();
    totalEmailsFetched += emailsResult.fetched;
    totalEmailsErrors += (emailsResult.errors ?? 0);
    while (emailsResult.remaining > 0) {
      emailsResult = await syncClubEmails();
      totalEmailsFetched += emailsResult.fetched;
      totalEmailsErrors += (emailsResult.errors ?? 0);
    }
    console.log(`[Cron sync-club] Emails: ${totalEmailsFetched} recuperes, ${totalEmailsErrors} erreurs`);

    // Etape 4 : Brevo
    const brevo = await syncClubBrevo();
    console.log(`[Cron sync-club] Brevo: ${brevo.synced} sync, ${brevo.errors} erreurs`);

    console.log("[Cron sync-club] Sync Club Tectona terminee");

    return NextResponse.json({
      job: "sync-club",
      status: "completed",
      message: `Club sync terminee: ${commandes.synced} membres, ${totalTagsSynced} tags, ${totalEmailsFetched} emails, ${brevo.synced} Brevo`,
      details: {
        commandes,
        tags: { synced: totalTagsSynced, errors: totalTagsErrors },
        emails: { fetched: totalEmailsFetched, errors: totalEmailsErrors },
        brevo,
      },
    });
  } catch (error) {
    console.error("Cron sync-club error:", error);
    return NextResponse.json(
      { error: "Erreur lors du sync-club" },
      { status: 500 }
    );
  }
}

// GET - Vercel Cron handler (Vercel appelle en GET) + health check
export async function GET(request: NextRequest) {
  const jobParam = request.nextUrl.searchParams.get("job");

  // Si pas de job → health check
  if (!jobParam) {
    return NextResponse.json({
      status: "ok",
      availableJobs: ["sla-check", "relance", "cross-sell", "sync-sellsy", "sync-club"],
      message: "Cron endpoint is ready. Use GET/POST with job parameter.",
    });
  }

  // Auth check (Vercel Cron envoie CRON_SECRET)
  const cronSecret = process.env.CRON_SECRET || process.env.CRON_API_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
  }

  try {
    const { job } = cronSchema.parse({ job: jobParam });
    switch (job) {
      case "sla-check": return await slaCheck();
      case "relance": return await relanceJob();
      case "cross-sell": return await crossSellJob();
      case "sync-sellsy": return await syncSellsyJob();
      case "sync-club": return await syncClubJob();
      default: return NextResponse.json({ error: "Job invalide" }, { status: 400 });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Job invalide", details: error.errors }, { status: 400 });
    }
    console.error("Cron GET error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
