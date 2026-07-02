import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Normalise un n° IMP saisi ("619", "imp619", "IMP-619") → "IMP-619". */
function normImp(raw: string): string | null {
  const m = (raw || "").match(/(\d{2,4})/);
  return m ? `IMP-${m[1]}` : null;
}

/**
 * POST /api/achat/reservoir/imp-import  (multipart)
 *  - champ `imp`  : n° du container parti (ex "619")
 *  - champ `files`: une ou plusieurs packing lists (.xlsx)
 * Extrait les BCDI, les ajoute à imp_expedition et retire du réservoir les
 * commandes (hors SAV) désormais expédiées. Effet immédiat.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }
  const imp = normImp(String(form.get("imp") || ""));
  if (!imp) return NextResponse.json({ error: "N° IMP manquant ou invalide" }, { status: 400 });
  // Date d'arrivée optionnelle (yyyy-mm-dd) → sert aux alertes « besoins clients ».
  const dateArriveeRaw = String(form.get("dateArrivee") || "").trim();
  const dateArrivee = /^\d{4}-\d{2}-\d{2}$/.test(dateArriveeRaw) ? new Date(`${dateArriveeRaw}T00:00:00Z`) : null;

  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (!files.length) return NextResponse.json({ error: "Aucun fichier" }, { status: 400 });

  // Parse le PACKING LIST ligne par ligne → ce qui est PHYSIQUEMENT à bord (une
  // commande stock peut n'être que partiellement dans le container). On ne stocke
  // donc PAS toute la commande Sellsy, mais uniquement les réfs du packing.
  type Pack = { ref: string | null; desc: string; qty: number };
  const packByBcdi = new Map<string, Pack[]>();
  for (const file of files) {
    try {
      const buf = Buffer.from(await file.arrayBuffer());
      const wb = XLSX.read(buf, { type: "buffer" });
      for (const name of wb.SheetNames) {
        const rows = XLSX.utils.sheet_to_json<any[]>(wb.Sheets[name], { header: 1, blankrows: false });
        for (const row of rows) {
          const cells = (row || []).map((c) => (c == null ? "" : String(c).trim()));
          const text = cells.join(" ");
          const all = [...text.matchAll(/B[CD]DI[\s-]?0*(\d{2,6})/gi)];
          if (!all.length) continue;
          const bcdi = `BCDI-${all[all.length - 1][1].padStart(5, "0")}`;
          const ref = cells.find((c) => /\bEF[A-Z]{2}[\s-]?\w/i.test(c)) || null;
          const desc = cells.filter((c) => /[a-zA-ZÀ-ÿ]{3,}/.test(c) && c !== ref).sort((a, b) => b.length - a.length)[0] || "";
          const qty = cells.map(Number).find((n) => Number.isFinite(n) && n > 0 && n < 10000) || 1;
          const arr = packByBcdi.get(bcdi) || [];
          arr.push({ ref, desc, qty });
          packByBcdi.set(bcdi, arr);
        }
      }
    } catch {
      return NextResponse.json({ error: `Fichier illisible : ${file.name}` }, { status: 400 });
    }
  }
  const list = [...packByBcdi.keys()];
  if (!list.length) {
    return NextResponse.json({ error: "Aucun BCDI trouvé dans les fichiers" }, { status: 422 });
  }

  // Client + descriptions Sellsy (par réf) depuis le réservoir → on garde les jolies
  // descriptions pour les réfs réellement embarquées (repli sur la desc packing).
  const resRows = await prisma.reservoirBcdi.findMany({
    where: { bcdi: { in: list } },
    select: { bcdi: true, client: true, lignes: true },
  });
  const detailByBcdi = new Map(resRows.map((r) => [r.bcdi, r]));

  for (const bcdi of list) {
    const d = detailByBcdi.get(bcdi);
    const sellsy = (Array.isArray(d?.lignes) ? d!.lignes : []) as Array<{ ref?: string | null; desc?: string }>;
    const sMap = new Map(sellsy.filter((s) => s.ref).map((s) => [String(s.ref).trim().toUpperCase(), s.desc || ""]));
    const pack = packByBcdi.get(bcdi) || [];
    // lignes à bord = réfs du packing, enrichies par la desc Sellsy quand dispo
    const lignes = pack.map((p) => ({
      ref: p.ref,
      desc: (p.ref && sMap.get(p.ref.toUpperCase())) || p.desc || p.ref || "",
      qty: p.qty,
    }));
    await prisma.impExpedition.upsert({
      where: { bcdi },
      update: { imp, client: d?.client ?? undefined, lignes: lignes as any, dateArrivee: dateArrivee ?? undefined },
      create: { bcdi, imp, client: d?.client ?? null, lignes: lignes as any, dateArrivee },
    });
  }
  const added = { count: list.length };

  // Retire immédiatement du réservoir les commandes expédiées (sauf SAV)
  const removed = await prisma.reservoirBcdi.deleteMany({
    where: { bcdi: { in: list }, NOT: { etatProduit: { equals: "SAV", mode: "insensitive" } } },
  });

  return NextResponse.json({
    ok: true,
    imp,
    fichiers: files.length,
    bcdiTrouves: list.length,
    ajoutes: added.count,
    retiresDuReservoir: removed.count,
  });
}
