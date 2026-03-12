# KOKPIT — Feuille de route & référence projet

> Ce fichier est la mémoire du projet. Toute session Claude Code doit le lire en premier et le mettre à jour en fin de session. Il prime sur tout autre document.

**Dernière mise à jour** : 12 mars 2026 (v4 — post audit terrain Claude Code)
**Mis à jour par** : Session Claude Code (audit terrain 14 points)

---

## 1. QUI, QUOI, POURQUOI

**Projet** : KOKPIT — CRM SaaS interne sur mesure
**Entreprise** : DIMEXOI — mobilier, Île de La Réunion
**Utilisatrice principale** : Laurence Payet (laurence.payet@dimexoi.fr) — responsable marketing, seule dans son service
**Philosophie** : Pas une copie de HubSpot. Un outil métier 100% adapté à DIMEXOI. Chaque feature doit répondre à un vrai besoin terrain, pas à une liste de cases à cocher.

**Ce que KOKPIT n'est pas :**
- Pas un éditeur email (Brevo fait ça — KOKPIT affiche les stats et synchronise les contacts)
- Pas un ERP (Sellsy reste la source de vérité commerciale)
- Pas un outil générique
- Pas de "lead scoring", "conversion funnel", "automation engine" — vocabulaire banni

**Ce que KOKPIT est :**
- Le hub central qui agrège Sellsy + Brevo + Instagram + Planning en un seul endroit
- L'interface quotidienne de Laurence et de l'équipe commerciale
- Un outil qui s'améliore de façon incrémentale, avec des sessions de dev régulières

**Vocabulaire KOKPIT** (cf. checklist UX) :
- A utiliser : Demande, Devis, Vente, Relance, Suivi, Action automatique, Priorité contact
- A bannir : Deal, Lead scoring, Conversion funnel, Automation engine

---

## 2. STACK TECHNIQUE

| Élément | Valeur |
|---------|--------|
| Framework | Next.js 15 App Router |
| Langage | TypeScript strict |
| UI | React 19 + Tailwind CSS + Lucide React |
| Classes CSS | Préfixe `cockpit-*` pour les classes custom |
| Police | Plus Jakarta Sans |
| Thème | LIGHT — fond `#F5F6F7`, accent jaune `#F4B400` |
| ORM | Prisma 5 |
| Base de données | PostgreSQL via Supabase |
| Auth | NextAuth.js v4 |
| Déploiement | Vercel |
| Repo | github.com/Laurence-de-DIMEXOI/KOKPIT (privé, branche `main`) |
| URL prod | https://kokpit-kappa.vercel.app |
| Supabase Project ID | `dbyltdnmpinyxlpotakq` |

**Règles techniques non négociables :**
- DnD : HTML5 natif partout, pas de librairie externe
- Positions Kanban : gap de 1000
- TypeScript strict — pas de `any`, pas d'exceptions
- Skeleton loading obligatoire sur toutes les pages avec données API externes
- Cache Sellsy : 3 min minimum
- LiaisonDocumentaire : stocker le `parentid` Sellsy V1 en base dès la première découverte — ne jamais rappeler V1 deux fois pour le même document
- Sellsy V1 : accessible via token Bearer V2 (pas de credentials séparés) — `sellsyV1Call()` dans `src/lib/sellsy.ts`

---

## 3. ROLES ET ACCES

| Rôle | Espaces accessibles |
|------|-------------------|
| ADMIN | Administration - Commercial - Marketing - (Achat locked) |
| DIRECTION | Administration - Commercial - Marketing - (Achat locked) |
| COMMERCIAL | Commercial uniquement |
| MARKETING | Marketing uniquement |

**Règle topbar** : si un utilisateur n'a accès qu'à un seul espace, les onglets espaces sont masqués — la sidebar s'affiche directement.

---

## 4. INTEGRATIONS EXTERNES

