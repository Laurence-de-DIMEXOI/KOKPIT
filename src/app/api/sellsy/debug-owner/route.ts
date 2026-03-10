import { NextResponse } from "next/server";
import { listEstimates, listStaffs, getEstimate } from "@/lib/sellsy";

// GET /api/sellsy/debug-owner — Debug endpoint to see raw Sellsy fields
export async function GET() {
  try {
    // 1. Get one estimate via list (raw fields)
    const listRes = await listEstimates({ limit: 1 });
    const firstFromList = listRes.data[0] || null;

    // 2. Get same estimate via single GET (may have more fields)
    let singleEstimate = null;
    if (firstFromList) {
      try {
        const singleRes = await getEstimate(firstFromList.id);
        singleEstimate = singleRes.data || singleRes;
      } catch (e: any) {
        singleEstimate = { error: e.message };
      }
    }

    // 3. Get staffs
    let staffs;
    try {
      staffs = await listStaffs();
    } catch (e: any) {
      staffs = { error: e.message };
    }

    return NextResponse.json({
      listEstimate: {
        allKeys: firstFromList ? Object.keys(firstFromList) : [],
        owner_id: (firstFromList as any)?.owner_id,
        owner: (firstFromList as any)?.owner,
        _embed: (firstFromList as any)?._embed,
        // Show all top-level fields that contain "owner" or "staff" or "assign"
        ownerRelatedFields: firstFromList
          ? Object.entries(firstFromList).filter(([k]) =>
              /owner|staff|assign|respon/i.test(k)
            )
          : [],
        raw: firstFromList,
      },
      singleEstimate: {
        allKeys: singleEstimate && !singleEstimate.error ? Object.keys(singleEstimate) : [],
        owner_id: singleEstimate?.owner_id,
        owner: singleEstimate?.owner,
        _embed: singleEstimate?._embed,
        ownerRelatedFields: singleEstimate && !singleEstimate.error
          ? Object.entries(singleEstimate).filter(([k]) =>
              /owner|staff|assign|respon/i.test(k)
            )
          : [],
        raw: singleEstimate,
      },
      staffs,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
