import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CLUB_LEVELS } from "@/data/club-grandis";

/**
 * GET /api/club/membres
 *
 * Liste paginée des membres Club Grandis.
 * Query params : ?niveau=1&search=nom&page=1&limit=20
 */
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const niveau = searchParams.get("niveau");
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);
  const skip = (page - 1) * limit;

  // Construction du filtre — exclure les membres retirés
  const where: Record<string, unknown> = { exclu: false };

  if (niveau) {
    const niv = parseInt(niveau, 10);
    if (!isNaN(niv) && niv >= 1 && niv <= 5) {
      where.niveau = niv;
    }
  }

  if (search.trim()) {
    where.OR = [
      { nom: { contains: search, mode: "insensitive" } },
      { prenom: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  try {
    const [membres, total] = await Promise.all([
      prisma.clubMembre.findMany({
        where: where as any,
        orderBy: [{ niveau: "desc" }, { totalMontant: "desc" }],
        skip,
        take: limit,
      }),
      prisma.clubMembre.count({ where: where as any }),
    ]);

    return NextResponse.json({
      membres,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("[Club Membres] Erreur:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors du chargement" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/club/membres?id=xxx
 *
 * Retire un membre du Club Grandis (soft-delete : exclu=true).
 * Le membre ne sera pas recréé lors du prochain sync.
 */
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID manquant" }, { status: 400 });
  }

  try {
    const membre = await prisma.clubMembre.findUnique({ where: { id } });
    if (!membre) {
      return NextResponse.json({ error: "Membre introuvable" }, { status: 404 });
    }

    await prisma.clubMembre.update({
      where: { id },
      data: { exclu: true },
    });

    console.log(`[Club] Membre exclu : ${membre.prenom} ${membre.nom} (niv ${membre.niveau})`);

    return NextResponse.json({
      success: true,
      deleted: { id: membre.id, nom: membre.nom, prenom: membre.prenom },
    });
  } catch (error: any) {
    console.error("[Club Membres] Erreur suppression:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la suppression" },
      { status: 500 }
    );
  }
}

// ===== Helper : générer un code promo unique =====
function genererCodePromo(niveau: number): string {
  const lvl = CLUB_LEVELS.find((l) => l.niveau === niveau);
  const chiffre = lvl?.chiffre || String(niveau);
  // 4 caractères alphanumériques aléatoires (majuscules + chiffres)
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sans I/O/0/1 pour éviter confusion
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `CLUB-${chiffre}-${code}`;
}

/**
 * PATCH /api/club/membres
 *
 * Actions sur un membre :
 * - { id, action: "toggle-bon" }       → bascule bonUtilise true/false
 * - { id, action: "generer-code" }     → génère un code promo unique
 * - { id, action: "set-bon", value }   → force bonUtilise à la valeur donnée
 */
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, action, value } = body;

    if (!id || !action) {
      return NextResponse.json({ error: "id et action requis" }, { status: 400 });
    }

    const membre = await prisma.clubMembre.findUnique({ where: { id } });
    if (!membre) {
      return NextResponse.json({ error: "Membre introuvable" }, { status: 404 });
    }

    switch (action) {
      case "toggle-bon": {
        const newVal = !membre.bonUtilise;
        const updated = await prisma.clubMembre.update({
          where: { id },
          data: {
            bonUtilise: newVal,
            dateBonUtilise: newVal ? new Date() : null,
          },
        });
        console.log(
          `[Club] Bon ${newVal ? "utilisé" : "réinitialisé"} : ${membre.prenom} ${membre.nom}`
        );
        return NextResponse.json({ success: true, membre: updated });
      }

      case "generer-code": {
        // Générer un code unique (vérifier qu'il n'existe pas déjà)
        let code: string;
        let attempts = 0;
        do {
          code = genererCodePromo(membre.niveau);
          const existing = await prisma.clubMembre.findFirst({
            where: { codePromo: code },
          });
          if (!existing) break;
          attempts++;
        } while (attempts < 10);

        const updated = await prisma.clubMembre.update({
          where: { id },
          data: { codePromo: code, bonUtilise: false, dateBonUtilise: null },
        });
        console.log(
          `[Club] Code promo généré : ${code} pour ${membre.prenom} ${membre.nom} (niv ${membre.niveau})`
        );
        return NextResponse.json({ success: true, membre: updated });
      }

      case "set-bon": {
        const bonVal = Boolean(value);
        const updated = await prisma.clubMembre.update({
          where: { id },
          data: {
            bonUtilise: bonVal,
            dateBonUtilise: bonVal ? new Date() : null,
          },
        });
        return NextResponse.json({ success: true, membre: updated });
      }

      case "set-niveau": {
        const niv = parseInt(value, 10);
        if (isNaN(niv) || niv < 1 || niv > 5) {
          return NextResponse.json({ error: "Niveau invalide (1-5)" }, { status: 400 });
        }
        const updated = await prisma.clubMembre.update({
          where: { id },
          data: {
            niveau: niv,
            brevoSynced: false,
            sellsySynced: false,
          },
        });
        const lvl = CLUB_LEVELS.find((l) => l.niveau === niv);
        console.log(
          `[Club] Niveau modifié → ${lvl?.chiffre} (${lvl?.nom}) : ${membre.prenom} ${membre.nom}`
        );
        return NextResponse.json({ success: true, membre: updated });
      }

      default:
        return NextResponse.json({ error: `Action inconnue : ${action}` }, { status: 400 });
    }
  } catch (error: any) {
    console.error("[Club Membres] Erreur PATCH:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la mise à jour" },
      { status: 500 }
    );
  }
}
