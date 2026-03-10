# Plan : Liaison Contacts KOKPIT ↔ Sellsy

## Objectif
Lier les contacts KOKPIT aux contacts Sellsy via `sellsyContactId` dans la base.

## Logique de matching

### 1. Liaison automatique par email (confirmée)
- Récupérer TOUS les contacts Sellsy (paginé, l'API retourne max 100 par appel)
- Comparer email KOKPIT ↔ email Sellsy (exact match, insensible à la casse)
- Match → écrire `sellsyContactId` en base automatiquement

### 2. Suggestions par nom + prénom + téléphone (à valider)
- Si pas de match email, chercher par : nom ET prénom ET téléphone
- Normalisation : accents, casse, espaces, format téléphone (+262/0262/0)
- Les 3 critères doivent matcher ensemble → suggestion "haute confiance"
- Stocker les suggestions en mémoire (pas en base), les afficher dans l'UI

## Fichiers à modifier/créer

### Backend

**1. `src/lib/sellsy.ts`** — Ajouter `listAllContacts()` qui pagine automatiquement tous les contacts Sellsy (boucle sur offset jusqu'à tout récupérer)

**2. `src/app/api/contacts/sellsy-sync/route.ts`** (NOUVEAU) — Route POST qui :
- Récupère tous les contacts Sellsy
- Récupère tous les contacts KOKPIT (id, email, nom, prenom, telephone, sellsyContactId)
- Phase 1 : Match email → UPDATE sellsyContactId en base
- Phase 2 : Match nom+prenom+tel → retourne les suggestions (sans écrire)
- Retourne : `{ linked: number, suggestions: [...], alreadyLinked: number }`

**3. `src/app/api/contacts/sellsy-sync/confirm/route.ts`** (NOUVEAU) — Route POST pour valider une suggestion :
- Body : `{ contactId, sellsyContactId }`
- Écrit le sellsyContactId en base
- Retourne le contact mis à jour

### Frontend

**4. `src/app/(app)/contacts/page.tsx`** — Ajouter :
- Bouton "Lier à Sellsy" dans le header (à côté de Import/Refresh/Nouveau)
- Modal/panneau qui s'ouvre avec :
  - Résumé : X liés automatiquement, Y suggestions à valider
  - Liste des suggestions avec nom KOKPIT ↔ nom Sellsy + boutons Valider/Ignorer
  - Barre de progression pendant la sync

## Contraintes
- Vercel Hobby 10s timeout → la sync doit être rapide ou paginée
- On ne modifie PAS les contacts Sellsy, on lit seulement
- On ne touche PAS aux DemandePrix ni aux Leads
