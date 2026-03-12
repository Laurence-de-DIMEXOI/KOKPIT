# Rapport d'audit terrain KOKPIT — 12 mars 2026

> Audit terrain réalisé en session Claude Code.
> 14 points identifiés, 13 phases traitées.

---

## 1. Arborescence source (src/)

```
src/
├── app/
│   ├── (app)/                         # Layout principal authentifié
│   │   ├── layout.tsx                 # Sidebar + Topbar + theme par espace
│   │   ├── dashboard/page.tsx         # Dashboard Marketing (funnel, KPIs)
│   │   ├── commercial/
│   │   │   ├── page.tsx               # Dashboard Commercial (devis, commandes, KPIs)
│   │   │   ├── pipeline/page.tsx      # Pipeline devis Sellsy
│   │   │   ├── commandes/page.tsx     # Commandes Sellsy
│   │   │   ├── tracabilite/page.tsx   # Traçabilité Devis→BDC→Facture
│   │   │   ├── catalogue/page.tsx     # Catalogue produits Sellsy
│   │   │   └── taches/page.tsx        # Tâches commerciales
│   │   ├── contacts/
│   │   │   ├── page.tsx               # Liste contacts CRM
│   │   │   └── [id]/page.tsx          # Fiche contact détaillée
│   │   ├── leads/
│   │   │   ├── page.tsx               # Demandes de prix (ex-leads)
│   │   │   └── [id]/page.tsx          # Détail demande
│   │   ├── campagnes/page.tsx         # Campagnes Meta Ads
│   │   ├── emailing/
│   │   │   ├── page.tsx               # Stats Brevo + segments
│   │   │   └── listes/page.tsx        # Listes Brevo
│   │   ├── planning/page.tsx          # Planning posts (Kanban)
│   │   ├── liens-utiles/page.tsx      # Liens utiles équipe
│   │   ├── nos-reseaux/page.tsx       # Réseaux sociaux
│   │   ├── automatisations/page.tsx   # Workflows automatiques
│   │   ├── administration/
│   │   │   ├── page.tsx               # Admin dashboard
│   │   │   ├── collaborateurs/page.tsx
│   │   │   └── conges/page.tsx
│   │   ├── parametres/page.tsx
│   │   └── docs/page.tsx              # Documentation interne
│   ├── (auth)/
│   │   ├── layout.tsx                 # Layout login (glassmorphism)
│   │   └── login/page.tsx             # Login + redirect par rôle
│   ├── api/                           # Routes API (voir section 3)
│   ├── layout.tsx                     # Root layout
│   ├── page.tsx                       # Redirect → /login
│   └── providers.tsx                  # SessionProvider
├── components/
│   ├── layout/
│   │   ├── sidebar.tsx                # Navigation latérale
│   │   ├── topbar.tsx                 # Barre supérieure
│   │   ├── global-search.tsx          # Recherche globale (Cmd+K)
│   │   ├── notification-bell.tsx
│   │   └── drawer.tsx
│   ├── dashboard/
│   │   ├── kpi-card.tsx               # Carte KPI réutilisable
│   │   ├── conversion-funnel.tsx
│   │   ├── conversion-time.tsx
│   │   ├── evolution-charts.tsx
│   │   ├── expiring-quotes.tsx
│   │   ├── leads-chart.tsx
│   │   ├── line-chart.tsx
│   │   ├── performance-table.tsx
│   │   ├── sales-objective.tsx
│   │   └── alerts-panel.tsx
│   ├── contacts/
│   │   ├── contact-card.tsx
│   │   ├── contact-drawer.tsx
│   │   ├── contact-preview-drawer.tsx
│   │   ├── contact-timeline.tsx
│   │   └── priority-badge.tsx
│   ├── leads/
│   │   ├── lead-form.tsx
│   │   ├── lead-pipeline.tsx
│   │   └── lead-table.tsx
│   ├── catalogue/
│   │   └── product-drawer.tsx
│   ├── commercial/
│   │   ├── document-chain.tsx
│   │   └── task-form.tsx
│   ├── planning/
│   │   ├── kanban-board.tsx
│   │   ├── kanban-card.tsx
│   │   ├── kanban-column.tsx
│   │   ├── label-picker.tsx
│   │   ├── post-modal.tsx
│   │   ├── post-checklist.tsx
│   │   └── types.ts
│   ├── chat/
│   │   └── chatbot-widget.tsx
│   ├── common/
│   │   ├── date-relative.tsx
│   │   ├── sla-badge.tsx
│   │   └── source-badge.tsx
│   └── ui/                           # Composants UI de base
│       ├── badge.tsx, button.tsx, card.tsx
│       ├── empty-state.tsx, error-state.tsx
│       ├── freshness-indicator.tsx
│       ├── input.tsx, modal.tsx, select.tsx, toast.tsx
├── hooks/
│   ├── use-active-space.ts
│   ├── use-contacts.ts
│   ├── use-dashboard.ts
│   └── use-leads.ts
├── lib/
│   ├── auth.ts                        # NextAuth config (credentials, JWT)
│   ├── auth-utils.ts
│   ├── prisma.ts                      # Prisma client singleton
│   ├── sellsy.ts                      # Client Sellsy API V2 (cache 5min)
│   ├── sellsy-urls.ts                 # Liens profonds Sellsy centralisés
│   ├── sellsy-statuts.ts              # Traduction statuts FR
│   ├── brevo.ts                       # Client Brevo API
│   ├── nav-config.ts                  # ESPACES — config navigation par rôle
│   ├── estimation.ts                  # Matching produits catalogue
│   ├── contact-priority.ts
│   ├── attribution.ts, rfm.ts, sla.ts
│   ├── resend.ts, twilio.ts
│   ├── supabase.ts
│   ├── queue.ts
│   ├── utm.ts
│   └── validators.ts
├── workers/                           # Workers background
│   ├── cross-sell.worker.ts
│   ├── nurturing.worker.ts
│   ├── relance.worker.ts
│   ├── sellsy-sync.worker.ts
│   └── sla-check.worker.ts
├── data/
│   ├── contacts.ts
│   └── contact-details.ts
├── types/
│   └── index.ts
└── middleware.ts                      # Auth middleware
```

