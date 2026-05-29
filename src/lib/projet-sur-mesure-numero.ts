import { prisma } from "@/lib/prisma";

/**
 * Génère le prochain numéro de projet sur-mesure : SM-2026-XXXX
 * (même logique que les dossiers SAV).
 */
export async function genererNumeroProjet(): Promise<string> {
  const annee = new Date().getFullYear();
  const prefix = `SM-${annee}-`;

  const dernier = await prisma.projetSurMesure.findFirst({
    where: { numero: { startsWith: prefix } },
    orderBy: { numero: "desc" },
    select: { numero: true },
  });

  const sequence = dernier
    ? parseInt(dernier.numero.split("-")[2], 10) + 1
    : 1;

  return `${prefix}${String(sequence).padStart(4, "0")}`;
}
