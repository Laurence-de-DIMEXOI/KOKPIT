# KÒKPIT Pre-Deployment Checklist

Complete these steps on your Mac before deploying to Vercel.

## Code & Repository

- [x] All features implemented (Contacts, Campaigns, Webhooks)
- [x] Code committed to main branch
- [x] TypeScript compiles without errors (verify on your Mac with `npm run build`)
- [x] Environment variables documented in `.env.example`
- [x] No secrets hardcoded in repository
- [x] `.gitignore` includes `.env`, `node_modules/`, `.next/`

## Database Setup

- [ ] PostgreSQL database accessible from internet (or use managed service like Railway/Vercel Postgres)
- [ ] Database URL format: `postgresql://user:password@host:port/dbname`
- [ ] Run migrations: `npx prisma migrate deploy`
- [ ] Verify database connection works: `npx prisma db push`
- [ ] Backup current database before first deploy

## Environment Variables to Prepare

Before deploying, gather these variables:

### Required
- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `REDIS_URL` - Redis connection string
- [ ] `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
- [ ] `GLIDE_WEBHOOK_SECRET` - Create a secure random string

### Meta Integration (Optional, can add later)
- [ ] `META_ACCESS_TOKEN` - Your Meta API token
- [ ] `META_AD_ACCOUNT_ID` - Your ad account ID (43383340)

### Third-Party Services (If Using)
- [ ] `RESEND_API_KEY` - For emails (if configured)
- [ ] `TWILIO_*` - For SMS (if configured)
- [ ] `SELLSY_*` - For Sellsy integration (if configured)

## Pre-Deployment Testing

Run these on your Mac to verify everything works:

```bash
# Clean install
rm -rf node_modules
npm install

# Type check
npm run build

# Test specific routes exist
ls src/app/api/contacts/
ls src/app/api/meta/
ls src/app/api/webhooks/glide/

# Verify Prisma schema
npx prisma generate
```

## Database & Infrastructure

Choose one of these options:

### Option A: Use Existing Database (Recommended if already set up)
- [ ] Ensure PostgreSQL is accessible from internet
- [ ] Database host is resolvable from Vercel servers
- [ ] Database user has proper permissions
- [ ] Connection pool configured (if needed)

### Option B: Migrate to Vercel Postgres (Easy, Integrated)
1. In Vercel dashboard, go to Storage → Create Database
2. Select "Postgres"
3. Connect to your project
4. Copy the connection string to `DATABASE_URL`
5. Run: `npx prisma migrate deploy`

### Option C: Use Third-Party Service (Railway, Neon, Supabase)
- Create account at service
- Create PostgreSQL database
- Copy connection string
- Use as `DATABASE_URL` in Vercel

## Vercel Account Setup

- [ ] Create Vercel account at https://vercel.com
- [ ] Link GitHub account to Vercel
- [ ] Verify repository is accessible

## Deployment Steps (On Your Mac)

1. **On Mac, verify build works:**
   ```bash
   npm run build
   npm start  # Test running locally
   ```

2. **Push to GitHub:**
   ```bash
   git push origin main
   ```

3. **In Vercel Dashboard:**
   - Import your KOKPIT repository
   - Configure build settings (should auto-detect Next.js)
   - Add all environment variables
   - Deploy

4. **After Deployment:**
   - Verify site loads: `https://your-vercel-url.vercel.app`
   - Test API: `https://your-vercel-url.vercel.app/api/contacts`
   - Update `NEXTAUTH_URL` with your actual URL
   - Redeploy to apply URL change

## Common Issues & Solutions

### Issue: "Build failed: Cannot find module"
- Solution: Run `npm install` on Mac, commit `package-lock.json`

### Issue: "Database connection failed"
- Solution: Verify DATABASE_URL in Vercel environment variables
- Add Vercel IP to database whitelist

### Issue: "Prisma Client not generated"
- Solution: Vercel auto-runs `prisma generate` in build
- Make sure `prisma/schema.prisma` is committed

### Issue: "NextAuth secret invalid"
- Solution: Generate new one: `openssl rand -base64 32`
- Update `NEXTAUTH_SECRET` in Vercel

## Post-Deployment

After successful deployment:

1. **Configure Webhooks:**
   - Glideapps: `https://your-url/api/webhooks/glide`
   - Update webhook secret in Glideapps settings

2. **Test Meta Integration:**
   - Add `META_ACCESS_TOKEN` to Vercel
   - Verify campaigns page loads real data
   - Check `/api/meta/campaigns` endpoint

3. **Enable Monitoring:**
   - Set up error tracking (Sentry, Vercel Analytics)
   - Monitor API response times
   - Watch for database connection issues

4. **Custom Domain (Optional):**
   - In Vercel project settings, add your domain
   - Update DNS records as instructed

## Resources

- Vercel Docs: https://vercel.com/docs
- Next.js Deployment: https://nextjs.org/docs/deployment
- Prisma & Vercel: https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel
