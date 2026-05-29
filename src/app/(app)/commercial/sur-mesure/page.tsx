import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessModule, type Role } from "@/lib/auth-utils";
import { SurMesureClient } from "./_components/sur-mesure-client";

export const dynamic = "force-dynamic";

export default async function SurMesurePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const role = (session.user as { role?: string }).role as Role;
  const overrides = (session.user as { moduleAccessOverrides?: Record<string, boolean> }).moduleAccessOverrides;
  if (!canAccessModule(role, "sur-mesure", overrides)) {
    redirect("/");
  }

  // Liste des dessinateurs/commerciaux pour l'assignation
  const users = await prisma.user.findMany({
    where: { actif: true, role: { in: ["COMMERCIAL", "ADMIN", "DIRECTION", "ACHAT"] } },
    select: { id: true, prenom: true, nom: true, role: true },
    orderBy: { prenom: "asc" },
  });

  // Vue par défaut selon le user (Laurent → dessin, Elaury → need price)
  const email = session.user.email || "";
  let vueDefaut: "all" | "dessin" | "needprice" = "all";
  if (email === "laurent@dimexoi.fr") vueDefaut = "dessin";
  else if (email === "elaury.decaunes@dimexoi.fr") vueDefaut = "needprice";

  return (
    <SurMesureClient
      users={users}
      vueDefaut={vueDefaut}
      currentUserId={(session.user as { id?: string }).id || ""}
    />
  );
}
