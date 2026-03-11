import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const BREVO_API = "https://api.brevo.com/v3";

const SEGMENTS = [
  {
    id: "tous-contacts",
    nom: "Tous les contacts actifs",
    description: "Tous les contacts KOKPIT non archivés",
    filter: {},
  },
  {
    id: "clients-90j",
    nom: "Clients récents (90 jours)",
    description: "Contacts ayant une commande dans les 90 derniers jours",
    filter: { lifecycleStage: "CLIENT", recentDays: 90 },
  },
  {
    id: "prospects-devis",
    nom: "Prospects — devis sans commande",
    description: "Contacts avec devis mais sans commande enregistrée",
    filter: { hasDevis: true, noVentes: true },
  },
  {
    id: "contacts-sans-achat",
    nom: "Contacts sans achat",
    description: "Contacts sans aucune commande",
    filter: { noVentes: true },
  },
];

async function brevoFetch(path: string, options?: RequestInit) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error("BREVO_API_KEY manquante");

  const res = await fetch(`${BREVO_API}${path}`, {
    ...options,
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Brevo API ${res.status}: ${text}`);
  }

  return res.json();
}

// Créer ou récupérer une liste Brevo par nom
async function getOrCreateBrevoList(name: string): Promise<number> {
  // Chercher la liste existante
  try {
    const listsRes = await brevoFetch("/contacts/lists?limit=50&offset=0");
    const existing = (listsRes.lists || []).find(
      (l: any) => l.name === name
    );
    if (existing) return existing.id;
  } catch {
    // Continue to create
  }

  // Créer la liste
  const created = await brevoFetch("/contacts/lists", {
    method: "POST",
    body: JSON.stringify({ name, folderId: 1 }),
  });

  return created.id;
}

// Récupérer les contacts selon le segment
async function getContactsForSegment(segmentId: string) {
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  switch (segmentId) {
    case "tous-contacts":
      return prisma.contact.findMany({
        where: { email: { not: "" } },
        select: { email: true, nom: true, prenom: true, ville: true },
      });

    case "clients-90j":
      return prisma.contact.findMany({
        where: {
          email: { not: "" },
          lifecycleStage: "CLIENT",
          ventes: { some: { createdAt: { gte: ninetyDaysAgo } } },
        },
        select: { email: true, nom: true, prenom: true, ville: true },
      });

    case "prospects-devis":
      return prisma.contact.findMany({
        where: {
          email: { not: "" },
          devis: { some: {} },
          ventes: { none: {} },
        },
        select: { email: true, nom: true, prenom: true, ville: true },
      });

    case "contacts-sans-achat":
      return prisma.contact.findMany({
        where: {
          email: { not: "" },
          ventes: { none: {} },
        },
        select: { email: true, nom: true, prenom: true, ville: true },
      });

    default:
      throw new Error(`Segment inconnu: ${segmentId}`);
  }
}

// POST — Sync un segment
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { segmentId } = body;

    if (!segmentId) {
      return NextResponse.json(
        { error: "segmentId requis" },
        { status: 400 }
      );
    }

    const segment = SEGMENTS.find((s) => s.id === segmentId);
    if (!segment) {
      return NextResponse.json(
        { error: `Segment inconnu: ${segmentId}` },
        { status: 400 }
      );
    }

    // 1. Récupérer les contacts
    const contacts = await getContactsForSegment(segmentId);
    const contactsWithEmail = contacts.filter(
      (c) => c.email && c.email.includes("@")
    );

    if (contactsWithEmail.length === 0) {
      // Log empty sync
      await prisma.brevoSyncLog.create({
        data: {
          segmentNom: segment.nom,
          nbContacts: 0,
          statut: "success",
          createdById: session.user.id,
        },
      });

      return NextResponse.json({
        success: true,
        segmentId,
        nbContacts: 0,
        message: "Aucun contact avec email dans ce segment",
      });
    }

    // 2. Créer/récupérer la liste Brevo
    const listName = `KOKPIT — ${segment.nom}`;
    const listeBrevoId = await getOrCreateBrevoList(listName);

    // 3. Importer les contacts dans Brevo
    const jsonBody = JSON.stringify({
      listIds: [listeBrevoId],
      emailBlacklist: false,
      updateExistingContacts: true,
      emptyContactsAttributes: false,
      jsonBody: contactsWithEmail.map((c) => ({
        email: c.email,
        attributes: {
          NOM: c.nom || "",
          PRENOM: c.prenom || "",
          VILLE: c.ville || "",
        },
      })),
    });

    await brevoFetch("/contacts/import", {
      method: "POST",
      body: jsonBody,
    });

    // 4. Logger
    await prisma.brevoSyncLog.create({
      data: {
        segmentNom: segment.nom,
        nbContacts: contactsWithEmail.length,
        statut: "success",
        createdById: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      segmentId,
      nbContacts: contactsWithEmail.length,
      listeBrevoId,
      listeName: listName,
    });
  } catch (error: any) {
    console.error("POST /api/marketing/brevo/sync error:", error);

    // Try to log the error
    try {
      const body = await request.clone().json().catch(() => ({}));
      const segment = SEGMENTS.find((s) => s.id === (body as any)?.segmentId);
      if (segment && session?.user?.id) {
        await prisma.brevoSyncLog.create({
          data: {
            segmentNom: segment.nom,
            nbContacts: 0,
            statut: "error",
            erreur: error.message,
            createdById: session.user.id,
          },
        });
      }
    } catch {
      // Ignore logging error
    }

    return NextResponse.json(
      { error: error.message || "Erreur lors de la synchronisation" },
      { status: 500 }
    );
  }
}
