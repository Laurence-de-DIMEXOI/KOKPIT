# BRIEFING KOKPIT — Document complet pour continuité de développement

> **Date** : 11 mars 2026
> **Auteur** : Claude (session Cowork)
> **Destinataires** : Claude Code, autres sessions Claude, développeurs
> **Projet** : KOKPIT — SaaS CRM pour DIMEXOI (Île de La Réunion)

---

## 1. CONTEXTE GÉNÉRAL

### L'entreprise
**DIMEXOI** est une entreprise de mobilier (meubles, décoration, literie) basée à La Réunion. L'utilisatrice principale est **Laurence Payet** (laurence.payet@dimexoi.fr), responsable marketing et direction.

### Le projet KOKPIT
KOKPIT est un **CRM SaaS interne** développé sur mesure pour DIMEXOI. Il regroupe :
- **Espace Commercial** : pipeline de ventes, devis, commandes, contacts (intégré avec Sellsy)
- **Espace Marketing** : campagnes, emailing (Brevo), planning réseaux sociaux (Kanban)
- **Espace Administration** : gestion des congés, collaborateurs, paramètres
- **Dashboard Direction** : vue globale, KPIs, objectifs commerciaux

### Identité visuelle
- **Thème LIGHT** : fond `#F5F6F7`, cartes `#FFFFFF`, accent jaune `#F4B400`
- **Font** : Plus Jakarta Sans
- **CSS** : Tailwind CSS avec classes custom `cockpit-*` (cockpit-bg, cockpit-card, cockpit-yellow, shadow-cockpit-sm, etc.)

---

## 2. STACK TECHNIQUE

| Composant | Technologie | Version |
|-----------|-------------|---------|
| Framework | Next.js (App Router) | 15.5.12 |
| React | React | 19 |
| Language | TypeScript | strict |
| ORM | Prisma | — |
| BDD | PostgreSQL (Supabase) | — |
| Hébergement | Vercel | — |
| Storage | Supabase Storage (REST API) | — |
| Auth | NextAuth.js | — |
| Email | Brevo (API) | — |
| CRM externe | Sellsy v2 (OAuth2 Client Credentials) | — |
| Icônes | Lucide React | — |
| CSS | Tailwind CSS | — |
| Node.js (Vercel) | Node | 24.x |

### Build
```
"build": "prisma generate && next build"
"prebuild": "node scripts/generate-data.js" (pour fichiers data statiques)
```

---

## 3. INFRASTRUCTURE & CREDENTIALS

### Supabase
- **Project ID** : `dbyltdnmpinyxlpotakq`
- **URL** : `https://dbyltdnmpinyxlpotakq.supabase.co`
- **Anon Key** : `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRieWx0ZG5tcGlueXhscG90YWtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMjIzMjYsImV4cCI6MjA4Nzc5ODMyNn0.pEnClaN02C0BTmDtLyTvz-S7j6_TZsDjyWrswx3q3yc`
- **Storage bucket** : `planning` (public, 5MB, images uniquement)

### Vercel
- **Team ID** : `team_T1HOPKV3GWUOMBKbBE7UmtVw`
- **Project ID** : `prj_0TLyz4zjNHm1hoDHJjcLoTf15fgx`
- **URL Production** : `https://kokpit-kappa.vercel.app` (⚠️ PAS kokpit.vercel.app qui retourne 404)

### GitHub
- **Repo** : `github.com/Laurence-de-DIMEXOI/KOKPIT` (privé)
- **Branche** : `main`

### Variables d'environnement (.env)
```
DATABASE_URL=postgresql://kokpit:kokpit_dev@localhost:5432/kokpit
REDIS_URL=redis://localhost:6379
NEXTAUTH_SECRET=change-me-in-production
NEXTAUTH_URL=http://localhost:3000
BREVO_API_KEY=xkeysib-...
META_ACCESS_TOKEN=EAFZCQ5XFjnUEBQ...
NEXT_PUBLIC_SUPABASE_URL=https://dbyltdnmpinyxlpotakq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
HUBSPOT_ACCESS_TOKEN=pat-eu1-...
```

**⚠️ ACTION REQUISE** : Les variables `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` doivent être ajoutées dans Vercel → Settings → Environment Variables pour que l'upload d'images fonctionne en production.

