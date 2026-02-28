import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const statsFilterSchema = z.object({
  vue: z.enum(["marketing", "commercial", "direction"]).optional(),
});

// Helper function: Get first day of current month
function getFirstDayOfMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

// Helper function: Get first day of current year
function getFirstDayOfYear(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), 0, 1);
}

// Helper function: Format date for display
function getDateWithinMonthRange(daysAgo: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date;
}

// GET - Return dashboard statistics based on role
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const vueParam = searchParams.get("vue") as "marketing" | "commercial" | "direction" | null;

    // Determine which view to show based on role if vue not specified
    let vue = vueParam || session.user.role.toLowerCase();
    if (vue === "admin") vue = "direction"; // Admin sees direction view

    const monthStart = getFirstDayOfMonth();
    const yearStart = getFirstDayOfYear();

    // MARKETING VIEW
    if (vue === "marketing") {
      const leads = await prisma.lead.findMany({
        where: {
          createdAt: {
            gte: monthStart,
          },
        },
        include: {
          contact: true,
          campagne: true,
          devis: true,
        },
      });

      const leadsTotal = leads.length;

      // Group leads by source
      const leadsBySource = await prisma.lead.groupBy({
        by: ["source"],
        where: {
          createdAt: {
            gte: monthStart,
          },
        },
        _count: {
          id: true,
        },
      });

      // Calculate taux lead to devis
      const leadsWithDevis = leads.filter((l) => l.devis.length > 0).length;
      const tauxLeadDevis = leadsTotal > 0 ? ((leadsWithDevis / leadsTotal) * 100).toFixed(2) : "0.00";

      // Calculate taux devis to vente
      const allDevis = await prisma.devis.findMany({
        where: {
          lead: {
            createdAt: {
              gte: monthStart,
            },
          },
        },
      });

      const devisAcceptes = allDevis.filter((d) => d.statut === "ACCEPTE").length;
      const tauxDevisVente = allDevis.length > 0 ? ((devisAcceptes / allDevis.length) * 100).toFixed(2) : "0.00";

      // Calculate CPL (Cost Per Lead)
      const campagnes = await prisma.campagne.findMany({
        where: {
          leads: {
            some: {
              createdAt: {
                gte: monthStart,
              },
            },
          },
        },
        include: {
          coutsOffline: true,
          leads: {
            where: {
              createdAt: {
                gte: monthStart,
              },
            },
          },
        },
      });

      let totalCost = 0;
      for (const camp of campagnes) {
        totalCost += camp.coutTotal;
        totalCost += camp.coutsOffline.reduce((sum, c) => sum + c.montant, 0);
      }

      const cplMoyen = leadsTotal > 0 ? (totalCost / leadsTotal).toFixed(2) : "0.00";

      // Get leads trend (last 30 days)
      const leadsTrend: Array<{ date: string; count: number }> = [];
      for (let i = 29; i >= 0; i--) {
        const date = getDateWithinMonthRange(i);
        const dateStr = date.toISOString().split("T")[0];

        const count = leads.filter((l) => {
          const leadDate = l.createdAt.toISOString().split("T")[0];
          return leadDate === dateStr;
        }).length;

        leadsTrend.push({ date: dateStr, count });
      }

      // Get top 5 campaigns by lead count
      const topCampagnes = await prisma.campagne.findMany({
        where: {
          leads: {
            some: {
              createdAt: {
                gte: monthStart,
              },
            },
          },
        },
        include: {
          leads: {
            where: {
              createdAt: {
                gte: monthStart,
              },
            },
          },
        },
        orderBy: {
          leads: {
            _count: "desc",
          },
        },
        take: 5,
      });

      return NextResponse.json({
        vue: "marketing",
        leadsTotal,
        leadsBySource: leadsBySource.map((s) => ({
          source: s.source,
          count: s._count.id,
        })),
        tauxLeadDevis,
        tauxDevisVente,
        cplMoyen,
        leadsTrend,
        topCampagnes: topCampagnes.map((c) => ({
          id: c.id,
          nom: c.nom,
          leadCount: c.leads.length,
        })),
      });
    }

    // COMMERCIAL VIEW
    if (vue === "commercial") {
      // Get user's showroom if not admin
      const userShowroomId = session.user.showroomId;

      // Count leads to process (NOUVEAU status)
      const leadsATraiter = await prisma.lead.count({
        where: {
          statut: "NOUVEAU",
          ...(userShowroomId && { showroomId: userShowroomId }),
        },
      });

      // Count SLA in progress (not exceeded, no action yet)
      const now = new Date();
      const slaEnCours = await prisma.lead.count({
        where: {
          slaDeadline: {
            gt: now,
          },
          premiereActionAt: {
            not: null,
          },
          ...(userShowroomId && { showroomId: userShowroomId }),
        },
      });

      // Count SLA exceeded
      const slaDepasses = await prisma.lead.count({
        where: {
          slaDeadline: {
            lt: now,
          },
          premiereActionAt: null,
          ...(userShowroomId && { showroomId: userShowroomId }),
        },
      });

      // Count devis in progress
      const devisEnAttente = await prisma.devis.count({
        where: {
          statut: {
            in: ["EN_ATTENTE", "ENVOYE"],
          },
          lead: {
            ...(userShowroomId && { showroomId: userShowroomId }),
          },
        },
      });

      // Pipeline: leads by status with count and total montant
      const pipeline = await prisma.lead.groupBy({
        by: ["statut"],
        where: {
          ...(userShowroomId && { showroomId: userShowroomId }),
        },
        _count: {
          id: true,
        },
      });

      // Calculate montant for each pipeline stage
      const pipelineWithMontant = await Promise.all(
        pipeline.map(async (stage) => {
          const leads = await prisma.lead.findMany({
            where: {
              statut: stage.statut,
              ...(userShowroomId && { showroomId: userShowroomId }),
            },
            include: {
              devis: {
                include: {
                  vente: true,
                },
              },
            },
          });

          const totalMontant = leads
            .flatMap((l) => l.devis)
            .reduce((sum, d) => sum + (d.vente?.montant || d.montant), 0);

          return {
            statut: stage.statut,
            count: stage._count.id,
            totalMontant,
          };
        })
      );

      // Recent leads for this commercial
      const leadsRecents = await prisma.lead.findMany({
        where: {
          commercialId: session.user.id,
        },
        include: {
          contact: true,
          showroom: true,
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      });

      return NextResponse.json({
        vue: "commercial",
        leadsATraiter,
        slaEnCours,
        slaDepasses,
        devisEnAttente,
        pipeline: pipelineWithMontant,
        leadsRecents,
      });
    }

    // DIRECTION VIEW
    if (vue === "direction") {
      // Get total CA this month
      const ventes = await prisma.vente.findMany({
        where: {
          dateVente: {
            gte: monthStart,
          },
        },
        include: {
          devis: {
            include: {
              lead: {
                include: {
                  campagne: true,
                },
              },
            },
          },
        },
      });

      const caTotal = ventes.reduce((sum, v) => sum + v.montant, 0);

      // CA by campaign
      const caParCampagne = await prisma.campagne.findMany({
        include: {
          leads: {
            include: {
              devis: {
                include: {
                  vente: true,
                },
              },
            },
          },
          coutsOffline: true,
        },
      });

      const caParCampagneData = caParCampagne.map((c) => {
        const ca = c.leads
          .flatMap((l) => l.devis)
          .reduce((sum, d) => sum + (d.vente?.montant || 0), 0);

        return {
          campagneId: c.id,
          campagneNom: c.nom,
          ca,
        };
      });

      // Calculate global ROI
      let totalCosts = 0;
      for (const camp of caParCampagne) {
        totalCosts += camp.coutTotal;
        totalCosts += camp.coutsOffline.reduce((sum, c) => sum + c.montant, 0);
      }

      const roiGlobal = totalCosts > 0 ? (((caTotal - totalCosts) / totalCosts) * 100).toFixed(2) : "0.00";

      // Comparison by showroom
      const showrooms = await prisma.showroom.findMany({
        include: {
          leads: true,
        },
      });

      const comparaisonShowrooms = await Promise.all(
        showrooms.map(async (s) => {
          const devisCount = await prisma.devis.count({
            where: {
              lead: {
                showroomId: s.id,
              },
            },
          });

          const venteCount = await prisma.vente.count({
            where: {
              devis: {
                lead: {
                  showroomId: s.id,
                },
              },
            },
          });

          const showroomVentes = ventes.filter((v) => v.devis?.lead?.showroomId === s.id);
          const showroomCa = showroomVentes.reduce((sum, v) => sum + v.montant, 0);

          return {
            showroomId: s.id,
            showroomNom: s.nom,
            leadsCount: s.leads.length,
            devisCount,
            venteCount,
            ca: showroomCa,
          };
        })
      );

      // CA trend (last 12 months)
      const caTrend: Array<{ month: string; ca: number }> = [];
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);

        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        const monthVentes = await prisma.vente.findMany({
          where: {
            dateVente: {
              gte: monthStart,
              lte: monthEnd,
            },
          },
        });

        const monthCa = monthVentes.reduce((sum, v) => sum + v.montant, 0);
        const monthStr = date.toLocaleString("fr-FR", { month: "short", year: "2-digit" });

        caTrend.push({ month: monthStr, ca: monthCa });
      }

      // CAC Global (Customer Acquisition Cost)
      const totalVenteCount = await prisma.vente.count();
      const cacGlobal = totalVenteCount > 0 ? (totalCosts / totalVenteCount).toFixed(2) : "0.00";

      return NextResponse.json({
        vue: "direction",
        caTotal,
        caParCampagne: caParCampagneData,
        roiGlobal,
        comparaisonShowrooms,
        caTrend,
        cacGlobal,
      });
    }

    return NextResponse.json({ error: "Vue invalide" }, { status: 400 });
  } catch (error) {
    console.error("Erreur lors de la récupération des stats:", error);
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
