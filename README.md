<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# PartnerCheck - JV Alignment Tool

A "No-BS" tool for Real Estate Syndicators to align expectations and expose conflicts before signing a Joint Venture.

View your app in AI Studio: https://ai.studio/apps/drive/1lit2ig_72NkUgHeNGzbCaIVFQw_e2mjj

## Deployment Readiness Status

| Category | Status | Notes |
|----------|--------|-------|
| **Build** | ✅ Ready | Vite build passes successfully |
| **TypeScript** | ✅ Ready | No type errors |
| **Dependencies** | ✅ Ready | 0 vulnerabilities |
| **Entry Point** | ✅ Fixed | Script tag added to index.html |
| **Environment Variables** | ⚠️ Required | `GEMINI_API_KEY` must be configured |
| **Tests** | ⚠️ Not configured | Consider adding tests before production |
| **Linting** | ⚠️ Not configured | Consider adding ESLint |
| **CI/CD** | ⚠️ Not configured | Consider adding GitHub Actions |

### Quick Verdict
**The app is ready for basic deployment**, but requires:
1. A valid `GEMINI_API_KEY` for the AI analysis features to work
2. Consider adding tests and CI/CD for production use

## Run Locally

**Prerequisites:** Node.js (v18+)

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env.local` file and set your Gemini API key:
   ```bash
   GEMINI_API_KEY=your_api_key_here
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

## Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Deploy

### Static Hosting (Vercel, Netlify, GitHub Pages)

1. Build the app: `npm run build`
2. Deploy the `dist/` directory to your hosting provider
3. Set the `GEMINI_API_KEY` environment variable in your hosting provider's settings

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Google Gemini API key for AI-powered alignment analysis |

## Features

- **Sponsor X-Ray**: Create a brutally honest operational profile
- **JV Pre-Nup**: Compare answers with a partner and detect conflicts in ethics, money, and control
- **AI-Powered Analysis**: Uses Google Gemini to analyze alignment between partners