---

## 4. ARCHITECTURE DU CODEBASE

### Structure des dossiers
```
kokpit/
├── prisma/
│   └── schema.prisma          # Schéma BDD complet (tous les modèles)
├── src/
│   ├── app/
│   │   ├── (app)/             # Routes protégées (layout avec sidebar)
│   │   │   ├── planning/      # ← NOUVEAU : Kanban Planning
│   │   │   │   └── page.tsx
│   │   │   ├── dashboard/
│   │   │   ├── pipeline/
│   │   │   ├── contacts/
│   │   │   ├── emailing/
│   │   │   └── ...
│   │   ├── api/
│   │   │   ├── planning/      # ← NOUVEAU : API Planning
│   │   │   │   ├── route.ts           # GET all, POST create
│   │   │   │   ├── upload/
│   │   │   │   │   └── route.ts       # POST upload image
│   │   │   │   ├── reorder/
│   │   │   │   │   └── route.ts       # PUT drag & drop
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts       # PUT update, DELETE
│   │   │   │       └── checklist/
│   │   │   │           └── route.ts   # POST/PUT/DELETE checklist items
│   │   │   ├── sellsy/        # Intégration Sellsy CRM
│   │   │   ├── brevo/         # Intégration Brevo Email
│   │   │   └── ...
│   ├── components/
│   │   ├── planning/          # ← NOUVEAU : Composants Kanban
│   │   │   ├── types.ts              # Types, COLUMNS, LABEL_CONFIG
│   │   │   ├── kanban-board.tsx       # Board principal + DnD
│   │   │   ├── kanban-column.tsx      # Colonne avec icône Lucide
│   │   │   ├── kanban-card.tsx        # Carte draggable
│   │   │   ├── post-modal.tsx         # Modal création/édition
│   │   │   ├── post-checklist.tsx     # Gestion checklist
│   │   │   └── label-picker.tsx       # Sélection labels par catégorie
│   │   ├── layout/
│   │   │   └── sidebar.tsx            # Navigation (modifié pour Planning)
│   │   └── ...
│   ├── lib/
│   │   ├── auth.ts            # Configuration NextAuth
│   │   ├── auth-utils.ts      # Rôles, modules, permissions
│   │   ├── prisma.ts          # Client Prisma singleton
│   │   ├── supabase.ts        # ← NOUVEAU : Client Supabase Storage (REST)
│   │   └── ...
```

### Système d'authentification
- **NextAuth.js** avec sessions serveur
- **4 rôles** : ADMIN, MARKETING, COMMERCIAL, DIRECTION
- **Modules** : chaque page est associée à un module, et chaque rôle a accès à certains modules
- Le module `"planning"` est accessible par : ADMIN, MARKETING, DIRECTION

### Navigation (Sidebar)
- La sidebar est organisée par **espaces** (commercial, marketing, admin)
- Détection automatique de l'espace via `detectSpace()` basé sur l'URL
- `/planning` → espace marketing
- Chaque item a : label, href, icon (Lucide), module (pour permissions), space

---

## 5. FEATURE PLANNING (KANBAN) — Détail complet

### Vue d'ensemble
Reproduction du board Trello "Planning DIMEXOI BO 2026" avec 8 colonnes :

| # | Statut | Icône | Couleur |
|---|--------|-------|---------|
| 1 | Boîte à idées | Lightbulb | amber |
| 2 | Pré-production | PenLine | blue |
| 3 | Visuel Ok | Camera | purple |
| 4 | Texte Ok | FileCheck | green |
| 5 | Prêt à poster | Send | orange |
| 6 | Posté | CircleCheckBig | emerald |
| 7 | Inspirations | Sparkles | pink |
| 8 | Couvertures Facebook | Image | indigo |

