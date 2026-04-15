import { NextRequest, NextResponse } from "next/server";
import { getDeclination } from "@/lib/sellsy";

// GET /api/sellsy/declinations/[declId] — récupère une déclinaison seule (prix TTC inclus)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ declId: string }> }
) {
  try {
    const { declId } = await params;
    const id = Number(declId);
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: "Invalid declId" }, { status: 400 });
    }
    const result = await getDeclination(id);
    const declination = (result as any).data ?? result;
    return NextResponse.json({ success: true, declination });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
