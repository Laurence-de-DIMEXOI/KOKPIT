#!/bin/bash

# KÒKPIT Deployment Script
# Exécutez ce script pour déployer KÒKPIT sur Vercel

set -e  # Exit on any error

echo "🚀 Déploiement de KÒKPIT sur Vercel"
echo "===================================="

# Step 1: Kill port 3000 if in use
echo "1️⃣  Vérification du port 3000..."
PID=$(lsof -ti:3000)
if [ ! -z "$PID" ]; then
  echo "   Arrêt du processus sur le port 3000 (PID: $PID)..."
  kill -9 $PID || true
  sleep 2
fi

# Step 2: Install dependencies
echo ""
echo "2️⃣  Installation des dépendances..."
npm install

# Step 3: Clean build artifacts
echo ""
echo "3️⃣  Nettoyage des artefacts de build précédents..."
rm -rf .next
rm -rf node_modules/.cache

# Step 4: Build project
echo ""
echo "4️⃣  Construction du projet (Next.js build)..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ La construction a échoué. Vérifiez les erreurs ci-dessus."
  exit 1
fi

echo "✅ Construction réussie!"

# Step 5: Commit changes
echo ""
echo "5️⃣  Préparation des changements pour Git..."
git add -A
if [ -n "$(git status --porcelain)" ]; then
  git commit -m "Fix: Update contacts page TypeScript types for Next.js 15 compatibility"
  echo "✅ Changements committés"
else
  echo "   Aucun changement à committer"
fi

# Step 6: Vercel deployment instructions
echo ""
echo "✨ Prêt pour le déploiement!"
echo "===================================="
echo ""
echo "🎯 Prochaines étapes:"
echo ""
echo "1️⃣  Installer Vercel CLI (si pas déjà installé):"
echo "   npm install -g vercel"
echo ""
echo "2️⃣  Déployer avec Vercel:"
echo "   npx vercel"
echo ""
echo "3️⃣  Lors du déploiement, répondez aux questions:"
echo "   - Which scope? → Votre compte personnel"
echo "   - Link to existing project? → Non (first time)"
echo "   - Project name? → kokpit"
echo "   - Directory? → ./ (or ./app)"
echo ""
echo "4️⃣  Vercel va vous demander les variables d'environnement."
echo "   Ajoutez dans le dashboard Vercel:"
echo "   - DATABASE_URL"
echo "   - REDIS_URL (si utilisé)"
echo "   - NEXTAUTH_SECRET"
echo "   - GLIDE_WEBHOOK_SECRET"
echo "   - META_ACCESS_TOKEN (optionnel)"
echo ""
echo "5️⃣  Après le déploiement, mettez à jour NEXTAUTH_URL:"
echo "   NEXTAUTH_URL=https://your-vercel-url.vercel.app"
echo ""
echo "📚 Pour plus de détails, consultez:"
echo "   docs/VERCEL-DEPLOYMENT.md"
echo ""
