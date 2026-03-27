import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadToStorage } from "@/lib/supabase";

// GET - List NeedPrice with pagination and filters
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
    const statut = searchParams.get("statut");
    const search = searchParams.get("search");
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 20));

    // Build where clause
    const where: any = {};

    if (statut) {
      where.statut = statut;
    }

    if (search) {
      where.OR = [
        { denomination: { contains: search, mode: "insensitive" } },
        { reference: { contains: search, mode: "insensitive" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.needPrice.findMany({
        where,
        include: {
          createdBy: {
            select: { nom: true, prenom: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.needPrice.count({ where }),
    ]);

    return NextResponse.json({
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des NeedPrice:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// POST - Create a new NeedPrice
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const refDevis = formData.get("refDevis") as string || null;
    const nomClient = formData.get("nomClient") as string || null;
    const denomination = formData.get("denomination") as string;
    const dimensions = formData.get("dimensions") as string;
    const finitions = formData.get("finitions") as string || null;
    const notes = formData.get("notes") as string || null;
    const photoFile = formData.get("photo") as File | null;

    // Uploader la photo sur Supabase Storage + base64 pour email
    let photoBase64: string | null = null;
    let photoName: string | null = null;
    let photoPublicUrl: string | null = null;
    if (photoFile && photoFile.size > 0) {
      const buffer = Buffer.from(await photoFile.arrayBuffer());
      photoBase64 = buffer.toString("base64");
      photoName = photoFile.name;
      const ext = photoFile.name.split(".").pop() || "jpg";
      const storagePath = `need-price/${Date.now()}.${ext}`;
      try {
        photoPublicUrl = await uploadToStorage("kokpit-media", storagePath, buffer.buffer, photoFile.type || "image/jpeg");
      } catch (uploadErr) {
        console.error("Upload photo NeedPrice:", uploadErr);
      }
    }

    if (!denomination || !dimensions) {
      return NextResponse.json(
        { error: "denomination et dimensions sont requis" },
        { status: 400 }
      );
    }

    // Auto-generate reference: NP-{year}-{number padded to 3}
    const currentYear = new Date().getFullYear();
    const lastNeedPrice = await prisma.needPrice.findFirst({
      where: {
        reference: { startsWith: `NP-${currentYear}-` },
      },
      orderBy: { reference: "desc" },
    });

    let nextNumber = 1;
    if (lastNeedPrice) {
      const parts = lastNeedPrice.reference.split("-");
      const lastNumber = parseInt(parts[2], 10);
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }

    const reference = `NP-${currentYear}-${String(nextNumber).padStart(3, "0")}`;

    // Create NeedPrice
    const needPrice = await prisma.needPrice.create({
      data: {
        reference,
        refDevis: refDevis || undefined,
        nomClient: nomClient || undefined,
        denomination,
        dimensions,
        finitions: finitions || undefined,
        photoUrl: photoPublicUrl || photoName || undefined,
        notes: notes || undefined,
        createdById: session.user.id,
      },
      include: {
        createdBy: {
          select: { nom: true, prenom: true },
        },
      },
    });

    // Send email notification to Elaury via Brevo
    try {
      const creatorName = `${needPrice.createdBy.prenom} ${needPrice.createdBy.nom}`;
      const subject = `Need Price ${refDevis || reference} ${nomClient || ''}`.trim();
      const htmlContent = `<div style="font-family:Arial,sans-serif;font-size:14px;color:#333;line-height:1.8;">
${denomination}<br>
${dimensions}<br>
${finitions || ''}<br>
${notes ? notes + '<br>' : ''}
<br>
Asked by : ${creatorName}
</div>`;

      const emailPayload: any = {
        sender: { name: "KOKPIT", email: "laurence.payet@dimexoi.fr" },
        to: [{ email: "dimexoi.depi@gmail.com" }],
        subject,
        htmlContent,
      };

      // Ajouter la pièce jointe si présente
      if (photoBase64 && photoName) {
        emailPayload.attachment = [
          { content: photoBase64, name: photoName },
        ];
      }

      await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "accept": "application/json",
          "content-type": "application/json",
          "api-key": process.env.BREVO_API_KEY!,
        },
        body: JSON.stringify(emailPayload),
      });
    } catch (emailError) {
      console.error("Erreur lors de l'envoi de l'email Brevo:", emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json(needPrice, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de la création du NeedPrice:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
