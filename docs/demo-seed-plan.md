# Demo Seed & Reset Plan

## Overview

Two backend functions provide one-command seed and reset for demo/staging data.

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Candidate | `candidate@demo.jobswipe.pl` | `demo1234` |
| Employer | `employer@demo.jobswipe.pl` | `demo1234` |

## Seeded Data

| Entity | Count | Details |
|--------|-------|---------|
| Auth users | 2 | Candidate + employer with confirmed emails |
| Profiles | 2 | Role-aware, with avatars |
| Candidates | 1 | Full profile: skills, experience, salary range |
| Jobs | 5 | Varied roles, locations, salaries, tags |
| Applications | 2 | Candidate applied to 2 jobs (applied + screening) |
| Messages | 3 | Conversation thread on first application |
| Saved jobs | 1 | Candidate saved one job |
| Swipe events | 4 | Right, right, save, left |
| Notifications | 2 | Status change + new message |

## How to Run

### Seed (create demo data)

```bash
curl -X POST \
  "${SUPABASE_URL}/functions/v1/seed-demo-data" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json"
```

### Reset (delete all demo data)

```bash
curl -X POST \
  "${SUPABASE_URL}/functions/v1/reset-demo-data" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json"
```

### Full cycle (reset then seed)

```bash
curl -X POST "${SUPABASE_URL}/functions/v1/reset-demo-data" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}"

curl -X POST "${SUPABASE_URL}/functions/v1/seed-demo-data" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}"
```

## Deterministic IDs

All demo entities use fixed UUIDs (e.g., `aaaaaaaa-...` for users, `bbbbbbbb-...` for jobs) so seed is idempotent — running it twice won't duplicate data.

## E2E Test Integration

Set these env vars for Playwright:

```
E2E_CANDIDATE_EMAIL=candidate@demo.jobswipe.pl
E2E_CANDIDATE_PASSWORD=demo1234
E2E_EMPLOYER_EMAIL=employer@demo.jobswipe.pl
E2E_EMPLOYER_PASSWORD=demo1234
```

## Known Gaps

- **Notifications INSERT**: The `notifications` table has no INSERT RLS policy. The seed function uses the service role key which bypasses RLS, so this works. A future migration should add a system-level insert policy if notifications need to be created from application code.
- **CV upload**: No demo CV file is seeded into the `cvs` storage bucket. This can be added later.
- **Employer-created jobs in UI**: The employer dashboard may expect jobs created through the UI flow. Demo jobs are seeded directly into the `jobs` table with the employer's user ID.
