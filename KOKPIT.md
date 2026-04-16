# KOKPIT — Feuille de route & référence projet

> Ce fichier est la mémoire du projet. Toute session Claude Code doit le lire en premier et le mettre à jour en fin de session. Il prime sur tout autre document.

**Dernière mise à jour** : 16 avril 2026 (v24 — Stock catalogue)
**Mis à jour par** : Session Claude Code (Sprint 16 avril — Stock catalogue)

---

## 1. QUI, QUOI, POURQUOI

**Projet** : KOKPIT — CRM SaaS interne sur mesure
**Entreprise** : DIMEXOI — mobilier, Île de La Réunion
**Utilisatrice principale** : Laurence Payet (laurence.payet@dimexoi.fr) — responsable marketing, seule dans son service
**Philosophie** : Pas une copie de HubSpot. Un outil métier 100% adapté à DIMEXOI. Chaque feature doit répondre à un vrai besoin terrain, pas à une liste de cases à cocher.

**Ce que KOKPIT n'est pas :**
- Pas un éditeur email (Brevo fait ça — KOKPIT affiche les stats et synchronise)
- Pas un ERP (Sellsy reste la source de vérité commerciale)
- Pas un outil générique
- Pas de "lead scoring", "conversion funnel", "automation engine" — vocabulaire banni

**Ce que KOKPIT est :**
- Le hub central qui agrège Sellsy + Brevo + Instagram + Meta Ads + Planning
- L'interface quotidienne de Laurence et de l'équipe commerciale
- Un outil qui s'améliore de façon incrémentale

**Vocabulaire KOKPIT :**
- ✅ Demande, Devis, Vente, Relance, Suivi, Action automatique, Priorité contact
- ❌ Deal, Lead scoring, Conversion funnel, Automation engine

---

## 2. STACK TECHNIQUE

| Élément | Valeur |
|---------|--------|
| Framework | Next.js 15 App Router |
| Langage | TypeScript strict |
| UI | React 19 + Tailwind CSS + Lucide React |
| Composants dashboard | kpi-card.tsx, conversion-time.tsx, line-chart.tsx (Recharts) |
| Classes CSS | Préfixe `cockpit-*` · `.card-hover` · `.border-cockpit` · `.shadow-cockpit-lg` |
| Police | Plus Jakarta Sans |
| Thème | LIGHT — fond page `#F5F6F7` · fond cards `#FFFFFF` |
| Accent global | Jaune `#F4B400` — logo K, avatar initials, éléments neutres hors-espace |
| ORM | Prisma 5 |
| Base de données | PostgreSQL via Supabase |
| Auth | NextAuth.js v4 (credentials provider) |
| Déploiement | Vercel |
| Repo | github.com/Laurence-de-DIMEXOI/KOKPIT (privé, branche main) |
| URL prod | https://kokpit-kappa.vercel.app |
| Supabase | Project ID `dbyltdnmpinyxlpotakq` |

**Utilitaires centralisés (ne pas dupliquer) :**
- `src/lib/sellsy-urls.ts` — `getSellsyUrl(type, id)` — format réel Sellsy query-params (`www.sellsy.com/?_f=...&id=...`) ✅ corrigé e2db685
- `src/lib/estimation.ts` — matching déterministe catalogue : 40+ abréviations DIMEXOI + 18 synonymes métier
- `src/lib/sellsy-sync/route.ts` — sync complète réécrite : individuals + companies + multi-ID par email + retry 429 backoff
- `src/lib/sellsy-statuts.ts` — `traduireStatut(status)` — 30+ statuts traduits en français
- `src/lib/contact-priority.ts` — scoring 4 niveaux (Intention + Historique + Fraîcheur) calculé à la volée
- `src/app/api/demandes/sync-sellsy/route.ts` — pré-lier contacts + micro-refresh devis/BDC 14j + check statuts Prisma ✅ réécrit 5d0727e
- `src/app/api/demandes/relance/route.ts` — envoi email relance commercial via Brevo (fallback Resend) ✅ f5911fc

- `src/lib/guide-brevo.ts` — `sendGuidePdfEmail()` — envoi guide PDF par email Brevo transactionnel (template ID 19, désactivé sans env var)
- `src/app/api/marketing/roi/route.ts` — Route ROI : CA depuis `listAllOrders()` Sellsy filtré (exclusion SAV/COMMANDE MAGASIN/FOURNISSEUR + annulés) + dépenses Meta/Google depuis leurs APIs respectives + fallback Prisma auto. `c7272c5`
- `src/app/api/webhooks/guide-download/route.ts` — webhook dimexoi.fr → KOKPIT : crée Contact + Lead + Evenement + stocke showroom + envoie email guide

**⚠️ Règle critique API Sellsy V2** : Les filtres `third_ids`, `contact_id`, `individual_ids` sont cassés — ils retournent TOUS les documents au lieu de filtrer. Solution : utiliser `findDocumentsByRelated()` — récupérer les N derniers documents et filtrer côté serveur par `related[].id`. Ne jamais utiliser ces filtres V2 directement.

**Règle Sellsy individuals/companies** : Un client B2C peut avoir 2 IDs Sellsy (1 company + 1 individual) avec le même email. Toujours utiliser le pool unifié companies + individuals. Fonction : `listAllIndividuals()` (pagination 82 pages). Map multi-ID par email : tous les IDs partageant le même email → même contact KOKPIT.

**Règle montants Sellsy** : Les montants sont retournés en string par l'API — toujours wrapper avec `Number()` avant stockage Prisma (type Float). Champ correct : `total_incl_tax` (pas `total_with_tax`).

**⚠️ Règle critique API Sellsy V1 (stock)** : `Stock.getForItem` est rate-limité et instable. Les helpers `getStockForItem` / `getStockForDeclination` (`src/lib/sellsy.ts`) **doivent propager les erreurs** (ne jamais retourner `{}` silencieusement sur catch). Sinon un parent décliné voit ses décl « réussir » avec 0 warehouses et on écrase le stock existant en base par des zéros.

**Pattern sync stock (`src/app/api/sellsy/sync-catalogue/stock/route.ts`)** :
1. **Resume mode** : boucle interne jusqu'à 270s, filtre `stockSyncedAt: null` pour piocher les items pas encore traités. Le client (`catalogue/page.tsx`) rappelle tant que `done: false` jusqu'à épuisement.
2. **Agrégation parent** : pour un item décliné, on ne stocke PAS `Stock.getForItem(parentId)` — on somme les `getStockForDeclination(parentId, declId)` par `whId` (via `parentWhMap: Map<whId, {physical, reserved, available}>`). Évite les divergences Sellsy entre niveau parent et niveau décl.
3. **Ne jamais écraser avec des zéros** : un parent n'est écrit (`itemAggs.set`) QUE si `declSuccess > 0 && declErrors === 0`. Sinon, `failedItems.add(parentId)` → `stockSyncedAt` non marqué → retenté au passage suivant.
4. **Items simples** : `getStockForItem(id)` dans un `try/catch` — en cas d'erreur, `failedItems.add(id)` et pas d'écriture. Les données existantes survivent.
5. **Flush parallèle** : `itemAggs` + `declAggs` sont écrits en parallèle via `Promise.all` à la fin de chaque batch pour éviter de perdre des données si le batch suivant plante.

**Pattern affichage stock (catalogue)** :
- `stock_available` (agrégat parent) est la somme des déclinaisons — à ne jamais utiliser comme filtre si le parent est décliné (masquerait des décl en stock).
- Filtre catalogue (`page.tsx` `matchesStockFilter`) : applique par ligne affichée (parent simple OU décl), pas sur l'agrégat. Les parents déclinés passent systématiquement `filtered`, puis leurs décl sont filtrées une par une dans `displayRows`.
- `fetchDeclinations` (lazy load) **doit merger** les décl existantes en préservant `stock_physical/reserved/available/by_warehouse` : l'endpoint `/api/sellsy/items/[itemId]/declinations` ne renvoie PAS le stock (seulement prix) → écraser naïvement fait perdre le stock chargé par `/api/catalogue`.
- Affichage `—` vs `0` (composant `StockBadge`) : `—` = pas d'entrée Sellsy pour ce warehouse, `0` = Sellsy retourne explicitement `available=0`. Ne pas confondre.

**Règles techniques non négociables :**
- DnD : HTML5 natif partout, pas de librairie externe
- Positions Kanban : gap de 1000
- TypeScript strict — pas de `any`, pas d'exceptions
- Skeleton loading obligatoire sur toutes les pages avec données API externes — toujours avec classes `cockpit-*` (`bg-cockpit-dark`, `border-cockpit`, `bg-cockpit-card`) — jamais `bg-gray-200`
- Cache Sellsy : 3 min minimum
- LiaisonDocumentaire : stocker `parentid` Sellsy V1 en base dès la première découverte — ne jamais rappeler V1 deux fois pour le même document
- Sellsy V1 : accessible via Bearer token V2 — `sellsyV1Call()` dans `src/lib/sellsy.ts`
- Couleurs dynamiques : toujours via `var(--color-active)` — jamais hardcodées par espace
- Vert = positif, Rouge = urgent/danger — règle universelle immuable

---

## 3. SYSTÈME DE DESIGN — MENU UNIQUE + DA HARMONISÉE ✅ v18

### Navigation — Menu unique sidebar (plus d'onglets espaces)

Un seul menu sidebar pour tous les utilisateurs. 5 catégories collapsibles, filtrées par permissions (`moduleAccessOverrides` sur table User dans Supabase). Plus de topbar avec onglets.

