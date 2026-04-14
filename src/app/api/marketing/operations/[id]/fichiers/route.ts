import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadToStorage } from "@/lib/supabase";

type Ctx = { params: Promise<{ id: string }> };

// POST /api/marketing/operations/[id]/fichiers — upload multi-fichiers
export async function POST(req: NextRequest, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;

  // Vérifier que l'opération existe
  const op = await prisma.operationMarketing.findUnique({ where: { id } });
  if (!op) {
    return NextResponse.json({ error: "Opération introuvable" }, { status: 404 });
  }

  const formData = await req.formData();
  const files = formData.getAll("fichiers") as File[];

  if (files.length === 0) {
    return NextResponse.json({ error: "Aucun fichier" }, { status: 400 });
  }

  // Ordre max actuel
  const maxOrdre = await prisma.operationFichier.aggregate({
    where: { operationId: id },
    _max: { ordre: true },
  });
  let ordre = (maxOrdre._max.ordre ?? -1) + 1;

  const created = [];

  for (const file of files) {
    const buffer = await file.arrayBuffer();
    const slug = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const fichierId = crypto.randomUUID();
    const storagePath = `${id}/${fichierId}-${slug}`;

    await uploadToStorage("op-marketing", storagePath, buffer, file.type);

    const fichierType = file.type === "application/pdf"
      ? "PDF"
      : file.type.startsWith("image/")
        ? "CAPTURE"
        : "AUTRE";

    const fichier = await prisma.operationFichier.create({
      data: {
        operationId: id,
        nom: file.name,
        storagePath,
        mimeType: file.type,
        taille: buffer.byteLength,
        type: fichierType,
        ordre: ordre++,
      },
    });

    created.push(fichier);
  }

  return NextResponse.json({ fichiers: created }, { status: 201 });
}

// PATCH /api/marketing/operations/[id]/fichiers — reorder
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const { ordres } = await req.json() as { ordres: { id: string; ordre: number }[] };

  await Promise.all(
    ordres.map((o) =>
      prisma.operationFichier.update({
        where: { id: o.id },
        data: { ordre: o.ordre },
      })
    )
  );

  const fichiers = await prisma.operationFichier.findMany({
    where: { operationId: id },
    orderBy: { ordre: "asc" },
  });

  return NextResponse.json({ fichiers });
}
