# Rapport d'audit technique KOKPIT — 14 mars 2026

> Session d'audit du 12-14 mars 2026 — Exécution du plan en 13 phases.

---

## 1. Résumé exécutif

L'audit terrain du 12 mars a identifié 14 points + recherche globale. Après analyse systématique, **la quasi-totalité des corrections étaient déjà implémentées** lors de sessions précédentes. Les actions restantes ont été complétées dans cette session.

**Bilan :**
- 12/13 phases du plan : déjà implémentées
- 1 phase complétée ce jour : fix contraste KPI cards (Phase 1.3)
- 1 item optionnel non implémenté : ProduitBarcode en base (le composant UI fonctionne sans)

---

## 2. Structure fichiers réelle

```
src/ (178 fichiers TypeScript/TSX)
├── app/
│   ├── layout.tsx, page.tsx, providers.tsx
│   ├── (auth)/login/page.tsx
│   ├── (app)/ (22 pages)
│   │   ├── dashboard/page.tsx          — Marketing dashboard
│   │   ├── contacts/page.tsx           — Liste contacts
│   │   ├── contacts/[id]/page.tsx      — Fiche contact + timeline
│   │   ├── leads/page.tsx              — Demandes de prix
│   │   ├── leads/[id]/page.tsx         — Détail demande
│   │   ├── campagnes/page.tsx          — Meta Ads
│   │   ├── emailing/page.tsx           — Stats Brevo
│   │   ├── emailing/listes/page.tsx    — Listes Brevo
│   │   ├── planning/page.tsx           — Planning éditorial
│   │   ├── commercial/page.tsx         — Dashboard commercial
│   │   ├── commercial/pipeline/        — Pipeline devis
│   │   ├── commercial/taches/          — Gestionnaire tâches
│   │   ├── commercial/commandes/       — Bons de commande
│   │   ├── commercial/tracabilite/     — Traçabilité devis→BDC
│   │   ├── commercial/catalogue/       — Catalogue produits
│   │   ├── administration/             — Admin + collaborateurs + congés
│   │   ├── liens-utiles/               — Liens utiles
│   │   ├── automatisations/            — Workflows
│   │   ├── nos-reseaux/                — Réseaux sociaux
│   │   ├── parametres/                 — Paramètres
│   │   └── docs/                       — Documentation interne
│   └── api/ (67 routes)
├── components/ (48 fichiers, 10 dossiers)
│   ├── catalogue/    — product-drawer, barcode-label
│   ├── commercial/   — document-chain, task-form
│   ├── contacts/     — card, drawer, preview-drawer, timeline, priority-badge
│   ├── dashboard/    — kpi-card, charts, funnel, performance-table, sales-objective
│   ├── layout/       — sidebar, topbar, global-search, notification-bell
│   ├── leads/        — lead-form, lead-pipeline, lead-table
│   ├── planning/     — kanban-board, kanban-card, kanban-column, post-modal
│   └── ui/           — badge, button, card, modal, toast, etc.
├── lib/ (20 fichiers)
│   ├── api-cache.ts       — Cache API en mémoire (TTL)
│   ├── auth.ts            — NextAuth config
│   ├── prisma.ts          — Client Prisma singleton
│   ├── sellsy.ts          — Client API Sellsy V2
│   ├── sellsy-urls.ts     — URLs Sellsy centralisées
│   ├── sellsy-statuts.ts  — Traduction statuts FR
│   ├── brevo.ts           — Client API Brevo
│   ├── estimation.ts      — Matching produits
│   ├── nav-config.ts      — Configuration navigation
│   └── ...
├── hooks/ (4 fichiers)
├── workers/ (5 fichiers BullMQ)
└── middleware.ts
```

---

## 3. Modèles Prisma en production (24 modèles, 14 enums)

### Modèles principaux

