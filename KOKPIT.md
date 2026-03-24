# KOKPIT — Feuille de route & référence projet

> Ce fichier est la mémoire du projet. Toute session Claude Code doit le lire en premier et le mettre à jour en fin de session. Il prime sur tout autre document.

**Dernière mise à jour** : 24 mars 2026 (v13 — Pointage + SAV/Litiges + Congés responsive + Popup café)
**Mis à jour par** : Session Claude Code (Sprint 24 mars)

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

**⚠️ Règle critique API Sellsy V2** : Les filtres `third_ids`, `contact_id`, `individual_ids` sont cassés — ils retournent TOUS les documents au lieu de filtrer. Solution : utiliser `findDocumentsByRelated()` — récupérer les N derniers documents et filtrer côté serveur par `related[].id`. Ne jamais utiliser ces filtres V2 directement.

**Règle Sellsy individuals/companies** : Un client B2C peut avoir 2 IDs Sellsy (1 company + 1 individual) avec le même email. Toujours utiliser le pool unifié companies + individuals. Fonction : `listAllIndividuals()` (pagination 82 pages). Map multi-ID par email : tous les IDs partageant le même email → même contact KOKPIT.

**Règle montants Sellsy** : Les montants sont retournés en string par l'API — toujours wrapper avec `Number()` avant stockage Prisma (type Float). Champ correct : `total_incl_tax` (pas `total_with_tax`).

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

## 3. SYSTÈME DE DESIGN — COULEURS PAR ESPACE ✅ DÉPLOYÉ

### Palette par espace

| Espace | Nom couleur | Hex principal | Palette complète |
|--------|-------------|---------------|------------------|
| Commercial | Teal | `#0E6973` | Teal → Citron : `#0E6973` `#118C8C` `#BAD9CE` `#F2BB16` `#BF820F` |
| Marketing | Raspberry | `#C2185B` | Cream → Raspberry : `#E2A90A` `#8DA035` `#D4567A` `#C2185B` |
| Administration | Bronze Spice | `#D15F12` | Brick Ember → Bronze : `#B92708` `#EE9520` `#A1A89D` `#ED9F58` `#D15F12` |
| Achat | Cerise | `#E23260` | Charleston → Light Pink : `#1E3309` `#849A28` `#E23260` `#F2678E` `#FCA9AA` |

**Accent global** : `#F4B400` jaune — logo K, avatar initials, éléments hors-espace. Ne change jamais.
**Vert/Rouge universels** : positif = vert, urgent/danger = rouge. Ces couleurs ne sont jamais remplacées par une couleur d'espace.

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
| Brevo Club Tectona | 5 listes pour segments fidélité | `BREVO_CLUB_LIST_ID_1` à `_5` | `/api/club/` |
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

**Données en base au 17 mars 2026** : 1 243 contacts · 1 377 devis · 139 BDC · 156 991€ CA · 85 contacts auto-upgradés PROSPECT→CLIENT · Club Tectona membres synchronisés

**À créer (prochains sprints) :**
- `ActivityLog` — log d'activité contacts (X1)
- `Task` — tâches avec échéances (X2)
- `CoutMarketing` — coûts marketing ROI réel (X8)
- `BrevoWebhookEvent` — signaux Brevo→KOKPIT (X5)
- ~~`ProduitBarcode`~~ — non nécessaire, codes-barres générés à la volée (AUD10-CB ✅)
- `SeuilStockAchat` — seuils stock par référence (A1)
- `ConfigABC` — seuils globaux A/B/C configurables (A1)

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
| `BREVO_CLUB_LIST_ID_1` | ⚠️ À configurer | ID liste Brevo "Club Tectona · I" (L'Écorce) |
| `BREVO_CLUB_LIST_ID_2` | ⚠️ À configurer | ID liste Brevo "Club Tectona · II" (L'Aubier) |
| `BREVO_CLUB_LIST_ID_3` | ⚠️ À configurer | ID liste Brevo "Club Tectona · III" (Le Cœur) |
| `BREVO_CLUB_LIST_ID_4` | ⚠️ À configurer | ID liste Brevo "Club Tectona · IV" (Le Grain) |
| `BREVO_CLUB_LIST_ID_5` | ⚠️ À configurer | ID liste Brevo "Club Tectona · V" (Le Tectona Grandis) |
| `SELLSY_BDO_CLIENT_ID` | ✅ .env.local | Client ID Sellsy Bois d'Orient (migration) |
| `SELLSY_BDO_CLIENT_SECRET` | ✅ .env.local | Client Secret Sellsy Bois d'Orient (migration) |
| `ANTHROPIC_API_KEY` | ✅ Vercel | Chatbot M4C |
| `NEXTAUTH_SECRET` | ✅ Vercel | Auth |
| `NEXTAUTH_URL` | ✅ Vercel | Auth |

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
| X1 | Log d'activité contacts | Logger appels, notes, relances | 1j |
| X2 | Tâches avec rappels | Évite devis dans les oubliettes | 1j |
| X3 | Recherche globale topbar | Contacts + devis + commandes en parallèle | 0.5j |
| ~~X4~~ | ~~Priorité contact~~ | ✅ Déployé `ddf18ac` — 4 niveaux | — |
| X5 | Brevo enrichi | Listes dynamiques + webhook Brevo→KOKPIT | 2j |
| A1 | Espace Achat — Classification ABC | Rôle ACHAT + catalogue ABC + alertes stock | 2j |
| ~~X6~~ | ~~Notifications internes~~ | ✅ | Bell topbar + API 5 types (token Meta, devis expirant, Brevo sync, tâches retard, SLA 72h) — déjà implémenté |
| ~~X7~~ | ~~Dashboards avec courbes~~ | ✅ | Recharts LineChart + ComposedChart + BarChart — évolution devis/commandes, leads par source — déjà implémenté |
| X8 | ROI Marketing réel | ⚠️ Partiel | ROAS Meta + tableau mensuel + CoutOffline existent. Manque : modèle CoutMarketing multi-canal, Google Ads, page ROI séparée |
| X9 | Segmentation RFM | ⚠️ Partiel | Calcul RFM + scores en base + badge contact existent. Manque : export segments vers listes Brevo |
| ~~X11~~ | ~~Responsive mobile~~ | ✅ | Toutes les pages principales ont des classes responsive Tailwind (grid-cols, sm:, md:, lg:) |
| ~~BDO~~ | ~~Migration Bois d'Orient~~ | ✅ | Page + 7 routes API + extraction + matching + documents — déjà implémenté |
| X9 | Segmentation RFM | Récence/Fréquence/Montant → segments Brevo | 2j |
| ~~X10~~ | ~~SLA 72h leads + relance commercial~~ | ✅ Déployé `f5911fc`+`2dc583d` — SLA + bouton relance email | — |
| X11 | Responsive mobile | Pages clés sur téléphone | 1j |
| F1 | Création devis KOKPIT → Sellsy | KOKPIT écrit dans Sellsy via API | ? |
| E1 | Espace client externe | Site séparé connecté à KOKPIT — suivi de commande | ? |
| **ADM1** | **Espace Administration** | Collaborateurs, congés, paramètres — à spécifier avec l'équipe | ? |
| **ACH1** | **Espace Achat complet** | Classification ABC (specs section 17) + commandes fournisseurs + réassort | 2j+ |

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
| `BREVO_CLUB_LIST_ID_1` à `_5` | IDs listes Brevo par niveau (à créer dans Brevo puis configurer dans Vercel) |

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

*KOKPIT.md — feuille de route DIMEXOI — v13 — 24 mars 2026*