---

## 2. Modeles Prisma en production

### Enums
| Enum | Valeurs |
|------|---------|
| Role | MARKETING, COMMERCIAL, DIRECTION, ADMIN |
| LeadStatut | NOUVEAU, EN_COURS, DEVIS, VENTE, PERDU |
| LeadSource | META_ADS, GOOGLE_ADS, SITE_WEB, GLIDE, SALON, FORMULAIRE, DIRECT |
| LifecycleStage | PROSPECT, LEAD, CLIENT, INACTIF |
| Plateforme | META, GOOGLE, EMAIL, SMS, SALON, AUTRE |
| DevisStatut | EN_ATTENTE, ENVOYE, ACCEPTE, REFUSE, EXPIRE |
| TaskStatut | A_FAIRE, EN_COURS, TERMINEE |
| PostStatut | IDEE, PRE_PRODUCTION, VISUEL_OK, TEXTE_OK, PRET_A_POSTER, POSTE, INSPIRATIONS, COUVERTURES_FB |

### Modeles (25 tables)
| Modele | Description | Relations principales |
|--------|-------------|----------------------|
| User | Utilisateurs CRM | showroom, leads, tasks, events |
| Showroom | Points de vente | users, contacts, leads |
| Contact | Contacts CRM (unique par email) | leads, devis, ventes, events, demandes |
| Lead | Leads/opportunites | contact, commercial, campagne, devis |
| Campagne | Campagnes pub (Meta/Google) | leads, coûts offline, metaInsights (JSON) |
| Devis | Devis KOKPIT (lié Sellsy) | lead, contact, vente |
| Vente | Ventes réalisées | devis, contact |
| Evenement | Timeline contact | contact, lead, auteur |
| ClickEvent | Tracking UTM/clics | contact |
| EmailCampaign | Campagnes email internes | emailLogs |
| EmailLog | Logs emails envoyés | contact, campaign |
| SmsLog | Logs SMS (Twilio) | contact |
| AuditLog | Audit trail | user |
| CoutOffline | Coûts offline (salons, print) | campagne |
| DemandePrix | Demandes de prix (ex Glide) | contact |
| Workflow | Workflows automatiques | emailTemplate, executions |
| EmailTemplate | Templates email | workflow |
| WorkflowExecution | Historique exécutions | workflow |
| PostPlanning | Posts planning (Kanban) | createdBy, checklist, attachments |
| PostChecklist | Checklist items posts | post |
| PostAttachment | Pièces jointes posts | post |
| ObjectifCommercial | Objectifs CA mensuels | — |
| LienUtile | Liens utiles équipe | — |
| LiaisonDevisCommande | Liaison devis↔commande Sellsy | createdBy |
| LiaisonDocumentaire | Chaîne documentaire Sellsy V1 | — |
| BrevoSyncLog | Historique sync Brevo | createdBy |
| BrevoWebhookEvent | Events webhook Brevo | — |
| DocArticle | Articles documentation | — |
| Task | Tâches commerciales | contact, assigneA, createdBy |