| Modèle | Champs clés | Relations |
|--------|-------------|-----------|
| **User** | email, nom, prenom, role (MARKETING/COMMERCIAL/DIRECTION/ADMIN), totpSecret? | Showroom?, Lead[], Task[] |
| **Contact** | email, nom, prenom, telephone?, lifecycleStage, sellsyContactId?, scoreRfm? | Showroom?, Lead[], Devis[], Vente[], DemandePrix[], Task[] |
| **Lead** | contactId, statut, source, campagneId?, slaDeadline, priorite | Contact, Campagne?, Devis[] |
| **Devis** | contactId, sellsyQuoteId?, numero?, montant, statut, dateEnvoi? | Contact, Lead?, Vente? |
| **Vente** | contactId, sellsyInvoiceId?, montant, dateVente, produits? | Contact, Devis? |
| **DemandePrix** | contactId, meuble, articles?, estimationHT?, dateDemande? | Contact |
| **Task** | titre, echeance?, statut (A_FAIRE/EN_COURS/TERMINEE), assigneAId, contactId? | User, Contact? |
| **Evenement** | contactId?, type (10 types), description, auteurId? | Contact?, User? |
| **Campagne** | nom, plateforme, metaCampaignId?, metaInsights? | Lead[], CoutOffline[] |
| **PostPlanning** | title, statut (8 états), labels[], coverImage?, position | User, PostChecklist[], PostAttachment[] |
| **Workflow** | nom, trigger (13 déclencheurs), enabled, delaiMinutes | EmailTemplate?, WorkflowExecution[] |

### Modèles techniques

| Modèle | Rôle |
|--------|------|
| **LiaisonDevisCommande** | Lien devis→BDC Sellsy |
| **LiaisonDocumentaire** | Chaîne documentaire Sellsy |
| **BrevoSyncLog** | Log synchronisation Brevo |
| **BrevoWebhookEvent** | Événements webhook Brevo |
| **ObjectifCommercial** | Objectifs mensuels |
| **DocArticle** | Documentation interne |
| **AuditLog** | Journal d'audit |

---

## 4. Routes API existantes (67 fichiers)

### Authentification
| Route | Méthodes |
|-------|----------|
| `/api/auth/[...nextauth]` | GET, POST |

### Contacts & Leads
| Route | Méthodes |
|-------|----------|
| `/api/contacts` | GET, POST |
| `/api/contacts/[id]` | GET, PUT, DELETE |
| `/api/contacts/[id]/evenements` | GET, POST, DELETE |
| `/api/contacts/[id]/sellsy-history` | GET |
| `/api/contacts/sellsy-links` | GET |
| `/api/contacts/sellsy-sync` | POST |
| `/api/leads` | GET, POST |
| `/api/leads/[id]` | GET, PATCH, DELETE |
| `/api/demandes` | GET, PATCH |
| `/api/demandes/[id]` | DELETE |
| `/api/demandes/[id]/match-sellsy` | GET |
| `/api/demandes/sync-sellsy` | POST |

### Sellsy (CRM)
| Route | Méthodes |
|-------|----------|
| `/api/sellsy` | GET |
| `/api/sellsy/estimates` | GET |
| `/api/sellsy/orders` | GET |
| `/api/sellsy/items` | GET |
| `/api/sellsy/companies` | GET |
| `/api/sellsy/funnel` | GET |
| `/api/sellsy/tracabilite` | GET |
| `/api/sellsy/performance` | GET |
| `/api/sellsy/document-chain` | GET |
| `/api/sellsy/document-chain/save` | POST |
| `/api/sellsy/liaison` | POST, DELETE |

### Marketing
| Route | Méthodes |
|-------|----------|
| `/api/meta/campaigns` | GET |
| `/api/meta/monthly-spend` | GET |
| `/api/marketing/brevo/stats` | GET |
| `/api/marketing/brevo/sync` | POST |
| `/api/marketing/brevo/listes` | GET, POST |
| `/api/marketing/brevo/webhook` | POST |
| `/api/marketing/instagram/feed` | GET |
| `/api/campagnes` | GET, POST, PATCH |

