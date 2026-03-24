import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateRfm } from "@/lib/rfm";
import { RFM_SEGMENTS, getSegment } from "@/data/rfm-segments";
import {
  getLists,
  createList,
  getFolders,
  upsertBrevoContact,
} from "@/lib/brevo";

// GET /api/rfm — Stats segments RFM
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  // Récupérer tous les contacts avec scores RFM
  const contacts = await prisma.contact.findMany({
    where: { scoreRfm: { not: null } },
    select: {
      id: true,
      email: true,
      nom: true,
      prenom: true,
      recence: true,
      frequence: true,
      montant: true,
      scoreRfm: true,
    },
  });

  // Compter par segment
  const segmentCounts: Record<string, number> = {};
  for (const seg of RFM_SEGMENTS) {
    segmentCounts[seg.id] = 0;
  }

  for (const c of contacts) {
    const seg = getSegment(c.recence || 1, c.frequence || 1, c.montant || 1);
    segmentCounts[seg.id]++;
  }

  return NextResponse.json({
    totalAvecScore: contacts.length,
    segments: RFM_SEGMENTS.map((s) => ({
      ...s,
      match: undefined, // ne pas envoyer la fonction
      count: segmentCounts[s.id] || 0,
    })),
  });
}

// POST /api/rfm — Recalculer les scores RFM + sync Brevo
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (!["ADMIN", "DIRECTION", "MARKETING"].includes(role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const syncBrevo = body.syncBrevo === true;

  // 1. Récupérer tous les contacts avec au moins 1 vente
  const contacts = await prisma.contact.findMany({
    where: {
      ventes: { some: {} },
      email: { not: "" },
    },
    select: { id: true, email: true, nom: true, prenom: true },
  });

  console.log(`[RFM] Recalcul pour ${contacts.length} contacts avec ventes…`);

  // 2. Calculer et mettre à jour les scores RFM
  let updated = 0;
  const segmentMap: Record<string, { id: string; email: string; nom: string; prenom: string }[]> = {};
  for (const seg of RFM_SEGMENTS) {
    segmentMap[seg.id] = [];
  }

  for (const contact of contacts) {
    try {
      const rfm = await calculateRfm(contact.id);
      await prisma.contact.update({
        where: { id: contact.id },
        data: {
          recence: rfm.recence,
          frequence: rfm.frequence,
          montant: rfm.montant,
          scoreRfm: rfm.score,
        },
      });
      updated++;

      const seg = getSegment(rfm.recence, rfm.frequence, rfm.montant);
      segmentMap[seg.id].push(contact);
    } catch {
      // Silencieux — contact sans données suffisantes
    }
  }

  console.log(`[RFM] ${updated} contacts mis à jour`);

  // 3. Sync vers Brevo si demandé
  let brevoResult: { synced: number; errors: number } | null = null;

  if (syncBrevo) {
    console.log("[RFM] Sync Brevo des segments…");

    const [existingLists, folders] = await Promise.all([
      getLists(),
      getFolders(),
    ]);
    const folderId = folders[0]?.id || 1;

    // Créer/trouver les listes Brevo pour chaque segment
    const listIds: Record<string, number> = {};
    for (const seg of RFM_SEGMENTS) {
      const found = existingLists.find((l) => l.name === seg.brevoListName);
      if (found) {
        listIds[seg.id] = found.id;
      } else {
        const newId = await createList(seg.brevoListName, folderId);
        listIds[seg.id] = newId;
        console.log(`[RFM] Liste Brevo créée : ${seg.brevoListName} (${newId})`);
      }
    }

    let synced = 0;
    let errors = 0;

    // Upsert contacts dans les bonnes listes
    for (const seg of RFM_SEGMENTS) {
      const contacts = segmentMap[seg.id];
      const listId = listIds[seg.id];
      // Listes des autres segments (pour retirer le contact)
      const otherListIds = Object.entries(listIds)
        .filter(([id]) => id !== seg.id)
        .map(([, lid]) => lid);

      for (const c of contacts) {
        if (!c.email || !c.email.includes("@")) continue;
        try {
          await upsertBrevoContact({
            email: c.email,
            attributes: {
              NOM: c.nom,
              PRENOM: c.prenom || "",
              RFM_SEGMENT: seg.label,
            },
            listIds: [listId],
            unlinkListIds: otherListIds,
          });
          synced++;
        } catch {
          errors++;
        }
      }
    }

    brevoResult = { synced, errors };
    console.log(`[RFM] Brevo : ${synced} sync, ${errors} erreurs`);
  }

  // Stats finales
  const segmentStats = RFM_SEGMENTS.map((s) => ({
    id: s.id,
    label: s.label,
    count: segmentMap[s.id].length,
  }));

  return NextResponse.json({
    updated,
    segments: segmentStats,
    brevo: brevoResult,
  });
}
