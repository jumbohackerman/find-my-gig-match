# RLS & Authorization Plan

## 1. Role model

### Recommended approach

Use a **separate `user_roles` table** instead of a mutable `profiles.role` column.

```sql
create type public.app_role as enum ('admin', 'moderator', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
```

The existing `profiles.role` (`candidate` | `employer`) describes **account type**, not authorization level. Keep it as a read-only classification set during signup, but **never use it alone for access control**.

Authorization hierarchy:

| Level | Source | Purpose |
|---|---|---|
| Account type | `profiles.role` | candidate vs employer UI routing |
| App role | `user_roles.role` | admin, moderator, user — platform-wide |
| Company membership | `company_members.role` | owner, admin, recruiter, viewer — scoped to company |

### Security-definer helper

All RLS policies use helper functions to avoid recursive lookups:

```sql
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.is_company_member(_user_id uuid, _company_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.company_members where user_id = _user_id and company_id = _company_id)
$$;

create or replace function public.company_role(_user_id uuid, _company_id uuid)
returns text language sql stable security definer set search_path = public as $$
  select role from public.company_members where user_id = _user_id and company_id = _company_id limit 1
$$;
```

---

## 2. Entity permissions

### 2.1 profiles

| Actor | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| Own user | ✅ own row | ✅ own row (trigger) | ✅ own row | ❌ |
| Employer (applied) | ✅ name, avatar only* | ❌ | ❌ | ❌ |
| Admin | ✅ all | ❌ | ✅ all | ❌ |

*Employer access to candidate profiles is through a **view or function** that returns only `full_name` and `avatar` for candidates who applied to that employer's jobs. Never expose the full profiles table.

```sql
-- Own profile
create policy "Own profile" on profiles for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Admin read
create policy "Admin read profiles" on profiles for select
  using (public.has_role(auth.uid(), 'admin'));
```

### 2.2 candidates

| Actor | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| Own user | ✅ own row | ✅ (auto via trigger) | ✅ own row | ❌ |
| Employer (applied) | ✅ candidates who applied to their jobs | ❌ | ❌ | ❌ |
| Employer (talent pool) | ❌ (future: opt-in visibility) | ❌ | ❌ | ❌ |
| Admin | ✅ all | ❌ | ✅ all | ❌ |

```sql
-- Own candidate profile
create policy "Own candidate" on candidates for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Employer sees applicants only
create policy "Employer sees applicants" on candidates for select
  using (
    user_id in (
      select a.candidate_id from applications a
      join jobs j on a.job_id = j.id
      where j.employer_id = auth.uid()
    )
  );
```

**Future talent-pool visibility**: Add a `candidates.visible_in_search boolean default false` column. Employers can only see candidates in search if `visible_in_search = true`. This is opt-in by the candidate.

### 2.3 jobs

| Actor | SELECT | UPDATE | INSERT | DELETE |
|---|---|---|---|---|
| Any authenticated | ✅ active jobs | ❌ | ❌ | ❌ |
| Employer (owner) | ✅ own jobs (any status) | ✅ own | ✅ | ✅ |
| Company member | ✅ company jobs | ✅ if admin/recruiter | ✅ if admin/recruiter | ✅ if owner/admin |
| Admin | ✅ all | ✅ all | ✅ | ✅ |

```sql
-- Public active jobs
create policy "View active jobs" on jobs for select
  using (status = 'active' or employer_id = auth.uid());

-- Company-scoped write (future)
create policy "Company members manage jobs" on jobs for all
  using (
    public.is_company_member(auth.uid(), company_id)
    and public.company_role(auth.uid(), company_id) in ('owner', 'admin', 'recruiter')
  )
  with check (
    public.is_company_member(auth.uid(), company_id)
    and public.company_role(auth.uid(), company_id) in ('owner', 'admin', 'recruiter')
  );
```

### 2.4 applications

| Actor | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| Candidate (own) | ✅ own | ✅ (apply) | ❌ | ✅ (withdraw) |
| Employer (job owner) | ✅ apps to their jobs | ❌ | ✅ status changes | ❌ |
| Company member | ✅ apps to company jobs | ❌ | ✅ if recruiter+ | ❌ |
| Admin | ✅ all | ❌ | ✅ all | ❌ |

**Visibility rule**: A candidate sees only their own applications. An employer sees only applications to jobs they own (or their company owns). No cross-employer visibility.

```sql
-- Candidate own
create policy "Candidate own apps" on applications for select
  using (candidate_id = auth.uid());

create policy "Candidate apply" on applications for insert
  with check (candidate_id = auth.uid());

create policy "Candidate withdraw" on applications for delete
  using (candidate_id = auth.uid());

-- Employer sees/updates apps to their jobs
create policy "Employer view apps" on applications for select
  using (job_id in (select id from jobs where employer_id = auth.uid()));

create policy "Employer update status" on applications for update
  using (job_id in (select id from jobs where employer_id = auth.uid()))
  with check (job_id in (select id from jobs where employer_id = auth.uid()));
```

### 2.5 application_events (future)

Immutable audit log of status changes.

| Actor | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| Candidate (own app) | ✅ | ❌ (system only) | ❌ | ❌ |
| Employer (job owner) | ✅ | ✅ (trigger preferred) | ❌ | ❌ |
| Admin | ✅ all | ✅ | ❌ | ❌ |

### 2.6 messages

| Actor | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| Participant | ✅ messages in own applications | ✅ (sender_id = self) | ❌ | ❌ |
| Admin | ✅ all | ❌ | ❌ | ❌ |

**Participant** = candidate who owns the application OR employer who owns the job.

