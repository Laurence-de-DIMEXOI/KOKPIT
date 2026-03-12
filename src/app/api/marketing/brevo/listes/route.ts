import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const BREVO_API = "https://api.brevo.com/v3";

async function brevoFetch(path: string, options?: RequestInit) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error("BREVO_API_KEY manquante");

  const res = await fetch(`${BREVO_API}${path}`, {
    ...options,
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      ...options?.headers,
    },
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

// POST /api/marketing/brevo/listes — Create a Brevo list from DB criteria + add matching contacts
const createListSchema = z.object({
  name: z.string().min(1),
  criteria: z.object({
    stage: z.enum(["PROSPECT", "LEAD", "CLIENT", "INACTIF"]).optional(),
    hasDevis: z.boolean().optional(),
    hasVente: z.boolean().optional(),
    createdAfter: z.string().optional(),
  }),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, criteria } = createListSchema.parse(body);

    // 1. Create the list in Brevo
    const brevoList = await brevoFetch("/contacts/lists", {
      method: "POST",
      body: JSON.stringify({ name, folderId: 1 }),
    });

    const listId = brevoList.id;

    // 2. Find matching contacts from DB
    const where: any = { email: { not: null } };
    if (criteria.stage) where.lifecycleStage = criteria.stage;
    if (criteria.hasDevis) where.devis = { some: {} };
    if (criteria.hasVente) where.ventes = { some: {} };
    if (criteria.createdAfter) where.createdAt = { gte: new Date(criteria.createdAfter) };

    const contacts = await prisma.contact.findMany({
      where,
      select: { email: true },
    });

    const emails = contacts
      .map((c) => c.email)
      .filter((e): e is string => !!e && e.includes("@"));

    // 3. Add contacts to Brevo list (batch of 150)
    let added = 0;
    for (let i = 0; i < emails.length; i += 150) {
      const batch = emails.slice(i, i + 150);
      try {
        await brevoFetch(`/contacts/lists/${listId}/contacts/add`, {
          method: "POST",
          body: JSON.stringify({ emails: batch }),
        });
        added += batch.length;
      } catch {
        // Some emails might not exist in Brevo — continue
      }
    }

    return NextResponse.json({
      success: true,
      listId,
      listName: name,
      contactsMatched: emails.length,
      contactsAdded: added,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }
    console.error("POST /api/marketing/brevo/listes error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}
