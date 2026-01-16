<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# PartnerCheck - SaaS Platform for Real Estate Syndicators

**Stop Partnering Blind. Start Partnering Smart.**

PartnerCheck is a production-ready SaaS application that helps real estate syndicators perform due diligence on potential partners through:

- **Sponsor X-Ray**: Create brutally honest operational profiles
- **JV Pre-Nup**: AI-powered alignment analysis to detect conflicts before signing

## Features

### Core Features
- ✅ Supabase authentication (email/password, Google OAuth, magic links)
- ✅ Multi-tier subscription system (Free, Pro, Enterprise)
- ✅ Usage tracking and limits enforcement
- ✅ AI-powered alignment analysis (Gemini)
- ✅ Shareable links with expiration dates
- ✅ Professional landing page
- ✅ Legal pages (Terms, Privacy)

### Subscription Tiers

**Free Tier:**
- 1 X-Ray profile per month
- 1 Pre-Nup analysis per month
- 7-day shareable links
- Watermarked results

**Pro Tier ($49/month):**
- Unlimited X-Rays and Pre-Nups
- PDF exports
- 30-day shareable links
- Advanced analytics
- Priority support

**Enterprise Tier ($199/month):**
- Everything in Pro
- White-label branding
- Team collaboration (5 users)
- Custom questionnaires
- API access
- Unlimited share links

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Routing**: React Router v6
- **Authentication**: Supabase Auth
- **Database**: Supabase (PostgreSQL)
- **Payments**: Stripe (integration ready)
- **AI**: Google Gemini
- **UI**: Tailwind CSS (custom)
- **State**: React Hooks + Zustand (ready)
- **Forms**: Zod validation (ready)

## Prerequisites

- Node.js 18+ 
- Supabase account
- Gemini API key
- Stripe account (for payments)

## Setup Instructions

### 1. Clone and Install

```bash
git clone <repository-url>
cd Partner-Check
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings → API to get your project URL and anon key
3. Go to SQL Editor and run the migration file:
   ```
   src/supabase/migrations/001_initial_schema.sql
   ```

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Stripe Configuration (optional for now)
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# Application URL
VITE_APP_URL=http://localhost:5173

# Gemini AI API Key
VITE_GEMINI_API_KEY=your_gemini_api_key
```

### 4. Enable Google OAuth (Optional)

1. In Supabase Dashboard → Authentication → Providers
2. Enable Google provider
3. Add authorized redirect URLs:
   - `http://localhost:5173/auth/callback`
   - Your production URL + `/auth/callback`

### 5. Run the Application

```bash
# Development mode
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── components/          # React components
│   ├── auth/           # Authentication components
│   ├── layout/         # Layout components
│   ├── payment/        # Payment components (ready)
│   ├── shared/         # Shared utilities
│   └── ui/             # UI components
├── contexts/           # React contexts
│   └── AuthContext.tsx # Authentication context
├── hooks/              # Custom React hooks
│   ├── useAuth.ts      # Auth hook
│   ├── useSubscription.ts # Subscription management
│   └── useUsage.ts     # Usage tracking
├── lib/                # Core libraries
│   ├── supabase.ts     # Supabase client
│   ├── database.ts     # Database operations
│   └── utils.ts        # Utility functions
├── pages/              # Page components
│   ├── Landing.tsx     # Landing page
│   ├── Pricing.tsx     # Pricing page
│   └── Legal/          # Legal pages
├── services/           # External services
│   └── geminiService.ts # AI service
├── supabase/
│   └── migrations/     # Database migrations
├── App.tsx             # Main app component
└── AppRouter.tsx       # Route configuration
```

## Database Schema

The application uses the following main tables:

- `profiles` - User accounts and subscription info
- `xray_profiles` - Sponsor X-Ray data
- `prenup_analyses` - JV Pre-Nup results
- `usage_tracking` - Monthly usage tracking
- `shared_links` - Shareable link management

