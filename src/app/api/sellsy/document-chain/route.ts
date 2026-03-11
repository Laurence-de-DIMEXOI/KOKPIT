import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDocumentParent, getEstimate, getOrder } from "@/lib/sellsy";

// Cache en mémoire — 30 min (la chaîne ne change quasi jamais)
const CHAIN_CACHE_TTL = 30 * 60 * 1000;
const chainCache = new Map<string, { data: unknown; expiresAt: number }>();

// Types V2 → V1 mapping
const TYPE_V2_TO_V1: Record<string, string> = {
  estimate: "estimate",
  order: "order",
  delivery: "delivery",
  invoice: "invoice",
};

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
 * Max 4 niveaux pour éviter les boucles.
 */
async function buildChain(docType: string, docId: string): Promise<ChainNode[]> {
  const chain: ChainNode[] = [];
  let currentType = docType;
  let currentId = docId;
  const visited = new Set<string>();

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
    const parentInfo = await getDocumentParent(
      TYPE_V2_TO_V1[currentType] || currentType,
      currentId
    );

    if (!parentInfo?.parentid || parentInfo.parentid === "0") break;

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
          parentNumero: "",
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
      // Silently continue if upsert fails
    }

    currentType = parentInfo.linkedtype || "unknown";
    currentId = parentInfo.parentid;
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
    // delivery / invoice : on n'a pas de helpers V2 encore
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
    // D'abord vérifier en BDD si on a déjà la chaîne
    const existingLinks = await prisma.liaisonDocumentaire.findMany({
      where: {
        OR: [
          { enfantSellsyId: id, enfantType: type },
          { parentSellsyId: id, parentType: type },
        ],
      },
    });

    let chain: ChainNode[];

    if (existingLinks.length > 0) {
      // Reconstruire depuis le BDD (cache local)
      // Mais on rebuild quand même via V1 pour s'assurer d'avoir la chaîne complète
      chain = await buildChain(type, id);
    } else {
      // Première fois : appeler V1
      chain = await buildChain(type, id);
    }

    const result = { chain, source: existingLinks.length > 0 ? "cache" : "v1" };

    // Mettre en cache mémoire
    chainCache.set(cacheKey, { data: result, expiresAt: Date.now() + CHAIN_CACHE_TTL });

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";

    // Si c'est une erreur V1 scope, retourner un message spécifique
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
