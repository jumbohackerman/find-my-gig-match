# Employer-Side Flow Documentation

> All employer flows are routed through the provider registry. No hook or page imports the Supabase client directly.

## Architecture

```
Employer.tsx (UI shell)
  └── useEmployerDashboardData()    → getProvider("jobs") + getProvider("applications")
  └── useEmployerJobs()             → job CRUD via getProvider("jobs")
  └── useEmployerShortlist()        → shortlist logic via getProvider("applications")
  └── useUpdateApplicationStatus()  → status transitions via getProvider("applications")
  └── useEmployerMessages()         → chat via getProvider("messages")
```

## Flow → Provider Mapping

### 1. Dashboard Data Loading
| Step | Provider Call |
|---|---|
| Load employer's jobs | `getProvider("jobs").listForEmployer(employerId)` |
| Load enriched applications | `getProvider("applications").listForEmployer(employerId)` |
| Compute match scores | `calculateMatch()` in hook (business logic) |
| Realtime refresh | `getProvider("applications").subscribeForEmployer(employerId, callback)` |

The `listForEmployer()` method in the Supabase application repo handles the multi-table enrichment (applications + candidates + profiles) internally.

### 2. Create / Delete Job
| Step | Provider Call |
|---|---|
| Create job | `getProvider("jobs").create(formData)` |
| Delete job | `getProvider("jobs").delete(jobId)` |

### 3. Update Application Status
| Step | Provider Call |
|---|---|
| Advance status | `getProvider("applications").updateStatus(appId, newStatus)` |

**Pipeline**: applied → shortlisted → viewed → interview → {hired, not_selected, position_closed}

### 4. Shortlist Applicants
| Step | Provider Call |
|---|---|
| Manual pick | `getProvider("applications").updateStatus(id, "shortlisted")` |
| AI shortlist | Ranks by match score, batch-updates top N |

### 5. Message Candidates
| Step | Provider Call |
|---|---|
| Send message | `getProvider("messages").send(appId, employerId, content)` |
| Load history | `getProvider("messages").listByApplication(appId)` |

## Provider Wiring

| Provider Key | Implementation | Status |
|-------------|---------------|--------|
| `jobs` | `supabaseJobRepository` | ✅ Live |
| `applications` | `supabaseApplicationRepository` | ✅ Live |
| `candidates` | `supabaseCandidateRepository` | ✅ Live |
| `messages` | `mockMessageRepository` | 🟡 Mock (DB table exists) |

## Files

| File | Purpose |
|------|---------|
| `src/hooks/useEmployerDashboard.ts` | Data fetching + match scoring + realtime (via providers) |
| `src/hooks/useEmployerJobs.ts` | Job CRUD via providers |
| `src/hooks/useEmployerShortlist.ts` | Shortlist business logic via providers |
| `src/hooks/useApplications.ts` | Status transitions + candidate listing via providers |
| `src/hooks/useEmployerMessages.ts` | Chat state + message repo calls |
| `src/pages/Employer.tsx` | Thin UI shell — no business logic |