| Service | Usage dans KOKPIT | Clé d'env |
|---------|------------------|-----------|
| Sellsy V2 | Source de vérité : devis, commandes, contacts, catalogue | `SELLSY_CLIENT_ID` / `SELLSY_CLIENT_SECRET` |
| Sellsy V1 | Récupération `parentid` chaîne documentaire — via Bearer token V2, endpoint `apifeed.sellsy.com/0/` | Même credentials V2 — scope "API V1" à activer dans Sellsy > Paramètres |
| Brevo | Stats email + sync listes contacts + remontée signaux engagement (webhooks) | `BREVO_API_KEY` |
| Meta / Instagram | Feed Instagram + stats réseaux | `META_ACCESS_TOKEN` + `META_ACCESS_TOKEN_EXPIRES_AT` |
| Supabase | Storage Upload images couverture Planning | `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| Anthropic | Chatbot KOKPIT (M4C) | `ANTHROPIC_API_KEY` |

**Points critiques API Sellsy :**
- Pas de lien direct devis -> commande en V2 -> croisement via `contact_id`
- `parentid` / `linkedid` / `linkedtype` uniquement en V1 (scope à activer)
- Règle de cache `parentid` : appeler V1 une seule fois par document, stocker en `LiaisonDocumentaire`, ne jamais rappeler V1 pour ce document. Cache supplémentaire 30 min côté API route.

---

## 5. ARCHITECTURE NAVIGATION (DEPLOYEE)

Option B : Topbar horizontale pour les espaces + Sidebar allégée pour le menu contextuel. Commit `293621c`.

```
+-------------------------------------------------------------------------+
| [KOKPIT]  | Administration | Commercial | Marketing | Achat locked | [User] |
+----------+--------------------------------------------------------------+
| Menu     |                                                              |
| espace   |              Contenu de la page                              |
| actif    |                                                              |
| -------- |                                                              |
| GENERAL  |                                                              |
| - Docs   |                                                              |
| [Nom]    |                                                              |
+----------+--------------------------------------------------------------+
```

**Fichiers :**
- `src/components/layout/topbar.tsx`
- `src/lib/nav-config.ts`
- `src/components/layout/sidebar.tsx`
- `src/hooks/use-active-space.ts`
- `src/app/(app)/layout.tsx`

**Persistance espace actif** : localStorage clé `kokpit_espace_actif`

**Menus par espace :**

- **Administration** (ADMIN, DIRECTION) : Dashboard `/administration` - Collaborateurs - Congés - Paramètres
- **Commercial** (ADMIN, COMMERCIAL, DIRECTION) : Dashboard `/commercial` - Demandes - Contacts - Pipeline Devis - Commandes - Traçabilité - Catalogue
- **Marketing** (ADMIN, MARKETING, DIRECTION) : Dashboard `/dashboard` - Campagnes - Demandes - Contacts - Emailing - Planning - Nos Réseaux - Liens utiles - Automatisations - Paramètres
- **Achat** : placeholder désactivé, tooltip "Bientôt disponible"
- **Général** (tous rôles) : Docs & Aide `/docs`

---

## 6. ETAT DU PROJET

### EN PRODUCTION — TOUT LE BACKLOG INITIAL COMPLETE

| ID | Feature | Commit |
|----|---------|--------|
| — | Auth NextAuth.js v4 + 4 rôles | sessions précédentes |
| — | Planning Kanban 8 colonnes, 14 labels, DnD HTML5, checklist, upload image | sessions précédentes |
| — | Cache API Sellsy 3 min + `fresh=true` | sessions précédentes |
| C1 | Tri + filtre Pipeline devis | sessions précédentes |
| C2 | Liens PDF / Sellsy — devis ET commandes | `badbac1` |
| C3 | Traçabilité Devis -> Commandes (3 onglets, 4 KPIs) | `9998768` |
| C3bis | Chaîne documentaire — `parentid` via API V1, cache BDD permanent | `7eb8ab2` |
| C4 | Fiches contacts enrichies — historique devis/commandes | `badbac1` |
| C5 | Alertes devis expirants | sessions précédentes |
| C6 | Redesign drawer Catalogue | `badbac1` |
| M1 | Liens Utiles | `4804911` |
| M2 | KPIs Brevo — dashboard Marketing | session précédente |
| M2bis | Sync contacts Sellsy -> Brevo (4 segments) | session précédente |
| M3 | Nos Réseaux + Feed Instagram | `acc6902` |
| M4 | Docs + FAQ + Chatbot (Claude Haiku) | `678964d` |
| NAV | Navigation Option B — Topbar + Sidebar allégée | `293621c` |
| P0 | Performance backend (cache Sellsy, funnel dynamique, limits) | `0ec6d05` |
| P0bis | Performance frontend (useMemo x8, lazy load chatbot, polling 60s) | `6fef0ef` |
| R1-R4 | Notifications, EmptyState, ErrorState, FreshnessIndicator | `0ed4ef6` |

**Nettoyage effectué :**
- [x] Route `/api/sellsy/diagnostic` supprimée
- [x] Post test "TEST - Post de vérification" supprimé

### AUDIT TERRAIN 12 MARS 2026

| Phase | Description | Commit |
|-------|-------------|--------|
| 1+4 | Bugs UI (contraste boutons) + Sellsy URLs centralisé | `29f02dc` |
| 2+3 | Login redirect par rôle + suppression boutons sync manuels | `b623f08` |
| 5+9.2 | Recherche globale étendue (6 catégories) + statuts FR | `1211b2b` |
| 6+9.3 | Commercial dashboard liens Sellsy + traçabilité search | `384767c` |
| 11 | Dashboard Marketing skeleton loading | `14a531f` |
| 12 | Diagnostic amélioré Meta + Brevo APIs | `f995680` |

**Utilitaires créés :**
- `src/lib/sellsy-urls.ts` — `getSellsyUrl(type, id)` pour liens profonds Sellsy
- `src/lib/sellsy-statuts.ts` — `traduireStatut(status)` pour traduction FR des statuts Sellsy

### PROCHAINS SPRINTS — FEATURES ET CORRECTIONS

Ordre de priorité fondé sur l'impact terrain réel pour DIMEXOI.

| ID | Feature | Pourquoi | Effort est. |
|----|---------|----------|-------------|
| X4 | Priorité contact | Jauge froid/tiède/chaud calculée à la volée sur signaux Sellsy + Brevo. Voir section 12. | 1j |
| X5 | Brevo enrichi | Listes dynamiques + webhook Brevo -> KOKPIT (signaux engagement). Voir section 13. | 2j |
| X8 | ROI Marketing réel | `CoutMarketing` + dashboard dépenses vs CA. Voir section 14. | 1-2j |
| X9 | Segmentation RFM | Récence/Fréquence/Montant -> segments Brevo. Voir section 15. | 2j |
| A1 | Espace Achat | Classification ABC, fournisseurs, bons de commande | ? |
| F1 | Création devis KOKPIT→Sellsy | Formulaire KOKPIT qui crée un devis dans Sellsy via API | 2j |
| E1 | Espace client externe | Portail client pour suivi commandes, SAV | ? |
| AUD7 | Leads : matching déterministe | Remplacer estimation IA par correspondance métier (SAM, SDB, CH) | 1j |
| AUD8 | Contacts : devis/BDC par email | Retrouver historique Sellsy par email (pas seulement contact_id) | 0.5j |
| AUD10 | Catalogue : code-barres + étiquettes | JsBarcode, modèle ProduitBarcode, impression @media print | 1j |
| META | Token Meta : renouveler | Vérifier validité via `/api/meta/campaigns?debug=1` | action manuelle |

---

## 7. DECISIONS TECHNIQUES ACTEES

Ces choix ne sont pas remis en question sans discussion préalable.

| Sujet | Décision | Raison |
|-------|----------|--------|
| Éditeur email | Pas dans KOKPIT | Brevo fait ça |
| Sync contacts | KOKPIT fait le pont Sellsy->Brevo via API | Pas de CSV, pas de Zapier |
| Segments Brevo | 4 segments fixes + listes dynamiques à la demande (X5) | Voir section 13 |
| Lien devis->commande | Croisement via `contact_id` | API V2 sans lien direct |
| Chaîne documentaire | V1 ciblée pour `parentid` via Bearer V2 — résultat stocké BDD définitivement | Chaîne immuable, V1 lente |
| Sellsy V1 auth | Bearer token V2 suffit — pas de credentials OAuth1 séparés | Confirmé en session Claude Code |
| Scoring contacts | Calculé à la volée (jamais stocké), jauge colorée | Toujours à jour |
| DnD | HTML5 natif | Pas de dépendance externe |
| Positions Kanban | Gap de 1000 | Réordonnancement sans recalcul |
| Chatbot | `claude-haiku-4-5-20251001` | Coût réduit, suffisant FAQ interne |
| Cache Sellsy | 3 min (`revalidate: 180`) | Équilibre fraîcheur/performance |
| Skeleton loading | Obligatoire sur toutes les pages API | Pages bloquantes = mauvaise UX |
| Performance frontend | `useMemo` sur listes longues, lazy load chatbot, polling 60s | Confirmé P0bis |

---

## 8. MODELES PRISMA EN PRODUCTION

25 tables. Voir `prisma/schema.prisma` pour le détail complet.

**Core :**
- **User** — collaborateurs DIMEXOI (4 rôles : ADMIN, DIRECTION, COMMERCIAL, MARKETING)
- **Showroom** — points de vente
- **Contact** — contacts CRM (unique par email, lié Sellsy)
- **Lead** — leads/opportunités
- **Devis** — devis KOKPIT (lié Sellsy via `sellsyQuoteId`)
- **Vente** — ventes réalisées
- **Evenement** — timeline contact (10 types d'événements)
- **Task** — tâches commerciales avec échéances

**Marketing :**
- **Campagne** — campagnes pub Meta/Google (+ `metaInsights` JSON)
- **EmailCampaign** — campagnes email internes
- **EmailLog** / **SmsLog** — logs envois
- **BrevoSyncLog** / **BrevoWebhookEvent** — sync et webhooks Brevo
- **PostPlanning** / **PostChecklist** / **PostAttachment** — planning posts Kanban

**Commercial :**
- **LiaisonDevisCommande** — liaisons devis↔commande Sellsy
- **LiaisonDocumentaire** — chaîne documentaire Sellsy V1 (`parentid`)
- **ObjectifCommercial** — objectifs CA mensuels
- **DemandePrix** — demandes de prix (ex Glide)

**Système :**
- **ClickEvent** — tracking UTM/clics
- **CoutOffline** — coûts offline (salons, print)
- **AuditLog** — audit trail
- **LienUtile** — liens utiles équipe
- **DocArticle** — documentation interne
- **Workflow** / **EmailTemplate** / **WorkflowExecution** — automatisations

**A créer (prochains sprints) :**
- `CoutMarketing` — coûts marketing pour ROI réel (X8)
- `ProduitBarcode` — codes-barres catalogue (AUD10)

---

## 9. VARIABLES D'ENVIRONNEMENT

| Variable | Statut | Usage |
|----------|--------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel | Storage Planning |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel | Storage Planning |
| `SELLSY_CLIENT_ID` | Vercel | API Sellsy V2 + V1 |
| `SELLSY_CLIENT_SECRET` | Vercel | API Sellsy V2 + V1 |
| `META_ACCESS_TOKEN` | Vercel | Feed Instagram |
| `META_ACCESS_TOKEN_EXPIRES_AT` | A ajouter | Alerte expiration token Meta |
| `BREVO_API_KEY` | Vercel | Stats email + sync contacts |
| `BREVO_WEBHOOK_SECRET` | A créer | Webhooks Brevo -> KOKPIT (X5) |
| `ANTHROPIC_API_KEY` | Vercel | Chatbot M4C |
| `NEXTAUTH_SECRET` | Vercel | Auth |
| `NEXTAUTH_URL` | Vercel | Auth |

**Action requise** : activer le scope "API V1" dans Sellsy > Paramètres > Portail développeur > API V2 pour que C3bis fonctionne en production.

---

## 10. PROTOCOLE DE MISE A JOUR

A chaque fin de session Claude Code, mettre à jour ce fichier :

1. **Section 6** : déplacer features terminées vers "En production" avec commit
2. **Section 7** : ajouter toute nouvelle décision structurante
3. **Section 8** : déplacer modèles "A créer" vers "En production" une fois migrés
4. **Section 9** : mettre à jour les statuts variables
5. **En-tête** : date + auteur + incrémenter version (v1, v2, v3...)

Format du commit : `docs: mise à jour KOKPIT.md — [features terminées]`

---

## 11. WORKFLOW DE DEVELOPPEMENT

```
Session Claude (stratégie)          Session Claude Code
        |                                    |
        |  Lit KOKPIT.md                     |
        |  Produit brief détaillé            |
        |─────────── brief ─────────────────>|
        |                                    |  Lit KOKPIT.md en premier
        |                                    |  Exécute le brief
        |                                    |  Met à jour KOKPIT.md
        |<────────── brief de retour ────────|
        |                                    |
        |  Intègre le retour dans KOKPIT.md  |
        |  Prépare le prochain brief         |
