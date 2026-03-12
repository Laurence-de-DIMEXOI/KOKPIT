import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDocumentParent, getEstimate, getOrder } from "@/lib/sellsy";

// Cache en mémoire — 30 min (la chaîne ne change quasi jamais)
const CHAIN_CACHE_TTL = 30 * 60 * 1000;
const chainCache = new Map<string, { data: unknown; expiresAt: number }>();

const TYPE_LABELS: Record<string, string> = {
  estimate: "Devis",
  order: "Bon de commande",
  delivery: "Bon de livraison",
  invoice: "Facture",
};

interface ChainNode {
  id: string;
  type: string;
  typeLabel: string;
  numero: string;
  date: string | null;
  montantHT: number | null;
}

/**
 * Remonte la chaîne documentaire via l'API V1 (parentid).
 * Max 5 niveaux pour éviter les boucles.
 * Retourne null si V1 échoue (pour permettre le fallback).
 */
async function buildChainV1(docType: string, docId: string): Promise<ChainNode[] | null> {
  const chain: ChainNode[] = [];
  let currentType = docType;
  let currentId = docId;
  const visited = new Set<string>();
  let v1Failed = false;

  for (let depth = 0; depth < 5; depth++) {
    const key = `${currentType}:${currentId}`;
    if (visited.has(key)) break;
    visited.add(key);

    // Récupérer infos du document courant via V2
    const nodeInfo = await getDocumentInfo(currentType, currentId);
    chain.unshift({
      id: currentId,
      type: currentType,
      typeLabel: TYPE_LABELS[currentType] || currentType,
      numero: nodeInfo?.numero || `#${currentId}`,
      date: nodeInfo?.date || null,
      montantHT: nodeInfo?.montantHT ?? null,
    });

    // Chercher le parent via V1
    const parentInfo = await getDocumentParent(currentType, currentId);

    if (!parentInfo) {
      v1Failed = true;
      break; // V1 a échoué
    }
    if (!parentInfo.parentid || parentInfo.parentid === "0") break;

    // Sauvegarder la liaison en BDD (upsert)
    try {
      await prisma.liaisonDocumentaire.upsert({
        where: {
          enfantType_enfantSellsyId: {
            enfantType: currentType,
            enfantSellsyId: currentId,
          },
        },
        update: {
          parentType: parentInfo.linkedtype || "unknown",
          parentSellsyId: parentInfo.parentid,
        },
        create: {
          enfantType: currentType,
          enfantSellsyId: currentId,
          enfantNumero: nodeInfo?.numero || "",
          parentType: parentInfo.linkedtype || "unknown",
          parentSellsyId: parentInfo.parentid,
          parentNumero: "",
        },
      });
    } catch {
      // Silently continue
    }

    currentType = parentInfo.linkedtype || "unknown";
    currentId = parentInfo.parentid;
  }

  // Si V1 a échoué au premier appel et on n'a qu'un seul noeud, retourner null
  if (v1Failed && chain.length <= 1) return null;

  return chain;
}

/**
 * Reconstruit la chaîne documentaire à partir du cache DB + matching numéro.
 * Fallback quand V1 est indisponible.
 */
