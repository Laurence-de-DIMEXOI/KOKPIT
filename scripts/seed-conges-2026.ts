/**
 * seed-conges-2026.ts
 *
 * Imports the 2026 leave calendar data (congés payés) into the database.
 * Idempotent: checks by userId + dateDebut before creating.
 *
 * Usage:
 *   npx tsx scripts/seed-conges-2026.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Count weekdays (Mon-Fri) between two dates, inclusive.
 */
/**
 * Count working days (Tue-Sat) between two dates, inclusive.
 * DIMEXOI works Tuesday to Saturday.
 */
function countWeekdays(start: Date, end: Date): number {
  let count = 0;
  const current = new Date(start);
  while (current <= end) {
    const day = current.getDay();
    // DIMEXOI : mardi (2) au samedi (6). Repos = dimanche (0) + lundi (1)
    if (day !== 0 && day !== 1) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
}

/**
 * Create a UTC date for a given year/month/day (months are 1-indexed here).
 */
function d(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

// ---------------------------------------------------------------------------
// Leave data
// ---------------------------------------------------------------------------

interface LeavePeriod {
  dateDebut: Date;
  dateFin: Date;
}

interface CollaborateurLeave {
  nom: string;
  prenom: string;
  periods: LeavePeriod[];
}

const LEAVE_DATA: CollaborateurLeave[] = [
  {
    nom: 'Robert',
    prenom: 'Bernard',
    periods: [
      { dateDebut: d(2026, 1, 19), dateFin: d(2026, 1, 23) },
      { dateDebut: d(2026, 4, 20), dateFin: d(2026, 4, 24) },
      { dateDebut: d(2026, 7, 20), dateFin: d(2026, 7, 31) },
      { dateDebut: d(2026, 8, 3), dateFin: d(2026, 8, 14) },
    ],
  },
  {
    nom: 'Folio',
    prenom: 'Daniella',
    periods: [
      { dateDebut: d(2026, 4, 20), dateFin: d(2026, 4, 24) },
      { dateDebut: d(2026, 7, 6), dateFin: d(2026, 7, 17) },
      { dateDebut: d(2026, 8, 24), dateFin: d(2026, 8, 28) },
      { dateDebut: d(2026, 12, 21), dateFin: d(2026, 12, 31) },
    ],
  },
  {
    nom: 'Decaunes',
    prenom: 'Elaury',
    periods: [
      { dateDebut: d(2026, 3, 30), dateFin: d(2026, 4, 3) },
      { dateDebut: d(2026, 6, 15), dateFin: d(2026, 6, 19) },
      { dateDebut: d(2026, 8, 10), dateFin: d(2026, 8, 21) },
      { dateDebut: d(2026, 11, 23), dateFin: d(2026, 11, 27) },
    ],
  },
  {
    nom: 'Morel',
    prenom: 'Georget',
    periods: [
      { dateDebut: d(2026, 1, 19), dateFin: d(2026, 1, 28) },
      { dateDebut: d(2026, 4, 20), dateFin: d(2026, 4, 30) },
      { dateDebut: d(2026, 7, 21), dateFin: d(2026, 8, 14) },
      { dateDebut: d(2026, 9, 7), dateFin: d(2026, 9, 11) },
    ],
  },
  {
    nom: 'Batisse',
    prenom: 'Laurent',
    periods: [
      { dateDebut: d(2026, 2, 16), dateFin: d(2026, 2, 20) },
      { dateDebut: d(2026, 5, 25), dateFin: d(2026, 5, 29) },
      { dateDebut: d(2026, 8, 3), dateFin: d(2026, 8, 14) },
      { dateDebut: d(2026, 10, 12), dateFin: d(2026, 10, 16) },
    ],
  },
  {
    nom: 'Payet',
    prenom: 'Laurence',
    periods: [
      { dateDebut: d(2026, 4, 6), dateFin: d(2026, 4, 10) },
      { dateDebut: d(2026, 7, 6), dateFin: d(2026, 7, 17) },
      { dateDebut: d(2026, 10, 26), dateFin: d(2026, 10, 30) },
      { dateDebut: d(2026, 12, 28), dateFin: d(2026, 12, 31) },
    ],
  },
  {
    nom: 'Perrot',
    prenom: 'Michelle',
    periods: [
      { dateDebut: d(2026, 3, 16), dateFin: d(2026, 3, 20) },
      { dateDebut: d(2026, 6, 22), dateFin: d(2026, 6, 26) },
      { dateDebut: d(2026, 9, 14), dateFin: d(2026, 9, 18) },
      { dateDebut: d(2026, 11, 2), dateFin: d(2026, 11, 6) },
    ],
  },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log('=== Seed Congés 2026 ===\n');

  const summary: { name: string; created: number; skipped: number }[] = [];
  let totalCreated = 0;

  for (const collab of LEAVE_DATA) {
    // Look up user by nom (case-insensitive)
    const user = await prisma.user.findFirst({
      where: {
        nom: {
          equals: collab.nom,
          mode: 'insensitive',
        },
      },
    });

    if (!user) {
      console.warn(`[WARN] User not found: "${collab.nom}" - skipping all periods.`);
      summary.push({ name: collab.nom, created: 0, skipped: collab.periods.length });
      continue;
    }

    let created = 0;
    let skipped = 0;

    for (const period of collab.periods) {
      // Check idempotency: does a Conge already exist for this user + dateDebut?
      const existing = await prisma.conge.findFirst({
        where: {
          userId: user.id,
          dateDebut: period.dateDebut,
        },
      });

      if (existing) {
        console.log(
          `  [SKIP] ${collab.nom}: ${period.dateDebut.toISOString().slice(0, 10)} already exists (id: ${existing.id})`
        );
        skipped++;
        continue;
      }

      const nbJours = countWeekdays(period.dateDebut, period.dateFin);

      await prisma.conge.create({
        data: {
          userId: user.id,
          type: 'conge_paye',
          statut: 'approuve',
          dateDebut: period.dateDebut,
          dateFin: period.dateFin,
          nbJours,
          notes: 'Import calendrier congés 2026',
        },
      });

      console.log(
        `  [OK]   ${collab.nom}: ${period.dateDebut.toISOString().slice(0, 10)} -> ${period.dateFin.toISOString().slice(0, 10)} (${nbJours}j)`
      );
      created++;
      totalCreated++;
    }

    summary.push({ name: collab.nom, created, skipped });
  }

  // Print summary
  console.log('\n=== Summary ===\n');
  for (const s of summary) {
    console.log(`  ${s.name}: ${s.created} created, ${s.skipped} skipped`);
  }
  console.log(`\n  Total created: ${totalCreated}`);
  console.log('\nDone.');
}

main()
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
