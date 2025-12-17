# PartnerCheck Setup Guide

This guide will walk you through setting up PartnerCheck from scratch.

## Prerequisites

Before you begin, make sure you have:
- Node.js 18+ installed
- A Supabase account ([sign up here](https://supabase.com))
- A Google Gemini API key ([get one here](https://ai.google.dev/))
- A Stripe account (optional for now)

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up Supabase

### 2.1 Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization
4. Enter project name: `partnercheck`
5. Create a strong database password (save it!)
6. Choose a region close to your users
7. Click "Create new project"

### 2.2 Get Your API Credentials

1. In your Supabase project dashboard, click "Settings" (gear icon)
2. Click "API" in the sidebar
3. Copy your:
   - Project URL (looks like: `https://xxxxx.supabase.co`)
   - Anon/Public key (starts with `eyJ...`)

### 2.3 Run Database Migrations

1. In Supabase dashboard, click "SQL Editor"
2. Click "New Query"
3. Copy the entire contents of `src/supabase/migrations/001_initial_schema.sql`
4. Paste into the SQL editor
5. Click "Run" or press Ctrl/Cmd + Enter
6. You should see "Success. No rows returned"

### 2.4 Verify Tables Were Created

1. Click "Table Editor" in sidebar
2. You should see these tables:
   - `profiles`
   - `xray_profiles`
   - `prenup_analyses`
   - `usage_tracking`
   - `shared_links`

## Step 3: Configure Google OAuth (Optional)

If you want to enable "Sign in with Google":

1. In Supabase dashboard, go to Authentication → Providers
2. Find "Google" and click to expand
3. Enable the provider
4. Follow instructions to create Google OAuth credentials:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select existing
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URIs:
     - `https://your-project-id.supabase.co/auth/v1/callback`
5. Copy Client ID and Client Secret to Supabase
6. Save

## Step 4: Set Up Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` and fill in your values:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...your-anon-key

# Application URL
VITE_APP_URL=http://localhost:5173

# Gemini AI API Key
VITE_GEMINI_API_KEY=your-gemini-api-key
```

### How to Get Gemini API Key

1. Go to [Google AI Studio](https://ai.google.dev/)
2. Sign in with your Google account
3. Click "Get API Key"
4. Click "Create API key in new project" or select existing project
5. Copy the API key

## Step 5: Run the Application

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

## Step 6: Test the Application

### 6.1 Create an Account

1. Click "Start Free Trial" on the landing page
2. Fill in your name, email, and password
3. Check your email for verification link
4. Click the verification link

### 6.2 Create an X-Ray Profile

1. After signing in, click "Create X-Ray"
2. Fill in the sponsor information
3. Answer the questions
4. Submit
5. Check that it saved by going to Dashboard

### 6.3 Create a Pre-Nup Analysis

1. Click "Start Alignment"
2. Enter both partners' names
3. Fill in answers for both partners
4. Click "Analyze"
5. View the AI-generated alignment analysis

## Troubleshooting

### "Failed to fetch" or "Network error"

Check that:
- Your Supabase URL and anon key are correct in `.env.local`
- You restarted the dev server after adding environment variables
- Your Supabase project is active (not paused)

### "Row Level Security Policy Violation"

This means the RLS policies weren't created properly:
- Go back to SQL Editor in Supabase
- Run the migration file again
- Make sure all policies were created successfully

### Gemini API not working

Check that:
- Your API key is valid and not expired
- You have the Gemini API enabled in Google Cloud Console
- Your API key has the correct permissions

### Can't sign in with Google

Make sure:
- Google OAuth is enabled in Supabase
- Your redirect URLs are configured correctly
- You're using HTTPS in production (Google OAuth doesn't work on HTTP)

## Next Steps

### For Development

- Set up Stripe for payments (see STRIPE_SETUP.md - coming soon)
- Configure email templates in Supabase
- Set up custom domain

### For Production

- Deploy to Vercel/Netlify
- Set production environment variables
- Configure custom domain
- Set up monitoring (Sentry, LogRocket, etc.)
- Enable Supabase production mode

## Support

If you run into issues:
1. Check the [Supabase documentation](https://supabase.com/docs)
2. Check the [Gemini API documentation](https://ai.google.dev/docs)
3. Open an issue on GitHub
4. Email support@partnercheck.com

## Security Checklist

Before going to production:

- [ ] Changed default Supabase database password
- [ ] Enabled RLS on all tables
- [ ] Tested RLS policies work correctly
- [ ] Removed any debug/test API keys
- [ ] Enabled email verification
- [ ] Set up rate limiting
- [ ] Configured CORS properly
- [ ] Set up backups
- [ ] Enabled SSL/HTTPS
- [ ] Reviewed Supabase security settings

## Updating

To update to the latest version:

```bash
git pull
npm install
npm run build
```

Check CHANGELOG.md for any breaking changes or required migrations.
