# Security Pre-Launch Checklist

**Date:** 2026-03-08

---

## Current Committed Secrets Analysis

### `.env` (auto-managed by Lovable Cloud)

| Variable | Value Type | Risk | Action |
|----------|-----------|------|--------|
| `VITE_SUPABASE_URL` | Public project URL | ✅ Safe | Designed to be public — used by client SDK |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Anon/publishable JWT | ✅ Safe | This is the **anon key**, not the service role key. It's designed to be embedded in client-side code. Security is enforced by RLS policies, not key secrecy. |
| `VITE_SUPABASE_PROJECT_ID` | Project identifier | ✅ Safe | Public metadata, not a secret |

**Verdict: No rotation needed.** All values in `.env` are publishable by design.

### `.env` tracking in Git

The `.env` file is **auto-managed by Lovable Cloud** and cannot be removed from tracking. This is acceptable because:
1. It contains only the publishable anon key (equivalent to a public API key)
2. RLS policies enforce all data access rules server-side
3. The service role key is stored in Supabase secrets (never in `.env`)

---

## What Is Safe to Expose Publicly

| Item | Reason |
|------|--------|
| `VITE_SUPABASE_URL` | Public API endpoint — required for client SDK |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Anon key — RLS policies are the real access control |
| `VITE_SUPABASE_PROJECT_ID` | Identifier only, no access implications |
| All `VITE_*` feature toggles | Boolean flags, no secrets |
| `VITE_POSTHOG_HOST` default | Public SaaS endpoint |
| `VITE_EMAIL_FROM` | Public sender address |

---

## What Must NEVER Be Committed

| Secret | Where It Lives | Purpose |
|--------|---------------|---------|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase secrets (edge functions only) | Bypasses RLS — full DB access |
| `SUPABASE_DB_URL` | Supabase secrets | Direct Postgres connection string |
| `RESEND_API_KEY` | Supabase secrets (future) | Transactional email sending |
| `SENTRY_AUTH_TOKEN` | CI secrets (future) | Source map upload |
| `POSTHOG_API_KEY` | If using server-side PostHog | Server-side analytics |
| Any `*_SECRET_*` or `*_PRIVATE_*` key | Supabase secrets / CI secrets | Various integrations |

**Rule:** Only `VITE_*` prefixed variables go in `.env`. Backend secrets go in Supabase secrets (accessible from edge functions via `Deno.env.get()`).

---

## Current Security Posture

### ✅ Secure

1. **RLS policies** on all 5 tables (candidates, jobs, applications, messages, profiles) — restrictive mode
2. **Security definer functions** (`get_user_role`, `apply_to_job`) prevent RLS recursion attacks
3. **Role-aware route guards** via `useRequireRole` + `<RoleGate>` in App.tsx
4. **No service role key in client code** — only anon key exposed
5. **Auth enforcement** — all routes require authentication
6. **Navigation guards** — role-conditional UI prevents accidental cross-role access
7. **Provider abstraction** — no direct Supabase queries in UI layer (except auth bootstrap)

### ⚠️ Risks to Address Before Launch

| Risk | Severity | Description | Remediation |
|------|----------|-------------|-------------|
| **Missing Storage RLS** | HIGH | `cvs` bucket has no RLS policies — uploaded CVs may be accessible to anyone with the URL | Add bucket-level RLS: owner can upload/read own files, employers can read CVs of applicants |
| **Profiles RLS too restrictive** | MEDIUM | Employers cannot read candidate profiles directly (only via joined application queries). The `profiles` table SELECT policy is `user_id = auth.uid()` only | Add employer SELECT policy for profiles of candidates who applied to their jobs |
| **No rate limiting on auth** | MEDIUM | Sign-up and login endpoints have no rate limiting beyond Supabase defaults | Configure Supabase auth rate limits or use the `rate-limiter` edge function |
| **Email not verified by default** | LOW | Email auto-confirm may be disabled but should be explicitly verified | Confirm `enable_confirmations = true` in auth config |
| **No CORS policy for edge functions** | LOW | Edge function stubs have permissive CORS (`*`) | Restrict to production domain before launch |

---

## Pre-Connection Remediation Steps

### Before connecting Resend
1. Add `RESEND_API_KEY` to Supabase secrets
2. Update `send-email` edge function CORS to allow only production domain
3. Verify sender domain in Resend dashboard
4. Test with a non-production email first

### Before connecting PostHog / GA4
1. Set `VITE_POSTHOG_KEY` (this is a publishable key — safe in client code)
2. Set `VITE_ANALYTICS_ENABLED=true`
3. Create PostHog analytics provider in `src/services/posthog.ts`
4. Register in provider registry
5. No secrets needed — PostHog client key is designed to be public

### Before connecting Sentry
1. Set `VITE_SENTRY_DSN` (this is a publishable DSN — safe in client code)
2. Set `VITE_ERROR_TRACKING_ENABLED=true`
3. Create Sentry provider in `src/services/sentry.ts`
4. For source maps: add `SENTRY_AUTH_TOKEN` to GitHub Actions secrets (never in `.env`)

### Before enabling AI pipeline
1. `LOVABLE_API_KEY` is already auto-provisioned in Supabase secrets
2. Update `process-cv` edge function with actual Lovable AI calls
3. Test with sample CV uploads
4. No additional secrets needed for Lovable AI supported models

### Before adding Storage RLS (CRITICAL)
1. Add policies to `cvs` bucket:
   - Candidates can upload to `cvs/{user_id}/*`
   - Candidates can read own files: `cvs/{user_id}/*`
   - Employers can read CVs of candidates who applied to their jobs
2. This must be done before any production CV uploads

---

## Environment Variable Reference

All expected variables are documented in `.env.example`. The config layer (`src/config/index.ts`) is the single access point — no component reads `import.meta.env` directly.

| Group | Variables | Source |
|-------|-----------|--------|
| Supabase | `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID` | Auto-provisioned by Lovable Cloud |
| App | `VITE_APP_ENV`, `VITE_APP_BASE_URL`, `VITE_DEMO_MODE` | Developer sets in `.env` |
| Analytics | `VITE_ANALYTICS_ENABLED`, `VITE_POSTHOG_KEY`, `VITE_POSTHOG_HOST` | Developer sets; key is publishable |
| Error Tracking | `VITE_ERROR_TRACKING_ENABLED`, `VITE_SENTRY_DSN` | Developer sets; DSN is publishable |
| AI | `VITE_AI_ENABLED`, `VITE_AI_DEFAULT_MODEL` | Developer sets; no secret needed |
| Storage | `VITE_STORAGE_CV_BUCKET`, `VITE_STORAGE_MAX_UPLOAD_SIZE` | Developer sets; config only |
| Email | `VITE_EMAIL_ENABLED`, `VITE_EMAIL_FROM` | Developer sets; toggles UI only |
