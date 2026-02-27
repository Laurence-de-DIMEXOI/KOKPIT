# Deploying KÒKPIT to Vercel

This guide will walk you through deploying KÒKPIT to Vercel to get a public URL for webhooks and API integrations.

## Prerequisites

- GitHub account (already have repository)
- Vercel account (free at https://vercel.com)
- Node.js and npm installed on your Mac

## Step 1: Create a Vercel Account

1. Go to https://vercel.com
2. Click "Sign Up"
3. Use your GitHub account to sign up (easiest option)
4. Authorize Vercel to access your GitHub repositories

## Step 2: Connect Your GitHub Repository

1. After signing in to Vercel, go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select your KOKPIT repository from the list
4. Click "Import"

## Step 3: Configure Build Settings

Vercel should auto-detect your Next.js project. Verify these settings:

- **Framework Preset**: Next.js ✓
- **Root Directory**: `./` (or `app/` if needed)
- **Build Command**: `npm run build`
- **Install Command**: `npm install`
- **Output Directory**: `.next`

## Step 4: Add Environment Variables

Before deploying, configure all environment variables in Vercel:

1. In the Vercel project settings, go to **Settings → Environment Variables**
2. Add the following variables:

```
DATABASE_URL=postgresql://[your-db-connection-string]
REDIS_URL=redis://[your-redis-url]
NEXTAUTH_SECRET=generate-with: openssl rand -base64 32
NEXTAUTH_URL=https://[your-vercel-url].vercel.app
RESEND_API_KEY=[if-using-email]
TWILIO_ACCOUNT_SID=[if-using-sms]
TWILIO_AUTH_TOKEN=[if-using-sms]
TWILIO_PHONE_NUMBER=[if-using-sms]
SELLSY_CLIENT_ID=[your-sellsy-id]
SELLSY_CLIENT_SECRET=[your-sellsy-secret]
GLIDE_WEBHOOK_SECRET=[your-webhook-secret]
META_ACCESS_TOKEN=[your-meta-token]
```

### Important Notes:

- For `NEXTAUTH_URL`, replace with your actual Vercel deployment URL (you'll get this after first deploy)
- First deploy without all optional variables, then add them after deployment succeeds
- Your database and Redis should be accessible from the internet or configured for Vercel access

## Step 5: Deploy

1. Click **Deploy** in Vercel
2. Wait for the build to complete (usually 2-3 minutes)
3. Once successful, you'll see your public URL like: `https://kokpit-xxxxx.vercel.app`
4. Update `NEXTAUTH_URL` environment variable with this URL
5. Trigger a redeployment for the URL change to take effect

## Step 6: Verify Deployment

Test your deployment by visiting:
- Main site: `https://your-vercel-url.vercel.app`
- API health check: `https://your-vercel-url.vercel.app/api/meta/campaigns`
- Should return either campaign data or an error about missing token (both are OK)

## Step 7: Configure Webhooks

Now that you have a public URL, you can configure:

### For Glideapps Webhook

1. Go to your Glideapps project
2. Settings → Webhooks
3. Add webhook URL: `https://your-vercel-url.vercel.app/api/webhooks/glide`
4. Set Secret to match `GLIDE_WEBHOOK_SECRET` in Vercel env vars
5. Test the webhook

### For Meta Integration

1. The campaigns page will now fetch real data when `META_ACCESS_TOKEN` is configured
2. Update your Meta token and redeploy if needed

## Troubleshooting

### Build Fails
- Check build logs in Vercel dashboard
- Ensure all TypeScript errors are resolved
- Check that `.env.example` has all required variables

### Database Connection Issues
- Verify `DATABASE_URL` is correct and publicly accessible
- Check PostgreSQL connection limits
- Add your Vercel IP to database whitelist if needed

### Environment Variables Not Loading
- Ensure variables are set in Vercel, not just `.env.local`
- Redeploy after changing environment variables
- Check variable names match exactly (case-sensitive)

## Next Steps

After successful deployment:

1. **Test Glideapps webhook** with real price requests
2. **Configure Meta token** properly and test campaigns sync
3. **Set up monitoring** in Vercel dashboard
4. **Enable auto-redeployment** from GitHub pushes

## Automatic Redeployments

By default, Vercel redeployes automatically when you push to main branch. To disable:
- Project Settings → Git → Uncheck "Deploy on push"

## Custom Domain (Optional)

To add a custom domain like `kokpit.dimexoi.fr`:
1. Go to Project Settings → Domains
2. Add your domain
3. Update DNS records as instructed by Vercel
