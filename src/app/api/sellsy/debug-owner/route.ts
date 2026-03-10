import { NextResponse } from "next/server";
import { listEstimates, listStaffs, getEstimate } from "@/lib/sellsy";

// GET /api/sellsy/debug-owner — Debug endpoint to see raw Sellsy fields
export async function GET() {
  try {
    // 1. Get one estimate via list (raw fields)
    const listRes = await listEstimates({ limit: 1 });
    const firstFromList = listRes.data[0] || null;
    const rawList = firstFromList as Record<string, unknown> | null;

    // 2. Get same estimate via single GET (may have more fields)
    let rawSingle: Record<string, unknown> | null = null;
    if (firstFromList) {
      try {
        const singleRes = await getEstimate(firstFromList.id);
        rawSingle = (singleRes.data || singleRes) as Record<string, unknown>;
      } catch (e: any) {
        rawSingle = { error: e.message };
      }
    }

    // 3. Get staffs
    let staffs: unknown;
    try {
      staffs = await listStaffs();
    } catch (e: any) {
      staffs = { error: e.message };
    }

    return NextResponse.json({
      listEstimate: {
        allKeys: rawList ? Object.keys(rawList) : [],
        owner_id: rawList?.owner_id,
        owner: rawList?.owner,
        _embed: rawList?._embed,
        ownerRelatedFields: rawList
          ? Object.entries(rawList).filter(([k]) =>
              /owner|staff|assign|respon/i.test(k)
            )
          : [],
        raw: rawList,
      },
      singleEstimate: {
        allKeys: rawSingle && !rawSingle.error ? Object.keys(rawSingle) : [],
        owner_id: rawSingle?.owner_id,
        owner: rawSingle?.owner,
        _embed: rawSingle?._embed,
        ownerRelatedFields: rawSingle && !rawSingle.error
          ? Object.entries(rawSingle).filter(([k]) =>
              /owner|staff|assign|respon/i.test(k)
            )
          : [],
        raw: rawSingle,
      },
      staffs,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
