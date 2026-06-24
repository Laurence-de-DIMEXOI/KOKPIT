import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const BREVO_API = "https://api.brevo.com/v3";

const SEGMENTS = [
  // ── Relance devis ─────────────────────────────────────────────────────────
  {
    id: "devis-chaud",
    categorie: "Relance devis",
    nom: "Devis chaud (3-7j)",
    description: "Devis envoyé il y a 3-7 jours, sans réponse",
  },
  {
    id: "devis-tiede",
    categorie: "Relance devis",
    nom: "Devis tiède (8-20j)",
    description: "Devis envoyé il y a 8-20 jours, sans suite",
  },
  {
    id: "devis-expirant",
    categorie: "Relance devis",
    nom: "Devis expirant (21-30j)",
    description: "Devis envoyé il y a 21-30 jours, expire bientôt",
  },
  {
    id: "devis-perdus-recuperables",
    categorie: "Relance devis",
    nom: "Devis perdus récupérables (30-90j)",
    description: "Devis expiré ou refusé depuis 30-90 jours",
  },
  // ── Réactivation clients ──────────────────────────────────────────────────
  {
    id: "clients-a-reactiver",
    categorie: "Réactivation clients",
    nom: "Clients à réactiver (6-12 mois)",
    description: "Dernière commande entre 6 et 12 mois",
  },
  {
    id: "clients-perdus",
    categorie: "Réactivation clients",
    nom: "Clients perdus (> 12 mois)",
    description: "Dernière commande il y a plus de 12 mois",
  },
  {
    id: "gros-paniers-non-fidelises",
    categorie: "Réactivation clients",
    nom: "Gros paniers non fidélisés (> 3 000€)",
    description: "1 commande > 3 000 €, pas de 2e achat",
  },
  // ── Intérêt par univers ───────────────────────────────────────────────────
  {
    id: "interet-sdb",
    categorie: "Intérêt produit",
    nom: "Intérêt Salle de bains",
    description: "Devis avec produits SDB (vasques, colonnes…)",
  },
  {
    id: "interet-chambre",
    categorie: "Intérêt produit",
    nom: "Intérêt Chambre",
    description: "Devis avec produits chambre (lits, armoires…)",
  },
  {
    id: "interet-sejour",
    categorie: "Intérêt produit",
    nom: "Intérêt Séjour",
    description: "Devis avec produits séjour (tables, buffets, meubles TV…)",
  },
  {
    id: "interet-cuisine",
    categorie: "Intérêt produit",
    nom: "Intérêt Cuisine",
    description: "Devis avec produits cuisine",
  },
  {
    id: "interet-exterieur",
    categorie: "Intérêt produit",
    nom: "Intérêt Extérieur",
    description: "Devis avec produits jardin / extérieur",
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

// Brevo n'accepte pas <, >, €, () dans les noms de listes
function sanitizeBrevoListName(name: string): string {
  return name
    .replace(/>/g, "sup.")
    .replace(/</g, "inf.")
    .replace(/€/g, "EUR")
    .replace(/[()]/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

// Créer ou récupérer une liste Brevo par nom
async function getOrCreateBrevoList(name: string): Promise<number> {
  name = sanitizeBrevoListName(name);
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

    // ── Relance devis ─────────────────────────────────────────────────────
    case "devis-chaud":
      return prisma.contact.findMany({
        where: {
          email: { not: "" },
          devis: {
            some: {
              createdAt: { gte: daysAgo(7), lt: daysAgo(3) },
              statut: "ENVOYE",
              vente: null,
            },
          },
        },
        select: { email: true, nom: true, prenom: true, ville: true },
      });

    case "devis-tiede":
      return prisma.contact.findMany({
        where: {
          email: { not: "" },
          devis: {
            some: {
              createdAt: { gte: daysAgo(20), lt: daysAgo(8) },
              statut: "ENVOYE",
              vente: null,
            },
          },
        },
        select: { email: true, nom: true, prenom: true, ville: true },
      });

    case "devis-expirant":
      return prisma.contact.findMany({
        where: {
          email: { not: "" },
          devis: {
            some: {
              createdAt: { gte: daysAgo(30), lt: daysAgo(21) },
              statut: { in: ["EN_ATTENTE", "ENVOYE"] },
              vente: null,
            },
          },
        },
        select: { email: true, nom: true, prenom: true, ville: true },
      });

    case "devis-perdus-recuperables":
      return prisma.contact.findMany({
        where: {
          email: { not: "" },
          devis: {
            some: {
              createdAt: { gte: daysAgo(90), lt: daysAgo(30) },
              statut: { in: ["EXPIRE", "REFUSE"] },
              vente: null,
            },
          },
        },
        select: { email: true, nom: true, prenom: true, ville: true },
      });

    // ── Réactivation clients ──────────────────────────────────────────────
    case "clients-a-reactiver":
      return prisma.contact.findMany({
        where: {
          email: { not: "" },
          ventes: {
            some: {},
            every: { createdAt: { lt: daysAgo(180) } },
          },
          NOT: {
            ventes: { every: { createdAt: { lt: daysAgo(365) } } },
          },
        },
        select: { email: true, nom: true, prenom: true, ville: true },
      });

    case "clients-perdus":
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

    case "gros-paniers-non-fidelises":
      return prisma.contact.findMany({
        where: {
          email: { not: "" },
          ventes: { some: { montant: { gt: 3000 } } },
        },
        select: { email: true, nom: true, prenom: true, ville: true, ventes: { select: { id: true, montant: true } } },
      }).then((contacts) =>
        contacts.filter((c) => c.ventes.length === 1 && c.ventes[0].montant > 3000)
      );

    // ── Intérêt par univers ──────────────────────────────────────────────
    case "interet-sdb":
      return prisma.contact.findMany({
        where: {
          email: { not: "" },
          devis: { some: { univers: "SDB" } },
        },
        select: { email: true, nom: true, prenom: true, ville: true },
      });

    case "interet-chambre":
      return prisma.contact.findMany({
        where: {
          email: { not: "" },
          devis: { some: { univers: "CHAMBRE" } },
        },
        select: { email: true, nom: true, prenom: true, ville: true },
      });

    case "interet-sejour":
      return prisma.contact.findMany({
        where: {
          email: { not: "" },
          devis: { some: { univers: "SEJOUR" } },
        },
        select: { email: true, nom: true, prenom: true, ville: true },
      });

    case "interet-cuisine":
      return prisma.contact.findMany({
        where: {
          email: { not: "" },
          devis: { some: { univers: "CUISINE" } },
        },
        select: { email: true, nom: true, prenom: true, ville: true },
      });

    case "interet-exterieur":
      return prisma.contact.findMany({
        where: {
          email: { not: "" },
          devis: { some: { univers: "EXTERIEUR" } },
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
