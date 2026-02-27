# Configuration du Webhook Glideapps → KÒKPIT

## Prérequis

- App Glideapps avec plan Business ou supérieur
- KÒKPIT accessible via une URL publique

---

## Étape 1 : Rendre KÒKPIT accessible

### Option A — Pour tester (ngrok)

```bash
# Installer ngrok (une seule fois)
brew install ngrok

# Lancer ton app
npm run dev

# Dans un autre terminal, exposer le port 3000
ngrok http 3000
```

ngrok te donnera une URL du type `https://abc123.ngrok-free.app`
→ Ton webhook sera : `https://abc123.ngrok-free.app/api/webhooks/glide`

### Option B — Production (Vercel)

```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel
```

→ Ton webhook sera : `https://kokpit.vercel.app/api/webhooks/glide`

---

## Étape 2 : Sécuriser le webhook

1. Génère un secret aléatoire :
   ```bash
   openssl rand -hex 32
   ```

2. Ajoute-le dans ton `.env` :
   ```
   GLIDE_WEBHOOK_SECRET=ton_secret_genere_ici
   ```

---

## Étape 3 : Configurer dans Glideapps

### 3.1 — Créer une action Webhook

1. Ouvre ton app dans **Glideapps**
2. Va dans **Data** → sélectionne la table **"Demande de prix"**
3. Va dans **Actions** (ou **Automations** selon ta version)
4. Clique **"+ New Action"** → **"Webhook"** (ou **"API Call"**)

### 3.2 — Configurer le trigger

- **Trigger** : "When a row is added" (quand une nouvelle ligne est ajoutée)
- **Table** : "Demande de prix"

### 3.3 — Configurer la requête HTTP

- **Method** : `POST`
- **URL** : `https://TON-DOMAINE/api/webhooks/glide`
- **Headers** :
  ```
  Content-Type: application/json
  X-Glide-Secret: TON_SECRET_ICI
  ```

### 3.4 — Configurer le body (JSON)

```json
{
  "Nom": {{Nom}},
  "Prénom": {{Prénom}},
  "Meuble": {{Meuble}},
  "Numéro de téléphone": {{Numéro de téléphone}},
  "Adresse e-mail": {{Adresse e-mail}},
  "Message": {{Message}},
  "🔒 Row ID": {{🔒 Row ID}},
  "Offre": {{Offre}},
  "Newsletter": {{Newsletter}},
  "Invitation": {{Invitation}},
  "Devis": {{Devis}},
  "Mode de paiement": {{Mode de paiement}},
  "Showroom": {{Showroom}},
  "DATE": {{DATE}}
}
```

> Les `{{...}}` sont les colonnes Glide. L'interface de Glide te proposera de mapper chaque champ.

### 3.5 — Tester

1. Clique **"Test"** dans l'interface Glide
2. Vérifie que tu reçois un `200 OK` avec :
   ```json
   {
     "success": true,
     "action": "created",
     "contactId": "...",
     "demandePrixId": "..."
   }
   ```

---

## Étape 4 : Vérifier dans KÒKPIT

Après chaque nouvelle demande dans Glide :
- Le contact est automatiquement créé ou mis à jour
- La demande de prix apparaît dans le drawer du contact
- Un événement est enregistré dans la timeline

---

## Alternative : Glide API (synchronisation bidirectionnelle)

Si tu veux aussi lire/modifier les données Glide depuis KÒKPIT :

1. Va dans **Settings** → **Integrations** → **API**
2. Active l'API et copie ton **API Token**
3. Ajoute dans `.env` :
   ```
   GLIDE_API_TOKEN=ton_token_ici
   GLIDE_APP_ID=ton_app_id_ici
   ```

L'API Glide permet de :
- Lister les lignes d'une table
- Ajouter/modifier/supprimer des lignes
- Synchroniser dans les deux sens

Documentation : https://docs.glideapps.com/

---

## Dépannage

| Problème | Solution |
|---|---|
| 401 Unauthorized | Vérifie que `X-Glide-Secret` correspond à `GLIDE_WEBHOOK_SECRET` dans `.env` |
| 500 Internal Error | Vérifie les logs serveur (`npm run dev` affiche les erreurs) |
| Webhook non déclenché | Vérifie que l'automation est activée dans Glide |
| Contact dupliqué | Normal : l'upsert se fait par email, pas de doublon possible |
