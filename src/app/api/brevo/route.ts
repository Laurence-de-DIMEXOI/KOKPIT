import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getAccount,
  listTemplates,
  createTemplate,
  updateTemplate,
  getBrevoEditorUrl,
} from "@/lib/brevo";

// GET /api/brevo — Info compte + liste templates Brevo
export async function GET() {
  try {
    const [account, templates] = await Promise.all([
      getAccount(),
      listTemplates(),
    ]);

    return NextResponse.json({
      success: true,
      account: {
        email: account.email,
        company: account.companyName,
        plan: account.plan,
      },
      templates: templates.map((t) => ({
        id: t.id,
        name: t.name,
        subject: t.subject,
        isActive: t.isActive,
        modifiedAt: t.modifiedAt,
        editorUrl: getBrevoEditorUrl(t.id),
      })),
    });
  } catch (error: any) {
    console.error("GET /api/brevo error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/brevo — Sync un template local vers Brevo (push)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { emailTemplateId } = body;

    if (!emailTemplateId) {
      return NextResponse.json({ error: "emailTemplateId requis" }, { status: 400 });
    }

    // Récupérer le template local
    const localTemplate = await (prisma as any).emailTemplate.findUnique({
      where: { id: emailTemplateId },
      include: { workflow: true },
    });

    if (!localTemplate) {
      return NextResponse.json({ error: "Template non trouvé" }, { status: 404 });
    }

    let brevoTemplateId = localTemplate.brevoTemplateId;

    if (brevoTemplateId) {
      // Mettre à jour le template existant sur Brevo
      await updateTemplate(brevoTemplateId, {
        name: localTemplate.nom,
        subject: localTemplate.sujet,
        htmlContent: localTemplate.contenuHtml,
      });
    } else {
      // Créer un nouveau template sur Brevo
      const result = await createTemplate({
        name: `[KOKPIT] ${localTemplate.nom}`,
        subject: localTemplate.sujet,
        htmlContent: localTemplate.contenuHtml,
      });
      brevoTemplateId = result.id;

      // Sauvegarder l'ID Brevo dans notre DB
      await (prisma as any).emailTemplate.update({
        where: { id: emailTemplateId },
        data: { brevoTemplateId },
      });
    }

    return NextResponse.json({
      success: true,
      brevoTemplateId,
      editorUrl: getBrevoEditorUrl(brevoTemplateId),
    });
  } catch (error: any) {
    console.error("POST /api/brevo error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/brevo — Pull un template depuis Brevo vers local
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { emailTemplateId, brevoTemplateId } = body;

    if (!emailTemplateId || !brevoTemplateId) {
      return NextResponse.json(
        { error: "emailTemplateId et brevoTemplateId requis" },
        { status: 400 }
      );
    }

    // Récupérer le template depuis Brevo
    const { getTemplate } = await import("@/lib/brevo");
    const brevoTemplate = await getTemplate(brevoTemplateId);

    // Mettre à jour notre template local avec le contenu Brevo
    const updated = await (prisma as any).emailTemplate.update({
      where: { id: emailTemplateId },
      data: {
        sujet: brevoTemplate.subject,
        contenuHtml: brevoTemplate.htmlContent,
        brevoTemplateId,
      },
    });

    return NextResponse.json({
      success: true,
      template: updated,
    });
  } catch (error: any) {
    console.error("PATCH /api/brevo error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
