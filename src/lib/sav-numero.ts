import { prisma } from "@/lib/prisma";

export async function genererNumeroDossier(): Promise<string> {
  const annee = new Date().getFullYear();
  const prefix = `SAV-${annee}-`;

  const dernierDossier = await prisma.dossierSAV.findFirst({
    where: { numero: { startsWith: prefix } },
    orderBy: { numero: "desc" },
    select: { numero: true },
  });

  const sequence = dernierDossier
    ? parseInt(dernierDossier.numero.split("-")[2], 10) + 1
    : 1;

  return `${prefix}${String(sequence).padStart(4, "0")}`;
}