```

**Règle** : Claude Code ne fait jamais d'hypothèse sur l'état du projet. Il lit KOKPIT.md, constate l'état réel, puis agit. Si KOKPIT.md contredit le brief, il signale le conflit avant d'agir.

---

## 12. SPECS — PRIORITE CONTACT (X4)

> Affiché "Priorité" dans l'interface — jamais "score"

### Philosophie

Jauge visuelle qui dit au commercial en 1 seconde : "Ce contact mérite ton attention maintenant, et voilà pourquoi." Calculée à la volée — jamais stockée (toujours à jour).

### Signaux et poids

| Signal | Points | Source |
|--------|--------|--------|
| Devis ouvert depuis > 7 jours sans action | +30 | Sellsy |
| Devis expirant dans < 5 jours | +25 | Sellsy |
| A passé une commande dans les 90 derniers jours | +20 | Sellsy |
| A eu un devis dans les 30 derniers jours | +20 | Sellsy |
| A ouvert un email Brevo dans les 14 derniers jours | +15 | Brevo webhook (X5) |
| Aucun contact depuis > 60 jours (client existant) | +15 | Sellsy |
| Devis dormant > 30 jours | +10 | Sellsy |

### Niveaux

| Score | Couleur | Label |
|-------|---------|-------|
| 0–20 | Gris | Froid |
| 21–50 | `#F4B400` jaune | Tiède |
| 51–100 | `#E24A4A` rouge doux | Chaud |

