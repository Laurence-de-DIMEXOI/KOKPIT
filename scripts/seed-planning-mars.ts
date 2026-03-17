/**
 * Seed — Cartes Planning Mars 2026
 * Exécuté le 17/03/2026 via Supabase MCP (SQL direct).
 * Ce fichier est conservé pour documentation et re-seed éventuel.
 *
 * Usage (si besoin de re-exécuter) :
 *   npx tsx scripts/seed-planning-mars.ts
 *
 * IMPORTANT : le script vérifie si les cartes existent déjà avant d'insérer.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CREATED_BY_ID = "cladmin001"; // Système Admin

const cartesMars2026 = [
  {
    title: 'Post "Votre avis compte"',
    description:
      "Appel à laisser un Google Review — mentionner les deux showrooms SUD (Saint-Pierre) et NORD (Sainte-Suzanne). Format : visuel + texte d'accroche. CTA : lien Google Maps des deux showrooms.",
    label: "AVIS_CLIENTS" as const,
    scheduledDate: new Date("2026-03-17"),
  },
  {
    title: "Email Brevo — Teaser Club Dimexoi",
    description:
      'Annoncer le lancement prochain du programme de fidélité "Club Dimexoi". Email courts, ton chaleureux, CTA vers le site. Segment : tous les contacts actifs.',
    label: "EMAIL_BREVO" as const,
    scheduledDate: new Date("2026-03-18"),
  },
  {
    title: "Réel — Visite guidée showroom SUD",
    description:
      "Vidéo 20-25 secondes. Marche dans le showroom de Saint-Pierre, lumière naturelle, musique douce en fond (pas de voix off). Montrer : entrée, salon, salle de bains. Terminer sur un meuble phare.",
    label: "VIDEO_REEL" as const,
    scheduledDate: new Date("2026-03-19"),
  },
  {
    title: "Story — Témoignage client existant",
    description:
      "Reprendre un avis Google existant (5 étoiles). Mettre en forme graphique : fond bois/naturel, citation en typographie lisible, prénom + ville du client. Partager en Story Instagram.",
    label: "STORY" as const,
    scheduledDate: new Date("2026-03-21"),
  },
  {
    title: "Article blog — Entretien du bois exotique",
    description:
      'Article SEO 800-1000 mots. Mot-clé cible : "entretien meuble bois exotique Réunion". Sections : types de bois (teck, sipo…), produits recommandés, fréquence, précautions climat tropical. Lien interne vers catalogue.',
    label: "BLOG_SEO" as const,
    scheduledDate: new Date("2026-03-22"),
  },
  {
    title: "Post — Lancement officiel Club Dimexoi",
    description:
      "Annonce officielle du programme de fidélité. Présenter les avantages (ex : -5% sur prochain devis, avant-premières nouvelles collections, invitations événements). Expliquer comment s'inscrire. Visuels : logo du programme + palette bois.",
    label: "FIDELISATION" as const,
    scheduledDate: new Date("2026-03-24"),
  },
  {
    title: "Réel — Focus matière : finitions bois",
    description:
      "Vidéo gros plan 10-15s sur une finition (cérusé blanc, miel, brut ou antique). Lumière rasante pour faire ressortir la texture. Aucun texte à l'écran pendant la vidéo — légende Instagram uniquement.",
    label: "VIDEO_REEL" as const,
    scheduledDate: new Date("2026-03-25"),
  },
  {
    title: 'Carrousel — "Ils nous ont fait confiance"',
    description:
      'Carrousel 4-5 slides Instagram. Slide 1 : titre. Slides 2-4 : un avis client par slide (citation + note + prénom). Slide 5 : CTA "Venez nous rencontrer" + adresses showrooms.',
    label: "AVIS_CLIENTS" as const,
    scheduledDate: new Date("2026-03-26"),
  },
  {
    title: "Teasing #1 — Meuble de retour mi-avril",
    description:
      'Post teaser mystère. Photo floue ou silhouette d\'un meuble qui revient en stock mi-avril. Texte : "Il revient… mi-avril. Tu le reconnais ?" Objectif : créer de l\'attente.',
    label: "TEASING_AVRIL" as const,
    scheduledDate: new Date("2026-03-27"),
  },
  {
    title: "Story interactif — Sondage pièce préférée",
    description:
      'Story Instagram avec sticker sondage. Question : "Quelle pièce vous donne le plus envie de rénover ?" Options : Salle de bains / Chambre / Salon / Extérieur. Republier les résultats en J+1.',
    label: "STORY" as const,
    scheduledDate: new Date("2026-03-28"),
  },
  {
    title: "Réel — Ambiance showroom NORD",
    description:
      "Vidéo 20-25s showroom de Sainte-Suzanne. Ambiance week-end : montrer l'équipe (si accord), les meubles en situation de vie, la lumière du showroom. Même format que le Réel SUD du 19 mars.",
    label: "VIDEO_REEL" as const,
    scheduledDate: new Date("2026-03-29"),
  },
  {
    title: "Post rappel — Avis Google (rappel doux)",
    description:
      'Rappel non intrusif pour les avis. Ton : "Vous avez visité nos showrooms récemment ? Votre avis nous aide énormément 🌟". Pas de pression, ton chaleureux.',
    label: "AVIS_CLIENTS" as const,
    scheduledDate: new Date("2026-03-30"),
  },
  {
    title: "Post récap mars + teasing avril",
    description:
      'Bilan du mois de mars (ton positif, pas de chiffres internes). Annonce : "Quelque chose d\'excitant arrive en avril — restez connectés." Teaser visuel sobre.',
    label: "TEASING_AVRIL" as const,
    scheduledDate: new Date("2026-03-31"),
  },
];

async function main() {
  // Vérifier si déjà seedé
  const existing = await prisma.postPlanning.count({
    where: {
      scheduledDate: { gte: new Date("2026-03-01"), lt: new Date("2026-04-01") },
    },
  });

  if (existing > 0) {
    console.log(`⏭️  ${existing} cartes Mars 2026 déjà en base. Seed ignoré.`);
    return;
  }

  for (let i = 0; i < cartesMars2026.length; i++) {
    const carte = cartesMars2026[i];
    await prisma.postPlanning.create({
      data: {
        title: carte.title,
        description: carte.description,
        statut: "IDEE",
        position: (i + 1) * 1000,
        labels: [carte.label],
        scheduledDate: carte.scheduledDate,
        createdById: CREATED_BY_ID,
      },
    });
  }

  console.log(`✅ ${cartesMars2026.length} cartes Mars 2026 injectées.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
