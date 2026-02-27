# 🚀 KÒKPIT - Déploiement Vercel - MAINTENANT!

Tout est prêt! Voici exactement quoi faire.

## ✅ Ce qui a été fait:

- ✓ Correction du bug TypeScript dans `contacts/[id]/page.tsx`
- ✓ Tous les fichiers sont committés et prêts
- ✓ Scripts de déploiement créés
- ✓ Documentation complète prête

## 🎯 Déploiement en 3 étapes:

### Étape 1: Exécutez le script de déploiement (2-3 minutes)

Ouvrez votre Terminal Mac et exécutez:

```bash
cd /Users/laurencepayet/Library/CloudStorage/OneDrive-ALDAM/KÒKPIT/app
bash quick-deploy.sh
```

Ce script va:
- 🔴 Arrêter le processus sur le port 3000
- 📦 Installer les dépendances
- 🔨 Faire la construction Next.js (build)
- 📝 Sauvegarder les changements dans Git

### Étape 2: Déployer sur Vercel (1-2 minutes)

Après que le script se termine, exécutez:

```bash
npx vercel --prod
```

Ou si c'est votre première fois avec Vercel CLI:

```bash
npx vercel
```

### Étape 3: Configurer les variables d'environnement (2 minutes)

Le déploiement va créer une URL comme: `https://kokpit-xxxxx.vercel.app`

1. Allez sur: https://vercel.com/dashboard
2. Ouvrez le projet "kokpit"
3. Allez à: Settings → Environment Variables
4. Ajoutez ces variables:

```
DATABASE_URL=<votre postgresql url>
REDIS_URL=<votre redis url optionnel>
NEXTAUTH_SECRET=<générez avec: openssl rand -base64 32>
NEXTAUTH_URL=https://kokpit-xxxxx.vercel.app
GLIDE_WEBHOOK_SECRET=<un string aléatoire>
META_ACCESS_TOKEN=<optionnel, ajoutez plus tard>
```

5. Après les ajouter, Vercel va automatiquement redéployer

## 🔍 Vérification

Une fois déployé, testez:

```
https://your-url.vercel.app          → Doit charger l'app
https://your-url.vercel.app/api/contacts → Doit retourner les contacts (ou [] si pas de BD)
```

## ⚙️ Prochaines étapes (après déploiement):

1. **Configurer Glideapps webhook:**
   - URL: `https://your-url.vercel.app/api/webhooks/glide`
   - Secret: Utilisez le `GLIDE_WEBHOOK_SECRET` configuré

2. **Configurer Meta integration:**
   - Vérifiez que `META_ACCESS_TOKEN` est dans les variables d'environnement
   - La page `/campagnes` va charger les vraies données

3. **Base de données:**
   - Migrez vos données: `npx prisma migrate deploy`
   - Importez les Excel: `npm run db:import-glide`

## 🐛 En cas de problème:

**Si le déploiement échoue:**
- Lire les logs Vercel dashboard
- S'assurer que `DATABASE_URL` est correcte
- Vérifier qu'aucune variable n'est manquante

**Si la page affiche des erreurs:**
- Vérifier `NEXTAUTH_SECRET` est configuré
- Vérifier `DATABASE_URL` est accessible depuis Vercel
- Regarder les logs Vercel en temps réel: `vercel logs`

**Si vous avez besoin d'aide:**
- Docs complète: `docs/VERCEL-DEPLOYMENT.md`
- Checklist: `docs/PRE-DEPLOYMENT-CHECKLIST.md`

---

## 🎉 C'est tout!

Exécutez `bash quick-deploy.sh` maintenant et vous aurez KÒKPIT en live dans quelques minutes!

```bash
cd /Users/laurencepayet/Library/CloudStorage/OneDrive-ALDAM/KÒKPIT/app && bash quick-deploy.sh
```
