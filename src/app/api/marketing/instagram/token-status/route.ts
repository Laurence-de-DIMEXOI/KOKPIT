import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const CACHE_TTL = 60 * 60 * 1000; // 1 heure

let cache: { data: unknown; timestamp: number } | null = null;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return NextResponse.json(cache.data);
  }

  const token = process.env.META_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json({
      valide: false,
      expiresAt: null,
      joursRestants: 0,
      error: "META_ACCESS_TOKEN manquant",
    });
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/debug_token?input_token=${token}&access_token=${token}`
    );

    if (!res.ok) {
      throw new Error(`Meta API ${res.status}`);
    }

    const json = await res.json();
    const data = json.data || {};

    const expiresAt = data.expires_at
      ? new Date(data.expires_at * 1000).toISOString()
      : null;
    const joursRestants = data.expires_at
      ? Math.max(
          0,
          Math.floor(
            (data.expires_at * 1000 - Date.now()) / (1000 * 60 * 60 * 24)
          )
        )
      : 0;

    const result = {
      valide: data.is_valid || false,
      expiresAt,
      joursRestants,
      type: data.type || "unknown",
      scopes: data.scopes || [],
    };

    cache = { data: result, timestamp: Date.now() };
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("GET /api/marketing/instagram/token-status error:", error);
    return NextResponse.json({
      valide: false,
      expiresAt: null,
      joursRestants: 0,
      error: error.message,
    });
  }
}