| Catégorie | Couleur active | Gradient | Pages |
|-----------|---------------|----------|-------|
| Commercial | `#4C9DB0` Moonstone | → `#FEEB9C` | Dashboard, Demandes, Contacts, BDO, Pipeline, Commandes, Traçabilité, SAV, Catalogue |
| Marketing | `#E36887` Blush | → `#FEEB9C` | Dashboard, Campagnes, Emailing, Planning, Réseaux, Auto., ROI |
| Achat | `#CBA1D4` Lavender | → `#FEEB9C` | Need Price, Calculateur, Suivi commandes (Trello) |
| Administration | `#F17142` Orange | → `#FEEB9C` | Dashboard, Collaborateurs, Congés, Pointage, Pt. Équipe, Paramètres |
| Général | `#F4B400` Jaune KOKPIT | → `#FEEB9C` | Messagerie, Tâches, Club Tectona, Liens utiles, Docs |

**DA harmonisée** : même style partout (sauf Club Tectona qui garde vert mousse `#515712`) :
- KPI cards : fond blanc + barre gradient couleur active → Butter Yellow `#FEEB9C`
- Boutons principaux : gradient couleur active → Butter Yellow
- Headers drawer/modale : gradient couleur active → Butter Yellow

### Permissions — Supabase (plus de page permissions dans KOKPIT)

Table `User`, colonne `moduleAccessOverrides` (JSON). Pour bloquer un module : `{"pipeline": false}`. Pour ajouter : `{"need-price": true}`.

**Accent global** : `#F4B400` jaune — logo K, avatar initials, Général.
**Vert/Rouge universels** : positif = vert, urgent/danger = rouge. Jamais remplacés.

### Implémentation technique

```css
/* globals.css — tokens CSS */
[data-espace="commercial"] {
  --color-active: #0E6973;
  --color-active-light: rgba(14,105,115,0.08);
  --color-active-border: rgba(14,105,115,0.25);
}
[data-espace="marketing"] {
  --color-active: #C2185B;
  --color-active-light: rgba(194,24,91,0.08);
  --color-active-border: rgba(194,24,91,0.25);
}
[data-espace="admin"] {
  --color-active: #D15F12;
  --color-active-light: rgba(209,95,18,0.08);
  --color-active-border: rgba(209,95,18,0.25);
}
[data-espace="achat"] {
  --color-active: #E23260;
  --color-active-light: rgba(226,50,96,0.08);
  --color-active-border: rgba(226,50,96,0.25);
}
```

- `layout.tsx` injecte `data-espace={activeSpaceId}` sur le wrapper principal
- Topbar (underline + texte actif), Sidebar (bordure gauche 4px + fond), boutons CTA → tous via `var(--color-active)`
- KPI cards : gradient 135deg sur les couleurs de l'espace, texte blanc, icône sur fond white/20, hover `-translate-y-0.5`

### Composants KPI cards

- `src/components/dashboard/kpi-card.tsx` — gradient map 5 couleurs de base + 5 variantes leads
- `src/components/dashboard/conversion-time.tsx` — temps moyen devis→commande, gradient Teal foncé (`#0E6973` → `#0A4F57`)
- `src/components/dashboard/line-chart.tsx` — graphique Recharts réutilisable

---

## 4. RÔLES ET ACCÈS

| Rôle | Espaces accessibles |
|------|-------------------|
| ADMIN | Administration · Commercial · Marketing · Achat |
| DIRECTION | Administration · Commercial · Marketing · Achat |
| COMMERCIAL | Commercial uniquement |
| MARKETING | Marketing uniquement |
| ACHAT | Achat uniquement (rôle à créer — voir section 17) |

Règle topbar : si un utilisateur n'a accès qu'à un seul espace, les onglets espaces sont masqués.

---

## 5. INTÉGRATIONS EXTERNES

