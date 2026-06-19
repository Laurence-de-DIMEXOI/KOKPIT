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

/** Extrait les BCDI d'un texte → set "BCDI-XXXXX" (5 chiffres, zéros de tête). */
function extractBcdis(text: string): Set<string> {
  const out = new Set<string>();
  const re = /B[CD]DI[\s-]?0*(\d{2,6})/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) out.add(`BCDI-${m[1].padStart(5, "0")}`);
  return out;
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

  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (!files.length) return NextResponse.json({ error: "Aucun fichier" }, { status: 400 });

  const bcdis = new Set<string>();
  for (const file of files) {
    try {
      const buf = Buffer.from(await file.arrayBuffer());
      const wb = XLSX.read(buf, { type: "buffer" });
      let text = "";
      for (const name of wb.SheetNames) text += "\n" + XLSX.utils.sheet_to_csv(wb.Sheets[name]);
      for (const b of extractBcdis(text)) bcdis.add(b);
    } catch {
      return NextResponse.json({ error: `Fichier illisible : ${file.name}` }, { status: 400 });
    }
  }
  if (!bcdis.size) {
    return NextResponse.json({ error: "Aucun BCDI trouvé dans les fichiers" }, { status: 422 });
  }

  const list = [...bcdis];
  const added = await prisma.impExpedition.createMany({
    data: list.map((bcdi) => ({ bcdi, imp })),
    skipDuplicates: true,
  });

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
