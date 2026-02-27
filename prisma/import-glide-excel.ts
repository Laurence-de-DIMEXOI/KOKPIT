/**
 * Script d'import des données Glideapps depuis l'Excel "App Dimexoi.xlsx"
 * Onglet "Demande de prix"
 *
 * Usage: npx tsx prisma/import-glide-excel.ts <chemin-vers-fichier.xlsx>
 *
 * Ce script :
 * 1. Lit l'onglet "Demande de prix"
 * 2. Crée/met à jour les contacts (upsert par email)
 * 3. Crée les demandes de prix associées
 * 4. Met à jour les consentements (prend la valeur "true" si cochée au moins une fois)
 */

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";

const prisma = new PrismaClient();

// Minimal XLSX parser — reads the Excel via a child process with Python
async function readExcelSheet(
  filePath: string,
  sheetName: string
): Promise<Record<string, any>[]> {
  const { execSync } = require("child_process");

  const pythonScript = `
import json, sys
try:
    import openpyxl
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "openpyxl", "--break-system-packages", "-q"])
    import openpyxl

wb = openpyxl.load_workbook(sys.argv[1], read_only=True, data_only=True)
ws = wb[sys.argv[2]]
rows = list(ws.iter_rows(values_only=True))
if not rows:
    print("[]")
    sys.exit(0)
headers = [str(h) if h else f"col_{i}" for i, h in enumerate(rows[0])]
result = []
for row in rows[1:]:
    obj = {}
    for i, val in enumerate(row):
        if i < len(headers):
            if hasattr(val, 'isoformat'):
                obj[headers[i]] = val.isoformat()
            else:
                obj[headers[i]] = val
    result.append(obj)
print(json.dumps(result, ensure_ascii=False))
`;

  const tmpScript = "/tmp/read_excel.py";
  fs.writeFileSync(tmpScript, pythonScript);
  const output = execSync(
    `python3 ${tmpScript} "${filePath}" "${sheetName}"`,
    { maxBuffer: 100 * 1024 * 1024 }
  );
  return JSON.parse(output.toString());
}

function cleanPhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  return String(phone).replace(/\s+/g, "").replace(/^0/, "+262");
}

function cleanEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: npx tsx prisma/import-glide-excel.ts <fichier.xlsx>");
    process.exit(1);
  }

  console.log(`📂 Lecture de "${filePath}", onglet "Demande de prix"...`);
  const rows = await readExcelSheet(filePath, "Demande de prix");
  console.log(`📊 ${rows.length} lignes trouvées`);

  // Regrouper par email
  const contactMap = new Map<
    string,
    {
      nom: string;
      prenom: string;
      telephone: string | null;
      showroom: string | null;
      consentOffre: boolean;
      consentNewsletter: boolean;
      consentInvitation: boolean;
      consentDevis: boolean;
      demandes: {
        meuble: string;
        message: string | null;
        glideRowId: string | null;
        showroom: string | null;
        modePaiement: string | null;
        dateDemande: string | null;
      }[];
    }
  >();

  for (const row of rows) {
    const email = row["Adresse e-mail"];
    if (!email) continue;

    const key = cleanEmail(email);
    const existing = contactMap.get(key);

    const nom = String(row["Nom"] || "").trim();
    const prenom = String(row["Prénom"] || "").trim();
    const tel = cleanPhone(row["Numéro de téléphone"]);
    const showroom =
      row["Showroom"] && row["Showroom"] !== false
        ? String(row["Showroom"])
        : null;

    const offre = row["Offre"] === 1 || row["Offre"] === 1.0;
    const newsletter =
      row["Newsletter"] === 1 || row["Newsletter"] === 1.0;
    const invitation =
      row["Invitation"] === 1 || row["Invitation"] === 1.0;
    const devis = row["Devis"] === 1 || row["Devis"] === 1.0;

    const demande = {
      meuble: String(row["Meuble"] || "Non spécifié").trim(),
      message: row["Message"] ? String(row["Message"]).trim() : null,
      glideRowId: row["🔒 Row ID"] ? String(row["🔒 Row ID"]) : null,
      showroom,
      modePaiement: row["Mode de paiement"]
        ? String(row["Mode de paiement"])
        : null,
      dateDemande: row["DATE"] || null,
    };

    if (existing) {
      // Mettre à jour le téléphone et showroom s'ils sont plus récents
      if (tel && !existing.telephone) existing.telephone = tel;
      if (showroom && !existing.showroom) existing.showroom = showroom;
      // Consentements : prendre true si cochée au moins une fois
      if (offre) existing.consentOffre = true;
      if (newsletter) existing.consentNewsletter = true;
      if (invitation) existing.consentInvitation = true;
      if (devis) existing.consentDevis = true;
      existing.demandes.push(demande);
    } else {
      contactMap.set(key, {
        nom,
        prenom,
        telephone: tel,
        showroom,
        consentOffre: offre,
        consentNewsletter: newsletter,
        consentInvitation: invitation,
        consentDevis: devis,
        demandes: [demande],
      });
    }
  }

  console.log(`👤 ${contactMap.size} contacts uniques identifiés`);

  // Trouver ou créer les showrooms
  const showroomCache = new Map<string, string>();
  for (const [, data] of contactMap) {
    if (data.showroom && !showroomCache.has(data.showroom)) {
      const sr = await prisma.showroom.upsert({
        where: { nom: data.showroom },
        create: { nom: data.showroom },
        update: {},
      });
      showroomCache.set(data.showroom, sr.id);
    }
  }

  // Import contacts + demandes
  let created = 0;
  let updated = 0;
  let demandesCount = 0;

  for (const [email, data] of contactMap) {
    try {
      const contact = await prisma.contact.upsert({
        where: { email },
        create: {
          email,
          nom: data.nom,
          prenom: data.prenom || "",
          telephone: data.telephone,
          showroomId: data.showroom
            ? showroomCache.get(data.showroom)
            : undefined,
          sourcePremiere: "GLIDE",
          consentOffre: data.consentOffre,
          consentNewsletter: data.consentNewsletter,
          consentInvitation: data.consentInvitation,
          consentDevis: data.consentDevis,
        },
        update: {
          telephone: data.telephone || undefined,
          showroomId: data.showroom
            ? showroomCache.get(data.showroom)
            : undefined,
          consentOffre: data.consentOffre || undefined,
          consentNewsletter: data.consentNewsletter || undefined,
          consentInvitation: data.consentInvitation || undefined,
          consentDevis: data.consentDevis || undefined,
        },
      });

      if (contact.createdAt.getTime() === contact.updatedAt.getTime()) {
        created++;
      } else {
        updated++;
      }

      // Insérer les demandes de prix (upsert par glideRowId)
      for (const d of data.demandes) {
        if (d.glideRowId) {
          await prisma.demandePrix.upsert({
            where: { glideRowId: d.glideRowId },
            create: {
              contactId: contact.id,
              meuble: d.meuble,
              message: d.message,
              glideRowId: d.glideRowId,
              showroom: d.showroom,
              modePaiement: d.modePaiement,
              dateDemande: d.dateDemande ? new Date(d.dateDemande) : null,
            },
            update: {},
          });
        } else {
          await prisma.demandePrix.create({
            data: {
              contactId: contact.id,
              meuble: d.meuble,
              message: d.message,
              showroom: d.showroom,
              modePaiement: d.modePaiement,
              dateDemande: d.dateDemande ? new Date(d.dateDemande) : null,
            },
          });
        }
        demandesCount++;
      }
    } catch (err: any) {
      // Showroom upsert might fail if nom isn't unique — skip silently
      if (err.code !== "P2002") {
        console.error(`❌ Erreur pour ${email}:`, err.message);
      }
    }
  }

  console.log(`\n✅ Import terminé !`);
  console.log(`   📥 ${created} contacts créés`);
  console.log(`   🔄 ${updated} contacts mis à jour`);
  console.log(`   🛋️  ${demandesCount} demandes de prix importées`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
