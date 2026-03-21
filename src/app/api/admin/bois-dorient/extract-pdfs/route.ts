import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { downloadDocumentPdfBdo } from "@/lib/sellsy-bdo";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 60;

const BUCKET_NAME = "bois-dorient-docs";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis");
  }
  return createClient(url, key);
}

/**
 * POST /api/admin/bois-dorient/extract-pdfs
 *
 * Telecharge les PDFs depuis Sellsy BDO et les upload dans Supabase Storage.
 * Query param: limit (default 10, max 50) — nombre de PDFs a traiter par appel.
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const limitParam = parseInt(searchParams.get("limit") || "10", 10);
  const limit = Math.min(Math.max(1, limitParam), 50);

  try {
    const supabase = getSupabaseAdmin();

    // 1. Trouver les documents sans PDF
    const documents = await prisma.documentBoisDOrient.findMany({
      where: { pdfUrl: null },
      take: limit,
      include: { clientBdo: { select: { id: true } } },
    });

    if (documents.length === 0) {
      const remaining = await prisma.documentBoisDOrient.count({
        where: { pdfUrl: null },
      });
      return NextResponse.json({ uploaded: 0, remaining, errors: [] });
    }

    let uploaded = 0;
    const errors: { sellsyDocId: string; error: string }[] = [];

    // 2. Traiter par batch de 3 en parallele
    const BATCH_SIZE = 3;
    for (let i = 0; i < documents.length; i += BATCH_SIZE) {
      const batch = documents.slice(i, i + BATCH_SIZE);

      const results = await Promise.allSettled(
        batch.map(async (doc) => {
          // Mapper le type vers l'endpoint Sellsy
          let endpoint: "invoices" | "orders" | "estimates";
          switch (doc.type) {
            case "FACTURE":
              endpoint = "invoices";
              break;
            case "COMMANDE":
              endpoint = "orders";
              break;
            case "DEVIS":
              endpoint = "estimates";
              break;
            default:
              throw new Error(`Type de document inconnu: ${doc.type}`);
          }

          // Telecharger le PDF depuis Sellsy BDO
          const pdfBuffer = await downloadDocumentPdfBdo(endpoint, Number(doc.sellsyDocId));

          // Construire le path dans le bucket
          const filename = `${doc.type.toLowerCase()}-${doc.reference || doc.sellsyDocId}.pdf`;
          const pdfPath = `${doc.clientBdoId}/${filename}`;

          // Upload dans Supabase Storage
          const { error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(pdfPath, pdfBuffer, {
              contentType: "application/pdf",
              upsert: true,
            });

          if (uploadError) {
            throw new Error(`Upload failed: ${uploadError.message}`);
          }

          // Obtenir l'URL publique
          const { data: publicUrlData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(pdfPath);

          const pdfUrl = publicUrlData.publicUrl;

          // Mettre a jour le document en base
          await prisma.documentBoisDOrient.update({
            where: { id: doc.id },
            data: { pdfUrl, pdfPath },
          });

          return { sellsyDocId: doc.sellsyDocId };
        })
      );

      for (const result of results) {
        if (result.status === "fulfilled") {
          uploaded++;
        } else {
          const reason = result.reason as Error;
          errors.push({
            sellsyDocId: "unknown",
            error: reason.message || "Erreur inconnue",
          });
        }
      }
    }

    // 3. Compter les documents restants
    const remaining = await prisma.documentBoisDOrient.count({
      where: { pdfUrl: null },
    });

    return NextResponse.json({ uploaded, remaining, errors });
  } catch (error: any) {
    console.error("[BDO Extract PDFs] Erreur:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de l'extraction des PDFs" },
      { status: 500 }
    );
  }
}
