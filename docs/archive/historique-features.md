# Historique des features KOKPIT (archive mars → avril 2026)

> Tableau historique des features livrées entre janvier et avril 2026. Conservé pour traçabilité, mais ne sert plus à la session courante.
> Pour l'état actuel, voir `KOKPIT.md` (section "ÉTAT ACTUEL" en haut).

## Features livrées (mars → avril 2026)

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

