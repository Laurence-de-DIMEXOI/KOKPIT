# KOKPIT — Feuille de route & référence projet

> Ce fichier est la mémoire du projet. Toute session Claude Code doit le lire en premier et le mettre à jour en fin de session. Il prime sur tout autre document.

**Dernière mise à jour** : 18 juin 2026 (v33 — Container & Prévisionnel)
**Mis à jour par** : Session Claude Code (sprint juin — packing list arrivage + projection trésorerie)

---

## ÉTAT ACTUEL — MAI 2026 (à lire avant tout)

### Modules en place
- **Demandes** (`/leads`, `/api/demandes`) — lecture des `Lead` + `DemandePrix` avec attribution stricte 7j/30j (devis liés en 7j, BDC liés en 30j via `LiaisonDevisCommande`).
- **Tunnel marketing** (`/marketing` + `/api/marketing/tunnel`) — renommage `/dashboard` → `/marketing` (mai 2026, redirect legacy en place) — KPI conversion + ROAS basé sur `AttributionDevis` / `AttributionBDC`.
- **SAV** (`/commercial/sav`) — sync depuis Sellsy via custom field "Etat des produit = SAV", endpoint `GET /orders/{id}/custom-fields` (le `embed=customfields` ne marche PAS sur `/orders/search`). Types commentaires : NOTE / APPEL / MESSAGE / MAIL / COURRIER.
- **Pointage** — solde heures supp + bouton "Consommer Xh" (montant custom) + rotation café auto via `src/data/cafe-planning.ts` (popup pointage + banderole partagent la même source).
- **Permissions par utilisateur** — matrice dans `/administration/parametres` (champ `User.moduleAccessOverrides Json?`).
- **Banderole actus** — fixe top 28px, items via `/api/news` (cache 2 min) : café auto · container en transit (cliquable) · CA mois · plus grosse commande · prochain férié. Texte toujours en blanc. Accepte `?fresh=true` pour bypasser le cache. Écoute l'event global `kokpit:refresh-news` côté client → se synchronise avec le bouton Actualiser du dashboard commercial. **Refresh éclair** : à chaque calcul, re-fetch du `statutSellsy` des BDC du mois où il est NULL (max 50, cap 20s) → garantit que les BDC annulés récents sont exclus. Items à action (ex: container) : bouton CTA inline qui déclenche une pop-up (cf. Container ci-dessous).
- **Container en transit** — packing list statique par arrivage stockée en JSON dans `/public/data/container-XXXX.json` (format : `{ meta: { contNo, departLabel, arriveeLabel, source, … }, items: [{ bcdi, ref, description, qty, note?, priceHTOverride? }] }`). Composants partagés : `ContainerBanner` (gradient teal Commercial) et `ContainerModal` (pop-up thème clair cockpit, recherche multi-champs BCDI/réf/désignation/client/commercial, badge note ambre). Modèle d'arrivages : config dans `src/lib/imports-config.ts` (mapping `IMP-XXX` → fichier JSON). Bandeau réutilisé dans la banderole topbar **et** sur `/achat/suivi-commandes` (avant la légende fabrication).
- **Prévisionnel achat** (`/achat/previsionnel`) — projection trésorerie + potentiel commercial par arrivage. Onglets par IMP (cf. `imports-config.ts`). Une ligne par BCDI (groupé sur le packing list) avec colonnes : BCDI · Client · Propriétaire · Statut · Nb meubles · Total HT · Reste à payer HT · Potentiel comm. Drawer expandable (ChevronRight → meubles + qty + note ; pour STOCK : prix HT unitaire + sous-total).
  - **Reste à payer HT** : 3 sources en cascade.
    1. **Tables locales** `SellsyDocLink` + `SellsyInvoicePaid` (alimentées par les webhooks Sellsy + backfill) → suit la chaîne `BCDI → BDL → FAPJ` et somme le `paid_incl_tax` de toutes les factures terminales. C'est la voie la plus précise.
    2. **V1 Sellsy `Document.getOne(order).relateds_amount`** → agrège paiements directs + factures d'acompte liées (utilisée si la table locale n'a pas encore l'info pour ce BDC). Validé sur BCDI-05598 META FORGE : `totalAmount 1 250 € − relateds 625 €` → reste 625 € TTC ≈ HT 576 €.
    3. **V2 status + deposit + `/orders/{id}/payments`** en dernier recours.
    Cas particuliers en court-circuit : `paid` → 0 ; `cancelled`/`refused`/`expired` → 0. Limite Sellsy : tous les filtres `parentid`, `linkedid`, `contact_id`, `individual_id` sont cassés/ignorés sur V1 ET V2 (testés exhaustivement), donc impossible de filtrer la recherche par client ou parent — le scan webhook + backfill est l'unique chemin propre.
  - **Webhook & backfill paiements**
    - Tables Supabase : `sellsy_doc_link` (parent ↔ enfant : BCDI → BDL/FAPJ, BDL → FAPJ), `sellsy_invoice_paid` (snapshot `total`/`remaining`/`paid` par facture), `sellsy_webhook_event` (audit brut).
    - Webhook `POST /api/webhooks/sellsy` (Sellsy V1) gère désormais aussi `delivery.*` et appelle `upsertInvoicePaid` + `upsertDocLink` sur chaque facture/BDL reçu (cf. `src/lib/sellsy-webhook-handler.ts`). HMAC SHA-1 + SHA-256 acceptés.
    - Backfill initial : `GET /api/cron/sellsy-backfill-links[?max=5000&kind=invoice|delivery]`, Bearer `CRON_API_SECRET`, scanne `/invoices/search` + `/delivery-notes/search` (desc par created), upsert les liens. À lancer une fois après le déploiement. Re-lancer en cas de gap.
  - **Potentiel commercial** (lignes STOCK) : Σ qty × prix HT catalogue Sellsy. Cascade : `SellsyDeclinationCache` exact → décli sœur du même `itemId` → `SellsyItemCache` parent → live `/items/{id}/declinations/{declId}/prices` (écriture opportuniste dans le cache) → live `/items/search`. Override manuel possible via `priceHTOverride` dans le JSON.
  - **Auto-stock** : tout BCDI dont le client Sellsy commence par `ORDER DIMEXOI` / `DIMEXOI` / `EXHIBITION` est traité automatiquement comme du stock (potentiel calculé sur prix catalogue, pas de reste à payer).
  - **Conversion manuelle BCDI → stock** : bouton discret « Convertir en stock » dans le drawer d'une ligne BCDI client (ex: annulation client avant l'arrivée). Persisté en table `previsionnel_bcdi_override` (Supabase) scopé par `impCode`. Bouton inverse « Restaurer le BCDI client ». Le BCDI converti voit son reste à payer retiré du total et son potentiel recalculé via prix catalogue.
  - **Badge SAV/RETOUR** : si le custom field Sellsy « Etat des produits » du BDC = `SAV` ou `RETOUR`, badge violet affiché à côté du statut + reste à payer remis à 0 (n'entre pas dans la projection trésorerie). Cache local Vente puis fallback live Sellsy `/orders/{id}/custom-fields`.
  - Endpoints : `GET /api/achat/previsionnel?imp=IMP-XXX[&fresh=true]` (cache 15 min), `POST /api/achat/previsionnel/override { bcdi, impCode, action: "to-stock" | "restore", note? }`.
- **Need Price** (`/achat/need-price`) — quand Elaury passe en PRIX_RECU, email au demandeur **avec CC Bernard + Michelle + Daniella**.
- **Notifications cloche** filtrées par user assigné (sauf ADMIN/DIRECTION qui voient tout).
- **Daily Briefing** (`/aujourd-hui`) — page matinale Bernard + Daniella : 4 blocs (leads brûlants 48h, devis expirants <5j, mood mensuel par showroom, tâches du jour). Accès via flag `User.dailyBriefingEligible`. ADMIN/DIRECTION/MARKETING en vue agrégée avec toggle "Tous / Bernard / Daniella". Admin UI : `/administration/daily-briefing`.
- **Sur-Mesure** (`/commercial/sur-mesure`) — remplace le board Trello "Dimexoi Equipe". Objet pivot `ProjetSurMesure` (SM-2026-XXXX) : pipeline 9 statuts (kanban/liste), demande dessin pour Laurent, plans 3D, Need Price (crée un `NeedPrice` → Elaury), lien Sellsy DEPI/BCDI (lecture seule, montant + conversion via DB locale), RDV Calendly rattachés, commentaires. Notifs mail à chaque transition → **Michelle + Laurent + propriétaire**. Vue par défaut : Laurent → dessin, Elaury → need price. ⚠️ ProjetSurMesure → `NeedPrice` (PAS `DemandePrix` : ce sont 2 objets distincts, le brief s'était trompé).
- **SLA** : 48h, mais **relances automatiques DÉSACTIVÉES** (mai 2026, demande Laurence). Plus aucun email auto ni création de tâche. Le calcul du dépassement reste affiché en UI (badge sur `/leads`). Le job `sla-check` retourne juste un compteur (`status: "disabled"`).

### Flow email
- Tous les `sendEmail()` (`src/lib/resend.ts`) passent désormais par **Brevo** (key déjà configurée). Resend abandonné — clé `RESEND_API_KEY` jamais configurée sur Vercel.
- Sender par défaut : `BREVO_SENDER_EMAIL` (à ajouter sur Vercel) sinon fallback hardcodé `laurence.payet@dimexoi.fr`.

### Sync Sellsy actuel (cron `sync-sellsy`)
- Fenêtre **60 jours** (élargi de 14j le 7 mai pour rattraper les drafts → invoiced tardifs).
- Pagination jusqu'à 500 BDC (5 pages × 100).
- Si BDC sans Contact KOKPIT → **création auto d'un Contact placeholder** (`sellsy-{id}@placeholder.dimexoi.fr`, `lifecycleStage = CLIENT`, `sourcePremiere = SHOWROOM`, parsing prénom/nom heuristique). Permet de capturer les ventes walk-in showroom.
- Recompute attribution sur 35j à chaque exécution.

### Reporting commercial — règle de filtrage Laurence (validée mai 2026)
Pour les chiffres CA / volumes BDC + Devis du rapport mensuel :
- statut Sellsy ≠ `cancelled` ET ≠ `refused` ET ≠ `expired`
- montant > 1 €
- **Custom field "Etat des produit"** IN : `EN STOCK`, `SUR COMMANDE`, `ARRIVAGE M+1/2/3`, `1 PARTIE EN STOCK - 1 PARTIE SUR COMMANDE`
- Exclus : `SAV`, `RETOUR`, valeurs vides

→ Champs dédiés ajoutés sur `Vente` et `Devis` (mai 2026) :
- `etatProduit String?` — la valeur du custom field résolue en label
- `statutSellsy String?` — le status brut Sellsy

→ **Backfill** : automatique (cron quotidien 3h15 sur `onlyMissing=true&limit=500`) + manuel `GET/POST /api/admin/refresh-etat-produit?since=2024-01-01&onlyMissing=true&limit=2000` — auth ADMIN/DIRECTION, Bearer CRON_API_SECRET, ou UA `vercel-cron`.

→ **Helper centralisé** : `src/lib/reporting-filter.ts` exporte `reportingFilterVente()`, `reportingFilterDevis()` + variantes strict. À utiliser partout où un chiffre Sellsy doit matcher l'extract Laurence.

→ **Endpoints qui appliquent le filtre** :
- `/api/news` — banderole CA mois + plus grosse commande (DB locale, plus de live Sellsy)
- `/api/dashboard/stats` (vue direction) — CA mensuel + tendance 12 mois
- `/api/marketing/roi` — fallback Prisma
- `/api/campagnes` — comptage devis/ventes + caTotal par campagne (vue liste + détail)

→ **Vérifications validées** :
- Avril 2026 : 42 BDC bruts → **37 BDC / 55 189,99 €** ✅ match Sellsy
- Avril 2024 : 61 BDC bruts → **54 BDC / 59 165,19 €** ✅ match Sellsy
- Mai 2026 (au 9 mai) : 12 BDC filtrés / **17 035,11 €** ✅ identique entre banderole et dashboard

### Dashboard commercial (`/commercial`) — refonte 9 mai 2026
**Tous les montants sont en HT** (priorité `total_excl_tax` / `total_raw_excl_tax`, fallback TTC seulement pour les BDC anciens sans HT explicite).
- Fichier : `src/app/(app)/commercial/page.tsx`, fonction `getAmount`.
- Labels mis à jour : "CA Devis (HT)", "CA Commandes (HT)".
- Composants déjà HT auparavant : `EvolutionCharts`, `PerformanceTable` (API `total_excl_tax`), `SalesObjective`, `expiring-quotes` (corrigé).

**Filtres période** : Aujourd'hui · Cette semaine · Ce mois-ci · **Mois dernier (M-1)** · Cette année.
- `getPeriodDates` ajoute `month_prev` : 1er du mois précédent → dernier jour du mois précédent.
- `getPreviousPeriodDates("month_prev")` = M-2 (pour les variations).
- `/api/sellsy/performance` accepte aussi `today` et `month_prev`.
- La `PerformanceTable` est désormais **contrôlée par le parent** quand `period` est passé en prop → un seul sélecteur partagé.

**KPI cards** :
- KPI "Produits" supprimée (catalogue accessible via `/commercial/catalogue`)
- Grille passée de 5 à 4 cartes
- Sections "Derniers devis" et "Dernières commandes" supprimées (la `PerformanceTable` couvre déjà la perf détaillée)

**Breakdown Etat des produits sur Devis + Commandes** :
- Affiche 📦 En stock · ⏳ Sur commande · Mixte (si > 0)
- Source : DB locale `Vente.etatProduit` / `Devis.etatProduit`
- Endpoint : `GET /api/commercial/etat-stock-stats?start=ISO&end=ISO`
- Buckets :
  - `enStock` = `EN STOCK` + `ARRIVAGE M+1/2/3` (+ `M+1`, `M+2`, `M+3`)
  - `surCommande` = `SUR COMMANDE`
  - `mixte` = `1 PARTIE EN STOCK - 1 PARTIE SUR COMMANDE`
  - `autre` = SAV / RETOUR / COMMANDE MAGASIN / ...
  - `nonRenseigne` = etatProduit NULL (non affiché côté UI)

**ConversionTime fix** :
- Avant : ne trouvait pas les conversions devis pré-période → commande dans la période.
- Après : reçoit `allEstimates` (toute la fenêtre chargée), `orders` filtrés par période → calcul cross-période correct.

**Champ `surMesure` Boolean? ajouté sur Vente + Devis** (migration `add_sur_mesure_devis_vente` appliquée Supabase).
- Pas affiché actuellement (pivot vers Etat des produits demandé).
- Conservé pour usage futur — déjà alimenté par `fetchEtatAndStatus` quand le custom field "Sur-mesure" est présent côté Sellsy.

### Reconstruction DB historique (mai 2026)
- Endpoint `/api/admin/deep-sync-sellsy?since=YYYY-MM-DD&type=both` : sync paginée TOUS BDC + Devis Sellsy, sans limite de fenêtre. Resumable via `nextOffset`.
- Lancé année par année 2019→2026 → **2 810 BDC** + **7 053 Devis** importés depuis Sellsy.
- ⚠️ `Devis.createdAt` est le timestamp Prisma (pas la date Sellsy). Pour requêter par date du devis, il faudra ajouter un champ dédié si besoin (`dateDevisSellsy`).

### Bug critique fix (mai 2026)
- `Sellsy /orders/{id}` ne renvoie **PAS** le champ `status`.
- `fetchEtatAndStatus` dans `/api/admin/refresh-etat-produit` interroge maintenant aussi `/orders/search?ids[]={id}` pour récupérer le statut.
- `refresh-etat-produit` ne **jamais écraser** une valeur existante avec NULL — guard `if (etatProduit === null && statutSellsy === null) return`.

### Tracking GA4 — bloqué
- Code GA4 prêt (`src/lib/ga4.ts`, `/api/marketing/ga4-pageviews`, intégré banderole)
- Service Account créé (`kokpit-ga4@kokpit-ga4-reader.iam.gserviceaccount.com`)
- **Bloqué** : GA4 refuse d'ajouter le SA "n'est pas un compte Google" même après activation Analytics Data API + 24h. Solution Plan B = OAuth refresh token.

### Vercel Pro (upgrade effectué mai 2026)
- `maxDuration` max = **800s** (PAS 900 — cause des erreurs de deploy si dépassé). Toutes les routes longues sont à 800.
- Cron jobs : jusqu'à 100 sur Pro. Tous les crons sont configurés dans `vercel.json`.
- **Cron Vercel envoie GET (pas POST)** + UA `vercel-cron`. Toute route déclenchée par cron doit avoir un handler GET ET accepter l'UA `vercel-cron` en bypass auth (même logique que Bearer `CRON_API_SECRET`).

### Crons Vercel actifs (`vercel.json`)
**Note** : toutes les heures sont **UTC** (Réunion = UTC+4).

| Path | Schedule (UTC) | Heure Réunion | Rôle |
|---|---|---|---|
| `/api/cron?job=sync-sellsy` | `0 */2 * * *` | toutes les 2h | Sync BDC + Devis + etatProduit + statutSellsy |
| `/api/sellsy/sync-catalogue` | `0 4 * * 1,4` | Lun + Jeu 8h | Items + déclinaisons (filet — le webhook gère le temps réel) |
| `/api/sellsy/tracabilite?fresh=true` | `30 */6 * * *` | toutes les 6h | LiaisonDevisCommande (matching BDC↔devis) |
| `/api/admin/refresh-etat-produit?type=orders&limit=2000` | `0 21 * * *` | 01h00 | Backfill BDC nuit (passe 1) |
| `/api/admin/refresh-etat-produit?type=orders&limit=2000` | `30 21 * * *` | 01h30 | Backfill BDC nuit (passe 2) |
| `/api/admin/refresh-etat-produit?type=orders&limit=2000` | `0 22 * * *` | 02h00 | Backfill BDC nuit (passe 3) |
| `/api/admin/refresh-etat-produit?type=estimates&limit=2000` | `30 22 * * *` | 02h30 | Backfill Devis nuit |
| `/api/admin/refresh-etat-produit?limit=2000` | `15 23 * * *` | 03h15 | Filet quotidien (both types) |
| `/api/cron?job=sync-club` | `5 6 * * *` | 10h05 | Sync Club Pro |
| `/api/cron?job=relance` | `0 9 * * *` | 13h00 | Relances clients |
| `/api/cron?job=cross-sell` | `30 9 * * *` | 13h30 | Cross-sell |
| `/api/recap-hebdo` | `57 8 * * 2` | Mardi 12h57 | Récap hebdo direction |

Toutes les routes ont `onlyMissing=true` quand absent — donc inoffensif une fois l'historique rempli (0 résultat scannable).

⚠️ **Cron `sla-check` retiré** — voir section "SLA" ci-dessus. Code de la fonction conservé mais retourne `status: "disabled"` sans envoyer d'email.

### Webhook Sellsy v1 — temps réel (mai 2026)
**Endpoint** : `POST /api/webhooks/sellsy` (et `GET` healthcheck).

Configuré côté **interface Sellsy** (Préférences → Connecteurs/API → Webhooks) :
- URL : `https://kokpit-kappa.vercel.app/api/webhooks/sellsy`
- Content-type : `application/json`
- "Retourne l'objet dans le payload" : ✅
- Signature : variable Vercel `SELLSY_WEBHOOK_SECRET`
- Events activés : `created` / `updated` / `deleted` (+ `step` / `linked` / `unlinked` pour les documents) sur les catégories : Client, Prospect, Contact, Produit, Document redactor, Facture.

**Format payload Sellsy v1** (différent de v2) :
```json
{ "notif": "created", "relatedtype": "Item", "relatedid": "12345", "object": {...} }
```

Le handler :
- Parse JSON OU form-urlencoded
- Vérifie HMAC SHA1 OU SHA256 sur les headers `webhooks_signature` / `x-sellsy-signature`
- Ignore le payload et **re-fetch la donnée canonique depuis l'API v2** (puis upsert)
- Routing par `relatedtype` : item / client / prospect / people / document
- Subtype document : estimate / order / invoice (déduit de `data.object.type`)

**Bypass debug** : variable `SELLSY_WEBHOOK_STRICT=false` permet d'accepter sans signature pour le 1er paramétrage.

**Le webhook NE remplace PAS le cron** — les crons sont conservés comme filet de sécurité (recovery si un webhook est manqué).

### Sync catalogue — TIME_BUDGET (correctif 7 mai 2026)
- `src/app/api/sellsy/sync-catalogue/route.ts` : `TIME_BUDGET_MS = 12 * 60 * 1000` (avant : 4.5 min, héritage Hobby).
- Symptôme avant fix : déclinaisons (1700+) bloquées au 2026-04-15. Le loop coupait avant d'attaquer les déclinaisons après l'upsert des items.
- Mode **oldest-first** — chaque cron progresse sur les déclinaisons les plus anciennes en stock. Aucune perte si un run est partiel.

### Fichiers nouveaux importants (mai 2026)
- `src/lib/reporting-filter.ts` — helper centralisé pour le filtre Laurence
- `src/app/api/admin/deep-sync-sellsy/route.ts` — sync historique BDC + Devis
- `src/app/api/admin/refresh-etat-produit/route.ts` — backfill `etatProduit` + `statutSellsy` + `surMesure`
- `src/app/api/commercial/etat-stock-stats/route.ts` — breakdown En stock/Sur commande pour dashboard
- `src/app/api/webhooks/sellsy/route.ts` — webhook Sellsy v1 temps réel
- `src/app/dashboard/page.tsx` — redirect legacy `/dashboard` → `/marketing`

### Modèles supprimés (avril–mai 2026, ne pas tenter de réintroduire)
- Stock ABC, Alertes stock, Arrivages (`Arrivage`, `LigneArrivage`, `BdcArrivage`)
- Prévisionnel achat/commercial
- Nos Réseaux (Instagram feed)
- Automatisations / Workflows (`Workflow`, `WorkflowExecution`, `EmailTemplate`)
- Veille concurrentielle (entièrement)
- `META_APP_ID` / `META_APP_SECRET` (env vars Vercel à supprimer aussi)
- **Cleanup 9 mai 2026** : `ClickEvent`, `EmailCampaign`, `EmailLog`, `SmsLog`, `AuditLog`, `PrixBackup`, `SessionTarif` (migration `drop_dead_models_may_2026`). Enums `EmailStatut`, `CampagneEmailStatut`.

### Cleanup massif — 9 mai 2026 (v30)
**Score** : -60 fichiers, -68 000 lignes, +1 helper centralisé, +1 champ Devis.

#### Routes API supprimées (orphelines / debug)
- `/api/sms` (jamais branché), `/api/cron/scoring-alerts` (pas dans vercel.json)
- `/api/webhooks/glide`, `/api/webhooks/newsletter` (legacy Glideapps)
- `/api/contacts/import-legacy` (migration faite), `/api/leads/import` (pas d'UI)
- `/api/demandes/estimate-all`, `/api/demandes/[id]/match-sellsy`
- `/api/sellsy/liaison`, `/api/sellsy/orders-by-customfield` (remplacés)
- `/api/sav/sync-sellsy/probe`, `/api/sellsy/debug-stock`, `/api/sellsy/items/debug-price`, `/api/marketing/brevo/debug`
- `/api/emailing` (UI emailing utilise Brevo directement)
- `src/workers/` (5 workers BullMQ, pas de Redis)
- `src/lib/queue.ts`, `src/lib/twilio.ts`, `src/lib/attribution.ts`, `src/lib/calcul-prix-achat.ts`, `src/lib/empty-messages.ts`, `src/lib/sync-utils.ts`

#### Composants/hooks orphelins supprimés
- `components/ui/empty-state`, `error-state`
- `components/chat/chatbot-widget`
- `components/leads/lead-{table,form,pipeline}`
- `components/contacts/contact-{drawer,preview-drawer}`
- `components/dashboard/{leads-chart,conversion-funnel}`
- `components/common/{source-badge,sla-badge,date-relative}`
- `hooks/use-{active-space,dashboard}`
- `data/contacts.ts`, `data/contact-details.ts`, `data/contact-data.json` (legacy Glide, 65k lignes)

#### Sécurité fix
- `/api/admin/dashboard-stats` : check ADMIN/DIRECTION ajouté (KPIs RH étaient visibles à tout user loggé)
- `/api/admin/test-email-conge` : désactivé en production sauf flag `ALLOW_TEST_EMAILS=true`
- `SELLSY_WEBHOOK_STRICT` : valeur prod attendue `true` (à vérifier sur Vercel)

#### Factorisation `getAmount` → `src/lib/sellsy-amounts.ts`
- 5 implémentations divergentes (commercial/page, expiring-quotes, contacts/[id], 2× tracabilite) remplacées par `getAmountHT(row)` / `getAmountHTFromAmounts(amounts)` / `getAmountTTC(row)`
- Convention KOKPIT : **tout en HT**, fallback TTC seulement si HT absent
- Bug fix bonus : `contacts/[id]/page.tsx` qui prenait TTC en priorité (`total ?? total_excl_tax`) → maintenant HT

#### Nouveau champ `Devis.dateDevisSellsy DateTime?`
- Migration `add_date_devis_sellsy` appliquée
- `deep-sync-sellsy` le populate depuis `est.date` Sellsy
- `/api/commercial/etat-stock-stats` priorise `dateDevisSellsy > dateEnvoi > createdAt`
- ⚠️ **Backfill historique à lancer** : `curl POST /api/admin/deep-sync-sellsy?since=2019-01-01&type=estimates&withEtat=false` année par année (re-passer pour remplir le nouveau champ)

#### Docs racine archivées dans `docs/archive/`
- `BRIEFING-KOKPIT.md`, `BRIEF_SESSION_17_MARS_2026.md`, `RAPPORT_AUDIT_12/14_MARS_2026.md`, `DEPLOY-NOW.md`, `README-DEPLOYMENT.md`, `plan.md`, `Rapport_KOKPIT_Mars2026.docx`
- Supprimés : `deploy.sh`, `quick-deploy.sh`, `docker-compose.yml` (Vercel auto-deploy), `kokpit-archive-planning.tar.gz`
- Scripts one-shots déjà appliqués : `debug-sellsy-efws283.ts`, `seed-planning-mars.ts`, `seed-conges-2026.ts`

### Fichiers à connaître absolument
- `src/lib/attribution-tunnel.ts` — `recomputeLeadAttribution(leadId)` règle stricte 7j/30j, **utilise `LiaisonDevisCommande`** (page Traçabilité) pour matcher BDC → devis → demande.
- `src/lib/feries.ts` — jours fériés Réunion (Pâques mobile + 20/12 abolition esclavage)
- `src/data/cafe-planning.ts` — `getResponsableCafe()` source unique du tour de café
- `src/lib/news-config.ts` — items statiques banderole (Teck Days, container)

### Modèles avec relations critiques (avant migration)
- `Lead` ⇄ `AttributionDevis[]` ⇄ `AttributionBDC[]` (cascade onDelete)
- `Vente.contactId` est NOT NULL → toute import sans contact KOKPIT crée un placeholder
- `CatalogueStat` est mappé `@@map("catalogue_stat")` (snake_case obligatoire en DB)

---

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
- Le hub central qui agrège Sellsy + Brevo + Meta Ads + Planning
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
| ADMIN | Administration · Commercial · Marketing · Achat · Général |
| DIRECTION | Administration · Commercial · Marketing · Achat · Général |
| COMMERCIAL | Commercial · Général · Congés · Pointage |
| MARKETING | Marketing · Général · Congés · Pointage |
| ACHAT | Need Price · Calculateur · SAV · Catalogue · Commandes (Trello) · Général · Congés · Pointage |

Granularité fine : matrice `User.moduleAccessOverrides` (JSON `{moduleId: boolean}`) pour overrider module par module. Voir section 3.

---

## 5. INTÉGRATIONS EXTERNES

| Service | Usage | Clé d'env | API Route |
|---------|-------|-----------|-----------|
| Sellsy V2 | Contacts, devis, commandes, catalogue, funnel, tâches | `SELLSY_CLIENT_ID` / `SELLSY_CLIENT_SECRET` | `/api/sellsy/` |
| Sellsy V1 | parentid chaîne documentaire (Bearer V2, scope "API V1" à activer dans Sellsy) | Mêmes credentials | `sellsyV1Call()` |
| Brevo | Stats email + sync listes + webhooks signaux engagement (plan **Starter** — pas d'export webhook) | `BREVO_API_KEY` | `/api/brevo/` |
| Meta Ads | Campagnes publicité (sync) | `META_ACCESS_TOKEN` + `META_ACCESS_TOKEN_EXPIRES_AT` | `/api/meta/` |
| Supabase | Storage Upload images couverture Planning | `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` | — |
| Brevo Club Tectona | 6 listes auto-créées par nom (pas d'env vars) | `findOrCreateList()` dans club-sync.ts | `/api/club/` |
| Sellsy Bois d'Orient | Extraction données enseigne fermée (contacts + factures + commandes + devis + PDFs) | `SELLSY_BDO_CLIENT_ID` / `SELLSY_BDO_CLIENT_SECRET` | `/api/admin/bois-dorient/` |
| Supabase Storage BDO | PDFs documents Bois d'Orient | Bucket `bois-dorient-docs` | — |

**Règle cache parentid** : appeler V1 une seule fois par document → stocker en LiaisonDocumentaire → ne plus jamais rappeler V1 pour ce document. Cache API route 30 min.

---

## 6. ARCHITECTURE NAVIGATION

**Menu unique sidebar** (voir section 3) — plus de topbar avec onglets espaces. La sidebar liste 5 catégories collapsibles filtrées par les permissions de l'utilisateur (`User.moduleAccessOverrides` + rôle).

```
┌────────────┬───────────────────────────────────────────────────────────┐
│ [K] KOKPIT │ 📰 Banderole actus (café, CA mois, plus grosse commande…) │
├────────────┼───────────────────────────────────────────────────────────┤
│ COMMERCIAL │                                                           │
│ · Dashboard│           Contenu de la page                              │
│ · Demandes │                                                           │
│ · Contacts │                                                           │
│ · …        │                                                           │
│ MARKETING  │                                                           │
│ · …        │                                                           │
│ [👤 User]  │                                                           │
└────────────┴───────────────────────────────────────────────────────────┘
```

Fichiers : `src/components/layout/sidebar.tsx` · `src/lib/nav-config.ts` · `src/app/(app)/layout.tsx` · `src/components/layout/news-ticker.tsx`

### Pages principales par espace

**Commercial** (`/commercial/`)
- `page.tsx` — Dashboard : 4 KPI cards HT (Devis · Commandes · Conversion · ConversionTime) avec breakdown En stock/Sur commande · filtre période (today/week/month/month_prev/year) · table Performance commerciaux · ExpiringQuotes · graphique évolution
- `tracabilite/page.tsx` — Liaisons devis ↔ BDC + chaîne documentaire V1
- `catalogue/page.tsx` — Catalogue produits + fiche de prélèvement
- `commandes/page.tsx` · `pipeline/page.tsx` · `sav/page.tsx` · `bois-dorient/page.tsx` · `taches/page.tsx`

**Marketing** (`/marketing/`)
- `page.tsx` — Tunnel marketing (KPI conversion + ROAS via AttributionDevis/AttributionBDC)
- `roi/page.tsx` — ROI multi-canal (Meta API + Google Ads API + CoutMarketing) + CA Sellsy filtré
- `operations/page.tsx` — Opérations marketing
- `club/page.tsx` — Club Tectona (voir section 18)

**Achat** (`/achat/`)
- `need-price/page.tsx` — Demandes de prix sur-mesure (Elaury)
- `calculateur/page.tsx` — Calculateur prix IDR → EUR
- `trello/page.tsx` — Suivi commandes (lecture seule)

**Administration** (`/administration/`)
- `page.tsx` — KPIs RH (effectif, congés en attente, pointage du jour) — ADMIN/DIRECTION uniquement
- `collaborateurs/page.tsx` · `conges/page.tsx` · `pointage/page.tsx` · `pointage/equipe/page.tsx` · `parametres/page.tsx`

**Général** (transverse)
- `/leads` · `/contacts` · `/campagnes` · `/emailing` · `/planning` · `/messagerie` · `/docs` · `/liens-utiles` · `/login`

**Renommage `/dashboard` → `/marketing`** (mai 2026, v28) : redirect legacy via `src/app/dashboard/page.tsx`.

---

## 7. ÉTAT DU PROJET

### 🚀 Sprints récents (mai 2026)

| Sprint | Détails | Statut |
|---|---|---|
| **v32 — Module Sur-Mesure** | `/commercial/sur-mesure` remplace Trello. ProjetSurMesure (SM-2026-XXXX) + pipeline kanban 9 statuts + 6 onglets (demande dessin, plans 3D, Need Price→Elaury, Sellsy lecture seule, RDV, commentaires). Notifs Michelle+Laurent+propriétaire. Endpoint /api/upload générique. 3 modèles Prisma + migration | ✅ 21 mai |
| **v31 — Daily Briefing `/aujourd-hui`** | Page matinale Bernard/Daniella (4 cards : leads brûlants/devis expirants/mood mensuel/tâches jour). Endpoint unique cache 5min, accès via `User.dailyBriefingEligible`, toggle agrégé pour ADMIN/DIRECTION/MARKETING. Page admin dédiée `/administration/daily-briefing` | ✅ 13 mai |
| **v30 — Cleanup massif** | -60 fichiers (routes mortes, composants orphelins, 7 modèles Prisma droppés), refacto `getAmount`, sécurité dashboard-stats, doc archivée | ✅ 9 mai |
| **v29 — Dashboard commercial HT** | Tous montants en HT, filtre "Mois dernier", breakdown En stock/Sur commande, fix ConversionTime cross-période | ✅ 9 mai |
| **v28 — Reconstruction DB historique** | Deep-sync BDC + Devis depuis 2019 (2 813 BDC + 7 071 Devis), `/dashboard` → `/marketing` | ✅ 8 mai |
| **v27 — Webhook Sellsy v1** | Endpoint temps réel item/order/estimate/contact, SLA relances auto désactivées | ✅ 7 mai |
| **v26 — Vercel Pro + filtre Laurence** | `maxDuration=800s`, helper `reporting-filter.ts`, backfill `etatProduit` + `statutSellsy` quotidien | ✅ 7 mai |

Pour l'**historique complet des features** (janvier → avril 2026 : Club Tectona, BDO, SAV, Pointage, Catalogue V2, Calendly, ROI Marketing, RFM, etc.), voir [`docs/archive/historique-features.md`](docs/archive/historique-features.md).

### ✅ Modules en production (résumé)

**Commercial** : Dashboard HT + breakdown stock · Demandes · Contacts · Catalogue (catalogue + fiche prélèvement + codes-barres) · Traçabilité · Pipeline · Commandes · SAV · Bois d'Orient · Rendez-vous Calendly · Tâches collaboratives

**Marketing** : Tunnel + AttributionDevis/BDC · ROI multi-canal (Meta + Google + manuel) · Campagnes · Emailing Brevo · Planning Kanban+Calendrier · Club Tectona · Liens utiles

**Achat** : Need Price · Calculateur prix Elaury · Suivi commandes Trello (lecture seule)

**Administration** : Dashboard RH · Collaborateurs · Congés · Pointage (employé + équipe + délégation Michelle→Georget) · Paramètres

**Général** : Messagerie temps réel (canaux + DM + non-lus) · Banderole actus auto (café, CA, plus grosse commande) · Notifications cloche · Docs · Reset password par email

**Intégrations** : Sellsy v2+v1 (Bearer unique) · Brevo transactionnel + listes · Meta Ads API · Google Ads API · Calendly webhook · Météo Open-Meteo · webhook dimexoi.fr (guide SDB + Meta leads natifs)

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

### Volumétrie actuelle (9 mai 2026)
- **7 835 contacts** (Sellsy + Glide importé + placeholders walk-in)
- **7 071 Devis** (historique 2019→2026 reconstruit via deep-sync)
- **2 813 BDC** (Vente) — **4 005 720 € CA** brut historique
- **138 Leads** actifs / récents
- **1 818 membres Club Tectona**
- **10 utilisateurs KOKPIT**

### Modèles métier

- **User** — collaborateurs DIMEXOI (rôles : ADMIN, MARKETING, COMMERCIAL, DIRECTION, ACHAT). Champs : `pointageActif`, `pointageDelegueId`, `soldeHeures`, `moduleAccessOverrides` (JSON granulaire), `dailyBriefingEligible` (flag accès `/aujourd-hui`).
- **Showroom** — `nom`, `adresse`, `emailNotif`, `objectifMensuelHT Float?` (objectif CA HT mensuel, utilisé par le mood Daily Briefing).
- **Contact** — `email` unique, `sellsyContactId` (CSV pour multi-IDs Sellsy individuals/companies), `lifecycleStage`, `showroomId`, RGPD/consentements, scoring (calculé à la volée — `scoreRfm`/`recence`/`frequence`/`montant` stockés pour Last Click historique seulement)
- **Devis** — champs Sellsy : `sellsyQuoteId` unique, `numero`, `statut` (mappé KOKPIT), `statutSellsy` (brut), `etatProduit` (custom field), `surMesure` (custom field), `dateDevisSellsy` (date Sellsy ≠ Prisma createdAt), `dateEnvoi`, `dateRelance`
- **Vente** — BDC Sellsy : `sellsyInvoiceId` unique, `numero`, `montant` HT, `dateVente`, `statutSellsy`, `etatProduit`, `surMesure`, `produits` JSON
- **DemandePrix** — demandes de prix (formulaire site web)
- **PostPlanning** — cartes Kanban + `scheduledDate` (calendrier mensuel) + 7 labels Contenu (AVIS_CLIENTS, FIDELISATION, TEASING_AVRIL, VIDEO_REEL, BLOG_SEO, EMAIL_BREVO, STORY)
- **PlanningChecklist** — items checklist
- **LiaisonDevisCommande** — liaisons devis↔commande
- **LiaisonDocumentaire** — chaîne documentaire parentid V1 ✅
- **AttributionDevis** + **AttributionBDC** — règle stricte 7j/30j (tunnel marketing)
- **Lead** — leads avec `slaDeadline` (48h, relances auto désactivées mai 2026), `statut` (NOUVEAU/EN_COURS/DEVIS/VENTE/PERDU), `commercialId`
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

### Modèles Sellsy cache

- **SellsyItemCache** — items catalogue Sellsy v2 (2 522 items synchronisés)
- **SellsyDeclinationCache** — déclinaisons (~2 580, sync lundi+jeudi)
- **SellsyCatalogueSync** — log des syncs catalogue
- **StockCache** — cache stock partagé Vercel (TTL 30 min, fallback in-memory)

### Modèles supprimés (cleanup mai 2026)

Voir section "Cleanup massif" en haut du fichier : `ClickEvent`, `EmailCampaign`, `EmailLog`, `SmsLog`, `AuditLog`, `PrixBackup`, `SessionTarif`, enums `EmailStatut` / `CampagneEmailStatut`. Plus anciennement (mars 2026) : `Workflow*`, `EmailTemplate`, `Arrivage*`, modèles veille concurrentielle.

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

---

## 10. VARIABLES D'ENVIRONNEMENT

| Variable | Statut | Usage |
|----------|--------|-------|
| **Auth / DB** | | |
| `DATABASE_URL` | ✅ Vercel | Connexion Supabase Postgres |
| `NEXTAUTH_SECRET` | ✅ Vercel | NextAuth.js |
| `NEXTAUTH_URL` | ✅ Vercel | NextAuth.js |
| **Supabase** | | |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Vercel | Storage Planning + Bois d'Orient |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Vercel | Storage Planning |
| **Sellsy** | | |
| `SELLSY_CLIENT_ID` / `SELLSY_CLIENT_SECRET` | ✅ Vercel | API v2 + v1 |
| `SELLSY_ACCESS_TOKEN` | ✅ Vercel | Token Sellsy (Club Sync fallback) |
| `SELLSY_WEBHOOK_SECRET` | ⚠️ À vérifier prod | Signature HMAC webhook Sellsy v1 |
| `SELLSY_WEBHOOK_STRICT` | ✅ Vercel | Doit valoir `true` en prod (`false` = bypass signature, debug uniquement) |
| `SELLSY_BDO_CLIENT_ID` / `SELLSY_BDO_CLIENT_SECRET` | ✅ .env.local | Migration Bois d'Orient |
| **Brevo** | | |
| `BREVO_API_KEY` | ✅ Vercel | Tous les `sendEmail()` passent par Brevo (Resend abandonné) |
| `BREVO_SENDER_EMAIL` | ✅ Vercel | Expéditeur transactionnel (default `laurence.payet@dimexoi.fr`) |
| `BREVO_GUIDE_SDB_TEMPLATE_ID` | ✅ Vercel | Template guide SDB (ID 19) — désactivé sans cette var |
| `BREVO_WEBHOOK_SECRET` | ⚠️ À créer (plan Pro) | Authentification webhooks Brevo (X5) |
| **Meta Ads + Google Ads** | | |
| `META_ACCESS_TOKEN` | ✅ Vercel | Meta Ads (ROI Marketing) |
| `META_ACCESS_TOKEN_EXPIRES_AT` | ⚠️ À ajouter | Alerte expiration token |
| `META_WEBHOOK_VERIFY_TOKEN` | ⚠️ Vercel site dimexoi-site | Webhook Meta Ads leads |
| `GOOGLE_ADS_DEVELOPER_TOKEN` | ⚠️ À configurer | Token développeur (obligatoire) |
| `GOOGLE_ADS_CUSTOMER_ID` | ⚠️ À configurer | ID client (sans tirets) |
| `GOOGLE_ADS_REFRESH_TOKEN` / `_CLIENT_ID` / `_CLIENT_SECRET` | ⚠️ À configurer | OAuth2 |
| **Webhooks site dimexoi.fr** | | |
| `CALENDLY_WEBHOOK_SIGNING_KEY` | ⚠️ Vercel site dimexoi-site | Signing key depuis Calendly > Webhooks |
| **Crons** | | |
| `CRON_API_SECRET` | ✅ Vercel | Bearer token pour endpoints admin (deep-sync, refresh-etat-produit, test-email-conge) |
| **Flags** | | |
| `ALLOW_TEST_EMAILS` | ⚠️ false en prod | Si `true`, autorise `/api/admin/test-email-conge` en production |
| ~~`ANTHROPIC_API_KEY`~~ | ❌ Retiré mai 2026 | Chatbot supprimé |
| ~~`RESEND_API_KEY`~~ | ❌ Non configuré | Resend abandonné, Brevo gère tout |
| ~~`BREVO_CLUB_LIST_ID_1-5`~~ | ❌ Non utilisées | Listes Club auto-créées par nom |

**Action requise (rappel)** : scope "API V1" activé dans Sellsy > Paramètres > Portail développeur > API V2 (nécessaire pour chaîne documentaire C3bis + stock V1).

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

> ⚠️ **Stand-by** — Bloqué par le plan Brevo Starter (l'export webhook nécessite Plan Professional+).

**Niveau 1** ✅ EN PROD — stats campagnes + sync 4 segments fixes Sellsy→Brevo + listes Club Tectona auto-créées.
**Niveau 2** ✅ EN PROD — listes Brevo créées dynamiquement depuis KOKPIT (`findOrCreateList`).
**Niveau 3** ❌ Bloqué — webhook Brevo→KOKPIT nécessite plan Professional+.
**Niveau 4** ❌ Bloqué — idem.

Le webhook receveur `/api/marketing/brevo/webhook` est codé (signal `opened/clicked/unsubscribed/soft_bounce`) mais inerte tant que Brevo n'envoie rien.

---

## 15. SPECS — ROI MARKETING RÉEL (X8) ✅ DÉPLOYÉ

Page `/marketing/roi` en prod (commit `563889b`, enrichi `c7272c5`).

**Problème initial** : 30 000€ Meta en 2025 sans CAC réel — coûts Salon + agence nulle part.

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

## 16. SPECS — SEGMENTATION RFM (X9) ✅ DÉPLOYÉ

Commit `c969e95` — 5 segments calculés à la volée + export listes Brevo.

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

## 🗺️ PROCHAINS SPRINTS

| ID | Feature | Pourquoi | Effort est. |
|----|---------|----------|------------|
| ~~X1~~ | ~~Log d'activité contacts~~ | ✅ | Timeline filtrable (EMAIL/VISITE_WEB/APPEL/NOTE/RELANCE) + auto-log EMAIL_ENVOYE et VISITE_WEB |
| ~~X2~~ | ~~Tâches avec rappels~~ | ✅ | Modèle Tache + page /commercial/taches + tâches auto (congés→Michelle, SLA→commercial) + collaboration (invitation accepter/refuser) |
| ~~X3~~ | ~~Recherche globale topbar~~ | ✅ | Contacts + devis + commandes en parallèle — déjà implémenté |
| ~~X4~~ | ~~Priorité contact~~ | ✅ Déployé `ddf18ac` — 4 niveaux | — |
| X5 | Brevo enrichi | Stand-by — plan Starter ne supporte pas export webhook. Listes dynamiques possibles mais webhooks limités | 2j |
| ~~X6~~ | ~~Notifications internes~~ | ✅ | Bell topbar + API 5 types (token Meta, devis expirant, Brevo sync, tâches retard, SLA 72h) — déjà implémenté |
| ~~X7~~ | ~~Dashboards avec courbes~~ | ✅ | Recharts LineChart + ComposedChart + BarChart — évolution devis/commandes, leads par source — déjà implémenté |
| ~~X8~~ | ~~ROI Marketing réel~~ | ✅ | Modèle CoutMarketing + page /marketing/roi (KPIs, tableau mensuel, répartition par canal, ajout dépenses) — `563889b` |
| ~~X9~~ | ~~Segmentation RFM~~ | ✅ | 5 segments (Champions, Loyaux, Nouveaux, À risque, Perdus) + export listes Brevo — `c969e95` |
| ~~X11~~ | ~~Responsive mobile~~ | ✅ | Toutes les pages principales ont des classes responsive Tailwind |
| ~~BDO~~ | ~~Migration Bois d'Orient~~ | ✅ | Page + 7 routes API + extraction + matching + documents |
| ~~X10~~ | ~~SLA 72h leads + relance commercial~~ | ✅ | SLA + bouton relance email + tâche auto commercial |
| ~~ADM1~~ | ~~Espace Administration~~ | ✅ | Paramètres (SLA, pointage, rôles) + Pointage + Congés + Collaborateurs — `484e24d` |
| ACH-PLANS | Module 3 Achat — Plans PDF + OneDrive | Upload PDF → Supabase → transfert OneDrive via Microsoft Graph API. Bloqué : clés Microsoft à fournir | 1.5j |
| F1 | Création devis KOKPIT → Sellsy | KOKPIT écrit dans Sellsy via API | À spécifier |
| E1 | Espace client externe | Site séparé connecté à KOKPIT — suivi de commande | À spécifier |

---

## 18. CLUB TECTONA — PROGRAMME DE FIDÉLITÉ ✅ DÉPLOYÉ

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

*KOKPIT.md — feuille de route DIMEXOI — v32 — 21 mai 2026*
