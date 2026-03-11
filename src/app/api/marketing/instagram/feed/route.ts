import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

let cache: { data: unknown; timestamp: number } | null = null;

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const fresh = searchParams.get("fresh") === "true";

  if (!fresh && cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return NextResponse.json(cache.data);
  }

  const token = process.env.META_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "META_ACCESS_TOKEN manquant", posts: [] },
      { status: 503 }
    );
  }

  try {
    const res = await fetch(
      `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,thumbnail_url,timestamp,permalink&access_token=${token}&limit=12`
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Instagram API ${res.status}: ${text}`);
    }

    const json = await res.json();

    const posts = (json.data || []).map((p: any) => ({
      id: p.id,
      caption: p.caption || "",
      mediaType: p.media_type, // IMAGE, VIDEO, CAROUSEL_ALBUM
      mediaUrl: p.media_url,
      thumbnailUrl: p.thumbnail_url || p.media_url,
      timestamp: p.timestamp,
      permalink: p.permalink,
    }));

    const result = {
      posts,
      _cache: { generatedAt: new Date().toISOString() },
    };

    cache = { data: result, timestamp: Date.now() };
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("GET /api/marketing/instagram/feed error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur Instagram", posts: [] },
      { status: 500 }
    );
  }
}