### UI

- Jauge colorée dans le drawer fiche contact + raison : "Devis ouvert depuis 9 jours - Chaud"
- Pastille colorée dans la liste Contacts (pas de chiffre brut)
- Tri "Par priorité" -> contacts chauds en premier

---

## 13. SPECS — BREVO ENRICHI (X5)

### Niveau 1 — déjà en prod (M2 + M2bis)

Stats campagnes en lecture + sync contacts Sellsy -> Brevo en 4 segments fixes.

### Niveau 2 — listes dynamiques (X5a)

Permettre à Laurence de créer des listes nommées depuis KOKPIT en combinant critères métier. Exportées vers Brevo en 1 clic.

### Niveau 3 — webhook Brevo -> KOKPIT (X5b)

```
POST /api/marketing/brevo/webhook
Événements : opened - clicked - unsubscribed - soft_bounce
-> enrichit fiche contact + alimente priorité (section 12)
```

```prisma
model BrevoWebhookEvent {
  id          String   @id @default(cuid())
  contactId   String?
  email       String
  event       String
  campaignId  String?
  receivedAt  DateTime @default(now())
}
```

### Niveau 4 — statut Brevo dans la fiche contact

Abonné / désabonné / jamais contacté - date dernière interaction - listes d'appartenance.

---

