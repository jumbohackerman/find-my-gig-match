# Candidate Flows

## Overview

All candidate-side flows are **fully routed through the provider registry**. No hook or page imports the Supabase client directly. Business logic lives in dedicated hooks; page components are thin UI shells.

## Flow architecture

```
Index.tsx (UI only)
  ├── useJobFeed()         → browse, swipe, apply, reset
  ├── useOnboarding()      → onboarding state + completion
  ├── useSavedJobs()       → saved jobs CRUD
  ├── useNotifications()   → notification list + mark-read
  └── useCandidateApplications() → application list + realtime

MyProfile.tsx (UI only)
  └── getProvider("candidates")  → candidate CRUD
  └── getProvider("profiles")    → profile updates
  └── getProvider("storage")     → CV upload
```

## Flows

### 1. Browse Jobs
| Step | Hook | Provider Call |
|---|---|---|
| Load all jobs | `useJobs()` | `getProvider("jobs").list()` |
| Apply client filters | `useJobFeed` (in-memory) | — |
| Calculate match scores | `useJobFeed` → `calculateMatch()` | — |
| Track swiped IDs | `useJobFeed` | `getProvider("swipeEvents").listSwipedJobIds()` |

### 2. Apply to Job (swipe right)
| Step | Provider Call |
|---|---|
| Record swipe | `getProvider("swipeEvents").record(userId, jobId, "right")` |
| Create application | `getProvider("applications").apply(job, candidateId)` |
| Refetch applications | `useCandidateApplications().refetch()` |

The `apply()` method in the Supabase repo calls the `apply_to_job` RPC for atomic job upsert + application creation.

### 3. My Applications
| Step | Provider Call |
|---|---|
| List applications | `getProvider("applications").listForCandidate(userId)` |
| Realtime updates | `getProvider("applications").subscribeForCandidate(userId, callback)` |

### 4. Edit Profile (MyProfile.tsx)
| Step | Provider Call |
|---|---|
| Load candidate | `getProvider("candidates").getByUserId(userId)` |
| Save candidate | `getProvider("candidates").upsert(userId, data)` |
| Update profile | `getProvider("profiles").update(userId, data)` |
| Upload CV | `getProvider("storage").upload(bucket, path, file)` |

### 5. Save / Skip Jobs
| Step | Provider Call |
|---|---|
| Save job | `getProvider("savedJobs").save(userId, jobId)` |
| Skip job | `getProvider("swipeEvents").record(userId, jobId, "left")` |

## Provider mapping

| Provider Key | Current Implementation | DB Table |
|---|---|---|
| `jobs` | `supabaseJobRepository` | `jobs` ✅ |
| `applications` | `supabaseApplicationRepository` | `applications` ✅ |
| `candidates` | `supabaseCandidateRepository` | `candidates` ✅ |
| `profiles` | `supabaseProfileRepository` | `profiles` ✅ |
| `storage` | `supabaseStorageService` | `cvs` bucket ✅ |
| `savedJobs` | `mockSavedJobRepository` | 🟡 No table yet |
| `swipeEvents` | `mockSwipeEventRepository` | 🟡 No table yet |
| `notifications` | `mockNotificationRepository` | 🟡 No table yet |
| `preferences` | `mockPreferencesRepository` | 🟡 localStorage |
