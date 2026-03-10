# Persistence Coverage Report

**Date:** 2026-03-08

---

## Summary

All 9 repository interfaces are now backed by Supabase. Zero mock repositories remain in the registry.

## Database Tables

| Table | Status | RLS | Indexes | Constraints | Realtime |
|-------|--------|-----|---------|-------------|----------|
| `jobs` | ✅ Live | ✅ 4 policies | PK | — | — |
| `applications` | ✅ Live | ✅ 5 policies | PK | FK → jobs | — |
| `candidates` | ✅ Live | ✅ 2 policies | PK | — | — |
| `profiles` | ✅ Live | ✅ 3 policies | PK | — | — |
| `messages` | ✅ Live | ✅ 2 policies | PK | FK → applications | TODO |
| `saved_jobs` | ✅ Live | ✅ 3 policies | PK, idx_user_id | FK → jobs, UNIQUE(user_id, job_id) | — |
| `swipe_events` | ✅ Live | ✅ 3 policies | PK, idx_user_id | FK → jobs, UNIQUE(user_id, job_id), enum direction | — |
| `notifications` | ✅ Live | ✅ 3 policies (SELECT/UPDATE/DELETE) | PK, idx_user_id, idx_user_unread | enum type | ✅ |
| `user_preferences` | ✅ Live | ✅ 4 policies | PK, idx_user_id | UNIQUE(user_id, key) | — |

## Provider Registry Mapping

| Provider Key | Implementation | File |
|---|---|---|
| `jobs` | Supabase | `repositories/supabase/jobs.ts` |
| `candidates` | Supabase | `repositories/supabase/candidates.ts` |
| `applications` | Supabase | `repositories/supabase/applications.ts` |
| `profiles` | Supabase | `repositories/supabase/profiles.ts` |
| `messages` | Supabase | `repositories/supabase/messages.ts` |
| `storage` | Supabase | `services/supabaseStorage.ts` |
| `savedJobs` | Supabase | `repositories/supabase/savedJobs.ts` |
| `swipeEvents` | Supabase | `repositories/supabase/swipeEvents.ts` |
| `notifications` | Supabase | `repositories/supabase/notifications.ts` |
| `preferences` | Supabase | `repositories/supabase/preferences.ts` |

## Mock Files (retained but unused)

Mock implementations remain in `src/repositories/mock/` for potential offline/demo fallback but are **not wired** in the registry.

## Remaining Blockers

1. **Notifications INSERT** — No client INSERT policy. Notifications must be created server-side (edge functions, triggers, or service-role calls). TODO: create trigger on `applications.status` change.
2. **Messages realtime** — `messages` table not yet added to `supabase_realtime` publication.
3. **Storage RLS** — `cvs` bucket needs RLS policies.
4. **pgvector** — Extension not yet enabled for semantic search.

## Migration History

| Migration | Tables | Key Features |
|---|---|---|
| #1 (initial) | jobs, applications, candidates, profiles, messages | Core schema + RLS + RPC `apply_to_job` |
| #2 | saved_jobs, swipe_events | FK → jobs, UNIQUE constraints, `swipe_direction` enum |
| #3 | notifications, user_preferences | `notification_type` enum, partial index on unread, realtime enabled for notifications |