---

## 3. Routes API existantes

### Auth
- `POST /api/auth/[...nextauth]` — NextAuth (credentials + JWT)

### Contacts
- `GET/POST /api/contacts` — CRUD contacts
- `GET/PUT/DELETE /api/contacts/[id]` — Contact individuel
- `GET /api/contacts/[id]/evenements` — Timeline contact
- `GET /api/contacts/[id]/sellsy-history` — Historique Sellsy (devis/BDC)
- `POST /api/contacts/import-legacy` — Import legacy Glide
- `POST /api/contacts/sellsy-sync` — Sync Sellsy
- `POST /api/contacts/sellsy-sync/confirm` — Confirmation sync
- `GET /api/contacts/sellsy-links` — Liens Sellsy contacts

### Leads / Demandes
- `GET/POST /api/leads` — CRUD leads
- `GET/PUT /api/leads/[id]` — Lead individuel
- `POST /api/leads/import` — Import leads
- `GET/POST /api/demandes` — Demandes de prix
- `POST /api/demandes/[id]/match-sellsy` — Matching catalogue
- `POST /api/demandes/estimate-all` — Estimation batch

### Sellsy
- `GET /api/sellsy` — Infos compte Sellsy
- `GET /api/sellsy/estimates` — Devis Sellsy
- `GET /api/sellsy/orders` — Commandes Sellsy
- `GET /api/sellsy/items` — Catalogue produits
- `GET /api/sellsy/companies` — Sociétés Sellsy
- `GET /api/sellsy/funnel` — Funnel commercial
- `GET /api/sellsy/performance` — Performance commerciale
- `GET /api/sellsy/tracabilite` — Traçabilité documents
- `GET /api/sellsy/document-chain` — Chaîne documentaire
- `POST /api/sellsy/document-chain/save` — Sauvegarde liaison
- `GET /api/sellsy/liaison` — Liaisons manuelles

### Marketing — Meta
- `GET /api/meta/campaigns` — Campagnes Meta Ads (avec diagnostic `?debug=1`)

### Marketing — Brevo
- `GET /api/brevo` — Compte + templates Brevo
- `GET /api/marketing/brevo/stats` — Stats email (avec diagnostic `?debug=1`)
- `GET/POST /api/marketing/brevo/listes` — Listes Brevo
- `POST /api/marketing/brevo/sync` — Sync segments → Brevo
- `POST /api/marketing/brevo/webhook` — Webhook events

### Marketing — Instagram
- `GET /api/marketing/instagram/feed` — Feed Instagram
- `GET /api/marketing/instagram/token-status` — Statut token IG

### Campagnes
- `GET /api/campagnes` — Liste campagnes DB

### Dashboard
- `GET /api/dashboard/stats` — Stats dashboard

### Commercial
- `GET/POST /api/commercial/objectifs` — Objectifs commerciaux
- `GET/POST /api/tasks` — Tâches commerciales
- `PUT/DELETE /api/tasks/[id]` — Tâche individuelle

### Planning
- `GET/POST /api/planning` — Posts planning
- `PUT/DELETE /api/planning/[id]` — Post individuel
- `POST /api/planning/[id]/checklist` — Checklist post
- `POST /api/planning/reorder` — Réordonner posts
- `POST /api/planning/upload` — Upload fichiers

### Emailing
- `POST /api/emailing` — Envoi campagnes (Resend)

### Divers
- `GET/POST /api/liens-utiles` — Liens utiles CRUD
- `PUT/DELETE /api/liens-utiles/[id]`
- `POST /api/liens-utiles/reorder` — Réordonner liens
- `GET /api/search` — Recherche globale (contacts, tâches, devis, commandes, produits, pages)
- `GET /api/notifications` — Notifications
- `POST /api/sms` — Envoi SMS
- `GET /api/cron` — Tâches planifiées
- `GET/POST /api/workflows` — Workflows
- `POST /api/workflows/template` — Templates workflow
- `GET/POST /api/docs` — Documentation interne
- `GET/PUT /api/docs/[slug]` — Article doc
- `POST /api/docs/chat` — Chat IA docs
- `POST /api/docs/seed` — Seed docs
- `POST /api/google-ads/import` — Import Google Ads

