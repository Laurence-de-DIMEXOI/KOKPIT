# BRIEF RÉCAPITULATIF — Session Claude Code · 17 mars 2026

## Contexte

KÒKPIT est l'ERP interne de DIMEXOI (meubles bois exotique, La Réunion). Stack : Next.js 15, TypeScript, Prisma, Supabase (PostgreSQL), Sellsy API V2, Brevo, Vercel Hobby. 3 espaces : Commercial (#0E6973), Marketing (#7758A3), Dashboard.

---

## PHASES COMPLÉTÉES — Audit terrain (plan du 12 mars)

### Phase 1 — Bugs UI ✅
- Boutons "Créer le post" (planning) et "Sauvegarder" (liens utiles) : `text-white bg-cockpit-yellow` remplacé par `text-gray-900` + `style={{ backgroundColor: 'var(--color-active)' }}`
- KPI Cards Commercial : pourcentages dans `<span className="bg-black/20 text-white px-1.5 py-0.5 rounded-full">` (pill semi-transparente)

### Phase 2 — Login & Redirection ✅
- Login modernisé : glassmorphism, inputs avec focus transition, liste outils (Sellsy, Brevo, Meta Ads, Instagram, Supabase)
- Redirect post-login par rôle : `{ ADMIN: "/commercial", DIRECTION: "/commercial", COMMERCIAL: "/commercial", MARKETING: "/dashboard" }`
- Fichiers : `src/app/(auth)/login/page.tsx`, `src/app/(auth)/layout.tsx`

### Phase 3 — Automatisation (suppression boutons manuels) ✅
- Commercial : gros bouton "Synchroniser" → petit "Actualiser" (RefreshCw)
- Leads : bouton "Estimer tout" (Sparkles) supprimé, toute mention "IA" retirée
- Emailing : boutons "Tout synchroniser" + "Synchroniser" individuels supprimés
- Campagnes : "Synchroniser Meta" → "Actualiser"
- Données chargées automatiquement au montage (useEffect fetch)

### Phase 4 — Liens Sellsy centralisés ✅
- `src/lib/sellsy-urls.ts` : `getSellsyUrl(type, id)` avec 5 types (estimate, order, invoice, contact, product)
- 43 usages à travers le codebase, 0 URL hardcodée
- Base URL : `https://www.sellsy.com`

### Phase 5 — Recherche globale étendue ✅
- API `/api/search` cherche dans : Contacts, Leads, Devis Sellsy, Commandes Sellsy, Produits catalogue, Pages/outils
- Composant GlobalSearch : sections par catégorie, icônes distinctes (FileText, ShoppingCart, Package, LayoutDashboard)
- Statuts traduits en français via `traduireStatut()`

### Phase 6 — Commercial dashboard ✅
- Devis et commandes : liens cliquables vers Sellsy (`getSellsyUrl`)
- Nom du commercial propriétaire affiché (owner.id → staffMap via `/api/sellsy/staffs`)
- Bloc "Volume total chargé" supprimé

### Phase 7 — Leads matching déterministe ✅
- `src/lib/estimation.ts` : correspondance par nom exact, abréviations métier (SAM→Salle à manger, SDB→Salle de bain, CH→Chambre), synonymes, score 0-100
- Aucune mention "IA", "estimation IA", Sparkles
- API `/api/demandes/[id]/match-sellsy` retourne scores et références

### Phase 8 — Contacts drawer par email ✅
- `/api/contacts/[id]/sellsy-history` cherche par email du contact (en plus du contact_id)
- Drawer affiche devis et BDC Sellsy liés

### Phase 9 — Traçabilité ✅
- `src/lib/sellsy-statuts.ts` : traduction FR de tous les statuts Sellsy
- Page traçabilité : barre de recherche (contact, n° devis, n° commande), 3 onglets, 4 KPIs
- Liaison par suffixe numéro document + fallback par nom contact + montant

