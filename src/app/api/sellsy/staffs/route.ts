import { NextResponse } from "next/server";
import { listStaffs } from "@/lib/sellsy";

let cached: { data: Array<{ id: number; name: string }>; ts: number } | null = null;
const TTL = 30 * 60 * 1000; // 30 min

export async function GET() {
  try {
    if (cached && Date.now() - cached.ts < TTL) {
      return NextResponse.json({ staffs: cached.data });
    }

    const staffs = await listStaffs();
    const mapped = staffs.map((s) => ({
      id: s.id,
      name: `${s.firstname} ${s.lastname}`.trim(),
    }));

    cached = { data: mapped, ts: Date.now() };
    return NextResponse.json({ staffs: mapped });
  } catch (error: unknown) {
    console.error("GET /api/sellsy/staffs error:", error);
    return NextResponse.json({ staffs: [] });
  }
}
