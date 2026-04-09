import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const BREVO_API = "https://api.brevo.com/v3";

const SEGMENTS = [
  // ── Acquisition & relance ──────────────────────────────────────────────────
  {
    id: "devis-sans-suite",
    categorie: "Acquisition & relance",
    nom: "Devis sans suite (> 30j)",
    description: "Devis créé il y a plus de 30 jours, non converti",
  },
  {
    id: "devis-expirant",
    categorie: "Acquisition & relance",
    nom: "Devis expirant bientôt (7j)",
    description: "Devis créé il y a 23–30 jours (expire dans 7 jours), sans commande",
  },
  {
    id: "demande-sans-devis",
    categorie: "Acquisition & relance",
    nom: "Demande sans devis",
    description: "Lead reçu, aucun devis associé",
  },
  // ── Cycle de vie client ────────────────────────────────────────────────────
  {
    id: "acheteurs-recents",
    categorie: "Cycle de vie client",
    nom: "Acheteurs récents (< 60j)",
    description: "Contacts avec une commande dans les 60 derniers jours",
  },
  {
    id: "clients-inactifs",
    categorie: "Cycle de vie client",
    nom: "Clients inactifs (> 12 mois)",
    description: "Dernière commande il y a plus de 12 mois",
  },
  {
    id: "multi-commandes",
    categorie: "Cycle de vie client",
    nom: "Acheteurs multi-commandes",
    description: "Contacts avec au moins 2 commandes",
  },
  {
    id: "gros-panier-unique",
    categorie: "Cycle de vie client",
    nom: "Gros panier unique (> 5 000€)",
    description: "1 commande > 5 000 €, pas de 2e achat",
  },
  // ── Téléchargements ────────────────────────────────────────────────────────
  {
    id: "guide-sdb",
    categorie: "Téléchargements",
    nom: "Guide SDB teck — téléchargements",
    description: "Contacts ayant téléchargé le guide salle de bain en teck",
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
  const now = new Date();

  const daysAgo = (n: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - n);
    return d;
  };

  switch (segmentId) {

    // ── Acquisition & relance ──────────────────────────────────────────────
    case "devis-sans-suite":
      // Devis créé il y a > 30j, pas encore converti en vente
      return prisma.contact.findMany({
        where: {
          email: { not: "" },
          devis: {
            some: {
              createdAt: { lt: daysAgo(30) },
              statut: { in: ["EN_ATTENTE", "ENVOYE"] },
              vente: null,
            },
          },
        },
        select: { email: true, nom: true, prenom: true, ville: true },
      });

    case "devis-expirant":
      // Devis créé il y a 23–30j (expire dans 7j, validité 30j par défaut)
      return prisma.contact.findMany({
        where: {
          email: { not: "" },
          devis: {
            some: {
              createdAt: { gte: daysAgo(30), lt: daysAgo(23) },
              statut: { in: ["EN_ATTENTE", "ENVOYE"] },
              vente: null,
            },
          },
        },
        select: { email: true, nom: true, prenom: true, ville: true },
      });

    case "demande-sans-devis":
      // Contact avec lead(s) mais sans aucun devis
      return prisma.contact.findMany({
        where: {
          email: { not: "" },
          leads: { some: {} },
          devis: { none: {} },
        },
        select: { email: true, nom: true, prenom: true, ville: true },
      });

    // ── Cycle de vie client ────────────────────────────────────────────────
    case "acheteurs-recents":
      // Au moins 1 vente dans les 60 derniers jours
      return prisma.contact.findMany({
        where: {
          email: { not: "" },
          ventes: { some: { createdAt: { gte: daysAgo(60) } } },
        },
        select: { email: true, nom: true, prenom: true, ville: true },
      });

    case "clients-inactifs":
      // Ont acheté, mais dernière vente il y a plus de 12 mois
      return prisma.contact.findMany({
        where: {
          email: { not: "" },
          ventes: {
            some: {},
            every: { createdAt: { lt: daysAgo(365) } },
          },
        },
        select: { email: true, nom: true, prenom: true, ville: true },
      });

    case "multi-commandes":
      // Au moins 2 ventes
      return prisma.contact.findMany({
        where: {
          email: { not: "" },
          ventes: { some: {} },
        },
        select: { email: true, nom: true, prenom: true, ville: true, ventes: { select: { id: true } } },
      }).then((contacts) => contacts.filter((c) => c.ventes.length >= 2));

    case "gros-panier-unique":
      // Exactement 1 vente avec montant > 5 000€
      return prisma.contact.findMany({
        where: {
          email: { not: "" },
          ventes: { some: { montant: { gt: 5000 } } },
        },
        select: { email: true, nom: true, prenom: true, ville: true, ventes: { select: { id: true, montant: true } } },
      }).then((contacts) =>
        contacts.filter((c) => c.ventes.length === 1 && c.ventes[0].montant > 5000)
      );

    // ── Téléchargements ────────────────────────────────────────────────────
    case "guide-sdb":
      return prisma.contact.findMany({
        where: {
          email: { not: "" },
          evenements: {
            some: { description: { contains: "Téléchargement guide PDF" } },
          },
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
