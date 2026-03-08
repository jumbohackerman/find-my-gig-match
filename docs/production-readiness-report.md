# Production Readiness Report

**Date:** 2026-03-08 (final reconciliation)
**Target Stack:** Lovable → GitHub → Cloudflare Pages + Supabase + Edge Functions + Resend + PostHog/GA4 + Sentry

---

## ✅ Supabase Bypass Elimination — COMPLETE

All 4 previously documented bypass files have been migrated to the provider/repository layer:

| File | Previous Issue | Resolution |
|------|---------------|------------|
| `src/hooks/useJobFeed.ts` | Direct `supabase.rpc("apply_to_job")` | Now calls `getProvider("applications").apply(job, candidateId)` |
| `src/hooks/useEmployerDashboard.ts` | 4 direct Supabase queries for enrichment | Now calls `getProvider("jobs").listForEmployer()` + `getProvider("applications").listForEmployer()` |
| `src/hooks/useApplications.ts` | Direct queries + realtime subscriptions | Now uses `getProvider("applications")` for all operations including `.subscribeForCandidate()` and `.subscribeForEmployer()` |
| `src/pages/MyProfile.tsx` | Direct candidate/profile/storage queries | Now uses `getProvider("candidates")`, `getProvider("profiles")`, `getProvider("storage")` |

---

## Files That Import Supabase Client Directly (final list)

### ✅ Intentionally Allowed — Auth Layer
| File | Reason |
|------|--------|
| `src/hooks/useAuth.tsx` | Auth bootstrap: `supabase.auth.onAuthStateChange()`, `getSession()`, profile fetch for role |
| `src/pages/Auth.tsx` | `supabase.auth.signUp()`, `signInWithPassword()`, `resetPasswordForEmail()` |
| `src/pages/ResetPassword.tsx` | `supabase.auth.onAuthStateChange()`, `updateUser()` |

### ✅ Intentionally Allowed — Repository/Service Implementations
| File | Reason |
|------|--------|
| `src/repositories/supabase/jobs.ts` | Supabase job repository — IS the abstraction boundary |
| `src/repositories/supabase/applications.ts` | Supabase application repository with `apply_to_job` RPC |
| `src/repositories/supabase/candidates.ts` | Supabase candidate repository |
| `src/repositories/supabase/profiles.ts` | Supabase profile repository |
| `src/services/supabaseStorage.ts` | Supabase storage service for CV uploads |

**No other files import from `@/integrations/supabase/client`.**

---

## ✅ What Is Production-Ready

### Architecture & Abstractions
- [x] **Domain models** — `src/domain/models.ts` is the single source of truth
- [x] **Provider registry** — `src/providers/registry.ts` wired to Supabase for all core flows
- [x] **Repository interfaces** — `src/repositories/interfaces.ts` covers all 9 data contracts
- [x] **Service interfaces** — `src/services/interfaces.ts` defines analytics, email, AI, storage, error tracking
- [x] **Supabase implementations** — jobs, applications, candidates, profiles, storage all wired

### Provider Registry Wiring (current)

| Provider Key | Implementation | Status |
|-------------|---------------|--------|
| `jobs` | `supabaseJobRepository` | ✅ Live |
| `candidates` | `supabaseCandidateRepository` | ✅ Live |
| `applications` | `supabaseApplicationRepository` | ✅ Live (includes `apply_to_job` RPC) |
| `profiles` | `supabaseProfileRepository` | ✅ Live |
| `storage` | `supabaseStorageService` | ✅ Live |
| `messages` | `mockMessageRepository` | 🟡 Mock (DB table exists, repo not yet written) |
| `notifications` | `mockNotificationRepository` | 🟡 Mock (no DB table) |
| `savedJobs` | `mockSavedJobRepository` | 🟡 Mock (no DB table) |
| `swipeEvents` | `mockSwipeEventRepository` | 🟡 Mock (no DB table) |
| `preferences` | `mockPreferencesRepository` | 🟡 Mock (localStorage) |
| `analytics` | `noopAnalytics` | 🟡 Noop (wire PostHog) |
| `errorTracking` | `noopErrorTracking` | 🟡 Noop (wire Sentry) |
| `email` | `noopEmail` | 🟡 Noop (wire Resend edge function) |
| `ai` | `noopAI` | 🟡 Noop (wire Lovable AI) |

### Security & Access Control
- [x] Role-aware route guards via `useRequireRole` + `<RoleGate>`
- [x] Route-level enforcement in App.tsx
- [x] Navigation guards in Index.tsx (role-conditional nav links)
- [x] RLS policies on all 5 tables
- [x] Security definer functions: `get_user_role()`, `apply_to_job()`

### CI/CD
- [x] GitHub Actions CI: install → lint → type-check → test → build

### Edge Functions (stubs)
- [x] `send-email` — Resend integration point
- [x] `process-cv` — AI CV parsing pipeline
- [x] `validate-status-transition` — Application status state machine
- [x] `rate-limiter` — In-memory rate limiting

---

## 🟡 Still Mock-Only (no blockers, just not yet migrated)

| Feature | Missing |
|---------|---------|
| Messages | Write `supabase/messages.ts` repo |
| Saved Jobs | Create `saved_jobs` table + repo |
| Swipe Events | Create `swipe_events` table + repo |
| Notifications | Create `notifications` table + repo |
| Preferences | Create `user_preferences` table + repo |

---

## Missing Infrastructure

- [ ] Cloudflare Pages deployment config
- [ ] Supabase Storage RLS policies for `cvs` bucket
- [ ] Verify `handle_new_user` trigger is attached to `auth.users`
- [ ] pgvector extension not yet enabled

---

## Repository Contracts (current state)

All contracts defined in `src/repositories/interfaces.ts`:

| Interface | Key Methods |
|-----------|-------------|
| `JobRepository` | `list()`, `listForEmployer()`, `getById()`, `create()`, `delete()` |
| `CandidateRepository` | `list()`, `getByUserId()`, `upsert()` |
| `ApplicationRepository` | `listForCandidate()`, `listForEmployer()`, `apply()`, `updateStatus()`, `subscribeForCandidate()`, `subscribeForEmployer()` |
| `MessageRepository` | `listByApplication()`, `send()`, `subscribe()` |
| `NotificationRepository` | `listForUser()`, `markRead()`, `markAllRead()` |
| `ProfileRepository` | `getByUserId()`, `update()` |
| `SavedJobRepository` | `listIds()`, `save()`, `remove()`, `isSaved()` |
| `SwipeEventRepository` | `record()`, `listSwipedJobIds()`, `clear()` |
| `PreferencesRepository` | `get()`, `set()` |