### Labels (14 labels, 4 catégories)
**Piliers** (ce qu'on raconte) :
- Pilier 1 : Matière (#D946EF / violet)
- Pilier 2 : Comprendre (#3B82F6 / bleu)
- Pilier 3 : Magasin (#10B981 / vert)

**Parcours** (étape client) :
- Découverte (#F97316 / orange)
- Pédagogie (#06B6D4 / cyan)
- Projection (#8B5CF6 / violet)
- Action (#EF4444 / rouge)
- Fidélisation (#F59E0B / ambre)

**Contexte** :
- Événement (#EC4899 / rose)
- Newsletter (#6366F1 / indigo)
- Publicité (#DC2626 / rouge foncé)

**Canal** :
- Meta (#1877F2 / bleu Facebook)
- Google (#34A853 / vert Google)
- Story (#E1306C / rose Instagram)

### Base de données
3 tables + 2 enums (voir section Prisma ci-dessous).

### Drag & Drop
Implémenté avec **HTML5 natif** (pas de librairie externe). Raison : le registre npm était bloqué depuis le sandbox de développement, @dnd-kit n'a pas pu être installé.

### Upload d'images
- Frontend : zone de drop dans le modal, click pour choisir un fichier
- Fichiers acceptés : JPG, PNG, WebP, GIF (5 Mo max)
- Backend : `/api/planning/upload` → Supabase Storage bucket `planning`
- Client Supabase : REST API directe (pas de SDK), dans `src/lib/supabase.ts`
- L'image est stockée dans `planning/covers/{timestamp}-{random}.{ext}`
- URL publique retournée : `https://dbyltdnmpinyxlpotakq.supabase.co/storage/v1/object/public/planning/covers/...`

---

## 6. MODÈLES PRISMA (Planning)

```prisma
enum PostStatut {
  IDEE
  PRE_PRODUCTION
  VISUEL_OK
  TEXTE_OK
  PRET_A_POSTER
  POSTE
  INSPIRATIONS
  COUVERTURES_FB
}

enum PostLabel {
  PILIER_1_MATIERE
  PARCOURS_DECOUVERTE
  CONTEXTE_EVENEMENT
  PILIER_2_COMPRENDRE
  PARCOURS_PEDAGOGIE
  CONTEXTE_NEWSLETTER
  PARCOURS_PROJECTION
  CANAL_META
  PILIER_3_MAGASIN
  CANAL_GOOGLE
  PARCOURS_ACTION
  CONTEXTE_PUBLICITE
  PARCOURS_FIDELISATION
  CANAL_STORY
}

model PostPlanning {
  id          String      @id @default(cuid())
  title       String
  description String?
  statut      PostStatut  @default(IDEE)
  position    Int         @default(0)
  dueDate     DateTime?
  labels      PostLabel[] @default([])
  coverImage  String?
  createdById String
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  createdBy   User        @relation("PostPlanningAuteur", fields: [createdById], references: [id], onDelete: SetNull)
  checklist   PostChecklist[]
  attachments PostAttachment[]
  @@index([statut])
  @@index([createdById])
  @@index([dueDate])
}

model PostChecklist {
  id        String   @id @default(cuid())
  postId    String
  text      String
  checked   Boolean  @default(false)
  position  Int      @default(0)
  createdAt DateTime @default(now())
  post      PostPlanning @relation(fields: [postId], references: [id], onDelete: Cascade)
  @@index([postId])
}

model PostAttachment {
  id        String   @id @default(cuid())
  postId    String
  fileName  String
  fileUrl   String
  fileType  String   @default("application/octet-stream")
  createdAt DateTime @default(now())
  post      PostPlanning @relation(fields: [postId], references: [id], onDelete: Cascade)
  @@index([postId])
}
```

---

## 7. HISTORIQUE DES COMMITS (récents)

```
620fab9 fix: corriger type Buffer → Uint8Array pour fetch body dans supabase.ts
2ccbc4a feat: upload d'image depuis l'ordinateur pour couverture de post
fd1286a refactor: remplacer emojis par icônes Lucide React dans le kanban
1e9267f feat: remplacer labels par les 14 labels Trello (Piliers, Parcours, Contexte, Canal)
b88e2be feat: ajouter Planning Réseaux Sociaux (Kanban board)
12cfa02 fix: corriger bugs dashboard marketing
c80d79b trigger: redeploy vercel
8ab7128 feat: ajouter alertes devis expirants, objectifs commerciaux et temps conversion
```

---

## 8. ÉTAT DU DÉPLOIEMENT (au 11 mars 2026)

### Situation actuelle
| Commit | Déploiement | État |
|--------|-------------|------|
| fd1286a (icônes) | dpl_9hD7Jr5Ro9ywFt5RRK9cZxAEKZb5 | ✅ READY (production actuelle) |
| 2ccbc4a (upload) | dpl_3yxcHAnAhJAE32rrDwjGqYwMBWG9 | ❌ ERROR (TypeScript type error) |
| 620fab9 (fix type) | — | ⚠️ PAS ENCORE PUSHÉ |

### Actions requises pour débloquer
1. **`git push origin main`** — pousser le commit 620fab9 (fix TypeScript)
2. **Ajouter les env vars Vercel** :
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://dbyltdnmpinyxlpotakq.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIs...` (clé complète dans .env)
3. Vérifier que le build passe sur Vercel après le push

### Erreur du build précédent (commit 2ccbc4a)
```
Type error: No overload matches this call.
  Type 'ArrayBuffer | Buffer<ArrayBufferLike>' is not assignable to type 'BodyInit'
  at src/lib/supabase.ts:26
```
**Fix appliqué** (commit 620fab9) : changement du type paramètre de `Buffer | ArrayBuffer` à `ArrayBuffer` et utilisation de `new Uint8Array(file)` pour le body fetch.

---

## 9. MIGRATIONS SUPABASE APPLIQUÉES

1. **`add_planning_posts_kanban`** — Création des 3 tables + 2 enums + FK + index
2. **`update_post_labels_to_match_trello`** — Remplacement des 8 labels génériques par les 14 labels Trello

Ces migrations sont déjà appliquées sur la base Supabase de production. Pas besoin de les re-jouer.

---

## 10. TÂCHES FUTURES / ROADMAP

### Court terme (prioritaire)
- Tester l'upload d'images après déploiement du fix
- Vérifier le drag & drop en production
- Tester la création/édition/suppression de posts
- Ajouter la gestion des **pièces jointes** (PostAttachment) — les API routes existent dans le plan mais n'ont PAS encore été créées

### Moyen terme (fonctionnalités prévues)
- **"Nos Réseaux"** : onglet avec feed Instagram intégré dans l'espace Marketing
- **"Liens utiles"** : page de liens fréquemment utilisés
- **"Documentation / FAQ / Chatbot"** : système d'aide intégré

### Améliorations possibles du Planning
- Filtrage par label, date, recherche texte
- Vue calendrier (en plus du Kanban)
- Duplication de carte
- Archivage (au lieu de suppression)
- Notifications (date d'échéance approchante)
- Import depuis Trello (API Trello → création en masse)

---

## 11. PATTERNS & CONVENTIONS DU CODE

### API Routes
- Toutes les API utilisent `getServerSession(authOptions)` pour l'authentification
- Pattern : vérifier session → parser body → valider → opération Prisma → réponse JSON
- Import Prisma : `import { prisma } from "@/lib/prisma"`
- Import auth : `import { getServerSession } from "next-auth"` + `import { authOptions } from "@/lib/auth"`

### Composants
- Tous les composants interactifs commencent par `"use client"`
- Convention de nommage : kebab-case pour les fichiers, PascalCase pour les composants
- Les icônes viennent de `lucide-react`
- Les classes CSS utilisent le préfixe `cockpit-` pour le thème custom

### Prisma
- Le client est un singleton dans `src/lib/prisma.ts`
- Les relations sont chargées avec `include` dans les queries
- Les positions utilisent un gap de 1000 pour limiter les réordonnancements

---

## 12. INTÉGRATIONS EXTERNES

### Sellsy v2
- OAuth2 Client Credentials flow
- Utilisé pour : devis, commandes, entreprises, contacts, articles
- Variables : SELLSY_CLIENT_ID, SELLSY_CLIENT_SECRET

### Brevo
- API REST pour envoi d'emails transactionnels et campagnes
- 25€/mois
- Variable : BREVO_API_KEY

### Meta (Facebook/Instagram)
- Token d'accès pour les publications
- Variable : META_ACCESS_TOKEN

### HubSpot
- Token personnel pour certaines intégrations
- Variable : HUBSPOT_ACCESS_TOKEN

---

*Ce document constitue le briefing complet du projet KOKPIT au 11 mars 2026. Toute session Claude ou Claude Code peut s'appuyer sur ce document pour reprendre le développement.*
