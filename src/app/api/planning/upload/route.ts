import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { uploadToStorage } from "@/lib/supabase";

// POST /api/planning/upload — Upload d'image pour couverture de post
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "Aucun fichier envoyé" },
        { status: 400 }
      );
    }

    // Vérifier le type
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Type de fichier non autorisé. Utilisez JPG, PNG, WebP ou GIF." },
        { status: 400 }
      );
    }

    // Vérifier la taille (10MB max côté serveur — la compression client vise < 4MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "Fichier trop volumineux (10 Mo max)" },
        { status: 400 }
      );
    }

    // Générer un nom unique
    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const path = `covers/${fileName}`;

    // Lire le fichier en ArrayBuffer
    const buffer = await file.arrayBuffer();

    // Upload vers Supabase Storage
    const publicUrl = await uploadToStorage("planning", path, buffer, file.type);

    return NextResponse.json({ success: true, url: publicUrl });
  } catch (error: any) {
    console.error("Erreur upload:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
