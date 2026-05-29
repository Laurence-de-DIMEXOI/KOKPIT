import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { uploadToStorage } from "@/lib/supabase";

export const maxDuration = 60;

/**
 * POST /api/upload — upload générique multipart vers Supabase Storage.
 * Body : FormData { file, folder? }
 * Réponse : { url, path }
 * Auth : session requise.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const folder = (formData.get("folder") as string | null) || "divers";

  if (!file || typeof file === "string" || file.size === 0) {
    return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
  }
  if (file.size > 15 * 1024 * 1024) {
    return NextResponse.json({ error: "Fichier trop volumineux (max 15 Mo)" }, { status: 400 });
  }

  try {
    const buffer = await file.arrayBuffer();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const ext = safeName.split(".").pop() || "bin";
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const url = await uploadToStorage(
      "kokpit-media",
      path,
      buffer,
      file.type || "application/octet-stream"
    );
    return NextResponse.json({ url, path });
  } catch (e) {
    console.error("[upload]", e);
    return NextResponse.json({ error: "Échec de l'upload" }, { status: 500 });
  }
}
