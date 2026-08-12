# Artha Bench Security Architecture

## 1. Secret Protection & API Key Isolation
- `GROQ_API_KEY` is read strictly on the Node.js Express server (`process.env.GROQ_API_KEY`).
- No public environment variable (`VITE_`) or browser input exists for API keys.
- Secret values are masked in server logs and health responses.
- Provider errors expose only a safe state, model role, latency, and request ID.

## 2. Prompt Injection Neutralization
- User input, submitted answers, and retrieved web evidence are treated as untrusted data.
- Prompt injection attempts (e.g. "ignore previous instructions") trigger safety checks without dumping system prompts or environment secrets.

## 3. Rate Limiting & Input Sanitization
- Privacy-preserving hashed client identifiers protect API endpoints against excessive requests.
- Tutor messages are limited to 6,000 characters and only the newest 12 user/assistant history turns reach Groq.
- Client-supplied system/developer roles are stripped, duplicate in-flight tutor requests are deduplicated, and secret-like values are rejected.

## 4. Financial Education Boundary
- The tutor does not choose securities, funds, cryptocurrencies, banks, loans, insurers, policies, or tax products.
- Current claims require allow-listed official sources; a failed source lookup stays explicitly unverified.
- Numerical teaching uses the Decimal.js deterministic engine as the displayed source of truth.
