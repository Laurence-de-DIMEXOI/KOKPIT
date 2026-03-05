import { NextResponse } from "next/server";

const SELLSY_BASE_URL = "https://api.sellsy.com/v2";
const SELLSY_TOKEN_URL = "https://login.sellsy.com/oauth2/access-tokens";

async function getToken() {
  const res = await fetch(SELLSY_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.SELLSY_CLIENT_ID || "",
      client_secret: process.env.SELLSY_CLIENT_SECRET || "",
    }),
  });
  const data = await res.json();
  return data.access_token;
}

async function sellsyGet(token: string, path: string) {
  try {
    const res = await fetch(`${SELLSY_BASE_URL}${path}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) {
      return { error: `${res.status} ${res.statusText}`, body: await res.text() };
    }
    return await res.json();
  } catch (e: any) {
    return { error: e.message };
  }
}

async function sellsyPost(token: string, path: string, body: any) {
  try {
    const res = await fetch(`${SELLSY_BASE_URL}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      return { error: `${res.status} ${res.statusText}`, body: await res.text() };
    }
    return await res.json();
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function GET() {
  try {
    const token = await getToken();

    // Test 1: Basic item list
    const items1 = await sellsyGet(token, "/items?limit=1");

    // Test 2: Items with embed stocks
    const items2 = await sellsyGet(token, "/items?limit=1&embed[]=stocks");

    // Test 3: Items with embed image
    const items3 = await sellsyGet(token, "/items?limit=1&embed[]=image");

    // Test 4: Items with all embeds
    const items4 = await sellsyGet(token, "/items?limit=1&embed[]=stocks&embed[]=image&embed[]=category");

    // Test 5: Single item with embeds (use first item id)
    const firstId = items1?.data?.[0]?.id;
    const singleItem = firstId
      ? await sellsyGet(token, `/items/${firstId}?embed[]=stocks&embed[]=image&embed[]=category`)
      : null;

    // Test 6: Search items (non-archived, product type only)
    const searchResult = await sellsyPost(token, "/items/search?limit=2&embed[]=stocks&embed[]=image&embed[]=category", {
      filters: {
        is_archived: false,
        type: ["product"],
      },
    });

    // Test 7: Try /stocks endpoint
    const stocks = await sellsyGet(token, "/stocks?limit=1");

    // Test 8: Try /warehouses endpoint
    const warehouses = await sellsyGet(token, "/warehouses?limit=5");

    return NextResponse.json({
      test1_basic: items1?.data?.[0] || items1,
      test2_embed_stocks: items2?.data?.[0] || items2,
      test3_embed_image: items3?.data?.[0] || items3,
      test4_all_embeds: items4?.data?.[0] || items4,
      test5_single_item: singleItem?.data || singleItem,
      test6_search_filtered: searchResult?.data?.[0] || searchResult,
      test7_stocks: stocks,
      test8_warehouses: warehouses,
      pagination: items1?.pagination,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
