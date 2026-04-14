import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

// ─── Helpers ───────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  POST_FACEBOOK: "Post Facebook",
  POST_INSTAGRAM: "Post Instagram",
  CAMPAGNE_META_ADS: "Meta Ads",
  CAMPAGNE_GOOGLE_ADS: "Google Ads",
  NEWSLETTER: "Newsletter",
  SMS: "SMS",
  CATALOGUE: "Catalogue",
  PLV: "PLV",
  EVENEMENT: "Événement",
  ARTICLE_BLOG: "Article Blog",
  AUTRE: "Autre",
};

const STATUT_LABELS: Record<string, string> = {
  BROUILLON: "Brouillon",
  PLANIFIE: "Planifié",
  EN_COURS: "En cours",
  TERMINE: "Terminé",
};

// ─── Styles PDF ────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Helvetica",
    fontSize: 9,
  },
  header: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
    color: "#E36887",
  },
  subtitle: {
    fontSize: 10,
    color: "#888",
    marginBottom: 16,
  },
  table: {
    width: "100%",
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#1a1a2e",
    color: "#fff",
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#ddd",
    paddingVertical: 5,
    paddingHorizontal: 4,
  },
  tableRowAlt: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#ddd",
    paddingVertical: 5,
    paddingHorizontal: 4,
    backgroundColor: "#f8f8f8",
  },
  colDate: { width: "12%" },
  colType: { width: "15%" },
  colTitre: { width: "30%" },
  colCanal: { width: "13%" },
  colStatut: { width: "10%" },
  colDesc: { width: "20%" },
  headerText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    color: "#fff",
  },
  cellText: {
    fontSize: 8,
    color: "#333",
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 30,
    right: 30,
    fontSize: 7,
    color: "#aaa",
    textAlign: "center",
  },
});

// ─── PDF Document ──────────────────────────────────────────────────────

function OpPdfDocument({
  operations,
  periodLabel,
}: {
  operations: {
    date: Date;
    titre: string;
    type: string;
    description: string | null;
    statut: string;
    canal: { nom: string } | null;
  }[];
  periodLabel: string;
}) {
  return createElement(
    Document,
    null,
    createElement(
      Page,
      { size: "A4", orientation: "landscape", style: styles.page },
      createElement(Text, { style: styles.header }, "Opérations Marketing"),
      createElement(Text, { style: styles.subtitle }, periodLabel),

      // Table header
      createElement(
        View,
        { style: styles.table },
        createElement(
          View,
          { style: styles.tableHeaderRow },
          createElement(Text, { style: { ...styles.headerText, ...styles.colDate } }, "Date"),
          createElement(Text, { style: { ...styles.headerText, ...styles.colType } }, "Type"),
          createElement(Text, { style: { ...styles.headerText, ...styles.colTitre } }, "Titre"),
          createElement(Text, { style: { ...styles.headerText, ...styles.colCanal } }, "Canal"),
          createElement(Text, { style: { ...styles.headerText, ...styles.colStatut } }, "Statut"),
          createElement(Text, { style: { ...styles.headerText, ...styles.colDesc } }, "Description")
        ),

        // Table rows
        ...operations.map((op, i) =>
          createElement(
            View,
            { key: i, style: i % 2 === 0 ? styles.tableRow : styles.tableRowAlt },
            createElement(
              Text,
              { style: { ...styles.cellText, ...styles.colDate } },
              op.date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
            ),
            createElement(
              Text,
              { style: { ...styles.cellText, ...styles.colType } },
              TYPE_LABELS[op.type] || op.type
            ),
            createElement(
              Text,
              { style: { ...styles.cellText, ...styles.colTitre } },
              op.titre
            ),
            createElement(
              Text,
              { style: { ...styles.cellText, ...styles.colCanal } },
              op.canal?.nom || "—"
            ),
            createElement(
              Text,
              { style: { ...styles.cellText, ...styles.colStatut } },
              STATUT_LABELS[op.statut] || op.statut
            ),
            createElement(
              Text,
              { style: { ...styles.cellText, ...styles.colDesc } },
              (op.description || "").slice(0, 80) + ((op.description || "").length > 80 ? "…" : "")
            )
          )
        )
      ),

      createElement(
        Text,
        { style: styles.footer },
        `KÒKPIT — Export généré le ${new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}`
      )
    )
  );
}

// ─── Route ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const sp = req.nextUrl.searchParams;
  const periode = sp.get("periode") || "ce_mois";
  const mois = sp.get("mois");

  // Build date range
  const now = new Date();
  let startDate: Date;
  let endDate: Date;
  let periodLabel: string;

  if (periode === "ce_mois") {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    periodLabel = startDate.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  } else if (periode === "mois_dernier") {
    startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    periodLabel = startDate.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  } else if (periode === "mois" && mois) {
    const [y, m] = mois.split("-").map(Number);
    startDate = new Date(y, m - 1, 1);
    endDate = new Date(y, m, 0, 23, 59, 59);
    periodLabel = startDate.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  } else {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    periodLabel = startDate.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  }

  const types = sp.getAll("type");
  const statuts = sp.getAll("statut");

  const operations = await prisma.operationMarketing.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
      ...(types.length > 0 && { type: { in: types as any[] } }),
      ...(statuts.length > 0 && { statut: { in: statuts as any[] } }),
    },
    include: { canal: true },
    orderBy: { date: "desc" },
  });

  const doc = OpPdfDocument({ operations, periodLabel });
  const buffer = await renderToBuffer(doc as any);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="operations-marketing-${periodLabel.replace(/\s+/g, "-")}.pdf"`,
    },
  });
}
