import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const BREVO_API = "https://api.brevo.com/v3";

async function brevoFetch(path: string) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error("BREVO_API_KEY manquante");

  const res = await fetch(`${BREVO_API}${path}`, {
    headers: { "api-key": apiKey, "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Brevo API ${res.status}: ${text}`);
  }

  return res.json();
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    // Parallel: Brevo lists + last sync logs
    const [brevoLists, syncLogs] = await Promise.all([
      brevoFetch("/contacts/lists?limit=50&offset=0&sort=desc"),
      prisma.brevoSyncLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { createdBy: { select: { prenom: true, nom: true } } },
      }),
    ]);

    // Map sync logs by segment name for quick lookup
    const lastSyncBySegment = new Map<string, typeof syncLogs[0]>();
    for (const log of syncLogs) {
      if (!lastSyncBySegment.has(log.segmentNom)) {
        lastSyncBySegment.set(log.segmentNom, log);
      }
    }

    return NextResponse.json({
      listes: (brevoLists.lists || []).map((l: any) => ({
        id: l.id,
        name: l.name,
        totalSubscribers: l.totalSubscribers || 0,
        totalBlacklisted: l.totalBlacklisted || 0,
      })),
      syncLogs: syncLogs.slice(0, 10),
      lastSyncBySegment: Object.fromEntries(lastSyncBySegment),
    });
  } catch (error: any) {
    console.error("GET /api/marketing/brevo/listes error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}
