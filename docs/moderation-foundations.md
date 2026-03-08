# Moderation Foundations

## Database Schema

### `reports` table
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| reporter_id | uuid | Who reported |
| target_type | text | `'job'` or `'profile'` |
| target_id | text | ID of reported entity |
| reason | text | User-selected reason |
| status | text | `pending` → `reviewed` / `dismissed` / `actioned` |
| created_at | timestamptz | — |
| reviewed_at | timestamptz | Nullable |
| reviewer_notes | text | Nullable, for future admin use |

**RLS:** Users can INSERT own reports and SELECT own reports. Admin access via service role.

### `audit_log` table
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| actor_id | uuid | Who performed action |
| action | text | e.g. `hide_job`, `unhide_job` |
| target_type | text | e.g. `job`, `profile` |
| target_id | text | — |
| metadata | jsonb | Extra context |
| created_at | timestamptz | — |

**RLS:** Users can view/insert own entries. Full access via service role for admin views.

### Database Functions
- `hide_job(_job_id uuid)` — Sets job status to `'hidden'`, logs to audit. Employer-only (ownership check).
- `unhide_job(_job_id uuid)` — Sets job status to `'active'`, logs to audit. Employer-only.

## UI Components

### `ReportButton` (`src/components/ReportButton.tsx`)
- Reusable component accepting `targetType`, `targetId`, `targetLabel`
- Shows flag icon, opens modal with reason selection
- Reasons: fake content, inappropriate, spam, contact info in description, other
- Inserts into `reports` table

### Integration Points
- **Job detail modal**: Report button for jobs
- **Candidate profile modal**: Report button for profiles
- **Employer dashboard**: Hide/unhide toggle per job

## Service Layer

### `src/lib/moderation.ts`
- `logAudit(action, targetType, targetId, metadata)` — generic audit logger
- `hideJob(jobId)` / `unhideJob(jobId)` — RPC wrappers

## What's NOT Built Yet
- [ ] Admin dashboard to review reports (needs admin role + RLS policies)
- [ ] Automated report thresholds (e.g., auto-hide after N reports)
- [ ] Email notifications to admins on new reports
- [ ] Bulk moderation actions
- [ ] Report status management UI
- [ ] User suspension/ban system

## Extending Later
1. Add `admin` role via `user_roles` table
2. Add RLS policies for admin SELECT/UPDATE on `reports` and `audit_log`
3. Build `/admin/reports` route with RoleGate
4. Wire report count badges into admin navbar
