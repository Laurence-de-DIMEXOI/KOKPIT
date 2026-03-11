import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const SEED_ARTICLES = [
  // ── Prise en main ──
  {
    titre: "Bienvenue sur KOKPIT",
    slug: "presentation-kokpit",
    categorie: "Prise en main",
    position: 0,
    contenu: `KOKPIT est le CRM interne de DIMEXOI, concu pour centraliser la gestion commerciale, marketing et administrative de l'entreprise.

## A quoi sert KOKPIT ?

- **Gestion commerciale** : suivi des devis, commandes, pipeline de vente, tracabilite
- **Marketing** : planning reseaux sociaux, campagnes email (Brevo), feed Instagram, liens utiles
- **Administration** : gestion des collaborateurs, conges et absences

## Les 3 espaces

KOKPIT est organise en 3 espaces accessibles depuis le bas de la sidebar :

1. **Commercial** (bleu) : tout le flux de vente, du lead a la commande
2. **Marketing** (jaune) : outils marketing, contenu, reseaux sociaux
3. **Administration** (vert) : RH, collaborateurs, conges

Chaque espace affiche un menu contextuel adapte a ses fonctionnalites.`,
  },
  {
    titre: "Se connecter et naviguer",
    slug: "connexion-navigation",
    categorie: "Prise en main",
    position: 1,
    contenu: `## Connexion

Rendez-vous sur l'URL de KOKPIT et connectez-vous avec votre email et mot de passe fournis par l'administrateur.

## Navigation

- **Sidebar gauche** : menu principal avec les pages de l'espace actif
- **Bas de la sidebar** : boutons pour changer d'espace (Commercial, Marketing, Administration)
- **Mobile** : cliquez sur l'icone hamburger en haut a gauche pour ouvrir le menu

## Changer d'espace

Cliquez sur un des boutons d'espace en bas de la sidebar. Le menu se met a jour automatiquement et vous etes redirige vers la page principale de cet espace.`,
  },
  {
    titre: "Les espaces et menus",
    slug: "espaces-menus",
    categorie: "Prise en main",
    position: 2,
    contenu: `## Espace Commercial

- **Dashboard** : KPIs de vente, objectifs, performance
- **Demandes** : leads et demandes entrantes
- **Contacts** : base de contacts clients/prospects
- **Pipeline Devis** : suivi des devis par statut (Kanban)
- **Commandes** : liste des commandes Sellsy
- **Tracabilite** : liaison devis vers commandes
- **Catalogue** : produits et tarifs Sellsy

## Espace Marketing

- **Tableau de bord** : KPIs marketing globaux
- **Campagnes** : suivi des campagnes pub (Meta, Google)
- **Emailing** : statistiques Brevo + synchronisation contacts
- **Planning** : planning editorial reseaux sociaux (Kanban)
- **Nos Reseaux** : liens sociaux + feed Instagram
- **Liens utiles** : bookmarks et outils externes
- **Automatisations** : workflows email automatises

## Espace Administration

- **Dashboard** : vue d'ensemble RH
- **Collaborateurs** : fiches employes
- **Conges & Absences** : demandes et suivi`,
  },
  // ── Commercial ──
  {
    titre: "Comprendre le pipeline de devis",
    slug: "pipeline-devis",
    categorie: "Commercial",
    position: 0,
    contenu: `Le pipeline de devis affiche tous les devis Sellsy organises par statut dans une vue Kanban.

## Les colonnes

- **Brouillon** : devis en preparation
- **Envoye** : devis transmis au client
- **Accepte** : devis valides par le client
- **Facture** : devis convertis en facture
- **Expire** : devis depasses sans reponse
- **Refuse** : devis refuses par le client

## Actions

- Cliquez sur un devis pour voir ses details
- Utilisez le lien "Voir sur Sellsy" pour acceder au document original
- Le lien PDF permet de telecharger le devis directement

## Filtres

Utilisez la barre de recherche pour filtrer par nom de client ou numero de devis.`,
  },
  {
    titre: "Gerer les devis et commandes",
    slug: "devis-commandes",
    categorie: "Commercial",
    position: 1,
    contenu: `## Devis

Les devis sont synchronises automatiquement depuis Sellsy. KOKPIT les affiche dans le Pipeline avec leur statut a jour.

Chaque devis affiche :
- Le numero et la reference
- Le client associe
- Le montant HT
- Le statut actuel
- La date de creation

## Commandes

La page Commandes liste toutes les commandes Sellsy avec possibilite de filtrer par periode (30j, 90j, 1 an, tout).

Les commandes affichent :
- Numero de commande
- Client
- Montant HT et TTC
- Date de commande
- Statut (brouillon, acceptee, livree, etc.)

## Rafraichir les donnees

Les donnees Sellsy sont mises en cache 3 minutes. Cliquez sur "Rafraichir" pour forcer un rechargement.`,
  },
  {
    titre: "Les contacts et clients",
    slug: "contacts-clients",
    categorie: "Commercial",
    position: 2,
    contenu: `## Base de contacts

La page Contacts centralise tous les contacts de la base KOKPIT : prospects, leads, clients actifs et inactifs.

## Informations affichees

- Nom, prenom, email, telephone
- Ville et code postal
- Stade du cycle de vie (Prospect, Lead, Client, Inactif)
- Score RFM (Recence, Frequence, Montant)

## Fiche contact

Cliquez sur un contact pour acceder a sa fiche detaillee :
- Historique des interactions
- Devis et commandes associes
- Notes et evenements
- Consentements RGPD

## Recherche

Utilisez la barre de recherche pour trouver un contact par nom, email ou telephone.`,
  },
  {
    titre: "La tracabilite devis - commandes",
    slug: "tracabilite",
    categorie: "Commercial",
    position: 3,
    contenu: `## Objectif

La page Tracabilite permet de lier manuellement les devis Sellsy aux commandes correspondantes, car l'API Sellsy ne fournit pas ce lien automatiquement.

## Les 3 onglets

1. **Devis convertis** : devis lies a une commande. Affiche l'ecart de montant entre devis et commande.
2. **Commandes directes** : commandes sans devis lie. Bouton "Lier a un devis" avec suggestions automatiques.
3. **Devis non convertis** : devis sans commande liee. Code couleur : vert (< 30j), orange (30-60j), rouge (> 60j).

## Creer une liaison

1. Allez dans l'onglet "Commandes directes" ou "Devis non convertis"
2. Cliquez sur "Lier" a cote de l'element
3. Selectionnez le devis ou la commande correspondante dans la liste
4. La liaison est creee instantanement

## Suggestions

KOKPIT suggere automatiquement des liaisons en se basant sur le meme contact et un montant proche (tolerance de 20%).`,
  },
  // ── Marketing ──
  {
    titre: "Le planning reseaux sociaux",
    slug: "planning-reseaux",
    categorie: "Marketing",
    position: 0,
    contenu: `## Vue Kanban

Le Planning est un tableau Kanban pour organiser les publications sur les reseaux sociaux.

## Les colonnes

- **Idee** : idees de contenu a developper
- **Pre-production** : contenu en cours de preparation
- **Visuel OK** : visuel valide
- **Texte OK** : texte/legende pret
- **Pret a poster** : publication prete a publier
- **Poste** : publication effectuee
- **Inspirations** : veille et inspirations
- **Couvertures FB** : couvertures Facebook

## Creer un post

1. Cliquez sur "+" dans la colonne souhaitee
2. Remplissez le titre et la description
3. Ajoutez des labels (piliers, parcours, canaux)
4. Definissez une date limite si necessaire
5. Ajoutez une checklist pour suivre les etapes
6. Uploadez une image de couverture si besoin

## Deplacer un post

Utilisez les boutons fleches dans la carte pour deplacer un post vers la colonne precedente ou suivante.`,
  },
  {
    titre: "Synchroniser les contacts vers Brevo",
    slug: "sync-brevo",
    categorie: "Marketing",
    position: 1,
    contenu: `## Objectif

La synchronisation permet de pousser des segments de contacts depuis la base KOKPIT vers Brevo (ex-Sendinblue) pour cibler les newsletters.

## Segments disponibles

- **Tous les contacts actifs** : tous les contacts avec un email valide
- **Clients recents (90 jours)** : contacts ayant une commande dans les 90 derniers jours
- **Prospects avec devis** : contacts avec un devis mais sans commande
- **Contacts sans achat** : contacts sans aucune commande

## Lancer une synchronisation

1. Rendez-vous sur la page **Emailing**
2. Dans la section "Synchronisation", cliquez sur "Synchroniser" pour le segment souhaite
3. Ou cliquez sur "Tout synchroniser" pour mettre a jour tous les segments

## Bonnes pratiques

- Synchronisez avant chaque envoi de newsletter pour avoir des listes a jour
- Les contacts sont en lecture seule dans Brevo : les modifications se font dans KOKPIT
- L'historique des synchros est visible en bas de la page Emailing`,
  },
  {
    titre: "Suivre les campagnes email",
    slug: "campagnes-email",
    categorie: "Marketing",
    position: 2,
    contenu: `## Page Emailing

La page Emailing affiche les statistiques de vos campagnes Brevo en temps reel.

## KPIs

- **Contacts Brevo** : nombre total de contacts dans votre compte
- **Taux d'ouverture moyen** : moyenne des 5 dernieres campagnes
- **Taux de clic moyen** : moyenne des 5 dernieres campagnes
- **Derniere campagne** : date de la derniere campagne envoyee

## Tableau des campagnes

Les 5 dernieres campagnes envoyees sont affichees avec :
- Nom de la campagne
- Date d'envoi
- Nombre de destinataires
- Taux d'ouverture (barre de progression)
- Taux de clic (barre de progression)

## Actualiser

Les donnees sont mises en cache 15 minutes. Cliquez sur "Rafraichir" pour forcer un rechargement.

## Creer une campagne

Pour creer une campagne, cliquez sur "Aller sur Brevo" qui vous redirige vers l'interface Brevo.`,
  },
  {
    titre: "Le feed Instagram",
    slug: "feed-instagram",
    categorie: "Marketing",
    position: 3,
    contenu: `## Page Nos Reseaux

La page Nos Reseaux affiche les liens vers vos profils sociaux et le dernier feed Instagram.

## Liens sociaux

3 cartes donnent un acces direct a :
- Instagram @dimexoi.re
- Facebook /dimexoi.re
- Google Business

## Feed Instagram

Les 12 derniers posts Instagram sont affiches en grille avec :
- Miniature du post (image ou thumbnail video)
- Badge de type (Video, Carrousel)
- Au survol : extrait de la legende + date

Cliquez sur un post pour l'ouvrir dans Instagram.

## Token Meta

Le feed necessite un token d'acces Meta valide. Des alertes apparaissent :
- **Orange** : le token expire dans moins de 10 jours
- **Rouge** : le token est expire (le feed ne se charge plus)

Contactez l'administrateur pour renouveler le token.`,
  },
  {
    titre: "Les liens utiles",
    slug: "liens-utiles",
    categorie: "Marketing",
    position: 4,
    contenu: `## Objectif

La page Liens Utiles centralise tous les outils et sites externes utilises par l'equipe.

## Fonctionnalites

- Les liens sont organises par categorie (CRM, Reseaux, CMS, Outils internes, etc.)
- Chaque lien affiche une icone (favicon), un nom et une description
- Cliquez pour ouvrir le lien dans un nouvel onglet

## Gestion (Admin)

Les administrateurs peuvent :
- Ajouter un nouveau lien (nom, URL, description, categorie)
- Modifier un lien existant
- Supprimer un lien
- Reorganiser l'ordre des liens`,
  },
  // ── Administration ──
  {
    titre: "Gerer les collaborateurs",
    slug: "collaborateurs",
    categorie: "Administration",
    position: 0,
    contenu: `## Page Collaborateurs

La page Collaborateurs liste tous les utilisateurs de KOKPIT avec leur role et showroom.

## Informations

Chaque collaborateur affiche :
- Nom et prenom
- Email
- Role (Admin, Marketing, Commercial, Direction)
- Showroom rattache
- Statut (actif/inactif)

## Roles

- **Admin** : acces total a toutes les fonctionnalites
- **Marketing** : acces aux espaces Marketing + leads/contacts
- **Commercial** : acces a l'espace Commercial + leads/contacts
- **Direction** : acces en lecture aux dashboards et KPIs de tous les espaces`,
  },
  {
    titre: "Les conges et absences",
    slug: "conges-absences",
    categorie: "Administration",
    position: 1,
    contenu: `## Page Conges & Absences

Cette page permet de gerer les demandes de conges et absences des collaborateurs.

## Fonctionnalites

- Vue calendrier des absences de l'equipe
- Demandes de conges avec validation
- Suivi des soldes de conges
- Historique des absences

## Types d'absence

- Conges payes
- RTT
- Maladie
- Conge sans solde
- Formation`,
  },
  {
    titre: "Les parametres",
    slug: "parametres",
    categorie: "Administration",
    position: 2,
    contenu: `## Page Parametres

La page Parametres permet de configurer KOKPIT selon vos besoins.

## Options disponibles

- **Profil** : modifier vos informations personnelles
- **Showrooms** : gestion des showrooms DIMEXOI
- **Integrations** : connexions API (Sellsy, Brevo, Meta)
- **Objectifs commerciaux** : definir les objectifs CA mensuels

## Acces

Seuls les administrateurs ont acces aux parametres avances (integrations, objectifs).`,
  },
];

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  try {
    let created = 0;
    let skipped = 0;

    for (const article of SEED_ARTICLES) {
      const existing = await prisma.docArticle.findUnique({
        where: { slug: article.slug },
      });

      if (existing) {
        skipped++;
        continue;
      }

      await prisma.docArticle.create({
        data: article,
      });
      created++;
    }

    return NextResponse.json({
      success: true,
      created,
      skipped,
      total: SEED_ARTICLES.length,
    });
  } catch (error: any) {
    console.error("POST /api/docs/seed error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur seed" },
      { status: 500 }
    );
  }
}
