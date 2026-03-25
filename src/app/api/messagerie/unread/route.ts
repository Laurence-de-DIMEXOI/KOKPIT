import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get unread counts per channel
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  const userId = session.user.id;

  const results = await prisma.$queryRaw<
    { canalId: string; count: number }[]
  >`
    SELECT cm."canalId", COUNT(m.id)::int as count
    FROM "CanalMembre" cm
    LEFT JOIN "MessageChat" m
      ON m."canalId" = cm."canalId"
      AND m."createdAt" > cm."dernierLu"
      AND m."expediteurId" != ${userId}
    WHERE cm."userId" = ${userId}
    GROUP BY cm."canalId"
  `;

  const parCanal: Record<string, number> = {};
  let total = 0;

  for (const row of results) {
    parCanal[row.canalId] = row.count;
    total += row.count;
  }

  return NextResponse.json({ total, parCanal });
}
