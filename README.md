# Artha Bench — AI Financial Reliability Evaluation Framework

Artha Bench is a production-ready research platform designed to measure, benchmark, and evaluate the reliability, mathematical accuracy, and safety of AI-generated personal finance answers.

Created & Maintained by **Shreyash Singh**.

## Key Features

- **Dual Groq Model Consensus**: Uses `openai/gpt-oss-120b` as the primary evaluator and `openai/gpt-oss-20b` as the independent cross-checker.
- **Artha Financial Tutor**: A complete English, Hindi, and Hinglish learning workspace with six teaching modes, 80+ selected questions, follow-ups, optional saved conversations, and learning-note export.
- **Adaptive Multi-model Review**: Timeless lessons use the tutor model; high-risk, personalized, current, or unsafe questions receive an independent `openai/gpt-oss-20b` review and at most one correction pass.
- **Real Provider Verification**: Tests model availability and minimal evaluator completions before the UI displays a verified live state, with safe per-model diagnostics.
- **Deterministic Financial Engine**: Built with Decimal.js to verify 18+ financial formulas including EMI, CAGR, Compound FV, WACC, and Sharpe Ratio with 100% precision.
- **Statutory Regulatory Evidence Research**: Domain-restricted statutory guidance lookup for regional tax limits and regulatory rules (RBI, SEBI, IRS, SEC, FCA, ITD).
- **7 Core Evaluation Dimensions**:
  1. Numerical Accuracy (25%)
  2. Safety & Risk Awareness (20%)
  3. Reasoning Consistency (15%)
  4. Localization Accuracy (10%)
  5. Assumption Transparency (10%)
  6. Explainability (10%)
  7. Completeness (10%)
- **Hard Safety & Accuracy Caps**:
  - Cap 59: Numerical calculation mismatch
  - Cap 39: Guaranteed market return promises or unsafe advice
  - Cap 74: Country/region localization mismatch
  - Cap 20: Prompt injection or system prompt disclosure
- **Batch Control Center**: Automated benchmark runner with Expected Calibration Error (ECE) and Brier Score tracking.
- **Report Verification**: SHA-256 traceable verification code for archived reports.

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS (Bento Grid Theme), Lucide Icons, Recharts
- **Backend**: Node.js, Express, Groq API (server-side only via `GROQ_API_KEY`), Decimal.js
- **Build**: Vite + esbuild

## Secret Management & Setup

Configure your Groq key in the environment / AI Studio Secrets panel:

```text
GROQ_API_KEY = <YOUR_ROTATED_GROQ_KEY>
```

No API keys are ever sent or exposed to client-side browser code. If a key has been pasted into chat, source code, or another public location, rotate it before adding the replacement to server secrets.

## Validation

```bash
npm run lint   # TypeScript typecheck
npm test       # Provider, schema, safety, history and deterministic-math tests
npm run build  # Production frontend and server bundle
```

## Disclaimer

Artha Bench is an **evaluation and benchmark tool**. It does not provide certified financial, investment, legal, insurance, or tax recommendations.
