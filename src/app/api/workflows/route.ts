import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/workflows — Liste des workflows avec templates et stats
export async function GET() {
  try {
    const workflows = await prisma.workflow.findMany({
      include: {
        emailTemplate: true,
        _count: {
          select: { executions: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Stats d'exécution pour chaque workflow (30 derniers jours)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const execStats = await prisma.workflowExecution.groupBy({
      by: ["workflowId", "statut"],
      where: { createdAt: { gte: thirtyDaysAgo } },
      _count: true,
    });

    // Dernière exécution par workflow
    const lastExecs = await prisma.workflowExecution.findMany({
      where: { workflowId: { in: workflows.map((w) => w.id) } },
      orderBy: { createdAt: "desc" },
      distinct: ["workflowId"],
      select: { workflowId: true, createdAt: true, statut: true },
    });

    // Global KPIs
    const totalExecs30d = await prisma.workflowExecution.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    });
    const successExecs30d = await prisma.workflowExecution.count({
      where: { createdAt: { gte: thirtyDaysAgo }, statut: "SUCCESS" },
    });

    const enriched = workflows.map((w) => {
      const stats = execStats.filter((s) => s.workflowId === w.id);
      const success = stats.find((s) => s.statut === "SUCCESS")?._count || 0;
      const error = stats.find((s) => s.statut === "ERROR")?._count || 0;
      const lastExec = lastExecs.find((e) => e.workflowId === w.id);

      return {
        ...w,
        stats: {
          executions30d: success + error,
          success30d: success,
          error30d: error,
          lastExecutedAt: lastExec?.createdAt || null,
          lastStatus: lastExec?.statut || null,
        },
      };
    });

    return NextResponse.json({
      success: true,
      workflows: enriched,
      kpis: {
        total: workflows.length,
        actifs: workflows.filter((w) => w.enabled).length,
        executions30d: totalExecs30d,
        tauxReussite: totalExecs30d > 0 ? Math.round((successExecs30d / totalExecs30d) * 100) : 100,
      },
    });
  } catch (error: any) {
    console.error("GET /api/workflows error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/workflows — Toggle enabled ou update workflow
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, enabled, nom, description, delaiMinutes } = body;

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    const updateData: any = {};
    if (typeof enabled === "boolean") updateData.enabled = enabled;
    if (nom) updateData.nom = nom;
    if (description !== undefined) updateData.description = description;
    if (typeof delaiMinutes === "number") updateData.delaiMinutes = delaiMinutes;

    const workflow = await prisma.workflow.update({
      where: { id },
      data: updateData,
      include: { emailTemplate: true },
    });

    return NextResponse.json({ success: true, workflow });
  } catch (error: any) {
    console.error("PATCH /api/workflows error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
