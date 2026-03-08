# Production Readiness Report

**Date:** 2026-03-08 (all 9 repositories on Supabase)
**Target Stack:** Lovable → GitHub → Cloudflare Pages + Supabase + Edge Functions + Resend + PostHog/GA4 + Sentry

---

## Provider Registry — Current State

### ✅ Supabase (live)

| Provider | Repo File | Key Methods |
|----------|-----------|-------------|
| `jobs` | `supabase/jobs.ts` | `list`, `listForEmployer`, `getById`, `create`, `update`, `archive`, `delete` |
| `applications` | `supabase/applications.ts` | `listForCandidate`, `listForEmployer`, `apply` (RPC), `updateStatus`, `countByStatus`, `subscribeForCandidate`, `subscribeForEmployer` |
| `candidates` | `supabase/candidates.ts` | `list`, `getByUserId`, `upsert` |
| `profiles` | `supabase/profiles.ts` | `getByUserId`, `update` |
| `messages` | `supabase/messages.ts` | `listByApplication`, `send`, `subscribe` |
| `storage` | `supabaseStorage.ts` | `upload`, `getPublicUrl`, `delete` |
| `savedJobs` | `supabase/savedJobs.ts` | `listIds`, `save`, `remove`, `isSaved` |
| `swipeEvents` | `supabase/swipeEvents.ts` | `record`, `listSwipedJobIds`, `clear` |
| `notifications` | `supabase/notifications.ts` | `listForUser`, `markRead`, `markAllRead`, `countUnread`, `subscribe` |
| `preferences` | `supabase/preferences.ts` | `get`, `set`, `delete` |

### 🟡 Mock (none remaining)

All data repositories are now backed by Supabase.

### 🟡 Noop (pending external integration)

| Provider | Future Service |
|----------|---------------|
| `analytics` | PostHog / GA4 |
| `errorTracking` | Sentry |
| `email` | Resend |
| `ai` | Lovable AI |

---

## Repository Contract Coverage

All 9 repository interfaces are fully implemented on Supabase:

- **JobRepository**: list, listForEmployer, getById, create, update, archive, delete
- **ApplicationRepository**: apply (RPC), listForCandidate, listForEmployer, updateStatus (with source), countByStatus, subscribeForCandidate, subscribeForEmployer
- **MessageRepository**: listByApplication, send, subscribe (realtime)
- **CandidateRepository**: list (with filters), getByUserId, upsert
- **ProfileRepository**: getByUserId, update
- **SavedJobRepository**: listIds, save, remove, isSaved ✅
- **SwipeEventRepository**: record, listSwipedJobIds, clear ✅
- **NotificationRepository**: listForUser, markRead, markAllRead, countUnread, subscribe ✅
- **PreferencesRepository**: get, set, delete ✅

---

## Database Tables (9 total)

| Table | RLS | Realtime |
|-------|-----|----------|
| `jobs` | ✅ 4 policies | — |
| `applications` | ✅ 5 policies | — |
| `candidates` | ✅ 2 policies | — |
| `profiles` | ✅ 3 policies | — |
| `messages` | ✅ 2 policies | TODO |
| `saved_jobs` | ✅ 3 policies | — |
| `swipe_events` | ✅ 3 policies | — |
| `notifications` | ✅ 3 policies | ✅ |
| `user_preferences` | ✅ 4 policies | — |

---

## Files That Import Supabase Directly (all allowed)

| File | Reason |
|------|--------|
| `src/hooks/useAuth.tsx` | Auth bootstrap |
| `src/pages/Auth.tsx` | Sign-in/sign-up |
| `src/pages/ResetPassword.tsx` | Password reset |
| `src/repositories/supabase/*.ts` | ARE the abstraction boundary |
| `src/services/supabaseStorage.ts` | IS the storage service |

---

## Security

- RLS on all 9 tables
- Role-aware route guards in App.tsx
- Navigation guards in Index.tsx
- Storage bucket `cvs` needs RLS policies (documented in security-prelaunch.md)
- Notifications INSERT is server-only (no client INSERT policy)

---

## Missing Infrastructure

- [ ] Storage RLS for `cvs` bucket
- [ ] Cloudflare Pages config
- [ ] pgvector extension
- [ ] Candidate-side messaging UI
- [ ] Message read receipts (`read_at` column + UPDATE policy)
- [ ] Notification creation triggers (server-side on status change)