async function buildChainFromDB(docType: string, docId: string): Promise<ChainNode[]> {
  const chain: ChainNode[] = [];

  // Récupérer les infos du document demandé via V2
  const currentInfo = await getDocumentInfo(docType, docId);
  const currentNode: ChainNode = {
    id: docId,
    type: docType,
    typeLabel: TYPE_LABELS[docType] || docType,
    numero: currentInfo?.numero || `#${docId}`,
    date: currentInfo?.date || null,
    montantHT: currentInfo?.montantHT ?? null,
  };

  // Chercher dans la BDD si on a un parent
  const dbLink = await prisma.liaisonDocumentaire.findUnique({
    where: {
      enfantType_enfantSellsyId: {
        enfantType: docType,
        enfantSellsyId: docId,
      },
    },
  });

  if (dbLink && dbLink.parentSellsyId !== "0" && dbLink.parentType !== "none") {
    // On a un parent en cache DB
    const parentInfo = await getDocumentInfo(dbLink.parentType, dbLink.parentSellsyId);
    chain.push({
      id: dbLink.parentSellsyId,
      type: dbLink.parentType,
      typeLabel: TYPE_LABELS[dbLink.parentType] || dbLink.parentType,
      numero: parentInfo?.numero || dbLink.parentNumero || `#${dbLink.parentSellsyId}`,
      date: parentInfo?.date || null,
      montantHT: parentInfo?.montantHT ?? null,
    });
  } else {
    // Pas de cache DB — essayer matching par numéro
    const docNumber = currentInfo?.numero;
    if (docNumber) {
      const suffixMatch = docNumber.match(/[-_](\d{4,})/);
      if (suffixMatch) {
        const suffix = suffixMatch[1];

        if (docType === "order") {
          // Chercher un devis avec le même suffixe via LiaisonDevisCommande
          const liaison = await prisma.liaisonDevisCommande.findFirst({
            where: { orderId: Number(docId) },
          });
          if (liaison) {
            const parentInfo = await getDocumentInfo("estimate", String(liaison.estimateId));
            chain.push({
              id: String(liaison.estimateId),
              type: "estimate",
              typeLabel: TYPE_LABELS.estimate,
              numero: parentInfo?.numero || `#${liaison.estimateId}`,
              date: parentInfo?.date || null,
              montantHT: parentInfo?.montantHT ?? null,
            });
          }
        } else if (docType === "estimate") {
          // Chercher une commande liée
          const liaison = await prisma.liaisonDevisCommande.findFirst({
            where: { estimateId: Number(docId) },
          });
          if (liaison) {
            const childInfo = await getDocumentInfo("order", String(liaison.orderId));
            // Pour un devis, les ordres sont des enfants → on les ajoute après
            chain.push(currentNode);
            chain.push({
              id: String(liaison.orderId),
              type: "order",
              typeLabel: TYPE_LABELS.order,
              numero: childInfo?.numero || `#${liaison.orderId}`,
              date: childInfo?.date || null,
              montantHT: childInfo?.montantHT ?? null,
            });
            return chain; // Retourner directement la chaîne complète
          }
        }
      }
    }
  }

  chain.push(currentNode);

  // Chercher aussi les enfants (si on part d'un devis → commande liée)
  if (docType === "estimate") {
    const childLinks = await prisma.liaisonDocumentaire.findMany({
      where: { parentSellsyId: docId, parentType: "estimate" },
    });
    for (const child of childLinks) {
      const childInfo = await getDocumentInfo(child.enfantType, child.enfantSellsyId);
      chain.push({
        id: child.enfantSellsyId,
        type: child.enfantType,
        typeLabel: TYPE_LABELS[child.enfantType] || child.enfantType,
        numero: childInfo?.numero || child.enfantNumero || `#${child.enfantSellsyId}`,
        date: childInfo?.date || null,
        montantHT: childInfo?.montantHT ?? null,
      });
    }
  }

  return chain;
}

async function getDocumentInfo(
  type: string,
  id: string
): Promise<{ numero: string; date: string; montantHT: number } | null> {
  try {
    if (type === "estimate") {
      const res = await getEstimate(Number(id));
      const d = res.data;
      return {
        numero: d.number,
        date: d.date,
        montantHT: d.amounts?.total_excl_tax ?? 0,
      };
    }
    if (type === "order") {
      const res = await getOrder(Number(id));
      const d = res.data;
      return {
        numero: d.number,
        date: d.date,
        montantHT: d.amounts?.total_excl_tax ?? 0,
      };
    }
    // delivery / invoice : pas encore de helpers V2
    return null;
  } catch {
    return null;
  }
}

// GET /api/sellsy/document-chain?type=order&id=12345
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const id = searchParams.get("id");

  if (!type || !id) {
    return NextResponse.json(
      { error: "Paramètres 'type' et 'id' requis" },
      { status: 400 }
    );
  }

  // Check cache
  const cacheKey = `${type}:${id}`;
  const cached = chainCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return NextResponse.json(cached.data);
  }

  try {
    // Stratégie : essayer V1, si ça échoue → fallback BDD + matching numéro
    let chain = await buildChainV1(type, id);
    let source: "v1" | "db-fallback" = "v1";

    if (!chain) {
      // V1 est cassé — utiliser le fallback
      chain = await buildChainFromDB(type, id);
      source = "db-fallback";
    }

    const result = { chain, source };

    // Mettre en cache mémoire
    chainCache.set(cacheKey, { data: result, expiresAt: Date.now() + CHAIN_CACHE_TTL });

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";

    // Si c'est une erreur V1 scope → message spécifique
    if (message.includes("401") || message.includes("403") || message.includes("scope")) {
      return NextResponse.json(
        {
          error: "API V1 non configurée",
          detail: "Activez le scope 'API V1' dans Sellsy > Paramètres > Portail développeur",
          chain: [],
        },
        { status: 200 }
      );
    }

    return NextResponse.json({ error: message, chain: [] }, { status: 500 });
  }
}