### Tâches & Workflows
| Route | Méthodes |
|-------|----------|
| `/api/tasks` | GET, POST |
| `/api/tasks/[id]` | PUT, DELETE |
| `/api/workflows` | GET, PATCH |

### Autres
| Route | Méthodes |
|-------|----------|
| `/api/cron` | GET, POST |
| `/api/search` | GET |
| `/api/planning` | GET, POST |
| `/api/emailing` | GET, POST, PATCH |
| `/api/docs` | GET, POST |
| `/api/notifications` | GET |
| `/api/webhooks/sellsy` | POST |
| `/api/webhooks/meta` | POST, GET |
| `/api/webhooks/demande` | POST, GET |

---

## 5. Variables d'environnement (sans valeurs)

| Variable | Service |
|----------|---------|
| `DATABASE_URL` | PostgreSQL (Supabase) |
| `NEXTAUTH_URL` | NextAuth |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase client |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase client |
| `SELLSY_CLIENT_ID` | Sellsy OAuth |
| `SELLSY_CLIENT_SECRET` | Sellsy OAuth |
| `SELLSY_API_KEY` | Sellsy V1 |
| `SELLSY_API_SECRET` | Sellsy V1 |
| `SELLSY_WEBHOOK_SECRET` | Webhook Sellsy |
| `META_ACCESS_TOKEN` | Meta Ads |
| `META_WEBHOOK_SECRET` | Webhook Meta |
| `META_WEBHOOK_VERIFY_TOKEN` | Webhook Meta |
| `BREVO_API_KEY` | Brevo |
| `BREVO_SENDER_EMAIL` | Brevo |
| `ANTHROPIC_API_KEY` | Claude AI |
| `RESEND_API_KEY` | Resend (emails transactionnels) |
| `RESEND_FROM_EMAIL` | Resend |
| `RESEND_REPLY_TO` | Resend |
| `TWILIO_ACCOUNT_SID` | Twilio SMS |
| `TWILIO_AUTH_TOKEN` | Twilio SMS |
| `TWILIO_PHONE_NUMBER` | Twilio SMS |
| `REDIS_HOST` | BullMQ |
| `REDIS_PORT` | BullMQ |
| `REDIS_PASSWORD` | BullMQ |
| `REDIS_DB` | BullMQ |
| `CRON_API_SECRET` | Vercel Cron |
| `WEBHOOK_SECRET` | Webhooks généraux |
| `GLIDE_WEBHOOK_SECRET` | Webhook Glide (legacy) |
| `GOOGLE_ADS_SHEET_ID` | Google Ads import |
| `APP_URL` | URL application |

---

## 6. Ce qui a été fait dans cette session (14 mars)

### Performance & chargement instantané
- Suppression de tous les appels `sync-sellsy` au chargement des pages (leads, dashboard)
- Création d'un **cron job Vercel** (`/api/cron?job=sync-sellsy`) qui tourne toutes les 10 min
- Mise en place d'un **cache API en mémoire** (`src/lib/api-cache.ts`) :
  - Devis : 10 min TTL
  - Commandes : 10 min TTL
  - Produits : 1h TTL
  - Funnel : 10 min TTL
- Pages leads/dashboard lisent uniquement depuis la base (instantané)
- API `/api/demandes` enrichie avec `devisList` et `ventesList` (plus besoin de requêtes Sellsy live)

### Item 6 — Timeline d'activité contacts (X1)
- Ajout d'une section timeline complète sur la fiche contact (`/contacts/[id]`)
- Types : NOTE, APPEL, RELANCE avec icônes et couleurs distinctes
- Formulaire d'ajout, suppression au hover, pagination "Voir plus"
- Timestamps relatifs ("À l'instant", "Il y a 2h", "Hier")

### Item 7 — Tâches (X2) — Specs validées
- Le système de tâches est opérationnel à 95% (CRUD, UI, filtres, assignation)
- Gap identifié : rappels automatiques (email avant échéance)
- Recommandation : ajouter au cron existant quand X6 (notifications) sera implémenté