See `src/supabase/migrations/001_initial_schema.sql` for complete schema.

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Other Platforms

The app is a standard Vite React application and can be deployed to:
- Netlify
- Railway
- Render
- Any static hosting with SPA support

## Autopilot YouTube Factory

The project includes an autonomous video factory (`AUTOPILOT_YT.py`) for creating and publishing partner due diligence content to YouTube with governance guardrails.

### Features
- **Deterministic video generation** using ffmpeg
- **Job state machine** with explicit transitions
- **Outbox pattern** for reliable task execution
- **Single-use capability tokens** for secure publish operations
- **Daily publish caps** and content similarity checks
- **Policy linting** for content safety
- **MCP-like tool server** via FastAPI

### Quick Start

```bash
# Install Python dependencies
pip install -r requirements.txt

# Initialize database
python AUTOPILOT_YT.py init-db

# Set up YouTube OAuth (one-time)
python AUTOPILOT_YT.py oauth

# Create a video job
python AUTOPILOT_YT.py create-job --topic "Partner risk checklist for SaaS founders" --privacy unlisted

# Run the worker to process jobs
python AUTOPILOT_YT.py worker

# Or start the API server
python AUTOPILOT_YT.py serve --host 0.0.0.0 --port 8787
```

### Configuration

Add these to your `.env` file (see `.env.local.example`):

```bash
AUTOPILOT_DB=./autopilot.db
AUTOPILOT_STORAGE=./storage
AUTOPILOT_APP_KEY=your-secure-32-byte-key
AUTOPILOT_MAX_PUBLISH_PER_DAY=1
AUTOPILOT_MAX_RENDERS_PER_JOB=2
```

### Prerequisites
- Python 3.9+
- ffmpeg installed on system PATH
- Google Cloud project with YouTube Data API enabled
- OAuth 2.0 client credentials (`client_secrets.json`)

## Development Roadmap

### Completed ✅
- Authentication system
- Database integration
- Usage tracking
- Subscription tiers
- Landing page
- Legal pages
- Autopilot YouTube Factory

### In Progress 🚧
- Stripe payment integration
- PDF export functionality
- Email notifications
- Advanced analytics dashboard

### Planned 📋
- Team collaboration features
- Admin dashboard
- White-label customization
- API access
- Mobile app

## Environment Variables Reference

### Frontend (Vite/React)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `VITE_STRIPE_PUBLISHABLE_KEY` | No | Stripe publishable key |
| `VITE_APP_URL` | Yes | Application URL |
| `VITE_GEMINI_API_KEY` | Yes | Google Gemini API key |

### Autopilot YouTube Factory (Python)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `AUTOPILOT_DB` | No | `./autopilot.db` | SQLite database path |
| `AUTOPILOT_STORAGE` | No | `./storage` | Asset storage directory |
| `AUTOPILOT_BASE_URL` | No | `http://127.0.0.1:8787` | Server base URL |
| `AUTOPILOT_APP_KEY` | Yes | - | HMAC signing key (32+ bytes) |
| `AUTOPILOT_MAX_PUBLISH_PER_DAY` | No | `1` | Daily publish limit |
| `AUTOPILOT_MAX_RENDERS_PER_JOB` | No | `2` | Max renders per job |
| `AUTOPILOT_YT_CATEGORY_ID` | No | `22` | YouTube category ID |
| `AUTOPILOT_OAUTH_CLIENT_SECRETS` | Yes | `./client_secrets.json` | OAuth client secrets path |
| `AUTOPILOT_OAUTH_TOKEN_FILE` | No | `./oauth_token.json` | OAuth token storage path |

## Security Features

- Row Level Security (RLS) policies in Supabase
- Protected routes requiring authentication
- Usage limits enforcement
- Secure session management
- CSRF protection via Supabase

## Support

For issues or questions:
- Email: support@partnercheck.com
- GitHub Issues: [Create an issue]

## License

Proprietary - All rights reserved

---

Built for Syndicators, by Syndicators. 🏢
