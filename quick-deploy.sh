#!/bin/bash

# Quick Deploy Script - Exécutez cette commande une fois sur votre Mac:
# cd /Users/laurencepayet/Library/CloudStorage/OneDrive-ALDAM/KÒKPIT/app && bash quick-deploy.sh

clear

echo "╔════════════════════════════════════════════════════════════╗"
echo "║           KÒKPIT - Déploiement Vercel Rapide              ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Kill port 3000
echo "🔴 Arrêt des processus sur le port 3000..."
lsof -ti :3000 | xargs kill -9 2>/dev/null || true
sleep 1
echo "✅ Port 3000 libéré"
echo ""

# Install & Build
echo "📦 Installation des dépendances..."
npm install --legacy-peer-deps
echo ""

echo "🔨 Construction du projet..."
npm run build
BUILD_STATUS=$?

if [ $BUILD_STATUS -ne 0 ]; then
  echo ""
  echo "❌ La construction a échoué!"
  exit 1
fi

echo ""
echo "✅ Construction réussie!"
echo ""

# Git commit
echo "📝 Sauvegarde des changements..."
git add -A
git diff-index --quiet HEAD -- || git commit -m "Fix: Next.js 15 TypeScript params compatibility

- Convert ContactDetailsPage to async Server Component
- Update params type to Promise<{ id: string }>
- Remove unnecessary useState import
- Ready for Vercel deployment"
echo ""

# Vercel deployment
echo "╔════════════════════════════════════════════════════════════╗"
echo "║              ÉTAPE SUIVANTE: DÉPLOIEMENT                   ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

echo "Tapez cette commande pour déployer:"
echo ""
echo "  npx vercel --prod"
echo ""
echo "Ou si c'est votre première fois:"
echo ""
echo "  npx vercel"
echo ""
echo "Lors du déploiement:"
echo "  ✓ Choisissez votre compte personnel"
echo "  ✓ Nommez le projet: kokpit"
echo "  ✓ Puis ajoutez les variables d'environnement dans le dashboard Vercel"
echo ""
echo "Variables à ajouter dans Vercel → Settings → Environment Variables:"
echo "  • DATABASE_URL"
echo "  • REDIS_URL (optionnel)"
echo "  • NEXTAUTH_SECRET"
echo "  • GLIDE_WEBHOOK_SECRET"
echo "  • META_ACCESS_TOKEN (optionnel)"
echo ""
echo "Prêt? Exécutez: npx vercel"
echo ""