### Phase 1.3 — Fix contraste KPI cards
- `VariationBadge` sur commercial : remplacé `bg-white/25 text-white` par `bg-black/20 text-white` pour meilleur contraste

### Vérification complète du plan (13 phases)
Toutes les autres phases du plan étaient déjà implémentées :
- Login avec redirection par rôle
- URLs Sellsy centralisées (`getSellsyUrl`)
- Boutons sync manuels supprimés (remplacés par "Actualiser" discret)
- Statuts Sellsy traduits en français (`traduireStatut`)
- Recherche globale étendue (contacts, devis, commandes, produits, pages, tâches)
- Dashboard commercial nettoyé
- Traçabilité avec barre de recherche
- Contacts : recherche Sellsy par email
- Leads : matching déterministe (plus d'IA/Sparkles)
- Catalogue : codes-barres + impression étiquettes
- Debug Meta et Brevo avec logging diagnostique

---

## 7. Ce qui reste à faire

### Court terme (prochaine session)
- [ ] **Rappels tâches par email** — Ajouter au cron job un check des tâches dont l'échéance approche, envoyer un email Brevo à l'assigné
- [ ] **ProduitBarcode en base** (optionnel) — Le composant barcode fonctionne côté client avec la référence, mais stocker en base permettrait des codes uniques
- [ ] **Vérifier token Meta Ads** — Si les campagnes affichent 0, le token est probablement expiré
- [ ] **Vérifier clé Brevo** — Si les stats emailing sont à 0, vérifier l'API key

### Moyen terme (features planifiées)
- [ ] **X6 — Système de notifications** — Badge topbar, notifications in-app
- [ ] **A1 — Espace Achat** — Classification ABC fournisseurs
- [ ] **F1 — Création devis KOKPIT → Sellsy** — Formulaire de devis avec push API
- [ ] **E1 — Espace client externe** — Portail client avec accès restreint

---

## 8. Points d'attention

1. **Token Meta Ads** — Les tokens Facebook expirent. Si les campagnes reviennent à zéro, renouveler le token dans les variables d'env Vercel.

2. **Cron Vercel** — Le cron `sync-sellsy` tourne toutes les 10 min. Il faut que `CRON_API_SECRET` soit configuré sur Vercel (fait le 14/03).

3. **Cache en mémoire** — Le cache `ApiCache` est in-process. Sur Vercel (serverless), chaque instance a son propre cache. Les données sont toujours fraîches grâce au cron de 10 min + stale-while-revalidate.

4. **Prisma schema** — 24 modèles, 14 enums. Le schéma est stable. Prochaine migration prévue : `ProduitBarcode` (optionnel) et champs rappels sur `Task`.

5. **Workers BullMQ** — 5 workers (cross-sell, nurturing, relance, sellsy-sync, sla-check) nécessitent Redis. Si Redis n'est pas configuré, les workers ne tournent pas mais l'app fonctionne normalement via le cron Vercel.

---

## 9. Stack technique

| Composant | Technologie | Version |
|-----------|------------|---------|
| Framework | Next.js (App Router) | 15.1 |
| UI | React | 19 |
| Langage | TypeScript | 5.7 |
| BDD | PostgreSQL via Prisma | 5.7 |
| Auth | NextAuth + TOTP | 4.24 |
| CSS | Tailwind CSS | 3.3 |
| Charts | Recharts | 2.10 |
| Icons | Lucide React | — |
| Queue | BullMQ + ioredis | 5.6 / 5.3 |
| Storage | Supabase | — |
| Email transac. | Resend | 3.0 |
| Email marketing | Brevo | — |
| SMS | Twilio | 4.10 |
| AI | Anthropic (Claude) | — |
| CRM | Sellsy API V2 | — |
| Ads | Meta Ads + Google Ads | — |
| Validation | Zod | 3.22 |
| Barcode | JsBarcode + QRCode | 3.12 / 1.5 |
| Hébergement | Vercel | — |

---

*Rapport généré le 14 mars 2026 — Session Claude Code*
