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
- **Marketing** : planning reseaux sociaux, campagnes email (Brevo), ROI publicitaire, liens utiles
- **Administration** : gestion des collaborateurs, conges, pointage
- **SAV / Litiges** : suivi des dossiers clients

## Les 4 espaces

KOKPIT est organise en 4 espaces accessibles depuis la topbar :

1. **Commercial** (teal) : tout le flux de vente, du lead a la commande, SAV
2. **Marketing** (raspberry) : outils marketing, contenu, reseaux sociaux, ROI
3. **Administration** (bronze) : RH, collaborateurs, conges, pointage
4. **Achat** (cerise) : commandes, catalogue, SAV

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
- **SAV — Litiges** : dossiers clients avec documents et commentaires
- **Catalogue** : produits et tarifs Sellsy avec codes-barres

## Espace Marketing

- **Tableau de bord** : KPIs marketing globaux
- **Campagnes** : suivi des campagnes pub (Meta)
- **Emailing** : statistiques Brevo + synchronisation contacts
- **Planning** : planning editorial reseaux sociaux (Kanban + Calendrier)
- **Operations** : opérations marketing à venir (promos, lancements)
- **ROI Marketing** : analyse CA vs depenses, ROAS, CAC

## Espace Administration

- **Dashboard** : vue d'ensemble RH
- **Collaborateurs** : fiches employes
- **Conges & Absences** : demandes, validation, calendrier annuel
- **Pointage** : suivi horaires (arrivee, pause, depart)
- **Pointage Equipe** : vue manager avec corrections et export CSV
- **Parametres** : config SLA, pointage, roles

## General (toujours visible)

