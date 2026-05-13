# KÒKPIT - Guide Rapide de Déploiement

## 🎯 Statut Actuel

✅ **Tous les problèmes sont résolus!**

- ✓ Bug TypeScript corrigé
- ✓ Code prêt pour production
- ✓ Scripts de déploiement créés
- ✓ Documentation complète

## 🚀 Déployer Maintenant (4 commandes!)

### Sur votre Mac, dans le Terminal:

```bash
# 1. Allez au dossier du projet
cd /Users/laurencepayet/Library/CloudStorage/OneDrive-ALDAM/KÒKPIT/app

# 2. Exécutez le script de déploiement (2-3 minutes)
bash quick-deploy.sh

# 3. Après que le script finit, exécutez Vercel
npx vercel --prod

# 4. Ajoutez les variables d'environnement dans le dashboard Vercel
# (voir ci-dessous)
```

## 🔧 Variables d'Environnement à Configurer

Après le déploiement, allez à: **https://vercel.com/dashboard**

1. Ouvrez le projet "kokpit"
2. Allez à **Settings → Environment Variables**
3. Cliquez **Add New**
4. Ajoutez ces variables:

| Variable | Valeur | Optionnel |
|----------|--------|-----------|
| `DATABASE_URL` | `postgresql://user:pass@host/db` | ❌ Requis |
| `REDIS_URL` | `redis://host:port` | ✅ Optionnel |
| `NEXTAUTH_SECRET` | Générez avec: `openssl rand -base64 32` | ❌ Requis |
| `NEXTAUTH_URL` | `https://kokpit-xxxxx.vercel.app` | ❌ Requis |
| `GLIDE_WEBHOOK_SECRET` | Chaîne aléatoire (utilisez pour Glide) | ❌ Requis |
| `META_ACCESS_TOKEN` | Votre token Meta API | ✅ Optionnel |

## ✅ Après le Déploiement

### 1. Vérifier que tout fonctionne

```bash
# Tester l'API
curl https://your-vercel-url.vercel.app/api/contacts

# Voir les logs en temps réel
vercel logs
```

### 2. Configurer Glideapps Webhook

- URL: `https://your-vercel-url.vercel.app/api/webhooks/glide`
- Secret: Utilisez le `GLIDE_WEBHOOK_SECRET` configuré ci-dessus

### 3. Meta Campaigns

Une fois que `META_ACCESS_TOKEN` est dans les variables d'environnement:
- La page `/campagnes` affichera vos vraies campagnes Facebook/Instagram
- Les données se synchroniseront automatiquement

## 📊 Qu'est-ce qui a été Déployé

### Pages
- `/contacts` - Gestion des contacts avec drawer de détails
- `/campagnes` - Synchronisation Facebook/Instagram
- Tableau de bord complet avec authentification

### API
- `GET/POST /api/contacts` - Gestion des contacts
- `GET/PUT/DELETE /api/contacts/[id]` - Détails des contacts
- `POST /api/webhooks/glide` - Réception des demandes Glide
- `GET /api/meta/campaigns` - Récupération des campagnes

### Base de Données
- Schema Prisma avec Contact, DemandePrix models
- Support des consentements (offre, newsletter, invitation, devis)

## 🐛 Dépannage

### "Build failed"
→ Vérifier les logs Vercel, s'assurer qu'aucune variable d'environnement ne manque

### "Database connection error"
→ Vérifier que `DATABASE_URL` est correct et accessible de l'internet

### "Webhook not working"
→ Vérifier que `GLIDE_WEBHOOK_SECRET` est correctement configuré dans Glide ET dans Vercel

### "Meta campaigns not loading"
→ Ajouter `META_ACCESS_TOKEN` dans les variables d'environnement, redéployer

## 📚 Documentation Complète

Pour plus de détails:
- `DEPLOY-NOW.md` - Instructions détaillées
- `docs/VERCEL-DEPLOYMENT.md` - Guide complet Vercel
- `docs/GLIDEAPPS-SETUP.md` - Configuration Glide
- `docs/PRE-DEPLOYMENT-CHECKLIST.md` - Checklist pré-déploiement

---

## 🎉 C'est Prêt!

Votre application est **100% prête pour production**.

Exécutez simplement:
```bash
bash quick-deploy.sh && npx vercel --prod
```

Et KÒKPIT sera en direct dans quelques minutes! 🚀