| Service | Usage | Clé d'env | API Route |
|---------|-------|-----------|-----------|
| Sellsy V2 | Contacts, devis, commandes, catalogue, funnel, tâches | `SELLSY_CLIENT_ID` / `SELLSY_CLIENT_SECRET` | `/api/sellsy/` |
| Sellsy V1 | parentid chaîne documentaire (Bearer V2, scope "API V1" à activer dans Sellsy) | Mêmes credentials | `sellsyV1Call()` |
| Brevo | Stats email + sync listes + webhooks signaux engagement (plan **Starter** — pas d'export webhook) | `BREVO_API_KEY` | `/api/brevo/` |
| Meta Ads | Campagnes publicité (sync) | `META_ACCESS_TOKEN` + `META_ACCESS_TOKEN_EXPIRES_AT` | `/api/meta/` |
| Supabase | Storage Upload images couverture Planning | `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` | — |
| Anthropic | Chatbot KOKPIT (Haiku) | `ANTHROPIC_API_KEY` | — |
| Brevo Club Tectona | 6 listes auto-créées par nom (pas d'env vars) | `findOrCreateList()` dans club-sync.ts | `/api/club/` |
| Sellsy Bois d'Orient | Extraction données enseigne fermée (contacts + factures + commandes + devis + PDFs) | `SELLSY_BDO_CLIENT_ID` / `SELLSY_BDO_CLIENT_SECRET` | `/api/admin/bois-dorient/` |
| Supabase Storage BDO | PDFs documents Bois d'Orient | Bucket `bois-dorient-docs` | — |

**Règle cache parentid** : appeler V1 une seule fois par document → stocker en LiaisonDocumentaire → ne plus jamais rappeler V1 pour ce document. Cache API route 30 min.

---

## 6. ARCHITECTURE NAVIGATION ✅ DÉPLOYÉE

Option B : Topbar horizontale (espaces) + Sidebar allégée (menu contextuel).

```
┌─────────────────────────────────────────────────────────────────────────┐
│ [KOKPIT] │ Administration │ Commercial │ Marketing │ Achat │ [👤 User]  │
├──────────┬──────────────────────────────────────────────────────────────┤
│ Menu     │                                                              │
│ espace   │              Contenu de la page                              │
│ actif    │                                                              │
│ ──────── │                                                              │
│ GÉNÉRAL  │                                                              │
│ · Docs   │                                                              │
│ [👤 Nom] │                                                              │
└──────────┴──────────────────────────────────────────────────────────────┘
```

Fichiers : `topbar.tsx` ✅ · `sidebar.tsx` ✅ · `nav-config.ts` ✅ · `(app)/layout.tsx` ✅

Persistance espace actif : localStorage clé `kokpit_espace_actif`

### Pages déployées par espace

**Commercial** (`/commercial/`) :
- `page.tsx` — Dashboard : 5 KPI cards gradient Teal + ConversionTime + tableaux devis/commandes + graphiques CA
- `taches/page.tsx` — Gestion des tâches
- `tracabilite/page.tsx` — Traçabilité + chaîne documentaire
- `commandes/page.tsx` — Liste commandes
- `catalogue/page.tsx` — Catalogue produits
- `pipeline/page.tsx` — Pipeline commercial

**Marketing** (`/dashboard/`, `/contacts/`, `/leads/`, `/emailing/`, `/campagnes/`) :
- `dashboard/page.tsx` — Funnel 4 KPI cards Raspberry + entonnoir visuel + graphique courbes + tableau mensuel + contacts sans devis
- `contacts/page.tsx` + `[id]/page.tsx` — Liste avec recherche/filtres/pagination + fiche détaillée
- `leads/page.tsx` + `[id]/page.tsx` — Liste leads + fiche
- `emailing/page.tsx` + `listes/page.tsx` — Campagnes Brevo + listes de diffusion
- `campagnes/page.tsx` — Campagnes Meta Ads

**Administration** : `/administration` · `/administration/collaborateurs` · `/administration/conges` · `/administration/pointage` · `/administration/pointage/equipe`

**Commercial supplémentaire** : `/commercial/sav` (SAV/Litiges) · `/commercial/bois-dorient` (Migration BDO)

**Autres** : `/planning` · `/marketing/club` (Club Tectona) · `/marketing/liens-utiles` · `/marketing/nos-reseaux` · `/docs` · `/parametres` · `/login`

---

## 7. ÉTAT DU PROJET

### ✅ EN PRODUCTION — TOUT DÉPLOYÉ

| ID | Feature | Commit / Notes |
|----|---------|---------------|
| — | Auth NextAuth.js v4 + 4 rôles | ✅ |
| — | Planning Kanban 8 colonnes, DnD HTML5, checklist, upload image | ✅ |
| — | Cache API Sellsy 3 min + fresh=true | ✅ |
| — | Performance backend (cache, funnel dynamique) | `0ec6d05` |
| — | Performance frontend (useMemo x8, lazy load, polling 60s) | `6fef0ef` |
| — | Notifications, EmptyState, ErrorState, FreshnessIndicator | `0ed4ef6` |
| — | Refonte design — système couleurs par espace, KPI cards gradient | ✅ |
| 12 mars | AUD sellsy-urls.ts centralisé + sellsy-statuts.ts 30+ statuts FR | `29f02dc` |
| AUD | Login redirect par rôle + suppression boutons sync manuels | `b623f08` |
| AUD | Recherche globale 6 catégories | `1211b2b` |
| AUD | Dashboard commercial liens Sellsy + traçabilité search bar | `384767c` |
| AUD | Dashboard marketing skeleton loading | `14a531f` |
| AUD | Diagnostic Meta + Brevo APIs amélioré | `f995680` |
| AUD | Fix URLs Sellsy — format réel query-params | `e2db685` |
| AUD7 | Matching déterministe leads — estimation.ts (40+ abbréviations, 18 synonymes) | `f64344c` |
| AUD10 | Fix API Sellsy V2 — findDocumentsByRelated() + sync réécrite | `bfddb2a`→`c245f1d` |
| AUD10 | Email normalisé (trim/lowercase) · Dollar→Euro · boutons illisibles corrigés | `bfddb2a`→`c245f1d` |
| AUD11 | Dashboard prix réels `total_incl_tax` · section devis/BDC avant perf financière | `551211d` |
| AUD11 | Sync individuals Sellsy (8170) + multi-ID par email + retry 429 backoff | `4b2185b` |
| AUD11 | KPIs contacts 100% Prisma (fiable) — 1 377 devis · 139 BDC · 156 991€ CA | `059e17d` |
| AUD11 | Scoring 4 niveaux — Intention+Historique+Fraîcheur · tooltip détaillé | `ddf18ac` |
| AUD11 | Performance — Promise.all parallèle · cache localStorage contacts (1x/heure) | `8b9c234` |
| AUD12 | Devis à relancer cliquables → liens Sellsy | `92b54de` |
| AUD12 | Sync leads 100% Prisma — 0 appel API Sellsy (3min → <1s) | `f5911fc` |
| AUD12 | Bouton relance commercial — email urgent Brevo au commercial assigné | `f5911fc` |
| AUD12 | SLA masqué quand statut DEVIS ou VENTE (demande traitée) | `2dc583d` |
| AUD12 | Micro-refresh Sellsy 14j + pré-lier contacts sans sellsyContactId | `be9c999`→`5d0727e` |
| AUD8 | Historique Sellsy par email — fallback + auto-save sellsyContactId | `f64344c` |
| AUD10 | Skeletons cockpit (catalogue + emailing) — classes cockpit-* | `f64344c` |
| C1 | Tri + filtre Pipeline devis | ✅ |
| C2 | Liens PDF / Sellsy | `badbac1` |
| C3 | Traçabilité Devis → Commandes (3 onglets, 4 KPIs) | `9998768` |
| C3bis | Chaîne documentaire parentid V1, cache BDD permanent | `7eb8ab2` |
| C4 | Fiches contacts enrichies | `badbac1` |
| C5 | Alertes devis expirants | ✅ |
| C6 | Redesign drawer Catalogue | `badbac1` |
| M1 | Liens Utiles | `4804911` |
| M2 | KPIs Brevo — dashboard Marketing | ✅ |
| M2bis | Sync contacts Sellsy → Brevo (4 segments) | ✅ |
| M3 | Nos Réseaux + Feed Instagram | `acc6902` |
| M4 | Docs + FAQ + Chatbot (Claude Haiku) | `678964d` |
| NAV | Navigation Option B — Topbar + Sidebar | `293621c` |
| M5 | Vue Calendrier mensuel Planning | Toggle Kanban/Calendrier, scheduledDate, légende labels, impression checklist |
| M5-seed | Seed cartes Marketing Mars 2026 | 13 cartes injectées via script |
| PROFIL | Mon Profil — formulaire éditable + session refresh JWT | `e9bc82f` |
| C-STAFF | Nom commercial sur devis/commandes dashboard | API /api/sellsy/staffs |
| M6 | Formulaire enrichi Anti-IA | FormatSignatureSelector dans PostModal — formats VIDEO_REEL + STORY, script lecture seule, pré-remplissage titre/description |
| USERS | Gestion utilisateurs enrichie | Ajout champs titre/telephone, rôle ACHAT, 4 nouveaux utilisateurs |
| CLUB | Club Tectona — Programme de fidélité | Voir section 18 — 5 niveaux, sync Sellsy + Brevo, DA mousse #515712, polices Perandory/Burgues Script, page /marketing/club |
| BDO | Migration Bois d'Orient | Extraction Sellsy BDO + matching contacts + intégration Club Tectona + PDFs Supabase + tag BO + segment Brevo — page /administration/bois-dorient |
| POINTAGE | Module Pointage complet | Page employé (bouton dynamique, horloge, historique) + page manager (vue équipe, récap mensuel, correction, export CSV) + délégation Michelle→Georget + exclusion Liliane/Alain + popup café ☕ |
| SAV | Module SAV/Litiges | Page /commercial/sav — 4 KPIs, filtres, drawer détail, documents, commentaires, autocomplete contact, numéro auto SAV-2026-XXXX, assigné limité (Michelle/Daniella/Bernard/Elaury), intégré fiche contact |
| CONGES-RESP | Congés responsive mobile | Table→cards mobile, calendrier 1 col, boutons tap-friendly, modal périodes responsive |
| MODAL-FIX | Fix modales congés | createPortal pour échapper overflow layout parent |
| RENAME | Club Grandis → Club Tectona | Renommage complet : code, logo (croppé), Brevo listes + templates, KOKPIT.md, nav, auth-utils, cron. Niveau V = "Le Tectona Grandis" |
| EMAILS-CLUB | 1 429 emails Club Tectona envoyés | Tous niveaux : V (3) + IV (39) + III (90) + II (385) + I (904). Templates Brevo IDs 14-18, showrooms dans footer, lien dimexoi.fr/club-grandis |
| BREVO-TPL | Templates Brevo mis à jour | Alignés avec le site dimexoi.fr/club-grandis : avantages cumulatifs, remises avec durée, conditions, logo Club Tectona, infos showrooms SUD+NORD |
| COMPTES | Comptes utilisateurs + première connexion | 9 comptes avec email d'invitation (lien token 24h → page set-password). Laurent corrigé → laurent@dimexoi.fr. Alain séparé de admin@kokpit.re (dev) |
| ROLES | Permissions par rôle affinées | Admin (Michelle/Liliane/Alain) : tout. Marketing (Laurence) : tout sauf pointage équipe. Commercial (Bernard/Daniella/Laurent) : Commercial + Général + congés/pointage. Achat (Elaury) : Commandes + SAV + Catalogue + congés/pointage |
| ACHAT-BLOCK | Section Achat temporairement bloquée | Commentée dans nav-config.ts — invisible pour tous les rôles. À réactiver lors du développement espace Achat (ACH1) |
| NAV-CLEAN | Nettoyage navigation | Club Tectona + Liens utiles retirés des doublons Commercial/Marketing → dans Général uniquement. Tâches dans Général |
| BREVO-STATS | AUD-BREVO classé | Limitation plan Brevo Starter : l'API REST ne retourne pas les stats campagnes. Export webhook nécessite plan Professional+. Pas de fix possible |
| CRON-EMAIL | Cron 6h05 : emails Club Tectona automatiques | Si un membre monte de niveau lors du sync commandes → email envoyé automatiquement via Brevo transactionnel |
| MSG | Messagerie temps réel | Canaux (#général, #commercial, #marketing, #urgences) + DM privés + notifications non-lus badge sidebar + polling 15s |
| NEED-PRICE | Module Need Price (Achat) | Formulaire demande prix sur-mesure → email Elaury (dimexoidepi@gmail.com) avec PJ image. Finitions: Natural/Raw/WW/BW/Antic. Drawer avec détail prix par article |
| CALC | Calculateur prix Elaury | Base IDR → prix EUR (change/coeff revient/coeff marge/TVA 8.5%/transport). Calcul temps réel, multi-lignes avec noms, push prix → Need Price (type Min-Arrondi ou Cuisine) |
| TRELLO | Suivi commandes Trello (lecture seule) | Recherche par réf/nom client → affiche dernier check coché de chaque carte. API Trello lecture seule, jamais modifier. Cache 5min |
| SOLDE-H | Solde heures cumulé pointage | Accumulation automatique heures supp/manque. Seuil récup = 4h (ConfigPointage). Route /api/pointage/recup pour consommer. Correction manager ajuste le solde |
| METEO | Météo temps réel pointage | Open-Meteo API (gratuit, pas de clé). Coordonnées Saint-Pierre La Réunion (-21.34, 55.48). Affichée à côté de l'horloge |
| TACHES-COLLAB | Tâches avec collaboration | Champ "En collaboration avec" + statut invitation (INVITE/ACCEPTE/REFUSE). Le collaborateur peut accepter ou refuser |
| CATALOGUE-V2 | Catalogue déclinaisons complètes | Chaque déclinaison a sa propre ligne, checkbox, drawer, étiquette. Prix TTC calculé depuis TVA parent (ratio TTC/HT Sellsy, fallback 8,5%). Prix achat hérité du parent si absent sur la déclinaison. Drawer déclinaison via `openDeclDrawer` → virtual SellsyItem avec id=parentItem.id + `sellsyUrlOverride` vers `getSellsyDeclUrl(parentId, declId)`. Mémo étiquettes déplacé au-dessus des KPIs |
| CATALOGUE-PRINT | Fiche de prélèvement | Remplacement impression étiquettes → fiche A4 tableau (# / Référence / Désignation / Code-barre CODE128 / Qté vide). Workflow : rechercher → cocher → changer recherche → cocher → imprimer. La sélection persiste à travers les recherches (checkedIds + checkedDeclIds en état React). Commit `1d503db` |
| CATALOGUE-STOCK | Suppression affichage stock catalogue | Sellsy V1 `Stock.getForItem` rate-limité (429) dès que plus de ~8 appels/min. `fetchAllStock` auto = 125+ appels → throttle total. Solution : colonne STOCK supprimée, filtre stock supprimé, chargement stock supprimé. `getStockForItem` rendu robuste (gère array, objet plat, objet imbriqué, catch 429). Commit `1d503db` |
| CATALOGUE-STOCK-V2 | Sync stock Sellsy V1 robustifié + filtre par déclinaison | `getStockForItem` / `getStockForDeclination` propagent désormais les erreurs (avant : `{}` silencieux → écrasement zéros). Sync `/api/sellsy/sync-catalogue/stock` : agrège les `byWh` des décl au niveau parent (`parentWhMap`), n'écrit le parent QUE si aucune décl en erreur, `failedItems` Set pour re-tenter au passage suivant (resume mode via `stockSyncedAt: null`). Catalogue : `matchesStockFilter` appliqué ligne par ligne (décl ou item simple) au lieu de l'agrégat parent, `fetchDeclinations` merge les décl pour préserver stock déjà chargé. Commits `9114c85`, `5396c60`, `2d83886`, session 16 avril |
| STOCK-CACHE | Cache Supabase stock persistant | Table `stock_cache` (key, data JSONB, cached_at, expires_at). Modèle Prisma `StockCache` + `@@map("stock_cache")`. Classe `db-cache.ts` → `dbStockCache.get/set/getStale` async avec fallback mémoire si DB inaccessible. TTL 30 min. Partagé entre toutes les instances Vercel (vs in-memory qui est par instance). Endpoint `/api/sellsy/stock/[itemId]` : retry auto sur 429 (attente 2,5s). Endpoint `/api/sellsy/stock/all` : batch de 5 avec 1,2s de délai. Commit `1d503db` |
| PASSERELLE | Passerelle dimexoi.fr ↔ KOKPIT | Webhook `/api/webhooks/guide-download` reçoit leads guide SDB depuis dimexoi.fr → crée Contact (avec showroomId SUD/NORD) + Lead + Evenement. Envoi PDF par email Brevo (template ID 19, désactivé sans `BREVO_GUIDE_SDB_TEMPLATE_ID`). Compteur téléchargements dans dashboard ROI. Segment Brevo "Guide SDB teck". Côté dimexoi.fr : formulaire avec showroom préféré, tracking Meta Pixel Lead + GTM + Google Ads conversion, webhook Meta Ads `/api/webhooks/meta-leads` pour formulaires natifs Facebook |
| CALENDLY | Module Rendez-vous Calendly complet | Widget CalendlyWidget.tsx (inline + popup) intégré sur 3 pages dimexoi.fr (contact inline, fiches produit popup, guide popup post-submit). Webhook Calendly → dimexoi.fr → KOKPIT `/api/webhooks/calendly-rdv`. Modèle RendezVous (statuts CONFIRME/HONORE/ANNULE). Page `/commercial/rendez-vous` avec 4 KPIs + tableau filtrable + actions statut. API routes GET liste + GET stats + PATCH statut. EvenementType RDV_PRIS + RDV_ANNULE. Ajouté dans sidebar Commercial |
| X9-RFM | Segmentation RFM | 5 segments (Champions, Loyaux, À risque, Perdus, Nouveaux) calculés à la volée. Export vers listes Brevo |
| X8-ROI | ROI Marketing | Page /marketing/roi — dépenses multi-canal (Meta, Google, Salon, Agence) + CA + ROI% + CAC réel |
| ROI-BDC | ROI Marketing — CA depuis BDC Sellsy filtrés | CA calculé depuis `listAllOrders()` Sellsy (BDC) au lieu des factures Prisma. Exclusion : champs perso SAV/COMMANDE MAGASIN/FOURNISSEUR + statuts annulés. Fallback auto Prisma si Sellsy indisponible. Colonnes Meta/Google conditionnelles dans tableau mensuel. `c7272c5` |
| ROI-META-API | ROI Marketing — Meta Ads API mensuelle | Dépenses Meta depuis `/insights?time_increment=monthly` (API Graph). Anti-doublon : si API active, les entrées manuelles meta_ads ignorées. `c7272c5` |
| ROI-GOOGLE-API | ROI Marketing — Google Ads API mensuelle | Dépenses Google depuis GAQL `SELECT segments.month, metrics.cost_micros`. OAuth refresh_token → access_token. Anti-doublon idem. `c7272c5` |
| X6-NOTIF | Notifications topbar | 5 types : token Meta expirant, devis expirant, SLA 72h, congé à valider, tâche assignée. Cloche avec badge |
| RECAP-HEBDO | Récap hebdomadaire email | Cron lundi 7h — email à Laurence + Michelle : demandes reçues, statut traitement, devis associés, KPIs |
| RESET-PWD | Reset password par email | Lien token 24h → page /set-password. Envoi via Brevo transactionnel. Route /api/auth/set-password + /api/auth/send-reset |
| DA-HARMO | DA harmonisée tous espaces | Gradient 2 couleurs (couleur active → Butter Yellow #FEEB9C) partout. Cards blanches + barre colorée. Sauf Club Tectona (vert mousse) |
| MENU-UNIQUE | Menu unique sidebar | Plus d'onglets espaces dans la topbar. 5 catégories collapsibles (Commercial/Marketing/Achat/Admin/Général) filtrées par permissions |
| PERMS-SUPA | Permissions via Supabase | Page /administration/permissions supprimée. Gestion directe dans Supabase table User colonne moduleAccessOverrides (JSON) |
| TZ-REUNION | Fuseau horaire La Réunion | UTC+4 appliqué partout (pointage, congés, cron). Fonction getReunionDateJour() centralisée |
| CAFE | Popup café ☕ | Rotation hebdomadaire Planning CAFE 2026 (Excel importé). Popup fun au pointage arrivée quand c'est ta semaine |

**Nettoyage effectué :**
- [x] Route `/api/sellsy/diagnostic` supprimée
- [x] Post test "TEST - Post de vérification" supprimé

### 🔧 RESTE À FAIRE — SUITE AUDIT

| # | Item | Priorité | Notes |
|---|------|----------|-------|
| ~~AUD7~~ | ~~Matching produits déterministe sur leads~~ | ✅ | estimation.ts — f64344c |
| ~~AUD8~~ | ~~Retrouver devis/BDC par email dans le drawer contacts~~ | ✅ | searchContactByEmail() — f64344c |
| ~~AUD10~~ | ~~Skeletons cockpit (catalogue + emailing)~~ | ✅ | f64344c |
| ~~AUD-NAV~~ | ~~Login : redirect par rôle~~ | ✅ | b623f08 |
| ~~AUD-SEARCH~~ | ~~Recherche globale étendue (6 catégories)~~ | ✅ | 1211b2b |
| ~~AUD-TRAC~~ | ~~Traçabilité : search bar + liens~~ | ✅ | 384767c |
| ~~AUD12~~ | ~~Sync leads perf — 100% Prisma~~ | ✅ | f5911fc |
| ~~AUD12~~ | ~~Relance commercial par email~~ | ✅ | f5911fc |
| ~~AUD12~~ | ~~SLA intelligent (masqué si traité)~~ | ✅ | 2dc583d |
| ~~AUD10-CB~~ | ~~Code-barres + impression étiquettes catalogue~~ | ✅ | JsBarcode v3.12.3 installé, CODE128, composant `barcode-label.tsx`, impression individuelle (drawer) + multi-sélection (62mm x 100mm thermique). Pas de modèle ProduitBarcode nécessaire — codes générés à la volée depuis référence Sellsy |
| ~~AUD-META~~ | ~~Debug Meta Ads~~ | ✅ | Token ok — ajouter filtre "mois en cours" par défaut |
| ~~AUD-BREVO~~ | ~~Debug campagne Brevo "Semaines Privilege" à zéro~~ | ⚠️ | Limitation plan Brevo Starter — l'API REST v3 ne retourne pas les stats pour certaines campagnes (dashboard Brevo les affiche). Fallback appel individuel ajouté (`c1688e9`). Export webhook dispo uniquement sur plan Professional+. Pas de fix possible côté KOKPIT |

---

## 8. DÉCISIONS TECHNIQUES ACTÉES

| Sujet | Décision | Raison |
|-------|----------|--------|
| Éditeur email | ❌ Pas dans KOKPIT | Brevo fait ça |
| Sync contacts | ✅ KOKPIT pont Sellsy→Brevo via API | Pas de CSV, pas de Zapier |
| Segments Brevo | 4 fixes Sellsy→Brevo + 5 listes Club Tectona + listes dynamiques (X5) | Voir sections 14 et 18 |
| Lien devis→commande | Croisement via contact_id | API V2 sans lien direct |
| Chaîne documentaire | V1 via Bearer V2 — stockage BDD définitif | Chaîne immuable, V1 lente |
| Sellsy V1 auth | Bearer token V2 suffit — pas d'OAuth1 séparé | Confirmé en dev |
| Scoring contacts | Calculé à la volée, jamais stocké, jauge colorée 4 niveaux | Toujours à jour |
| Couleurs espaces | CSS custom properties + data-espace | Dynamique, maintenable |
| Vert/Rouge | Toujours universels — jamais remplacés couleur espace | Lisibilité sémantique |
| Accent global | `#F4B400` hors-espace uniquement | Cohérence identité |
| DnD | HTML5 natif | Pas de dépendance externe |
| Vue Planning | Toggle Kanban + Calendrier, pas de librairie externe | CSS Grid natif, même modèle PostPlanning |
| Vue par défaut | Calendrier (localStorage kokpit_planning_vue) | Demande Laurence 17/03/2026 |
| Positions Kanban | Gap de 1000 | Réordonnancement sans recalcul |
| Chatbot | claude-haiku-4-5-20251001 | Coût réduit |
| Cache Sellsy | 3 min (revalidate: 180) | Équilibre fraîcheur/perf |
| Skeleton loading | Obligatoire sur toutes les pages API | UX non bloquante |
| Formats Anti-IA | Données statiques dans src/data/formats-anti-ia.ts | Pas de table Prisma — données stables, non multi-utilisateur |
| Performance frontend | useMemo sur listes longues, lazy load chatbot, polling 60s | Confirmé P0bis |
| KPIs contacts | 100% Prisma — plus de filtres Sellsy V2 cassés | Fiable et rapide |
| Sync contacts auto | Cache localStorage 1x/heure max | Évite sync 6min à chaque visite |
| Sellsy V2 filtres | CASSÉS — utiliser `findDocumentsByRelated()` uniquement | Confirmé AUD10 |
| Montants Sellsy | Toujours `Number()` — champ `total_incl_tax` | String→Float, bon nom champ |
| Sync statuts leads | Pré-lier + micro-refresh 14j (2-5 appels API) + check Prisma | 3min → ~3s — 5d0727e |
| Relance commercial | Email Brevo transactional (fallback Resend) + log Evenement RELANCE | f5911fc |
| SLA leads | Masqué si statut DEVIS ou VENTE — la demande est traitée | 2dc583d |
| Club Tectona — Design | DA séparée de KOKPIT : monochrome blanc + `#515712`, polices Perandory/Burgues Script + fallback Cormorant Garamond | Pas de `var(--color-active)` |
| Club Tectona — Sync | Manuelle uniquement (bouton), embed contact+company, fallback fetch /individuals/ /companies/, batch 10 | Pas de cron, pas d'auto-sync |
| Club Tectona — Niveaux | Client ne descend jamais de niveau. Niveau V (Le Tectona Grandis) : ≥20k€, permanent, automatique | Règle métier immuable |
| Club Tectona — Exclusions | Équipe interne exclue par nom+prénom exact (pas par nom seul → homonymes clients protégés) | DIMEXOI, Batisse, Legros/Perrot, Payet, Dammbrille, Decaunes |
| Bois d'Orient — Matching | Email exact uniquement (lowercase + trim). Jamais de matching sur nom seul | Évite les faux positifs |
| Bois d'Orient — CA fidélité | CA basé sur les **factures** BDO (pas commandes). Combiné avec CA DIMEXOI pour le Club Tectona | Cohérence avec le calcul Club |
| Pointage — Sécurité | userId TOUJOURS depuis `session.user.id`, jamais depuis body/params. Manager = ADMIN+DIRECTION | Règle non négociable |
| Pointage — Délégation | `User.pointageDelegueId` : Michelle pointe pour Georget. `User.pointageActif` : exclut Liliane/Alain | Cas métier spécifique |
| Pointage — Horaires | 7h travail effectif/jour, 1h pause par défaut, repos dimanche+lundi | Spécifique La Réunion |
| Pointage — Café | Popup fun au pointage arrivée si c'est la semaine café (rotation 4 personnes, planning 2026) | Engagement équipe |
| SAV — Numérotation | SAV-YYYY-NNNN auto-incrémenté, unique | Traçabilité |
| SAV — Assignation | Limité à Michelle, Daniella, Bernard, Elaury (filtre côté UI) | Décision métier |
| SAV — Soft delete | Seul ADMIN peut supprimer (soft delete via deletedAt) | Protection données |
| Congés — Modales | createPortal(document.body) obligatoire pour les modales dans le layout (app) | Layout a overflow qui casse fixed |
| Bois d'Orient — PDFs | Stockés dans Supabase Storage bucket `bois-dorient-docs`, path `{clientBdoId}/{type}-{reference}.pdf` | Pérenne même après fermeture Sellsy BDO |
| Bois d'Orient — Sellsy | Client séparé `sellsy-bdo.ts` avec ses propres credentials et cache. Fichier temporaire, supprimable après migration | Pas de pollution du client DIMEXOI |
| Club Tectona — Emails | Templates Brevo IDs 14-18 (actifs). Sender : DIMEXOI / laurence.payet@dimexoi.fr. Avantages cumulatifs rappelés. Footer avec showrooms SUD (St-Pierre) + NORD (St-Denis) + lien dimexoi.fr/club-grandis | Cohérence avec le site vitrine |
| Club Tectona — Sync tags | Ne retagger que les membres avec `sellsySynced=false`. Batch séquentiel avec pause 150ms. Flag remis à false seulement si niveau change | Optimisation : 0 appel API si 0 changement |
| Club Tectona — Brevo listes | Auto-créées par nom via `findOrCreateList()`. Pas d'IDs env vars nécessaires (les BREVO_CLUB_LIST_ID_* dans Vercel sont optionnels) | Simplifie le déploiement |
| Comptes utilisateurs | Système première connexion : token 64 chars + expiry 24h + page /set-password. Mot de passe hashé bcrypt. admin@kokpit.re = compte dev séparé | Pas de mot de passe en clair par email |
| AUD-BREVO | Stats campagnes à 0 dans l'API = limitation plan Starter Brevo. L'API `/v3/smtp/statistics/aggregatedReport` fonctionne (stats transactionnelles). Export webhook nécessite plan Professional+ | Pas de fix possible côté KOKPIT |
| Section Achat | Temporairement commentée dans nav-config.ts. À réactiver pour ACH1 | En attente de développement |
| Catalogue — Stock | Colonne STOCK supprimée. Sellsy V1 rate-limit 429 incompatible avec chargement masse (2500+ items). Seule la fiche de prélèvement (print) est utile | 1d503db |
| Catalogue — TVA | TVA calculée depuis ratio TTC/HT Sellsy. Fallback 8,5% (TVA La Réunion) | 1d503db |
| Catalogue — Déclinaisons | ID parent (`item.id` V2) utilisé pour toutes les opérations stock et drawer. V2 decl IDs ≠ V1 declids — ne jamais passer un V2 decl ID à l'API V1 | 1d503db |
| Cache stock | `db-cache.ts` → `dbStockCache` Supabase avec fallback in-memory. Toujours préférer le cache DB pour partager entre instances Vercel | 1d503db |
| `getSellsyDeclUrl` | Nouvelle fonction dans `sellsy-urls.ts` : `getSellsyDeclUrl(parentItemId, declId)` → URL Sellsy avec `&declid=` | 1d503db |
| Horaires La Réunion | Repos dimanche + lundi (pas samedi + dimanche). Showroom SUD : Mar-Sam 9h-17h. Showroom NORD : Mar-Sam 10h-13h & 14h-18h | Spécifique DOM |
| Email Laurent Batisse | laurent@dimexoi.fr (pas laurent.batisse@dimexoi.fr) | Corrigé en base |
| Lead magnet guide SDB | PDF hébergé sur dimexoi.fr `/public/guides/`, lien envoyé via Brevo transactionnel (template ID 19) | Simplicité, pas de Supabase |
| Showroom préféré | Stocké via `showroomId` existant sur Contact (showroom_sud / showroom_nord), pas de nouveau champ | Réutilise le modèle Showroom existant |
| Pas de distribution commerciale guide | Le showroom est stocké comme info mais pas d'assignation automatique de commercial sur les leads guide | Décision Laurence 4 avril |
| Webhook Meta Ads | Endpoint sur dimexoi.fr `/api/webhooks/meta-leads` qui forward vers KOKPIT `/api/webhooks/guide-download` au même format | Même flux que formulaire site |
| Template Brevo guide | ID 19, désactivé par défaut. Activé via `BREVO_GUIDE_SDB_TEMPLATE_ID=19` en env var Vercel | Sécurité : pas d'envoi sans config explicite |
| Showrooms DIMEXOI | SUD : 8 rue Benjamin Hoareau, ZI n°3, 97410 Saint-Pierre, 0262 35 06 79, contact@dimexoi.fr. NORD : 43 rue Tourette, 97400 Saint-Denis, 0262 20 30 30, bernard@dimexoi.fr | Coordonnées officielles avril 2026 |
| Calendly URL | `https://calendly.com/dimexoi/60min` — ne jamais modifier | URL unique DIMEXOI |
| Calendly widget | Script chargé dynamiquement dans CalendlyWidget.tsx uniquement (pas en global) | Performance |
| Calendly UTM | Params a1 (pageSource) + a2 (productSlug) passés dans URL Calendly → renvoyés dans webhook | Attribution page source → RDV |
| Calendly statuts | CONFIRME→HONORE (manuel commercial) ou CONFIRME→ANNULE (webhook ou manuel). Pas de retour. | Le commercial sait si le client est venu |
| RDV taux conversion | Basé sur ventes (BDC) créées après la date du RDV, pas sur les devis (toujours créés) | Vrai indicateur commercial |
| ROI Marketing — source CA | CA calculé depuis les BDC Sellsy (`listAllOrders()`), pas les factures Prisma `Vente`. Filtrage client-side : champs perso SAV/COMMANDE MAGASIN/FOURNISSEUR + statuts annulés (`cancelled`, `annul*`). `moisKey.startsWith(annee)` pour filtrer l'année | BDC = engagement client, pas les factures différées |
| ROI Marketing — custom fields | `order.custom_fields_values` + `order._embed?.custom_fields_values` vérifiés. Embed `custom_fields_values` non demandé à l'API Sellsy (instable) — données récupérées si présentes dans la réponse list | Évite erreurs 400 sur endpoint orders |
| ROI Marketing — dépenses APIs | Meta : `/me/adaccounts` → `/insights?time_increment=monthly`. Google : GAQL `cost_micros/1_000_000`. Anti-doublon : si API active → ignorer entrées manuelles correspondantes dans CoutMarketing | Pas de double-comptage |

---

## 9. MODÈLES PRISMA EN PRODUCTION

- **User** — collaborateurs DIMEXOI (rôles : ADMIN, MARKETING, COMMERCIAL, DIRECTION + ACHAT à créer)
- **Contact** — 1 243 contacts en base
- **Devis** — 1 377 devis importés depuis Sellsy
- **Vente** — 139 BDC importés (156 991€ CA)
- **DemandePrix** — demandes de prix (formulaire site web)
- **PostPlanning** — cartes Kanban + `scheduledDate` (calendrier mensuel) + 7 labels Contenu (AVIS_CLIENTS, FIDELISATION, TEASING_AVRIL, VIDEO_REEL, BLOG_SEO, EMAIL_BREVO, STORY)
- **PlanningChecklist** — items checklist
- **LiaisonDevisCommande** — liaisons devis↔commande
- **LiaisonDocumentaire** — chaîne documentaire parentid V1 ✅
- **Lead** — leads avec `slaDeadline` (72h), `statut` (NOUVEAU/EN_COURS/DEVIS/VENTE), `commercialId`
- **Evenement** — log d'événements par contact/lead (types : CREATION_LEAD, EMAIL_ENVOYE, APPEL, NOTE, **RELANCE**, DEVIS_ENVOYE…) ✅
- **BrevoSyncLog** — historique sync Sellsy→Brevo ✅
- **DocArticle** — articles documentation ✅
- **ClubMembre** — membres Club Tectona (sync Sellsy) — sellsyContactId unique, niveau 1-5, totalCommandes, totalMontant (Float), brevoSynced/sellsySynced flags, **origine** (DIMEXOI/BDO/LES_DEUX) ✅
- **ClientBoisDOrient** — contacts extraits de Sellsy Bois d'Orient — sellsyIdBdo unique, totalCA (factures TTC), statut matching (NOUVEAU/MATCH_EMAIL/MATCH_MANUEL/A_VERIFIER) ✅
- **Pointage** — pointage horaire par jour (@@unique userId+date) — arrivée/pause/départ, heuresTravaillées/heuresSupp calculés, correction manager avec note ✅
- **ConfigPointage** — config globale : 7h théoriques/jour, 1h pause défaut ✅
- **Conge** — demandes de congés avec approbation (en_attente/approuve/modifie/refuse) ✅
- **DossierSAV** — dossiers SAV/litiges avec numéro auto SAV-2026-XXXX, 6 types, 5 statuts, lien contact + BDC Sellsy ✅
- **DocumentSAV** — pièces jointes SAV (PDF, email, appel, courrier, photo) ✅
- **CommentaireSAV** — commentaires internes sur dossiers SAV ✅
- **DocumentBoisDOrient** — documents BDO (factures, commandes, devis) — sellsyDocId unique, pdfUrl/pdfPath Supabase Storage ✅
- **ImportBoisDOrient** — log d'import BDO pour traçabilité ✅

**Données en base au 24 mars 2026** : 1 243 contacts · 1 377 devis · 139 BDC · 156 991€ CA · 1 685 membres Club Tectona (1 429 avec email) · 1 429 emails Club envoyés · 9 utilisateurs KOKPIT

**Utilisateurs KOKPIT :**

| Nom | Email | Rôle | Notes |
|-----|-------|------|-------|
| admin@kokpit.re | admin@kokpit.re | ADMIN | Compte dev — ne pas toucher |
| Laurent Batisse | laurent@dimexoi.fr | COMMERCIAL | Showroom NORD |
| Bernard Robert | bernard@dimexoi.fr | COMMERCIAL | Showroom NORD |
| Daniella Folio | commercial@dimexoi.fr | COMMERCIAL | Showroom SUD |
| Elaury Decaunes | elaury.decaunes@dimexoi.fr | ACHAT | |
| Georget Morel | georget.morel@dimexoi.fr | COMMERCIAL | N'utilise pas KOKPIT — Michelle pointe pour lui |
| Laurence Payet | laurence.payet@dimexoi.fr | MARKETING | |
| Michelle Perrot | michelle.perrot@dimexoi.fr | ADMIN | Validation congés, pointage Georget |
| Liliane Dambreville | adm@dimexoi.fr | ADMIN | Pointage désactivé |
| Alain Dambreville | alain.dambreville@dimexoi.fr | ADMIN | Pointage désactivé |

- **NeedPrice** — demandes de prix sur-mesure (Achat) — ref DEPI unique, dénomination anglais, finitions, photo, prix fournisseur/vente, statut DEMANDE/PRIX_RECU/ANNULE ✅
- **ConfigCalculateur** — paramètres calculateur prix Elaury (changeIndo, coeffRevient, coeffMarge) ✅
- **Message** — messages messagerie interne (canaux + DM) ✅
- **Channel** — canaux de messagerie (#général, #commercial, #marketing, #urgences) ✅
- **Tache** — tâches avec collaboration (assigneAId, collaborateurId, collaborationStatut INVITE/ACCEPTE/REFUSE) ✅
- **RendezVous** — RDV Calendly (dateDebut/dateFin, statut CONFIRME/HONORE/ANNULE, source page calendly_*, productSlug, calendlyEventId unique, lien Contact) ✅
- **ConfigApp** — paramètres globaux (SLA heures, etc.) ✅
- **PasswordResetToken** — tokens de réinitialisation mot de passe (24h) ✅
- **StockCache** — cache persistant stock Sellsy (key TEXT PK, data JSONB, cached_at, expires_at). TTL 30 min. `@@map("stock_cache")` ✅

**À créer (prochains sprints) :**
- `PlanTechnique` — dépôt plans PDF + transfert OneDrive (Module 3 Achat)
- `BrevoWebhookEvent` — signaux Brevo→KOKPIT (X5 — plan Pro requis)
- `SeuilStockAchat` — seuils stock par référence (ACH1)
- `ConfigABC` — seuils globaux A/B/C configurables (ACH1)

---

## 10. VARIABLES D'ENVIRONNEMENT

| Variable | Statut | Usage |
|----------|--------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Vercel | Storage Planning |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Vercel | Storage Planning |
| `SELLSY_CLIENT_ID` | ✅ Vercel | API Sellsy V2 + V1 |
| `SELLSY_CLIENT_SECRET` | ✅ Vercel | API Sellsy V2 + V1 |
| `META_ACCESS_TOKEN` | ✅ Vercel | Feed Instagram + Meta Ads |
| `META_ACCESS_TOKEN_EXPIRES_AT` | ⚠️ À ajouter | Alerte expiration token |
| `BREVO_API_KEY` | ✅ Vercel | Stats email + sync + webhooks + relance commercial |
| `BREVO_SENDER_EMAIL` | ✅ .env.local | Expéditeur emails transactionnels (`laurence.payet@dimexoi.fr`) |
| `RESEND_API_KEY` | ⚠️ Optionnel | Fallback envoi email si Brevo indispo |
| `SELLSY_ACCESS_TOKEN` | ✅ Vercel | Token Sellsy V2 (utilisé par Club Sync pour fetch individuals/companies) |
| `BREVO_WEBHOOK_SECRET` | ⚠️ À créer | Authentification webhooks Brevo (X5) |
| ~~`BREVO_CLUB_LIST_ID_1-5`~~ | ❌ Non utilisées | Listes auto-créées par nom via `findOrCreateList()` — pas besoin d'IDs en env |
| `SELLSY_BDO_CLIENT_ID` | ✅ .env.local | Client ID Sellsy Bois d'Orient (migration) |
| `SELLSY_BDO_CLIENT_SECRET` | ✅ .env.local | Client Secret Sellsy Bois d'Orient (migration) |
| `ANTHROPIC_API_KEY` | ✅ Vercel | Chatbot M4C |
| `NEXTAUTH_SECRET` | ✅ Vercel | Auth |
| `NEXTAUTH_URL` | ✅ Vercel | Auth |

| `BREVO_GUIDE_SDB_TEMPLATE_ID` | ⚠️ À ajouter Vercel | ID template Brevo envoi guide SDB (19). Désactivé sans cette var |
| `META_WEBHOOK_VERIFY_TOKEN` | ⚠️ À ajouter dimexoi-site Vercel | Token vérification webhook Meta Ads |
| `CALENDLY_WEBHOOK_SIGNING_KEY` | ⚠️ À ajouter dimexoi-site Vercel | Signing key depuis Calendly > Webhooks |
| `GOOGLE_ADS_DEVELOPER_TOKEN` | ⚠️ À configurer Vercel | Token développeur Google Ads (obligatoire) |
| `GOOGLE_ADS_CUSTOMER_ID` | ⚠️ À configurer Vercel | ID client Google Ads (sans tirets, ex: 1234567890) |
| `GOOGLE_ADS_REFRESH_TOKEN` | ⚠️ À configurer Vercel | OAuth2 refresh token Google Ads |
| `GOOGLE_ADS_CLIENT_ID` | ⚠️ À configurer Vercel | OAuth2 client ID Google Ads |
| `GOOGLE_ADS_CLIENT_SECRET` | ⚠️ À configurer Vercel | OAuth2 client secret Google Ads |
| `CRON_SECRET` | ✅ Vercel | Bearer token pour auth crons |

**Action requise** : activer scope "API V1" dans Sellsy > Paramètres > Portail développeur > API V2 pour que C3bis fonctionne en prod.

---

## 11. PROTOCOLE DE MISE À JOUR

À chaque fin de session Claude Code :
1. Section 7 : déplacer features terminées → "En production" avec commit
2. Section 8 : ajouter toute nouvelle décision structurante
3. Section 9 : déplacer modèles migrés vers "En production"
4. Section 10 : mettre à jour statuts variables (⚠️ → ✅)
5. En-tête : date + auteur + incrémenter version

Format commit : `docs: mise à jour KOKPIT.md — [features terminées]`

---

## 12. WORKFLOW DE DÉVELOPPEMENT

```
Session Claude (stratégie)          Session Claude Code
        │                                    │
        │  Lit KOKPIT.md                     │
        │  Produit brief détaillé            │
        │─────────── brief ─────────────────>│
        │                                    │  Lit KOKPIT.md en premier
        │                                    │  Exécute le brief
        │                                    │  Met à jour KOKPIT.md
        │<────────── brief de retour ────────│
        │                                    │
        │  Intègre le retour dans KOKPIT.md  │
        │  Prépare le prochain brief         │
```

**Règle** : Claude Code ne fait jamais d'hypothèse. Il lit KOKPIT.md, constate l'état réel, puis agit. Si KOKPIT.md contredit le brief → signaler avant d'agir.

---

## 13. SPECS — PRIORITÉ CONTACT (X4) ✅ DÉPLOYÉ `ddf18ac`

> Affiché "Priorité" dans l'interface — jamais "score"

**Philosophie** : Score calculé à la volée sur 3 composantes — jamais stocké (toujours à jour). Tooltip détaillé visible par l'utilisateur.

**Formule** : `Score = Intention (0-50) + Historique (0-30) + Fraîcheur (0-20)`

### Niveaux

| Niveau | Score | Couleur | Icône | Action |
|--------|-------|---------|-------|--------|
| Froid | 0-25 | Gris `#8592A3` | ❄️ Snowflake | Pas de priorité |
| Tiède | 26-55 | Jaune `#F4B400` | 🌡️ Thermometer | À surveiller |
| Chaud | 56-80 | Orange `#E65100` | 🔥 Flame | À contacter cette semaine |
| **Brûlant** | **81-100** | **Rouge `#D32F2F`** | **⚡ Zap** | **À contacter aujourd'hui** |

### Signaux Intention (0-50)

| Signal | Points |
|--------|--------|
| Nouvelle demande < 7 jours | +20 |
| Devis sans réponse 8-30 jours | +15 |
| Devis expirant < 5 jours | +15 |
| Devis créé cette semaine | +10 |

### Signaux Historique (0-30)

| Signal | Points |
|--------|--------|
| 2+ commandes passées | +15 |
| 1 commande passée | +10 |
| Panier moyen > 2 000€ | +8 |
| Client de retour après > 1 an | +7 |
| 3+ devis sans aucune commande (tire-kicker) | -5 |

### Signaux Fraîcheur (0-20)

| Signal | Points |
|--------|--------|
| Actif < 3 jours | +20 |
| Décroissance progressive jusqu'à > 60 jours | +0 |
| Devis expiré ou refusé | -5 |

### Signal futur (X5 Brevo webhook)

Email Brevo ouvert < 14 jours → +15 pts Intention (à activer quand X5 sera développé)

---

## 14. SPECS — BREVO ENRICHI (X5)

> ⚠️ Specs rédigées — pas encore développé

**Niveaux d'implémentation :**

**Niveau 1** — en prod : stats campagnes + sync 4 segments fixes Sellsy→Brevo.

**Niveau 2** — listes dynamiques (X5a) : création de listes nommées depuis KOKPIT avec critères métier → export Brevo 1 clic.

**Niveau 3** — webhook Brevo→KOKPIT (X5b) :
```
POST /api/marketing/brevo/webhook
Événements : opened · clicked · unsubscribed · soft_bounce
→ enrichit fiche contact + alimente priorité (section 13)
```

**Niveau 4** — statut Brevo dans la fiche contact : abonné/désabonné/jamais contacté · dernière interaction · listes.

---

## 15. SPECS — ROI MARKETING RÉEL (X8)

> ⚠️ Specs rédigées — pas encore développé

**Problème** : 30 000€ Meta en 2025 sans CAC réel — coûts Salon + agence nulle part.

```prisma
model CoutMarketing {
  id          String   @id @default(cuid())
  periode     String   // "2026-03"
  type        String   // "meta_ads" | "google_ads" | "salon" | "agence" | "autre"
  libelle     String
  montant     Float
  createdAt   DateTime @default(now())
  createdById String
  createdBy   User     @relation(fields: [createdById], references: [id])
}
```

Dashboard (ADMIN + DIRECTION) : CA généré · Total dépenses · ROI % · CAC réel · graphique dépenses vs CA · export PDF.

---

## 16. SPECS — SEGMENTATION RFM (X9)

> ⚠️ Specs rédigées — pas encore développé

| Dimension | Calcul | Source |
|-----------|--------|--------|
| Récence (R) | Jours depuis dernière commande | Sellsy |
| Fréquence (F) | Nb commandes sur 24 mois | Sellsy |
| Montant (M) | CA total sur 24 mois | Sellsy |

| Segment | Critères | Action DIMEXOI |
|---------|----------|---------------|
| Champions | R < 30j, F ≥ 3, M élevé | Invitation événement VIP |
| Clients loyaux | F ≥ 2, M correct | Cross-sell bain → cuisine |
| À risque | Bonne F/M, R > 90j | Campagne réactivation urgente |
| Perdus | R > 180j, F = 1 | Campagne "on pense à vous" |
| Nouveaux | 1 commande, R < 30j | Séquence post-achat Brevo |

Calcul à la volée · Cache 24h · Pas de modèle Prisma supplémentaire · Chaque segment → liste Brevo exportable.

---

## 17. SPECS — ESPACE ACHAT — CLASSIFICATION ABC (A1)

> ⚠️ Specs rédigées — pas encore développé

### Principe 80/20 (Pareto) appliqué au catalogue DIMEXOI

**Philosophie** : 20% des références font 80% du CA. L'espace Achat concentre l'attention sur ce qui compte et évite les ruptures critiques.

### Rôle et accès

Nouveau rôle à créer : **ACHAT**

| Rôle | Espace Achat |
|------|-------------|
| ACHAT | ✅ Accès exclusif Achat |
| ADMIN / DIRECTION | ✅ Accès à tous les espaces dont Achat |

**Menus espace Achat** : Tableau de bord `/achat` · Catalogue ABC `/achat/catalogue` · Alertes stock `/achat/alertes` · Paramètres seuils `/achat/parametres`

**Couleur espace Achat** : Cerise `#E23260` (token CSS déjà défini ✅)

### Calcul ABC

| Classe | % CA cumulé | Badge | Gestion |
|--------|------------|-------|---------|
| A | 0 → 80% | 🔴 Rouge | Stock obligatoire · Alerte rupture immédiate |
| B | 80 → 95% | 🟡 Jaune | Stock tampon · Surveillance régulière |
| C | 95 → 100% | ⚪ Gris | À la demande · Pas d'alerte |

```prisma
model SeuilStockAchat {
  id            String   @id @default(cuid())
  sellsyRefId   String   @unique
  seuilAlerte   Int
  classeABC     String   // "A" | "B" | "C"
  note          String?
  updatedAt     DateTime @updatedAt
  updatedById   String
  updatedBy     User     @relation(fields: [updatedById], references: [id])
}

model ConfigABC {
  id        String   @id @default(cuid())
  seuilA    Float    @default(80)
  seuilB    Float    @default(95)
  updatedAt DateTime @updatedAt
}
```

### Ordre d'implémentation (~2j)

1. Créer rôle ACHAT dans Prisma + NextAuth
2. Déverrouiller espace Achat dans nav-config.ts
3. Créer pages /achat, /achat/catalogue, /achat/alertes, /achat/parametres
4. Implémenter fonction calcul ABC (pure, testable)
5. Dashboard KPIs + tableau alertes
6. Catalogue enrichi avec badges ABC
7. Interface seuils par référence (SeuilStockAchat)
8. Paramètres seuils globaux (ConfigABC)

---

## 🗺️ PROCHAINS SPRINTS

| ID | Feature | Pourquoi | Effort est. |
|----|---------|----------|------------|
| ~~X1~~ | ~~Log d'activité contacts~~ | ✅ | Timeline filtrable (EMAIL/VISITE_WEB/APPEL/NOTE/RELANCE) + auto-log EMAIL_ENVOYE et VISITE_WEB |
| ~~X2~~ | ~~Tâches avec rappels~~ | ✅ | Modèle Tache + page /commercial/taches + tâches auto (congés→Michelle, SLA→commercial) + collaboration (invitation accepter/refuser) |
| ~~X3~~ | ~~Recherche globale topbar~~ | ✅ | Contacts + devis + commandes en parallèle — déjà implémenté |
| ~~X4~~ | ~~Priorité contact~~ | ✅ Déployé `ddf18ac` — 4 niveaux | — |
| X5 | Brevo enrichi | Stand-by — plan Starter ne supporte pas export webhook. Listes dynamiques possibles mais webhooks limités | 2j |
| A1 | Espace Achat — Classification ABC | Rôle ACHAT + catalogue ABC + alertes stock | 2j |
| ~~X6~~ | ~~Notifications internes~~ | ✅ | Bell topbar + API 5 types (token Meta, devis expirant, Brevo sync, tâches retard, SLA 72h) — déjà implémenté |
| ~~X7~~ | ~~Dashboards avec courbes~~ | ✅ | Recharts LineChart + ComposedChart + BarChart — évolution devis/commandes, leads par source — déjà implémenté |
| ~~X8~~ | ~~ROI Marketing réel~~ | ✅ | Modèle CoutMarketing + page /marketing/roi (KPIs, tableau mensuel, répartition par canal, ajout dépenses) — `563889b` |
| ~~X9~~ | ~~Segmentation RFM~~ | ✅ | 5 segments (Champions, Loyaux, Nouveaux, À risque, Perdus) + export listes Brevo — `c969e95` |
| ~~X11~~ | ~~Responsive mobile~~ | ✅ | Toutes les pages principales ont des classes responsive Tailwind |
| ~~BDO~~ | ~~Migration Bois d'Orient~~ | ✅ | Page + 7 routes API + extraction + matching + documents |
| ~~X10~~ | ~~SLA 72h leads + relance commercial~~ | ✅ | SLA + bouton relance email + tâche auto commercial |
| ~~ADM1~~ | ~~Espace Administration~~ | ✅ | Paramètres (SLA, pointage, rôles) + Pointage + Congés + Collaborateurs — `484e24d` |
| ACH-PLANS | Module 3 Achat — Plans PDF + OneDrive | Upload PDF → Supabase → transfert OneDrive via Microsoft Graph API. Bloqué : clés Microsoft à fournir | 1.5j |
| ACH-ABC | Classification ABC | Catalogue Pareto 80/20 + alertes stock + seuils configurables | 2j |
| F1 | Création devis KOKPIT → Sellsy | KOKPIT écrit dans Sellsy via API | À spécifier |
| E1 | Espace client externe | Site séparé connecté à KOKPIT — suivi de commande | À spécifier |

---

## 18. CLUB GRANDIS — PROGRAMME DE FIDÉLITÉ ✅ DÉPLOYÉ

### Concept

Programme de fidélité B2B/B2C à 5 niveaux basé sur le CA HT (commandes Sellsy), avec synchronisation manuelle vers Sellsy (tags) et Brevo (listes/segments). Fenêtre glissante 36 mois sauf niveau V (permanent).

### Niveaux

| Niveau | Chiffre | Nom | Condition | Remise | Brevo Segment |
|--------|---------|-----|-----------|--------|---------------|
| 1 | I | L'Écorce | 1 commande ≥ 500€ | -5% | Club Tectona · I |
| 2 | II | L'Aubier | 2 commandes ou ≥ 2 000€ | -10% | Club Tectona · II |
| 3 | III | Le Cœur | 3 commandes ou ≥ 5 000€ | -15% | Club Tectona · III |
| 4 | IV | Le Grain | ≥ 10 000€ | -20% | Club Tectona · IV |
| 5 | V | Le Tectona Grandis | ≥ 20 000€ | -25% | Club Tectona · V |

**Règles métier :**
- Un client ne descend **jamais** de niveau
- Le niveau V est **permanent** et **automatique** à ≥ 20 000 € TTC
- Fenêtre glissante : 36 mois (sauf V = permanent)
- Chiffres romains toujours en **MAJUSCULES** (I, II, III, IV, V)
- Montant Sellsy = `total_excl_tax` (HT), toujours wrappé avec `Number()` (string→Float)

### Architecture fichiers

| Fichier | Rôle |
|---------|------|
| `src/data/club-tectona.ts` | Constantes niveaux, DA couleurs/polices, fonctions `calculerNiveau()`, `getDebutFenetre()`, `getNiveauConfig()` |
| `src/app/(app)/marketing/club/page.tsx` | Page UI complète — logo PNG centré, KPIs gradient, table membres, actions sync, légende niveaux |
| `src/app/api/club/sync/route.ts` | POST — Sync Sellsy : orders → groupage par tiers → calcul niveau → upsert ClubMembre |
| `src/app/api/club/sync-tags/route.ts` | POST — Push tags Sellsy (CLUB - Niv 1 à 5) sur chaque membre |
| `src/app/api/club/sync-brevo/route.ts` | POST — Push contacts vers listes Brevo par niveau |
| `src/app/api/club/membres/route.ts` | GET — Liste paginée avec recherche et filtre par niveau |
| `src/app/api/club/stats/route.ts` | GET — Stats dashboard (totalMembres, parNiveau, totalCA, dernierSync) |

### Design & Identité visuelle

**DA séparée de KOKPIT** — ne pas utiliser `var(--color-active)` :

```typescript
CLUB_DA = {
  primary: "#515712",        // Vert mousse — couleur unique
  primaryHover: "#6b7318",
  primaryDark: "#3a3d0d",
  bg: "#ffffff",             // Fond = KOKPIT par défaut (pas de fond custom)
  text: "#515712",
  fontDisplay: "'Perandory', 'Cormorant Garamond', serif",   // Titres
  fontAccent: "'Burgues Script', 'Cormorant Garamond', serif", // Accents italiques
}
```

**Polices :**
- **Perandory** (titres) → `public/fonts/Perandory/Perandory-Regular.otf` ✅
- **Burgues Script** (accents) → `public/fonts/Burgues Script Regular/Burgues Script Regular.otf` ✅
- **Cormorant Garamond** (fallback) → Google Fonts via `next/font/google` ✅
- **Corps de texte** → Plus Jakarta Sans (police KOKPIT par défaut, hérité)

**Logo :** `public/images/club-tectona-logo.png` — PNG croppé, centré en haut de page (`w-72 sm:w-96`)

**Palette monochrome :** blanc pur + `#515712` uniquement. Pas de beige, pas de nuances.

**Page UI** : design KOKPIT standard (tokens `cockpit-*`, cards avec `shadow-cockpit-lg`, `border-cockpit`, `bg-cockpit-dark` pour hover, inputs `border-cockpit-input`) + couleurs/polices Club.

### Sync Sellsy — Détails techniques

1. `listAllOrders(sinceISO)` avec `embed: ["contact", "company"]` pour récupérer les noms
2. Groupage par `related[0].id` (tiers = individual ou company)
3. Extraction noms : `_embed.contact` → `_embed.company` → `order.company_name` → fallback API
4. **Fallback API** : pour contacts sans nom ou sans email → fetch `/individuals/{id}` ou `/companies/{id}` (batch de 10)
5. **Exclusions internes** :
   - Companies contenant "DIMEXOI" → skip
   - Équipe par nom+prénom exact : Batisse Laurent, Legros/Perrot Michelle, Payet Laurence, Dammbrille Alain, Decaunes Elaury
6. Calcul niveau via `calculerNiveau(nbCommandes, totalMontant, niveauActuel)` — ne descend jamais
7. Upsert ClubMembre : mise à jour noms "Inconnu", emails vides, reset flags sync si upgrade

### Fonctions Sellsy ajoutées (`src/lib/sellsy.ts`)

- `listTags()` — lister tous les tags
- `createTag(name)` — créer un tag
- `getContactTags(contactId)` — tags d'un contact
- `assignTagToIndividual/Company(contactId, tagId)` — assigner un tag
- `removeTagFromIndividual/Company(contactId, tagId)` — retirer un tag
- `ensureTagsExist(tagNames)` — créer les tags manquants, retourner tous les IDs

### Fonctions Brevo ajoutées (`src/lib/brevo.ts`)

- `upsertBrevoContact(email, attributes)` — créer/mettre à jour un contact
- `addContactsToList(listId, emails)` — ajouter des contacts à une liste
- `removeContactsFromList(listId, emails)` — retirer des contacts d'une liste
- `getListContacts(listId)` — récupérer les contacts d'une liste

### Prisma — ClubMembre

```prisma
model ClubMembre {
  id              String   @id @default(cuid())
  sellsyContactId String   @unique
  email           String
  nom             String
  prenom          String
  niveau          Int      @default(1)
  totalCommandes  Int      @default(0)
  totalMontant    Float    @default(0)
  dateEntree      DateTime @default(now())
  dernierSync     DateTime?
  brevoSynced     Boolean  @default(false)
  sellsySynced    Boolean  @default(false)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  @@index([niveau])
  @@index([email])
}
```

### Navigation & Auth

- Menu : Crown icon → "Club Tectona" dans l'espace Marketing (`nav-config.ts`)
- Module `"club-tectona"` dans `auth-utils.ts` — accessible par ADMIN et MARKETING
- Path `/marketing` détecté par `detectSpaceFromPath()` → espace Marketing

### Variables d'environnement requises

| Variable | Usage |
|----------|-------|
| `SELLSY_ACCESS_TOKEN` | Fetch noms contacts (fallback API) |
| ~~`BREVO_CLUB_LIST_ID_1-5`~~ | Non nécessaires — listes auto-créées par nom |

### Commits

| Commit | Description |
|--------|-------------|
| `9bf297b` | feat: Club Tectona — programme complet (9 phases) |
| `7f92fb6` | fix: palette monochrome, chiffres romains majuscules, fix Prisma Float |
| `3d0a4f6` | fix: design KOKPIT, logo centré, polices Perandory/Burgues Script |
| `1bc1b4e` | fix: logo PNG croppé + centré, suppression titre redondant |
| `5de2af2` | fix: récupération noms contacts via embed + fallback API |
| `3cb06fb` | fix: récupération emails depuis Sellsy API |
| `1abe986` | fix: exclure commandes internes DIMEXOI |
| `6ccc336` | fix: exclure équipe Dimexoi par nom+prénom exact |

---

*KOKPIT.md — feuille de route DIMEXOI — v14 — 24 mars 2026*