- **Mes Taches** : taches a faire (auto-creees par SLA et conges)
- **Club Tectona** : programme de fidelite 5 niveaux
- **Liens utiles** : bookmarks et outils externes
- **Docs & Aide** : cette documentation + chatbot IA`,
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

La page Collaborateurs liste tous les membres de l'equipe DIMEXOI.

## Les 4 roles

- **Admin** (Michelle, Liliane, Alain) : acces complet. Michelle valide les conges et peut pointer pour Georget
- **Marketing** (Laurence) : tout le marketing, leads, contacts, planning. Pas d'acces au pointage equipe
- **Commercial** (Bernard, Daniella, Laurent) : pipeline, commandes, SAV, contacts + conges et pointage personnel
- **Achat** (Elaury) : commandes, SAV, catalogue + conges et pointage personnel

## Modifier un collaborateur

Cliquez sur un collaborateur pour voir sa fiche. Seul un Admin peut changer le role d'un utilisateur.`,
  },
  {
    titre: "Les conges et absences",
    slug: "conges-absences",
    categorie: "Administration",
    position: 1,
    contenu: `## Faire une demande de conge

1. Allez dans **Administration > Conges & Absences**
2. Cliquez sur **Nouvelle demande** (bouton orange en haut a droite)
3. Selectionnez le collaborateur (un Admin peut demander pour un autre)
4. Choisissez le type : Conge paye, RTT, Sans solde, ou Maladie
5. Renseignez jusqu'a 4 periodes (date debut et date fin)
6. Ajoutez des observations si besoin
7. Cliquez sur **Soumettre**

La demande passe en statut "En attente". Une tache automatique est creee pour Michelle pour la valider.

## Valider ou refuser (Admin)

Dans l'onglet "En attente", cliquez sur le bouton vert (approuver) ou rouge (refuser) a cote de chaque demande. Vous pouvez ajouter un commentaire.

## Le calendrier

Le calendrier annuel affiche tous les conges approuves, colores par collaborateur. Les zones rouges sont les periodes non recommandees (forte activite).

## Regles

- Repos : dimanche + lundi. Jours travailles : mardi a samedi
- Duree max consecutive : 3 semaines (15 jours ouvres)
- Solde annuel : 25 jours de CP
- Les jours feries de La Reunion sont exclus du decompte`,
  },
  {
    titre: "Le pointage",
    slug: "pointage",
    categorie: "Administration",
    position: 2,
    contenu: `## Pointer mon arrivee

1. Allez dans **Administration > Pointage** (ou "Pointage" dans le menu general)
2. L'horloge en temps reel s'affiche en haut a droite
3. Cliquez sur le gros bouton **Pointer mon arrivee**
4. Le bouton change : "Partir en pause" apparait

## Ma journee type

1. **Arrivee** : cliquez "Pointer mon arrivee" (bouton jaune)
2. **Pause dejeuner** : cliquez "Partir en pause" (le bouton devient gris)
3. **Retour de pause** : cliquez "Reprendre le travail" (bouton orange)
4. **Depart** : cliquez "Pointer mon depart" (bouton gris)

Le bouton devient vert "Journee terminee" quand tout est pointe.

## Si j'oublie de pointer la pause

Pas de souci : si la pause n'est pas pointee, 1 heure est deduite automatiquement du temps de travail.

## Mon historique

En bas de la page, les 10 derniers jours sont affiches avec : date, arrivee, depart, heures travaillees, heures supplementaires.

## Pointage pour Georget

Michelle peut pointer pour Georget grace a la section "Pointer pour un collaborateur" qui apparait sur sa page de pointage.

## Le popup cafe

Quand c'est votre semaine de lavage de la machine a cafe, un popup fun apparait a votre arrivee pour vous le rappeler !

## Pointage Equipe (Admin/Direction)

La page **Pointage Equipe** permet de voir tous les pointages du jour avec des badges statut (au travail, en pause, absent, termine). Le recap mensuel montre les totaux par collaborateur avec export CSV.`,
  },
  {
    titre: "Le SAV et les litiges",
    slug: "sav-litiges",
    categorie: "Commercial",
    position: 4,
    contenu: `## Creer un dossier SAV

1. Allez dans **Commercial > SAV — Litiges**
2. Cliquez sur **+ Nouveau dossier**
3. Tapez le nom du client pour le chercher (autocomplete)
4. Renseignez la reference BDC Sellsy si applicable
5. Donnez un titre clair au dossier
6. Choisissez le type : Defaut produit, Livraison, Litige, Retour, Insatisfaction, Autre
7. Decrivez le probleme
8. Assignez le dossier a Michelle, Daniella, Bernard ou Elaury
9. Cliquez sur **Creer le dossier**

Un numero SAV-2026-XXXX est genere automatiquement.

## Suivre un dossier

Cliquez sur un dossier dans la liste pour ouvrir le panneau de detail :

- **Changer le statut** : A traiter, En cours, En attente, Traite, Cloture
- **Ajouter un document** : photo, email, note d'appel, courrier, PDF
- **Commenter** : echangez en interne sur le dossier (fil de discussion)

## Les KPIs

4 cartes en haut : Total dossiers, A traiter (urgents), En cours, Traites. Filtrez par statut, type ou assigne.

## SAV dans la fiche contact

Quand un contact a des dossiers SAV, ils apparaissent dans sa fiche contact avec le statut et la date.`,
  },
  {
    titre: "Le Club Tectona",
    slug: "club-tectona",
    categorie: "Commercial",
    position: 5,
    contenu: `## Le programme de fidelite

Le Club Tectona recompense les clients fideles de DIMEXOI avec des remises sur le mobilier en teck massif.

## Les 5 niveaux

| Niveau | Nom | Seuil | Remise | Validite |
|--------|-----|-------|--------|----------|
| I | L'Ecorce | 500 euros | -5% | 3 mois |
| II | L'Aubier | 2 000 euros | -10% | 6 mois |
| III | Le Coeur | 5 000 euros | -15% | 9 mois |
| IV | Le Grain | 10 000 euros | -20% | 12 mois |
| V | Le Tectona Grandis | 20 000 euros | -25% | A vie |

## Comment ca fonctionne

La synchronisation se fait automatiquement chaque matin a 6h05 :
1. Les commandes Sellsy depuis 2020 sont recuperees
2. Le cumul TTC par client est calcule
3. Le niveau est attribue (un client ne descend jamais)
4. Un email de bienvenue est envoye si le client monte de niveau
5. Les contacts sont pousses vers Brevo (6 listes)
6. Les tags Sellsy sont mis a jour (CLUB - Niv 1 a 5)

## Gerer le Club

Sur la page **Club Tectona** :
- Cliquez sur **Mettre a jour le club** pour lancer une sync manuelle
- Generez un **code promo** pour un membre (bouton Ticket)
- Marquez un **bon comme utilise** (checkbox verte)
- Consultez le **Memo** pour les regles completes du programme`,
  },
  {
    titre: "Le ROI Marketing",
    slug: "roi-marketing",
    categorie: "Marketing",
    position: 5,
    contenu: `## Suivre la rentabilite marketing

La page **ROI Marketing** compare le chiffre d'affaires genere aux depenses marketing engagees.

## Ajouter une depense

1. Cliquez sur **+ Ajouter une depense**
2. Selectionnez la periode (mois)
3. Choisissez le type : Meta Ads, Google Ads, Salon, Agence, Print, Autre
4. Donnez un libelle et le montant
5. Cliquez sur Ajouter

## Lire les KPIs

- **CA total** : chiffre d'affaires de l'annee (depuis les ventes Sellsy)
- **Depenses totales** : somme de tous les couts marketing enregistres
- **ROI annuel** : pourcentage de rentabilite ((CA - Depenses) / Depenses x 100)
- **CAC** : cout d'acquisition client (Depenses / nombre de ventes)

## Tableau mensuel

Chaque mois affiche le CA, les depenses et le ROI. Vert si positif, rouge si negatif.

## Repartition par canal

Les barres horizontales montrent la repartition des depenses par type (Meta, Salon, etc).`,
  },
  {
    titre: "Les parametres",
    slug: "parametres",
    categorie: "Administration",
    position: 3,
    contenu: `## Page Parametres (Admin uniquement)

Accessible depuis **Administration > Parametres**.

## SLA — Delai de traitement

Le SLA definit le temps maximum pour traiter une demande client. Par defaut : 48 heures.
Quand le SLA est depasse, une tache automatique est creee pour le commercial assigne.

Modifiez la valeur et cliquez sur **Enregistrer**.

## Pointage — Horaires

- **Heures theoriques/jour** : nombre d'heures de travail attendues (defaut : 7h). Les heures supplementaires sont calculees par rapport a cette valeur.
- **Pause par defaut** : duree deduite si la pause n'est pas pointee (defaut : 1h).

## Roles et acces

L'apercu des roles montre quels modules sont accessibles par profil. Pour changer le role d'un collaborateur, allez dans **Collaborateurs**.`,
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
    let updated = 0;

    for (const article of SEED_ARTICLES) {
      const existing = await prisma.docArticle.findUnique({
        where: { slug: article.slug },
      });

      if (existing) {
        await prisma.docArticle.update({
          where: { slug: article.slug },
          data: {
            titre: article.titre,
            contenu: article.contenu,
            categorie: article.categorie,
            position: article.position,
          },
        });
        updated++;
      } else {
        await prisma.docArticle.create({
          data: article,
        });
        created++;
      }
    }

    return NextResponse.json({
      success: true,
      created,
      updated,
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
