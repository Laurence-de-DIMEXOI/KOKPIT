import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadToStorage } from "@/lib/supabase";

type Ligne = { denomination: string; dimensions: string; finitions?: string | null };
type Attachment = { url: string; type: string; filename: string; size?: number };

// GET - List NeedPrice with pagination and filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const statut = searchParams.get("statut");
    const search = searchParams.get("search");
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 20));

    const where: any = {};
    if (statut) where.statut = statut;
    if (search) {
      where.OR = [
        { denomination: { contains: search, mode: "insensitive" } },
        { reference: { contains: search, mode: "insensitive" } },
        { refDevis: { contains: search, mode: "insensitive" } },
        { nomClient: { contains: search, mode: "insensitive" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.needPrice.findMany({
        where,
        include: { createdBy: { select: { nom: true, prenom: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.needPrice.count({ where }),
    ]);

    return NextResponse.json({
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des NeedPrice:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Create a new NeedPrice (multi-lines + multi-attachments)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }

    const formData = await request.formData();
    const refDevis = (formData.get("refDevis") as string | null)?.trim() || "";
    const nomClient = (formData.get("nomClient") as string | null)?.trim() || "";
    const notes = (formData.get("notes") as string | null)?.trim() || "";
    const lignesRaw = formData.get("lignes") as string | null;

    // Validations
    if (!refDevis) {
      return NextResponse.json({ error: "La référence DEPI est obligatoire" }, { status: 400 });
    }
    if (!nomClient) {
      return NextResponse.json({ error: "Le nom du client est obligatoire" }, { status: 400 });
    }
    let lignes: Ligne[] = [];
    try {
      lignes = JSON.parse(lignesRaw || "[]");
    } catch {
      return NextResponse.json({ error: "Format des lignes invalide" }, { status: 400 });
    }
    lignes = lignes
      .map((l) => ({
        denomination: (l.denomination || "").trim(),
        dimensions: (l.dimensions || "").trim(),
        finitions: (l.finitions || "").toString().trim() || null,
      }))
      .filter((l) => l.denomination && l.dimensions);
    if (lignes.length === 0) {
      return NextResponse.json(
        { error: "Au moins un meuble demandé (dénomination + dimensions) est requis" },
        { status: 400 }
      );
    }

    // Upload des fichiers joints (photos + PDF)
    const files = formData.getAll("files") as File[];
    const attachments: Attachment[] = [];
    for (const file of files) {
      if (!file || typeof file === "string" || file.size === 0) continue;
      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const ext = safeName.split(".").pop() || "bin";
        const storagePath = `need-price/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const url = await uploadToStorage(
          "kokpit-media",
          storagePath,
          buffer.buffer,
          file.type || "application/octet-stream"
        );
        attachments.push({ url, type: file.type || "application/octet-stream", filename: file.name, size: file.size });
      } catch (uploadErr) {
        console.error("Upload attachment NeedPrice:", uploadErr);
      }
    }

    // Auto-generate reference: NP-{year}-{number padded to 3}
    const currentYear = new Date().getFullYear();
    const lastNeedPrice = await prisma.needPrice.findFirst({
      where: { reference: { startsWith: `NP-${currentYear}-` } },
      orderBy: { reference: "desc" },
    });
    let nextNumber = 1;
    if (lastNeedPrice) {
      const parts = lastNeedPrice.reference.split("-");
      const lastNumber = parseInt(parts[2], 10);
      if (!isNaN(lastNumber)) nextNumber = lastNumber + 1;
    }
    const reference = `NP-${currentYear}-${String(nextNumber).padStart(3, "0")}`;

    // Back-compat : la première ligne alimente denomination/dimensions/finitions
    const firstLine = lignes[0];
    const firstImageAttachment = attachments.find((a) => a.type.startsWith("image/"));

    const needPrice = await prisma.needPrice.create({
      data: {
        reference,
        refDevis,
        nomClient,
        denomination: firstLine.denomination,
        dimensions: firstLine.dimensions,
        finitions: firstLine.finitions || null,
        photoUrl: firstImageAttachment?.url || null,
        lignes: lignes as any,
        attachments: attachments as any,
        notes: notes || null,
        createdById: session.user.id,
      },
      include: { createdBy: { select: { nom: true, prenom: true } } },
    });

    // ─── Notification email (Brevo) ──────────────────────────────────────────
    try {
      const creatorName = `${needPrice.createdBy.prenom} ${needPrice.createdBy.nom}`;
      const subject = `Need Price ${refDevis} — ${nomClient}`;

      const linesHtml = lignes
        .map(
          (l, i) => `
          <tr>
            <td style="padding:8px 12px;font-size:12px;color:#6B7280;border-top:1px solid #F3F4F6;">#${i + 1}</td>
            <td style="padding:8px 12px;font-size:13px;color:#1F2937;font-weight:600;border-top:1px solid #F3F4F6;">${escapeHtml(l.denomination)}</td>
            <td style="padding:8px 12px;font-size:13px;color:#374151;border-top:1px solid #F3F4F6;">${escapeHtml(l.dimensions)}</td>
            <td style="padding:8px 12px;font-size:13px;color:#374151;border-top:1px solid #F3F4F6;">${escapeHtml(l.finitions || "—")}</td>
          </tr>`
        )
        .join("");

      const attachmentsHtml = attachments.length
        ? `<p style="margin:16px 0 6px;font-size:13px;color:#374151;font-weight:600;">Pièces jointes (${attachments.length}) :</p>
           <ul style="margin:0;padding:0 0 0 20px;font-size:12px;color:#374151;">
             ${attachments
               .map((a) => `<li style="margin:4px 0;"><a href="${a.url}" style="color:#7C3AED;">${escapeHtml(a.filename)}</a> <span style="color:#9CA3AF;">(${a.type})</span></li>`)
               .join("")}
           </ul>`
        : "";

      const htmlContent = `<!DOCTYPE html><html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#F5F6F7;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F6F7;"><tr><td align="center" style="padding:24px 16px;">
<table width="640" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
  <tr><td style="background:linear-gradient(135deg,#CBA1D4,#FEEB9C);padding:22px 28px;">
    <h1 style="margin:0;color:#1F2937;font-size:17px;font-weight:700;">📦 ${escapeHtml(subject)}</h1>
    <p style="margin:4px 0 0;color:#1F2937;font-size:13px;">Réf KOKPIT : ${reference} · Demandé par ${escapeHtml(creatorName)}</p>
  </td></tr>
  <tr><td style="padding:20px 28px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E5E7EB;border-radius:8px;overflow:hidden;">
      <tr style="background:#F9FAFB;">
        <td style="padding:10px 12px;font-size:11px;color:#6B7280;font-weight:700;text-transform:uppercase;width:40px;">#</td>
        <td style="padding:10px 12px;font-size:11px;color:#6B7280;font-weight:700;text-transform:uppercase;">Furniture</td>
        <td style="padding:10px 12px;font-size:11px;color:#6B7280;font-weight:700;text-transform:uppercase;">Dimensions</td>
        <td style="padding:10px 12px;font-size:11px;color:#6B7280;font-weight:700;text-transform:uppercase;">Finitions</td>
      </tr>
      ${linesHtml}
    </table>
    ${notes ? `<p style="margin:16px 0 6px;font-size:13px;color:#374151;font-weight:600;">Notes :</p><pre style="margin:0;font-family:Arial,sans-serif;font-size:13px;color:#374151;white-space:pre-wrap;">${escapeHtml(notes)}</pre>` : ""}
    ${attachmentsHtml}
    <p style="margin:24px 0 0;font-size:11px;color:#9CA3AF;text-align:center;">KOKPIT — <a href="https://kokpit-kappa.vercel.app/achat/need-price" style="color:#7C3AED;">Voir la demande</a></p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;

      // Joindre uniquement les images en base64 (les PDF peuvent être lourds → lien uniquement)
      const attachmentPayload: Array<{ content: string; name: string }> = [];
      for (const file of files) {
        if (!file || typeof file === "string" || file.size === 0) continue;
        if (!file.type.startsWith("image/")) continue;
        if (file.size > 4 * 1024 * 1024) continue; // skip images > 4 MB
        try {
          const buf = Buffer.from(await file.arrayBuffer());
          attachmentPayload.push({ content: buf.toString("base64"), name: file.name });
        } catch {}
      }

      const emailPayload: any = {
        sender: { name: "KOKPIT", email: "laurence.payet@dimexoi.fr" },
        to: [{ email: "dimexoi.depi@gmail.com" }],
        subject,
        htmlContent,
      };
      if (attachmentPayload.length > 0) emailPayload.attachment = attachmentPayload;

      await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          "api-key": process.env.BREVO_API_KEY!,
        },
        body: JSON.stringify(emailPayload),
      });
    } catch (emailError) {
      console.error("Erreur lors de l'envoi de l'email Brevo:", emailError);
    }

    return NextResponse.json(needPrice, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de la création du NeedPrice:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
