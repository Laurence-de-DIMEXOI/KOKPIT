import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listEstimates, listOrders, listItems } from "@/lib/sellsy";
import { ESPACES, MENU_GENERAL, type NavItem } from "@/lib/nav-config";

// ===== Pages statiques depuis nav-config =====
function searchPages(query: string): { label: string; href: string; espace: string }[] {
  const q = query.toLowerCase();
  const results: { label: string; href: string; espace: string }[] = [];

  for (const espace of ESPACES) {
    if (espace.disabled) continue;
    for (const item of espace.menu) {
      if (item.label.toLowerCase().includes(q)) {
        results.push({ label: item.label, href: item.href, espace: espace.label });
      }
    }
  }

  for (const item of MENU_GENERAL) {
    if (item.label.toLowerCase().includes(q)) {
      results.push({ label: item.label, href: item.href, espace: "Général" });
    }
  }

  // Dédupliquer par href
  const seen = new Set<string>();
  return results.filter((r) => {
    if (seen.has(r.href)) return false;
    seen.add(r.href);
    return true;
  }).slice(0, 5);
}

// ===== Recherche Sellsy (filtre côté serveur sur données cachées) =====
async function searchSellsyEstimates(query: string) {
  try {
    const result = await listEstimates({ limit: 100, order: "created", direction: "desc" });
    const q = query.toLowerCase();
    return (result.data || [])
      .filter((e: any) =>
        (e.number || "").toLowerCase().includes(q) ||
        (e.reference || "").toLowerCase().includes(q) ||
        (e.subject || "").toLowerCase().includes(q) ||
        (e.company_name || "").toLowerCase().includes(q)
      )
      .slice(0, 5)
      .map((e: any) => ({
        id: e.id,
        number: e.number,
        subject: e.subject,
        company_name: e.company_name,
        status: e.status,
        total: e.amounts?.total || "0",
      }));
  } catch {
    return [];
  }
}

async function searchSellsyOrders(query: string) {
  try {
    const result = await listOrders({ limit: 100, order: "created", direction: "desc" });
    const q = query.toLowerCase();
    return (result.data || [])
      .filter((o: any) =>
        (o.number || "").toLowerCase().includes(q) ||
        (o.reference || "").toLowerCase().includes(q) ||
        (o.subject || "").toLowerCase().includes(q) ||
        (o.company_name || "").toLowerCase().includes(q)
      )
      .slice(0, 5)
      .map((o: any) => ({
        id: o.id,
        number: o.number,
        subject: o.subject,
        company_name: o.company_name,
        status: o.status,
        total: o.amounts?.total || "0",
      }));
  } catch {
    return [];
  }
}

async function searchSellsyProducts(query: string) {
  try {
    const result = await listItems({ limit: 100 });
    const q = query.toLowerCase();
    return (result.data || [])
      .filter((p: any) =>
        (p.name || "").toLowerCase().includes(q) ||
        (p.reference || "").toLowerCase().includes(q)
      )
      .slice(0, 5)
      .map((p: any) => ({
        id: p.id,
        name: p.name,
        reference: p.reference,
        unitAmount: p.unit_amount,
      }));
  } catch {
    return [];
  }
}

// GET /api/search?q=terme — Recherche globale
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ contacts: [], tasks: [], leads: [], estimates: [], orders: [], products: [], pages: [] });
  }

  try {
    // Lancer toutes les recherches en parallèle
    const [contacts, tasks, leads, estimates, orders, products] = await Promise.all([
      // Contacts Prisma
      prisma.contact.findMany({
        where: {
          OR: [
            { nom: { contains: q, mode: "insensitive" } },
            { prenom: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { telephone: { contains: q, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          nom: true,
          prenom: true,
          email: true,
          lifecycleStage: true,
        },
        take: 5,
        orderBy: { updatedAt: "desc" },
      }),

      // Tâches Prisma
      prisma.task.findMany({
        where: {
          OR: [
            { titre: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          titre: true,
          statut: true,
          echeance: true,
          assigneA: { select: { id: true, nom: true, prenom: true } },
        },
        take: 5,
        orderBy: { createdAt: "desc" },
      }),

      // Leads / Demandes Prisma
      prisma.lead.findMany({
        where: {
          OR: [
            { contact: { nom: { contains: q, mode: "insensitive" } } },
            { contact: { prenom: { contains: q, mode: "insensitive" } } },
            { contact: { email: { contains: q, mode: "insensitive" } } },
            { notes: { contains: q, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          statut: true,
          source: true,
          priorite: true,
          createdAt: true,
          contact: { select: { nom: true, prenom: true, email: true } },
        },
        take: 5,
        orderBy: { createdAt: "desc" },
      }),

      // Devis Sellsy
      searchSellsyEstimates(q),

      // Commandes Sellsy
      searchSellsyOrders(q),

      // Produits Sellsy
      searchSellsyProducts(q),
    ]);

    // Pages (statiques, pas async)
    const pages = searchPages(q);

    return NextResponse.json({ contacts, tasks, leads, estimates, orders, products, pages });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    console.error("GET /api/search error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
