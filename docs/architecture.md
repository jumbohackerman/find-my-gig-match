# JobSwipe Architecture

## Overview

The app follows a **repository/adapter pattern** to cleanly separate UI from data sources. All business-data access goes through the provider registry — no page, component, or hook imports the Supabase client directly (except auth bootstrap).

## Layer diagram

```
┌──────────────────────────────────┐
│         Pages / Components       │  React UI — uses hooks only
├──────────────────────────────────┤
│         Custom Hooks             │  useJobs(), useJobFeed(), useEmployerDashboard(), etc.
├──────────────────────────────────┤
│     Provider Registry            │  getProvider("jobs"), getProvider("applications"), etc.
├────────────────┬─────────────────┤
│  Repositories  │    Services     │  Interfaces in src/repositories/ & src/services/
├────────────────┼─────────────────┤
│  Supabase Repos│   Real Svc      │  src/repositories/supabase/, src/services/supabaseStorage.ts
│  Mock Repos    │   No-op Svc     │  src/repositories/mock/, src/services/noop.ts
└────────────────┴─────────────────┘
│         Domain Models            │  src/domain/models.ts
└──────────────────────────────────┘
```

## Provider Registry Wiring (current)

### ✅ Supabase (live)
| Provider Key | Implementation | File |
|-------------|---------------|------|
| `jobs` | `supabaseJobRepository` | `src/repositories/supabase/jobs.ts` |
| `candidates` | `supabaseCandidateRepository` | `src/repositories/supabase/candidates.ts` |
| `applications` | `supabaseApplicationRepository` | `src/repositories/supabase/applications.ts` |
| `profiles` | `supabaseProfileRepository` | `src/repositories/supabase/profiles.ts` |
| `storage` | `supabaseStorageService` | `src/services/supabaseStorage.ts` |

### 🟡 Mock (pending migration)
| Provider Key | Implementation |
|-------------|---------------|
| `messages` | `mockMessageRepository` |
| `notifications` | `mockNotificationRepository` |
| `savedJobs` | `mockSavedJobRepository` |
| `swipeEvents` | `mockSwipeEventRepository` |
| `preferences` | `mockPreferencesRepository` |

### 🟡 Noop (pending integration)
| Provider Key | Future Service |
|-------------|---------------|
| `analytics` | PostHog / GA4 |
| `errorTracking` | Sentry |
| `email` | Resend (via edge function) |
| `ai` | Lovable AI |

## Files allowed to import Supabase client directly

Only these files may import `@/integrations/supabase/client`:

1. **Auth layer**: `useAuth.tsx`, `Auth.tsx`, `ResetPassword.tsx`
2. **Repository implementations**: `src/repositories/supabase/*.ts`
3. **Service implementations**: `src/services/supabaseStorage.ts`

All other files access data exclusively through `getProvider()`.

## Key directories

| Path | Purpose |
|---|---|
| `src/domain/models.ts` | All TypeScript interfaces — provider-agnostic |
| `src/domain/scoring/` | Match scoring engine (stateless, backend-agnostic) |
| `src/repositories/interfaces.ts` | Repository contracts (data access) |
| `src/repositories/supabase/` | Supabase implementations (jobs, applications, candidates, profiles) |
| `src/repositories/mock/` | Mock implementations using `src/data/` static files |
| `src/services/interfaces.ts` | External service contracts (analytics, email, AI, storage, error tracking) |
| `src/services/noop.ts` | Console-log/no-op implementations for dev |
| `src/providers/registry.ts` | Single place to swap mock ↔ real implementations |
| `src/data/` | Static demo data — ONLY imported by mock repos |
| `docs/` | Architecture and integration docs |

## Domain models

All entities defined in `src/domain/models.ts`:

- **Job** — job posting with optional structured `SalaryRange`
- **Candidate** — canonical candidate profile
- **Application** / **ApplicationWithJob** / **EnrichedEmployerApplication** — application variants
- **Message** — chat message in application context
- **UserProfile** — auth-adjacent profile data
- **Notification** — in-app notification
- **MatchResult** / **ScoreBreakdown** — scoring output

## Services

External integrations have interfaces in `src/services/interfaces.ts`:

- `AnalyticsService` — GA4 / PostHog
- `ErrorTrackingService` — Sentry
- `EmailService` — Resend
- `AIService` — CV parsing, match explanation, shortlisting
- `StorageService` — file uploads (Supabase Storage)

## Switching providers

To swap any provider, change one line in `src/providers/registry.ts`. No page or component code changes needed.