### Phase 10 — Catalogue ✅ (partiel)
- Skeleton loading : fait (grille 4 KPIs + 10 lignes tableau animés)
- Code-barres : JsBarcode (CODE128), composant `barcode-label.tsx`, impression étiquettes 62×100mm
- Image produit : non faisable (API Sellsy ne retourne pas d'URL image sur les items)

### Phase 11 — Dashboard Marketing ✅
- Skeleton loading complet (header, 4 KPIs, budget, funnel)
- Classes cockpit-* respectées

### Phase 12 — Debug API ✅
- Meta Campaigns : validation token (debug_token), vérification scopes (ads_read), mode `?debug=1`
- Brevo Stats : validation clé API, mode `?debug=1`, cache 15min, calcul correct taux open/click

### Phase 13 — Rapport & Documentation ✅
- `RAPPORT_AUDIT_12_MARS_2026.md` : 421 lignes, arborescence, modèles, routes, env vars, fait/reste
- `KOKPIT.md` : mis à jour v10 → v11 avec toutes les features

---

## FEATURES FUN ✅

1. **Salutation dynamique** — topbar : Bonjour ☀️ / Bonne après-midi / Bonne soirée 🌙 / Bonsoir (basé sur l'heure)
2. **Micro-copy** — messages d'état vides contextuels (pipeline, leads, contacts, tâches, recherche...)
3. **Compteur animé KPI** — hook `useCountUp` avec ease-out 600ms
4. **Confetti sur vente** — `canvas-confetti` quand statut passe à VENTE
5. **Météo locale** — Open-Meteo API (La Réunion), filter CSS subtil (brightness/saturate)

---

## MON PROFIL ✅

- Page `/parametres` : formulaire éditable (prénom, nom), email/rôle read-only
- API `PATCH /api/user` : met à jour nom/prenom en base
- JWT callback : `trigger === "update"` re-fetch depuis DB → session reflète les changements immédiatement
- Intégrations : 8 services listés (Sellsy, Brevo, Open-Meteo, Supabase, Vercel, NextAuth, Meta Ads, Google Sheets)

---

## VUE CALENDRIER PLANNING ✅ (session 17 mars)

### Modèle
- `PostPlanning.scheduledDate DateTime?` ajouté (migration Supabase)
- 7 nouveaux `PostLabel` : AVIS_CLIENTS, FIDELISATION, TEASING_AVRIL, VIDEO_REEL, BLOG_SEO, EMAIL_BREVO, STORY
- Catégorie "Contenu" dans LABEL_CONFIG avec couleurs spécifiques

### Composants créés
- `src/components/planning/CalendrierView.tsx` — grille CSS Grid 7 colonnes, navigation mois, skeleton loading
- `src/components/planning/CalendrierCell.tsx` — cellule jour avec pills label, popover +N
- `src/components/planning/LegendLabels.tsx` — barre légende horizontale scrollable

### Page modifiée
- `src/app/(app)/planning/page.tsx` — toggle [Kanban] [Calendrier], persistance localStorage `kokpit_planning_vue`, défaut "calendrier"
- Clic carte calendrier → PostModal existant réutilisé
- Champ "Date publication" ajouté dans PostModal (3 colonnes : Colonne / Date publication / Échéance)

### API
- `GET /api/planning?mois=2026-03` — filtre par scheduledDate dans le mois
- `POST /api/planning` et `PUT /api/planning/[id]` — support `scheduledDate`

### Seed
- 13 cartes Mars 2026 injectées (17→31 mars)
- Script documenté : `scripts/seed-planning-mars.ts`

### Impression checklist
- Bouton "Imprimer" dans le calendrier
- Génère une checklist papier A4 : cases à cocher, jour, label, titre, triée par date

### Design tokens Marketing
- `--color-active: #7758A3` pour bouton vue active, bordure jour courant
- `--color-active-light` pour hover cellule

---

## FICHIERS MODIFIÉS / CRÉÉS (session 17 mars)

| Fichier | Action |
|---------|--------|
| `prisma/schema.prisma` | Modifié — scheduledDate + 7 PostLabel |
| `src/lib/auth.ts` | Modifié — JWT trigger="update" re-fetch |
| `src/app/api/sellsy/staffs/route.ts` | Créé — liste staffs Sellsy |
| `src/app/(app)/commercial/page.tsx` | Modifié — staffMap + nom commercial |
| `src/components/planning/CalendrierView.tsx` | Créé — vue calendrier mensuel |
| `src/components/planning/CalendrierCell.tsx` | Créé — cellule jour |
| `src/components/planning/LegendLabels.tsx` | Créé — légende labels |
| `src/components/planning/types.ts` | Modifié — 7 labels + scheduledDate |
| `src/components/planning/post-modal.tsx` | Modifié — champ scheduledDate |
| `src/app/(app)/planning/page.tsx` | Réécrit — toggle + calendrier |
| `src/app/api/planning/route.ts` | Modifié — filtre ?mois + scheduledDate |
| `src/app/api/planning/[id]/route.ts` | Modifié — support scheduledDate |
| `scripts/seed-planning-mars.ts` | Créé — seed documentation |
| `KOKPIT.md` | Mis à jour — M5, décisions, modèles |

---

## CE QUI RESTE À FAIRE

| # | Item | Priorité | Notes |
|---|------|----------|-------|
| AUD10-CB | Code-barres stocké en BDD (ProduitBarcode) | 🟡 | Actuellement généré à la volée |
| AUD10-IMG | Image produit dans drawer catalogue | 🔴 | Bloqué : API Sellsy ne fournit pas d'URL image |
| EASYCRON | Configurer EasyCron pour sync Sellsy toutes les 20min | 🟢 | Gratuit, URL: POST /api/contacts/sellsy-sync |
| A1 | Espace Achat — Classification ABC | 🟡 | Specs dans KOKPIT.md §17 |
| F1 | Création devis KOKPIT → Sellsy | 🟡 | Écriture API Sellsy |
| E1 | Espace client externe | 🟡 | Site séparé suivi commandes |
