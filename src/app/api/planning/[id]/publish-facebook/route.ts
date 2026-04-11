import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  // 1. Auth
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = params;

  try {
    // 2. Charger le post
    const post = await prisma.postPlanning.findUnique({ where: { id } });
    if (!post) {
      return NextResponse.json({ error: "Post introuvable" }, { status: 404 });
    }

    // 3. Validations pré-envoi
    if (!post.scheduledDate) {
      return NextResponse.json(
        { error: "Date de publication manquante. Enregistre le post avec une date avant de programmer sur Facebook." },
        { status: 400 }
      );
    }

    if (!post.description?.trim()) {
      return NextResponse.json(
        { error: "La description (texte du post) est requise pour publier sur Facebook." },
        { status: 400 }
      );
    }

    const scheduledMs = new Date(post.scheduledDate).getTime();
    const now = Date.now();

    if (scheduledMs <= now) {
      return NextResponse.json(
        { error: "La date de publication doit être dans le futur." },
        { status: 400 }
      );
    }

    // Facebook exige au moins 10 minutes dans le futur
    if (scheduledMs < now + 10 * 60 * 1000) {
      return NextResponse.json(
        { error: "Facebook exige que la date de publication soit au moins 10 minutes dans le futur." },
        { status: 400 }
      );
    }

    // Facebook ne peut pas programmer plus de 6 mois à l'avance
    if (scheduledMs > now + 6 * 30 * 24 * 60 * 60 * 1000) {
      return NextResponse.json(
        { error: "Facebook ne permet pas de programmer un post à plus de 6 mois dans le futur." },
        { status: 400 }
      );
    }

    // Anti double-soumission
    if (post.fbPostId) {
      return NextResponse.json(
        { error: `Ce post est déjà programmé sur Facebook (id: ${post.fbPostId}).` },
        { status: 409 }
      );
    }

    // 4. Variables d'environnement
    const pageId = process.env.FACEBOOK_PAGE_ID;
    const pageToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
    if (!pageId || !pageToken) {
      return NextResponse.json(
        { error: "Configuration Facebook manquante. Contacte l'administrateur (FACEBOOK_PAGE_ID / FACEBOOK_PAGE_ACCESS_TOKEN)." },
        { status: 500 }
      );
    }

    // 5. Appel Graph API Facebook
    const scheduledUnix = Math.floor(scheduledMs / 1000);

    let endpoint: string;
    const fbPayload: Record<string, string> = {
      published: "false",
      scheduled_publish_time: String(scheduledUnix),
      access_token: pageToken,
    };

    if (post.coverImage) {
      // Avec image → endpoint /photos (retourne { id, post_id })
      endpoint = `https://graph.facebook.com/v21.0/${pageId}/photos`;
      fbPayload.url = post.coverImage;
      fbPayload.caption = post.description.trim();
    } else {
      // Texte seul → endpoint /feed (retourne { id })
      endpoint = `https://graph.facebook.com/v21.0/${pageId}/feed`;
      fbPayload.message = post.description.trim();
    }

    const fbRes = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(fbPayload).toString(),
    });

    const fbData = await fbRes.json();

    if (!fbRes.ok || fbData.error) {
      console.error("[Facebook API] Erreur programmation:", fbData);
      const msg = fbData.error?.message || "Erreur inconnue de l'API Facebook";
      return NextResponse.json({ error: `Facebook : ${msg}` }, { status: 502 });
    }

    // 6. Stocker l'ID retourné par Facebook
    // /photos retourne { id: PHOTO_ID, post_id: PAGE_POST_ID }
    // /feed retourne { id: PAGE_POST_ID }
    const fbPostId: string = fbData.post_id || fbData.id;

    await prisma.postPlanning.update({
      where: { id },
      data: {
        fbPostId,
        fbScheduledAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, fbPostId });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erreur serveur";
    console.error("[publish-facebook] Erreur:", error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
