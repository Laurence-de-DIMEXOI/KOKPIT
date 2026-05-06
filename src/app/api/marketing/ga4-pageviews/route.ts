import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPageViewsByPath } from "@/lib/ga4";

/**
 * GET /api/marketing/ga4-pageviews?path=teckdays&since=30daysAgo&until=today
 *
 * Retourne les vues + utilisateurs uniques pour une page (filtre substring sur pagePath).
 * Réservé ADMIN/DIRECTION/Laurence.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  const email = session?.user?.email;
  if (
    !session?.user ||
    (email !== "laurence.payet@dimexoi.fr" &&
      email !== "admin@kokpit.re" &&
      !["ADMIN", "DIRECTION"].includes(role))
  ) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const url = new URL(req.url);
  const path = url.searchParams.get("path") || "teckdays";
  const since = url.searchParams.get("since") || "30daysAgo";
  const until = url.searchParams.get("until") || "today";

  const data = await getPageViewsByPath(path, since, until);

  if (!data) {
    return NextResponse.json(
      {
        error:
          "GA4 indisponible : vérifie GA4_PROPERTY_ID + GA4_SERVICE_ACCOUNT_JSON dans Vercel env",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    path,
    period: { since, until },
    total: data.total,
    users: data.users,
    pages: data.pages,
  });
}
