/**
 * Debug ciblé v2 : item EFWS 283
 * itemId = 10695645 | declinationId = 2238806
 * Usage : npx tsx scripts/debug-sellsy-efws283.ts
 */
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

import { sellsyV1Call } from "@/lib/sellsy";

const ITEM_ID = 10695645;
const KNOWN_DECL_ID = 2238806;

function divider(t: string) {
  console.log(`\n${"=".repeat(70)}\n  ${t}\n${"=".repeat(70)}`);
}

async function tryCall(label: string, method: string, params: Record<string, unknown>) {
  divider(`${label} — ${method} ${JSON.stringify(params)}`);
  try {
    const res = await sellsyV1Call(method, params);
    console.log(JSON.stringify(res, null, 2).slice(0, 4000));
  } catch (e: any) {
    console.error("❌", e?.message || e);
  }
}

async function main() {
  // Variations avec itemid
  await tryCall("A", "Catalogue.getVariations", { itemid: ITEM_ID, type: "item" });
  await tryCall("B", "Catalogue.getVariations", { itemid: ITEM_ID });

  // Variation singulier avec itemid + id (decl)
  await tryCall("C", "Catalogue.getVariation", { itemid: ITEM_ID, id: KNOWN_DECL_ID });

  // Prices avec declid
  await tryCall("D", "Catalogue.getPrices", { id: ITEM_ID, type: "item", declid: KNOWN_DECL_ID });

  // getOne sans includeDeclinations pour voir la structure standard
  await tryCall("E", "Catalogue.getOne", { type: "item", id: ITEM_ID });

  // Autres variantes fréquentes
  await tryCall("F", "Catalogue.getSubItems", { itemid: ITEM_ID });
  await tryCall("G", "Catalogue.getDeclinations", { itemid: ITEM_ID });
}

main().catch(console.error);