## 14. SPECS — ROI MARKETING REEL (X8)

### Problème

30 000 EUR investis Meta en 2025 sans CAC réel calculable — coûts Salon + agence nulle part.

### Modèle

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

### Dashboard (ADMIN + DIRECTION uniquement)

4 KPIs : CA généré - Total dépenses - ROI % - CAC réel
Graphique dépenses vs CA par mois - Export PDF mensuel.

---

## 15. SPECS — SEGMENTATION RFM (X9)

### Calcul sur commandes Sellsy

| Dimension | Calcul |
|-----------|--------|
| Récence (R) | Jours depuis dernière commande |
| Fréquence (F) | Nombre de commandes sur 24 mois |
| Montant (M) | CA total sur 24 mois |

### Segments DIMEXOI

| Segment | Critères | Action |
|---------|----------|--------|
| Champions | R < 30j, F >= 3, M élevé | Invitation événement VIP |
| Clients loyaux | F >= 2, M correct | Cross-sell (bain -> cuisine) |
| A risque | Bonne F/M historique, R > 90j | Campagne réactivation urgente |
| Perdus | R > 180j, F = 1 | Campagne "on pense à vous" |
| Nouveaux | 1 commande, R < 30j | Séquence post-achat Brevo |

### Technique

Calcul à la volée sur données Sellsy existantes - Cache 24h - Pas de nouveau modèle Prisma. Chaque segment -> liste Brevo exportable en 1 clic.