### Webhooks
- `POST /api/webhooks/meta` — Webhook Meta Ads (leads)
- `POST /api/webhooks/sellsy` — Webhook Sellsy
- `POST /api/webhooks/demande` — Webhook demandes
- `POST /api/webhooks/glide` — Webhook Glide (legacy)
- `POST /api/webhooks/newsletter` — Webhook newsletter

---

## 4. Variables d'environnement

| Variable | Usage |
|----------|-------|
| DATABASE_URL | PostgreSQL (Supabase) |
| NEXTAUTH_SECRET | Secret JWT NextAuth |
| NEXTAUTH_URL | URL de base auth |
| SELLSY_CLIENT_ID | OAuth2 Sellsy API V2 |
| SELLSY_CLIENT_SECRET | OAuth2 Sellsy API V2 |
| META_ACCESS_TOKEN | Facebook Marketing API |
| BREVO_API_KEY | Brevo (ex-Sendinblue) API |
| NEXT_PUBLIC_SUPABASE_URL | Supabase public URL |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase anon key |
| TWILIO_ACCOUNT_SID | Twilio SMS |
| TWILIO_AUTH_TOKEN | Twilio SMS |
| TWILIO_PHONE_NUMBER | Twilio SMS |
| HUBSPOT_ACCESS_TOKEN | HubSpot (legacy, probablement inutilisé) |
| REDIS_URL | Redis (queue workers) |

---

## 5. Ce qui a ete fait — Session audit 12 mars 2026

### Phase 1 — Bugs UI rapides
- Bouton "Créer le post" (planning) : contraste corrigé (`text-gray-900` sur fond couleur active)
- Bouton sauvegarde (liens utiles) : même correction
- Pourcentages KPI (commercial) : ajout pill semi-transparente `bg-white/20`

### Phase 4 — Liens Sellsy centralisés
- Créé `src/lib/sellsy-urls.ts` avec `getSellsyUrl(type, id)`
- Remplacé tous les liens Sellsy hardcodés dans 8 fichiers (catalogue, contacts, preview-drawer, document-chain, commandes, contacts/[id], pipeline)

### Phase 2 — Login + redirect par rôle
- Modernisé le layout login (outils intégrés : Sellsy, Brevo, Meta Ads, Instagram, Supabase)
- Redirect post-login : ADMIN/DIRECTION/COMMERCIAL → `/commercial`, MARKETING → `/dashboard`

### Phase 3 — Suppression boutons manuels
- **Commercial** : "Synchroniser" → "Actualiser" (petit bouton neutre)
- **Leads** : Supprimé "Estimer tout" + toute mention "IA", renommé en "Correspondance catalogue Sellsy"
- **Emailing** : Supprimé "Tout synchroniser" + boutons "Synchroniser" individuels, gardé "Voir dans Brevo"
- **Campagnes** : "Synchroniser Meta" → "Actualiser"
- **Commandes** : "Sync Sellsy" → "Actualiser"

### Phase 9.2 — Statuts en français
- Créé `src/lib/sellsy-statuts.ts` avec `traduireStatut(status)` (30+ traductions)
- Appliqué sur traçabilité, commandes, commercial dashboard, recherche globale

### Phase 5 — Recherche globale étendue
- API `/api/search` : 6 catégories (contacts, tâches, devis Sellsy, commandes Sellsy, produits catalogue, pages)
- Composant `GlobalSearch` : sections visuelles distinctes, icônes par type, liens profonds Sellsy
- Recherche pages via config nav statique (`ESPACES`)

### Phase 6 — Commercial dashboard
- Devis et commandes récents : liens cliquables vers Sellsy (nouvel onglet)
- Statuts traduits en français via `traduireStatut()`
- Supprimé le bloc "Volume total chargé" inutile

### Phase 9.3 — Traçabilité
- Ajouté barre de recherche filtrant par numéro, sujet, nom société
- Statuts traduits en français

### Phase 11 — Dashboard Marketing
- Skeleton loading complet (header, 4 KPI cards, funnel, chart)

