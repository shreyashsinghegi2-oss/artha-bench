# Artha Bench Deployment Guide

## Vercel Production Deployment
1. Import the `artha-bench` GitHub repository into Vercel.
2. Keep the detected framework as **Vite** and the project root as the repository root.
3. Add a newly rotated `GROQ_API_KEY` under **Project Settings → Environment Variables** for Production, Preview, and Development.
4. Deploy the `main` branch.
5. Open **AI Connections** and click **Test Groq Connection**. Live status appears only after the model-list and evaluator checks pass.

The API key must remain a server-side Vercel secret. Never put it in source code or prefix it with `VITE_`.

Optional model overrides are `GROQ_TUTOR_MODEL`, `GROQ_PRIMARY_MODEL`, `GROQ_SECONDARY_MODEL`, and `GROQ_SEARCH_MODEL`.

## Local Development & Build
```bash
npm run dev     # Start server on http://localhost:3000
npm run build   # Build frontend static assets & server.cjs bundle
npm start       # Run production server
npm run verify  # Typecheck, tests and production build
```

## Health Verification
After deployment, call `POST /api/providers/groq/verify` or visit **AI Connections** in the app to run the "Test Groq Connection" test.
