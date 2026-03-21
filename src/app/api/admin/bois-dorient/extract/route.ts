import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  listAllIndividualsBdo,
  listAllCompaniesBdo,
  listAllInvoicesBdo,
  listAllOrdersBdo,
  listAllEstimatesBdo,
  type SellsyBdoDocument,
} from "@/lib/sellsy-bdo";

export const maxDuration = 60;

/**
 * POST /api/admin/bois-dorient/extract
 *
 * Extrait TOUS les contacts + documents depuis le Sellsy Bois d'Orient
 * et les upsert dans ClientBoisDOrient / DocumentBoisDOrient.
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  // Creer un import en cours
  const importRecord = await prisma.importBoisDOrient.create({
    data: { statut: "EN_COURS" },
  });

  try {
    // 1. Recuperer tous les contacts
    const [individuals, companies] = await Promise.all([
      listAllIndividualsBdo(),
      listAllCompaniesBdo(),
    ]);

    // 2. Recuperer tous les documents
    const [invoices, orders, estimates] = await Promise.all([
      listAllInvoicesBdo(),
      listAllOrdersBdo(),
      listAllEstimatesBdo(),
    ]);

    // 3. Construire une map contactId -> stats documents
    interface DocEntry {
      doc: SellsyBdoDocument;
      type: "FACTURE" | "COMMANDE" | "DEVIS";
      montant: number;
    }
    interface ContactStats {
      nbFactures: number;
      nbCommandes: number;
      nbDevis: number;
      totalCA: number;
      premiereFacture: string | null;
      derniereFacture: string | null;
      docs: DocEntry[];
    }

    const contactMap = new Map<string, ContactStats>();

    function getOrCreate(contactId: string): ContactStats {
      if (!contactMap.has(contactId)) {
        contactMap.set(contactId, {
          nbFactures: 0,
          nbCommandes: 0,
          nbDevis: 0,
          totalCA: 0,
          premiereFacture: null,
          derniereFacture: null,
          docs: [],
        });
      }
      return contactMap.get(contactId)!;
    }

    // Indexer les factures
    for (const doc of invoices) {
      const contactId = String(doc.related?.[0]?.id || "unknown");
      const montant = Number(doc.amounts?.total_incl_tax) || 0;
      const stats = getOrCreate(contactId);
      stats.nbFactures++;
      stats.totalCA += montant;
      if (doc.created) {
        if (!stats.premiereFacture || doc.created < stats.premiereFacture) {
          stats.premiereFacture = doc.created;
        }
        if (!stats.derniereFacture || doc.created > stats.derniereFacture) {
          stats.derniereFacture = doc.created;
        }
      }
      stats.docs.push({ doc, type: "FACTURE", montant });
    }

    // Indexer les commandes
    for (const doc of orders) {
      const contactId = String(doc.related?.[0]?.id || "unknown");
      const stats = getOrCreate(contactId);
      stats.nbCommandes++;
      stats.docs.push({ doc, type: "COMMANDE", montant: Number(doc.amounts?.total_incl_tax) || 0 });
    }

    // Indexer les devis
    for (const doc of estimates) {
      const contactId = String(doc.related?.[0]?.id || "unknown");
      const stats = getOrCreate(contactId);
      stats.nbDevis++;
      stats.docs.push({ doc, type: "DEVIS", montant: Number(doc.amounts?.total_incl_tax) || 0 });
    }

    // 4. Construire les records ClientBoisDOrient
    interface ClientRecord {
      sellsyIdBdo: string;
      nom: string;
      prenom: string;
      email: string | null;
      telephone: string | null;
      adresse: string | null;
      ville: string | null;
      nbFactures: number;
      nbCommandes: number;
      nbDevis: number;
      totalCA: number;
      premiereFacture: Date | null;
      derniereFacture: Date | null;
      commandesDetail: { date: string | null; montant: number; ref: string | null; type: string }[];
    }

    const clientRecords: ClientRecord[] = [];

    // Individuals
    for (const contact of individuals) {
      const sellsyId = String(contact.id);
      const stats = contactMap.get(sellsyId);
      const address = contact.addresses?.[0];

      clientRecords.push({
        sellsyIdBdo: sellsyId,
        nom: contact.last_name || "Inconnu",
        prenom: contact.first_name || "",
        email: contact.email || null,
        telephone: contact.phone_number || contact.mobile_number || null,
        adresse: address ? [address.part_1, address.part_2].filter(Boolean).join(", ") : null,
        ville: address?.city || null,
        nbFactures: stats?.nbFactures || 0,
        nbCommandes: stats?.nbCommandes || 0,
        nbDevis: stats?.nbDevis || 0,
        totalCA: stats?.totalCA || 0,
        premiereFacture: stats?.premiereFacture ? new Date(stats.premiereFacture) : null,
        derniereFacture: stats?.derniereFacture ? new Date(stats.derniereFacture) : null,
        commandesDetail: stats?.docs.map((d) => ({
          date: d.doc.created || null,
          montant: d.montant,
          ref: d.doc.number || d.doc.reference || null,
          type: d.type,
        })) || [],
      });
    }

    // Companies
    for (const contact of companies) {
      const sellsyId = String(contact.id);
      const stats = contactMap.get(sellsyId);
      const address = contact.addresses?.[0];

      clientRecords.push({
        sellsyIdBdo: sellsyId,
        nom: contact.name || "Inconnu",
        prenom: "",
        email: contact.email || null,
        telephone: contact.phone_number || contact.mobile_number || null,
        adresse: address ? [address.part_1, address.part_2].filter(Boolean).join(", ") : null,
        ville: address?.city || null,
        nbFactures: stats?.nbFactures || 0,
        nbCommandes: stats?.nbCommandes || 0,
        nbDevis: stats?.nbDevis || 0,
        totalCA: stats?.totalCA || 0,
        premiereFacture: stats?.premiereFacture ? new Date(stats.premiereFacture) : null,
        derniereFacture: stats?.derniereFacture ? new Date(stats.derniereFacture) : null,
        commandesDetail: stats?.docs.map((d) => ({
          date: d.doc.created || null,
          montant: d.montant,
          ref: d.doc.number || d.doc.reference || null,
          type: d.type,
        })) || [],
      });
    }

    // 5. Bulk upsert ClientBoisDOrient — raw SQL pour performance (Supabase PgBouncer)
    const CLIENT_BATCH = 50;
    for (let i = 0; i < clientRecords.length; i += CLIENT_BATCH) {
      const batch = clientRecords.slice(i, i + CLIENT_BATCH);
      const esc = (s: string | null) => s ? s.replace(/'/g, "''") : "";
      const values = batch.map((c) => {
        const pf = c.premiereFacture ? `'${c.premiereFacture.toISOString()}'::timestamp` : "NULL";
        const df = c.derniereFacture ? `'${c.derniereFacture.toISOString()}'::timestamp` : "NULL";
        const detail = c.commandesDetail.length > 0 ? `'${JSON.stringify(c.commandesDetail).replace(/'/g, "''")}'::jsonb` : "NULL";
        return `(gen_random_uuid(), '${esc(c.sellsyIdBdo)}', '${esc(c.nom)}', '${esc(c.prenom)}', ${c.email ? `'${esc(c.email)}'` : "NULL"}, ${c.telephone ? `'${esc(c.telephone)}'` : "NULL"}, ${c.adresse ? `'${esc(c.adresse)}'` : "NULL"}, ${c.ville ? `'${esc(c.ville)}'` : "NULL"}, ${c.nbCommandes}, ${c.nbFactures}, ${c.nbDevis}, ${c.totalCA}, ${pf}, ${df}, ${detail}, 'NOUVEAU', NOW(), NOW())`;
      });
      await prisma.$executeRawUnsafe(`
        INSERT INTO "ClientBoisDOrient" (id, "sellsyIdBdo", nom, prenom, email, telephone, adresse, ville, "nbCommandes", "nbFactures", "nbDevis", "totalCA", "premiereFacture", "derniereFacture", "commandesDetail", statut, "createdAt", "updatedAt")
        VALUES ${values.join(",\n")}
        ON CONFLICT ("sellsyIdBdo") DO UPDATE SET
          nom = EXCLUDED.nom,
          prenom = EXCLUDED.prenom,
          email = EXCLUDED.email,
          telephone = EXCLUDED.telephone,
          adresse = EXCLUDED.adresse,
          ville = EXCLUDED.ville,
          "nbCommandes" = EXCLUDED."nbCommandes",
          "nbFactures" = EXCLUDED."nbFactures",
          "nbDevis" = EXCLUDED."nbDevis",
          "totalCA" = EXCLUDED."totalCA",
          "premiereFacture" = EXCLUDED."premiereFacture",
          "derniereFacture" = EXCLUDED."derniereFacture",
          "commandesDetail" = EXCLUDED."commandesDetail",
          "updatedAt" = NOW()
      `);
      console.log(`[BDO Extract] Clients ${i + batch.length}/${clientRecords.length}`);
    }

    // 6. Upsert DocumentBoisDOrient
    // On a besoin du clientBdoId pour chaque document -> charger les clients crees
    const allClients = await prisma.clientBoisDOrient.findMany({
      select: { id: true, sellsyIdBdo: true },
    });
    const clientIdMap = new Map<string, string>();
    for (const c of allClients) {
      if (c.sellsyIdBdo) clientIdMap.set(c.sellsyIdBdo, c.id);
    }

    let nbDocsUpserted = 0;
    const allDocs: { doc: SellsyBdoDocument; type: string; contactId: string }[] = [];

    for (const doc of invoices) {
      allDocs.push({ doc, type: "FACTURE", contactId: String(doc.related?.[0]?.id || "unknown") });
    }
    for (const doc of orders) {
      allDocs.push({ doc, type: "COMMANDE", contactId: String(doc.related?.[0]?.id || "unknown") });
    }
    for (const doc of estimates) {
      allDocs.push({ doc, type: "DEVIS", contactId: String(doc.related?.[0]?.id || "unknown") });
    }

    // Upsert documents via raw SQL par batch
    const DOC_BATCH_SIZE = 50;
    const filteredDocs = allDocs.filter((d) => clientIdMap.has(d.contactId));
    for (let i = 0; i < filteredDocs.length; i += DOC_BATCH_SIZE) {
      const batch = filteredDocs.slice(i, i + DOC_BATCH_SIZE);
      const esc = (s: string | null) => s ? s.replace(/'/g, "''") : "";
      const values = batch.map((d) => {
        const clientBdoId = clientIdMap.get(d.contactId)!;
        const sellsyDocId = String(d.doc.id);
        const montantTTC = Number(d.doc.amounts?.total_incl_tax) || 0;
        const montantHT = Number(d.doc.amounts?.total_excl_tax) || 0;
        const date = d.doc.created ? `'${new Date(d.doc.created).toISOString()}'::timestamp` : "NOW()";
        const refValue = d.doc.number || d.doc.reference || null;
        const ref = refValue ? `'${esc(refValue)}'` : "NULL";
        const statut = d.doc.status ? `'${esc(d.doc.status)}'` : "NULL";
        return `(gen_random_uuid(), '${esc(sellsyDocId)}', '${esc(clientBdoId)}', '${esc(d.type)}', ${ref}, ${date}, ${montantTTC}, ${montantHT}, ${statut}, NOW())`;
      });
      await prisma.$executeRawUnsafe(`
        INSERT INTO "DocumentBoisDOrient" (id, "sellsyDocId", "clientBdoId", type, reference, date, "montantTTC", "montantHT", statut, "createdAt")
        VALUES ${values.join(",\n")}
        ON CONFLICT ("sellsyDocId") DO UPDATE SET
          "clientBdoId" = EXCLUDED."clientBdoId",
          type = EXCLUDED.type,
          reference = EXCLUDED.reference,
          date = EXCLUDED.date,
          "montantTTC" = EXCLUDED."montantTTC",
          "montantHT" = EXCLUDED."montantHT",
          statut = EXCLUDED.statut
      `);
      nbDocsUpserted += batch.length;
      console.log(`[BDO Extract] Documents ${i + batch.length}/${filteredDocs.length}`);
    }

    // 7. Mettre a jour l'import
    await prisma.importBoisDOrient.update({
      where: { id: importRecord.id },
      data: {
        statut: "TERMINE",
        nbContactsTotal: clientRecords.length,
        nbDocuments: nbDocsUpserted,
        nbNouveaux: clientRecords.length,
      },
    });

    return NextResponse.json({
      success: true,
      importId: importRecord.id,
      individuals: individuals.length,
      companies: companies.length,
      totalContacts: clientRecords.length,
      invoices: invoices.length,
      orders: orders.length,
      estimates: estimates.length,
      documentsUpserted: nbDocsUpserted,
    });
  } catch (error: any) {
    console.error("[BDO Extract] Erreur:", error);

    await prisma.importBoisDOrient.update({
      where: { id: importRecord.id },
      data: {
        statut: "ERREUR",
        notes: error.message?.slice(0, 500) || "Erreur inconnue",
      },
    });

    return NextResponse.json(
      { error: error.message || "Erreur lors de l'extraction" },
      { status: 500 }
    );
  }
}