```sql
create policy "Read messages" on messages for select
  using (application_id in (
    select id from applications where candidate_id = auth.uid()
    union
    select a.id from applications a join jobs j on a.job_id = j.id where j.employer_id = auth.uid()
  ));

create policy "Send messages" on messages for insert
  with check (
    sender_id = auth.uid()
    and application_id in (
      select id from applications where candidate_id = auth.uid()
      union
      select a.id from applications a join jobs j on a.job_id = j.id where j.employer_id = auth.uid()
    )
  );
```

### 2.7 notifications

| Actor | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| Own user | ✅ own | ❌ (system only) | ✅ mark read | ✅ dismiss |
| System/triggers | — | ✅ via security definer | — | — |

### 2.8 saved_jobs / swipe_events (future)

Private to the candidate. No employer access.

```sql
create policy "Own saved jobs" on saved_jobs for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
```

---

## 3. Company-scoped access

When `companies` and `company_members` are introduced:

```
companies
  id, name, logo, ...

company_members
  id, company_id (FK), user_id (FK), role enum('owner','admin','recruiter','viewer')
```

**Jobs gain a `company_id` column.** Policies check membership:

- `viewer`: read jobs + applications
- `recruiter`: read + manage applications, post jobs
- `admin`: all recruiter powers + manage members
- `owner`: all admin powers + delete company

This replaces the current `employer_id = auth.uid()` pattern with `is_company_member(auth.uid(), company_id)`.

**Migration path**: Add `company_id` to jobs as nullable. Existing single-employer jobs keep `employer_id` as fallback. New policies use `OR` logic:

```sql
using (
  employer_id = auth.uid()
  or public.is_company_member(auth.uid(), company_id)
)
```

---

## 4. CV / Storage access

Bucket: `cvs` (private)

| Actor | Download | Upload | Delete |
|---|---|---|---|
| Candidate (owner) | ✅ own files | ✅ own path | ✅ own path |
| Employer (applied) | ✅ if candidate applied to their job | ❌ | ❌ |
| Admin | ✅ all | ❌ | ❌ |

Storage path convention: `cvs/{user_id}/{filename}.pdf`

```sql
-- Storage policies
create policy "Upload own CV" on storage.objects for insert
  with check (bucket_id = 'cvs' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Read own CV" on storage.objects for select
  using (bucket_id = 'cvs' and (storage.foldername(name))[1] = auth.uid()::text);

-- Employer access to applicant CVs (via function)
create policy "Employer read applicant CV" on storage.objects for select
  using (
    bucket_id = 'cvs'
    and exists (
      select 1 from applications a
      join jobs j on a.job_id = j.id
      where j.employer_id = auth.uid()
        and a.candidate_id::text = (storage.foldername(name))[1]
    )
  );
```

---

## 5. Admin / Moderator access

| Role | Scope |
|---|---|
| `admin` | Full read on all tables. Write on profiles, candidates, jobs, applications. Manage user_roles. |
| `moderator` | Read all. Update job status (e.g. flag/hide). Cannot manage roles. |

All admin policies use `public.has_role(auth.uid(), 'admin')`. Never check admin via `profiles.role` or client-side storage.

---

## 6. Route guard ↔ Backend alignment

| Frontend route | Required auth | Backend enforcement |
|---|---|---|
| `/` (job feed) | Authenticated | `jobs` SELECT: active only |
| `/employer` | Authenticated + `profiles.role = 'employer'` | `jobs` INSERT/UPDATE: `employer_id = auth.uid()` |
| `/profiles` (talent pool) | Authenticated + employer | `candidates` SELECT: applied-only (current) |
| `/my-profile` | Authenticated | `candidates` + `profiles`: own row |
| `/auth` | Public | — |

**Principle**: Route guards are UX conveniences. **All security is enforced by RLS.** A candidate navigating to `/employer` manually gains nothing because INSERT/UPDATE policies reject non-employer writes.

---

## 7. Current vs future state

### Currently implemented (needs fixing)

| Table | Issue | Fix |
|---|---|---|
| `applications` | RLS policies use `RESTRICTIVE` — should be `PERMISSIVE` with proper conditions | Convert to permissive or use role-based OR conditions |
| `profiles` | No employer-to-candidate read policy | Add scoped read for employers (applied candidates only) |
| `candidates` | Employer access subquery may be slow | Add index on `applications(candidate_id)` + `jobs(employer_id)` |

### Future additions

| Table | Key policy pattern |
|---|---|
| `user_roles` | Only admins can manage. Users can read own roles. |
| `company_members` | Company owners/admins manage. Members read own company. |
| `application_events` | Immutable. Insert via trigger. Read by participants. |
| `notifications` | Own user read/update/delete. System insert via trigger. |
| `saved_jobs` | Own user only. |
| `swipe_events` | Own user only. |
| `candidate_resumes` | Same as CV storage rules. |
| `audit_logs` | Admin read only. System insert via trigger. |

---

## 8. Access matrix summary

R = read, W = write, D = delete

| Entity | Candidate (own) | Candidate (other) | Employer (applied) | Employer (other) | Company member | Admin |
|---|---|---|---|---|---|---|
| profiles | RW | — | R (name+avatar) | — | — | RW |
| candidates | RW | — | R | — | R (company jobs) | RW |
| jobs | R (active) | R (active) | RW (own) | R (active) | RW (company) | RW |
| applications | RWD (own) | — | RW (their jobs) | — | RW (company jobs) | RW |
| messages | RW (participant) | — | RW (participant) | — | R (company) | R |
| notifications | RWD (own) | — | RWD (own) | — | — | R |
| cvs (storage) | RWD (own) | — | R (applied) | — | R (company) | R |
| saved_jobs | RWD | — | — | — | — | R |
| user_roles | R (own) | — | R (own) | — | — | RW |
| company_members | R (own co) | — | R (own co) | — | RW (admin+) | RW |
| audit_logs | — | — | — | — | — | R |
