#!/usr/bin/env node

/**
 * Generate TypeScript data files from JSON
 * This script runs during Vercel build to ensure data files exist
 */

const fs = require('fs');
const path = require('path');

const DATA_JSON_PATH = path.join(__dirname, '../src/data/contact-data.json');
const CONTACTS_TS_PATH = path.join(__dirname, '../src/data/contacts.ts');
const DETAILS_TS_PATH = path.join(__dirname, '../src/data/contact-details.ts');

try {
  // Read the JSON data
  if (!fs.existsSync(DATA_JSON_PATH)) {
    console.error('❌ contact-data.json not found. Data files will not be generated.');
    process.exit(0); // Don't fail the build, just skip generation
  }

  const data = JSON.parse(fs.readFileSync(DATA_JSON_PATH, 'utf8'));
  const { contacts, details } = data;

  // Generate contacts.ts
  const contactsTsContent = `export const contactsData = ${JSON.stringify(contacts, null, 2)};
`;

  // Generate contact-details.ts with interface
  const detailsTsContent = `export interface ContactDetails {
  consents: {
    offre: boolean;
    newsletter: boolean;
    invitation: boolean;
    devis: boolean;
  };
  requests: {
    meuble: string;
    date: string | null;
    message: string | null;
  }[];
}

export const contactDetailsData: Record<string, ContactDetails> = ${JSON.stringify(details, null, 2)};
`;

  // Write files
  fs.writeFileSync(CONTACTS_TS_PATH, contactsTsContent);
  console.log('✅ Generated: src/data/contacts.ts');

  fs.writeFileSync(DETAILS_TS_PATH, detailsTsContent);
  console.log('✅ Generated: src/data/contact-details.ts');

  console.log('✅ Data files generated successfully');
} catch (error) {
  console.error('❌ Error generating data files:', error.message);
  // Don't fail the build - these files might already exist
  process.exit(0);
}
