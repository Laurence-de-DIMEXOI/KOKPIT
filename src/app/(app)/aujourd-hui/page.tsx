import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessDailyBriefing } from "@/lib/daily-briefing-access";
import { DailyBriefingClient } from "./_components/daily-briefing-client";

export const dynamic = "force-dynamic";

export default async function DailyBriefingPage() {
  const session = await getServerSession(authOptions);
  const access = await canAccessDailyBriefing(session);
  if (!access.allowed) {
    redirect("/");
  }

  const userId = (session!.user as { id?: string }).id!;
  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: { prenom: true, nom: true, role: true },
  });
  const prenom = me?.prenom || "";

  // En mode aggregated : récupérer la liste des éligibles pour toggle
  let toggleOptions:
    | Array<{ id: string; label: string }>
    | null = null;
  if (access.mode === "aggregated") {
    const eligibles = await prisma.user.findMany({
      where: { dailyBriefingEligible: true, actif: true },
      select: { id: true, prenom: true, nom: true },
      orderBy: { prenom: "asc" },
    });
    toggleOptions = [
      { id: "all", label: "Tous" },
      ...eligibles.map((u) => ({ id: u.id, label: u.prenom })),
    ];
  }

  return (
    <DailyBriefingClient
      prenom={prenom}
      mode={access.mode!}
      toggleOptions={toggleOptions}
    />
  );
}
