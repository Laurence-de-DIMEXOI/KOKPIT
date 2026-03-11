import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Cache des articles pour le system prompt (évite de recharger à chaque message)
let articlesCache: { content: string; timestamp: number } | null = null;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

async function getArticlesContent(): Promise<string> {
  if (articlesCache && Date.now() - articlesCache.timestamp < CACHE_TTL) {
    return articlesCache.content;
  }

  const articles = await prisma.docArticle.findMany({
    where: { publie: true },
    orderBy: [{ categorie: "asc" }, { position: "asc" }],
    select: { titre: true, categorie: true, contenu: true },
  });

  const content = articles
    .map((a) => `## ${a.categorie} — ${a.titre}\n${a.contenu}`)
    .join("\n\n---\n\n");

  articlesCache = { content, timestamp: Date.now() };
  return content;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        reponse:
          "Le chatbot n'est pas encore configuré. Contactez l'administrateur pour ajouter la clé API Anthropic.",
      },
      { status: 200 }
    );
  }

  try {
    const body = await request.json();
    const { message, historique = [] } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message requis" },
        { status: 400 }
      );
    }

    // Récupérer la documentation pour le system prompt
    const docsContent = await getArticlesContent();

    const systemPrompt = `Tu es l'assistant expert de KOKPIT, le CRM interne de DIMEXOI (entreprise de mobilier à La Réunion).
Tu aides les utilisateurs à comprendre et utiliser KOKPIT.
Réponds UNIQUEMENT en te basant sur la documentation fournie.
Si tu ne sais pas, dis-le et suggère de contacter l'administrateur.
Réponds en français, de manière concise et pratique.
Texte simple, pas de markdown.
Maximum 3-4 phrases par réponse.

--- DOCUMENTATION KOKPIT ---
${docsContent}`;

    // Construire les messages pour l'API Anthropic
    const messages = [
      ...historique.slice(-8).map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
      { role: "user", content: message },
    ];

    // Appel API Anthropic
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 500,
        system: systemPrompt,
        messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Anthropic API error:", response.status, errorText);
      return NextResponse.json({
        reponse:
          "Désolé, je rencontre un problème technique. Veuillez réessayer dans quelques instants.",
      });
    }

    const data = await response.json();
    const reponse =
      data.content?.[0]?.text ||
      "Je n'ai pas pu générer de réponse. Veuillez reformuler votre question.";

    return NextResponse.json({ reponse });
  } catch (error: any) {
    console.error("POST /api/docs/chat error:", error);
    return NextResponse.json({
      reponse:
        "Une erreur est survenue. Veuillez réessayer ou contacter l'administrateur.",
    });
  }
}