### Phase 12 — Diagnostic API
- **Meta** : Ajouté validation token (`/debug_token` + `/me`), vérification scopes (`ads_read`), info comptes enrichie (status, currency, timezone)
- **Brevo** : Ajouté mode debug (`?debug=1`) avec info compte, compteurs campagnes, sample brut

---

## 6. Ce qui reste a faire

### Priorite haute
| Item | Description | Complexite |
|------|-------------|------------|
| Phase 7 | Leads : matching déterministe (SAM → Salle à manger, SDB → Salle de bain, etc.) | Moyenne |
| Phase 8 | Contacts drawer : retrouver devis/BDC par email (pas seulement contact_id) | Moyenne |
| Phase 10.1 | Catalogue : Suspense + skeleton loading | Faible |
| Phase 10.2 | Catalogue : image produit dans le drawer | Faible |
| Meta token | Vérifier/renouveler le META_ACCESS_TOKEN (possible expiration) | Critique |
| Brevo debug | Exécuter `/api/marketing/brevo/stats?debug=1` et analyser les résultats | Critique |

### Priorite moyenne
| Item | Description | Complexite |
|------|-------------|------------|
| Phase 10.3 | Catalogue : génération code-barres (JsBarcode + ProduitBarcode Prisma) | Haute |
| Phase 10.4 | Catalogue : impression étiquettes (CSS @media print) | Moyenne |
| Phase 9.1 | Traçabilité : liaisons automatiques via API Sellsy V1 (parentid/linkedid) | Haute |
| Sellsy pagination | Retirer les `limit` artificiels sur `/api/sellsy/estimates` et `/api/sellsy/orders` | Faible |

### Features long terme (feuille de route)
| Code | Feature | Description |
|------|---------|-------------|
| A1 | Espace Achat | Classification ABC, fournisseurs, bons de commande fournisseurs |
| F1 | Création devis | Créer un devis dans Sellsy depuis KOKPIT (formulaire → API Sellsy) |
| E1 | Espace client externe | Portail client pour suivi commandes, SAV |

---

## 7. Points d'attention

### Tokens API
- **Meta** : le token dans `.env` et `.env.local` est different. `.env.local` prend la priorité. Les tokens Meta expirent tous les 60 jours sauf si c'est un token long-lived. Utiliser le diagnostic `?debug=1` pour vérifier la validité.
- **Brevo** : la clé API est identique dans les deux fichiers. Utiliser `?debug=1` pour vérifier le compte associé.

### Performance Sellsy
- Le cache en mémoire (`apiCache` Map) expire toutes les 5 minutes. En production Vercel (serverless), chaque cold start repart de zéro. Pour un cache plus persistant, envisager Redis ou ISR.
- Les appels Sellsy sont parallélisés dans la recherche globale (bon).

### Sécurité
- Les mots de passe sont hashés (bcrypt via `passwordHash`).
- Auth JWT via NextAuth avec middleware de protection des routes.
- RGPD : champs de consentement présents sur Contact (email, SMS, newsletter, offres).
- **Attention** : les fichiers `.env` et `.env.local` contiennent des secrets en clair dans le repo. Vérifier que le `.gitignore` les exclut bien.

### Architecture
- Les 4 espaces métier (Commercial, Marketing, Administration, Achat) ont chacun leur palette de couleurs (CSS custom properties via `data-espace`).
- La navigation est centralisée dans `nav-config.ts` (`ESPACES`) avec filtrage par rôle utilisateur.
- Les composants UI utilisent le préfixe `cockpit-*` pour les classes Tailwind custom.

### Build
- Build Next.js 15 propre (0 erreur, 0 warning TypeScript bloquant).
- Toutes les pages sont pre-rendered en statique sauf les routes dynamiques (`/contacts/[id]`, `/leads/[id]`).

---

## Commits de cette session

```
29f02dc fix: bugs UI + centralise Sellsy URLs (Phase 1+4)
b623f08 feat: login role-based redirect + supprime boutons sync manuels (Phase 2+3)
1211b2b feat: recherche globale étendue + statuts FR (Phase 5+9.2)
384767c feat: commercial dashboard liens Sellsy + traçabilité search (Phase 6+9.3)
14a531f feat: skeleton loading dashboard marketing (Phase 11)
f995680 feat: diagnostic amélioré Meta + Brevo APIs (Phase 12)
```
